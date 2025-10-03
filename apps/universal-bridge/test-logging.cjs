const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

// 요청 ID 미들웨어
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// 로깅 미들웨어
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const latency = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'universal-bridge',
      version: '2.0.0',
      message: 'HTTP request',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latency,
      reqId: req.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
    
    console.log(JSON.stringify(logEntry));
  });
  
  next();
});

app.use(express.json());

// 헬스체크
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0',
    reqId: req.id
  });
});

// 테스트 엔드포인트
app.get('/test', (req, res) => {
  res.json({
    message: 'Logging test successful',
    reqId: req.id,
    timestamp: new Date().toISOString()
  });
});

// 에러 테스트
app.get('/error', (req, res) => {
  const error = new Error('Test error for logging');
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    service: 'universal-bridge',
    version: '2.0.0',
    message: 'Test error for logging',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    reqId: req.id,
    method: req.method,
    path: req.path
  };
  
  console.log(JSON.stringify(logEntry));
  
  res.status(500).json({
    error: 'Test error',
    reqId: req.id
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    service: 'universal-bridge',
    version: '2.0.0',
    message: 'Route not found',
    reqId: req.id,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };
  
  console.log(JSON.stringify(logEntry));
  
  res.status(404).json({
    error: 'Not Found',
    reqId: req.id,
    message: `Route ${req.method} ${req.path} not found`
  });
});

const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`🚀 로깅 테스트 서버가 포트 ${port}에서 실행 중입니다`);
  console.log(`📊 헬스체크: http://localhost:${port}/healthz`);
  console.log(`🧪 테스트: http://localhost:${port}/test`);
  console.log(`❌ 에러 테스트: http://localhost:${port}/error`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  서버를 종료합니다...');
  server.close(() => {
    console.log('✅ 서버가 종료되었습니다.');
    process.exit(0);
  });
});
