# ESP32 Universal Bridge 펌웨어

## 개요
ESP32 기반 범용 IoT 브릿지 펌웨어로, 하드웨어 프로필 기반으로 동작합니다.

## 기능
- **하드웨어 프로필 기반 설정**: JSON으로 센서/액추에이터 구성
- **Self-Test**: 액추에이터 토글 및 PWM 테스트
- **I2C 스캔**: 연결된 I2C 디바이스 자동 감지
- **MQTT 통신**: 텔레메트리 전송 및 명령 수신
- **핀 정책 검증**: 부팅 시 하드웨어 프로필 검증

## 빠른 시작

### 1. 설정 파일 편집
`data/config.json` 파일을 편집하여 다음 정보를 입력하세요:

```json
{
  "wifi": { 
    "ssid": "YOUR_WIFI_SSID", 
    "password": "YOUR_WIFI_PASSWORD" 
  },
  "mqtt": { 
    "host": "YOUR_MQTT_HOST", 
    "port": 1883, 
    "user": "", 
    "pass": "", 
    "baseTopic": "farm/bridge1" 
  },
  "hardwareProfile": {
    "schemaVersion": "1.0.0",
    "board": "esp32-wroom",
    "i2c": { "sda": 21, "scl": 22 },
    "sensors": [
      { "type": "BME280", "addr": "0x76" },
      { "type": "ADS1115", "addr": "0x48" },
      { "type": "DHT22", "pin": 27 }
    ],
    "actuators": [
      { "name": "AC_Relay_Lamp", "pin": 16, "activeLow": true, "driver": "relay" },
      { "name": "Solid_State_Relay", "pin": 17, "activeLow": false, "driver": "ssr" },
      { "name": "Peristaltic_Pump", "pin": 18, "driver": "mosfet" },
      { "name": "PWM_Buzzer", "pin": 25, "pwm": true }
    ]
  }
}
```

### 2. 빌드 및 업로드
```bash
# PlatformIO CLI 사용
pio run -t upload

# 또는 VS Code PlatformIO 확장 사용
# Upload 버튼 클릭
```

### 3. 시리얼 모니터 확인
```bash
pio device monitor
```

부팅 리포트에서 다음을 확인하세요:
- WiFi 연결 상태
- I2C 스캔 결과
- 센서 초기화 상태

### 4. MQTT 테스트

#### 부팅 리포트 확인
토픽: `farm/bridge1/status/boot`
```json
{
  "fw": "1.0.0",
  "board": "esp32-wroom",
  "wifi": true,
  "ip": "192.168.1.100",
  "i2c": ["76", "48"],
  "sensors": {
    "bme280": true,
    "ads1115": true,
    "dht22": true
  }
}
```

#### Self-Test 실행
토픽: `farm/bridge1/cmd/selftest`
메시지: `{}`

결과 토픽: `farm/bridge1/status/selftest`
```json
{
  "cmd": "selftest",
  "ok": true,
  "actuators_tested": 4,
  "timestamp": 12345
}
```

#### 텔레메트리 확인
토픽: `farm/bridge1/telemetry`
```json
{
  "timestamp": 12345,
  "temp": 25.6,
  "pressure": 1013.25,
  "dht_temp": 25.4,
  "dht_humidity": 60.2,
  "adc0": 2048,
  "wifi_rssi": -45,
  "free_heap": 250000
}
```

## 하드웨어 프로필

### 센서 타입
- **BME280**: 온도/압력 센서 (I2C)
- **ADS1115**: 16비트 ADC (I2C)
- **DHT22**: 온습도 센서 (디지털)

### 액추에이터 설정
- **name**: 액추에이터 이름
- **pin**: GPIO 핀 번호
- **activeLow**: 논리 반전 여부
- **pwm**: PWM 지원 여부
- **driver**: 드라이버 타입 (mosfet, relay, ssr, none)

## 핀 정책

### 금지 핀
- **부팅 스트랩**: GPIO0, 2, 4, 12, 15
- **입력 전용**: GPIO34~39

### 권장 핀
- **출력**: GPIO16, 17, 18, 19, 23, 25, 26, 27, 32, 33
- **I2C**: SDA=21, SCL=22 (고정)
- **UART0**: TX=1, RX=3 (콘솔용)

## 문제 해결

### I2C 주소 문제
예상 주소와 다르면 하드웨어/배선을 점검하세요:
- BME280: 0x76 또는 0x77
- ADS1115: 0x48~0x4B

### 부팅 실패
1. 설정 파일 JSON 문법 확인
2. 핀 정책 위반 여부 확인
3. 센서 배선 확인

### MQTT 연결 실패
1. WiFi 자격 증명 확인
2. MQTT 브로커 주소/포트 확인
3. 네트워크 연결 상태 확인

## 개발자 정보
- **프레임워크**: Arduino
- **라이브러리**: PlatformIO
- **스키마 버전**: 1.0.0
