# 🔗 API 계약서

## 📋 REST API 엔드포인트

### 🌐 기본 정보
- **Base URL**: `https://smart-on.vercel.app/api`
- **인증**: Bearer Token (Supabase JWT)
- **Content-Type**: `application/json`
- **Rate Limiting**: 100 requests/minute per user

## 📊 센서 데이터 수집

### POST /api/ingest/sensor
센서 데이터를 서버에 업로드합니다.

**요청 헤더:**
```http
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
X-API-Key: <pi_api_key>  # Raspberry Pi 전용
```

**요청 본문:**
```json
{
  "pi_id": "pi_001",
  "sensor_data": [
    {
      "sensor_id": "sensor_001",
      "sensor_type": "temperature",
      "value": 25.5,
      "unit": "°C",
      "timestamp": "2025-01-24T13:00:00Z",
      "metadata": {
        "location": "greenhouse_a",
        "accuracy": 0.1
      }
    }
  ]
}
```

**응답:**
```json
{
  "success": true,
  "message": "Sensor data uploaded successfully",
  "uploaded_count": 1,
  "timestamp": "2025-01-24T13:00:01Z"
}
```

## 🎮 제어 명령 큐

### GET /api/control/queue
Pi가 실행할 제어 명령을 가져옵니다.

**요청 헤더:**
```http
Authorization: Bearer <supabase_jwt_token>
X-API-Key: <pi_api_key>
```

**쿼리 파라미터:**
- `pi_id`: Raspberry Pi 식별자 (필수)
- `limit`: 가져올 명령 수 (기본값: 10)

**예시:**
```http
GET /api/control/queue?pi_id=pi_001&limit=5
```

**응답:**
```json
{
  "success": true,
  "commands": [
    {
      "id": "cmd_001",
      "command_type": "pump_control",
      "command_data": {
        "pump_id": "pump_001",
        "action": "start",
        "duration": 30
      },
      "created_at": "2025-01-24T13:00:00Z",
      "priority": 1
    }
  ],
  "total_count": 1
}
```

## ✅ 명령 실행 확인

### POST /api/control/ack
제어 명령 실행 결과를 보고합니다.

**요청 헤더:**
```http
Authorization: Bearer <supabase_jwt_token>
X-API-Key: <pi_api_key>
```

**요청 본문:**
```json
{
  "command_id": "cmd_001",
  "status": "executed",  // "executed", "failed"
  "result": {
    "success": true,
    "pump_status": "running",
    "execution_time": 2.5,
    "error_message": null
  },
  "timestamp": "2025-01-24T13:00:05Z"
}
```

**응답:**
```json
{
  "success": true,
  "message": "Command status updated",
  "command_id": "cmd_001"
}
```

## 📱 Tuya 디바이스 관리

### GET /api/tuya/devices
등록된 Tuya 디바이스 목록을 조회합니다.

**요청 헤더:**
```http
Authorization: Bearer <supabase_jwt_token>
```

**응답:**
```json
{
  "success": true,
  "devices": [
    {
      "id": "device_001",
      "device_id": "tuya_device_id_123",
      "name": "온실 조명",
      "device_type": "light",
      "status": "online",
      "last_seen": "2025-01-24T13:00:00Z",
      "capabilities": ["on_off", "brightness"]
    }
  ]
}
```

### POST /api/tuya/devices/{device_id}/control
Tuya 디바이스를 제어합니다.

**요청 헤더:**
```http
Authorization: Bearer <supabase_jwt_token>
```

**요청 본문:**
```json
{
  "command": {
    "action": "set_brightness",
    "value": 80
  }
}
```

**응답:**
```json
{
  "success": true,
  "message": "Device control command sent",
  "device_id": "device_001",
  "command_id": "cmd_002"
}
```

## 📊 데이터 조회 API

### GET /api/sensors/data
센서 데이터를 조회합니다.

**쿼리 파라미터:**
- `sensor_id`: 센서 ID (선택)
- `pi_id`: Pi ID (선택)
- `start_time`: 시작 시간 (ISO 8601)
- `end_time`: 종료 시간 (ISO 8601)
- `limit`: 결과 수 제한 (기본값: 100)
- `aggregation`: 집계 방식 ("avg", "min", "max", "sum")

**예시:**
```http
GET /api/sensors/data?sensor_id=sensor_001&start_time=2025-01-24T00:00:00Z&aggregation=avg
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "sensor_id": "sensor_001",
      "sensor_name": "온실 온도",
      "sensor_type": "temperature",
      "unit": "°C",
      "aggregated_value": 24.8,
      "data_points": 144,
      "time_range": {
        "start": "2025-01-24T00:00:00Z",
        "end": "2025-01-24T23:59:59Z"
      }
    }
  ]
}
```

## 🔧 시스템 상태 API

### GET /api/system/status
시스템 전체 상태를 조회합니다.

**응답:**
```json
{
  "success": true,
  "system_status": {
    "total_pis": 3,
    "online_pis": 2,
    "total_sensors": 15,
    "active_sensors": 14,
    "total_tuya_devices": 5,
    "online_devices": 4,
    "last_data_update": "2025-01-24T13:00:00Z"
  },
  "pi_status": [
    {
      "pi_id": "pi_001",
      "name": "온실 A",
      "status": "online",
      "last_seen": "2025-01-24T13:00:00Z",
      "sensor_count": 5,
      "active_sensors": 5
    }
  ]
}
```

## ⚠️ 에러 응답 형식

모든 API는 일관된 에러 응답 형식을 사용합니다:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid sensor data format",
    "details": {
      "field": "sensor_type",
      "expected": "string",
      "received": "null"
    }
  },
  "timestamp": "2025-01-24T13:00:00Z"
}
```

### 에러 코드 목록
- `VALIDATION_ERROR`: 요청 데이터 형식 오류
- `AUTHENTICATION_ERROR`: 인증 실패
- `AUTHORIZATION_ERROR`: 권한 부족
- `RESOURCE_NOT_FOUND`: 리소스 없음
- `RATE_LIMIT_EXCEEDED`: 요청 한도 초과
- `INTERNAL_SERVER_ERROR`: 서버 내부 오류

## 📝 데이터 형식 규칙

### 타임스탬프
- 모든 타임스탬프는 ISO 8601 형식 사용
- UTC 시간대 기준
- 예시: `2025-01-24T13:00:00Z`

### 센서 값
- 숫자 값은 소수점 2자리까지 허용
- 단위는 문자열로 명시
- 메타데이터는 JSON 객체로 확장 가능

### Pi ID 형식
- 형식: `pi_[숫자]`
- 예시: `pi_001`, `pi_002`

### 센서 ID 형식
- 형식: `sensor_[숫자]`
- 예시: `sensor_001`, `sensor_002`
