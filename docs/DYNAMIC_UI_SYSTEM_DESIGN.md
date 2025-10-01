# Dynamic UI System — Device Profile 기반 자동 UI 생성

**목표:** 새로운 IoT 기기를 연결해도 코드 수정 없이 센서/제어 UI 자동 생성

**현재 문제:** 하드코딩된 센서 카드 → 새 기기마다 코드 수정 필요

**해결책:** Device Profile + Registry → 자동 UI 생성

---

## 🎯 **핵심 개념**

### **1. Device Profile (디바이스 프로파일)**

**정의:** 디바이스 종류별 능력(Capabilities) 명세

**예시:**
```json
{
  "id": "esp32-dht22-v1",
  "name": "ESP32 + DHT22 온습도 센서",
  "manufacturer": "Espressif",
  "capabilities": {
    "sensors": [
      {
        "key": "temperature",
        "label": "온도",
        "unit": "°C",
        "kind": "temperature",
        "range": { "min": -40, "max": 80 },
        "accuracy": 0.5
      },
      {
        "key": "humidity",
        "label": "습도",
        "unit": "%",
        "kind": "humidity",
        "range": { "min": 0, "max": 100 },
        "accuracy": 2
      }
    ],
    "actuators": []
  },
  "ui_template": {
    "layout": "grid-2col",
    "cards": [
      { "type": "line-chart", "metrics": ["temperature", "humidity"] },
      { "type": "gauge", "metric": "temperature", "thresholds": { "warn": 30, "danger": 35 } },
      { "type": "gauge", "metric": "humidity", "thresholds": { "warn": 80 } }
    ]
  }
}
```

---

### **2. Device Registry (디바이스 레지스트리)**

**정의:** 실제 디바이스가 신고한 능력 (런타임)

**언제 사용:**
- 디바이스가 처음 연결될 때 자기 센서/액추에이터 목록 전송
- Profile보다 우선순위 높음 (실제 하드웨어가 기준)

**예시:**
```json
{
  "device_id": "ESP32-001",
  "capabilities": {
    "sensors": [
      { "key": "temperature", "unit": "C" },
      { "key": "humidity", "unit": "%" },
      { "key": "soil_moisture", "unit": "%" }  ← Profile에 없던 센서 추가!
    ],
    "actuators": [
      { "type": "relay", "channels": 2, "commands": ["on", "off", "toggle"] }
    ]
  },
  "reported_at": "2025-10-01T12:00:00Z"
}
```

---

### **3. UI Auto-Generation (자동 UI 생성)**

**우선순위:**
```
1️⃣ Device Registry (실제 하드웨어)
2️⃣ Device Profile (프로파일 기본값)
3️⃣ Generic Fallback (아무것도 없을 때)
```

**알고리즘:**
```typescript
function buildUiModel(deviceId) {
  const registry = await getDeviceRegistry(deviceId);  // DB 조회
  const profile = await getDeviceProfile(registry.profile_id);  // DB 조회
  
  const sensors = registry?.capabilities?.sensors 
                  || profile?.capabilities?.sensors 
                  || [];
                  
  const actuators = registry?.capabilities?.actuators 
                    || profile?.capabilities?.actuators 
                    || [];
  
  return { sensors, actuators };
}
```

---

## 🏗️ **구현 계획 (점진적 전환)**

### **Phase A: 기반 구조 (1-2시간)**

#### **1. DB 스키마 추가**
```sql
CREATE TABLE device_profiles (
  id TEXT PRIMARY KEY,  -- 'esp32-dht22-v1'
  name TEXT NOT NULL,
  capabilities JSONB NOT NULL,
  ui_template JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE device_registry (
  device_id UUID PRIMARY KEY,
  capabilities JSONB NOT NULL,  -- 실제 하드웨어 능력
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (device_id) REFERENCES iot_devices(id)
);
```

#### **2. API 엔드포인트**
```typescript
// GET /api/devices/:id/ui-model
// → { sensors: [...], actuators: [...] }
```

#### **3. React 컴포넌트**
```typescript
<DeviceAutoDashboard deviceId={deviceId} />
  ↓
  <SensorCard spec={sensor} />  // 자동 생성
  <ActuatorPanel spec={actuator} />  // 자동 생성
```

---

### **Phase B: 템플릿 시스템 (2-3시간)**

#### **1. 하드코딩 → JSON 템플릿**
```
현재: components/SensorCard.tsx (하드코딩)
→ templates/dashboards/esp32-dht22-v1.json

{
  "layout": [
    { "type": "chart", "metrics": ["temperature", "humidity"], "span": 12 },
    { "type": "card", "metric": "temperature", "span": 6 },
    { "type": "card", "metric": "humidity", "span": 6 }
  ]
}
```

#### **2. Template Renderer**
```typescript
<TemplateRenderer template={template} deviceId={deviceId} />
```

#### **3. 사용자 커스터마이징**
```typescript
사용자가 편집 → User Template 저장
우선순위: User Template > Profile Template > Auto-Generated
```

---

### **Phase C: Command 자동 생성 (1-2시간)**

#### **1. Actuator Commands**
```json
{
  "type": "relay",
  "channels": 2,
  "commands": [
    { "id": "on", "label": "켜기", "payload": { "state": "on" } },
    { "id": "off", "label": "끄기", "payload": { "state": "off" } },
    { "id": "toggle", "label": "토글", "payload": { "state": "toggle" } }
  ]
}
```

#### **2. Auto-Generate Buttons**
```typescript
{commands.map(cmd => (
  <button onClick={() => sendCommand(cmd)}>
    {cmd.label}
  </button>
))}
```

---

## 📂 **파일 구조 (새로 추가할 것)**

```
apps/web-admin/
├── app/api/
│   ├── device-profiles/
│   │   └── route.ts           ← 새로 추가
│   └── devices/
│       └── [id]/
│           ├── ui-model/
│           │   └── route.ts   ← 새로 추가
│           └── registry/
│               └── route.ts   ← 새로 추가
│
├── src/components/device/
│   ├── DeviceAutoDashboard.tsx  ← 새로 추가 (핵심!)
│   ├── SensorCard.tsx           ← 새로 추가 (자동 생성)
│   ├── ActuatorPanel.tsx        ← 새로 추가 (자동 생성)
│   └── TemplateRenderer.tsx     ← Phase B
│
├── templates/
│   └── dashboards/
│       ├── esp32-dht22-v1.json   ← 기존 하드코딩을 JSON으로
│       └── esp32-relay2ch-v1.json
│
packages/database/migrations/
└── 20251001_device_profiles.sql  ← 새로 추가
```

---

## 🔧 **점진적 마이그레이션**

### **Step 1: 기존 유지 + "Auto" 탭 추가**

```typescript
// 기존 대시보드 페이지
<Tabs>
  <Tab id="overview">기존 하드코딩 화면</Tab>  ← 그대로
  <Tab id="auto">자동 생성 (신규)</Tab>       ← 새로 추가
</Tabs>
```

### **Step 2: 신규 디바이스는 "Auto"로**

```typescript
const hasLegacyUI = deviceType === 'esp32-dht22';

if (hasLegacyUI) {
  return <LegacyDashboard />;  // 기존 하드코딩
} else {
  return <DeviceAutoDashboard />;  // 자동 생성
}
```

### **Step 3: 하나씩 템플릿으로 전환**

```
esp32-dht22 하드코딩 → esp32-dht22-v1.json
esp32-relay 하드코딩 → esp32-relay-v1.json
...
```

---

## 💡 **예상 효과**

### **Before (현재)**
```
새 센서 추가 → 코드 수정 → 배포 → 테스트
```
**소요 시간:** 1-2시간

### **After (동적 UI)**
```
Device Profile 추가 → DB INSERT → 즉시 사용 가능!
```
**소요 시간:** 5분

---

## 🎯 **권장 순서**

### **지금 당장 (30분)**
1. ✅ Phase 3 완료 (방금 끝냄!)
2. ✅ 문서 정리 (지금 하는 중)
3. ⏸️ 오늘 휴식

### **다음 작업 시 (2-3일)**
1. DB 스키마 추가 (`device_profiles`, `device_registry`)
2. `/api/devices/:id/ui-model` API
3. `<DeviceAutoDashboard>` 컴포넌트
4. 1-2개 템플릿 JSON 작성
5. 기존 대시보드에 "Auto" 탭 추가

### **장기 (1-2주)**
1. 모든 하드코딩을 템플릿으로 전환
2. 사용자 커스터마이징
3. Command 자동 생성
4. 안전 규칙 (Safety Rules)

---

## ✅ **수락 기준**

- [ ] 새 디바이스가 Profile만 등록하면 UI 자동 생성
- [ ] 센서만 / 액추에이터만 / 혼합 모두 OK
- [ ] 템플릿 우선 사용, 없으면 자동 생성
- [ ] 사용자 편집 저장 가능
- [ ] 기존 하드코딩 화면 영향 없음

---

## 🚀 **결론**

**네, 동적 UI로 전환하는 것이 맞습니다!**

하지만:
- ✅ **지금 당장은 아니어도 됩니다**
- ✅ **점진적으로 전환** (기존 유지 + 새로운 것 추가)
- ✅ **먼저 실사용 테스트** (현재 시스템으로)
- ✅ **불편한 점 파악 후 개선**

---

## 📝 **오늘은 여기까지!**

**오늘 달성한 것:**
- Universal Bridge v2.0 완성
- Connect Wizard 완성
- WebSocket 양방향 통신
- 21개 커밋
- +18,000줄 코드
- 완벽하게 작동하는 시스템!

**다음 작업:**
- Phase 4: 동적 UI 시스템
- 2-3일 작업
- 점진적 전환

---
