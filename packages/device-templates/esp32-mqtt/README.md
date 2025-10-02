# ESP32 MQTT 펌웨어 템플릿

ESP32 기반 IoT 디바이스용 MQTT 통신 펌웨어 템플릿입니다.

## 기능

- WiFi 연결
- MQTT 브로커 통신
- 센서 데이터 수집 (온도, 습도, 토양 수분)
- 릴레이 제어
- LittleFS 파일 시스템 지원
- JSON 설정 파일 지원

## 사용 방법

### 1. 설정 파일 준비

`data/config.example.json`을 `data/config.json`으로 복사하고 다음을 수정하세요:

```json
{
  "device_id": "your-device-id",
  "wifi": {
    "ssid": "YOUR_WIFI_SSID",
    "password": "YOUR_WIFI_PASSWORD"
  },
  "mqtt": {
    "server": "your-mqtt-broker.com",
    "port": 1883
  }
}
```

### 2. 보정 파일 준비

`data/calibration.example.json`을 `data/calibration.json`으로 복사하고 센서별 보정값을 설정하세요:

```json
{
  "temperature": {
    "slope": 1.0,
    "offset": 0.0
  }
}
```

### 3. 업로드

Arduino IDE 또는 PlatformIO를 사용하여 펌웨어를 업로드하세요.

### 4. 시리얼 모니터 확인

115200 baud로 시리얼 모니터를 열고 다음 로그를 확인하세요:

```
WiFi 연결됨
MQTT 연결됨
텔레메트리 전송: {"device_id":"esp32-device-001","ts":12345,"metrics":{"temperature":25.5,"humidity":60.2}}
```

## 텔레메트리 형식

```json
{
  "device_id": "esp32-device-001",
  "ts": 1234567890,
  "metrics": {
    "temperature": 25.5,
    "humidity": 60.2,
    "soil_moisture": 45.8,
    "status": "ok"
  }
}
```

## 명령 형식

```json
{
  "device_id": "esp32-device-001",
  "type": "relay_on",
  "params": {
    "pin": 2
  }
}
```

## 하드웨어 연결

- 온도 센서: GPIO 34
- 습도 센서: GPIO 35
- 토양 수분 센서: GPIO 32
- 릴레이 1: GPIO 2
- 릴레이 2: GPIO 4

## 문제 해결

### WiFi 연결 실패
- SSID와 비밀번호 확인
- 신호 강도 확인
- 방화벽 설정 확인

### MQTT 연결 실패
- 브로커 주소와 포트 확인
- 네트워크 연결 확인
- 인증 정보 확인

### 센서 값 이상
- 보정 파일 확인
- 하드웨어 연결 확인
- 전원 공급 확인
