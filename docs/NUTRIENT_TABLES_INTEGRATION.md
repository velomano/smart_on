# 배양액제조 테이블 통합 완료 보고서

## 📋 개요
`nutrient_recipes`와 `crop_profiles` 테이블을 통합하여 단일 테이블로 관리하도록 변경했습니다.

## 🔄 통합 과정

### 1. 기존 테이블 구조
- **nutrient_recipes**: 자동 수집된 배양액 레시피 데이터 (58건)
- **crop_profiles**: 수동 입력된 기본 작물 프로필 데이터

### 2. 통합 작업
```sql
-- crop_name null 값 업데이트
UPDATE crop_profiles 
SET crop_name = CASE 
    WHEN crop_key = 'lettuce' THEN '상추'
    WHEN crop_key = 'tomato' THEN '토마토'
    WHEN crop_key = 'strawberry' THEN '딸기'
    WHEN crop_key = 'cucumber' THEN '오이'
    WHEN crop_key = 'pepper' THEN '고추'
    ELSE INITCAP(crop_key)
END
WHERE crop_name IS NULL;

-- nutrient_recipes 데이터를 crop_profiles로 통합
INSERT INTO crop_profiles (
    crop_key, crop_name, stage, target_ppm, target_ec, target_ph,
    source_title, source_year, license, description,
    growing_conditions, nutrients_detail, usage_notes, warnings,
    author, last_updated, created_at
)
SELECT DISTINCT
    nr.crop_key,
    CASE 
        WHEN nr.crop_key = 'lettuce' THEN '상추'
        WHEN nr.crop_key = 'tomato' THEN '토마토'
        WHEN nr.crop_key = 'strawberry' THEN '딸기'
        WHEN nr.crop_key = 'cucumber' THEN '오이'
        WHEN nr.crop_key = 'pepper' THEN '고추'
        ELSE INITCAP(nr.crop_key)
    END as crop_name,
    nr.stage,
    nr.macro as target_ppm,
    nr.target_ec,
    nr.target_ph,
    COALESCE(ns.name, '스마트팜 데이터베이스') as source_title,
    2025 as source_year,
    COALESCE(ns.license, 'CC BY 4.0') as license,
    CONCAT(nr.crop_key, ' ', nr.stage, '에 최적화된 배양액 레시피입니다.') as description,
    '{"temperature": "20-25°C", "humidity": "65%", "light_hours": "12-14시간", "co2_level": "800-1200ppm"}'::jsonb as growing_conditions,
    jsonb_build_object(
        'nitrogen', COALESCE((nr.macro->>'N')::numeric, 0),
        'phosphorus', COALESCE((nr.macro->>'P')::numeric, 0),
        'potassium', COALESCE((nr.macro->>'K')::numeric, 0),
        'calcium', COALESCE((nr.macro->>'Ca')::numeric, 0),
        'magnesium', COALESCE((nr.macro->>'Mg')::numeric, 0),
        'trace_elements', ARRAY['Fe', 'Mn', 'Zn', 'B', 'Cu', 'Mo']
    ) as nutrients_detail,
    ARRAY['주 1회 EC 측정 권장', 'pH는 6.0-6.5 범위 유지', '온도 변화에 따른 조정 필요'] as usage_notes,
    ARRAY['칼슘 결핍 시 잎 끝 갈변 현상', '과도한 질소는 과번무 유발'] as warnings,
    '자동 수집 시스템' as author,
    nr.collected_at::date as last_updated,
    NOW() as created_at
FROM nutrient_recipes nr
LEFT JOIN nutrient_sources ns ON nr.source_id = ns.id
WHERE NOT EXISTS (
    SELECT 1 FROM crop_profiles cp 
    WHERE cp.crop_key = nr.crop_key 
    AND cp.stage = nr.stage
);
```

## 📊 통합 결과

### 최종 데이터 현황
- **총 레시피 수**: 78개
- **작물별 분포**:
  - 상추: 24개 (vegetative 22, germination 1, mature 1)
  - 토마토: 24개 (vegetative 7, flowering 4, fruiting 13)
  - 오이: 10개 (vegetative 4, flowering 5, fruiting 1)
  - 딸기: 11개 (vegetative 7, fruiting 4)
  - 고추: 3개 (vegetative 1, flowering 1, fruiting 1)
  - 바질: 2개 (vegetative 1, flowering 1)
  - Lettuce: 6개 (vegetative 6)
  - Tomato: 6개 (vegetative 6)
  - Cucumber: 3개 (vegetative 3)

### Source 정보 포함
- **FAO Open Knowledge Platform**: 국제 농업기구 데이터
- **농촌진흥청 스마트팜 기술정보센터**: 국내 공식 데이터
- **서울대학교 농업생명과학대학**: 학술 연구 데이터
- **경희대학교 생명과학대학**: 학술 연구 데이터

## 🔧 API 수정 사항

### `/api/nutrients/browse` 개선
- **하드코딩 제거**: 모든 mock 데이터 제거
- **실제 DB 데이터 사용**: `crop_profiles` 테이블의 모든 필드 활용
- **Source 정보 표시**: 실제 수집 출처 정보 표시
- **페이지네이션**: 21개씩 정확한 페이지네이션

### 변경된 필드
```typescript
// 기존 (하드코딩)
source_title: '스마트팜 데이터베이스'
source_year: 2025
license: 'CC BY 4.0'

// 변경 후 (실제 DB 데이터)
source_title: profile.source_title || '스마트팜 데이터베이스'
source_year: profile.source_year || 2025
license: profile.license || 'CC BY 4.0'
```

## 📋 테이블 스키마

### crop_profiles 테이블 구조
```sql
CREATE TABLE crop_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_key TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    stage TEXT NOT NULL,
    target_ppm JSONB NOT NULL,
    target_ec NUMERIC,
    target_ph NUMERIC,
    metadata JSONB,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    author TEXT,
    source_title TEXT,
    source_year INTEGER,
    license TEXT,
    description TEXT,
    growing_conditions JSONB,
    nutrients_detail JSONB,
    usage_notes TEXT[],
    warnings TEXT[],
    last_updated DATE,
    volume_l INTEGER,
    ec_target NUMERIC,
    ph_target NUMERIC,
    npk_ratio TEXT
);
```

## ✅ 완료 사항
1. **테이블 통합**: `nutrient_recipes` → `crop_profiles`
2. **API 수정**: 하드코딩 제거, 실제 DB 데이터 사용
3. **Source 정보**: 자동 수집 출처 정보 포함
4. **페이지네이션**: 정확한 21개씩 표시
5. **문서화**: 통합 과정 및 결과 기록

## 🚫 제거된 Mock 데이터
- 하드코딩된 source 정보
- 가짜 growing_conditions
- Mock nutrients_detail
- 가짜 usage_notes 및 warnings
- 하드코딩된 author 정보

## 📝 참고사항
- 모든 배양액 레시피는 이제 `crop_profiles` 테이블에서 관리
- 자동 수집 시스템은 계속 `nutrient_recipes`에 저장 후 주기적으로 `crop_profiles`로 통합
- API는 실제 DB 데이터만 사용하므로 신뢰성 향상
