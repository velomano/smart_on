const express = require('express');
const app = express();

// 헬스체크 엔드포인트
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
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      mqtt_broker: 'running',
      legacy_mqtt: process.env.LEGACY_MQTT_SUPPORT === 'true' ? 'enabled' : 'disabled'
    }
  });
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    service: 'Universal Bridge v2.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

const port = process.env.BRIDGE_HTTP_PORT || 3001;
const server = app.listen(port, () => {
  console.log(`🚀 Universal Bridge 테스트 서버가 포트 ${port}에서 실행 중입니다`);
  console.log(`📊 헬스체크: http://localhost:${port}/healthz`);
  console.log(`🔧 레디니스: http://localhost:${port}/ready`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  서버를 종료합니다...');
  server.close(() => {
    console.log('✅ 서버가 종료되었습니다.');
    process.exit(0);
  });
});
