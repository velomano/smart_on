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
      // TODO: 테넌트 도메인 화이트리스트 검증
      if (!origin || /^https:\/\/[\w-]+\.smartfarm\.app$/.test(origin)) {
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
      
      // 간단한 토큰 생성
      const token = `ST_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const expiresAt = new Date(Date.now() + (ttl || 600) * 1000);
      
      res.json({
        setup_token: token,
        expires_at: expiresAt.toISOString(),
        qr_data: JSON.stringify({
          server_url: 'http://localhost:3000',
          setup_token: token,
          tenant_id,
          farm_id,
          protocol: 'http'
        })
      });
    } catch (error) {
      console.error('[API] Claim error:', error);
      res.status(500).json({ error: 'Failed to generate token' });
    }
  });

  app.post('/api/provisioning/bind', async (req, res) => {
    try {
      const setupToken = req.headers['x-setup-token'] as string;
      const { device_id, device_type, capabilities } = req.body;
      
      // Device Key 발급
      const deviceKey = `DK_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      res.json({
        device_key: deviceKey,
        tenant_id: 'tenant-demo',
        farm_id: 'farm-demo',
        server_url: 'http://localhost:3000',
        message: '✅ 디바이스가 성공적으로 등록되었습니다!'
      });
    } catch (error) {
      console.error('[API] Bind error:', error);
      res.status(500).json({ error: 'Failed to bind device' });
    }
  });

  // 텔레메트리 엔드포인트
  app.post('/api/bridge/telemetry', async (req, res) => {
    try {
      const deviceId = req.headers['x-device-id'];
      const { readings, timestamp } = req.body;
      
      console.log('[Telemetry] Received from', deviceId, ':', readings?.length, 'readings');
      
      // 메모리에 임시 저장 (나중에 DB로 교체)
      readings?.forEach((reading: any) => {
        console.log(`  - ${reading.key}: ${reading.value} ${reading.unit}`);
      });
      
      res.json({ 
        success: true,
        message: `${readings?.length || 0}개 센서 데이터 저장 완료`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[API] Telemetry error:', error);
      res.status(500).json({ error: 'Failed to process telemetry' });
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

