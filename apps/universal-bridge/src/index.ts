/**
 * Universal IoT Bridge v2.0
 * 
 * Main Entry Point
 */

import 'dotenv/config';
import { createHttpServer } from './protocols/http/server.js';
import { UniversalMessageBus } from './core/messagebus.js';
import { initSupabase } from './db/index.js';

/**
 * 메인 함수
 */
async function main() {
  console.log('🌉 Universal IoT Bridge v2.0 Starting...');

  // Supabase 초기화
  try {
    initSupabase();
    console.log('✅ Supabase connected');
  } catch (error: any) {
    console.warn('⚠️  Supabase not configured (메모리 모드로 실행)');
    console.warn('   환경 변수를 설정하면 DB 연동이 활성화됩니다.');
  }

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

  // HTTP + WebSocket 통합 서버 시작
  const { app, server } = createHttpServer();
  server.listen(config.http.port, () => {
    console.log(`✅ HTTP + WebSocket Server listening on port ${config.http.port}`);
  });

  // TODO: MQTT 클라이언트 시작 (옵션)
  // TODO: Observability 초기화
  // TODO: Cron jobs 설정

  console.log('🚀 Universal IoT Bridge v2.0 Started!');
  console.log(`   HTTP: http://localhost:${config.http.port}`);
  console.log(`   WebSocket: ws://localhost:${config.http.port}`);
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

