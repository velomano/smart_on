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
import { createAdapter } from '../../adapters';
import { Telemetry, Command } from '../../types/core';
import { authenticateDevice } from '../../security/middleware.js';
import * as authRoutes from './routes/auth.js';
import * as mqttRoutes from './routes/mqtt.js';
import * as routes from './routes.js';
import * as webAdminRoutes from './routes/web-admin.js';
import { logger, generateRequestId } from '../../utils/logger.js';
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
  const adapters = new Map<string, any>();

  // 요청 ID 미들웨어 (모든 요청에 UUID 부여)
  app.use((req, res, next) => {
    req.id = generateRequestId();
    res.setHeader('X-Request-ID', req.id);
    next();
  });

  // 로깅 미들웨어
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const latency = Date.now() - startTime;
      logger.httpRequest(req.method, req.path, res.statusCode, latency, {
        reqId: req.id,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        tenantId: req.get('X-Tenant-Id'),
        deviceId: req.get('X-Device-Id')
      });
    });
    
    next();
  });

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

  // 헬스체크 (Kubernetes/Docker 표준)
  app.get('/healthz', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '2.0.0'
    });
  });

  // 레디니스 체크
  app.get('/ready', (req, res) => {
    // TODO: 데이터베이스 연결 상태, MQTT 브로커 연결 상태 등 확인
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected', // TODO: 실제 DB 연결 상태 확인
        mqtt_broker: 'running', // TODO: 실제 MQTT 브로커 상태 확인
        legacy_mqtt: process.env.LEGACY_MQTT_SUPPORT === 'true' ? 'enabled' : 'disabled'
      }
    });
  });

  // 에러 핸들링 미들웨어
  app.use((error: Error, req: any, res: any, next: any) => {
    logger.logError(error, 'Unhandled request error', {
      reqId: req.id,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    res.status(500).json({
      error: 'Internal Server Error',
      reqId: req.id,
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
    });
  });

  // 404 핸들러
  app.use('*', (req, res) => {
    logger.warn('Route not found', {
      reqId: req.id,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    res.status(404).json({
      error: 'Not Found',
      reqId: req.id,
      message: `Route ${req.method} ${req.path} not found`
    });
  });

  // 인증 라우터 설정
  app.post('/api/auth/token', authRoutes.generateToken);
  app.get('/api/auth/verify', authenticateDevice, authRoutes.verifyToken);
  app.post('/api/auth/refresh', authenticateDevice, authRoutes.refreshToken);
  app.post('/api/auth/setup-token', authRoutes.generateSetupToken);
  app.post('/api/auth/verify-setup-token', authRoutes.verifySetupToken);
  app.post('/api/auth/decode-token', authRoutes.decodeToken);
  app.get('/api/auth/status', authenticateDevice, authRoutes.getAuthStatus);

  // MQTT 브로커 관리 라우터 설정
  app.get('/api/mqtt/status', mqttRoutes.getBrokerStatus);
  app.get('/api/mqtt/clients', mqttRoutes.getClients);
  app.delete('/api/mqtt/clients/:clientId', mqttRoutes.disconnectClient);
  app.post('/api/mqtt/stats/reset', mqttRoutes.resetStats);
  app.post('/api/mqtt/restart', mqttRoutes.restartBroker);
  app.get('/api/mqtt/config', mqttRoutes.getBrokerConfig);

  // 프로비저닝 엔드포인트
  app.post('/api/provisioning/claim', routes.handleClaim);
  app.post('/api/provisioning/bind', routes.handleBind);
  app.post('/api/provisioning/rotate', routes.handleRotate);

  // Bridge 엔드포인트
  app.post('/api/bridge/telemetry', routes.handleTelemetry);
  app.get('/api/bridge/commands/:deviceId', routes.handleCommandPoll);
  app.post('/api/bridge/commands/:commandId/ack', routes.handleCommandAck);

  // Web Admin API 엔드포인트
  app.get('/api/farms/:farmId/sensors/latest', webAdminRoutes.getLatestSensorData);
  app.get('/api/farms/:farmId/actuators/status', webAdminRoutes.getActuatorStatus);
  app.post('/api/farms/:farmId/actuators/control', webAdminRoutes.controlActuator);

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
  const clients = new Map<string, Map<string, any>>(); // farmId -> clientId -> WebSocket
  
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;
    const farmId = url.searchParams.get('farmId');
    const clientId = generateRequestId();

    logger.info('WebSocket client connected', { 
      pathname, 
      farmId: farmId || 'unknown', 
      clientId,
      clientIp: req.socket.remoteAddress || 'unknown'
    });

    // 실시간 데이터 스트리밍 연결
    if (pathname === '/ws' && farmId) {
      // 클라이언트 등록
      if (!clients.has(farmId)) {
        clients.set(farmId, new Map());
      }
      clients.get(farmId)!.set(clientId, ws);

      // 환영 메시지 전송
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        clientId,
        farmId,
        timestamp: new Date().toISOString()
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          logger.debug('WebSocket message received', { 
            farmId, 
            clientId, 
            messageType: data.type 
          });

          // 클라이언트 요청 처리
          switch (data.type) {
            case 'ping':
              ws.send(JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString()
              }));
              break;
            case 'subscribe':
              // 특정 디바이스/센서 구독
              ws.send(JSON.stringify({
                type: 'subscribed',
                devices: data.devices || [],
                sensors: data.sensors || []
              }));
              break;
          }
        } catch (error) {
          logger.error('WebSocket message parse error', { 
            farmId, 
            clientId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      });

      ws.on('close', () => {
        if (clients.has(farmId)) {
          clients.get(farmId)!.delete(clientId);
          if (clients.get(farmId)!.size === 0) {
            clients.delete(farmId);
          }
        }
        logger.info('WebSocket client disconnected', { 
          farmId, 
          clientId,
          remainingClients: clients.get(farmId)?.size || 0 
        });
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error', { 
          farmId, 
          clientId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      });

    } else if (pathname.startsWith('/monitor/')) {
      // 모니터링 연결: /monitor/:setup_token
      const setupToken = pathname.split('/monitor/')[1];
      logger.info('Monitor connected', { setupToken });
      
      ws.send(JSON.stringify({
        type: 'log',
        level: 'info',
        message: '연결 모니터링 시작',
        timestamp: new Date().toISOString()
      }));

      ws.on('close', () => {
        logger.info('Monitor disconnected', { setupToken });
      });

    } else if (pathname === '/test') {
      // 테스트 연결
      logger.info('Test WebSocket connection');
      ws.send(JSON.stringify({
        type: 'test',
        message: 'WebSocket 연결 성공',
        timestamp: new Date().toISOString()
      }));
    
    ws.on('close', () => {
        logger.info('Test WebSocket disconnected');
      });
    } else {
      ws.close(1008, 'Invalid path');
    }
  });

  // WebSocket 브로드캐스트 함수들을 전역으로 노출
  (global as any).broadcastToFarm = (farmId: string, message: any) => {
    const farmClients = clients.get(farmId);
    if (farmClients && farmClients.size > 0) {
      const messageStr = JSON.stringify(message);
      let sentCount = 0;
      farmClients.forEach((ws: any, clientId: string) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(messageStr);
          sentCount++;
        } else {
          farmClients.delete(clientId);
        }
      });
      logger.debug('Broadcast to farm', { 
        farmId, 
        totalClients: farmClients.size, 
        sentCount,
        messageType: message.type 
      });
    }
  };

  (global as any).getConnectedClients = () => {
    const stats: any = {};
    clients.forEach((farmClients, farmId) => {
      stats[farmId] = farmClients.size;
    });
    return stats;
  };

  return { app, server };
}

