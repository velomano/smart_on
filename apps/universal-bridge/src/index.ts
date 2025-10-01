/**
 * Universal IoT Bridge v2.0
 * 
 * Main Entry Point
 */

import { createHttpServer } from './protocols/http/server.js';
import { createWebSocketServer } from './protocols/websocket/server.js';
import { UniversalMessageBus } from './core/messagebus.js';

/**
 * 메인 함수
 * 
 * TODO:
 * - [ ] 설정 로드
 * - [ ] 서비스 초기화
 * - [ ] Graceful shutdown
 */
async function main() {
  console.log('🌉 Universal IoT Bridge v2.0 Starting...');

  // 설정 로드
  const config = {
    http: {
      port: parseInt(process.env.BRIDGE_HTTP_PORT || '3000'),
    },
    websocket: {
      port: parseInt(process.env.BRIDGE_WS_PORT || '8080'),
    },
  };

  // 메시지 버스 초기화
  const messageBus = new UniversalMessageBus();
  console.log('✅ Message Bus initialized');

  // HTTP 서버 시작
  const httpServer = createHttpServer();
  httpServer.listen(config.http.port, () => {
    console.log(`✅ HTTP Server listening on port ${config.http.port}`);
  });

  // WebSocket 서버 시작
  const wsServer = createWebSocketServer(config.websocket.port);
  console.log(`✅ WebSocket Server listening on port ${config.websocket.port}`);

  // TODO: MQTT 클라이언트 시작 (옵션)
  // TODO: Observability 초기화
  // TODO: Cron jobs 설정

  console.log('🚀 Universal IoT Bridge v2.0 Started!');
  console.log(`   HTTP: http://localhost:${config.http.port}`);
  console.log(`   WebSocket: ws://localhost:${config.websocket.port}`);
}

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  // TODO: 모든 연결 정리
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  // TODO: 모든 연결 정리
  process.exit(0);
});

// 시작
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

