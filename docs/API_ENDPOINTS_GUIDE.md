# API 엔드포인트 가이드

## 🌐 환경별 엔드포인트

### 로컬 개발 환경
- **Web Admin**: `http://localhost:3001`
- **Universal Bridge**: `http://localhost:3000`
- **Supabase**: `https://xxx.supabase.co`

### 운영 환경
- **Web Admin**: `https://admin.smartfarm.app`
- **Universal Bridge**: `https://bridge.smartfarm.app`
- **Supabase**: `https://xxx.supabase.co`

## 📡 주요 API 엔드포인트

### 1. 디바이스 프로비저닝

#### Setup Token 발급
```bash
# 로컬
curl -X POST http://localhost:3000/api/provisioning/claim \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "00000000-0000-0000-0000-000000000001", "farm_id": "43103439-0320-47ce-bc53-95de1e98bc09", "profile_id": "esp32-dht22-v1"}'

# 운영
curl -X POST https://bridge.smartfarm.app/api/provisioning/claim \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "00000000-0000-0000-0000-000000000001", "farm_id": "43103439-0320-47ce-bc53-95de1e98bc09", "profile_id": "esp32-dht22-v1"}'
```

**정상 응답 예시:**
```json
{
  "setup_token": "st_1234567890abcdef",
  "qr_data": "http://localhost:3001/provision?token=st_1234567890abcdef&tenant=00000000-0000-0000-0000-000000000001&farm=43103439-0320-47ce-bc53-95de1e98bc09&profile=esp32-dht22-v1",
  "expires_at": "2025-10-01T13:00:00.000Z"
}
```

#### 디바이스 바인딩
```bash
# 로컬
curl -X POST http://localhost:3000/api/provisioning/bind \
  -H "Content-Type: application/json" \
  -d '{"setup_token": "st_1234567890abcdef", "device_id": "ESP32_001", "device_info": {"firmware": "1.0.0"}}'

# 운영
curl -X POST https://bridge.smartfarm.app/api/provisioning/bind \
  -H "Content-Type: application/json" \
  -d '{"setup_token": "st_1234567890abcdef", "device_id": "ESP32_001", "device_info": {"firmware": "1.0.0"}}'
```

**정상 응답 예시:**
```json
{
  "device_id": "ESP32_001",
  "device_key": "dk_abcdef1234567890",
  "status": "active",
  "created_at": "2025-10-01T12:00:00.000Z"
}
```

### 2. 센서 데이터 전송

#### 텔레메트리 전송
```bash
# 로컬
curl -X POST http://localhost:3000/api/bridge/telemetry \
  -H "Content-Type: application/json" \
  -H "x-device-id: ESP32_001" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -H "x-ts: 1735732800" \
  -H "x-sig: abcdef1234567890" \
  -d '{"temp": 25.5, "hum": 60.2}'

# 운영
curl -X POST https://bridge.smartfarm.app/api/bridge/telemetry \
  -H "Content-Type: application/json" \
  -H "x-device-id: ESP32_001" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -H "x-ts: 1735732800" \
  -H "x-sig: abcdef1234567890" \
  -d '{"temp": 25.5, "hum": 60.2}'
```

**정상 응답 예시:**
```json
{
  "status": "success",
  "message": "Telemetry received",
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### 3. UI 모델 조회

#### 디바이스 UI 모델
```bash
# 로컬
curl http://localhost:3001/api/devices/ESP32_001/ui-model

# 운영
curl https://admin.smartfarm.app/api/devices/ESP32_001/ui-model
```

**정상 응답 예시:**
```json
{
  "device": {
    "id": "ESP32_001",
    "name": "ESP32 + DHT22",
    "type": "sensor",
    "status": "online"
  },
  "profile": {
    "id": "esp32-dht22-v1",
    "name": "ESP32 + DHT22 온습도 센서",
    "version": "1.0.0"
  },
  "uiTemplate": {
    "cards": [
      {
        "span": 12,
        "type": "line-chart",
        "series": ["temp", "hum"]
      },
      {
        "span": 6,
        "type": "gauge",
        "metric": "temp",
        "thresholds": {"warn": 30, "danger": 35}
      }
    ]
  }
}
```

#### 농장 센서 최신값
```bash
# 로컬
curl "http://localhost:3001/api/farms/43103439-0320-47ce-bc53-95de1e98bc09/sensors/latest?deviceId=ESP32_001&keys=temp,hum"

# 운영
curl "https://admin.smartfarm.app/api/farms/43103439-0320-47ce-bc53-95de1e98bc09/sensors/latest?deviceId=ESP32_001&keys=temp,hum"
```

**정상 응답 예시:**
```json
{
  "temp": {
    "value": 25.5,
    "unit": "°C",
    "ts": "2025-10-01T12:00:00.000Z"
  },
  "hum": {
    "value": 60.2,
    "unit": "%",
    "ts": "2025-10-01T12:00:00.000Z"
  }
}
```

## 🔍 스모크 테스트

### 정상 시나리오
```bash
# 1. Setup Token 발급
curl -X POST http://localhost:3000/api/provisioning/claim \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "00000000-0000-0000-0000-000000000001", "farm_id": "43103439-0320-47ce-bc53-95de1e98bc09", "profile_id": "esp32-dht22-v1"}'

# 2. 디바이스 바인딩
curl -X POST http://localhost:3000/api/provisioning/bind \
  -H "Content-Type: application/json" \
  -d '{"setup_token": "st_1234567890abcdef", "device_id": "ESP32_001", "device_info": {"firmware": "1.0.0"}}'

# 3. 텔레메트리 전송
curl -X POST http://localhost:3000/api/bridge/telemetry \
  -H "Content-Type: application/json" \
  -H "x-device-id: ESP32_001" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -H "x-ts: 1735732800" \
  -H "x-sig: abcdef1234567890" \
  -d '{"temp": 25.5, "hum": 60.2}'
```

### 에러 시나리오
```bash
# HMAC 서명 실패 (401)
curl -X POST http://localhost:3000/api/bridge/telemetry \
  -H "Content-Type: application/json" \
  -H "x-device-id: ESP32_001" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -H "x-ts: 1735732800" \
  -H "x-sig: wrong_signature" \
  -d '{"temp": 25.5, "hum": 60.2}'

# Rate Limit 초과 (429)
# 연속으로 100회 요청 시 발생
```

## ⚠️ 주의사항

- **로컬 개발** 시에는 `SIGNATURE_VERIFY_OFF=true`로 설정
- **운영 환경**에서는 반드시 HMAC 서명 검증 활성화
- **Rate Limit**: 디바이스당 초당 10회, 테넌트당 초당 100회
- **Setup Token**: 10분 후 자동 만료
