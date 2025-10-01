# Go-Live 체크리스트 — Universal Bridge v2.0

**목표:** 운영 환경 전환 전 30분 검증

**날짜:** 2025-10-01  
**버전:** v2.0.0

---

## ⚙️ **환경 설정 확인**

### **1. 환경 변수** (5분)

```bash
✅ NODE_ENV=production
✅ SIGNATURE_VERIFY_OFF=false  ← 반드시!
✅ BRIDGE_SERVER_URL=https://bridge.smartfarm.app
✅ WEB_ADMIN_URL=https://admin.smartfarm.app
✅ SUPABASE_SERVICE_ROLE_KEY=(실제 키)
✅ LOG_LEVEL=info
```

### **2. 시간 동기화 (NTP)** (2분)

```bash
# 서버에서 확인
curl -sS http://localhost:3000/health | jq .timestamp

# 디바이스(ESP32)에서 확인
configTime(0, 0, "pool.ntp.org");
struct tm timeinfo;
if(!getLocalTime(&timeinfo)){
  Serial.println("❌ NTP 동기화 실패");
}
```

**기준:** 서버-디바이스 시간 차이 < 5초

---

## 🧪 **기능 테스트**

### **3. Rate Limiting** (5분)

```bash
# 테넌트 하이워터마크 테스트 (9,500 → 10,500 req/min)
for i in {1..11000}; do
  curl -sS http://localhost:3000/health &
done
wait

# 기대 결과:
# - 10,000개: 200 OK
# - 1,000개: 429 Too Many Requests
# - X-RateLimit-Remaining: 0
```

**확인:**
- [ ] 429 응답 수신
- [ ] `X-RateLimit-Remaining` 헤더 포함
- [ ] `retry_after: 60` 포함

---

### **4. 키 회전 (Rotate)** (10분)

```bash
# 1. 키 회전 요청
curl -X POST http://localhost:3000/api/provisioning/rotate \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32-TEST-001",
    "current_key": "DK_old_key_here",
    "reason": "scheduled_rotation"
  }'

# 응답:
{
  "new_device_key": "DK_new_key...",
  "grace_period": 3600,
  "expires_at": "2025-10-01T13:00:00Z"
}

# 2. 30분 대기 (Grace Period 중)
# 3. 구 키로 요청 → 여전히 200 OK
# 4. 1시간 경과 후
# 5. 구 키로 요청 → 401 Unauthorized
```

**확인:**
- [ ] 새 키 발급 성공
- [ ] Grace Period 동안 양키 모두 유효
- [ ] 만료 후 구 키 무효

---

### **5. Preflight 체크** (5분)

```bash
# 외부망에서 테스트
curl -w "@curl-format.txt" http://your-server.com/health

# curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:     %{time_connect}\n
time_starttransfer: %{time_starttransfer}\n
time_total:       %{time_total}\n
```

**기준:**
- [ ] p95 < 500ms (외부망)
- [ ] p95 < 100ms (로컬망)
- [ ] WebSocket ping/pong < 30s

---

### **6. ESP32 NVS 저장** (3분)

```cpp
// 재부팅 후 확인
Serial.println("Device ID: " + deviceId);
Serial.println("Device Key: ********** (보안상 숨김)");  ← 실제 키 노출 안 됨!

// NVS 확인
preferences.begin("smartfarm", true);
String savedKey = preferences.getString("device_key", "");
preferences.end();

if (savedKey.length() > 0) {
  Serial.println("✅ NVS에서 Device Key 로드 성공");
} else {
  Serial.println("❌ NVS에 키 없음");
}
```

**확인:**
- [ ] 재부팅 후 Device Key 유지
- [ ] 시리얼 로그에 키 노출 안 됨
- [ ] NVS 읽기 성공

---

## 📊 **모니터링 지표 (6개)**

### **설정 방법**

Supabase Functions 또는 별도 모니터링 서비스:

```typescript
// 1. Ingestion Latency p95
SELECT 
  percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency
FROM (
  SELECT 
    EXTRACT(EPOCH FROM (created_at - ts::timestamptz)) * 1000 as latency_ms
  FROM iot_readings
  WHERE created_at > NOW() - INTERVAL '1 hour'
) as latencies;

// 2. Command ACK p95
SELECT
  percentile_cont(0.95) WITHIN GROUP (ORDER BY roundtrip_ms) as p95_ack
FROM (
  SELECT
    EXTRACT(EPOCH FROM (ack_at - issued_at)) * 1000 as roundtrip_ms
  FROM iot_commands
  WHERE issued_at > NOW() - INTERVAL '1 hour'
    AND ack_at IS NOT NULL
) as commands;

// 3. 401 Rate (인증 실패율)
SELECT
  COUNT(*) FILTER (WHERE status_code = 401) * 100.0 / COUNT(*) as rate_401
FROM api_logs
WHERE created_at > NOW() - INTERVAL '1 hour';

// 4. 429 Rate (Rate Limit 초과율)
SELECT
  COUNT(*) FILTER (WHERE status_code = 429) * 100.0 / COUNT(*) as rate_429
FROM api_logs
WHERE created_at > NOW() - INTERVAL '1 hour';

// 5. WebSocket Disconnects per Hour
SELECT
  COUNT(*) as ws_disconnects
FROM ws_connection_logs
WHERE event_type = 'disconnect'
  AND created_at > NOW() - INTERVAL '1 hour';

// 6. Device Online Ratio (테넌트별)
SELECT
  tenant_id,
  COUNT(*) FILTER (WHERE last_seen_at > NOW() - INTERVAL '5 minutes') * 100.0 / COUNT(*) as online_ratio
FROM iot_devices
GROUP BY tenant_id;
```

---

## 📕 **운영 런북**

### **상황 1: 401 HMAC 실패**

**원인:**
- 시계 오차 > 5분
- 잘못된 Device Key

**해결:**
```bash
1. 디바이스 로그 확인:
   Serial.println("x-ts: " + String(epochTime));
   
2. 서버 시간 확인:
   curl http://server/health | jq .timestamp
   
3. 시간 차이 계산:
   차이 > 5분 → NTP 재동기화
   
4. 개발 모드로 1회 테스트:
   SIGNATURE_VERIFY_OFF=true
   
5. 정상 작동하면 시계 오차 문제 확정
```

---

### **상황 2: 429 Rate Limit 초과**

**원인:**
- 디바이스 전송 주기가 너무 짧음 (< 1초)
- 버그로 무한 루프

**해결:**
```bash
1. X-RateLimit-Remaining 헤더 확인
   
2. 디바이스 전송 주기 확인:
   delay(10000);  // 최소 10초 권장
   
3. 지수 백오프 적용:
   if (httpCode == 429) {
     int retryAfter = 60;  // 응답에서 파싱
     delay(retryAfter * 1000);
   }
```

---

### **상황 3: 명령/ACK 타임아웃**

**원인:**
- WebSocket 연결 끊김
- 디바이스 응답 없음

**해결:**
```bash
1. WebSocket 재연결:
   ws.on('close', () => {
     setTimeout(reconnect, 5000);
   });
   
2. Idempotency-Key 사용:
   headers: { "Idempotency-Key": "cmd_123" }
   
3. 3회 실패 시:
   → Dead-Letter Queue 기록
   → 알림 발송
```

---

### **상황 4: 키 회전 중 혼선**

**원인:**
- 디바이스가 구 키로 계속 요청
- Grace Period 만료

**해결:**
```bash
1. Grace Period 확인 (1시간)
   
2. 디바이스에 새 키 전달:
   - WebSocket 명령으로 푸시
   - 또는 HTTP 응답 헤더로 알림
   
3. 만료 후:
   - 401 응답에 "Key expired, please rotate" 메시지
   - 디바이스가 자동 rotate API 호출
```

---

## 🎯 **권장 릴리스 순서 (안전 배포)**

### **Step 1: 스테이징 (1일)**
- 3대 디바이스 (센서, 릴레이, RS485)
- 24시간 soak 테스트
- 지표 모니터링

### **Step 2: 부분 롤아웃 (3일)**
- 실제 테넌트 10%
- Rate Limit 80%로 시작
- 지표 정상 확인

### **Step 3: 전면 전환 (1주)**
- 100% 롤아웃
- Rate Limit 100%
- 모니터링 대시보드 상시 확인

---

## 🚀 **단기 로드맵 제안**

### **Phase 5a: MQTT 프로덕션화** (선택, 2일)
- TLS 브로커
- 메시지 Idempotency
- 오프라인 버퍼 검증

### **Phase 5b: 동적 UI 시스템** (추천, 2-3일)
- "Auto" 탭 추가
- 템플릿 승격
- 사용자 커스터마이징

### **Phase 6: 네이티브 앱 MVP** (옵션, 2주)
- QR → Bind → BLE 설정 푸시
- Tuya/Shelly 커넥터 1-2개

---

## ✅ **체크리스트**

### **환경**
- [ ] SIGNATURE_VERIFY_OFF=false
- [ ] NTP 시간 동기화 확인
- [ ] 환경 변수 모두 설정

### **기능 테스트**
- [ ] Rate Limit 테스트 (429 응답)
- [ ] 키 회전 테스트 (Grace Period)
- [ ] Preflight 모든 항목 PASS
- [ ] NVS 재부팅 테스트

### **모니터링**
- [ ] 6개 지표 대시보드 구축
- [ ] 알림 설정 (Telegram/Slack)
- [ ] 로그 수집 (Supabase Logs)

### **문서**
- [ ] 운영 런북 작성
- [ ] 릴리스 노트 작성
- [ ] 사용자 가이드 업데이트

---

---

## 🔒 **필수 보강 체크 (운영에서 자주 터지는 것)**

### **인프라/보안**

#### **TLS/도메인 체인**
```bash
# SSL 인증서 만료일 확인
openssl s_client -connect bridge.smartfarm.app:443 -servername bridge.smartfarm.app </dev/null 2>/dev/null | openssl x509 -noout -dates

# 알림 설정 (30일, 7일 전)
- [ ] 30일 전 알림 설정 (Telegram/Slack)
- [ ] 7일 전 긴급 알림
```

#### **CORS 화이트리스트**
```typescript
// apps/universal-bridge/src/protocols/http/server.ts
app.use(cors({
  origin: (origin, callback) => {
    const whitelist = [
      /^https:\/\/[\w-]+\.smartfarm\.app$/,  // 테넌트 도메인
      'http://localhost:3001',  // 개발용
    ];
    
    if (!origin || whitelist.some(pattern => 
      typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-tenant-id', 'x-sig', 'x-ts', 'x-setup-token'],
  maxAge: 300,  // Preflight 캐시 5분
}));
```

#### **로그 마스킹**
```typescript
// 중요: device_key, x-sig, Authorization 마스킹
function maskSensitiveData(log: any) {
  if (log.device_key) log.device_key = '**********';
  if (log.headers?.['x-sig']) log.headers['x-sig'] = '**********';
  if (log.headers?.authorization) log.headers.authorization = '**********';
  return log;
}
```

**체크리스트:**
- [ ] CORS 화이트리스트 설정
- [ ] Preflight 캐시 300s
- [ ] 로그에서 device_key, x-sig 마스킹
- [ ] WAF 룰 적용 (/api/bridge/* IP 평판)
- [ ] SSL 인증서 만료 알림

---

### **데이터베이스/성능**

#### **파티셔닝 & 인덱스**
```sql
-- Covering Index (중요!)
CREATE INDEX IF NOT EXISTS idx_readings_device_key_ts 
ON iot_readings (device_id, key, ts DESC);

-- 파티셔닝 (30일 이후 cold storage)
-- TODO: TimescaleDB 또는 수동 파티션 테이블 생성
```

#### **백업 & 복구 연습**
```bash
# PITR (Point-In-Time Recovery) 리허설
1. Supabase 대시보드 → Database → Backups
2. "Restore to 24h ago" 테스트 (READ ONLY 복구)
3. 데이터 확인 → 롤백
```

#### **롤백 스크립트**
```sql
-- down.sql (Phase 1-4 롤백)
DROP TABLE IF EXISTS device_ui_templates CASCADE;
DROP TABLE IF EXISTS device_registry CASCADE;
DROP TABLE IF EXISTS device_profiles CASCADE;
DROP TABLE IF EXISTS iot_commands CASCADE;
DROP TABLE IF EXISTS iot_readings CASCADE;
DROP TABLE IF EXISTS iot_devices CASCADE;
DROP TABLE IF EXISTS device_claims CASCADE;
```

**체크리스트:**
- [ ] 커버링 인덱스 생성
- [ ] PITR 복구 리허설 완료
- [ ] down.sql 롤백 스크립트 준비
- [ ] 커넥션 풀 한계 확인 (Supabase 대시보드)

---

### **신뢰성/큐잉**

#### **Dead-Letter Queue**
```typescript
// 실패한 메시지 보존
interface DLQMessage {
  id: string;
  device_id: string;
  type: 'telemetry' | 'command' | 'ack';
  payload: any;
  error: string;
  retry_count: number;
  created_at: Date;
}

// DB 테이블
CREATE TABLE IF NOT EXISTS dlq_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  error TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Idempotency (멱등성)**
```typescript
// Idempotency-Key로 중복 방지
const idempotencyCache = new Map<string, any>();

app.use((req, res, next) => {
  const key = req.headers['idempotency-key'];
  if (key && idempotencyCache.has(key)) {
    return res.json(idempotencyCache.get(key));
  }
  next();
});
```

**체크리스트:**
- [ ] DLQ 테이블 생성
- [ ] Idempotency-Key 처리
- [ ] 스파이크 시뮬레이션 (×10 트래픽)

---

### **배포/가용성**

#### **무중단 배포 (WS 드레이닝)**
```bash
# 1. 새 인스턴스 시작
# 2. Health check 통과 대기
# 3. 구 인스턴스에 SIGTERM 전송
# 4. WS 연결 드레이닝 (30초)
# 5. 종료

process.on('SIGTERM', async () => {
  console.log('Draining WebSocket connections...');
  wss.clients.forEach(ws => {
    ws.send(JSON.stringify({ type: 'server_shutdown', reconnect_in: 5 }));
    ws.close();
  });
  setTimeout(() => process.exit(0), 30000);
});
```

#### **Feature Flags**
```typescript
// 환경 변수로 제어
const FEATURE_FLAGS = {
  HMAC_ENFORCED: process.env.HMAC_ENFORCED === 'true',
  PREFLIGHT_STRICT: process.env.PREFLIGHT_STRICT === 'true',
  WS_FALLBACK_HTTP: process.env.WS_FALLBACK_HTTP === 'true',
};
```

**체크리스트:**
- [ ] WS 드레이닝 구현
- [ ] Feature Flags 설정
- [ ] SLO 정의 (99.5% uptime)
- [ ] Error Budget 산정

---

### **관측/모니터링**

#### **알람 임계치**
```yaml
# 모니터링 알람 설정
alerts:
  - name: high_401_rate
    condition: 401_rate > 2%
    severity: warning
    
  - name: high_429_rate
    condition: 429_rate > 5%
    severity: warning
    
  - name: ws_disconnect_spike
    condition: ws_disconnects > 30/hour
    severity: critical
    
  - name: low_device_online
    condition: device_online_ratio < 90%
    severity: critical
```

#### **추적 상관키 (Correlation ID)**
```typescript
// 모든 요청에 x-request-id 추가
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('x-request-id', req.id);
  next();
});

// 로그에 포함
console.log(`[${req.id}] ${message}`);
```

**체크리스트:**
- [ ] 알람 임계치 설정 (6개 지표)
- [ ] 합성 모니터링 (5분 간격)
- [ ] x-request-id 추가
- [ ] 로그/메트릭 상관키 통합

---

### **펌웨어/현장**

#### **ESP32 펌웨어 롤백**
```cpp
// OTA 실패 시 자동 롤백
#include <Update.h>

void performOTA() {
  // NVS에 현재 버전 백업
  preferences.putString("fw_version_backup", FW_VERSION);
  
  // OTA 시도
  if (updateSuccess) {
    preferences.putString("fw_version_current", NEW_VERSION);
  } else {
    // 롤백
    esp_ota_set_boot_partition(previous_partition);
    ESP.restart();
  }
}
```

#### **NTP 실패 대안**
```cpp
// 서버 시각 허용 (부팅 시 1회)
if (!ntpSynced && bootCount == 1) {
  // 서버 응답의 Date 헤더 사용
  String serverTime = http.header("Date");
  useServerTime(serverTime);
  Serial.println("⚠️ NTP 실패, 서버 시각 사용");
}
```

**체크리스트:**
- [ ] OTA 롤백 로직 구현
- [ ] NTP 실패 대안 구현
- [ ] 100회 재부팅 스트레스 테스트

---

## 🔴 **레드팀 시나리오 (보안 테스트)**

### **1. Replay Attack**
```bash
# 같은 서명으로 3회 전송
for i in {1..3}; do
  curl -H "x-sig: SAME_SIG" -H "x-ts: SAME_TS" ...
done

# 기대: 409 Conflict 또는 멱등 무시
```

### **2. 대용량 Payload**
```bash
# 1,000개 readings 전송
readings=$(for i in {1..1000}; do echo '{"key":"temp","value":25}'; done)
curl -d "{\"readings\":[$readings]}" ...

# 기대: 413 Request Entity Too Large 또는 배치 분할
```

### **3. WebSocket 폭주**
```bash
# 1디바이스가 10Hz로 전송 (초당 10개)
for i in {1..100}; do
  wscat -c ws://localhost:8080/ws/DEVICE -x '{"type":"telemetry",...}'
  sleep 0.1
done

# 관찰: CPU/RAM, Rate Limit 작동
```

### **4. 테넌트 혼동**
```bash
# 다른 테넌트의 키로 요청
curl -H "x-tenant-id: OTHER_TENANT" -H "x-sig: OTHER_KEY" ...

# 기대: 403 Forbidden (RLS 차단)
```

### **5. QR 만료/탈취**
```bash
# 만료된 Setup Token으로 Bind
curl -H "x-setup-token: EXPIRED_TOKEN" ...

# 기대: 401 + "Token expired, please generate new QR"
```

**체크리스트:**
- [ ] Replay Attack 방어 확인
- [ ] 대용량 Payload 처리 (1,000개)
- [ ] WS 폭주 시 Rate Limit
- [ ] 테넌트 RLS 차단 확인
- [ ] QR 만료 친절한 에러

---

## 🎊 **최종 승인 기준**

### **필수 체크**
- ✅ 모든 환경 변수 설정
- ✅ 6가지 기능 테스트 통과
- ✅ 보안 추가 항목 (CORS, 마스킹, WAF)
- ✅ DB 백업/복구 리허설
- ✅ 무중단 배포 준비
- ✅ 6개 지표 모니터링 대시보드
- ✅ 레드팀 시나리오 5개 통과
- ✅ 24시간 스테이징 soak 성공

### **선택 체크**
- ⏳ 합성 모니터링 (외부 2개 리전)
- ⏳ Feature Flags 구현
- ⏳ DLQ 테이블 생성
- ⏳ 파티셔닝 설정

**통과 시 → Go-Live 승인!** 🚀

