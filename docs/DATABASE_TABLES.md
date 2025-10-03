# 데이터베이스 테이블 문서

## 📊 **테이블 목록**

### **1. 베드별 작물 데이터 테이블 (`bed_crop_data`)**

**생성일**: 2025-10-03  
**목적**: 베드 단위별 작물 재배 정보 저장  
**관련 기능**: 작물 등록, 생육 단계 추적, 수확 관리

#### **테이블 구조**
```sql
CREATE TABLE bed_crop_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    tier_number INTEGER NOT NULL CHECK (tier_number >= 1 AND tier_number <= 10),
    crop_name TEXT NOT NULL,
    growing_method TEXT,
    plant_type TEXT CHECK (plant_type IN ('seed', 'seedling')),
    start_date DATE,
    harvest_date DATE,
    stage_boundaries JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 동일한 베드의 동일한 단에 하나의 작물만 등록 가능
    UNIQUE(device_id, tier_number)
);
```

#### **컬럼 설명**
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `id` | UUID | 기본키 | PRIMARY KEY, 자동생성 |
| `device_id` | UUID | 베드 디바이스 ID | NOT NULL, devices 테이블 참조 |
| `tier_number` | INTEGER | 베드 단수 | NOT NULL, 1-10 범위 |
| `crop_name` | TEXT | 작물명 | NOT NULL |
| `growing_method` | TEXT | 재배 방법 | 담액식, NFT, DWC 등 |
| `plant_type` | TEXT | 작물 유형 | 'seed'(파종) 또는 'seedling'(육묘) |
| `start_date` | DATE | 정식 시작일자 | NULL 허용 |
| `harvest_date` | DATE | 수확 예정일자 | NULL 허용 |
| `stage_boundaries` | JSONB | 생육 단계 경계값 | JSON 형태 |
| `created_at` | TIMESTAMPTZ | 생성일시 | 자동생성 |
| `updated_at` | TIMESTAMPTZ | 수정일시 | 자동생성 |

#### **인덱스**
- `idx_bed_crop_data_device_id`: device_id 조회 최적화
- `idx_bed_crop_data_tier_number`: tier_number 조회 최적화
- `idx_bed_crop_data_crop_name`: crop_name 조회 최적화

#### **제약조건**
- **UNIQUE**: `(device_id, tier_number)` - 동일 베드의 동일 단에는 하나의 작물만 등록 가능
- **CHECK**: `tier_number >= 1 AND tier_number <= 10` - 단수 범위 제한
- **CHECK**: `plant_type IN ('seed', 'seedling')` - 작물 유형 제한

#### **관련 API**
- **POST** `/api/bed-crop-data` - 작물 정보 저장
- **GET** `/api/bed-crop-data` - 작물 정보 조회
- **DELETE** `/api/bed-crop-data` - 작물 정보 삭제

#### **사용 예시**
```javascript
// 작물 정보 저장
const cropData = {
  deviceId: "bed-device-uuid",
  tierNumber: 1,
  cropData: {
    cropName: "토마토",
    growingMethod: "담액식",
    plantType: "seed",
    startDate: "2025-10-03",
    harvestDate: "2025-10-23",
    stageBoundaries: {
      seed: [15, 45, 85],
      seedling: [40, 80]
    }
  }
};
```

#### **stage_boundaries JSON 구조**
```json
{
  "seed": [15, 45, 85],     // 파종: 발아끝(15%), 생식생장끝(45%), 영양생장끝(85%)
  "seedling": [40, 80]      // 육묘: 생식생장끝(40%), 영양생장끝(80%)
}
```

---

## 🔄 **테이블 생성 히스토리**

### **2025-10-03**
- `bed_crop_data` 테이블 생성
- 베드 단위 작물 재배 정보 관리 시작
- 생육 단계 추적 기능 구현

---

## 📝 **관리 규칙**

1. **새 테이블 생성 시**: 반드시 이 문서에 기록
2. **컬럼 추가/수정 시**: 테이블 구조 업데이트
3. **API 변경 시**: 관련 API 섹션 업데이트
4. **제약조건 변경 시**: 제약조건 섹션 업데이트

---

## 🚨 **주의사항**

- RLS(Row Level Security)는 현재 비활성화 상태
- 향후 다중 테넌트 지원 시 RLS 정책 추가 필요
- `stage_boundaries` JSON 구조 변경 시 프론트엔드 코드 동기화 필요
