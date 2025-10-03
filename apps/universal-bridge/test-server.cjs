/**
 * Universal Bridge 테스트 서버
 * 
 * JWT 토큰 서버 + MQTT 브로커 핵심 기능만 테스트
 */

const express = require('express');
const cors = require('cors');
const aedes = require('aedes');
const { createServer } = require('net');
const jwt = require('jsonwebtoken');

const app = express();
const server = createServer(app);

// 미들웨어
app.use(cors());
app.use(express.json());

// JWT 설정
const JWT_SECRET = 'test-jwt-secret-key-for-universal-bridge-integration-test-2025';

// MQTT 브로커 생성
const mqttBroker = aedes();
const mqttServer = createServer(mqttBroker.handle);

// MQTT 브로커 인증 설정
mqttBroker.authenticate = (client, username, password, callback) => {
  try {
    if (!username || !password) {
      console.log(`❌ MQTT 인증 실패: 자격증명 없음 - ${client.id}`);
      return callback(null, false);
    }

    // JWT 토큰 검증
    const token = password.toString();
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log(`✅ MQTT 인증 성공: ${client.id} - 디바이스: ${decoded.deviceId}`);
    callback(null, true);
  } catch (error) {
    console.log(`❌ MQTT 인증 실패: ${client.id} - ${error.message}`);
    callback(error, false);
  }
};

// ACL 설정
mqttBroker.authorizePublish = (client, packet, callback) => {
  try {
    // 간단한 ACL: 테넌트별 접근 제한
    const topic = packet.topic;
    if (topic.includes('/test-tenant-001/')) {
      console.log(`✅ MQTT 발행 허용: ${client.id} - ${topic}`);
      callback(null, true);
    } else {
      console.log(`❌ MQTT 발행 차단: ${client.id} - ${topic}`);
      callback(null, false);
    }
  } catch (error) {
    callback(error, false);
  }
};

mqttBroker.authorizeSubscribe = (client, sub, callback) => {
  try {
    const topic = sub.topic;
    if (topic.includes('/test-tenant-001/')) {
      console.log(`✅ MQTT 구독 허용: ${client.id} - ${topic}`);
      callback(null, true);
    } else {
      console.log(`❌ MQTT 구독 차단: ${client.id} - ${topic}`);
      callback(null, false);
    }
  } catch (error) {
    callback(error, false);
  }
};

// MQTT 브로커 이벤트 로깅
mqttBroker.on('client', (client) => {
  console.log(`📡 MQTT 클라이언트 연결: ${client.id}`);
});

mqttBroker.on('clientReady', (client) => {
  console.log(`✅ MQTT 클라이언트 준비: ${client.id}`);
});

mqttBroker.on('clientDisconnect', (client) => {
  console.log(`📡 MQTT 클라이언트 연결 해제: ${client.id}`);
});

mqttBroker.on('publish', (packet, client) => {
  const clientId = client ? client.id : 'system';
  console.log(`📨 MQTT 메시지 발행: ${clientId} -> ${packet.topic}`);
});

// HTTP API 라우트

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-test',
    services: {
      http: 'running',
      mqtt: 'running'
    }
  });
});

// JWT 토큰 발급
app.post('/api/auth/token', (req, res) => {
  try {
    const { deviceId, tenantId, farmId, deviceType, capabilities } = req.body;

    if (!deviceId || !tenantId) {
      return res.status(400).json({ 
        error: 'deviceId and tenantId are required' 
      });
    }

    const payload = {
      deviceId,
      tenantId,
      farmId,
      deviceType,
      capabilities,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24시간
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: 'HS256',
      issuer: 'universal-bridge-test',
      audience: 'iot-devices'
    });

    console.log(`✅ JWT 토큰 발급: ${deviceId} (${tenantId})`);

    res.json({
      success: true,
      token,
      expiresIn: 24 * 60 * 60,
      deviceId,
      tenantId,
      farmId
    });
  } catch (error) {
    console.error('❌ 토큰 발급 실패:', error.message);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// 토큰 검증
app.get('/api/auth/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    console.log(`✅ JWT 토큰 검증 성공: ${decoded.deviceId}`);

    res.json({
      success: true,
      valid: true,
      device: decoded,
      expiresIn: decoded.exp - Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    console.error('❌ 토큰 검증 실패:', error.message);
    res.status(401).json({ error: 'Token verification failed' });
  }
});

// MQTT 브로커 상태
app.get('/api/mqtt/status', (req, res) => {
  const stats = {
    totalConnections: mqttBroker.connectedClients.size,
    activeConnections: mqttBroker.connectedClients.size,
    totalMessages: 0, // 실제 구현에서는 카운터 필요
    totalSubscriptions: 0
  };

  res.json({
    success: true,
    status: 'running',
    stats,
    timestamp: new Date().toISOString()
  });
});

// 연결된 클라이언트 목록
app.get('/api/mqtt/clients', (req, res) => {
  const clients = Array.from(mqttBroker.connectedClients.keys()).map(clientId => ({
    id: clientId,
    connectedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  }));

  res.json({
    success: true,
    clients,
    totalClients: clients.length,
    timestamp: new Date().toISOString()
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('HTTP 에러:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 서버 시작
const HTTP_PORT = 3001;
const MQTT_PORT = 1884;

// HTTP 서버 시작
server.listen(HTTP_PORT, () => {
  console.log(`✅ HTTP 서버 시작: http://localhost:${HTTP_PORT}`);
});

// MQTT 서버 시작
mqttServer.listen(MQTT_PORT, () => {
  console.log(`✅ MQTT 브로커 시작: mqtt://localhost:${MQTT_PORT}`);
});

console.log('🚀 Universal Bridge 테스트 서버 시작');
console.log('='.repeat(50));
console.log(`📡 HTTP API: http://localhost:${HTTP_PORT}`);
console.log(`📡 MQTT Broker: mqtt://localhost:${MQTT_PORT}`);
console.log('='.repeat(50));

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 서버 종료 중...');
  mqttBroker.close();
  mqttServer.close();
  server.close(() => {
    console.log('✅ 서버 종료 완료');
    process.exit(0);
  });
});
