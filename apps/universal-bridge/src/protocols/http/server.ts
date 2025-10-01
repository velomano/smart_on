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

  // TODO: 프로비저닝 엔드포인트
  // app.post('/api/provisioning/claim', ...);
  // app.post('/api/provisioning/bind', ...);
  // app.post('/api/provisioning/rotate', ...);

  // TODO: 텔레메트리 엔드포인트
  // app.post('/api/bridge/telemetry', ...);

  // TODO: 명령 엔드포인트
  // app.get('/api/bridge/commands/:deviceId', ...);
  // app.post('/api/bridge/commands/:commandId/ack', ...);

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

