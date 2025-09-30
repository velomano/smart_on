# 🚀 MQTT 디바이스 연동 템플릿

이 디렉토리는 스마트팜 플랫폼과 MQTT를 통해 연동하는 디바이스 개발을 위한 완전한 템플릿들을 포함합니다.

## 📁 파일 구조

```
templates/
├── README.md                    # 이 파일
├── config_template.json         # 설정 파일 템플릿
├── arduino_mqtt_template.cpp    # Arduino/ESP32 템플릿
├── python_mqtt_template.py      # Python 템플릿
├── nodejs_mqtt_template.js      # Node.js 템플릿
└── examples/                    # 추가 예제들
    ├── simple_sensor.py         # 간단한 센서 예제
    ├── actuator_control.js      # 액추에이터 제어 예제
    └── multi_device.py          # 다중 디바이스 예제
```

## 🎯 빠른 시작

### 1. 템플릿 선택
개발 환경에 맞는 템플릿을 선택하세요:
- **Arduino/ESP32**: `arduino_mqtt_template.cpp`
- **Python**: `python_mqtt_template.py`
- **Node.js**: `nodejs_mqtt_template.js`

### 2. 설정 파일 수정
`config_template.json`을 복사하여 `config.json`으로 이름을 바꾸고 다음 정보를 수정하세요:

```json
{
  "farm_id": "your_farm_id",
  "device_id": "your_device_id", 
  "broker_url": "your-mqtt-broker.com",
  "broker_port": 8883,
  "username": "your_mqtt_username",
  "password": "your_mqtt_password"
}
```

### 3. 하드웨어 연결
센서와 액추에이터를 설정에 따라 연결하세요:
- 온도/습도 센서 (DHT22)
- EC/pH 센서 (아날로그)
- 펌프 (릴레이)
- 밸브 (서보 모터)
- LED (PWM)

### 4. 실행
```bash
# Python
python python_mqtt_template.py

# Node.js
node nodejs_mqtt_template.js

# Arduino
# Arduino IDE에서 업로드
```

## 🔧 주요 기능

### ✅ 지원하는 센서
- **온도** (Temperature): DHT22, DS18B20
- **습도** (Humidity): DHT22, SHT30
- **EC** (Electrical Conductivity): 아날로그 센서
- **pH**: 아날로그 센서
- **수위** (Water Level): 초음파 센서
- **조도** (Light): 포토레지스터

### ✅ 지원하는 액추에이터
- **펌프**: 릴레이 제어
- **밸브**: 서보 모터
- **LED**: PWM 제어

### ✅ MQTT 통신
- **디바이스 등록**: 자동 등록 및 재등록
- **센서 데이터**: 30초마다 배치 전송
- **디바이스 상태**: 5분마다 상태 보고
- **명령 처리**: 실시간 명령 수신 및 응답

## 📡 MQTT 토픽 구조

```
farms/{farm_id}/devices/{device_id}/
├── registry          # 디바이스 등록 정보
├── state            # 디바이스 상태
├── telemetry        # 센서 데이터
├── command          # 제어 명령 (구독)
└── command/ack      # 명령 확인 응답
```

## 🎛️ 지원하는 명령어

### 펌프 제어
```json
{
  "command": "pump_on",
  "payload": {
    "duration": 300,
    "flow_rate": 2.5
  }
}
```

### 밸브 제어
```json
{
  "command": "valve_open", 
  "payload": {
    "position": 75
  }
}
```

### LED 제어
```json
{
  "command": "led_on",
  "payload": {
    "brightness": 80,
    "color": "red"
  }
}
```

## 🔒 보안 설정

### TLS/SSL 연결 (권장)
```json
{
  "broker_port": 8883,
  "security": {
    "tls_enabled": true,
    "cert_validation": true
  }
}
```

### 인증서 기반 인증
```json
{
  "security": {
    "client_cert": "path/to/client.crt",
    "client_key": "path/to/client.key"
  }
}
```

## 📊 로깅

모든 템플릿은 구조화된 로깅을 지원합니다:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "Device connected successfully",
  "device_id": "device_001",
  "data": {
    "broker_url": "broker.com",
    "uptime": 3600
  }
}
```

## 🛠️ 커스터마이징

### 새로운 센서 추가
1. `config.json`에 센서 설정 추가
2. 하드웨어 읽기 함수 구현
3. `sendTelemetry()` 함수에 센서 데이터 추가

### 새로운 액추에이터 추가
1. `config.json`에 액추에이터 설정 추가
2. 하드웨어 제어 함수 구현
3. 명령 처리 함수 추가

### 통신 프로토콜 변경
1. MQTT 대신 다른 프로토콜 사용
2. 토픽 구조 변경
3. 메시지 포맷 수정

## 🐛 문제 해결

### 일반적인 문제들

#### 1. MQTT 연결 실패
- 브로커 URL과 포트 확인
- 사용자명/비밀번호 확인
- 방화벽 설정 확인
- TLS 인증서 문제 확인

#### 2. 센서 데이터 없음
- 센서 연결 확인
- 핀 번호 설정 확인
- 전원 공급 확인
- 센서 드라이버 확인

#### 3. 명령 응답 없음
- 토픽 구독 확인
- JSON 파싱 확인
- 명령 처리 함수 확인
- ACK 응답 확인

### 디버깅 팁

#### 로그 레벨 변경
```json
{
  "logging": {
    "level": "debug"
  }
}
```

#### 테스트 모드 활성화
```json
{
  "test_mode": true,
  "simulate_sensors": true
}
```

## 📚 추가 리소스

- [MQTT 공식 문서](https://mqtt.org/documentation)
- [Arduino MQTT 라이브러리](https://github.com/knolleary/pubsubclient)
- [Python MQTT 라이브러리](https://pypi.org/project/paho-mqtt/)
- [Node.js MQTT 라이브러리](https://github.com/mqttjs/MQTT.js)

## 🤝 지원

문제가 발생하거나 질문이 있으시면:
1. 로그 파일 확인
2. 설정 파일 검증
3. 네트워크 연결 테스트
4. 하드웨어 연결 확인

## 📄 라이선스

이 템플릿들은 MIT 라이선스 하에 제공됩니다.
