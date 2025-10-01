/**
 * HTTP Server
 * 
 * REST API 엔드포인트
 * TODO: Express 서버 구현
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

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
      const { tenant_id, farm_id, ttl } = req.body;
      
      // Provisioning 함수 호출
      const { generateSetupToken, generateQRData } = await import('../../provisioning/claim.js');
      
      const setupToken = await generateSetupToken({
        tenantId: tenant_id,
        farmId: farm_id,
        ttl,
      });
      
      const qrData = generateQRData(setupToken);
      
      res.json({
        setup_token: setupToken.token,
        expires_at: setupToken.expiresAt.toISOString(),
        qr_data: qrData,
      });
    } catch (error: any) {
      console.error('[API] Claim error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate token' });
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
      
      if (!deviceIdStr || !tenantId) {
        return res.status(401).json({ error: 'Device ID and Tenant ID required' });
      }
      
      const { readings, timestamp } = req.body;
      
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

  // 명령 엔드포인트
  app.get('/api/bridge/commands/:deviceId', async (req, res) => {
    // 임시: 빈 명령 배열 반환
    res.json({ commands: [] });
  });

  app.post('/api/bridge/commands/:commandId/ack', async (req, res) => {
    const { commandId } = req.params;
    console.log('[Command ACK] Received:', commandId, req.body);
    res.json({ success: true });
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

  return app;
}

