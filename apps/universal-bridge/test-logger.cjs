// 로깅 시스템 테스트

const { v4: uuidv4 } = require('uuid');

// 구조화된 로거 클래스
class StructuredLogger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    this.serviceName = 'universal-bridge';
    this.version = '2.0.0';
  }

  shouldLog(level) {
    const levels = ['error', 'warn', 'info', 'debug', 'trace'];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= currentIndex;
  }

  formatLog(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      version: this.version,
      message,
      ...context
    };
    return JSON.stringify(logEntry);
  }

  log(level, message, context) {
    if (!this.shouldLog(level)) return;
    
    const formattedLog = this.formatLog(level, message, context);
    console[level === 'trace' ? 'trace' : level](formattedLog);
  }

  error(message, context) { this.log('error', message, context); }
  warn(message, context) { this.log('warn', message, context); }
  info(message, context) { this.log('info', message, context); }
  debug(message, context) { this.log('debug', message, context); }
  trace(message, context) { this.log('trace', message, context); }

  // MQTT 전용 로깅
  mqttReceive(topic, payload, latency, context = {}) {
    this.info('MQTT message received', {
      topic,
      payloadSize: JSON.stringify(payload).length,
      latency,
      ...context
    });
  }

  mqttPublish(topic, payload, latency, context = {}) {
    this.info('MQTT message published', {
      topic,
      payloadSize: JSON.stringify(payload).length,
      latency,
      ...context
    });
  }

  // HTTP 요청 로깅
  httpRequest(method, path, statusCode, latency, context = {}) {
    const level = statusCode >= 400 ? 'error' : 'info';
    this.log(level, 'HTTP request', {
      method,
      path,
      statusCode,
      latency,
      ...context
    });
  }

  // 에러 로깅 (reqId 포함)
  logError(error, message, context = {}) {
    this.error(message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      reqId: context.reqId || uuidv4(),
      ...context
    });
  }
}

const logger = new StructuredLogger();

// 로깅 테스트
console.log('🧪 로깅 시스템 테스트 시작\n');

// 1. 기본 로깅 테스트
logger.info('Application started', { 
  pid: process.pid,
  nodeVersion: process.version 
});

// 2. HTTP 요청 로깅 테스트
logger.httpRequest('GET', '/healthz', 200, 45, {
  reqId: uuidv4(),
  userAgent: 'curl/7.68.0',
  ip: '127.0.0.1'
});

logger.httpRequest('POST', '/api/auth/token', 401, 120, {
  reqId: uuidv4(),
  userAgent: 'Mozilla/5.0',
  ip: '192.168.1.100'
});

// 3. MQTT 로깅 테스트
logger.mqttReceive('farms/farm123/devices/device456/telemetry', 
  { temperature: 24.5, humidity: 65 }, 12, {
    reqId: uuidv4(),
    deviceId: 'device456',
    farmId: 'farm123'
  });

logger.mqttPublish('farms/farm123/devices/device456/command',
  { command: 'set_temperature', value: 25 }, 8, {
    reqId: uuidv4(),
    deviceId: 'device456',
    farmId: 'farm123'
  });

// 4. 에러 로깅 테스트
try {
  throw new Error('Database connection failed');
} catch (error) {
  logger.logError(error, 'Failed to connect to database', {
    reqId: uuidv4(),
    tenantId: 'tenant123',
    farmId: 'farm456'
  });
}

// 5. 경고 로깅 테스트
logger.warn('Rate limit exceeded', {
  reqId: uuidv4(),
  deviceId: 'device789',
  tenantId: 'tenant123',
  limit: 60,
  current: 65
});

// 6. 디버그 로깅 테스트 (LOG_LEVEL=debug일 때만 출력)
logger.debug('Processing telemetry data', {
  reqId: uuidv4(),
  deviceId: 'device123',
  dataSize: 1024
});

console.log('\n✅ 로깅 시스템 테스트 완료');
console.log('📊 모든 로그는 JSON 형식으로 구조화되어 출력됩니다');
console.log('🔧 LOG_LEVEL 환경변수로 로그 레벨을 조정할 수 있습니다');
