/**
 * HTTP Server
 * 
 * REST API 엔드포인트
 * TODO: Express 서버 구현
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { createAdapter, MultiAdapter } from '../../adapters';
import { Telemetry, Command } from '../../types/core';
// import rpcRouter from '../rpc'; // TODO: RPC 라우터 구현 필요

/**
 * HTTP 서버 생성
 * 
 * TODO:
 * - [ ] 모든 엔드포인트 구현
 * - [ ] 미들웨어 설정
 * - [ ] 에러 핸들링
 */
export function createHttpServer() {
  const app = express();
  const server = createServer(app);
  
  // Transport Adapters 관리
  const adapters = new Map<string, MultiAdapter>();

  // 미들웨어
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      // 로컬 개발 환경 허용
      if (!origin || 
          origin.includes('localhost') || 
          origin.includes('127.0.0.1') ||
          /^https:\/\/[\w-]+\.smartfarm\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  // RPC API 라우트 (내부 API)
  // app.use('/rpc', rpcRouter); // TODO: RPC 라우터 구현 필요

  // Rate Limiting 미들웨어
  app.use(async (req, res, next) => {
    // Health check와 RPC는 레이트 리밋 제외
    if (req.path === '/health' || req.path.startsWith('/rpc')) {
      return next();
    }

    const { deviceLimiter, tenantLimiter } = await import('../../security/ratelimit.js');
    
    const deviceId = req.headers['x-device-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // 디바이스별 리밋
    if (deviceId && tenantId) {
      const key = `device:${tenantId}:${deviceId}`;
      const allowed = await deviceLimiter.consume(key);
      
      if (!allowed) {
        const remaining = await deviceLimiter.getRemaining(key);
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        return res.status(429).json({ 
          error: 'Too Many Requests',
          message: '디바이스 요청 한도 초과 (60 req/min)',
          retry_after: 60
        });
      }
    }
    
    // 테넌트별 리밋
    if (tenantId) {
      const key = `tenant:${tenantId}`;
      const allowed = await tenantLimiter.consume(key);
      
      if (!allowed) {
        return res.status(429).json({ 
          error: 'Too Many Requests',
          message: '테넌트 요청 한도 초과',
          retry_after: 60
        });
      }
    }
    
    next();
  });

  // 헬스 체크
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
    });
  });

  // 프로비저닝 엔드포인트
  app.post('/api/provisioning/claim', async (req, res) => {
    try {
      console.log('[API] Claim 요청:', req.body);
      
      const { tenant_id, farm_id, ttl, device_type, capabilities } = req.body;
      
      // 간단한 토큰 생성 (임시 구현)
      const token = `ST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + (ttl || 3600) * 1000);
      
      console.log('[API] Token 생성:', { token, expiresAt });
      
      res.json({
        setup_token: token,
        expires_at: expiresAt.toISOString(),
        qr_data: `http://localhost:3000/provision?token=${token}&tenant=${tenant_id}&farm=${farm_id || ''}`,
        device_type,
        capabilities: capabilities || []
      });
    } catch (error: any) {
      console.error('[API] Claim error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate token' });
    }
  });

  // 키 회전 엔드포인트
  app.post('/api/provisioning/rotate', async (req, res) => {
    try {
      const { device_id, current_key, reason } = req.body;
      
      if (!device_id || !current_key) {
        return res.status(400).json({ error: 'device_id and current_key required' });
      }
      
      // Provisioning 함수 호출
      const { rotateDeviceKey } = await import('../../provisioning/rotate.js');
      
      const rotation = await rotateDeviceKey({
        deviceId: device_id,
        currentKey: current_key,
        reason: reason || 'scheduled_rotation',
      });
      
      res.json({
        device_id: rotation.deviceId,
        new_device_key: rotation.newKey,
        grace_period: rotation.gracePeriod,
        expires_at: rotation.expiresAt.toISOString(),
        message: '✅ 디바이스 키가 회전되었습니다. Grace Period 동안 두 키 모두 유효합니다.'
      });
    } catch (error: any) {
      console.error('[API] Rotate error:', error);
      res.status(500).json({ error: error.message || 'Failed to rotate key' });
    }
  });

  app.post('/api/provisioning/bind', async (req, res) => {
    try {
      const setupToken = req.headers['x-setup-token'] as string;
      if (!setupToken) {
        return res.status(401).json({ error: 'Setup token required' });
      }
      
      const { device_id, device_type, capabilities } = req.body;
      
      // Provisioning 함수 호출
      const { bindDevice } = await import('../../provisioning/bind.js');
      
      const binding = await bindDevice({
        setupToken,
        deviceId: device_id,
        deviceType: device_type,
        capabilities: capabilities || [],
      });
      
      res.json({
        device_key: binding.deviceKey,
        tenant_id: binding.tenantId,
        farm_id: binding.farmId,
        server_url: process.env.BRIDGE_SERVER_URL || 'http://localhost:3000',
        message: '✅ 디바이스가 성공적으로 등록되었습니다!'
      });
    } catch (error: any) {
      console.error('[API] Bind error:', error);
      res.status(500).json({ error: error.message || 'Failed to bind device' });
    }
  });

  // 텔레메트리 엔드포인트
  app.post('/api/bridge/telemetry', async (req, res) => {
    try {
      const deviceIdStr = req.headers['x-device-id'] as string;
      const tenantId = req.headers['x-tenant-id'] as string;
      const signature = req.headers['x-sig'] as string;
      const timestamp = req.headers['x-ts'] as string;
      
      if (!deviceIdStr || !tenantId) {
        return res.status(401).json({ error: 'Device ID and Tenant ID required' });
      }

      // HMAC 서명 검증 (운영 모드)
      const devMode = process.env.NODE_ENV === 'development' && process.env.SIGNATURE_VERIFY_OFF === 'true';
      
      if (!devMode) {
        if (!signature || !timestamp) {
          return res.status(401).json({ error: 'Signature and timestamp required' });
        }

        // 디바이스 조회하여 device_key 가져오기
        const { getDeviceByDeviceId } = await import('../../db/index.js');
        const device = await getDeviceByDeviceId(tenantId, deviceIdStr);
        
        if (!device) {
          return res.status(404).json({ error: 'Device not found' });
        }

        // 서명 검증
        const { verifyRequest } = await import('../../security/signer.js');
        const body = JSON.stringify(req.body);
        const ts = parseInt(timestamp);
        
        const isValid = verifyRequest(device.device_key, body, ts, signature);
        
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
        
        console.log('[Telemetry] Signature verified for device:', deviceIdStr);
      }
      
      const { readings, timestamp: bodyTimestamp } = req.body;
      
      console.log('[Telemetry] Received from', deviceIdStr, ':', readings?.length, 'readings');
      
      // 디바이스 조회
      const { getDeviceByDeviceId, insertReadings, updateDeviceLastSeen } = await import('../../db/index.js');
      
      const device = await getDeviceByDeviceId(tenantId, deviceIdStr);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      // DB에 저장
      if (readings && readings.length > 0) {
        await insertReadings(tenantId, device.id, readings);
        
        // 마지막 접속 시간 업데이트
        await updateDeviceLastSeen(device.id);
        
        readings.forEach((reading: any) => {
          console.log(`  - ${reading.key}: ${reading.value} ${reading.unit}`);
        });
      }
      
      res.json({ 
        success: true,
        message: `${readings?.length || 0}개 센서 데이터 저장 완료`,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[API] Telemetry error:', error);
      res.status(500).json({ error: error.message || 'Failed to process telemetry' });
    }
  });

  // 명령 발행 (웹어드민 → 디바이스)
  app.post('/api/bridge/commands', async (req, res) => {
    try {
      const { device_id, type, payload } = req.body;
      
      if (!device_id || !type) {
        return res.status(400).json({ error: 'device_id and type are required' });
      }

      // WebSocket으로 명령 푸시
      const { pushCommandToDevice } = await import('../websocket/server.js');
      
      const commandId = `CMD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const command = {
        id: commandId,
        type,
        payload: payload || {},
      };

      const pushed = pushCommandToDevice(device_id, command);
      
      if (pushed) {
        res.json({ 
          success: true,
          command_id: commandId,
          status: 'pushed',
          message: '명령이 디바이스로 전송되었습니다.'
        });
      } else {
        res.status(503).json({ 
          error: 'Device not connected',
          message: '디바이스가 WebSocket에 연결되어 있지 않습니다.'
        });
      }
    } catch (error: any) {
      console.error('[API] Command error:', error);
      res.status(500).json({ error: error.message || 'Failed to push command' });
    }
  });

  // 명령 조회 (디바이스 → 서버)
  app.get('/api/bridge/commands/:deviceId', async (req, res) => {
    try {
      const { deviceId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string || 'default';
      
      // DB에서 대기 중인 명령 조회
      const { getDeviceByDeviceId, getPendingCommands } = await import('../../db/index.js');
      
      // 디바이스 조회
      const device = await getDeviceByDeviceId(tenantId, deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      // 대기 중인 명령 조회
      const commands = await getPendingCommands(device.id);
      
      res.json({ 
        commands: commands,
        count: commands.length,
        message: commands.length > 0 ? '대기 중인 명령이 있습니다.' : '대기 중인 명령이 없습니다.'
      });
    } catch (error: any) {
      console.error('[API] Commands error:', error);
      res.status(500).json({ error: error.message || 'Failed to get commands' });
    }
  });

  // 프로비저닝 상태 조회
  app.get('/api/provisioning/status/:setupToken', async (req, res) => {
    try {
      const { setupToken } = req.params;
      
      // DB에서 setup token으로 상태 조회
      const { getSetupTokenStatus } = await import('../../db/index.js');
      
      const status = await getSetupTokenStatus(setupToken);
      
      if (!status) {
        return res.status(404).json({ error: 'Setup token not found or expired' });
      }
      
      res.json({
        setup_token: setupToken,
        status: status.status,
        device_id: status.device_id,
        expires_at: status.expires_at,
        created_at: status.created_at,
        tenant_id: status.tenant_id,
        farm_id: status.farm_id
      });
    } catch (error: any) {
      console.error('[API] Status error:', error);
      res.status(500).json({ error: error.message || 'Failed to get status' });
    }
  });

  // 명령 ACK (디바이스 → 서버)
  app.post('/api/bridge/commands/:commandId/ack', async (req, res) => {
    const { commandId } = req.params;
    const { status, detail } = req.body;
    
    console.log('[Command ACK] Received:', commandId, status);
    
    // TODO: DB 업데이트 (iot_commands.status = 'acked', ack_at = NOW())
    
    res.json({ success: true, message: 'ACK received' });
  });

  // 404 핸들러
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // 에러 핸들러
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[HTTP] Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  // WebSocket 서버 설정
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    console.log('[WebSocket] Client connected:', pathname);
    
    if (pathname.startsWith('/monitor/')) {
      // 모니터링 연결: /monitor/:setup_token
      const setupToken = pathname.split('/monitor/')[1];
      console.log(`[WebSocket] Monitor connected: ${setupToken}`);
      
      // 모니터링 메시지 전송
      ws.send(JSON.stringify({
        type: 'log',
        level: 'info',
        message: '연결 모니터링 시작',
        timestamp: new Date().toISOString()
      }));
    } else if (pathname === '/test') {
      // 테스트 연결
      console.log('[WebSocket] Test connection');
      ws.send(JSON.stringify({
        type: 'test',
        message: 'WebSocket 연결 성공',
        timestamp: new Date().toISOString()
      }));
    }
    
    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
    });
  });

  return { app, server };
}

