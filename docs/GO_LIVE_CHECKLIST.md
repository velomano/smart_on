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

## 🎊 **최종 승인 기준**

- ✅ 모든 체크리스트 통과
- ✅ 24시간 스테이징 soak 성공
- ✅ 모니터링 지표 정상
- ✅ 운영 런북 준비 완료

**통과 시 → Go-Live 승인!** 🚀

