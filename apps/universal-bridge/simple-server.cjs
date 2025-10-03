/**
 * Universal Bridge 간단 서버
 * 핵심 기능만 포함: JWT 토큰 서버 + MQTT 브로커
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.BRIDGE_HTTP_PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// JWT 설정
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_please_change_me_in_production';

// 메모리 저장소 (임시)
const devices = new Map();
const tokens = new Map();

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      http: 'running',
      mqtt: 'simulated'
    }
  });
});

// JWT 토큰 발급
app.post('/api/auth/token', (req, res) => {
  try {
    const { deviceId, tenantId, farmId, deviceType, capabilities } = req.body;
    
    if (!deviceId || !tenantId) {
      return res.status(400).json({ 
        error: 'Device ID and Tenant ID are required' 
      });
    }

    const payload = {
      deviceId,
      tenantId,
      farmId,
      deviceType,
      capabilities,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24시간
      aud: 'iot-devices',
      iss: 'universal-bridge',
      sub: deviceId
    };

    const token = jwt.sign(payload, JWT_SECRET);
    
    // 디바이스 정보 저장
    devices.set(deviceId, {
      deviceId,
      tenantId,
      farmId,
      deviceType,
      capabilities,
      createdAt: new Date(),
      lastSeen: new Date()
    });

    console.log(`✅ JWT 토큰 발급: ${deviceId} (${tenantId})`);

    res.json({
      success: true,
      token,
      deviceId,
      tenantId,
      farmId,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      ttl: 24 * 60 * 60
    });

  } catch (error) {
    console.error('❌ 토큰 발급 실패:', error);
    res.status(500).json({ 
      error: 'Token generation failed',
      details: error.message 
    });
  }
});

// 토큰 검증
app.post('/api/auth/verify', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        error: 'Token is required' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 디바이스 정보 업데이트
    if (devices.has(decoded.deviceId)) {
      const device = devices.get(decoded.deviceId);
      device.lastSeen = new Date();
      devices.set(decoded.deviceId, device);
    }

    console.log(`✅ 토큰 검증 성공: ${decoded.deviceId}`);

    res.json({
      success: true,
      valid: true,
      deviceId: decoded.deviceId,
      tenantId: decoded.tenantId,
      farmId: decoded.farmId,
      deviceType: decoded.deviceType,
      capabilities: decoded.capabilities,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });

  } catch (error) {
    console.error('❌ 토큰 검증 실패:', error);
    res.json({
      success: true,
      valid: false,
      error: error.message
    });
  }
});

// MQTT 브로커 상태 (시뮬레이션)
app.get('/api/mqtt/status', (req, res) => {
  const stats = {
    success: true,
    status: 'running',
    stats: {
      totalConnections: devices.size,
      activeConnections: devices.size,
      totalMessages: Math.floor(Math.random() * 1000) + 100,
      totalSubscriptions: Math.floor(Math.random() * 100) + 50
    },
    timestamp: new Date().toISOString()
  };

  res.json(stats);
});

// 연결된 클라이언트 목록
app.get('/api/mqtt/clients', (req, res) => {
  const clients = Array.from(devices.values()).map(device => ({
    id: device.deviceId,
    deviceId: device.deviceId,
    tenantId: device.tenantId,
    farmId: device.farmId,
    connectedAt: device.createdAt.toISOString(),
    lastSeen: device.lastSeen.toISOString(),
    subscriptionCount: Math.floor(Math.random() * 5) + 1
  }));

  res.json({
    success: true,
    clients,
    totalClients: clients.length,
    timestamp: new Date().toISOString()
  });
});

// 클라이언트 연결 해제
app.delete('/api/mqtt/clients/:clientId', (req, res) => {
  const { clientId } = req.params;
  
  if (devices.has(clientId)) {
    devices.delete(clientId);
    console.log(`✅ 클라이언트 연결 해제: ${clientId}`);
    
    res.json({
      success: true,
      message: `Client ${clientId} disconnected`,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Client not found',
      timestamp: new Date().toISOString()
    });
  }
});

// 등록된 디바이스 목록
app.get('/api/devices', (req, res) => {
  const deviceList = Array.from(devices.values());
  
  res.json({
    success: true,
    devices: deviceList,
    totalDevices: deviceList.length,
    timestamp: new Date().toISOString()
  });
});

// 에러 핸들링
app.use((error, req, res, next) => {
  console.error('❌ 서버 에러:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: error.message,
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('🌉 Universal Bridge Simple Server 시작!');
  console.log(`✅ HTTP 서버: http://localhost:${PORT}`);
  console.log(`🔐 JWT 토큰 서버: 활성화`);
  console.log(`📡 MQTT 브로커: 시뮬레이션 모드`);
  console.log('='.repeat(50));
  console.log('📋 사용 가능한 엔드포인트:');
  console.log(`  GET  /health - 헬스 체크`);
  console.log(`  POST /api/auth/token - JWT 토큰 발급`);
  console.log(`  POST /api/auth/verify - 토큰 검증`);
  console.log(`  GET  /api/mqtt/status - MQTT 브로커 상태`);
  console.log(`  GET  /api/mqtt/clients - 연결된 클라이언트 목록`);
  console.log(`  GET  /api/devices - 등록된 디바이스 목록`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 서버 종료 중...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 서버 종료 중...');
  process.exit(0);
});
