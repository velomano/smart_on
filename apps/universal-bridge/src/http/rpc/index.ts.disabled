/**
 * Universal Bridge Internal RPC API
 * 
 * Web Admin에서 호출하는 내부 API 엔드포인트들
 */

import express from 'express';
import { Telemetry, Command, Device, TransportConfig, ApiResponse } from '@smart-on/core';
import { createAdapter, MultiAdapter } from '../../adapters';

const router = express.Router();

// 인증 미들웨어 (Bearer Token)
router.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = process.env.BRIDGE_API_TOKEN;
  
  if (!token) {
    return res.status(500).json({ 
      success: false, 
      error: 'Bridge API token not configured' 
    });
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Missing or invalid authorization header' 
    });
  }
  
  const providedToken = authHeader.substring(7);
  if (providedToken !== token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid API token' 
    });
  }
  
  next();
});

// 텔레메트리 발행
router.post('/publishTelemetry', async (req, res) => {
  try {
    const telemetry: Telemetry = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing x-tenant-id header'
      });
    }
    
    // TODO: Tenant별 Adapter 가져오기
    // const adapter = await getTenantAdapter(tenantId);
    // await adapter.publishTelemetry(telemetry);
    
    // 임시로 성공 응답
    res.json({
      success: true,
      message: 'Telemetry published',
      data: { device_id: telemetry.device_id, ts: telemetry.ts }
    });
    
  } catch (error: any) {
    console.error('[RPC] Publish telemetry error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to publish telemetry'
    });
  }
});

// 명령 전송
router.post('/sendCommand', async (req, res) => {
  try {
    const command: Command = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing x-tenant-id header'
      });
    }
    
    // TODO: Tenant별 Adapter 가져오기
    // const adapter = await getTenantAdapter(tenantId);
    // const ack = await adapter.sendCommand(command);
    
    // 임시로 성공 응답
    res.json({
      success: true,
      message: 'Command sent',
      data: {
        device_id: command.device_id,
        command_id: command.ts || new Date().toISOString(),
        status: 'ack'
      }
    });
    
  } catch (error: any) {
    console.error('[RPC] Send command error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send command'
    });
  }
});

// 디바이스 조회
router.get('/devices/:id', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing x-tenant-id header'
      });
    }
    
    // TODO: DB에서 디바이스 조회
    // const device = await getDevice(tenantId, deviceId);
    
    // 임시 응답
    res.json({
      success: true,
      data: {
        id: deviceId,
        device_id: deviceId,
        tenant_id: tenantId,
        device_type: 'esp32',
        transport: 'http',
        status: 'active',
        capabilities: ['temperature', 'humidity'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('[RPC] Get device error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get device'
    });
  }
});

// 디바이스 프로비저닝
router.post('/devices/:id/provision', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { setup_token, device_type, transport, capabilities } = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId || !setup_token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    // TODO: 프로비저닝 로직 구현
    // const device = await provisionDevice({
    //   deviceId,
    //   tenantId,
    //   setupToken: setup_token,
    //   deviceType: device_type,
    //   transport,
    //   capabilities
    // });
    
    // 임시 응답
    res.json({
      success: true,
      message: 'Device provisioned successfully',
      data: {
        id: deviceId,
        device_id: deviceId,
        tenant_id: tenantId,
        device_type: device_type || 'esp32',
        transport: transport || 'http',
        status: 'active',
        capabilities: capabilities || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('[RPC] Provision device error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to provision device'
    });
  }
});

// 활성 어댑터 나열
router.get('/adapters', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing x-tenant-id header'
      });
    }
    
    // TODO: Tenant별 활성 어댑터 조회
    // const adapters = await getTenantAdapters(tenantId);
    
    // 임시 응답
    res.json({
      success: true,
      data: [
        {
          name: 'http',
          status: 'active',
          config: { base_url: 'http://localhost:3001' }
        },
        {
          name: 'mqtt',
          status: 'active',
          config: { broker_url: 'mqtt://localhost:1883' }
        }
      ]
    });
    
  } catch (error: any) {
    console.error('[RPC] Get adapters error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get adapters'
    });
  }
});

// 어댑터 설정 업데이트
router.put('/adapters/:transport', async (req, res) => {
  try {
    const transport = req.params.transport;
    const config = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing x-tenant-id header'
      });
    }
    
    // TODO: 어댑터 설정 업데이트
    // await updateAdapterConfig(tenantId, transport, config);
    
    res.json({
      success: true,
      message: `Adapter ${transport} configuration updated`,
      data: { transport, config }
    });
    
  } catch (error: any) {
    console.error('[RPC] Update adapter error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update adapter'
    });
  }
});

export default router;
