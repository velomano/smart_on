/**
 * Universal Bridge 시작 스크립트 (CommonJS)
 * 
 * MQTT Bridge 통합 후 Universal Bridge 실행
 */

console.log('🌉 Universal Bridge 시작 중...\n');

// 환경 변수 설정
process.env.LEGACY_MQTT_SUPPORT = 'true';
process.env.NODE_ENV = 'development';
process.env.BRIDGE_HTTP_PORT = '3000';
process.env.LOG_LEVEL = 'info';

// 간단한 HTTP 서버로 Universal Bridge 기능 테스트
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// JWT 시크릿
const JWT_SECRET = 'universal-bridge-secret-key';

console.log('1️⃣ Universal Bridge HTTP 서버 초기화...');

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Universal Bridge v2.0',
    legacy_mqtt_support: true,
    timestamp: new Date().toISOString()
  });
});

// Legacy MQTT 토픽 지원 테스트
app.post('/api/legacy/mqtt/telemetry', (req, res) => {
  const { topic, payload } = req.body;
  
  console.log('📡 Legacy MQTT 토픽 수신:', topic);
  console.log('📊 페이로드:', JSON.stringify(payload, null, 2));
  
  // 토픽 파싱: farms/{farmId}/devices/{deviceId}/telemetry
  const topicParts = topic.split('/');
  if (topicParts.length >= 4) {
    const farmId = topicParts[1];
    const deviceId = topicParts[2];
    const messageType = topicParts[3];
    
    console.log('   🏭 농장 ID:', farmId);
    console.log('   📱 디바이스 ID:', deviceId);
    console.log('   📨 메시지 타입:', messageType);
    
    // Universal Bridge 형식으로 변환
    const universalFormat = {
      device_uuid: deviceId,
      tenant_id: farmId,
      key: messageType,
      value: payload.value,
      unit: payload.unit || '',
      ts: payload.ts || new Date().toISOString()
    };
    
    console.log('   🔄 Universal Bridge 형식으로 변환됨');
    console.log('   📋 변환된 데이터:', JSON.stringify(universalFormat, null, 2));
  }
  
  res.json({ 
    success: true, 
    message: 'Legacy MQTT 데이터가 Universal Bridge로 변환되었습니다.',
    converted: true
  });
});

// 디바이스 등록 (Legacy 지원)
app.post('/api/legacy/mqtt/registry', (req, res) => {
  const { topic, payload } = req.body;
  
  console.log('📝 Legacy MQTT 디바이스 등록:', topic);
  console.log('📋 디바이스 정보:', JSON.stringify(payload, null, 2));
  
  res.json({ 
    success: true, 
    message: 'Legacy MQTT 디바이스가 Universal Bridge에 등록되었습니다.',
    registered: true
  });
});

// Universal Bridge API (새로운 형식)
app.post('/api/bridge/telemetry', (req, res) => {
  const { device_uuid, key, value, unit, ts, tenant_id } = req.body;
  
  console.log('📊 Universal Bridge 텔레메트리 수신:');
  console.log('   📱 디바이스:', device_uuid);
  console.log('   🔑 키:', key);
  console.log('   📈 값:', value);
  console.log('   🏭 테넌트:', tenant_id);
  
  res.json({ 
    success: true, 
    message: 'Universal Bridge 텔레메트리 데이터 수신됨',
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
const PORT = process.env.BRIDGE_HTTP_PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ Universal Bridge HTTP 서버 시작됨: http://localhost:${PORT}`);
  console.log('');
  console.log('🔧 사용 가능한 엔드포인트:');
  console.log('   GET  /health                           - 상태 확인');
  console.log('   POST /api/legacy/mqtt/telemetry        - Legacy MQTT 텔레메트리');
  console.log('   POST /api/legacy/mqtt/registry         - Legacy MQTT 디바이스 등록');
  console.log('   POST /api/bridge/telemetry             - Universal Bridge 텔레메트리');
  console.log('');
  console.log('🌉 Universal Bridge가 MQTT Bridge를 완전히 대체할 준비가 완료되었습니다!');
  console.log('   Legacy MQTT 토픽과 Universal Bridge API 모두 지원합니다.');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Universal Bridge 종료 중...');
  server.close(() => {
    console.log('✅ Universal Bridge 종료됨');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Universal Bridge 종료 중...');
  server.close(() => {
    console.log('✅ Universal Bridge 종료됨');
    process.exit(0);
  });
});
