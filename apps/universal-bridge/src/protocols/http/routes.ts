/**
 * HTTP Routes
 * 
 * REST API 라우트 핸들러
 */

import type { Request, Response } from 'express';
import { logger } from '../../utils/logger.js';
import { tokenServer } from '../../security/jwt.js';
import { getSupabase } from '../../db/client.js';
import { insertReadings } from '../../db/readings.js';
import { insertDevice, getDeviceByDeviceId, updateDeviceState } from '../../db/devices.js';
import { getPendingCommands, updateCommandStatus } from '../../db/commands.js';

/**
 * Provisioning - Claim
 * 
 * POST /api/provisioning/claim
 * 
 * Setup Token 발급
 */
export async function handleClaim(req: Request, res: Response) {
  try {
    console.log('[HTTP] Claim 요청:', req.body);
    
    const { tenant_id, farm_id, ttl, device_type, capabilities } = req.body;
    
    // 간단한 토큰 생성 (실제로는 더 안전한 방법 사용해야 함)
    const token = `setup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const device_key = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('[HTTP] Token 발급:', { token, device_key });
    
    res.json({
      token,
      device_key,
      expires_at: new Date(Date.now() + (ttl || 3600) * 1000).toISOString(),
      device_type,
      capabilities: capabilities || []
    });
  } catch (error) {
    console.error('[HTTP] Claim 오류:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Provisioning - Bind
 * 
 * POST /api/provisioning/bind
 * 
 * 디바이스 바인딩 처리
 */
export async function handleBind(req: Request, res: Response) {
  try {
    const { setup_token, device_id, device_type, capabilities, device_key } = req.body;
    const reqId = req.id || 'unknown';

    logger.info('Device bind request', {
      reqId,
      deviceId: device_id,
      deviceType: device_type,
      clientIp: req.ip
    });

    // Setup Token 검증
    let tokenPayload;
    try {
      tokenPayload = tokenServer.verifySetupToken(setup_token);
    } catch (error) {
      logger.warn('Invalid setup token', { reqId, error: error instanceof Error ? error.message : String(error) });
      return res.status(401).json({ error: 'Invalid setup token' });
    }

    // 디바이스 등록
    const deviceRecord = {
      device_id,
      tenant_id: tokenPayload.tenantId,
      farm_id: tokenPayload.farmId,
      device_type,
      capabilities: capabilities || [],
      device_key_hash: device_key ? require('crypto').createHash('sha256').update(device_key).digest('hex') : '',
      status: 'active'
    };

    const device = await insertDevice(deviceRecord);

    logger.info('Device bound successfully', {
      reqId,
      deviceId: device_id,
      tenantId: tokenPayload.tenantId,
      farmId: tokenPayload.farmId
    });

    // 디바이스 토큰 발급
    const deviceToken = tokenServer.generateDeviceToken(
      device_id,
      tokenPayload.tenantId,
      tokenPayload.farmId,
      device_type,
      capabilities
    );

    res.json({
      success: true,
      device_token: deviceToken,
      device_id,
      tenant_id: tokenPayload.tenantId,
      farm_id: tokenPayload.farmId,
      expires_in: 24 * 60 * 60 // 24시간
    });

  } catch (error: unknown) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), 'Device bind failed', {
      reqId: req.id,
      deviceId: req.body?.device_id,
      clientIp: req.ip
    });

    res.status(500).json({ 
      error: 'Internal Server Error',
      reqId: req.id
    });
  }
}

/**
 * Provisioning - Rotate
 * 
 * POST /api/provisioning/rotate
 * 
 * 디바이스 키 회전 처리
 */
export async function handleRotate(req: Request, res: Response) {
  try {
    const { device_id, current_key, new_key, reason } = req.body;
    const { tenant_id } = req.query as { tenant_id?: string };
    const reqId = req.id || 'unknown';

    logger.info('Key rotation request', {
      reqId,
      deviceId: device_id,
      tenantId: tenant_id,
      reason
    });

    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id query parameter required' });
    }

    // 디바이스 존재 확인
    const device = await getDeviceByDeviceId(tenant_id as string, device_id);
    if (!device) {
      logger.warn('Device not found for key rotation', {
        reqId,
        deviceId: device_id,
        tenantId: tenant_id
      });
      return res.status(404).json({ error: 'Device not found' });
    }

    // 현재 키 검증 (실제로는 더 안전한 방법 사용)
    const currentKeyHash = require('crypto').createHash('sha256').update(current_key).digest('hex');
    if (device.device_key_hash !== currentKeyHash) {
      logger.warn('Invalid current key for rotation', {
        reqId,
        deviceId: device_id,
        tenantId: tenant_id
      });
      return res.status(401).json({ error: 'Invalid current key' });
    }

    // 새 키 해시 생성
    const newKeyHash = require('crypto').createHash('sha256').update(new_key).digest('hex');

    // 디바이스 키 업데이트
    await updateDeviceState(device_id, tenant_id as string, {
      device_key_hash: newKeyHash,
      metadata: {
        ...device.metadata,
        key_rotation: {
          last_rotated: new Date().toISOString(),
          reason: reason || 'manual_rotation'
        }
      }
    });

    logger.info('Key rotation completed', {
      reqId,
      deviceId: device_id,
      tenantId: tenant_id,
      reason
    });

    res.json({
      success: true,
      device_id,
      rotated_at: new Date().toISOString(),
      reason,
      reqId
    });

  } catch (error: unknown) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), 'Key rotation failed', {
      reqId: req.id,
      deviceId: req.body?.device_id,
      clientIp: req.ip
    });

    res.status(500).json({ 
      error: 'Internal Server Error',
      reqId: req.id
    });
  }
}

/**
 * Telemetry
 * 
 * POST /api/bridge/telemetry
 * 
 * 텔레메트리 데이터 처리
 */
export async function handleTelemetry(req: Request, res: Response) {
  try {
    const { device_id, tenant_id, farm_id, metrics, timestamp } = req.body;
    const reqId = req.id || 'unknown';

    logger.debug('Telemetry received', {
      reqId,
      deviceId: device_id,
      tenantId: tenant_id,
      metricsCount: Object.keys(metrics || {}).length
    });

    // 디바이스 존재 확인
    const device = await getDeviceByDeviceId(tenant_id, device_id);
    if (!device) {
      logger.warn('Device not found for telemetry', {
        reqId,
        deviceId: device_id,
        tenantId: tenant_id
      });
      return res.status(404).json({ error: 'Device not found' });
    }

    // 텔레메트리 데이터 저장
    const readings = Object.entries(metrics || {}).map(([key, value]) => ({
      ts: timestamp || new Date().toISOString(),
      key,
      value: typeof value === 'number' ? value : parseFloat(String(value)) || 0,
      unit: '', // 기본값
      quality: 'good' as const
    }));

    if (readings.length > 0) {
      await insertReadings(tenant_id, device.id, readings);
    }

    // 디바이스 마지막 접속 시간 업데이트
    await updateDeviceState(device_id, tenant_id, {
      status: 'online'
    });

    logger.debug('Telemetry processed successfully', {
      reqId,
      deviceId: device_id,
      tenantId: tenant_id
    });

    res.json({
      success: true,
      received_at: new Date().toISOString(),
      reqId
    });

  } catch (error: unknown) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), 'Telemetry processing failed', {
      reqId: req.id,
      deviceId: req.body?.device_id,
      clientIp: req.ip
    });

    res.status(500).json({ 
      error: 'Internal Server Error',
      reqId: req.id
    });
  }
}

/**
 * Commands - Poll
 * 
 * GET /api/bridge/commands/:deviceId
 * 
 * 대기 중인 명령 조회
 */
export async function handleCommandPoll(req: Request, res: Response) {
  try {
    const { deviceId } = req.params;
    const { tenant_id } = req.query as { tenant_id?: string };
    const reqId = req.id || 'unknown';

    logger.debug('Command poll request', {
      reqId,
      deviceId,
      tenantId: tenant_id
    });

    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id query parameter required' });
    }

    // 대기 중인 명령 조회
    const commands = await getPendingCommands(deviceId);

    logger.debug('Commands retrieved', {
      reqId,
      deviceId,
      commandCount: commands.length
    });

    res.json({
      commands: commands.map(cmd => ({
        command_id: cmd.command_id,
        type: cmd.type,
        params: cmd.params,
        created_at: cmd.created_at
      }))
    });

  } catch (error: unknown) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), 'Command poll failed', {
      reqId: req.id,
      deviceId: req.params?.deviceId,
      clientIp: req.ip
    });

    res.status(500).json({ 
      error: 'Internal Server Error',
      reqId: req.id
    });
  }
}

/**
 * Commands - ACK
 * 
 * POST /api/bridge/commands/:commandId/ack
 * 
 * 명령 ACK 처리
 */
export async function handleCommandAck(req: Request, res: Response) {
  try {
    const { commandId } = req.params;
    const { status, result, error_message } = req.body;
    const reqId = req.id || 'unknown';

    logger.debug('Command ACK received', {
      reqId,
      commandId,
      status,
      hasResult: !!result,
      hasError: !!error_message
    });

    // 명령 상태 업데이트
    await updateCommandStatus(commandId, status, result || error_message || '');

    logger.debug('Command ACK processed', {
      reqId,
      commandId,
      status
    });

    res.json({
      success: true,
      command_id: commandId,
      processed_at: new Date().toISOString(),
      reqId
    });

  } catch (error: unknown) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), 'Command ACK processing failed', {
      reqId: req.id,
      commandId: req.params?.commandId,
      clientIp: req.ip
    });

    res.status(500).json({ 
      error: 'Internal Server Error',
      reqId: req.id
    });
  }
}

