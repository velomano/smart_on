# Device Profiles

이 디렉토리는 IoT 디바이스 프로파일 JSON 파일을 저장합니다.

## 📦 **프로파일 목록**

### **1. ESP32 + DHT22 온습도 센서** (`esp32-dht22-v1.json`)
- **Sensors:** 온도, 습도
- **UI:** Line Chart + Gauge (2개)
- **Safety Rules:** 없음

### **2. ESP32 + 2채널 릴레이** (`esp32-relay2ch-v1.json`)
- **Actuators:** 2채널 릴레이 (ON/OFF/Toggle)
- **UI:** Actuator Panel + Event Log
- **Safety Rules:** 
  - Cooldown: 5초
  - Interlock: 채널 1, 2 동시 작동 방지
  - Max Duration: 300초

---

## 🔧 **프로파일 구조**

```json
{
  "id": "unique-profile-id",
  "version": "1.0.0",
  "scope": "public",
  "tenant_id": null,
  "name": "디바이스 이름",
  "manufacturer": "제조사",
  "capabilities": {
    "sensors": [
      {
        "key": "temperature",
        "canonical_key": "temp",
        "label": "온도",
        "labels": { "en": "Temperature", "ko": "온도" },
        "unit": "°C",
        "display_unit": "°C",
        "kind": "temperature",
        "range": { "min": -40, "max": 80 },
        "accuracy": 0.5
      }
    ],
    "actuators": []
  },
  "ui_template": {
    "version": "1",
    "layout": "grid-2col",
    "cards": [
      { "type": "line-chart", "series": ["temp"], "span": 12 }
    ]
  },
  "safety_rules": null
}
```

---

## 📊 **UI 카드 타입**

| 타입 | 설명 | 필수 속성 |
|------|------|-----------|
| `line-chart` | 시계열 차트 | `series: string[]` |
| `gauge` | 게이지 (현재값) | `metric: string`, `thresholds?` |
| `actuator` | 액추에이터 제어 | `actuatorType: string`, `channels?` |
| `event-log` | 이벤트 로그 | `metric: string` |

---

## 🚀 **사용 방법**

### **1. DB에 프로파일 등록**
```bash
# Supabase SQL Editor에서 실행
packages/database/migrations/20251001_device_profiles_seed.sql
```

### **2. 디바이스에 프로파일 할당**
```sql
UPDATE iot_devices 
SET profile_id = 'esp32-dht22-v1' 
WHERE device_id = 'ESP32-001';
```

### **3. UI 모델 조회**
```bash
GET /api/devices/:deviceId/ui-model
```

**응답:**
```json
{
  "device_id": "ESP32-001",
  "profile_id": "esp32-dht22-v1",
  "profile": {
    "id": "esp32-dht22-v1",
    "name": "ESP32 + DHT22 온습도 센서",
    "version": "1.0.0"
  },
  "model": {
    "sensors": [...],
    "actuators": [...]
  },
  "template": {
    "version": "1",
    "layout": "grid-2col",
    "cards": [...]
  },
  "safety_rules": null
}
```

---

## 🔄 **프로파일 vs 레지스트리**

| 항목 | Profile | Registry |
|------|---------|----------|
| **정의** | 표준 템플릿 | 장치 실제 능력 |
| **우선순위** | 기본값 | 우선 적용 |
| **업데이트** | 수동 (DB) | 자동 (장치 신고) |
| **예시** | DHT22 표준 스펙 | 센서 추가 (토양 습도) |

**병합 규칙:**
1. Registry에 센서가 있으면 추가 (중복 제거)
2. UI Template은 Profile 기본 + Registry 확장
3. Safety Rules는 Profile 우선

---

## 📝 **새 프로파일 추가**

1. JSON 파일 생성: `profiles/my-device-v1.json`
2. SQL Seed 업데이트: `20251001_device_profiles_seed.sql`
3. DB 실행: Supabase SQL Editor
4. 테스트: `/api/devices/:id/ui-model`

---

## 🎯 **빠른 수락 기준**

- ✅ Profile만으로 UI 자동 생성
- ✅ Registry 추가 시 자동 병합
- ✅ Safety Rules 적용 (Interlock, Cooldown)
- ✅ i18n 지원 (en/ko)
- ✅ 버전 관리 (v1.0.0)

---

**마지막 업데이트:** 2025-10-01

