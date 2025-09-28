# 🔧 스마트팜 시스템 기술 아키텍처

## 📋 목차
1. [시스템 아키텍처 개요](#시스템-아키텍처-개요)
2. [데이터베이스 설계](#데이터베이스-설계)
3. [MQTT 통신 프로토콜](#mqtt-통신-프로토콜)
4. [베드 시스템 설계](#베드-시스템-설계)
5. [API 구조](#api-구조)
6. [보안 및 인증](#보안-및-인증)
7. [모니터링 및 로깅](#모니터링-및-로깅)
8. [배포 및 확장성](#배포-및-확장성)

---

## 🏗️ 시스템 아키텍처 개요

### **전체 시스템 구성**
```
┌─────────────────────────────────────────────────────────────┐
│                    웹 애플리케이션                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   대시보드   │  │  농장관리   │  │  사용자관리  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase 백엔드                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   PostgreSQL│  │   Auth      │  │   RLS      │         │
│  │   Database  │  │   System    │  │   Policies  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MQTT 통신 레이어                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   MQTT      │  │   WebSocket │  │   JSON      │         │
│  │   Broker    │  │   Client    │  │   Protocol  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   하드웨어 레이어                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   아두이노   │  │ 라즈베리파이 │  │   센서/     │         │
│  │   (센서)    │  │   (제어)    │  │  액추에이터  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### **데이터 흐름**
1. **센서 데이터**: 아두이노 → 라즈베리파이 → MQTT → 웹앱
2. **제어 명령**: 웹앱 → MQTT → 라즈베리파이 → 액추에이터
3. **사용자 데이터**: 웹앱 → Supabase → PostgreSQL
4. **실시간 통신**: WebSocket을 통한 실시간 업데이트

---

## 🗄️ 데이터베이스 설계

### **핵심 테이블 구조**

#### **농장 관리**
```sql
-- 농장 정보
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 디바이스 (베드) 정보
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  bed_id UUID, -- 베드별 고유 ID
  type VARCHAR(50) NOT NULL, -- 'sensor_gateway'
  meta JSONB, -- 베드 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **사용자 관리**
```sql
-- 사용자 정보
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(100),
  is_approved BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 멤버십 (권한 관리)
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- 'system_admin', 'team_leader', 'team_member'
  tenant_id UUID REFERENCES farms(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 사용자 설정
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  notification_preferences JSONB,
  telegram_chat_id VARCHAR(100),
  ui_preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **센서 데이터**
```sql
-- 센서 정보
CREATE TABLE sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id),
  sensor_type VARCHAR(50) NOT NULL, -- 'temperature', 'humidity', 'ec', 'ph'
  sensor_id VARCHAR(100), -- 하드웨어 센서 ID
  tier_number INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 센서 측정값
CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID REFERENCES sensors(id),
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  quality VARCHAR(20) DEFAULT 'good', -- 'good', 'warning', 'error'
  raw_value DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **RLS (Row Level Security) 정책**
```sql
-- 농장 데이터 접근 제어
CREATE POLICY "Users can view farms in their tenant" ON farms
  FOR SELECT USING (
    id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- 디바이스 데이터 접근 제어
CREATE POLICY "Users can view devices in their farms" ON devices
  FOR SELECT USING (
    farm_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );
```

---

## 📡 MQTT 통신 프로토콜

### **토픽 구조 정의**
```typescript
// 기본 토픽 패턴
const TOPIC_PATTERNS = {
  sensorData: "farm/{farmId}/bed/{bedId}/tier/{tierNumber}/sensor/{sensorType}",
  controlCommand: "farm/{farmId}/bed/{bedId}/control/{switchId}",
  statusResponse: "farm/{farmId}/bed/{bedId}/status/{switchId}",
  systemStatus: "farm/{farmId}/system/{deviceType}"
};

// 실제 토픽 예시
const EXAMPLES = {
  sensorData: "farm/farm_a/bed/bed_1/tier/tier_1/sensor/temperature",
  controlCommand: "farm/farm_a/bed/bed_1/control/pump_1",
  statusResponse: "farm/farm_a/bed/bed_1/status/pump_1",
  systemStatus: "farm/farm_a/system/arduino"
};
```

### **메시지 스키마**

#### **센서 데이터 (농장 → 웹앱)**
```json
{
  "topic": "farm/farm_a/bed/bed_1/tier/tier_1/sensor/temperature",
  "payload": {
    "farm_id": "farm_a",
    "bed_id": "bed_1",
    "tier_number": 1,
    "sensor_type": "temperature",
    "value": 25.5,
    "unit": "°C",
    "quality": "good",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "raw_value": 25.3,
    "calibration_offset": 0.2
  }
}
```

#### **제어 명령 (웹앱 → 농장)**
```json
{
  "topic": "farm/farm_a/bed/bed_1/control/pump_1",
  "payload": {
    "farm_id": "farm_a",
    "bed_id": "bed_1",
    "switch_id": "pump_1",
    "command": "on",
    "duration": 300,
    "priority": "normal",
    "user_id": "user_123",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "reason": "양액 공급",
    "safety_check": true
  }
}
```

### **MQTT 클라이언트 구현**
```typescript
class MqttClient {
  private client: any;
  private subscriptions: Map<string, Function> = new Map();

  async connect(config: FarmMqttConfig) {
    this.client = mqtt.connect(config.mqttServer.brokerUrl, {
      port: config.mqttServer.port,
      username: config.mqttServer.username,
      password: config.mqttServer.password,
      keepalive: config.mqttServer.keepAlive,
      qos: config.mqttServer.qos
    });

    this.client.on('connect', () => {
      console.log('MQTT 연결됨');
      this.resubscribeAll();
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      this.handleMessage(topic, message.toString());
    });
  }

  subscribe(topic: string, callback: Function) {
    this.client.subscribe(topic);
    this.subscriptions.set(topic, callback);
  }

  publish(topic: string, payload: any) {
    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    this.client.publish(topic, message);
  }

  private handleMessage(topic: string, message: string) {
    const callback = this.subscriptions.get(topic);
    if (callback) {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        console.error('메시지 파싱 오류:', error);
      }
    }
  }
}
```

---

## 🏗️ 베드 시스템 설계

### **베드 구조 데이터 모델**
```typescript
interface BedTierSystem {
  bedId: string;
  bedName: string;
  farmId: string;
  totalTiers: number;
  tiers: {
    [tierNumber: number]: {
      tierNumber: number;
      sensors: TierSensor[];
      plantCount: number;
      hasPlants: boolean;
    };
  };
  controlSwitches: ControlSwitch[];
  mqttConfig: {
    baseTopic: string;
    qos: 0 | 1 | 2;
  };
}

interface TierSensor {
  sensorId: string;
  sensorType: string;
  lastReading?: {
    value: number;
    unit: string;
    timestamp: Date;
  };
}

interface ControlSwitch {
  switchId: string;
  switchName: string;
  switchType: string;
  currentState: 'on' | 'off';
  lastCommand?: {
    state: 'on' | 'off';
    timestamp: Date;
  };
}
```

### **베드 시스템 관리 함수**
```typescript
export function initializeBedSystem(
  bedId: string,
  bedName: string,
  totalTiers: number,
  farmId: string
): BedTierSystem {
  const tiers: { [key: number]: any } = {};
  for (let i = 1; i <= totalTiers; i++) {
    tiers[i] = {
      tierNumber: i,
      sensors: [],
      plantCount: 0,
      hasPlants: false
    };
  }

  return {
    bedId,
    bedName,
    farmId,
    totalTiers,
    tiers,
    controlSwitches: [],
    mqttConfig: {
      baseTopic: `farm/${farmId}/bed/${bedId}`,
      qos: 1
    }
  };
}

export function addSensorToTier(
  bedSystem: BedTierSystem,
  tierNumber: number,
  sensorType: string,
  sensorId: string
): BedTierSystem {
  const updatedTiers = { ...bedSystem.tiers };
  const tier = updatedTiers[tierNumber];
  
  if (tier) {
    const newSensor: TierSensor = {
      sensorId,
      sensorType
    };
    
    updatedTiers[tierNumber] = {
      ...tier,
      sensors: [...tier.sensors, newSensor]
    };
  }
  
  return {
    ...bedSystem,
    tiers: updatedTiers
  };
}
```

---

## 🔌 API 구조

### **REST API 엔드포인트**
```typescript
// 농장 관리
GET    /api/farms              // 농장 목록 조회
POST   /api/farms              // 농장 생성
PUT    /api/farms/:id          // 농장 정보 수정
DELETE /api/farms/:id          // 농장 삭제

// 베드 관리
GET    /api/farms/:farmId/beds // 농장별 베드 목록
POST   /api/farms/:farmId/beds // 베드 생성
PUT    /api/beds/:id           // 베드 정보 수정
DELETE /api/beds/:id           // 베드 삭제

// 센서 관리
GET    /api/beds/:bedId/sensors    // 베드 센서 목록
POST   /api/beds/:bedId/sensors    // 센서 추가
DELETE /api/sensors/:id            // 센서 삭제

// 제어 스위치 관리
GET    /api/beds/:bedId/switches   // 베드 스위치 목록
POST   /api/beds/:bedId/switches   // 스위치 추가
PUT    /api/switches/:id/toggle    // 스위치 토글
DELETE /api/switches/:id           // 스위치 삭제

// MQTT 설정
GET    /api/farms/:id/mqtt-config  // MQTT 설정 조회
PUT    /api/farms/:id/mqtt-config  // MQTT 설정 수정
POST   /api/farms/:id/mqtt-test    // MQTT 연결 테스트
```

### **실시간 API (WebSocket)**
```typescript
// 센서 데이터 실시간 스트림
ws://localhost:3000/ws/sensor-data/:farmId/:bedId

// 제어 명령 실시간 스트림
ws://localhost:3000/ws/control-commands/:farmId/:bedId

// 시스템 상태 실시간 스트림
ws://localhost:3000/ws/system-status/:farmId
```

### **API 응답 형식**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

// 성공 응답 예시
{
  "success": true,
  "data": {
    "bedId": "bed_1",
    "bedName": "베드-1",
    "totalTiers": 3,
    "sensors": [...],
    "controlSwitches": [...]
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "requestId": "req_123456"
  }
}

// 오류 응답 예시
{
  "success": false,
  "error": {
    "code": "MQTT_CONNECTION_FAILED",
    "message": "MQTT 서버 연결에 실패했습니다",
    "details": {
      "brokerUrl": "mqtt://invalid-server.com",
      "port": 1883
    }
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "requestId": "req_123456"
  }
}
```

---

## 🔐 보안 및 인증

### **인증 시스템**
```typescript
// JWT 토큰 구조
interface JWTPayload {
  sub: string;        // 사용자 ID
  email: string;      // 이메일
  role: string;       // 역할
  tenant_id: string;  // 소속 농장 ID
  iat: number;        // 발급 시간
  exp: number;        // 만료 시간
}

// 권한 검증 미들웨어
export function requireAuth(requiredRole?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다' }
      });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: '권한이 없습니다' }
        });
      }
      
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: '유효하지 않은 토큰입니다' }
      });
    }
  };
}
```

### **MQTT 보안**
```typescript
// MQTT 연결 보안 설정
const mqttSecurityConfig = {
  // SSL/TLS 연결
  protocol: 'mqtts',  // MQTT over SSL
  port: 8883,         // SSL 포트
  
  // 인증
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  
  // 인증서
  cert: fs.readFileSync('path/to/client.crt'),
  key: fs.readFileSync('path/to/client.key'),
  ca: fs.readFileSync('path/to/ca.crt'),
  
  // 보안 옵션
  rejectUnauthorized: true,
  secureProtocol: 'TLSv1_2_method'
};
```

### **데이터 암호화**
```typescript
// 민감한 데이터 암호화
import crypto from 'crypto';

export function encryptData(data: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptData(encryptedData: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## 📊 모니터링 및 로깅

### **로깅 시스템**
```typescript
import winston from 'winston';

// 로거 설정
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// 구조화된 로깅
export function logSensorData(sensorData: SensorDataMessage) {
  logger.info('센서 데이터 수신', {
    farmId: sensorData.payload.farm_id,
    bedId: sensorData.payload.bed_id,
    sensorType: sensorData.payload.sensor_type,
    value: sensorData.payload.value,
    quality: sensorData.payload.quality,
    timestamp: sensorData.payload.timestamp
  });
}

export function logControlCommand(command: ControlCommandMessage) {
  logger.info('제어 명령 발송', {
    farmId: command.payload.farm_id,
    bedId: command.payload.bed_id,
    switchId: command.payload.switch_id,
    command: command.payload.command,
    userId: command.payload.user_id,
    timestamp: command.payload.timestamp
  });
}
```

### **성능 모니터링**
```typescript
// 시스템 메트릭 수집
interface SystemMetrics {
  timestamp: Date;
  mqttConnections: number;
  activeSensors: number;
  activeSwitches: number;
  messageThroughput: {
    received: number;
    sent: number;
  };
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
}

// 헬스 체크 엔드포인트
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      mqtt: await checkMqttHealth(),
      redis: await checkRedisHealth()
    },
    metrics: await getSystemMetrics()
  };
  
  res.json(health);
});
```

---

## 🚀 배포 및 확장성

### **컨테이너화 (Docker)**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  web-admin:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - MQTT_BROKER_URL=${MQTT_BROKER_URL}
    depends_on:
      - redis
      - mqtt-broker

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mqtt-broker:
    image: eclipse-mosquitto:2.0
    ports:
      - "1883:1883"
      - "8883:8883"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
```

### **확장성 고려사항**
```typescript
// 수평 확장을 위한 로드 밸런싱
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`마스터 프로세스 ${process.pid} 실행 중`);
  
  // 워커 프로세스 생성
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`워커 프로세스 ${worker.process.pid} 종료됨`);
    cluster.fork(); // 새로운 워커 프로세스 생성
  });
} else {
  // 워커 프로세스에서 애플리케이션 실행
  require('./app');
  console.log(`워커 프로세스 ${process.pid} 실행 중`);
}

// Redis를 이용한 세션 공유
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({
    host: 'localhost',
    port: 6379,
    db: 0
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
```

### **환경별 설정**
```typescript
// config/index.ts
interface Config {
  database: {
    url: string;
    ssl: boolean;
  };
  mqtt: {
    brokerUrl: string;
    port: number;
    username?: string;
    password?: string;
  };
  redis: {
    url: string;
  };
  auth: {
    jwtSecret: string;
    sessionSecret: string;
  };
}

const configs: { [key: string]: Config } = {
  development: {
    database: {
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/smartfarm_dev',
      ssl: false
    },
    mqtt: {
      brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost',
      port: parseInt(process.env.MQTT_PORT || '1883')
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET || 'dev-secret',
      sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret'
    }
  },
  
  production: {
    database: {
      url: process.env.DATABASE_URL!,
      ssl: true
    },
    mqtt: {
      brokerUrl: process.env.MQTT_BROKER_URL!,
      port: parseInt(process.env.MQTT_PORT || '8883'),
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD
    },
    redis: {
      url: process.env.REDIS_URL!
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET!,
      sessionSecret: process.env.SESSION_SECRET!
    }
  }
};

export default configs[process.env.NODE_ENV || 'development'];
```

---

## 📝 결론

이 기술 아키텍처는 다음과 같은 특징을 가집니다:

### **장점**
- **모듈화된 설계**: 각 컴포넌트가 독립적으로 동작
- **확장 가능**: 농장 수 증가에 대응 가능
- **실시간 통신**: MQTT를 통한 즉시 반응
- **보안**: 다층 보안 시스템
- **모니터링**: 완전한 시스템 가시성

### **확장 계획**
1. **AI 기반 자동화**: 센서 데이터 기반 자동 제어
2. **모바일 앱**: React Native 기반 모바일 앱
3. **데이터 분석**: 시계열 데이터 분석 및 예측
4. **다국어 지원**: 국제화 (i18n) 지원
5. **API 게이트웨이**: 마이크로서비스 아키텍처로 전환

이 문서는 스마트팜 시스템의 기술적 구현을 위한 가이드입니다. 추가 질문이나 개선 사항이 있으시면 개발팀에 문의해주세요.
