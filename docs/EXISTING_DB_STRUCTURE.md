# 🗄️ 기존 Supabase 데이터베이스 구조 분석

## 📋 테이블 목록

| 테이블명 | 레코드 수 | 용도 |
|---------|----------|------|
| `alerts` | 0 | 알림/경고 |
| `audits` | 0 | 감사 로그 |
| `beds` | 6 | 농장 베드 |
| `commands` | 0 | 제어 명령 |
| `devices` | 7 | 디바이스 (센서 게이트웨이, Tuya 디바이스) |
| `farms` | 1 | 농장 정보 |
| `memberships` | 1 | 멤버십 |
| `rules` | 0 | 규칙 |
| `sensor_readings` | 2,890 | 센서 데이터 |
| `sensors` | 10 | 센서 정보 |
| `tenants` | 1 | 테넌트 |
| `users` | 1 | 사용자 |

## 🏗️ 주요 테이블 구조

### 1. `devices` 테이블
```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL,
    bed_id UUID,
    type TEXT NOT NULL,                    -- 'sensor_gateway', 'light', 'fan', 'pump', 'motor'
    vendor TEXT,                           -- 'custom', 'tuya'
    tuya_device_id TEXT,                  -- Tuya 디바이스 ID
    status JSONB,                          -- {"online": true, "on": false}
    meta JSONB,                           -- {"pi_id": "pi-001", "location": "조1-베드1"}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**현재 데이터 예시:**
- 센서 게이트웨이: `pi-001`, `pi-002`, `pi-003`
- Tuya 디바이스: 조명, 팬, 펌프, 모터

### 2. `sensors` 테이블
```sql
CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL,
    type TEXT NOT NULL,                    -- 'temp', 'humidity', 'ec', 'ph', 'lux', 'water_temp'
    unit TEXT,                            -- '°C', '%', 'mS/cm', 'pH', 'lux'
    meta JSONB,                           -- {"pin": 2, "sensor_model": "DHT22"}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**센서 타입:**
- 온도 센서 (DHT22)
- 습도 센서 (DHT22)
- EC 센서 (EC-5)
- pH 센서 (pH-4502C)
- 조도 센서 (BH1750)
- 수온 센서 (DS18B20)

### 3. `farms` 테이블
```sql
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,                   -- '메인 팜'
    location TEXT,                        -- '서울시 강남구'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. `users` 테이블
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,                           -- 'test@example.com'
    name TEXT,                           -- '테스트 사용자'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. `alerts` 테이블
```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL,
    bed_id UUID,
    severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT,
    detail TEXT,
    ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ack_by UUID
);
```

### 6. `audits` 테이블
```sql
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    entity TEXT,
    entity_id UUID,
    action TEXT,
    diff JSONB,
    ts TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. `commands` 테이블
```sql
CREATE TABLE commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID,
    issued_by UUID,
    ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    command TEXT,
    payload JSONB,
    status TEXT,
    correlation_id TEXT
);
```

### 8. `rules` 테이블
```sql
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID,
    name TEXT,
    trigger JSONB,
    condition JSONB,
    action JSONB,
    enabled BOOLEAN,
    version INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔗 관계 구조

```
tenants (1) 
    └── farms (1) 
            └── devices (7)
                    └── sensors (10)
                            └── sensor_readings (2,890)
```

## 📊 데이터 현황

### 디바이스 분포
- **센서 게이트웨이**: 3개 (pi-001, pi-002, pi-003)
- **Tuya 디바이스**: 4개 (조명, 팬, 펌프, 모터)
- **총 디바이스**: 7개

### 센서 분포
- **온도/습도**: 6개 (각 게이트웨이당 2개)
- **EC/pH**: 1개 (pi-001)
- **조도**: 1개 (pi-002)
- **수온**: 1개 (pi-003)
- **총 센서**: 10개

### 센서 데이터
- **총 레코드**: 2,890개
- **평균**: 센서당 약 289개 데이터 포인트

## 🎯 모바일 앱 연동 방안

### 1. 디바이스 제어
- `devices` 테이블의 Tuya 디바이스들을 모바일에서 제어
- `status` JSONB 필드로 실시간 상태 관리

### 2. 센서 데이터 조회
- `sensor_readings` 테이블에서 최신 센서 데이터 조회
- 실시간 모니터링 기능

### 3. 농장 관리
- `farms` 테이블로 농장 정보 표시
- `beds` 테이블로 베드별 관리

## ⚠️ 주의사항

1. **문서 스키마와 다름**: `docs/02_DB_SCHEMA.sql`과 실제 DB 구조가 다름
2. **Tuya 디바이스**: `tuya_device_id` 필드가 있지만 실제 값은 null
3. **센서 데이터**: 대량의 데이터가 이미 존재 (2,890개)
4. **RLS 정책**: 보안 정책 확인 필요

## 🔧 권장 작업

1. **기존 데이터 백업**
2. **모바일 앱용 뷰 생성**
3. **RLS 정책 설정**
4. **API 엔드포인트 최적화**
