# 🌉 MQTT 브리지 아키텍처 가이드

## 📋 목차
1. [아키텍처 개요](#아키텍처-개요)
2. [MQTT 브리지 서비스](#mqtt-브리지-서비스)
3. [토픽 구조 및 메시지 형식](#토픽-구조-및-메시지-형식)
4. [설정 및 배포](#설정-및-배포)
5. [모니터링 및 로깅](#모니터링-및-로깅)
6. [문제 해결](#문제-해결)

---

## 🎯 아키텍처 개요

### **브리지 기반 통신 구조**
```
┌─────────────────┐    HTTP/API    ┌─────────────────┐
│   웹 애플리케이션  │ ─────────────→ │  Supabase DB    │
│   (브라우저)     │                │  (PostgreSQL)   │
└─────────────────┘                └─────────────────┘
                                           │
                                    Realtime/WebSocket
                                           │
┌─────────────────┐    MQTT         ┌─────────────────┐
│  농장별 MQTT    │ ←─────────────── │  MQTT Bridge    │
│  브로커         │                 │  Service        │
└─────────────────┘                 └─────────────────┘
        │                                    │
   MQTT │                                    │ MQTT
        ▼                                    ▼
┌─────────────────┐                 ┌─────────────────┐
│  하드웨어       │                 │  하드웨어       │
│  (아두이노/     │                 │  (아두이노/     │
│   라즈베리파이)  │                 │   라즈베리파이)  │
└─────────────────┘                 └─────────────────┘
```

### **핵심 설계 원칙**
- **브라우저 보안**: 웹앱은 MQTT에 직접 접속하지 않음
- **중앙화된 관리**: Supabase DB를 통한 통합 데이터 관리
- **농장별 독립성**: 각 농장마다 독립적인 MQTT 브로커
- **확장성**: 새로운 농장 추가 시 브리지 설정만 변경

### **장점**
1. **보안 강화**: 브라우저에서 MQTT 브로커에 직접 접근 불가
2. **운영 단순화**: 웹앱은 DB만 관리하면 됨
3. **확장성**: 농장별 독립적인 MQTT 브로커 운영
4. **안정성**: 브리지 서비스의 자동 재연결 및 오류 처리
5. **모니터링**: 중앙화된 로깅 및 상태 모니터링

---

## 🔧 MQTT 브리지 서비스

### **서비스 구성**
```
mqtt-bridge/
├── src/
│   ├── index.ts              # 메인 진입점
│   ├── loadConfig.ts         # 농장 설정 로드
│   ├── handlers/             # 메시지 핸들러
│   │   ├── registry.ts       # 디바이스 등록 처리
│   │   ├── state.ts          # 상태 업데이트 처리
│   │   ├── telemetry.ts      # 센서 데이터 처리
│   │   └── commandAck.ts     # 명령 응답 처리
│   ├── dispatch/             # 명령 디스패치
│   │   └── commands.ts       # 대기 중인 명령 처리
│   ├── db/                   # 데이터베이스 연동
│   │   ├── upsert.ts         # 데이터 업서트
│   │   └── queries.ts        # 쿼리 실행
│   └── utils/                # 유틸리티
│       ├── batching.ts       # 배치 처리
│       └── logger.ts         # 로깅
└── package.json
```

### **주요 기능**
1. **농장 설정 자동 로드**: Supabase에서 활성 농장 설정 조회
2. **MQTT 연결 관리**: 각 농장별 독립적인 MQTT 클라이언트
3. **메시지 라우팅**: 토픽별 메시지 핸들러 호출
4. **명령 디스패치**: 대기 중인 명령을 MQTT로 발송
5. **자동 재연결**: 연결 끊김 시 자동 재연결
6. **상태 모니터링**: 브리지 및 농장 상태 추적

### **실행 환경**
- **Node.js 18+**
- **TypeScript**
- **Docker 지원**
- **PM2 프로세스 관리**
- **시스템 서비스 등록**

---

## 📡 토픽 구조 및 메시지 형식

### **토픽 패턴**
```
farms/{farmId}/devices/{deviceId}/registry   (retained, QoS1)
farms/{farmId}/devices/{deviceId}/state      (retained, QoS1, LWT)
farms/{farmId}/devices/{deviceId}/telemetry  (QoS1, batch)
farms/{farmId}/devices/{deviceId}/command    (QoS1)
farms/{farmId}/devices/{deviceId}/command/ack(QoS1)
```

### **메시지 형식**

#### **Registry (디바이스 등록)**
```json
{
  "sensors": [
    {
      "key": "temperature",
      "unit": "°C",
      "tier": 1,
      "meta": {
        "calibration_offset": 0.2,
        "precision": 0.1
      }
    },
    {
      "key": "humidity",
      "unit": "%",
      "tier": 1,
      "meta": {}
    }
  ],
  "actuators": [
    {
      "key": "pump_1",
      "type": "pump",
      "meta": {
        "max_flow_rate": "10L/min",
        "power_consumption": "50W"
      }
    }
  ]
}
```

#### **State (상태 업데이트)**
```json
{
  "online": true,
  "last_seen": "2024-09-28T12:00:00.000Z",
  "actuators": {
    "pump_1": {
      "state": "on",
      "last_command": "on",
      "execution_time": 45
    }
  },
  "health": {
    "cpu_usage": 15.2,
    "memory_usage": 45.1,
    "temperature": 35.5
  }
}
```

#### **Telemetry (센서 데이터)**
```json
{
  "readings": [
    {
      "key": "temperature",
      "tier": 1,
      "unit": "°C",
      "ts": "2024-09-28T12:00:00.000Z",
      "value": 25.5
    },
    {
      "key": "humidity",
      "tier": 1,
      "unit": "%",
      "ts": "2024-09-28T12:00:00.000Z",
      "value": 65.2
    }
  ],
  "batch_seq": 1,
  "window_ms": 5000
}
```

#### **Command (제어 명령)**
```json
{
  "command_id": "cmd-uuid-123",
  "command": "on",
  "payload": {
    "duration": 300,
    "intensity": 80
  },
  "timestamp": "2024-09-28T12:00:00.000Z"
}
```

#### **Command ACK (명령 응답)**
```json
{
  "command_id": "cmd-uuid-123",
  "status": "success",
  "detail": "펌프가 성공적으로 켜졌습니다",
  "state": {
    "actuators": {
      "pump_1": {
        "state": "on",
        "last_command": "on"
      }
    }
  }
}
```

---

## ⚙️ 설정 및 배포

### **환경 변수**
```bash
# Supabase 설정
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 암호화 키 (MQTT 인증 정보 암호화)
ENCRYPTION_KEY=your-32-character-secret-key

# 로깅 레벨
NODE_ENV=production
LOG_LEVEL=info
```

### **Docker 배포**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### **PM2 배포**
```json
{
  "apps": [{
    "name": "mqtt-bridge",
    "script": "dist/index.js",
    "instances": 1,
    "exec_mode": "fork",
    "env": {
      "NODE_ENV": "production"
    },
    "error_file": "/var/log/mqtt-bridge/error.log",
    "out_file": "/var/log/mqtt-bridge/out.log",
    "log_file": "/var/log/mqtt-bridge/combined.log",
    "time": true
  }]
}
```

### **시스템 서비스 등록**
```ini
[Unit]
Description=MQTT Bridge Service
After=network.target

[Service]
Type=simple
User=mqtt-bridge
WorkingDirectory=/opt/mqtt-bridge
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## 📊 모니터링 및 로깅

### **헬스 체크 엔드포인트**
```bash
GET /health
```

**응답 예시:**
```json
{
  "status": "healthy",
  "timestamp": "2024-09-28T12:00:00.000Z",
  "services": {
    "database": "connected",
    "mqtt": "connected",
    "redis": "connected"
  },
  "metrics": {
    "active_connections": 3,
    "messages_processed": 1250,
    "error_rate": 0.02
  }
}
```

### **로그 형식**
```json
{
  "timestamp": "2024-09-28T12:00:00.000Z",
  "level": "INFO",
  "message": "MQTT Bridge started successfully",
  "meta": {
    "active_farms": 3,
    "total_connections": 3
  }
}
```

### **메트릭 수집**
- **연결 상태**: 활성 MQTT 연결 수
- **메시지 처리량**: 초당 처리 메시지 수
- **오류율**: 실패한 메시지 비율
- **응답 시간**: 명령 처리 평균 시간
- **농장별 상태**: 각 농장의 연결 상태

### **알림 설정**
- **연결 끊김**: 농장 MQTT 연결 실패 시
- **오류율 증가**: 오류율이 임계값 초과 시
- **디스크 공간**: 로그 파일 크기 모니터링
- **메모리 사용량**: 메모리 사용률 모니터링

---

## 🔧 문제 해결

### **일반적인 문제**

#### **1. MQTT 연결 실패**
```bash
# 로그 확인
tail -f /var/log/mqtt-bridge/error.log

# 연결 테스트
mosquitto_pub -h your-broker.com -p 8883 -t "test" -m "hello"
```

**해결 방법:**
- 브로커 URL 및 포트 확인
- 인증 정보 검증
- 방화벽 설정 확인
- SSL 인증서 검증

#### **2. 데이터베이스 연결 오류**
```bash
# Supabase 연결 테스트
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     https://your-project.supabase.co/rest/v1/farm_mqtt_configs
```

**해결 방법:**
- Supabase URL 및 키 확인
- 네트워크 연결 상태 확인
- RLS 정책 검토

#### **3. 메시지 처리 지연**
**원인:**
- 높은 메시지 볼륨
- 데이터베이스 성능 이슈
- 네트워크 지연

**해결 방법:**
- 배치 크기 조정
- 데이터베이스 인덱스 최적화
- 네트워크 대역폭 확인

### **성능 최적화**

#### **배치 처리 설정**
```typescript
// 텔레메트리 배치 크기 조정
const BATCH_SIZE = 100;
const BATCH_TIMEOUT = 5000; // 5초

// 데이터베이스 연결 풀 설정
const DB_POOL_SIZE = 20;
const DB_IDLE_TIMEOUT = 30000;
```

#### **메모리 관리**
```typescript
// 메시지 큐 크기 제한
const MAX_QUEUE_SIZE = 10000;

// 가비지 컬렉션 최적화
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
```

### **장애 복구**

#### **자동 재시작**
```bash
# PM2 자동 재시작 설정
pm2 start ecosystem.config.js --watch

# 시스템 서비스 자동 재시작
systemctl enable mqtt-bridge
```

#### **백업 및 복구**
```bash
# 설정 백업
pg_dump -h your-db-host -U postgres -d smartfarm > backup.sql

# 로그 로테이션
logrotate -f /etc/logrotate.d/mqtt-bridge
```

---

## 📝 결론

MQTT 브리지 아키텍처는 다음과 같은 장점을 제공합니다:

### **보안**
- 브라우저에서 MQTT 브로커 직접 접근 차단
- 중앙화된 인증 및 권한 관리
- 암호화된 인증 정보 저장

### **확장성**
- 농장별 독립적인 MQTT 브로커
- 수평적 확장 가능한 브리지 서비스
- 모듈화된 메시지 핸들러

### **안정성**
- 자동 재연결 및 오류 처리
- 중복 메시지 방지
- 상태 모니터링 및 알림

### **운영 편의성**
- 중앙화된 로깅 및 모니터링
- 자동화된 배포 및 관리
- 간단한 설정 및 유지보수

이 아키텍처를 통해 안전하고 확장 가능한 스마트팜 시스템을 구축할 수 있습니다.
