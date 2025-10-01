# 🌉 범용 IoT 브릿지 아키텍처 - 확장 설계

## 📋 현재 시스템 분석

### ✅ **현재 구현된 것 (MQTT 브릿지)**

```
센서/디바이스 (아두이노/라즈베리파이)
        ↓
    MQTT 클라이언트
        ↓
    MQTT 브로커
        ↓
    MQTT 브릿지 (Node.js)
        ↓
    Supabase DB
        ↓
    웹 대시보드
```

**통신 프로토콜:** MQTT Only
**연결 방식:** 간접 연결 (MQTT 브로커 경유)
**메시지 포맷:** JSON over MQTT

### 📡 **현재 MQTT 브릿지 구조**

#### 핵심 컴포넌트:
```
apps/mqtt-bridge/
├── src/
│   ├── index.ts              # 메인 서비스
│   ├── loadConfig.ts         # 농장별 MQTT 설정 로드
│   ├── handlers/
│   │   ├── registry.ts       # 디바이스 등록
│   │   ├── state.ts          # 상태 업데이트
│   │   ├── telemetry.ts      # 센서 데이터
│   │   └── commandAck.ts     # 명령 응답
│   ├── dispatch/
│   │   └── commands.ts       # 명령 전송
│   └── utils/
│       ├── batching.ts       # 배치 처리
│       └── logger.ts         # 로깅
```

#### 메시지 타입:
1. **Registry**: 디바이스 등록 (센서/액추에이터 목록)
2. **State**: 디바이스 상태 (온라인/오프라인, 액추에이터 상태)
3. **Telemetry**: 센서 데이터 (온도, 습도, EC, pH 등)
4. **Command**: 제어 명령 (브리지 → 디바이스)
5. **Command ACK**: 명령 응답 (디바이스 → 브리지)

#### 토픽 구조:
```
farms/{farmId}/devices/{deviceId}/registry
farms/{farmId}/devices/{deviceId}/state
farms/{farmId}/devices/{deviceId}/telemetry
farms/{farmId}/devices/{deviceId}/command
farms/{farmId}/devices/{deviceId}/command/ack
```

---

## ❌ **현재 없는 것**

### 1. 직접 연결 프로토콜
```
❌ HTTP REST API (아두이노 → 직접)
❌ WebSocket (라즈베리파이 → 직접)
❌ Serial/USB (로컬 연결)
❌ BLE (Bluetooth Low Energy)
❌ LoRaWAN
```

### 2. 네이티브 앱 연동
```
❌ 모바일 앱 직접 제어
❌ 스마트폰 센서 활용
❌ 푸시 알림 (진행 중 - Telegram만)
```

### 3. 다양한 IoT 프로토콜
```
❌ CoAP (Constrained Application Protocol)
❌ AMQP (Advanced Message Queuing Protocol)
❌ Zigbee/Z-Wave
```

---

## 🚀 **범용 브릿지 확장 설계**

### 🎯 핵심 가치 (Core Values)

#### 1️⃣ **범용성 (Universal Compatibility)**
- 다양한 디바이스와 프로토콜 지원
- 아두이노, 라즈베리파이, ESP32, 스마트폰, 상용 IoT 기기
- MQTT, HTTP, WebSocket, Serial, BLE 등 모든 프로토콜

#### 2️⃣ **사용자 친화성 (User-Friendly)**
- 코딩 지식 없이도 연결 가능한 직관적 UI
- 단계별 연결 마법사 (Step-by-step Wizard)
- 실시간 연결 상태 모니터링
- 시각적 피드백과 명확한 에러 메시지

#### 3️⃣ **즉시 사용 가능 (Plug & Play)**
- 디바이스별 맞춤형 템플릿 제공
- 복사-붙여넣기만으로 작동하는 코드
- QR 코드 기반 빠른 설정
- 원클릭 배포 키트

### 🎯 목표 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    통합 IoT 브릿지                       │
│                  (Universal Bridge)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  MQTT    │  │   HTTP   │  │WebSocket │  │ Serial  │ │
│  │ Handler  │  │ Handler  │  │ Handler  │  │Handler  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   BLE    │  │LoRaWAN   │  │ Native   │  │  Tuya   │ │
│  │ Handler  │  │ Handler  │  │App API   │  │  API    │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│              통합 메시지 프로세서                         │
│           (Protocol-Agnostic Message Bus)               │
├─────────────────────────────────────────────────────────┤
│                  Supabase DB                             │
└─────────────────────────────────────────────────────────┘
         ↓
    웹 대시보드 / 모바일 앱
```

---

## 📐 **확장 설계안**

### Phase 1: HTTP REST API 추가 (아두이노 직접 연결)

#### 새 파일 구조:
```
apps/universal-bridge/
├── src/
│   ├── protocols/
│   │   ├── mqtt/              # 기존 MQTT
│   │   │   ├── handler.ts
│   │   │   └── client.ts
│   │   ├── http/              # 새로 추가
│   │   │   ├── server.ts
│   │   │   └── routes.ts
│   │   ├── websocket/         # 새로 추가
│   │   │   └── server.ts
│   │   └── serial/            # 새로 추가
│   │       └── monitor.ts
│   ├── core/
│   │   ├── messagebus.ts      # 통합 메시지 버스
│   │   ├── deviceRegistry.ts  # 디바이스 등록 관리
│   │   └── commandQueue.ts    # 명령 큐 관리
│   └── handlers/              # 기존 유지
```

#### HTTP API 엔드포인트:
```typescript
// 아두이노 → 서버 (센서 데이터)
POST /api/bridge/telemetry
{
  "device_id": "arduino-001",
  "farm_id": "farm-uuid",
  "readings": [
    { "key": "temperature", "value": 25.5, "ts": "2025-10-01T10:00:00Z" }
  ]
}

// 아두이노 → 서버 (등록)
POST /api/bridge/registry
{
  "device_id": "arduino-001",
  "farm_id": "farm-uuid",
  "sensors": [...]
}

// 아두이노 ← 서버 (명령 확인)
GET /api/bridge/commands/{device_id}
Response: [{ "command": "on", "command_id": "..." }]

// 아두이노 → 서버 (명령 완료)
POST /api/bridge/commands/{command_id}/ack
{
  "status": "success",
  "detail": "실행 완료"
}
```

### Phase 2: WebSocket 추가 (라즈베리파이)

```typescript
// WebSocket 서버
wss://bridge.smartfarm.app/ws/{device_id}

// 양방향 실시간 통신
Client → Server: { type: "telemetry", data: {...} }
Server → Client: { type: "command", data: {...} }
```

### Phase 3: 네이티브 앱 API

```typescript
// 모바일 앱 전용 API
POST /api/app/devices/{device_id}/control
{
  "action": "toggle_pump",
  "params": { "duration": 300 }
}

// 푸시 알림
POST /api/app/notifications/subscribe
{
  "device_token": "...",
  "device_type": "ios" | "android"
}
```

---

## 🔧 **구현 방안**

### 1️⃣ **통합 메시지 버스 생성**

```typescript
// src/core/messagebus.ts
interface DeviceMessage {
  deviceId: string;
  farmId: string;
  messageType: 'registry' | 'state' | 'telemetry' | 'command' | 'ack';
  protocol: 'mqtt' | 'http' | 'websocket' | 'serial' | 'ble';
  payload: any;
  timestamp: string;
}

class UniversalMessageBus {
  async process(message: DeviceMessage): Promise<void> {
    // 프로토콜에 관계없이 동일한 처리
    switch (message.messageType) {
      case 'registry':
        await this.handleRegistry(message);
        break;
      case 'telemetry':
        await this.handleTelemetry(message);
        break;
      // ...
    }
  }
}
```

### 2️⃣ **HTTP 서버 추가**

```typescript
// src/protocols/http/server.ts
import express from 'express';

const app = express();

app.post('/api/bridge/telemetry', async (req, res) => {
  const message: DeviceMessage = {
    deviceId: req.body.device_id,
    farmId: req.body.farm_id,
    messageType: 'telemetry',
    protocol: 'http',
    payload: req.body.readings,
    timestamp: new Date().toISOString()
  };
  
  await messageBus.process(message);
  res.json({ success: true });
});
```

### 3️⃣ **WebSocket 서버 추가**

```typescript
// src/protocols/websocket/server.ts
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, req) => {
  const deviceId = extractDeviceId(req.url);
  
  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());
    await messageBus.process({
      deviceId,
      farmId: message.farm_id,
      messageType: message.type,
      protocol: 'websocket',
      payload: message.data,
      timestamp: new Date().toISOString()
    });
  });
  
  // 명령을 WebSocket으로 푸시
  commandQueue.subscribe(deviceId, (command) => {
    ws.send(JSON.stringify(command));
  });
});
```

---

## 📱 **디바이스별 연결 방식**

### 1. **아두이노 (ESP32/ESP8266)**

#### 옵션 A: MQTT (현재)
```cpp
// MQTT 클라이언트 라이브러리 사용
#include <PubSubClient.h>

void publishSensor() {
  String topic = "farms/" + farmId + "/devices/" + deviceId + "/telemetry";
  client.publish(topic.c_str(), jsonPayload);
}
```

#### 옵션 B: HTTP (새로 추가)
```cpp
// WiFiClient + HTTPClient
#include <HTTPClient.h>

void sendData() {
  HTTPClient http;
  http.begin("https://bridge.smartfarm.app/api/bridge/telemetry");
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(jsonPayload);
}
```

**추천:** HTTP (간단, 안정적, WiFi만 필요)

### 2. **라즈베리파이**

#### 옵션 A: MQTT (현재)
```python
import paho.mqtt.client as mqtt

client = mqtt.Client()
client.connect("broker.smartfarm.app", 8883)
client.publish(topic, json.dumps(data))
```

#### 옵션 B: WebSocket (새로 추가)
```python
import websocket

ws = websocket.WebSocket()
ws.connect("wss://bridge.smartfarm.app/ws/device-001")
ws.send(json.dumps(data))
```

#### 옵션 C: HTTP (가장 간단)
```python
import requests

response = requests.post(
    "https://bridge.smartfarm.app/api/bridge/telemetry",
    json={"device_id": "pi-001", "readings": [...]}
)
```

**추천:** HTTP (라즈베리파이는 성능 충분)

### 3. **네이티브 앱 (스마트스위치 등)**

```typescript
// React Native / Flutter
async function toggleDevice(deviceId: string, action: string) {
  const response = await fetch(`/api/app/devices/${deviceId}/control`, {
    method: 'POST',
    body: JSON.stringify({ action })
  });
}
```

---

## 🎯 **제안하는 확장 전략**

### 📌 **우선순위 1: HTTP REST API 추가** (가장 쉬움)

**장점:**
- ✅ 구현 간단 (Express.js 추가만)
- ✅ 아두이노 코드 단순화
- ✅ 방화벽 친화적 (HTTPS:443)
- ✅ 디버깅 쉬움 (curl/Postman)

**구현 시간:** 1-2일

### 📌 **우선순위 2: WebSocket 추가** (양방향 실시간)

**장점:**
- ✅ 실시간 양방향 통신
- ✅ 명령을 즉시 푸시 가능
- ✅ MQTT보다 단순

**구현 시간:** 2-3일

### 📌 **우선순위 3: 프로비저닝 전용 앱** (IoT 연결 도구)

**목적:** 스마트폰을 IoT 디바이스 설정 도구로 사용
- ✅ WiFi/BLE로 디바이스 자격 증명 전달
- ✅ 농장 ID 자동 바인딩
- ✅ QR 스캔 → 자동 프로비저닝
- ✅ **제어 기능 없음** (웹 어드민이 담당)

**사용 시나리오:**
```
시나리오 A: 농장 먼저 생성
1. 웹 어드민에서 농장 생성
2. 앱 실행 → 농장 ID 선택
3. 새 IoT 디바이스 스캔/연결
4. WiFi 정보 + 농장 ID 전달
5. 디바이스 자동 등록 완료

시나리오 B: 디바이스 먼저 연결
1. 앱 실행 → IoT 디바이스 연결
2. 디바이스 정보 임시 저장
3. 웹 어드민에서 농장 생성
4. 대기 중인 디바이스 → 농장 할당
5. 바인딩 완료
```

**구현 시간:** 1주일

---

## 💡 **최종 추천 아키텍처**

```
                통합 IoT 브릿지 (Universal Bridge)
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │  MQTT   │  │  HTTP   │  │   WS    │  │ Native  │   │
│  │ :1883   │  │ :3000   │  │ :8080   │  │   App   │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │
│       │            │             │            │         │
│       └────────────┴─────────────┴────────────┘         │
│                        ↓                                 │
│              통합 메시지 프로세서                         │
│          (Protocol-Agnostic Handler)                    │
│                        ↓                                 │
│    ┌─────────────────────────────────────┐              │
│    │  Registry │ State │ Telemetry │ Cmd │              │
│    └─────────────────────────────────────┘              │
│                        ↓                                 │
│                  Supabase DB                             │
└─────────────────────────────────────────────────────────┘
         ↓                              ↓
    웹 대시보드                     모바일 앱
```

### 디바이스별 최적 프로토콜:

| 디바이스 | 1순위 | 2순위 | 이유 |
|----------|-------|-------|------|
| 아두이노 (WiFi) | HTTP | MQTT | 간단, WiFi만 필요 |
| 라즈베리파이 | HTTP | WebSocket | 성능 충분, 구현 쉬움 |
| 스마트스위치 | Native App | HTTP | 사용자 편의성 |
| ESP32 | MQTT | HTTP | 저전력, 안정성 |
| 센서 허브 | MQTT | WebSocket | 실시간성 |

---

## 🔨 **구현 로드맵**

### Week 1-2: HTTP REST API 추가
```
✅ Express.js 서버 통합
✅ REST API 엔드포인트 생성
✅ 아두이노 예제 코드
✅ API 문서 작성
```

### Week 3: WebSocket 추가
```
✅ WebSocket 서버 구현
✅ 양방향 통신 테스트
✅ 라즈베리파이 예제 코드
```

### Week 4: 네이티브 앱 API
```
✅ 모바일 전용 API 설계
✅ 푸시 알림 연동
✅ React Native 예제
```

### Week 5-6: 고급 프로토콜
```
🟡 BLE 지원 (선택)
🟡 LoRaWAN 지원 (선택)
🟡 Zigbee 게이트웨이 (선택)
```

---

## 📊 **비교 분석**

### 현재 (MQTT Only) vs 확장 (Universal)

| 항목 | MQTT Only | Universal Bridge |
|------|-----------|------------------|
| 지원 디바이스 | MQTT 가능 디바이스만 | 모든 IoT 디바이스 |
| 구현 복잡도 | 낮음 | 중간 |
| 유지보수 | 쉬움 | 중간 |
| 확장성 | 제한적 | 무한대 |
| 초기 비용 | 낮음 | 중간 |
| 장기 가치 | 제한적 | 높음 |

---

## ✅ **내 최종 추천**

### 🎯 **3단계 접근**

#### **1단계: HTTP API 먼저 추가** (2주)
- 가장 범용적
- 구현 간단
- 즉시 효과

#### **2단계: WebSocket 추가** (1주)
- 실시간성 필요 시
- 라즈베리파이 최적

#### **3단계: 평가 후 결정**
- 사용 패턴 분석
- 필요한 프로토콜만 추가
- 비용/효과 검토

### 🚀 **즉시 시작 가능**

현재 MQTT 브릿지를 유지하면서:
1. HTTP API 서버 추가 (별도 포트)
2. 기존 핸들러 재사용
3. 점진적 마이그레이션

**MQTT 기능은 그대로 유지! 추가만 하면 됨!** ✅

---

## 🎨 **사용자 친화적 UI/UX 설계**

### 📱 **디바이스 연결 마법사 (Connection Wizard)**

#### Step 1: 디바이스 선택
```
┌─────────────────────────────────────────┐
│  어떤 디바이스를 연결하시겠어요?        │
├─────────────────────────────────────────┤
│                                          │
│  [📟 Arduino]  [🥧 Raspberry Pi]        │
│                                          │
│  [📱 ESP32]    [🔌 스마트플러그]        │
│                                          │
│  [🌐 기타 HTTP 기기]  [📡 MQTT 기기]   │
│                                          │
└─────────────────────────────────────────┘
```

#### Step 2: 연결 방식 선택
```
┌─────────────────────────────────────────┐
│  Arduino를 어떻게 연결하시겠어요?       │
├─────────────────────────────────────────┤
│                                          │
│  ✅ WiFi (HTTP) - 권장                  │
│     가장 쉽고 안정적                     │
│                                          │
│  ○ WiFi (MQTT)                          │
│     실시간성이 중요한 경우               │
│                                          │
│  ○ USB Serial                           │
│     컴퓨터 직접 연결                     │
│                                          │
│  [다음 단계 →]                          │
└─────────────────────────────────────────┘
```

#### Step 3: 코드 생성
```
┌─────────────────────────────────────────┐
│  🎉 연결 코드가 준비되었습니다!         │
├─────────────────────────────────────────┤
│                                          │
│  📋 Arduino 코드 (자동 생성됨)          │
│  ┌─────────────────────────────────┐   │
│  │ #include <WiFi.h>                │   │
│  │ #include <HTTPClient.h>          │   │
│  │                                  │   │
│  │ const char* ssid = "내WiFi";    │   │
│  │ const char* password = "****";   │   │
│  │ const char* deviceId = "auto-id";│   │
│  │                                  │   │
│  │ void setup() {                   │   │
│  │   // 자동 생성된 코드...         │   │
│  │ }                                │   │
│  └─────────────────────────────────┘   │
│                                          │
│  [📋 복사하기]  [📥 다운로드]           │
│                                          │
│  ✅ WiFi 정보 입력됨                    │
│  ✅ 디바이스 ID 자동 생성               │
│  ✅ 서버 주소 자동 설정                 │
│                                          │
│  [다음: 업로드 가이드 →]                │
└─────────────────────────────────────────┘
```

#### Step 4: 실시간 연결 모니터링
```
┌─────────────────────────────────────────┐
│  🔍 디바이스 연결 대기 중...            │
├─────────────────────────────────────────┤
│                                          │
│  현재 상태:                              │
│  ⏳ Arduino 업로드 대기 중              │
│                                          │
│  💡 Arduino IDE에서 코드를 업로드하고   │
│     시리얼 모니터를 확인하세요.         │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ [Arduino 시리얼 모니터]          │   │
│  │ WiFi 연결 중...                  │   │
│  │ WiFi 연결 성공!                  │   │
│  │ 서버 연결 중...                  │   │
│  │ ✅ 연결 성공!                    │   │
│  └─────────────────────────────────┘   │
│                                          │
│  🎉 디바이스가 연결되었습니다!          │
│                                          │
│  [대시보드로 이동 →]                    │
└─────────────────────────────────────────┘
```

### 🧩 **원클릭 템플릿 라이브러리**

#### 디바이스별 맞춤 템플릿
```
템플릿 라이브러리
├── Arduino/
│   ├── WiFi_HTTP_Simple/
│   │   ├── arduino_smartfarm.ino      # 복붙 가능한 코드
│   │   ├── wiring_diagram.png         # 배선도
│   │   ├── setup_guide.md             # 설정 가이드
│   │   └── troubleshooting.md         # 문제 해결
│   ├── WiFi_MQTT/
│   ├── Sensor_DHT22/
│   ├── Sensor_Soil_Moisture/
│   └── Actuator_Relay/
│
├── ESP32/
│   ├── Basic_Sensors/
│   ├── Camera_Stream/
│   └── BLE_Beacon/
│
├── Raspberry_Pi/
│   ├── Python_HTTP/
│   │   ├── smartfarm_client.py
│   │   ├── requirements.txt
│   │   ├── install.sh                 # 원클릭 설치
│   │   └── systemd_service.txt        # 자동 시작
│   ├── Python_WebSocket/
│   └── Camera_Module/
│
└── Mobile_App/
    ├── React_Native/
    └── Flutter/
```

### 📦 **연동 키트 (Integration Kit)**

#### 키트 구성
```
Arduino WiFi 연동 키트
├── 📄 자동 생성 코드
│   └── 복사-붙여넣기만 하면 작동!
│
├── 🔧 필요한 라이브러리 목록
│   ├── WiFi.h (내장)
│   ├── HTTPClient.h (내장)
│   └── ArduinoJson.h (설치 필요)
│
├── 🖼️ 시각적 가이드
│   ├── 1_connect_sensor.png
│   ├── 2_upload_code.png
│   └── 3_verify_connection.png
│
├── 🎬 비디오 튜토리얼
│   └── "5분 만에 Arduino 연결하기"
│
└── ❓ FAQ & 문제 해결
    ├── "WiFi에 연결되지 않아요"
    ├── "센서 값이 이상해요"
    └── "연결이 자주 끊어져요"
```

### 🔗 **QR 코드 빠른 설정**

#### 동작 방식
```
1. 웹 대시보드에서 "디바이스 추가" 클릭
   ↓
2. QR 코드 생성 (디바이스 설정 포함)
   ┌───────────┐
   │ ███ ▄ ███ │  
   │ █ █ █ █ █ │  ← 스캔하면 설정 자동!
   │ ███ █ ███ │
   └───────────┘
   ↓
3. 스마트폰으로 QR 스캔
   ↓
4. WiFi 정보 + 디바이스 ID 자동 입력
   ↓
5. 코드 다운로드 또는 모바일 앱 설정 완료
```

#### QR 코드에 포함되는 정보
```json
{
  "server_url": "https://bridge.smartfarm.app",
  "device_id": "auto-generated-uuid",
  "farm_id": "farm-uuid",
  "auth_token": "temporary-setup-token",
  "wifi_ssid": "optional",
  "protocol": "http" // or "mqtt", "websocket"
}
```

### 🎛️ **웹 기반 코드 생성기**

#### 인터랙티브 설정 화면
```html
┌─────────────────────────────────────────────┐
│  🛠️ Arduino 코드 생성기                     │
├─────────────────────────────────────────────┤
│                                              │
│  📍 농장 선택:                               │
│  [▼ 우리 농장 (Farm-A)]                     │
│                                              │
│  📟 센서 타입 선택:                          │
│  ☑️ 온도/습도 (DHT22)                       │
│  ☑️ 토양 수분                               │
│  ☐ EC/pH                                    │
│  ☐ 조도 센서                                │
│                                              │
│  ⚡ 액추에이터 선택:                         │
│  ☑️ 릴레이 (물 펌프)                        │
│  ☐ 서보 모터                                │
│                                              │
│  📡 전송 주기:                               │
│  [━━━●━━━━] 30초                           │
│                                              │
│  [🎨 코드 생성하기]                         │
└─────────────────────────────────────────────┘
```

#### 생성된 코드 특징
- ✅ 주석이 풍부함 (한글 설명)
- ✅ 핀 번호가 명확히 표시됨
- ✅ 에러 처리 포함
- ✅ 디버깅 메시지 포함
- ✅ 바로 작동 가능

### 📚 **통합 문서 시스템**

#### 각 디바이스별 완전한 가이드
```
Arduino 연결 가이드
├── 1. 준비물
│   ├── Arduino Uno/Nano
│   ├── DHT22 센서
│   ├── Jumper 와이어
│   └── USB 케이블
│
├── 2. 배선 방법
│   ├── 📸 실제 사진
│   ├── 🎨 회로도
│   └── 🎬 동영상 튜토리얼
│
├── 3. 코드 업로드
│   ├── Arduino IDE 설치
│   ├── 라이브러리 설치
│   └── 코드 업로드 방법
│
├── 4. 연결 확인
│   ├── 시리얼 모니터 체크
│   ├── 웹 대시보드 확인
│   └── 센서 데이터 확인
│
└── 5. 문제 해결
    ├── 컴파일 에러
    ├── 업로드 실패
    ├── WiFi 연결 실패
    └── 센서 값 이상
```

### 🎓 **비디오 튜토리얼 시리즈**

#### 제작할 튜토리얼 목록
1. **"완전 초보자를 위한 Arduino 연결"** (10분)
   - 준비물 확인
   - 배선 방법
   - 코드 업로드
   - 연결 확인

2. **"라즈베리파이로 센서 허브 만들기"** (15분)
   - OS 설치
   - Python 스크립트 실행
   - 여러 센서 연결

3. **"스마트폰으로 스마트팜 제어하기"** (8분)
   - 모바일 앱 설치
   - 디바이스 연결
   - 원격 제어

4. **"문제 해결 가이드"** (12분)
   - 흔한 오류 해결
   - 디버깅 방법
   - 로그 확인

### 🔧 **디바이스 지원 로드맵**

#### Phase 1: 기본 디바이스 (즉시 지원)
```
✅ Arduino (WiFi - HTTP)
✅ Arduino (WiFi - MQTT)
✅ ESP32/ESP8266
✅ Raspberry Pi (Python)
✅ 웹 브라우저 (테스트)
```

#### Phase 2: 확장 지원 (1개월 내)
```
🔲 Raspberry Pi Pico W
🔲 STM32 보드
🔲 Android 앱 (React Native)
🔲 iOS 앱 (React Native)
🔲 Tuya 스마트 기기
```

#### Phase 3: 고급 지원 (3개월 내)
```
🔲 LoRaWAN 게이트웨이
🔲 Zigbee 허브
🔲 BLE 비콘
🔲 상용 스마트 센서
🔲 PLC 연동
```

### 💡 **사용자 경험 개선 포인트**

#### 1. **제로 설정 (Zero Configuration)**
- QR 코드 스캔 → 자동 설정
- WiFi 정보만 입력하면 끝
- 복잡한 네트워크 설정 불필요

#### 2. **실시간 피드백**
- 연결 상태를 실시간으로 표시
- 에러 발생 시 즉시 알림
- 해결 방법 자동 제안

#### 3. **시각적 가이드**
- 모든 단계를 이미지로 표시
- 애니메이션으로 동작 설명
- 색상 코딩 (성공=녹색, 대기=노랑, 실패=빨강)

#### 4. **커뮤니티 지원**
- 사용자 제공 템플릿 공유
- 문제 해결 포럼
- 성공 사례 갤러리

---

## 🎯 **최종 목표**

### **"5분 안에 누구나 디바이스를 연결할 수 있다!"**

#### 이상적인 사용자 여정
```
1분: 웹 대시보드에서 "디바이스 추가" 클릭
     ↓
1분: 디바이스 선택 (Arduino)
     ↓
1분: 코드 생성 및 복사
     ↓
2분: Arduino IDE에 붙여넣기 & 업로드
     ↓
= 5분: ✅ 연결 완료! 센서 데이터 실시간 확인
```

#### 성공 지표 (KPI)
- ⏱️ 평균 연결 시간: **5분 이하**
- 📊 첫 시도 성공률: **90% 이상**
- 🎓 기술 지식 요구: **초급 수준**
- 📱 지원 요청 건수: **월 5건 이하**

---

---

## 🏗️ **v2.0 Production-Ready 설계**

### 📐 **개요**

기존 사용자 친화성 중심 설계에 **프로덕션 레벨의 보안, 신뢰성, 확장성**을 추가한 통합 설계

### 🔐 **1. 디바이스 신원 & 프로비저닝**

#### **Claim → Bind → Rotate 3단계 보안**

```typescript
// 1단계: Claim (클레임)
interface SetupToken {
  token: string;              // 10분 유효 임시 토큰
  tenant_id: string;          // 테넌트 범위 제한
  farm_id?: string;           // 선택적 농장 제한
  ip_whitelist?: string[];    // IP 제한 (옵션)
  user_agent?: string;        // User-Agent 제한 (옵션)
  expires_at: Date;           // 만료 시간
}

// 웹 마법사에서 발급
POST /api/provisioning/claim
{
  "tenant_id": "tenant-xxx",
  "farm_id": "farm-yyy",
  "ttl": 600  // 10분
}

Response:
{
  "setup_token": "ST_xxxxxxxxxxxx",
  "expires_at": "2025-10-01T18:50:00Z",
  "qr_code": "data:image/png;base64,..."
}
```

```typescript
// 2단계: Bind (바인딩)
// 디바이스가 Setup-Token으로 최초 등록
POST /api/provisioning/bind
Headers:
  x-setup-token: ST_xxxxxxxxxxxx
Body:
{
  "device_id": "esp32-abc123",
  "device_type": "esp32",
  "capabilities": ["temperature", "humidity"],
  "public_key": "..." // 옵션: X.509 사용 시
}

Response:
{
  "device_key": "DK_yyyyyyyyyyyy",  // 영구 PSK (Pre-Shared Key)
  "tenant_id": "tenant-xxx",
  "farm_id": "farm-yyy",
  "server_url": "https://bridge.smartfarm.app",
  "mqtt_broker": "mqtts://mqtt.smartfarm.app:8883"  // 옵션
}
```

```typescript
// 3단계: Rotate (키 회전)
// 키 유출/교체 시 무중단 교체
POST /api/provisioning/rotate
Headers:
  x-device-id: esp32-abc123
  x-device-key: DK_yyyyyyyyyyyy  // 현재 키
Body:
{
  "reason": "scheduled_rotation" | "key_compromised"
}

Response:
{
  "new_device_key": "DK_zzzzzzzzzz",
  "grace_period": 3600,  // 1시간 유예 (두 키 모두 유효)
  "expires_at": "2025-10-01T19:50:00Z"
}
```

#### **인증 방식 선택**

##### **기본: PSK + HMAC-SHA256**
```typescript
// 모든 요청에 서명 헤더 포함
Headers:
  x-device-id: esp32-abc123
  x-signature: HMAC-SHA256(device_key, body + timestamp)
  x-timestamp: 1696176000
  x-tenant-id: tenant-xxx

// 서버 검증
function verifySignature(req: Request): boolean {
  const { device_id, signature, timestamp, tenant_id } = req.headers;
  
  // 1. Timestamp 검증 (5분 이내)
  if (Date.now() - timestamp > 300000) return false;
  
  // 2. Device Key 조회 (tenant_id 스코프)
  const device_key = await getDeviceKey(device_id, tenant_id);
  
  // 3. 서명 검증
  const expected = hmacSHA256(device_key, req.body + timestamp);
  return signature === expected;
}
```

##### **고급: X.509 인증서 (ESP32)**
```typescript
// ESP32 Secure Element 사용
interface DeviceCertificate {
  cert_pem: string;           // X.509 인증서
  private_key: "secure";      // Secure Element 저장
  ca_cert: string;            // 루트 CA
}

// mTLS 연결
const tlsOptions = {
  cert: fs.readFileSync('device.crt'),
  key: 'secure_element',
  ca: fs.readFileSync('ca.crt')
};
```

##### **JWT 방식 (선택)**
```typescript
// 테넌트별 SigningKey (KMS 관리)
interface DeviceJWT {
  sub: string;        // device_id
  tenant_id: string;
  farm_id: string;
  iat: number;
  exp: number;
}

// 발급
const jwt = signJWT(deviceInfo, tenantSigningKey);

// 검증
const decoded = verifyJWT(jwt, tenantSigningKey);
```

---

### 🏢 **2. 멀티테넌트 & 권한**

#### **Supabase RLS 정책**

```sql
-- devices 테이블 파티셔닝
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  farm_id UUID REFERENCES farms(id),
  device_id TEXT NOT NULL,
  device_key_hash TEXT NOT NULL,  -- bcrypt 해시
  profile_id UUID REFERENCES device_profiles(id),
  fw_version TEXT,
  last_seen_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, device_id)
);

CREATE INDEX idx_devices_tenant_farm ON devices(tenant_id, farm_id);
CREATE INDEX idx_devices_last_seen ON devices(last_seen_at) WHERE status = 'active';

-- RLS 정책
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON devices
  USING (tenant_id = current_tenant_id());

-- device_claims 테이블 (Setup Token)
CREATE TABLE device_claims (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  setup_token_hash TEXT NOT NULL,  -- bcrypt
  farm_id UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_device_id TEXT,
  ip_bound INET[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claims_expires ON device_claims(expires_at) WHERE used_at IS NULL;

-- readings 테이블
CREATE TABLE readings (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  device_id UUID NOT NULL REFERENCES devices(id),
  ts TIMESTAMPTZ NOT NULL,
  key TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  raw JSONB,
  schema_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_readings_tenant_device_ts ON readings(tenant_id, device_id, ts DESC);
CREATE INDEX idx_readings_ts ON readings(ts) WHERE ts > NOW() - INTERVAL '7 days';

-- commands 테이블
CREATE TABLE commands (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  device_id UUID NOT NULL REFERENCES devices(id),
  msg_id TEXT NOT NULL,  -- Idempotency Key
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending',  -- pending, sent, acked, failed, timeout
  ack_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,
  last_error TEXT,
  UNIQUE(tenant_id, msg_id)
);

CREATE INDEX idx_commands_pending ON commands(tenant_id, device_id, status) 
  WHERE status IN ('pending', 'sent');
```

#### **테넌트 간 데이터 격리**

```typescript
// 마법사 진입 시
async function generateSetupToken(userId: string): Promise<SetupToken> {
  // 1. 현재 사용자의 tenant_id 확인
  const tenant_id = await getCurrentTenantId(userId);
  
  // 2. 토큰 생성 (테넌트 스코프)
  const token = await createSetupToken({
    tenant_id,
    farm_id: selectedFarmId,  // 옵션
    ttl: 600
  });
  
  return token;
}

// 서버 검증
async function validateBinding(setupToken: string, deviceInfo: any) {
  const claim = await getClaim(setupToken);
  
  // tenant_id 검증
  if (claim.tenant_id !== deviceInfo.tenant_id) {
    throw new Error('Tenant mismatch');
  }
  
  // farm_id → tenant_id 매핑 검증
  if (deviceInfo.farm_id) {
    const farm = await getFarm(deviceInfo.farm_id);
    if (farm.tenant_id !== claim.tenant_id) {
      throw new Error('Farm not in tenant');
    }
  }
}
```

---

### 📋 **3. 메시지 스키마 & 버전 관리**

#### **Schema Registry (Zod 기반)**

```typescript
// schemas/telemetry.v1.ts
import { z } from 'zod';

export const TelemetryV1 = z.object({
  device_id: z.string(),
  readings: z.array(z.object({
    key: z.string(),
    value: z.number(),
    unit: z.enum(['celsius', 'fahrenheit', 'percent', 'ms_cm', 'ph', 'lux']),
    ts: z.string().datetime(),
    tier: z.number().int().min(1).max(3).optional()
  })),
  schema_version: z.literal('telemetry.v1'),
  timestamp: z.string().datetime()
});

export type TelemetryV1 = z.infer<typeof TelemetryV1>;

// schemas/command.v1.ts
export const CommandV1 = z.object({
  msg_id: z.string().uuid(),  // Idempotency Key
  device_id: z.string(),
  command: z.enum(['on', 'off', 'set_value']),
  payload: z.record(z.unknown()).optional(),
  schema_version: z.literal('command.v1'),
  timestamp: z.string().datetime()
});
```

#### **정규화 규칙**

```typescript
// 단위 표준화
const UNIT_CONVERSIONS = {
  // 온도
  'fahrenheit': (f: number) => ({ value: (f - 32) * 5/9, unit: 'celsius' }),
  'kelvin': (k: number) => ({ value: k - 273.15, unit: 'celsius' }),
  
  // EC
  'us_cm': (us: number) => ({ value: us / 1000, unit: 'ms_cm' }),
  
  // 습도는 항상 percent
  'rh': (rh: number) => ({ value: rh, unit: 'percent' })
};

function normalizeReading(reading: any) {
  const converter = UNIT_CONVERSIONS[reading.unit];
  if (converter) {
    return converter(reading.value);
  }
  return reading;
}
```

#### **호환성 전략**

```typescript
// 서버는 v1/v2 모두 수락, canonical vX로 저장
async function processMessage(raw: any) {
  // 1. 스키마 버전 감지
  const version = raw.schema_version || 'legacy';
  
  // 2. 마이그레이션
  let canonical: TelemetryV1;
  switch (version) {
    case 'legacy':
      canonical = migrateLegacyToV1(raw);
      break;
    case 'telemetry.v1':
      canonical = TelemetryV1.parse(raw);
      break;
    case 'telemetry.v2':
      canonical = migrateV2ToV1(raw);  // 하위 호환
      break;
  }
  
  // 3. 정규화
  canonical.readings = canonical.readings.map(normalizeReading);
  
  // 4. 저장
  await saveToDatabase(canonical);
}
```

---

### 🔄 **4. 신뢰성 & 멱등성**

#### **Idempotency (중복 방지)**

```typescript
// HTTP 헤더
Headers:
  Idempotency-Key: uuid-or-msg-id

// Redis 캐시 (TTL 24h)
async function handleTelemetry(req: Request) {
  const key = req.headers['idempotency-key'];
  
  // 1. 캐시 확인
  const cached = await redis.get(`idempotency:${key}`);
  if (cached) {
    return JSON.parse(cached);  // 동일 응답 반환
  }
  
  // 2. 처리
  const result = await processTelemetry(req.body);
  
  // 3. 캐시 저장
  await redis.setex(`idempotency:${key}`, 86400, JSON.stringify(result));
  
  return result;
}
```

#### **QoS & ACK 시스템**

```typescript
// 명령 발행 → ACK 대기 → 타임아웃 재전송
class CommandDispatcher {
  async sendCommand(cmd: Command) {
    // 1. DB 저장 (status: pending)
    await db.commands.insert({
      ...cmd,
      msg_id: uuid(),
      status: 'pending',
      retry_count: 0
    });
    
    // 2. 발행
    await publishToDevice(cmd);
    
    // 3. ACK 대기 (타임아웃: 10초)
    const ack = await waitForAck(cmd.msg_id, 10000);
    
    if (!ack) {
      // 4. 재전송 (지수 백오프)
      await this.retryWithBackoff(cmd);
    }
  }
  
  async retryWithBackoff(cmd: Command, attempt = 1) {
    const maxRetries = 3;
    if (attempt > maxRetries) {
      // Dead Letter Queue로 이동
      await moveToDeadLetter(cmd);
      return;
    }
    
    // 지수 백오프: 2^attempt초
    await sleep(Math.pow(2, attempt) * 1000);
    
    await publishToDevice(cmd);
    await db.commands.update(cmd.id, { retry_count: attempt });
    
    const ack = await waitForAck(cmd.msg_id, 10000);
    if (!ack) {
      await this.retryWithBackoff(cmd, attempt + 1);
    }
  }
}
```

#### **오프라인 버퍼**

```cpp
// ESP32/Arduino 오프라인 큐
#include <Preferences.h>

Preferences nvs;
const int MAX_QUEUE_SIZE = 50;

void queueReading(Reading reading) {
  nvs.begin("smartfarm", false);
  
  int queueSize = nvs.getInt("queue_size", 0);
  if (queueSize >= MAX_QUEUE_SIZE) {
    // 가장 오래된 항목 제거 (FIFO)
    nvs.remove("reading_0");
    for (int i = 1; i < queueSize; i++) {
      // 앞으로 이동
      String val = nvs.getString(("reading_" + String(i)).c_str());
      nvs.putString(("reading_" + String(i-1)).c_str(), val);
    }
    queueSize--;
  }
  
  // 새 항목 추가
  nvs.putString(("reading_" + String(queueSize)).c_str(), 
                serializeReading(reading));
  nvs.putInt("queue_size", queueSize + 1);
  nvs.end();
}

void flushQueue() {
  if (!WiFi.isConnected()) return;
  
  nvs.begin("smartfarm", false);
  int queueSize = nvs.getInt("queue_size", 0);
  
  for (int i = 0; i < queueSize; i++) {
    String data = nvs.getString(("reading_" + String(i)).c_str());
    if (sendToServer(data)) {
      nvs.remove(("reading_" + String(i)).c_str());
    } else {
      break;  // 실패 시 중단
    }
  }
  
  // 큐 크기 업데이트
  nvs.putInt("queue_size", 0);
  nvs.end();
}
```

#### **시간 동기화**

```cpp
// NTP 동기화
#include <time.h>

void syncTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 5000)) {
    Serial.println("NTP sync failed, using server timestamp");
    useServerTimestamp = true;
  } else {
    Serial.println("NTP synced");
    useServerTimestamp = false;
  }
}

String getTimestamp() {
  if (useServerTimestamp) {
    // 서버에서 타임스탬프 받아오기
    return requestServerTimestamp();
  } else {
    // 로컬 시간 사용
    return getCurrentISOTime();
  }
}
```

---

### 📊 **5. 관측성 & 운영**

#### **OpenTelemetry 통합**

```typescript
import { trace, metrics } from '@opentelemetry/api';

const tracer = trace.getTracer('universal-bridge');
const meter = metrics.getMeter('universal-bridge');

// 텔레메트리 수집 추적
async function ingestTelemetry(req: Request) {
  const span = tracer.startSpan('ingestion.telemetry', {
    attributes: {
      'device.id': req.body.device_id,
      'tenant.id': req.headers['x-tenant-id']
    }
  });
  
  try {
    // 1. 디코딩
    const decoded = await span.startChild('decode').run(() => {
      return JSON.parse(req.body);
    });
    
    // 2. 검증
    await span.startChild('validate').run(async () => {
      return TelemetryV1.parse(decoded);
    });
    
    // 3. 정규화
    const normalized = await span.startChild('normalize').run(() => {
      return normalizeReadings(decoded);
    });
    
    // 4. 저장
    await span.startChild('upsert').run(async () => {
      return db.readings.insert(normalized);
    });
    
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
```

#### **핵심 지표**

```typescript
// Prometheus 지표
const ingestLatency = meter.createHistogram('ingest_latency_ms', {
  description: 'Telemetry ingestion latency',
  unit: 'ms'
});

const cmdAckLatency = meter.createHistogram('cmd_ack_latency_ms', {
  description: 'Command ACK roundtrip latency',
  unit: 'ms'
});

const deviceOnlineRatio = meter.createGauge('device_online_ratio', {
  description: 'Ratio of online devices'
});

const dropRate = meter.createCounter('message_drop_rate', {
  description: 'Dropped messages due to errors'
});

const schemaErrorRate = meter.createCounter('schema_error_rate', {
  description: 'Schema validation errors'
});

// 수집
ingestLatency.record(Date.now() - startTime, {
  protocol: 'http',
  tenant_id: req.tenant_id
});
```

#### **헬스 대시보드**

```typescript
// 디바이스 헬스 정보
interface DeviceHealth {
  device_id: string;
  online: boolean;
  rssi: number;          // WiFi 신호 강도
  battery: number;       // 배터리 (%)
  fw_version: string;
  last_seen: Date;
  error_log: ErrorEntry[];
  retry_rate: number;    // 재시도 비율
  uptime: number;        // 초
}

// API 엔드포인트
GET /api/health/devices/:device_id
{
  "device_id": "esp32-abc123",
  "status": "online",
  "metrics": {
    "rssi": -65,
    "battery": 85,
    "fw_version": "1.2.3",
    "uptime": 86400,
    "last_seen": "2025-10-01T18:45:00Z"
  },
  "recent_errors": [
    {
      "ts": "2025-10-01T17:30:00Z",
      "type": "wifi_reconnect",
      "detail": "Connection timeout after 30s"
    }
  ],
  "statistics": {
    "messages_sent_24h": 2880,
    "retry_rate": 0.02,
    "avg_latency_ms": 145
  }
}
```

---

### 🛡️ **6. 보안 & 레이트리밋**

#### **레이트리밋 (Token Bucket)**

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';

// 테넌트별 제한
const tenantLimiter = new RateLimiterRedis({
  points: 10000,        // 1만 req/min
  duration: 60,
  blockDuration: 60
});

// 디바이스별 제한
const deviceLimiter = new RateLimiterRedis({
  points: 60,          // 60 req/min
  duration: 60,
  blockDuration: 300,  // 5분 차단
  burst: 120           // 버스트 허용
});

async function checkRateLimit(req: Request) {
  const tenant_id = req.headers['x-tenant-id'];
  const device_id = req.headers['x-device-id'];
  
  // 테넌트 체크
  await tenantLimiter.consume(tenant_id);
  
  // 디바이스 체크
  await deviceLimiter.consume(`${tenant_id}:${device_id}`);
}
```

#### **WebSocket 보안**

```typescript
// 토큰 재검증 (5분마다)
class SecureWebSocket {
  private refreshInterval = 300000; // 5분
  
  constructor(private ws: WebSocket) {
    setInterval(() => this.refreshToken(), this.refreshInterval);
  }
  
  async refreshToken() {
    const newToken = await requestNewToken();
    this.ws.send(JSON.stringify({
      type: 'auth_refresh',
      token: newToken
    }));
  }
  
  // 메시지 크기 제한
  onMessage(data: any) {
    if (data.length > 1024 * 1024) {  // 1MB
      this.ws.close(1009, 'Message too large');
      return;
    }
    
    // 처리...
  }
  
  // Ping/Pong watchdog
  startWatchdog() {
    setInterval(() => {
      this.ws.ping();
      
      setTimeout(() => {
        if (!this.pongReceived) {
          this.ws.close(1001, 'Ping timeout');
        }
      }, 5000);
    }, 30000);
  }
}
```

#### **CORS & 보안 헤더**

```typescript
// 테넌트 도메인 화이트리스트
const allowedOrigins = [
  'https://acme.smartfarm.app',
  'https://demo.smartfarm.app',
  'https://xyz.smartfarm.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // 서브도메인 패턴 검증
    if (!origin || /^https:\/\/[\w-]+\.smartfarm\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 보안 헤더
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "wss://*.smartfarm.app"]
    }
  }
}));
```

#### **로그 마스킹**

```typescript
// PII/시크릿 자동 마스킹
function sanitizeLog(obj: any): any {
  const sensitive = ['password', 'device_key', 'setup_token', 'auth_token'];
  
  return Object.keys(obj).reduce((acc, key) => {
    if (sensitive.includes(key)) {
      acc[key] = '***REDACTED***';
    } else if (typeof obj[key] === 'object') {
      acc[key] = sanitizeLog(obj[key]);
    } else {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as any);
}

logger.info('Device registered', sanitizeLog(deviceInfo));
```

---

### ☁️ **7. 배포 & 비용 전략**

#### **HTTP/WS 엔드포인트**

```typescript
// Vercel Edge Functions
// api/bridge/telemetry.ts
export const config = {
  runtime: 'edge',
  regions: ['icn1', 'pdx1', 'fra1']  // Seoul, Portland, Frankfurt
};

export default async function handler(req: Request) {
  // 지역별 가장 가까운 Supabase 연결
  const supabase = createClient(process.env.SUPABASE_URL);
  
  // 처리...
}

// 고트래픽 테넌트는 Cloudflare Workers로
// workers/bridge.ts
export default {
  async fetch(req: Request, env: Env) {
    // Cloudflare D1 or Supabase
    const result = await processTelemetry(req);
    return new Response(JSON.stringify(result));
  }
}
```

#### **백그라운드 처리**

```typescript
// Cloudflare Queues
interface TelemetryJob {
  device_id: string;
  readings: Reading[];
  priority: 'high' | 'normal' | 'low';
}

// Producer
await env.TELEMETRY_QUEUE.send({
  device_id: 'esp32-abc',
  readings: data.readings,
  priority: 'normal'
});

// Consumer
export default {
  async queue(batch: MessageBatch<TelemetryJob>) {
    for (const msg of batch.messages) {
      await processReadings(msg.body);
      msg.ack();
    }
  }
}
```

#### **MQTT 브로커 선택**

```typescript
// 환경 변수로 스위치
const mqttConfig = {
  broker: process.env.MQTT_BROKER_TYPE === 'managed'
    ? 'mqtts://mqtt.smartfarm.app:8883'  // Managed (HiveMQ Cloud)
    : 'mqtts://self-hosted.smartfarm.app:8883',  // Self-hosted (Mosquitto)
  
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
};
```

#### **저장 비용 제어**

```sql
-- Cold partition (30일 이상 데이터)
CREATE TABLE readings_archive (
  LIKE readings INCLUDING ALL
) PARTITION BY RANGE (ts);

-- 자동 아카이브 (일일 cron)
INSERT INTO readings_archive
SELECT * FROM readings
WHERE ts < NOW() - INTERVAL '30 days';

DELETE FROM readings
WHERE ts < NOW() - INTERVAL '30 days';

-- 집계 테이블 (Materialized View)
CREATE MATERIALIZED VIEW readings_hourly AS
SELECT
  device_id,
  date_trunc('hour', ts) as hour,
  key,
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  COUNT(*) as count
FROM readings
GROUP BY device_id, hour, key;

-- 대시보드는 집계 테이블 사용
SELECT * FROM readings_hourly
WHERE device_id = 'esp32-abc'
  AND hour >= NOW() - INTERVAL '7 days';
```

---

### 🧪 **8. 온보딩 마법사 보강**

#### **Preflight 체크**

```typescript
// 연결 전 사전 점검
interface PreflightCheck {
  name: string;
  status: 'pending' | 'checking' | 'passed' | 'failed';
  message?: string;
}

async function runPreflightChecks(): Promise<PreflightCheck[]> {
  return [
    {
      name: 'Port reachability',
      status: await checkPort(8883) ? 'passed' : 'failed',
      message: 'MQTT port 8883 accessible'
    },
    {
      name: 'Broker availability',
      status: await pingBroker() ? 'passed' : 'failed',
      message: 'MQTT broker responding'
    },
    {
      name: 'User permissions',
      status: await checkPermissions() ? 'passed' : 'failed',
      message: 'User has device:create permission'
    },
    {
      name: 'Rate limit',
      status: await checkRateLimit() ? 'passed' : 'failed',
      message: 'Within rate limit'
    },
    {
      name: 'Time sync',
      status: 'checking',
      message: 'Checking device time sync...'
    }
  ];
}
```

#### **라이브 로그 스트림**

```typescript
// 실시간 로그 WebSocket
const ws = new WebSocket('wss://api.smartfarm.app/logs/device/esp32-abc');

ws.onmessage = (event) => {
  const log = JSON.parse(event.data);
  
  // UI에 표시
  appendLog({
    timestamp: log.ts,
    level: log.level,  // info, warn, error
    message: log.message,
    source: log.source  // ingestion, validation, storage
  });
};

// 예시 로그
{
  "ts": "2025-10-01T18:50:12.345Z",
  "level": "info",
  "source": "ingestion",
  "message": "Telemetry received: 3 readings",
  "device_id": "esp32-abc"
}

{
  "ts": "2025-10-01T18:50:12.456Z",
  "level": "success",
  "source": "storage",
  "message": "Stored 3 readings to database",
  "latency_ms": 45
}
```

#### **실패 처방 카드**

```typescript
// 오류별 자동 가이드
const troubleshootingGuides = {
  'WIFI_CONNECT_FAILED': {
    title: 'WiFi 연결 실패',
    steps: [
      '1. WiFi SSID와 비밀번호 확인',
      '2. 2.4GHz WiFi인지 확인 (ESP32는 5GHz 미지원)',
      '3. 공유기와의 거리 확인',
      '4. 방화벽 설정 확인'
    ],
    codeSnippet: `
// WiFi 연결 디버깅
WiFi.begin(ssid, password);
Serial.print("Connecting");
while (WiFi.status() != WL_CONNECTED) {
  delay(500);
  Serial.print(".");
  Serial.println(WiFi.status());  // 상태 코드 확인
}
    `,
    videoUrl: 'https://docs.smartfarm.app/videos/wifi-troubleshooting'
  },
  
  'AUTH_FAILED': {
    title: '인증 실패',
    steps: [
      '1. Setup Token이 만료되지 않았는지 확인 (10분 유효)',
      '2. QR 코드 다시 스캔',
      '3. 웹 어드민에서 새 토큰 발급',
      '4. Device Key가 올바른지 확인'
    ],
    codeSnippet: `
// 토큰 확인
Serial.println("Setup Token: " + setupToken);
Serial.println("Expires: " + expiresAt);
    `
  },
  
  'SCHEMA_VALIDATION_ERROR': {
    title: '데이터 형식 오류',
    steps: [
      '1. JSON 형식이 올바른지 확인',
      '2. 필수 필드 누락 확인 (device_id, readings, timestamp)',
      '3. 단위가 표준 단위인지 확인 (celsius, percent 등)',
      '4. 타임스탬프 형식 확인 (ISO 8601)'
    ],
    codeSnippet: `
// 올바른 JSON 형식
{
  "device_id": "esp32-abc",
  "readings": [
    {
      "key": "temperature",
      "value": 25.5,
      "unit": "celsius",
      "ts": "2025-10-01T18:50:00Z"
    }
  ],
  "schema_version": "telemetry.v1",
  "timestamp": "2025-10-01T18:50:00Z"
}
    `
  }
};
```

---

### 📊 **9. 수락 기준 (KPI/SLO)**

#### **성능 목표**

```typescript
interface AcceptanceCriteria {
  // 연결 시간
  connection_time_p95: {
    target: 300,  // 5분 이하
    unit: 'seconds',
    measurement: 'from wizard start to dashboard data'
  },
  
  // 텔레메트리 지연
  telemetry_latency_p95: {
    http_ws: { target: 2, unit: 'seconds' },
    mqtt: { target: 5, unit: 'seconds' }
  },
  
  // 명령 왕복 시간
  command_roundtrip_p95: {
    ws_mqtt: { target: 1, unit: 'seconds' },
    http_polling: { target: 3, unit: 'seconds' }
  },
  
  // 성공률
  first_attempt_success_rate: {
    target: 0.90,  // 90% 이상
    measurement: 'successful connections on first try'
  },
  
  // 재연결 실패율
  reconnect_failure_rate_24h: {
    target: 0.01,  // 1% 이하
    measurement: 'failed reconnections within 24h'
  },
  
  // 보안
  setup_token_expiry_compliance: {
    target: 1.0,  // 100%
    measurement: 'tokens expire within 10 minutes'
  },
  
  key_rotation_test: {
    target: 'pass',
    measurement: 'zero-downtime key rotation successful'
  }
}
```

#### **모니터링 쿼리**

```sql
-- 연결 시간 p95
SELECT
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY connection_time_seconds)
FROM device_connections
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 텔레메트리 지연 p95
SELECT
  protocol,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)
FROM telemetry_metrics
WHERE ts >= NOW() - INTERVAL '1 hour'
GROUP BY protocol;

-- 첫 시도 성공률
SELECT
  COUNT(*) FILTER (WHERE attempt = 1 AND status = 'success')::FLOAT
    / COUNT(*) as success_rate
FROM device_connections
WHERE created_at >= NOW() - INTERVAL '7 days';
```

---

### 🗂️ **10. 파일 구조 (구체안)**

```
apps/universal-bridge/
├── src/
│   ├── index.ts                    # 메인 진입점
│   ├── core/
│   │   ├── messagebus.ts          # 프로토콜 독립적 메시지 버스
│   │   ├── validation.ts          # Zod 스키마 검증
│   │   ├── schemaRegistry.ts      # 버전별 스키마 관리
│   │   ├── idempotency.ts         # 중복 방지
│   │   └── retry.ts               # 재시도 로직
│   ├── security/
│   │   ├── auth.ts                # PSK/JWT/X.509 인증
│   │   ├── signer.ts              # HMAC 서명
│   │   └── ratelimit.ts           # 레이트리밋
│   ├── provisioning/
│   │   ├── claim.ts               # Setup Token 발급
│   │   ├── bind.ts                # 디바이스 바인딩
│   │   └── rotate.ts              # 키 회전
│   ├── protocols/
│   │   ├── http/
│   │   │   ├── server.ts          # Express 서버
│   │   │   └── routes.ts          # REST 엔드포인트
│   │   ├── websocket/
│   │   │   └── server.ts          # WebSocket 서버
│   │   ├── mqtt/
│   │   │   ├── client.ts          # MQTT 클라이언트 (기존)
│   │   │   └── handler.ts         # MQTT 핸들러 (기존)
│   │   └── serial/
│   │       ├── ble.ts             # BLE 통신
│   │       └── usb.ts             # USB Serial
│   ├── observability/
│   │   ├── tracing.ts             # OpenTelemetry
│   │   ├── metrics.ts             # Prometheus 지표
│   │   └── logging.ts             # 구조화 로깅
│   └── templates/
│       ├── payloads/              # 메시지 예시
│       ├── rules/                 # 검증 규칙
│       └── dashboards/            # Grafana 대시보드
│
├── package.json
├── tsconfig.json
└── README.md

apps/web-admin/
├── src/
│   ├── app/
│   │   ├── connect/
│   │   │   └── page.tsx          # 연결 마법사 페이지
│   │   └── health/
│   │       └── page.tsx          # 디바이스 헬스 대시보드
│   ├── components/
│   │   └── connect/
│   │       ├── ConnectWizard.tsx # 메인 마법사
│   │       ├── DeviceSelector.tsx
│   │       ├── QRCodeCard.tsx    # QR 생성/표시
│   │       ├── CopySnippet.tsx   # 코드 복사
│   │       ├── LiveLog.tsx       # 실시간 로그
│   │       ├── Preflight.tsx     # 사전 점검
│   │       └── DiagCard.tsx      # 진단 카드
│   └── lib/
│       └── connect/
│           ├── api.ts            # API 래퍼
│           └── snippet.ts        # 코드 생성기
│
├── package.json
└── tsconfig.json

docs/
├── 13_UNIVERSAL_BRIDGE_V2.md          # v2.0 전체 설계
├── 14_DEVICE_PROFILES.md              # 디바이스 프로필
├── 15_CONNECTION_WIZARD.md            # 연결 마법사 가이드
├── 16_INTEGRATION_KITS.md             # 통합 키트
├── 17_TEST_SIMULATORS.md              # 테스트 시뮬레이터
├── 18_SDK_GUIDES.md                   # SDK 가이드
└── 12_ACCEPTANCE_CHECKS.md (updated)  # 수락 기준

packages/
└── device-sdk/                         # 디바이스용 SDK
    ├── arduino/
    │   ├── SmartFarmClient.h
    │   └── SmartFarmClient.cpp
    ├── python/
    │   └── smartfarm_client.py
    └── javascript/
        └── smartfarm-client.ts
```

---

### ⚠️ **11. 위험 & 비용 체크**

#### **트래픽 비용**

```typescript
// 고트래픽 테넌트 감지
async function checkTrafficCost(tenant_id: string) {
  const monthlyRequests = await getMonthlyRequests(tenant_id);
  
  if (monthlyRequests > 10_000_000) {  // 1천만 req/월
    // MQTT 우선 권장
    await notifyTenantAdmin(tenant_id, {
      type: 'cost_optimization',
      message: 'HTTP/WS 트래픽이 높습니다. MQTT로 전환하면 비용 절감 가능',
      estimated_savings: calculateSavings(monthlyRequests)
    });
  }
}
```

#### **보안 주의사항**

```typescript
// QR 코드에 민감 정보 넣지 않기
interface QRCodeData {
  server_url: string;
  setup_token: string;  // 10분 단기 토큰
  tenant_id: string;
  farm_id?: string;
  
  // ❌ 포함하지 말 것
  // device_key: string;
  // user_password: string;
  // api_secret: string;
}

// 디바이스 영구키는 안전 저장
// ESP32: NVS (Encrypted)
nvs_set_str(nvs_handle, "device_key", encrypted_key);

// Android: Keychain
KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
```

#### **LoRa/Zigbee 게이트웨이**

```
Phase 1-3: MQTT/HTTP/WS 직접 연결
                ↓
Phase 4: 게이트웨이 패턴
┌──────────┐
│ LoRa 센서 │
└─────┬────┘
      │
┌─────▼────────┐
│ LoRaWAN GW   │ ← 별도 게이트웨이
└─────┬────────┘
      │ MQTT/HTTP
┌─────▼────────┐
│Universal     │
│Bridge        │
└──────────────┘
```

---

### 🚀 **12. 구현 시작 (Cursor Prompt)**

```
You are refactoring to "Universal IoT Bridge — v2.0 Production-Ready".

Create branch: feat/universal-bridge-v2

Objectives:
- Device provisioning (claim→bind→rotate) with tenant security
- Idempotency, retry, schema registry (Zod)
- Connect Wizard with preflight, live logs, QR + code generator
- Keep MQTT flow, add HTTP/WS without breaking changes
- OpenTelemetry hooks, acceptance KPIs

Deliverables (create TODO stubs with comments):
1) Server/bridge files in apps/universal-bridge/src/
2) Web admin onboarding in apps/web-admin/src/app/connect/
3) Docs: 13_UNIVERSAL_BRIDGE_V2.md, 14-18 series
4) DB migration SQL in docs/13_UNIVERSAL_BRIDGE_V2.md
5) Simulator + CI test

Constraints:
- No env key renames; add BRIDGE_* prefixes
- Type-safe TS, Zod validation
- Clear TODOs for future engineers

Output:
- Commit stubs passing typecheck
```

---

바로 시작할까요? 어느 부분부터 구현하시겠어요? 🚀

**제안하는 첫 단계:**
1. 🎨 Connect Wizard UI 프로토타입 + Preflight
2. 🧩 Arduino HTTP 템플릿 + PSK 인증
3. 🔗 QR 코드 Setup Token 시스템

