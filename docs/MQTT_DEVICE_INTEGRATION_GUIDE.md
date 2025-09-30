# 🚀 MQTT 디바이스 연동 가이드

## 📋 개요

이 가이드는 스마트팜 플랫폼과 MQTT를 통해 연동하는 디바이스/센서 개발자를 위한 완전한 가이드입니다.

## 🔗 연결 정보

### MQTT 브로커 연결 설정
```json
{
  "broker_url": "mqtts://your-broker.com",
  "port": 8883,
  "username": "your-username",
  "password": "your-password",
  "client_id": "device-{device_id}-{timestamp}",
  "keepalive": 60,
  "clean_session": false,
  "qos": 1
}
```

## 📡 토픽 구조

### 기본 토픽 패턴
```
farms/{farm_id}/devices/{device_id}/{message_type}
```

### 지원하는 메시지 타입
- `registry` - 디바이스 등록 정보
- `state` - 디바이스 상태
- `telemetry` - 센서 데이터
- `command` - 제어 명령 (구독)
- `command/ack` - 명령 확인 응답

## 📤 발행 (Publish) - 디바이스 → 서버

### 1. 디바이스 등록 (Registry)
**토픽:** `farms/{farm_id}/devices/{device_id}/registry`

```json
{
  "device_id": "device_001",
  "device_type": "sensor_gateway",
  "firmware_version": "1.0.0",
  "hardware_version": "v2.1",
  "capabilities": {
    "sensors": ["temperature", "humidity", "ec", "ph"],
    "actuators": ["pump", "valve"],
    "communication": ["wifi", "lora"]
  },
  "location": {
    "farm_id": "farm_001",
    "bed_id": "bed_a1",
    "tier": 1
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. 디바이스 상태 (State)
**토픽:** `farms/{farm_id}/devices/{device_id}/state`

```json
{
  "device_id": "device_001",
  "status": {
    "online": true,
    "battery_level": 85,
    "signal_strength": -65,
    "uptime": 86400,
    "last_restart": "2024-01-14T10:30:00Z"
  },
  "sensors": {
    "temperature": {"connected": true, "calibrated": true},
    "humidity": {"connected": true, "calibrated": true},
    "ec": {"connected": false, "error": "sensor_failure"},
    "ph": {"connected": true, "calibrated": false}
  },
  "actuators": {
    "pump_1": {"status": "off", "last_command": "2024-01-15T09:15:00Z"},
    "valve_1": {"status": "open", "position": 75}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. 센서 데이터 (Telemetry)
**토픽:** `farms/{farm_id}/devices/{device_id}/telemetry`

```json
{
  "device_id": "device_001",
  "batch_seq": 12345,
  "window_ms": 30000,
  "readings": [
    {
      "key": "temperature",
      "tier": 1,
      "unit": "celsius",
      "value": 23.5,
      "ts": "2024-01-15T10:30:00Z",
      "quality": "good"
    },
    {
      "key": "humidity",
      "tier": 1,
      "unit": "percent",
      "value": 65.2,
      "ts": "2024-01-15T10:30:00Z",
      "quality": "good"
    },
    {
      "key": "ec",
      "tier": 1,
      "unit": "ms_cm",
      "value": 1.8,
      "ts": "2024-01-15T10:30:00Z",
      "quality": "good"
    },
    {
      "key": "ph",
      "tier": 1,
      "unit": "ph",
      "value": 6.2,
      "ts": "2024-01-15T10:30:00Z",
      "quality": "good"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 4. 명령 확인 응답 (Command ACK)
**토픽:** `farms/{farm_id}/devices/{device_id}/command/ack`

```json
{
  "command_id": "cmd_1234567890",
  "status": "success",
  "detail": "Pump turned on successfully",
  "state": {
    "pump_1": {"status": "on", "flow_rate": 2.5},
    "valve_1": {"status": "open", "position": 100}
  },
  "timestamp": "2024-01-15T10:30:05Z"
}
```

## 📥 구독 (Subscribe) - 서버 → 디바이스

### 제어 명령 수신
**토픽:** `farms/{farm_id}/devices/{device_id}/command`

```json
{
  "command_id": "cmd_1234567890",
  "command": "pump_on",
  "payload": {
    "pump_id": "pump_1",
    "duration": 300,
    "flow_rate": 2.5
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔧 지원하는 명령어

### 펌프 제어
```json
{
  "command": "pump_on",
  "payload": {"pump_id": "pump_1", "duration": 300, "flow_rate": 2.5}
}

{
  "command": "pump_off", 
  "payload": {"pump_id": "pump_1"}
}
```

### 밸브 제어
```json
{
  "command": "valve_open",
  "payload": {"valve_id": "valve_1", "position": 75}
}

{
  "command": "valve_close",
  "payload": {"valve_id": "valve_1"}
}
```

### LED 제어
```json
{
  "command": "led_on",
  "payload": {"led_id": "led_1", "brightness": 80, "color": "red"}
}

{
  "command": "led_off",
  "payload": {"led_id": "led_1"}
}
```

### 설정 변경
```json
{
  "command": "update_config",
  "payload": {
    "sampling_interval": 30,
    "calibration_offset": {"temperature": 0.5, "humidity": -2.0}
  }
}
```

## ⚠️ 중요 사항

### QoS 설정
- **모든 메시지는 QoS 1 사용** (최소 한 번 전달 보장)
- 명령어는 반드시 ACK 응답 필요

### 메시지 형식
- **모든 메시지는 JSON 형식**
- 타임스탬프는 ISO 8601 형식 (`2024-01-15T10:30:00Z`)
- 숫자 값은 반드시 적절한 단위와 함께 전송

### 에러 처리
```json
{
  "command_id": "cmd_1234567890",
  "status": "error",
  "detail": "Pump hardware failure",
  "error_code": "HARDWARE_ERROR",
  "timestamp": "2024-01-15T10:30:05Z"
}
```

### 연결 관리
- **Persistent Session 사용** (`clean_session: false`)
- **자동 재연결** 구현 필수
- **Last Will and Testament** 설정 권장

## 📊 센서 타입 및 단위

### 온도 (Temperature)
- 단위: `celsius`, `fahrenheit`
- 범위: -40 ~ 100°C

### 습도 (Humidity)
- 단위: `percent`
- 범위: 0 ~ 100%

### EC (Electrical Conductivity)
- 단위: `ms_cm`, `us_cm`
- 범위: 0 ~ 5 mS/cm

### pH
- 단위: `ph`
- 범위: 0 ~ 14

### 수위 (Water Level)
- 단위: `cm`, `percent`
- 범위: 0 ~ 100%

### 조도 (Light)
- 단위: `lux`, `umol_m2s`
- 범위: 0 ~ 100,000 lux

## 🔄 데이터 전송 주기

### 권장 주기
- **센서 데이터:** 30초 ~ 5분
- **디바이스 상태:** 1분 ~ 10분
- **배치 크기:** 최대 50개 센서값

### 네트워크 최적화
- **배치 전송** 권장 (여러 센서값을 한 번에)
- **압축** 사용 고려 (gzip)
- **중복 제거** (같은 값은 전송하지 않음)

## 🛡️ 보안 고려사항

### 인증
- **MQTT Username/Password** 필수
- **TLS/SSL** 연결 권장 (포트 8883)
- **Client Certificate** 인증 지원

### 데이터 보호
- **민감한 정보 암호화**
- **API Key 보안 관리**
- **로그에서 민감 정보 제거**

## 📝 로깅 가이드

### 로그 레벨
```json
{
  "level": "info",
  "message": "Device connected successfully",
  "device_id": "device_001",
  "farm_id": "farm_001",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 에러 로깅
```json
{
  "level": "error",
  "message": "Sensor reading failed",
  "device_id": "device_001",
  "sensor_type": "ec",
  "error": "sensor_timeout",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🚀 빠른 시작 템플릿

다음 섹션에서 언어별 구현 템플릿을 제공합니다.
