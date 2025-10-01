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

### 📌 **우선순위 3: 네이티브 앱 API** (별도)

**장점:**
- ✅ 스마트폰으로 제어
- ✅ 푸시 알림
- ✅ 사용자 친화적

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

바로 시작할까요? 아니면 더 구체적인 설계를 원하시나요? 🚀

