# 농장 관리 기능 가이드

## 📋 개요

스마트팜 시스템의 농장 관리 기능은 농장, 베드, 디바이스, 센서를 통합적으로 관리할 수 있는 종합적인 관리 시스템입니다.

## 🏗️ 데이터 구조

### 1. 농장 (Farms)
```sql
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,                              -- 농장명
    location TEXT,                                   -- 농장 위치
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. 베드 (Beds) - 디바이스로 관리
```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    bed_id UUID REFERENCES beds(id),                 -- 베드 연결 (선택적)
    type TEXT NOT NULL CHECK (type IN (
        'switch', 'pump', 'fan', 'light', 'motor', 'sensor_gateway'
    )),
    vendor TEXT,                                     -- 'custom', 'tuya'
    tuya_device_id TEXT,                            -- Tuya 디바이스 ID
    status JSONB,                                    -- {"online": true, "on": false}
    meta JSONB,                                      -- 베드 정보 포함
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. 센서 (Sensors)
```sql
CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id),
    type TEXT NOT NULL,                              -- 'temp', 'humidity', 'ec', 'ph', 'lux', 'water_temp'
    unit TEXT,                                       -- '°C', '%', 'mS/cm', 'pH', 'lux'
    meta JSONB,                                      -- {"pin": 2, "sensor_model": "DHT22"}
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. 센서 데이터 (Sensor Readings)
```sql
CREATE TABLE sensor_readings (
    id BIGINT PRIMARY KEY DEFAULT nextval('sensor_readings_id_seq'),
    sensor_id UUID NOT NULL REFERENCES sensors(id),
    ts TIMESTAMPTZ NOT NULL,                         -- 측정 시간
    value NUMERIC NOT NULL,                          -- 측정값
    quality INTEGER DEFAULT 1                        -- 데이터 품질
);
```

## 🌱 베드 관리 기능

### 1. 베드 생성
```typescript
const handleAddBed = async () => {
  const { data, error } = await supabase
    .from('devices')
    .insert([{
      farm_id: targetFarm.id,
      type: 'sensor_gateway',
      status: { online: true },
      meta: {
        location: normalizedBedName,                 // 베드 이름
        crop_name: newBedData.cropName,             // 작물명
        growing_method: newBedData.growingMethod,   // 재배 방식
        total_tiers: 1                              // 운영 단 수
      }
    }]);
};
```

### 2. 베드 이름 정규화
```typescript
// 베드 이름 규칙
const normalizeBedName = (name: string) => {
  // "베드2" → "베드-2"
  // "3" → "베드-3"
  // "A구역" → "베드-A구역"
  const patterns = [
    /^베드(\d+)$/,           // 베드1, 베드2
    /^(\d+)$/,               // 1, 2, 3
    /^베드-(\d+)$/,          // 베드-1, 베드-2
    /^조(\d+)-베드(\d+)$/,   // 조1-베드1
    /^농장(\d+)-베드(\d+)$/  // 농장1-베드2
  ];
  
  // 정규화 로직 구현
  return normalizedName;
};
```

### 3. 베드 편집
- 베드 이름 변경
- 작물 정보 수정
- 재배 방식 변경
- 운영 단 수 조정

### 4. 베드 삭제
- 연관된 센서 데이터 삭제
- 디바이스 정보 삭제
- 베드 정보 삭제

## 📊 센서 데이터 관리

### 1. 센서 타입
- **온도 센서**: `temperature` (°C)
- **습도 센서**: `humidity` (%)
- **EC 센서**: `ec` (mS/cm)
- **pH 센서**: `ph` (pH)
- **조도 센서**: `lux` (lux)
- **수온 센서**: `water_temp` (°C)

### 2. 센서 데이터 수집
```typescript
// 센서 데이터 저장
const saveSensorReading = async (sensorId: string, value: number) => {
  const { error } = await supabase
    .from('sensor_readings')
    .insert([{
      sensor_id: sensorId,
      ts: new Date().toISOString(),
      value: value,
      quality: 1
    }]);
};
```

### 3. 센서 데이터 조회
```typescript
// 최신 센서 데이터 조회
const getLatestSensorData = async (deviceId: string) => {
  const { data } = await supabase
    .from('sensors')
    .select(`
      *,
      sensor_readings (
        value,
        ts,
        quality
      )
    `)
    .eq('device_id', deviceId)
    .order('ts', { ascending: false })
    .limit(1);
};
```

## 🔌 디바이스 제어

### 1. 액추에이터 제어
```typescript
// 램프, 펌프, 팬 등 제어
const toggleActuator = (deviceId: string) => {
  const newState = !localActuatorStates[deviceId];
  
  // 로컬 상태 업데이트
  setLocalActuatorStates(prev => ({
    ...prev,
    [deviceId]: newState
  }));
  
  // MQTT 명령 전송 (향후 구현)
  const command = {
    device_id: deviceId,
    action: newState ? 'turn_on' : 'turn_off',
    command_id: `cmd_${Date.now()}`
  };
};
```

### 2. 스케줄링 제어
- 시간 기반 자동 제어
- 반복 스케줄 설정
- 듀얼타임 제어

### 3. 원격 제어
- 실시간 디바이스 제어
- 상태 모니터링
- 명령 실행 확인

## 📝 생육 노트 시스템

### 1. 노트 작성
```typescript
const createBedNote = async (bedId: string, noteData: {
  title: string;
  content: string;
  tags: string[];
  isAnnouncement: boolean;
}) => {
  const { error } = await supabase
    .from('bed_notes')
    .insert([{
      bed_id: bedId,
      author_id: userId,
      ...noteData
    }]);
};
```

### 2. 노트 조회
- 베드별 노트 목록
- 태그별 필터링
- 공지사항 우선 표시

### 3. 노트 통계
- 총 노트 수
- 최근 노트 미리보기
- 태그별 분류

## 🏗️ 다단 구조 관리

### 1. 베드 단 구조
```typescript
interface BedTierConfig {
  totalTiers: number;        // 총 단 수
  activeTiers: number;       // 활성 단 수
  tierStatuses: TierStatus[]; // 각 단별 상태
}

interface TierStatus {
  tierNumber: number;
  isActive: boolean;
  status: 'active' | 'inactive';
  plantCount: number;
  hasPlants: boolean;
}
```

### 2. 단 구조 시각화
- 5단까지 지원
- 활성/비활성 상태 표시
- 식물 재배 현황 표시

## 🔧 MQTT 통합

### 1. MQTT 설정
- 농장별 MQTT 브로커 설정
- 토픽 구조 정의
- 연결 상태 모니터링

### 2. 디바이스 통신
- 센서 데이터 수신
- 제어 명령 전송
- 상태 동기화

### 3. 실시간 업데이트
- WebSocket 연결
- 실시간 데이터 스트리밍
- 자동 재연결

## 📱 사용자 인터페이스

### 1. 농장 관리 페이지
- 농장별 탭 표시
- 베드 목록 및 상태
- 센서 데이터 차트

### 2. 베드 상세 페이지
- 센서 데이터 실시간 표시
- 디바이스 제어 패널
- 생육 노트 관리

### 3. 대시보드
- 전체 농장 현황
- 알림 및 경고
- 빠른 액세스 메뉴

## 🚀 향후 확장 계획

### 1. 고급 분석
- 머신러닝 기반 예측
- 이상 패턴 감지
- 최적화 제안

### 2. 자동화 규칙
- 조건부 자동 제어
- 알림 규칙 설정
- 이벤트 기반 액션

### 3. 모바일 앱
- React Native 기반
- 오프라인 지원
- 푸시 알림

---

**최종 업데이트**: 2025.01.01  
**문서 버전**: 1.0  
**작성자**: 스마트팜 개발팀
