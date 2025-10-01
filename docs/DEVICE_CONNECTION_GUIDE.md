# IoT 디바이스 연결 가이드

**목적:** ESP32 등 IoT 디바이스를 Universal Bridge에 연결하는 실전 가이드

**대상:** ESP32 + DHT22, ESP32 + 2채널 릴레이

**소요 시간:** 15-30분

---

## ⚡ **TL;DR (3분 요약)**

### **5단계 빠른 시작**

- [ ] **1단계:** 하드웨어 준비 (ESP32, DHT22, USB 케이블)
- [ ] **2단계:** 펌웨어 업로드 (Connect Wizard 또는 템플릿)
- [ ] **3단계:** 서버 Health 확인 (`curl http://localhost:3000/health`)
- [ ] **4단계:** 시리얼 모니터에서 첫 텔레메트리 확인 (✅ 200 OK)
- [ ] **5단계:** 웹 대시보드에서 UI 자동 생성 확인 (`/farms/[id]`)

### **핵심 포인트**
- **HMAC 서명:** `deviceId|timestamp|body` → HMAC-SHA256
- **오류 대응:** 401 (NTP 재동기), 429 (전송 주기 증가), 404 (Bind 재수행)
- **안전 주의:** AC 릴레이는 절연 필수, DHT22는 풀업 저항 4.7kΩ

---

## 📋 **사전 준비**

### **1. 하드웨어**
- ESP32 개발 보드
- DHT22 온습도 센서 (Step 1)
- 2채널 릴레이 모듈 (Step 2)
- USB 케이블, 점퍼선

### **2. 소프트웨어 (Known-good 버전)**

| 항목 | 버전 | 비고 |
|------|------|------|
| Arduino IDE | 1.8.19+ | 2.x도 가능 |
| ESP32 보드 패키지 | 2.0.11 | Arduino Board Manager |
| DHT sensor library | 1.4.4 | Adafruit DHT |
| ArduinoJson | 6.21.3 | |
| mbedtls | 기본 포함 | ESP32 Core |

**라이브러리 설치:**
```
Tools → Manage Libraries
- "DHT sensor library" by Adafruit
- "ArduinoJson" by Benoit Blanchon
```

### **3. 서버 상태 확인**
```bash
# Universal Bridge 서버 실행 중인지 확인
curl http://localhost:3000/health

# 응답 예시:
# {"status":"healthy","timestamp":"2025-10-01T12:00:00Z"}
```

---

## 🔌 **Step 1 — ESP32 + DHT22 연결 (HTTP)**

### **1-1. Device Profile 할당**

**Supabase SQL Editor에서 실행:**

```sql
-- 먼저 디바이스 UUID 확인
SELECT id, device_id FROM iot_devices WHERE device_id = 'YOUR-DEVICE-ID';

-- Profile 할당
UPDATE iot_devices 
SET profile_id = 'esp32-dht22-v1' 
WHERE device_id = 'YOUR-DEVICE-ID';

-- 확인
SELECT id, device_id, profile_id FROM iot_devices WHERE device_id = 'YOUR-DEVICE-ID';
```

### **1-2. 펌웨어 업로드**

**방법 A: Connect Wizard 사용** (추천 ⭐)
1. 웹 어드민 → `/connect` 접속
2. "ESP32 + DHT22" 선택
3. WiFi 정보 입력
4. 생성된 `.ino` 파일 다운로드
5. Arduino IDE에서 열기
6. **WiFi 정보 수정** (SSID, PASSWORD)
7. 업로드 (Ctrl+U)

**방법 B: 템플릿 사용**
```cpp
// packages/device-sdk/arduino/SmartFarm_HTTP.ino 사용
// 다음 부분만 수정:

const char* ssid = "YOUR_WIFI_SSID";           // WiFi SSID
const char* password = "YOUR_WIFI_PASSWORD";   // WiFi 비밀번호
const char* device_id = "ESP32-DHT22-001";     // 디바이스 ID
const char* device_key = "DK_your_key_here";   // Bind 후 받은 키
```

### **1-3. 시리얼 모니터 확인**

**기대 출력:**
```
🚀 SmartFarm Client 시작
📶 WiFi 연결 중...
✅ WiFi 연결 성공! IP: 192.168.0.100
🕐 NTP 시간 동기화 중...
✅ NTP 동기화 성공: 2025-10-01T12:00:00Z
📊 DHT22 센서 읽기...
   온도: 24.5°C
   습도: 65.0%
📤 텔레메트리 전송 중...
✅ 텔레메트리 전송 성공 (200 OK)
```

### **1-4. 웹 어드민 확인**

**방법 1: UI Model API 확인**
```bash
curl http://localhost:3001/api/devices/YOUR-DEVICE-UUID/ui-model
```

**응답 예시:**
```json
{
  "device_id": "ESP32-DHT22-001",
  "profile": {
    "id": "esp32-dht22-v1",
    "name": "ESP32 + DHT22 온습도 센서"
  },
  "model": {
    "sensors": [
      {"key": "temperature", "label": "온도", "unit": "°C"},
      {"key": "humidity", "label": "습도", "unit": "%"}
    ]
  },
  "template": {
    "cards": [
      {"type": "line-chart", "series": ["temp", "hum"]},
      {"type": "gauge", "metric": "temp"},
      {"type": "gauge", "metric": "hum"}
    ]
  }
}
```

**방법 2: 웹 브라우저 확인**
1. `/farms/[id]` 접속
2. Dynamic UI에서 "ESP32 + DHT22" 디바이스 확인
3. **Line Chart + Gauge 2개** 자동 생성 확인
4. 온도/습도 데이터 업데이트 확인

### **1-5. 합격 기준** ✅

- [ ] 1분 내 첫 텔레메트리 수신
- [ ] 10초 간격으로 데이터 수집
- [ ] p95 ingest latency < 2s
- [ ] 온도/습도 값이 정상 범위 (-40~80°C, 0~100%)
- [ ] 웹 대시보드에 자동 UI 생성

---

## ⚙️ **Step 2 — ESP32 + 2채널 릴레이 제어 (WebSocket 권장)**

### **2-1. Device Profile 할당**

```sql
UPDATE iot_devices 
SET profile_id = 'esp32-relay2ch-v1' 
WHERE device_id = 'YOUR-RELAY-DEVICE-ID';
```

### **2-2. 펌웨어 업로드**

**WebSocket 버전 사용:**
```cpp
// packages/device-sdk/arduino/SmartFarm_WebSocket.ino (향후 제공)
// 또는 Connect Wizard에서 "ESP32 + 2채널 릴레이" 선택
```

**주요 설정:**
```cpp
const char* ws_server = "ws://192.168.0.XXX:8080";  // WebSocket 서버
const char* device_id = "ESP32-RELAY-001";
const char* device_key = "DK_your_key_here";
```

### **2-3. 명령 푸시 테스트**

**REST API로 명령 전송:**
```bash
curl -X POST http://localhost:3000/api/bridge/commands \
  -H 'Content-Type: application/json' \
  -d '{
    "device_id": "ESP32-RELAY-001",
    "type": "relay.on",
    "payload": {
      "channel": 1,
      "state": "on",
      "duration": 5
    },
    "idempotency_key": "cmd_test_1"
  }'
```

**기대 응답:**
```json
{
  "success": true,
  "command_id": "cmd_123",
  "status": "pending"
}
```

**시리얼 모니터 확인:**
```
📥 명령 수신: relay.on
   채널: 1
   상태: on
   지속 시간: 5초
🔌 릴레이 채널 1 ON
⏱️  5초 후 자동 OFF
📤 ACK 전송: success
```

### **2-4. Safety Rules 자동 적용 확인**

**테스트 1: Cooldown (5초 대기)**
```bash
# 첫 번째 명령
curl -X POST ... -d '{"channel":1,"state":"on"}'

# 즉시 두 번째 명령 (< 5초)
curl -X POST ... -d '{"channel":1,"state":"on"}'

# 기대: 두 번째 명령 거부 (Cooldown)
# {"error":"Cooldown active, please wait 3s"}
```

**테스트 2: Interlock (채널 1, 2 동시 작동 방지)**
```bash
# 채널 1 ON
curl -X POST ... -d '{"channel":1,"state":"on"}'

# 채널 2 ON 시도 (채널 1이 ON 상태)
curl -X POST ... -d '{"channel":2,"state":"on"}'

# 기대: 거부 (Interlock)
# {"error":"Interlock: Channel 1 is active"}
```

**테스트 3: Max Duration (300초 제한)**
```bash
# 300초 초과 요청
curl -X POST ... -d '{"channel":1,"state":"on","duration":400}'

# 기대: 거부 또는 300초로 자동 제한
# {"warning":"Duration limited to 300s"}
```

### **2-5. 웹 어드민 확인**

1. `/farms/[id]` 접속
2. "ESP32 + 2채널 릴레이" 디바이스 확인
3. **Actuator Panel** 자동 생성 확인
4. 각 채널별 ON/OFF/Toggle 버튼 확인
5. 버튼 클릭 → ACK 수신 확인 (< 2s)
6. UI 상태 반영 확인

### **2-6. 합격 기준** ✅

- [ ] WebSocket 연결 성공 (🟢 온라인)
- [ ] 명령 전송 → ACK ≤ 2s
- [ ] Safety Rules 작동 (Cooldown, Interlock, Max Duration)
- [ ] UI에서 상태 반영
- [ ] 재부팅 후 자동 재연결

---

## 🧪 **Step 3 — 스모크 테스트 (짧고 강력)**

### **3-1. HMAC 서명 검증**

**테스트 1: 정상 서명 (200 OK)**
```bash
# 3회 연속 전송
for i in {1..3}; do
  curl -X POST http://localhost:3000/api/bridge/telemetry \
    -H "x-device-id: ESP32-DHT22-001" \
    -H "x-tenant-id: YOUR-TENANT-ID" \
    -H "x-sig: VALID_SIGNATURE" \
    -H "x-ts: $(date +%s)" \
    -d '{"readings":[...]}'
done

# 기대: 모두 200 OK
```

**테스트 2: 시계 오차 (401)**
```bash
# 현재 시각 + 10분
TS_FUTURE=$(($(date +%s) + 600))

curl -X POST http://localhost:3000/api/bridge/telemetry \
  -H "x-ts: $TS_FUTURE" \
  ...

# 기대: 401 Unauthorized
# {"error":"Timestamp out of window (±300s)"}
```

### **3-2. Rate Limiting**

```bash
# 61 req/min 전송 (제한: 60 req/min)
for i in {1..61}; do
  curl -sS http://localhost:3000/health &
done
wait

# 기대: 마지막 요청 429 Too Many Requests
# X-RateLimit-Remaining: 0
```

### **3-3. WebSocket 재연결**

1. ESP32 재부팅 (RST 버튼)
2. 시리얼 모니터 확인:
   ```
   🔄 재부팅...
   📶 WiFi 재연결...
   🔌 WebSocket 재연결...
   ✅ 재연결 성공 (10s 이내)
   ```
3. 재등록(Bind) 없이 정상 작동 확인

### **3-4. 스모크 테스트 자동화**

```bash
# 자동 스크립트 실행
node test-production-smoke.js

# 또는
node test-redteam-auto.js
```

---

## 🩺 **문제 해결 가이드**

### **문제 1: 데이터가 안 뜸**

**증상:**
- 웹 대시보드에 데이터 표시 안 됨
- Live Log에 데이터 없음

**해결:**
1. **Live Log 확인** (`/connect` → Live Log)
   ```
   ✅ 수신: schema: telemetry.v1
   ✅ 데이터: {"readings":[...]}
   ```
   - 없다면: WiFi/Bind 문제
   - 있다면: DB 권한/RLS 문제

2. **WiFi 연결 확인**
   ```cpp
   Serial.println(WiFi.status());  // WL_CONNECTED (3)
   Serial.println(WiFi.localIP()); // 192.168.0.XXX
   ```

3. **Bind 확인**
   ```sql
   SELECT * FROM iot_devices WHERE device_id = 'YOUR-DEVICE-ID';
   -- device_key가 있어야 함
   ```

4. **RLS 정책 확인**
   ```sql
   SELECT * FROM iot_readings 
   WHERE device_uuid = 'YOUR-DEVICE-UUID' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

### **문제 2: ACK가 안 옴**

**증상:**
- 명령 전송 후 응답 없음
- 시리얼 모니터에 명령 미수신

**해결:**
1. **WebSocket 연결 상태 확인**
   - 웹 대시보드에서 🟢 (온라인) 확인
   - 없으면: WS 연결 문제

2. **폴백 경로 테스트 (HTTP 폴링)**
   ```cpp
   // 주기적으로 GET 요청
   GET http://server/api/commands?device_id=XXX
   ```

3. **방화벽 확인**
   ```bash
   # WebSocket 포트 열림 확인
   telnet localhost 8080
   ```

### **문제 3: HMAC 실패 (401)**

**증상:**
- 텔레메트리 전송 시 401 Unauthorized
- 로그: "HMAC signature mismatch"

**해결:**
1. **NTP 동기화 확인**
   ```cpp
   Serial.println("NTP 동기화 중...");
   configTime(0, 0, "pool.ntp.org");
   struct tm timeinfo;
   if(getLocalTime(&timeinfo)) {
     Serial.println("✅ NTP 성공");
   }
   ```

2. **시간 차이 확인**
   ```bash
   # 디바이스 시간
   echo "Device: $(디바이스 시리얼 출력)"
   
   # 서버 시간
   curl http://localhost:3000/health | jq .timestamp
   
   # 차이가 ±300s 이내여야 함
   ```

3. **Device Key 확인**
   ```sql
   SELECT device_id, device_key FROM iot_devices WHERE device_id = 'XXX';
   -- device_key가 펌웨어와 일치해야 함
   ```

---

## 📊 **체크리스트**

### **DHT22 (Step 1)**
- [ ] Device Profile 할당
- [ ] 펌웨어 업로드
- [ ] WiFi 연결 성공
- [ ] NTP 동기화 성공
- [ ] 첫 텔레메트리 수신 (< 1분)
- [ ] 10초 간격 데이터 수집
- [ ] 웹 대시보드 UI 자동 생성
- [ ] Line Chart + Gauge 2개 표시

### **2채널 릴레이 (Step 2)**
- [ ] Device Profile 할당
- [ ] 펌웨어 업로드
- [ ] WebSocket 연결 성공
- [ ] 명령 전송 → ACK (< 2s)
- [ ] Cooldown 작동 (5초)
- [ ] Interlock 작동 (채널 1, 2)
- [ ] Max Duration 작동 (300초)
- [ ] 웹 Actuator Panel 표시

### **스모크 테스트 (Step 3)**
- [ ] HMAC 정상 (200 OK)
- [ ] HMAC 실패 (401)
- [ ] Rate Limiting (429)
- [ ] WebSocket 재연결 (< 10s)

---

## 🎯 **다음 단계**

### **새 디바이스 추가**
1. Device Profile 생성 (`esp32-soil-moisture-v1` 등)
2. Supabase SQL에 등록
3. 펌웨어 템플릿 작성
4. Connect Wizard에 추가

### **모니터링 강화**
1. 합성 모니터링 설정 (`test-synthetic-monitor.js`)
2. 대시보드 지표 추가
3. 알람 설정 (Telegram/Slack)

### **프로덕션 배포**
1. Go-Live 체크리스트 실행
2. 24시간 스테이징 soak 테스트
3. 부분 롤아웃 (10%)
4. 전면 Go-Live

---

## 📞 **지원**

문제 발생 시:
1. 시리얼 모니터 로그 확인
2. Live Log 확인 (`/connect`)
3. Supabase Logs 확인
4. 이 문서의 "문제 해결 가이드" 참조

---

## 📘 **헤더/서명 표준**

### **필수 HTTP 헤더**

| 헤더 | 설명 | 예시 |
|------|------|------|
| `x-device-id` | 디바이스 고유 ID | `ESP32-DHT22-001` |
| `x-tenant-id` | 테넌트 ID | `00000000-0000-0000-0000-000000000001` |
| `x-ts` | Unix Timestamp (초) | `1730419200` |
| `x-sig` | HMAC-SHA256 서명 (hex) | `5a9f...` (64자) |

### **HMAC-SHA256 서명 계산 규칙**

```
stringToSign = deviceId + "|" + timestamp + "|" + body
x-sig = HMAC_SHA256_HEX(device_key, stringToSign)
```

**예시:**
```javascript
deviceId = "ESP32-DHT22-001"
timestamp = "1730419200"
body = '{"readings":[{"key":"temp","value":24.5}]}'

stringToSign = "ESP32-DHT22-001|1730419200|{\"readings\":[{\"key\":\"temp\",\"value\":24.5}]}"
x-sig = HMAC-SHA256(device_key, stringToSign)
```

### **Arduino (ESP32) HMAC 생성 코드**

```cpp
#include "mbedtls/md.h"

String hmacSHA256(const String& key, const String& msg) {
  byte hmac[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t mdType = MBEDTLS_MD_SHA256;
  
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(mdType), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)key.c_str(), key.length());
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)msg.c_str(), msg.length());
  mbedtls_md_hmac_finish(&ctx, hmac);
  mbedtls_md_free(&ctx);
  
  char out[65];
  for (int i = 0; i < 32; i++) {
    sprintf(out + 2 * i, "%02x", hmac[i]);
  }
  out[64] = '\0';
  
  return String(out);
}

// 사용 예시
String deviceKey = "DK_your_device_key_here";
String deviceId = "ESP32-DHT22-001";
unsigned long ts = getTime();  // NTP로 받은 epoch time
String body = "{\"readings\":[...]}";

String message = deviceId + "|" + String(ts) + "|" + body;
String signature = hmacSHA256(deviceKey, message);
```

---

## ❌ **오류 코드 표 (현장 처방)**

| 코드 | 원인 | 현장 조치 |
|------|------|-----------|
| **401** | HMAC 서명 오류 또는 시간 오차 (±300s 초과) | 1. NTP 재동기화 확인<br>2. `device_key` 일치 확인<br>3. 서버 `/health` 시간과 비교 |
| **403** | 테넌트/RLS 권한 위반 | 1. `tenant_id` 확인<br>2. 디바이스 소유권 확인<br>3. RLS 정책 점검 |
| **404** | Bind 미완료 또는 장치 미등록 | 1. QR 코드 재발급<br>2. Bind API 재수행<br>3. `iot_devices` 테이블 확인 |
| **409** | Replay Attack (중복 `x-ts`) | 1. Timestamp 갱신<br>2. Idempotency-Key 확인 |
| **413** | 페이로드 과대 (Request Entity Too Large) | 1. `readings` 배열 100개 이하로 축소<br>2. 전송 배치 분할<br>3. 전송 주기 증가 (10s → 30s) |
| **429** | Rate Limiting 초과 (60 req/min) | 1. 지수 백오프 적용 (최대 60s)<br>2. 전송 주기 상향 (10s → 30s)<br>3. `X-RateLimit-Remaining` 헤더 확인 |

---

## 🧪 **스모크 테스트 명령어 (복붙용)**

### **1. 정상 텔레메트리 (200 OK)**

```bash
curl -X POST http://localhost:3000/api/bridge/telemetry \
  -H "Content-Type: application/json" \
  -H "x-device-id: ESP32-DHT22-001" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -H "x-ts: $(date +%s)" \
  -H "x-sig: <valid_signature>" \
  -d '{
    "schema": "telemetry.v1",
    "readings": [
      {"key": "temp", "value": 24.5, "unit": "C", "ts": "2025-10-01T12:00:00Z"}
    ]
  }'

# 기대: 200 OK
```

### **2. 시간 오차 테스트 (401)**

```bash
# 현재 시각 + 10분 (600초)
FUT=$(( $(date +%s) + 600 ))

curl -X POST http://localhost:3000/api/bridge/telemetry \
  -H "Content-Type: application/json" \
  -H "x-device-id: ESP32-DHT22-001" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -H "x-ts: $FUT" \
  -H "x-sig: <signature_for_future_ts>" \
  -d '{
    "schema": "telemetry.v1",
    "readings": [{"key": "temp", "value": 24.5, "unit": "C"}]
  }'

# 기대: 401 Unauthorized
# {"error": "Timestamp out of window (±300s)"}
```

### **3. Rate Limiting 테스트 (429)**

```bash
# 61개 요청 (제한: 60 req/min)
for i in {1..61}; do
  curl -sS http://localhost:3000/health &
done
wait

# 기대: 마지막 요청 429 Too Many Requests
# X-RateLimit-Remaining: 0
```

---

## 📱 **QR 코드 페이로드 스펙 (v1)**

### **QR JSON 구조**

```json
{
  "v": 1,
  "bridge": {
    "base_url": "https://bridge.smartfarm.app",
    "proto": "http"
  },
  "ctx": {
    "tenant_id": "tnt_123",
    "farm_id": "farm_456"
  },
  "setup": {
    "setup_token": "st_abc...",
    "exp": 1730419200
  },
  "device": {
    "profile_id": "esp32-dht22-v1",
    "hint_name": "Greenhouse-1"
  }
}
```

### **필드 설명**

| 필드 | 설명 | 필수 |
|------|------|------|
| `v` | 스펙 버전 | ✅ |
| `bridge.base_url` | Bridge 서버 URL | ✅ |
| `bridge.proto` | 프로토콜 (`http`, `ws`) | ✅ |
| `ctx.tenant_id` | 테넌트 ID | ✅ |
| `ctx.farm_id` | 농장 ID | ✅ |
| `setup.setup_token` | Setup Token (10분 TTL) | ✅ |
| `setup.exp` | 만료 시각 (Unix Timestamp) | ✅ |
| `device.profile_id` | Device Profile ID | ⏳ |
| `device.hint_name` | 디바이스 이름 힌트 | ⏳ |

---

## ⚡ **배선 및 안전 주의사항**

### **ESP32 + DHT22 배선**

```
DHT22       ESP32
  VCC  →    3.3V
  DATA →    GPIO 4 (+ 4.7kΩ 풀업 저항 to 3.3V)
  GND  →    GND
```

**주의:**
- ✅ **풀업 저항 필수:** 4.7kΩ ~ 10kΩ (DATA → 3.3V)
- ✅ **전원:** 3.3V 또는 5V (데이터 핀은 3.3V 권장)
- ✅ **케이블 길이:** 20m 이하

### **ESP32 + 2채널 릴레이 배선**

```
릴레이 모듈    ESP32
  VCC  →      5V (또는 3.3V, 모듈 사양 확인)
  GND  →      GND
  IN1  →      GPIO 5
  IN2  →      GPIO 18
  
릴레이 접점
  COM  →      부하 공통
  NO   →      Normally Open (평상시 열림)
  NC   →      Normally Closed (평상시 닫힘)
```

**안전 주의사항:**

⚠️ **AC 취급 시 필수 조치:**
1. **절연 장갑/공구 사용**
2. **작업 전 차단기 내리기**
3. **접지 확인** (ESP32 GND ↔ 릴레이 GND)
4. **JD-VCC 분리형:** 점퍼 설정 확인 (광절연)

⚠️ **릴레이 접점 확인:**
- **NO (Normally Open):** 평상시 열림, 신호 HIGH 시 닫힘
- **NC (Normally Closed):** 평상시 닫힘, 신호 HIGH 시 열림
- **COM (Common):** 공통 단자

---

## 🔌 **WebSocket 프레임 예시**

### **1. 장치 → 서버 (텔레메트리)**

```json
{
  "type": "telemetry",
  "data": {
    "ts": "2025-10-01T12:00:00Z",
    "readings": [
      {"key": "temp", "value": 24.6, "unit": "C"},
      {"key": "hum", "value": 65.2, "unit": "%"}
    ]
  }
}
```

### **2. 서버 → 장치 (명령 푸시)**

```json
{
  "id": "cmd_123",
  "type": "relay.set",
  "payload": {
    "channel": 1,
    "state": "on",
    "duration": 5
  }
}
```

### **3. 장치 → 서버 (ACK)**

```json
{
  "type": "ack",
  "data": {
    "command_id": "cmd_123",
    "status": "success",
    "detail": "Relay channel 1 ON for 5s"
  }
}
```

---

## 🔗 **부록: RS485 (Modbus) → ESP32 게이트웨이 패턴**

### **아키텍처**

```
┌─────────────────────────────────────────────────┐
│  Modbus 센서 (RS485)                            │
│  - 토양 습도, pH, EC, 온도 등                    │
└────────────┬────────────────────────────────────┘
             │ RS485 (Modbus RTU)
             ↓
┌─────────────────────────────────────────────────┐
│  ESP32 게이트웨이                                │
│  - Modbus Master                                │
│  - 센서 폴링 (10초마다)                          │
│  - 데이터 집계                                   │
└────────────┬────────────────────────────────────┘
             │ WiFi
             │ HTTP/WebSocket
             ↓
┌─────────────────────────────────────────────────┐
│  Universal Bridge                               │
│  - Telemetry 수신                               │
│  - Dynamic UI 자동 생성                          │
└─────────────────────────────────────────────────┘
```

### **ESP32 코드 패턴**

```cpp
#include <ModbusMaster.h>

ModbusMaster node;

void setup() {
  Serial2.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);  // RS485
  node.begin(1, Serial2);  // Slave ID = 1
}

void loop() {
  // 1. Modbus 센서 폴링
  uint8_t result = node.readHoldingRegisters(0x0000, 2);
  
  if (result == node.ku8MBSuccess) {
    float soilMoisture = node.getResponseBuffer(0) / 10.0;
    float soilTemp = node.getResponseBuffer(1) / 10.0;
    
    // 2. Universal Bridge로 전송
    sendTelemetry({
      {"key": "soil_moisture", "value": soilMoisture, "unit": "%"},
      {"key": "soil_temp", "value": soilTemp, "unit": "C"}
    });
  }
  
  delay(10000);  // 10초 대기
}
```

### **Device Profile 예시**

```json
{
  "id": "esp32-modbus-gateway-v1",
  "name": "ESP32 + Modbus 센서 게이트웨이",
  "capabilities": {
    "sensors": [
      {"key": "soil_moisture", "label": "토양 습도", "unit": "%"},
      {"key": "soil_temp", "label": "토양 온도", "unit": "°C"},
      {"key": "soil_ph", "label": "토양 pH", "unit": "pH"},
      {"key": "soil_ec", "label": "토양 EC", "unit": "mS/cm"}
    ]
  }
}
```

---

**마지막 업데이트:** 2025-10-01  
**버전:** 2.0.0 (보강 완료)

