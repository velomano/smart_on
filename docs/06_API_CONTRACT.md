# 🔗 API 계약서

## 📋 현재 구현 상태 (2025.01.01)

### ✅ 구현 완료
- **Supabase 클라이언트**: 모바일 앱 및 웹 어드민에서 직접 사용
- **실시간 데이터**: `sensor_readings` 테이블에서 센서 데이터 조회
- **디바이스 관리**: `devices` 테이블에서 베드 및 센서게이트웨이 관리
- **사용자 권한 시스템**: 3단계 역할 기반 권한 관리 (system_admin, team_leader, team_member)
- **농장 관리**: 농장 생성, 편집, 삭제 및 베드 관리
- **베드 관리**: 베드 생성, 편집, 삭제 및 다단 구조 지원
- **센서 데이터**: 실시간 센서 데이터 수집 및 표시
- **생육 노트**: 베드별 노트 작성 및 관리
- **MQTT 설정**: 농장별 MQTT 브로커 설정
- **🌱 양액계산 API**: `/api/nutrients/plan` - 작물별 최적 배양액 계산
- **📊 시세정보 API**: `/api/market-prices` - KAMIS 농산물 시세 조회

### 🔄 구현 예정
- **Raspberry Pi 연동**: 센서 데이터 수집 API
- **Tuya 디바이스 제어**: 실제 Tuya SDK 연동
- **실시간 MQTT 통신**: WebSocket 기반 실시간 데이터 스트리밍

## 📋 REST API 엔드포인트

### 🌐 기본 정보
- **Base URL**: `https://smart-on.vercel.app/api`
- **현재**: Next.js API Routes + Supabase 클라이언트
- **인증**: Supabase JWT Token
- **Content-Type**: `application/json`
- **Rate Limiting**: Supabase 기본 제한 적용

## 🔐 사용자 관리 API

### GET /api/users/current
현재 로그인한 사용자 정보를 조회합니다.

**응답:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "사용자명",
    "role": "team_leader",
    "team_id": "farm_uuid",
    "is_approved": true,
    "is_active": true
  }
}
```

### GET /api/users/approved
승인된 사용자 목록을 조회합니다.

**쿼리 파라미터:**
- `role` (optional): 역할 필터 (system_admin, team_leader, team_member)
- `team_id` (optional): 팀 ID 필터

**응답:**
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "사용자명",
      "role": "team_leader",
      "team_id": "farm_uuid",
      "is_active": true
    }
  ]
}
```

### PUT /api/users/[userId]
사용자 정보를 업데이트합니다.

**요청 본문:**
```json
{
  "name": "새 이름",
  "role": "team_member",
  "team_id": "new_farm_uuid",
  "is_active": true
}
```

## 🏠 농장 관리 API

### GET /api/farms
농장 목록을 조회합니다.

**응답:**
```json
{
  "success": true,
  "farms": [
    {
      "id": "uuid",
      "name": "농장명",
      "location": "위치",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/farms
새 농장을 생성합니다.

**요청 본문:**
```json
{
  "name": "새 농장",
  "location": "위치"
}
```

### PUT /api/farms/[farmId]
농장 정보를 업데이트합니다.

### DELETE /api/farms/[farmId]
농장을 삭제합니다.

## 🌱 베드 관리 API

### GET /api/farms/[farmId]/beds
특정 농장의 베드 목록을 조회합니다.

**응답:**
```json
{
  "success": true,
  "beds": [
    {
      "id": "device_uuid",
      "name": "베드-1",
      "crop_name": "토마토",
      "growing_method": "담액식",
      "total_tiers": 3,
      "sensors": [
        {
          "id": "sensor_uuid",
          "type": "temperature",
          "unit": "°C",
          "latest_value": 25.5
        }
      ]
    }
  ]
}
```

### POST /api/farms/[farmId]/beds
새 베드를 생성합니다.

**요청 본문:**
```json
{
  "name": "베드-2",
  "crop_name": "상추",
  "growing_method": "NFT식",
  "total_tiers": 2
}
```

### PUT /api/farms/[farmId]/beds/[bedId]
베드 정보를 업데이트합니다.

### DELETE /api/farms/[farmId]/beds/[bedId]
베드를 삭제합니다.

## 📊 센서 데이터 API

### GET /api/sensors/[sensorId]/readings
센서 데이터를 조회합니다.

**쿼리 파라미터:**
- `start_time` (optional): 시작 시간 (ISO 8601)
- `end_time` (optional): 종료 시간 (ISO 8601)
- `limit` (optional): 조회 개수 (기본값: 100)

**응답:**
```json
{
  "success": true,
  "readings": [
    {
      "id": 12345,
      "sensor_id": "sensor_uuid",
      "value": 25.5,
      "ts": "2025-01-01T12:00:00Z",
      "quality": 1
    }
  ]
}
```

### POST /api/sensors/[sensorId]/readings
센서 데이터를 저장합니다.

**요청 본문:**
```json
{
  "value": 25.5,
  "ts": "2025-01-01T12:00:00Z",
  "quality": 1
}
```

## 📝 생육 노트 API

### GET /api/beds/[bedId]/notes
베드의 생육 노트를 조회합니다.

**응답:**
```json
{
  "success": true,
  "notes": [
    {
      "id": "note_uuid",
      "title": "노트 제목",
      "content": "노트 내용",
      "tags": ["성장", "관리"],
      "is_announcement": false,
      "created_at": "2025-01-01T12:00:00Z"
    }
  ]
}
```

### POST /api/beds/[bedId]/notes
새 생육 노트를 작성합니다.

**요청 본문:**
```json
{
  "title": "노트 제목",
  "content": "노트 내용",
  "tags": ["성장", "관리"],
  "is_announcement": false
}
```

## 🔧 MQTT 설정 API

### GET /api/farms/[farmId]/mqtt-config
농장의 MQTT 설정을 조회합니다.

**응답:**
```json
{
  "success": true,
  "config": {
    "broker_url": "mqtt://broker.example.com:1883",
    "username": "farm_user",
    "password": "encrypted_password",
    "topic_prefix": "farm/001",
    "is_enabled": true
  }
}
```

### PUT /api/farms/[farmId]/mqtt-config
MQTT 설정을 업데이트합니다.

**요청 본문:**
```json
{
  "broker_url": "mqtt://broker.example.com:1883",
  "username": "farm_user",
  "password": "new_password",
  "topic_prefix": "farm/001",
  "is_enabled": true
}
```

### POST /api/farms/[farmId]/mqtt-test
MQTT 연결을 테스트합니다.

**응답:**
```json
{
  "success": true,
  "message": "MQTT 연결 성공",
  "connection_time": 150
}
```

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
  "device_id": "device_001",
  "sensor_data": [
    {
      "sensor_id": "sensor_001",
      "value": 25.5,
      "unit": "°C",
      "ts": "2025-09-23T13:00:00Z",
      "metadata": {
        "location": "greenhouse_a",
        "accuracy": 0.1
      }
    }
  ]
}
```

**현재 구현 상태:**
- ✅ **Supabase 클라이언트**: `getLatestSensorReadings()` 함수로 구현
- ✅ **실제 데이터**: `sensor_readings` 테이블에서 조회
- ✅ **Mock 데이터**: 개발용 Mock 데이터 제공

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

## 🌱 양액계산 API (구현 완료)

### POST /api/nutrients/plan
작물별 최적 배양액 제조 계산을 수행합니다.

**요청 본문:**
```json
{
  "cropNameOrKey": "상추",
  "stage": "vegetative",
  "targetVolumeL": 100,
  "waterProfileName": "RO_Default"
}
```

**응답:**
```json
{
  "success": true,
  "cropKey": "lettuce",
  "stage": "vegetative",
  "target": {
    "volumeL": 100,
    "EC": 1.6,
    "pH": 6
  },
  "lines": [
    {
      "salt": "Calcium nitrate tetrahydrate",
      "grams": 52.183,
      "tank": "A"
    },
    {
      "salt": "Potassium nitrate", 
      "grams": 41.927,
      "tank": "B"
    }
  ],
  "adjustments": [],
  "qc": {
    "ec_est": 0.6,
    "ph_est": 6.5,
    "warnings": [
      "Ca 잔여 요구량 61 ppm: CaCl2 등 보조염 추가 검토 필요"
    ]
  }
}
```

## 📊 시세정보 API (구현 완료)

### GET /api/market-prices
KAMIS 농산물 시세 정보를 조회합니다.

**쿼리 파라미터:**
- `item_name`: 농산물명 (선택)
- `item_code`: 품목코드 (선택)

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "item_name": "쌀/20kg",
      "item_code": "111",
      "unit": "20kg",
      "dpr": 61000,
      "price": "61,000원/20kg"
    }
  ]
}
```

### POST /api/market-prices/trend
농산물 가격 추이를 조회합니다.

**요청 본문:**
```json
{
  "item_code": "111",
  "period": "monthly"
}
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-01",
      "price": 58000
    }
  ]
}
```
