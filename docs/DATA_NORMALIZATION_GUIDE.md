# 데이터 정규화 가이드

## 🔄 키/단위 정규화 규칙

### 센서 데이터 정규화 테이블

| 원본 키 | 정규화 키 | 단위 | 설명 | 범위 |
|---------|-----------|------|------|------|
| `temperature` | `temp` | °C | 온도 | -40 ~ 80 |
| `temp` | `temp` | °C | 온도 (축약형) | -40 ~ 80 |
| `humidity` | `hum` | % | 습도 | 0 ~ 100 |
| `hum` | `hum` | % | 습도 (축약형) | 0 ~ 100 |
| `soil_moisture` | `sm` | % | 토양수분 | 0 ~ 100 |
| `soil_humidity` | `sm` | % | 토양습도 | 0 ~ 100 |
| `light` | `light` | lux | 조도 | 0 ~ 100000 |
| `illuminance` | `light` | lux | 조도 (정식명) | 0 ~ 100000 |
| `ph` | `ph` | pH | 산성도 | 0 ~ 14 |
| `co2` | `co2` | ppm | 이산화탄소 | 0 ~ 10000 |
| `pressure` | `press` | hPa | 대기압 | 800 ~ 1200 |
| `wind_speed` | `wind` | m/s | 풍속 | 0 ~ 50 |
| `rainfall` | `rain` | mm | 강수량 | 0 ~ 1000 |

### 액추에이터 데이터 정규화 테이블

| 원본 키 | 정규화 키 | 타입 | 설명 | 상태값 |
|---------|-----------|------|------|--------|
| `relay` | `relay` | boolean | 릴레이 | on/off |
| `pump` | `pump` | boolean | 펌프 | on/off |
| `fan` | `fan` | boolean | 팬 | on/off |
| `heater` | `heater` | boolean | 히터 | on/off |
| `led` | `led` | boolean | LED | on/off |
| `valve` | `valve` | boolean | 밸브 | open/closed |
| `motor` | `motor` | boolean | 모터 | on/off |

## 🔧 정규화 함수

### JavaScript 정규화 함수
```typescript
function normalizeKey(key: string): string {
  const normalizationMap: Record<string, string> = {
    // 온도
    'temperature': 'temp',
    'temp': 'temp',
    
    // 습도
    'humidity': 'hum',
    'hum': 'hum',
    
    // 토양수분
    'soil_moisture': 'sm',
    'soil_humidity': 'sm',
    
    // 조도
    'light': 'light',
    'illuminance': 'light',
    
    // 기타
    'ph': 'ph',
    'co2': 'co2',
    'pressure': 'press',
    'wind_speed': 'wind',
    'rainfall': 'rain'
  };
  
  return normalizationMap[key.toLowerCase()] || key.toLowerCase();
}
```

### Arduino 정규화 함수
```cpp
String normalizeKey(String key) {
  key.toLowerCase();
  
  if (key == "temperature") return "temp";
  if (key == "humidity") return "hum";
  if (key == "soil_moisture") return "sm";
  if (key == "soil_humidity") return "sm";
  if (key == "illuminance") return "light";
  if (key == "wind_speed") return "wind";
  
  return key;
}
```

## 📊 단위 변환

### 온도 변환
```typescript
function convertTemperature(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;
  
  // 섭씨를 화씨로
  if (fromUnit === '°C' && toUnit === '°F') {
    return (value * 9/5) + 32;
  }
  
  // 화씨를 섭씨로
  if (fromUnit === '°F' && toUnit === '°C') {
    return (value - 32) * 5/9;
  }
  
  return value;
}
```

### 압력 변환
```typescript
function convertPressure(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;
  
  // hPa를 kPa로
  if (fromUnit === 'hPa' && toUnit === 'kPa') {
    return value / 10;
  }
  
  // kPa를 hPa로
  if (fromUnit === 'kPa' && toUnit === 'hPa') {
    return value * 10;
  }
  
  return value;
}
```

## 🎯 정규화 적용 예시

### 원본 데이터
```json
{
  "temperature": 25.5,
  "humidity": 60.2,
  "soil_moisture": 45.8,
  "illuminance": 25000
}
```

### 정규화 후 데이터
```json
{
  "temp": 25.5,
  "hum": 60.2,
  "sm": 45.8,
  "light": 25000
}
```

### 데이터베이스 저장
```sql
INSERT INTO iot_readings (device_uuid, readings, created_at)
VALUES (
  'device-uuid-here',
  '{
    "temp": 25.5,
    "hum": 60.2,
    "sm": 45.8,
    "light": 25000
  }'::jsonb,
  NOW()
);
```

## 🔍 데이터 검증

### 범위 검증
```typescript
function validateSensorValue(key: string, value: number): boolean {
  const ranges: Record<string, {min: number, max: number}> = {
    'temp': { min: -40, max: 80 },
    'hum': { min: 0, max: 100 },
    'sm': { min: 0, max: 100 },
    'light': { min: 0, max: 100000 },
    'ph': { min: 0, max: 14 },
    'co2': { min: 0, max: 10000 }
  };
  
  const range = ranges[key];
  if (!range) return true; // 알 수 없는 키는 통과
  
  return value >= range.min && value <= range.max;
}
```

### 이상값 처리
```typescript
function detectOutlier(values: number[]): number[] {
  if (values.length < 3) return values;
  
  // 이동평균으로 이상값 제거
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const threshold = avg * 0.3; // 30% 이상 차이나면 이상값
  
  return values.filter(val => Math.abs(val - avg) <= threshold);
}
```

## ⚠️ 주의사항

- **정규화는 일관성**을 위해 필수
- **새로운 센서 추가** 시 정규화 테이블 업데이트
- **단위 변환** 시 정밀도 손실 고려
- **이상값 처리** 시 비즈니스 로직과 일치 확인
