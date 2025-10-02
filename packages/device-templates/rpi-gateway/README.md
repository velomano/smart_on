# Raspberry Pi Gateway

Raspberry Pi를 사용한 Modbus/Serial 장치 게이트웨이입니다.

## 기능

- Modbus TCP/RTU 통신
- 시리얼 통신 (RS-485, RS-232)
- MQTT 브로커 통신
- HTTP API 통신
- 센서 데이터 폴링
- 원격 제어 명령 처리

## 설치

### 1. 의존성 설치

```bash
pip install paho-mqtt pymodbus requests pyserial
```

### 2. 설정 파일 준비

`config.example.json`을 `config.json`으로 복사하고 설정을 수정하세요:

```json
{
  "device_id": "your-gateway-id",
  "mqtt": {
    "host": "your-mqtt-broker.com",
    "port": 1883
  },
  "modbus": {
    "host": "192.168.1.100",
    "port": 502
  }
}
```

### 3. 실행

```bash
python3 app.py
```

## 설정 옵션

### MQTT 설정
- `host`: MQTT 브로커 주소
- `port`: MQTT 브로커 포트
- `username`: 인증 사용자명
- `password`: 인증 비밀번호
- `telemetry_topic`: 텔레메트리 전송 토픽
- `command_topic`: 명령 수신 토픽

### Modbus 설정
- `host`: Modbus 서버 주소
- `port`: Modbus 서버 포트

### 시리얼 설정
- `port`: 시리얼 포트 경로
- `baudrate`: 통신 속도
- `timeout`: 타임아웃 설정

### 센서 설정
각 센서는 다음 옵션을 가집니다:
- `type`: 센서 타입 (modbus, serial)
- `address`: Modbus 주소
- `count`: 읽을 레지스터 수
- `unit_id`: Modbus 유닛 ID
- `scale`: 스케일 팩터
- `offset`: 오프셋 값

## 텔레메트리 형식

```json
{
  "device_id": "rpi-gateway-001",
  "ts": "2023-12-01T10:30:00",
  "metrics": {
    "temperature": 25.5,
    "humidity": 60.2,
    "pressure": 1013.25
  },
  "status": "ok"
}
```

## 명령 형식

### Modbus 쓰기
```json
{
  "device_id": "rpi-gateway-001",
  "type": "modbus_write",
  "params": {
    "address": 40001,
    "value": 1,
    "unit_id": 1
  }
}
```

### 시리얼 쓰기
```json
{
  "device_id": "rpi-gateway-001",
  "type": "serial_write",
  "params": {
    "data": "RELAY_ON"
  }
}
```

## 문제 해결

### Modbus 연결 실패
- 네트워크 연결 확인
- IP 주소와 포트 확인
- 방화벽 설정 확인

### 시리얼 연결 실패
- 포트 경로 확인
- 권한 설정 확인
- 통신 속도 확인

### MQTT 연결 실패
- 브로커 주소와 포트 확인
- 인증 정보 확인
- 네트워크 연결 확인
