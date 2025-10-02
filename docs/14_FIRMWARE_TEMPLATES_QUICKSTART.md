# 펌웨어 템플릿 빠른 시작 가이드

IoT 디바이스 펌웨어 템플릿을 사용하여 스마트팜 시스템을 구축하는 방법을 안내합니다.

## 📋 개요

이 가이드는 다음 템플릿들을 사용하는 방법을 설명합니다:
- **ESP32 MQTT**: WiFi + MQTT 통신
- **ESP32 LoRaWAN**: LoRaWAN 통신
- **Raspberry Pi Gateway**: Modbus/Serial → MQTT/HTTP 변환

## 🚀 빠른 시작

### 1. 템플릿 다운로드

```bash
# 템플릿 다운로드
wget https://github.com/your-repo/device-templates/archive/main.zip
unzip main.zip
cd device-templates-main
```

### 2. ESP32 MQTT 템플릿 사용

#### 2.1 설정 파일 준비

```bash
cd esp32-mqtt/data
cp config.example.json config.json
cp calibration.example.json calibration.json
```

#### 2.2 설정 수정

`config.json` 파일을 편집하세요:

```json
{
  "device_id": "my-farm-sensor-001",
  "wifi": {
    "ssid": "MyFarmWiFi",
    "password": "MyPassword123"
  },
  "mqtt": {
    "server": "broker.hivemq.com",
    "port": 1883,
    "telemetry_topic": "farm/telemetry",
    "command_topic": "farm/command"
  }
}
```

#### 2.3 보정 설정

`calibration.json` 파일을 편집하세요:

```json
{
  "temperature": {
    "slope": 1.0,
    "offset": 0.0,
    "unit": "celsius"
  },
  "humidity": {
    "slope": 1.0,
    "offset": 0.0,
    "unit": "percent"
  }
}
```

#### 2.4 업로드

Arduino IDE를 사용하여 업로드하세요:

1. **보드 선택**: ESP32 Dev Module
2. **포트 선택**: USB 포트
3. **업로드**: Ctrl+U

#### 2.5 시리얼 모니터 확인

115200 baud로 시리얼 모니터를 열고 다음 로그를 확인하세요:

```
WiFi 연결됨
MQTT 연결됨
텔레메트리 전송: {"device_id":"my-farm-sensor-001","ts":12345,"metrics":{"temperature":25.5,"humidity":60.2}}
```

### 3. ESP32 LoRaWAN 템플릿 사용

#### 3.1 LoRaWAN 네트워크 설정

1. **The Things Stack** 계정 생성
2. **애플리케이션** 생성
3. **디바이스** 등록 (DevEUI, AppEUI, AppKey 생성)

#### 3.2 설정 파일 준비

```bash
cd esp32-lorawan/data
cp config.example.json config.json
```

#### 3.3 LoRaWAN 설정

`config.json` 파일을 편집하세요:

```json
{
  "device_id": "my-lorawan-sensor-001",
  "lorawan": {
    "devEui": "YOUR_DEV_EUI",
    "appEui": "YOUR_APP_EUI",
    "appKey": "YOUR_APP_KEY",
    "region": "AS923"
  }
}
```

#### 3.4 업로드 및 테스트

Arduino IDE로 업로드 후 시리얼 모니터에서 확인:

```
LoRaWAN 디바이스 준비 완료
업링크 전송 성공
```

### 4. Raspberry Pi Gateway 사용

#### 4.1 의존성 설치

```bash
pip install paho-mqtt pymodbus requests pyserial
```

#### 4.2 설정 파일 준비

```bash
cd rpi-gateway
cp config.example.json config.json
```

#### 4.3 설정 수정

`config.json` 파일을 편집하세요:

```json
{
  "device_id": "my-farm-gateway-001",
  "mqtt": {
    "host": "broker.hivemq.com",
    "port": 1883,
    "telemetry_topic": "farm/telemetry",
    "command_topic": "farm/command"
  },
  "modbus": {
    "host": "192.168.1.100",
    "port": 502
  }
}
```

#### 4.4 실행

```bash
python3 app.py
```

## 🔧 하드웨어 연결

### ESP32 MQTT/LoRaWAN

| 센서/제어 | GPIO 핀 | 설명 |
|-----------|---------|------|
| 온도 센서 | GPIO 34 | 아날로그 입력 |
| 습도 센서 | GPIO 35 | 아날로그 입력 |
| 토양 수분 | GPIO 32 | 아날로그 입력 |
| 릴레이 1 | GPIO 2 | 디지털 출력 |
| 릴레이 2 | GPIO 4 | 디지털 출력 |

### Raspberry Pi Gateway

| 연결 | 포트 | 설명 |
|------|------|------|
| Modbus TCP | 이더넷 | 네트워크 연결 |
| RS-485 | USB-Serial | 시리얼 변환기 |
| 전원 | GPIO 5V | 센서 전원 |

## 📊 데이터 형식

### 텔레메트리 (센서 데이터)

```json
{
  "device_id": "my-farm-sensor-001",
  "ts": "2023-12-01T10:30:00Z",
  "metrics": {
    "temperature": 25.5,
    "humidity": 60.2,
    "soil_moisture": 45.8,
    "status": "ok"
  }
}
```

### 명령 (제어 명령)

```json
{
  "device_id": "my-farm-sensor-001",
  "type": "relay_on",
  "params": {
    "pin": 2
  }
}
```

## 🚨 문제 해결

### WiFi 연결 실패

**증상**: "WiFi 연결 중..." 메시지가 계속 표시

**해결 방법**:
1. SSID와 비밀번호 확인
2. 신호 강도 확인 (RSSI > -70dBm 권장)
3. 방화벽 설정 확인
4. 2.4GHz 대역 사용 확인

### MQTT 연결 실패

**증상**: "MQTT 연결 실패" 메시지

**해결 방법**:
1. 브로커 주소와 포트 확인
2. 네트워크 연결 확인
3. 인증 정보 확인
4. 방화벽 설정 확인

### LoRaWAN 연결 실패

**증상**: "업링크 전송 실패" 메시지

**해결 방법**:
1. DevEUI, AppEUI, AppKey 확인
2. 지역 설정 확인 (AS923, EU868 등)
3. 안테나 연결 확인
4. 네트워크 커버리지 확인

### 센서 값 이상

**증상**: 센서 값이 비정상적으로 표시

**해결 방법**:
1. 보정 파일 확인 (`calibration.json`)
2. 하드웨어 연결 확인
3. 전원 공급 확인 (3.3V 또는 5V)
4. 센서 상태 확인

## 💡 운영 팁

### 보정 (Calibration)

센서 보정은 정확한 측정을 위해 필수입니다:

```json
{
  "temperature": {
    "slope": 1.02,    // 기울기 보정
    "offset": -0.5,   // 오프셋 보정
    "unit": "celsius"
  }
}
```

**보정 방법**:
1. 알려진 온도에서 측정값 확인
2. slope = (실제값 - 측정값) / 측정값
3. offset = 실제값 - (측정값 × slope)

### Deadband 설정

센서 노이즈를 줄이기 위해 deadband를 설정하세요:

```json
{
  "temperature": {
    "deadband": 0.1,  // 0.1도 이하 변화는 무시
    "unit": "celsius"
  }
}
```

### Fail-safe 설정

시스템 안전을 위해 fail-safe 값을 설정하세요:

```json
{
  "relay_1": {
    "fail_safe": "off",  // 통신 끊김 시 OFF
    "max_runtime": 3600  // 최대 1시간 동작
  }
}
```

### 상한 가드

센서 값의 상한을 설정하여 오류를 방지하세요:

```json
{
  "temperature": {
    "limits": {
      "min": -10.0,
      "max": 60.0
    }
  }
}
```

## 📚 추가 리소스

- [ESP32 공식 문서](https://docs.espressif.com/projects/esp-idf/en/latest/)
- [LoRaWAN 공식 문서](https://lora-alliance.org/resource_hub/lorawan-specification-v1-0-3/)
- [Modbus 공식 문서](https://modbus.org/docs/Modbus_Application_Protocol_V1_1b3.pdf)
- [MQTT 공식 문서](https://mqtt.org/mqtt-specification/)

## 🆘 지원

문제가 발생하면 다음을 확인하세요:

1. **시리얼 모니터 로그** 확인
2. **네트워크 연결** 상태 확인
3. **하드웨어 연결** 확인
4. **설정 파일** 문법 확인

추가 지원이 필요하면 GitHub Issues에 문의하세요.
