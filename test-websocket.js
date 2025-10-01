/**
 * WebSocket 연결 테스트
 */

const WebSocket = require('ws');

// 테스트 연결
function testWebSocket(url, description) {
  console.log(`\n🔌 ${description}`);
  console.log(`   URL: ${url}`);
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log(`✅ 연결 성공!`);
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log(`📨 메시지 수신:`, message);
  });
  
  ws.on('error', (error) => {
    console.log(`❌ 연결 실패: ${error.message}`);
  });
  
  ws.on('close', () => {
    console.log(`🔌 연결 종료`);
  });
  
  // 3초 후 연결 종료
  setTimeout(() => {
    ws.close();
  }, 3000);
}

// 테스트 실행
console.log('🌉 WebSocket 연결 테스트 시작');

// 1. 테스트 연결
testWebSocket('ws://localhost:3001/test', '테스트 연결');

// 2. 모니터링 연결 (실제 Setup Token 사용)
setTimeout(() => {
  testWebSocket('ws://localhost:3001/monitor/ST_test123', '모니터링 연결');
}, 1000);
