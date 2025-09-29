-- =============================================
-- 영양액 자동 수집 시스템 마이그레이션
-- 생성일: 2025-01-01
-- 설명: 배양액 레시피 자동 수집을 위한 테이블 및 정책 추가
-- =============================================

-- =============================================
-- 1. 영양액 데이터 소스 테이블 생성
-- =============================================

CREATE TABLE IF NOT EXISTS nutrient_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT,
    org_type TEXT NOT NULL CHECK (org_type IN ('government', 'academic', 'commercial', 'community')),
    license TEXT,
    reliability_default NUMERIC DEFAULT 0.5 CHECK (reliability_default >= 0 AND reliability_default <= 1),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 2. 작물 프로필 테이블 보강
-- =============================================

-- stage enum 확대
ALTER TABLE crop_profiles 
DROP CONSTRAINT IF EXISTS crop_profiles_stage_check;

ALTER TABLE crop_profiles 
ADD CONSTRAINT crop_profiles_stage_check 
CHECK (stage IN ('seedling', 'vegetative', 'flowering', 'fruiting', 'ripening'));

-- metadata 컬럼 추가
ALTER TABLE crop_profiles 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- =============================================
-- 3. 영양액 레시피 테이블 생성 (자동 수집용)
-- =============================================

CREATE TABLE IF NOT EXISTS nutrient_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_key TEXT NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('seedling', 'vegetative', 'flowering', 'fruiting', 'ripening')),
    target_ec NUMERIC,
    target_ph NUMERIC,
    macro JSONB NOT NULL, -- 대량 영양소 {N, P, K, Ca, Mg, S}
    micro JSONB NOT NULL, -- 미량 영양소 {Fe, Mn, B, Zn, Cu, Mo}
    ions JSONB, -- 이온별 농도 {N_NO3, N_NH4, PO4, K, Ca, Mg, SO4}
    source_id UUID REFERENCES nutrient_sources(id),
    reliability NUMERIC DEFAULT 0.5 CHECK (reliability >= 0 AND reliability <= 1),
    collected_at TIMESTAMP DEFAULT NOW(),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    checksum TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 4. 영양액 레시피 별칭 테이블 생성
-- =============================================

CREATE TABLE IF NOT EXISTS nutrient_recipe_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_key TEXT NOT NULL,
    stage TEXT NOT NULL,
    alias TEXT NOT NULL,
    source_id UUID REFERENCES nutrient_sources(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 5. 영양액 수집 작업 테이블 생성
-- =============================================

CREATE TABLE IF NOT EXISTS nutrient_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('crawl', 'api', 'ai')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed')),
    payload JSONB,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 6. 인덱스 생성
-- =============================================

-- 영양액 레시피 인덱스
CREATE INDEX IF NOT EXISTS idx_nutrient_recipes_crop_stage ON nutrient_recipes(crop_key, stage);
CREATE INDEX IF NOT EXISTS idx_nutrient_recipes_checksum ON nutrient_recipes(checksum);
CREATE INDEX IF NOT EXISTS idx_nutrient_recipes_source ON nutrient_recipes(source_id);
CREATE INDEX IF NOT EXISTS idx_nutrient_recipes_collected_at ON nutrient_recipes(collected_at DESC);

-- 영양액 수집 작업 인덱스
CREATE INDEX IF NOT EXISTS idx_nutrient_jobs_status ON nutrient_jobs(status);
CREATE INDEX IF NOT EXISTS idx_nutrient_jobs_type ON nutrient_jobs(type);
CREATE INDEX IF NOT EXISTS idx_nutrient_jobs_created_at ON nutrient_jobs(created_at DESC);

-- 영양액 데이터 소스 인덱스
CREATE INDEX IF NOT EXISTS idx_nutrient_sources_org_type ON nutrient_sources(org_type);

-- =============================================
-- 7. 제약 조건 및 유니크 인덱스
-- =============================================

-- 영양액 레시피 중복 방지 (crop_key + stage + checksum)
CREATE UNIQUE INDEX IF NOT EXISTS ux_nutrient_recipes_crop_stage_checksum 
ON nutrient_recipes(crop_key, stage, checksum);

-- =============================================
-- 8. 뷰 생성
-- =============================================

-- 최신 영양액 레시피 뷰 (신뢰도 × 최신성 기준)
CREATE OR REPLACE VIEW vw_crop_recipes_latest AS
SELECT DISTINCT ON (crop_key, stage)
    nr.*,
    ns.name as source_name,
    ns.org_type as source_type,
    ns.url as source_url
FROM nutrient_recipes nr
LEFT JOIN nutrient_sources ns ON nr.source_id = ns.id
ORDER BY crop_key, stage, (reliability * EXTRACT(EPOCH FROM collected_at)) DESC;

-- =============================================
-- 9. RLS 정책 적용
-- =============================================

-- RLS 활성화
ALTER TABLE nutrient_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_recipe_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_jobs ENABLE ROW LEVEL SECURITY;

-- 영양액 데이터 소스 정책
CREATE POLICY "Authenticated users can view nutrient sources" ON nutrient_sources
    FOR SELECT TO authenticated USING (true);

-- 영양액 레시피 정책
CREATE POLICY "Authenticated users can view nutrient recipes" ON nutrient_recipes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage nutrient recipes" ON nutrient_recipes
    FOR ALL USING (auth.role() = 'service_role');

-- 영양액 레시피 별칭 정책
CREATE POLICY "Authenticated users can view recipe aliases" ON nutrient_recipe_aliases
    FOR SELECT TO authenticated USING (true);

-- 영양액 수집 작업 정책
CREATE POLICY "Users can view their own nutrient jobs" ON nutrient_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.role IN ('super_admin', 'system_admin', 'team_leader')
        )
    );

CREATE POLICY "Service role can insert nutrient jobs" ON nutrient_jobs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- 10. 초기 데이터 삽입
-- =============================================

-- 영양액 데이터 소스 초기 데이터
INSERT INTO nutrient_sources(name, url, org_type, reliability_default) VALUES
    ('Cornell CEA', 'https://hort.cornell.edu/greenhouse/crops/factsheets/hydroponic-recipes.pdf', 'academic', 0.9),
    ('농촌진흥청', 'https://www.rda.go.kr', 'government', 0.95),
    ('FAO Open Knowledge', 'https://www.fao.org', 'government', 0.95),
    ('Community Database', 'https://community.example.com', 'community', 0.5)
ON CONFLICT DO NOTHING;

-- =============================================
-- 11. 함수 생성 (데이터 검증용)
-- =============================================

-- 영양액 레시피 검증 함수
CREATE OR REPLACE FUNCTION validate_nutrient_recipe(
    p_crop_key TEXT,
    p_stage TEXT,
    p_target_ec NUMERIC,
    p_target_ph NUMERIC,
    p_macro JSONB,
    p_micro JSONB
) RETURNS BOOLEAN AS $$
BEGIN
    -- 기본 검증
    IF p_crop_key IS NULL OR p_stage IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- pH 범위 검증 (5.5-6.5)
    IF p_target_ph IS NOT NULL AND (p_target_ph < 5.5 OR p_target_ph > 6.5) THEN
        RETURN FALSE;
    END IF;
    
    -- EC 범위 검증 (0.5-3.0 mS/cm)
    IF p_target_ec IS NOT NULL AND (p_target_ec < 0.5 OR p_target_ec > 3.0) THEN
        RETURN FALSE;
    END IF;
    
    -- macro JSONB 검증 (필수 키 존재 확인)
    IF p_macro IS NULL OR NOT (p_macro ? 'N' AND p_macro ? 'P' AND p_macro ? 'K') THEN
        RETURN FALSE;
    END IF;
    
    -- micro JSONB 검증 (필수 키 존재 확인)
    IF p_micro IS NULL OR NOT (p_micro ? 'Fe' AND p_micro ? 'Mn' AND p_micro ? 'B') THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 12. 트리거 생성 (자동 검증)
-- =============================================

-- 영양액 레시피 삽입/수정 시 자동 검증
CREATE OR REPLACE FUNCTION trigger_validate_nutrient_recipe()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_nutrient_recipe(
        NEW.crop_key,
        NEW.stage,
        NEW.target_ec,
        NEW.target_ph,
        NEW.macro,
        NEW.micro
    ) THEN
        RAISE EXCEPTION 'Invalid nutrient recipe data';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_nutrient_recipe
    BEFORE INSERT OR UPDATE ON nutrient_recipes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validate_nutrient_recipe();

-- =============================================
-- 13. 마이그레이션 완료 로그
-- =============================================

-- 마이그레이션 이력 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS migration_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name TEXT NOT NULL,
    applied_at TIMESTAMP DEFAULT NOW(),
    description TEXT
);

-- 이번 마이그레이션 기록
INSERT INTO migration_history (migration_name, description) VALUES (
    '20250101_nutrient_auto_collection',
    '영양액 자동 수집 시스템 테이블 및 정책 추가'
);

-- =============================================
-- 마이그레이션 완료
-- =============================================

-- 성공 메시지
DO $$
BEGIN
    RAISE NOTICE '영양액 자동 수집 시스템 마이그레이션이 완료되었습니다.';
    RAISE NOTICE '생성된 테이블: nutrient_sources, nutrient_recipes, nutrient_recipe_aliases, nutrient_jobs';
    RAISE NOTICE '생성된 뷰: vw_crop_recipes_latest';
    RAISE NOTICE '생성된 함수: validate_nutrient_recipe';
    RAISE NOTICE '생성된 트리거: trg_validate_nutrient_recipe';
END $$;
