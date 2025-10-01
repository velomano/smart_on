# 스마트 코드 생성기 설계

## 🎯 **핵심 아이디어**

사용자가 **센서/제어 개수와 타입**을 입력하면, **자동으로 최적화된 코드**를 생성하는 시스템

## 🎨 **UI 설계**

### **1단계: 디바이스 타입 선택**
```
┌─────────────────────────────────────┐
│ 🎯 디바이스 타입을 선택하세요        │
├─────────────────────────────────────┤
│ ○ ESP32 직접 연결                   │
│ ○ ESP32 → 라즈베리파이 → Bridge     │
│ ○ 라즈베리파이 직접 연결            │
│ ○ ESP32 → 라즈베리파이 → MQTT       │
└─────────────────────────────────────┘
```

### **2단계: 센서 설정**
```
┌─────────────────────────────────────┐
│ 📊 센서를 추가하세요                │
├─────────────────────────────────────┤
│ 센서 타입: [DHT22 ▼] 핀: [4] [추가] │
│ 센서 타입: [DS18B20 ▼] 핀: [5] [추가]│
│ 센서 타입: [토양수분 ▼] 핀: [6] [추가]│
│ 센서 타입: [조도센서 ▼] 핀: [7] [추가]│
│                                     │
│ 📋 추가된 센서:                     │
│ • DHT22 (핀 4) - 온도, 습도         │
│ • DS18B20 (핀 5) - 온도             │
│ • 토양수분 (핀 6) - 수분률          │
└─────────────────────────────────────┘
```

### **3단계: 제어 설정**
```
┌─────────────────────────────────────┐
│ 🔌 제어 장치를 추가하세요           │
├─────────────────────────────────────┤
│ 제어 타입: [릴레이 ▼] 핀: [8] [추가] │
│ 제어 타입: [모터 ▼] 핀: [9] [추가]   │
│ 제어 타입: [LED ▼] 핀: [10] [추가]   │
│ 제어 타입: [펌프 ▼] 핀: [11] [추가]   │
│                                     │
│ 📋 추가된 제어:                     │
│ • 릴레이 1 (핀 8) - 스프링클러      │
│ • 모터 (핀 9) - 팬                 │
│ • LED (핀 10) - 조명               │
└─────────────────────────────────────┘
```

### **4단계: 통신 방식 선택**
```
┌─────────────────────────────────────┐
│ 🌐 통신 방식을 선택하세요           │
├─────────────────────────────────────┤
│ ○ HTTP (간단, 안정적)               │
│ ○ WebSocket (실시간)                │
│ ○ MQTT (확장성)                     │
│                                     │
│ 📊 비교:                           │
│ HTTP: 30초 폴링, 간단함             │
│ WebSocket: 실시간, 복잡함           │
│ MQTT: 확장성, 중간 복잡도           │
└─────────────────────────────────────┘
```

### **5단계: 코드 생성 및 다운로드**
```
┌─────────────────────────────────────┐
│ 🎉 코드가 생성되었습니다!           │
├─────────────────────────────────────┤
│ 📁 생성된 파일:                     │
│ • ESP32_MultiSensor.ino             │
│ • raspberry_gateway.py (필요시)      │
│ • README_설치가이드.md               │
│                                     │
│ [📥 ZIP 다운로드] [📋 코드 복사]     │
│                                     │
│ 🔧 다음 단계:                       │
│ 1. Arduino IDE에서 ESP32_MultiSensor.ino 열기
│ 2. WiFi 설정 수정
│ 3. ESP32에 업로드
│ 4. 시리얼 모니터 확인
└─────────────────────────────────────┘
```

## 🚀 **자동 코드 생성 로직**

### **센서별 코드 템플릿**
```typescript
const sensorTemplates = {
  DHT22: {
    include: "#include <DHT.h>",
    define: "#define DHT_PIN {pin}",
    init: "DHT dht(DHT_PIN, DHT22);",
    read: "float temp = dht.readTemperature();\nfloat hum = dht.readHumidity();",
    data: 'data["temp"] = temp;\ndata["hum"] = hum;'
  },
  DS18B20: {
    include: "#include <OneWire.h>\n#include <DallasTemperature.h>",
    define: "#define DS18B20_PIN {pin}",
    init: "OneWire oneWire(DS18B20_PIN);\nDallasTemperature sensors(&oneWire);",
    read: "sensors.requestTemperatures();\nfloat temp = sensors.getTempCByIndex(0);",
    data: 'data["water_temp"] = temp;'
  },
  // ... 더 많은 센서 템플릿
};
```

### **제어별 코드 템플릿**
```typescript
const controlTemplates = {
  relay: {
    define: "#define RELAY_{num}_PIN {pin}",
    init: "pinMode(RELAY_{num}_PIN, OUTPUT);",
    state: "digitalWrite(RELAY_{num}_PIN, {state});",
    command: `if (cmd["params"]["relay"] == {num}) {
  digitalWrite(RELAY_{num}_PIN, cmd["params"]["state"] == "on" ? HIGH : LOW);
}`
  },
  motor: {
    define: "#define MOTOR_{num}_PIN {pin}",
    init: "pinMode(MOTOR_{num}_PIN, OUTPUT);",
    state: "digitalWrite(MOTOR_{num}_PIN, {state});",
    command: `if (cmd["type"] == "motor_control") {
  digitalWrite(MOTOR_{num}_PIN, cmd["params"]["state"] == "on" ? HIGH : LOW);
}`
  }
  // ... 더 많은 제어 템플릿
};
```

### **통신 방식별 코드 템플릿**
```typescript
const protocolTemplates = {
  HTTP: {
    send: `HTTPClient http;
http.begin(SERVER_URL + "/api/bridge/telemetry");
http.POST(payload);`,
    receive: `http.begin(SERVER_URL + "/api/bridge/commands/" + DEVICE_ID);
String commands = http.getString();`
  },
  WebSocket: {
    connect: "webSocket.begin(bridgeUrl, 3001, \"/ws/\" + DEVICE_ID);",
    send: "webSocket.sendTXT(payload);",
    receive: "webSocket.on('message', handleCommand);"
  },
  MQTT: {
    connect: "mqttClient.connect(DEVICE_ID, username, password);",
    send: "mqttClient.publish(\"farm/001/telemetry\", payload);",
    receive: "mqttClient.subscribe(\"farm/001/commands\");"
  }
};
```

## 🎯 **생성되는 코드 예시**

### **사용자 입력:**
- 디바이스: ESP32 직접 연결
- 센서: DHT22 (핀 4), DS18B20 (핀 5)
- 제어: 릴레이 (핀 8), 모터 (핀 9)
- 통신: HTTP

### **자동 생성되는 코드:**
```cpp
// 자동 생성된 헤더
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// 자동 생성된 핀 정의
#define DHT_PIN 4
#define DS18B20_PIN 5
#define RELAY_1_PIN 8
#define MOTOR_1_PIN 9

// 자동 생성된 객체
DHT dht(DHT_PIN, DHT22);
OneWire oneWire(DS18B20_PIN);
DallasTemperature sensors(&oneWire);

// 자동 생성된 센서 읽기 함수
void readSensors() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  sensors.requestTemperatures();
  float water_temp = sensors.getTempCByIndex(0);
  
  data["temp"] = temp;
  data["hum"] = hum;
  data["water_temp"] = water_temp;
}

// 자동 생성된 제어 함수
void handleCommand(JsonObject cmd) {
  if (cmd["type"] == "relay_control" && cmd["params"]["relay"] == 1) {
    digitalWrite(RELAY_1_PIN, cmd["params"]["state"] == "on" ? HIGH : LOW);
  }
  if (cmd["type"] == "motor_control") {
    digitalWrite(MOTOR_1_PIN, cmd["params"]["state"] == "on" ? HIGH : LOW);
  }
}
```

## 🎨 **UI 구현 계획**

### **React 컴포넌트 구조**
```
ConnectWizard/
├── DeviceTypeSelector.tsx
├── SensorConfigurator.tsx
├── ControlConfigurator.tsx
├── ProtocolSelector.tsx
├── CodeGenerator.tsx
└── CodeDownloader.tsx
```

### **상태 관리**
```typescript
interface DeviceConfig {
  deviceType: 'esp32-direct' | 'esp32-raspberry' | 'raspberry-direct' | 'esp32-mqtt';
  sensors: Array<{
    type: string;
    pin: number;
    name: string;
  }>;
  controls: Array<{
    type: string;
    pin: number;
    name: string;
  }>;
  protocol: 'http' | 'websocket' | 'mqtt';
}
```

## 🚀 **장점**

1. **사용자 친화적**: 복잡한 코드 작성 불필요
2. **자동 최적화**: 선택한 구성에 맞는 최적 코드 생성
3. **확장 가능**: 새로운 센서/제어 타입 쉽게 추가
4. **다양한 시나리오**: 모든 IoT 아키텍처 지원
5. **실시간 미리보기**: 코드 생성 전 미리보기 가능

---

**정말 혁신적인 아이디어입니다!** 🎉
**이렇게 하면 사용자가 복잡한 코딩 없이도 원하는 IoT 시스템을 구축할 수 있습니다!** 🚀
