-- =============================================
-- 스마트팜 데이터베이스 스키마 (2025.01.01 기준)
-- =============================================

-- =============================================
-- 1. 테넌트 및 사용자 관리
-- =============================================

-- 테넌트 테이블
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 사용자 정보 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 멤버십 (권한 관리)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'system_admin', 'team_leader', 'team_member')),
    tenant_id UUID REFERENCES tenants(id),
    team_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 팀 관리
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    team_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 사용자 설정
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    notification_preferences JSONB,
    telegram_chat_id VARCHAR(100),
    ui_preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 2. 농장 및 베드 관리
-- =============================================

-- 농장 정보
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 베드 정보
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES farms(id),
    name VARCHAR(100) NOT NULL,
    crop VARCHAR(100),
    target_temp DECIMAL(5,2),
    target_humidity DECIMAL(5,2),
    target_ec DECIMAL(5,2),
    target_ph DECIMAL(4,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 디바이스 (베드) 정보
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES farms(id),
    bed_id UUID REFERENCES beds(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('switch', 'pump', 'fan', 'light', 'motor', 'sensor_gateway')),
    vendor VARCHAR(50),
    tuya_device_id VARCHAR(100),
    status JSONB,
    meta JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 3. 센서 및 데이터 수집
-- =============================================

-- 센서 정보
CREATE TABLE IF NOT EXISTS sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id),
    sensor_type VARCHAR(50) NOT NULL CHECK (sensor_type IN ('temperature', 'humidity', 'ec', 'ph', 'lux', 'water_temp', 'co2')),
    sensor_id VARCHAR(100),
    tier_number INTEGER DEFAULT 1,
    unit VARCHAR(20),
    meta JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 센서 측정값
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID REFERENCES sensors(id),
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quality VARCHAR(20) DEFAULT 'good' CHECK (quality IN ('good', 'warning', 'error')),
    raw_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 4. 제어 및 자동화
-- =============================================

-- 제어 명령
CREATE TABLE IF NOT EXISTS commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id),
    issued_by UUID REFERENCES users(id),
    command TEXT NOT NULL,
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acked', 'failed')),
    correlation_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 자동화 규칙
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES farms(id),
    name VARCHAR(100) NOT NULL,
    trigger JSONB NOT NULL,
    condition JSONB NOT NULL,
    action JSONB NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 5. 알림 및 감사
-- =============================================

-- 알림/경고
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES farms(id),
    bed_id UUID REFERENCES beds(id),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(200) NOT NULL,
    detail TEXT,
    ack_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 감사 로그 테이블
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    entity TEXT,
    entity_id UUID,
    action TEXT,
    diff JSONB,
    ts TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 6. 영양액 관리 (기존)
-- =============================================

-- 영양 이온 테이블
CREATE TABLE IF NOT EXISTS nutrient_ions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    valence INTEGER
);

-- 염류 테이블
CREATE TABLE IF NOT EXISTS salts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    formula TEXT,
    purity_pct NUMERIC DEFAULT 100,
    density_kg_per_l NUMERIC,
    ion_contributions JSONB NOT NULL
);

-- 작물 프로필 테이블 (기존)
CREATE TABLE IF NOT EXISTS crop_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_key TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('seedling', 'vegetative', 'flowering', 'fruiting', 'ripening')),
    target_ppm JSONB NOT NULL,
    target_ec NUMERIC,
    target_ph NUMERIC,
    metadata JSONB -- 원수 보정식 등 추가 메타데이터
);

-- 물 프로필 테이블
CREATE TABLE IF NOT EXISTS water_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,
    alkalinity_mg_per_l_as_caco3 NUMERIC DEFAULT 0,
    ph NUMERIC DEFAULT 7.0,
    existing_ions JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 영양액 레시피 테이블 (기존)
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    crop_profile_id UUID REFERENCES crop_profiles(id),
    water_profile_id UUID REFERENCES water_profiles(id),
    target_volume_l NUMERIC NOT NULL,
    target_ec NUMERIC,
    target_ph NUMERIC,
    ec_est NUMERIC,
    ph_est NUMERIC,
    warnings JSONB,
    status TEXT DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 레시피 라인 테이블
CREATE TABLE IF NOT EXISTS recipe_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipes(id),
    salt_id UUID REFERENCES salts(id),
    grams NUMERIC NOT NULL,
    tank VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 7. 영양액 자동 수집 시스템 (신규)
-- =============================================

-- 영양액 데이터 소스 테이블
CREATE TABLE IF NOT EXISTS nutrient_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT,
    org_type TEXT NOT NULL CHECK (org_type IN ('government', 'academic', 'commercial', 'community')),
    license TEXT,
    reliability_default NUMERIC DEFAULT 0.5 CHECK (reliability_default >= 0 AND reliability_default <= 1),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 영양액 레시피 테이블 (자동 수집용)
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

-- 영양액 레시피 별칭 테이블 (중복 데이터 관리용)
CREATE TABLE IF NOT EXISTS nutrient_recipe_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_key TEXT NOT NULL,
    stage TEXT NOT NULL,
    alias TEXT NOT NULL,
    source_id UUID REFERENCES nutrient_sources(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 영양액 수집 작업 테이블
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

-- 데이터 수집 요청 테이블 (기존)
CREATE TABLE IF NOT EXISTS data_collection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name TEXT NOT NULL,
    stage TEXT,
    user_id UUID REFERENCES users(id),
    user_email TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id),
    estimated_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 8. 인덱스 생성
-- =============================================

-- 기본 인덱스
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id_created_at ON sensor_readings(sensor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commands_device_id_created_at ON commands(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_farm_id_created_at ON alerts(farm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON memberships(tenant_id);

-- 영양액 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_crop_profiles_key_stage ON crop_profiles(crop_key, stage);
CREATE INDEX IF NOT EXISTS idx_nutrient_recipes_crop_stage ON nutrient_recipes(crop_key, stage);
CREATE INDEX IF NOT EXISTS idx_nutrient_recipes_checksum ON nutrient_recipes(checksum);
CREATE INDEX IF NOT EXISTS idx_nutrient_jobs_status ON nutrient_jobs(status);
CREATE INDEX IF NOT EXISTS idx_data_collection_requests_status ON data_collection_requests(status);

-- =============================================
-- 9. 제약 조건
-- =============================================

-- 영양액 레시피 중복 방지
CREATE UNIQUE INDEX IF NOT EXISTS ux_nutrient_recipes_crop_stage_checksum 
ON nutrient_recipes(crop_key, stage, checksum);

-- =============================================
-- 10. 뷰 생성
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
-- 11. 초기 데이터 삽입
-- =============================================

-- 영양 이온 초기 데이터
INSERT INTO nutrient_ions(symbol, name, valence) VALUES
    ('N_NO3', 'Nitrate-N', -1),
    ('N_NH4', 'Ammonium-N', 1),
    ('P', 'Phosphorus', -3),
    ('K', 'Potassium', 1),
    ('Ca', 'Calcium', 2),
    ('Mg', 'Magnesium', 2),
    ('S', 'Sulfur', -2),
    ('Fe', 'Iron', 2),
    ('Mn', 'Manganese', 2),
    ('B', 'Boron', 3),
    ('Zn', 'Zinc', 2),
    ('Cu', 'Copper', 2),
    ('Mo', 'Molybdenum', 6)
ON CONFLICT (symbol) DO NOTHING;

-- 염류 초기 데이터
INSERT INTO salts(name, formula, ion_contributions) VALUES
    ('Calcium nitrate tetrahydrate', 'Ca(NO3)2·4H2O', '{"N_NO3":11.86,"Ca":16.98}'),
    ('Potassium nitrate', 'KNO3', '{"N_NO3":13.86,"K":38.67}'),
    ('Monopotassium phosphate', 'KH2PO4', '{"P":22.76,"K":28.73}'),
    ('Magnesium sulfate heptahydrate', 'MgSO4·7H2O', '{"Mg":9.86,"S":13.01}')
ON CONFLICT (name) DO NOTHING;

-- 작물 프로필 초기 데이터
INSERT INTO crop_profiles(crop_key, crop_name, stage, target_ppm, target_ec, target_ph) VALUES
    ('lettuce', '상추', 'vegetative', '{"N_NO3":120,"P":30,"K":200,"Ca":150,"Mg":40,"S":60}', 1.6, 6.0),
    ('tomato', '토마토', 'vegetative', '{"N_NO3":140,"P":40,"K":220,"Ca":150,"Mg":45,"S":70}', 2.2, 6.0),
    ('cucumber', '오이', 'vegetative', '{"N_NO3":130,"P":35,"K":230,"Ca":150,"Mg":45,"S":70}', 2.0, 6.0),
    ('strawberry', '딸기', 'vegetative', '{"N_NO3":110,"P":35,"K":180,"Ca":120,"Mg":40,"S":60}', 1.5, 5.8)
ON CONFLICT DO NOTHING;

-- 물 프로필 초기 데이터
INSERT INTO water_profiles(name, alkalinity_mg_per_l_as_caco3, ph, existing_ions) VALUES
    ('RO_Default', 0, 6.5, '{}'),
    ('Well_Default', 80, 7.5, '{"Ca":20,"Mg":5,"S":10}')
ON CONFLICT DO NOTHING;

-- 영양액 데이터 소스 초기 데이터
INSERT INTO nutrient_sources(name, url, org_type, reliability_default) VALUES
    ('Cornell CEA', 'https://hort.cornell.edu/greenhouse/crops/factsheets/hydroponic-recipes.pdf', 'academic', 0.9),
    ('농촌진흥청', 'https://www.rda.go.kr', 'government', 0.95),
    ('FAO Open Knowledge', 'https://www.fao.org', 'government', 0.95),
    ('Community Database', 'https://community.example.com', 'community', 0.5)
ON CONFLICT DO NOTHING;