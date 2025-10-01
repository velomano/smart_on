# Gauge 임계값 설정 가이드

## 🎯 임계값 우선순위

### 1. 디바이스 프로파일 우선
**`device_profiles` 테이블의 `ui_template.cards[].thresholds`** 설정을 최우선으로 사용합니다.

```json
{
  "ui_template": {
    "cards": [
      {
        "span": 6,
        "type": "gauge",
        "metric": "temp",
        "thresholds": {
          "warn": 30,
          "danger": 35
        }
      }
    ]
  }
}
```

### 2. 기본값 폴백
프로파일에 임계값이 없으면 **시스템 기본값**을 사용합니다.

| 센서 타입 | 기본 임계값 | 단위 |
|-----------|-------------|------|
| **온도 (temp)** | warn: 30, danger: 35 | °C |
| **습도 (hum)** | warn: 80, danger: 90 | % |
| **토양수분 (soil_moisture)** | warn: 20, danger: 10 | % |
| **조도 (light)** | warn: 80000, danger: 100000 | lux |
| **pH** | warn: 8.5, danger: 9.0 | pH |

## 🎨 UI 색상 규칙

### 임계값별 색상
- **정상**: 파란색 (`text-blue-600`, `bg-blue-50`)
- **경고 (warn)**: 노란색 (`text-yellow-600`, `bg-yellow-50`)
- **위험 (danger)**: 빨간색 (`text-red-600`, `bg-red-50`)

### 색상 적용 로직
```typescript
// GaugeCard 컴포넌트에서
if (sensorValue && thresholds) {
  const value = sensorValue.value;
  if (thresholds.danger && value >= thresholds.danger) {
    // 위험: 빨간색
    bgColor = 'from-red-50 to-red-100';
    borderColor = 'border-red-300';
    valueColor = 'text-red-600';
  } else if (thresholds.warn && value >= thresholds.warn) {
    // 경고: 노란색
    bgColor = 'from-yellow-50 to-yellow-100';
    borderColor = 'border-yellow-300';
    valueColor = 'text-yellow-600';
  } else {
    // 정상: 파란색
    bgColor = 'from-blue-50 to-blue-100';
    borderColor = 'border-blue-200';
    valueColor = 'text-blue-600';
  }
}
```

## 📊 임계값 설정 예시

### ESP32 + DHT22 프로파일
```json
{
  "id": "esp32-dht22-v1",
  "name": "ESP32 + DHT22 온습도 센서",
  "ui_template": {
    "cards": [
      {
        "span": 6,
        "type": "gauge",
        "metric": "temp",
        "thresholds": {
          "warn": 30,
          "danger": 35
        }
      },
      {
        "span": 6,
        "type": "gauge",
        "metric": "hum",
        "thresholds": {
          "warn": 80
        }
      }
    ]
  }
}
```

### ESP32 + 릴레이 프로파일
```json
{
  "id": "esp32-relay2ch-v1",
  "name": "ESP32 + 2채널 릴레이",
  "ui_template": {
    "cards": [
      {
        "span": 12,
        "type": "actuator",
        "channels": 2,
        "actuatorType": "relay"
      }
    ]
  }
}
```

## 🔧 임계값 수정 방법

### 1. 데이터베이스 직접 수정
```sql
UPDATE device_profiles 
SET ui_template = jsonb_set(
  ui_template, 
  '{cards,0,thresholds,warn}', 
  '32'
)
WHERE id = 'esp32-dht22-v1';
```

### 2. 프로파일 재등록
```sql
INSERT INTO device_profiles (id, name, ui_template)
VALUES (
  'esp32-dht22-v1',
  'ESP32 + DHT22 온습도 센서',
  '{
    "cards": [
      {
        "span": 6,
        "type": "gauge",
        "metric": "temp",
        "thresholds": {
          "warn": 32,
          "danger": 37
        }
      }
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  ui_template = EXCLUDED.ui_template,
  updated_at = NOW();
```

## 📈 임계값 모니터링

### 실시간 알림
- **경고 임계값** 도달 시 노란색 표시
- **위험 임계값** 도달 시 빨간색 표시
- **임계값 초과 지속** 시 알림 발송 (향후 구현)

### 로그 기록
```json
{
  "timestamp": "2025-10-01T12:00:00.000Z",
  "device_id": "ESP32_001",
  "metric": "temp",
  "value": 36.5,
  "threshold": "danger",
  "threshold_value": 35,
  "status": "exceeded"
}
```

## ⚠️ 주의사항

- **임계값은 센서별로 다르게** 설정 가능
- **농작물 종류**에 따라 임계값 조정 필요
- **계절별 임계값** 변경 고려 (향후 구현)
- **임계값 변경 시** 기존 데이터와의 일관성 확인
