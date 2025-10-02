# ESP32 MQTT IoT 시스템

## 📋 시스템 사양
- **디바이스**: ESP32
- **통신 프로토콜**: MQTT
- **센서**: BME280, ENS160, HC-SR04
- **액추에이터**: A4988_Stepper, WS2812B_NeoPixel, AC_Relay_Lamp
- **생성 시간**: 2025-10-02T14:24:42.881Z

## ⚠️ 안전 주의사항

- 일반적인 전기 안전 수칙을 준수하세요

## 🚀 설치 방법

### 1. Arduino IDE 설정
1. Arduino IDE를 설치합니다
2. ESP32 보드를 선택합니다
3. 필요한 라이브러리를 설치합니다:
   - WiFi (ESP32/ESP8266용)
   - HTTPClient (ESP32용)
   - ArduinoJson
   - PubSubClient (MQTT용)

### 2. 설정 파일 수정
1. `config.json` 파일에서 WiFi 설정을 수정합니다:
   ```json
   {
     "wifi": {
       "ssid": "YOUR_WIFI_SSID",
       "password": "YOUR_WIFI_PASSWORD"
     }
   }
   ```

### 3. 센서 보정
1. `calibration.json` 파일에서 센서별로 오프셋과 스케일 값을 조정합니다

### 4. 업로드
1. 메인 코드 파일을 Arduino IDE에서 엽니다
2. 보드를 연결하고 포트를 선택합니다
3. 업로드 버튼을 클릭합니다

## 🔧 하드웨어 연결

### 센서 연결
- **BME280**: 핀 2
- **ENS160**: 핀 2
- **HC-SR04**: 핀 2

### 액추에이터 연결
- **A4988_Stepper**: 핀 10
- **WS2812B_NeoPixel**: 핀 10
- **AC_Relay_Lamp**: 핀 10

## 📡 Universal Bridge 연결

### MQTT 설정 (브로커 내장)
- **Universal Bridge 주소**: localhost:1883
- **토픽 규칙**: terahub/{tenant}/{deviceId}/{kind}/{name}
- **센서 토픽**: terahub/demo/esp32-xxx/sensors/bme280/temperature
- **액추에이터 토픽**: terahub/demo/esp32-xxx/actuators/relay1/set

### 연결 방법
1. Universal Bridge가 실행 중인지 확인
2. ESP32가 같은 네트워크에 연결되어 있는지 확인
3. 코드에서 WiFi 설정만 수정하면 자동 연결

## 🐛 문제 해결

### 일반적인 문제
1. **WiFi 연결 실패**: SSID와 비밀번호를 확인하세요
2. **Universal Bridge 연결 실패**: Bridge가 실행 중인지 확인하세요
3. **센서 데이터 없음**: 핀 연결과 센서 전원을 확인하세요
4. **액추에이터 작동 안함**: 핀 연결과 전원 공급을 확인하세요

### 시리얼 모니터 확인
- WiFi 연결 상태 메시지
- Universal Bridge MQTT 연결 상태
- 센서 데이터 발행 로그
- 오류 메시지 확인