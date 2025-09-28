-- =============================================
-- 스마트팜 데이터베이스 스키마 (실제 구조)
-- 업데이트: 2025.01.01
-- 최종 업데이트: 2025.01.01 (권한 시스템 및 농장 관리 기능 완성)
-- =============================================

-- =============================================
-- 1. 테넌트 및 사용자 관리
-- =============================================

-- 테넌트 테이블
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
  description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 테이블 (Supabase auth.users와 연동)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,                              -- auth.users.id와 동일
    email TEXT UNIQUE,
    name TEXT,
    company TEXT,                                     -- 소속 (회사명)
    phone TEXT,
    is_approved BOOLEAN DEFAULT false,                -- 승인 여부
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,                   -- 활성 상태
    role TEXT,                                        -- 역할
    team_name TEXT,
    team_id UUID REFERENCES teams(id),
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::UUID,
    preferred_team TEXT DEFAULT 'admin_assign',
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 팀 테이블
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
    team_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 멤버십 테이블 (사용자-테넌트 관계)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role TEXT NOT NULL CHECK (role IN ('owner', 'operator', 'viewer')),
    team_id UUID REFERENCES teams(id)
);

-- 사용자 설정 테이블
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id),
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "telegram": false,
    "dashboard": true,
        "ph_alerts": true,
        "water_level": true,
        "low_humidity": true,
    "sensor_alerts": true,
    "system_alerts": true,
        "high_temperature": true
    }'::jsonb,
  ui_preferences JSONB DEFAULT '{
    "theme": "light",
    "language": "ko",
    "dashboard_layout": "default",
    "sidebar_collapsed": false,
    "show_advanced_options": false
    }'::jsonb,
  dashboard_preferences JSONB DEFAULT '{
        "auto_refresh": true,
        "default_view": "grid",
        "show_all_beds": false,
    "show_team_beds": true,
    "refresh_interval": 30,
        "show_weather_info": true,
        "show_sensor_charts": true
    }'::jsonb,
  telegram_chat_id TEXT,
  telegram_bot_token TEXT,
  telegram_notifications_enabled BOOLEAN DEFAULT false,
  sensor_thresholds JSONB DEFAULT '{
        "ph": {"max": 7.5, "min": 6.0},
        "light": {"max": 1000, "min": 200},
        "humidity": {"max": 80, "min": 40},
        "temperature": {"max": 35, "min": 15},
        "soil_moisture": {"max": 70, "min": 30}
    }'::jsonb,
  timezone TEXT DEFAULT 'Asia/Seoul',
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  time_format TEXT DEFAULT '24h',
  accessibility JSONB DEFAULT '{
        "large_text": false,
    "high_contrast": false,
    "screen_reader": false,
    "keyboard_navigation": true
    }'::jsonb,
  privacy JSONB DEFAULT '{
    "share_analytics": true,
        "allow_team_visibility": true,
        "share_performance_data": false
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. 농장 및 베드 관리
-- =============================================

-- 농장 테이블
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 베드 테이블
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    name TEXT NOT NULL,
    crop TEXT,                                        -- 작물명
    target_temp NUMERIC,                             -- 목표 온도
    target_humidity NUMERIC,                         -- 목표 습도
    target_ec NUMERIC,                               -- 목표 EC
    target_ph NUMERIC,                               -- 목표 pH
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. 디바이스 및 센서 관리
-- =============================================

-- 디바이스 테이블
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    bed_id UUID REFERENCES beds(id),                 -- 베드 연결 (선택적)
    type TEXT NOT NULL CHECK (type IN (
        'switch', 'pump', 'fan', 'light', 'motor', 'sensor_gateway'
    )),
    vendor TEXT,                                     -- 'custom', 'tuya'
    tuya_device_id TEXT,                            -- Tuya 디바이스 ID
    status JSONB,                                    -- {"online": true, "on": false}
    meta JSONB,                                      -- {"pi_id": "pi-001", "location": "조1-베드1"}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 센서 테이블
CREATE TABLE IF NOT EXISTS sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id),
    type TEXT NOT NULL,                              -- 'temp', 'humidity', 'ec', 'ph', 'lux', 'water_temp'
    unit TEXT,                                       -- '°C', '%', 'mS/cm', 'pH', 'lux'
    meta JSONB,                                      -- {"pin": 2, "sensor_model": "DHT22"}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 센서 데이터 테이블
CREATE SEQUENCE IF NOT EXISTS sensor_readings_id_seq;
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGINT PRIMARY KEY DEFAULT nextval('sensor_readings_id_seq'),
    sensor_id UUID NOT NULL REFERENCES sensors(id),
    ts TIMESTAMPTZ NOT NULL,
    value NUMERIC NOT NULL,
    quality INTEGER DEFAULT 1
);

-- =============================================
-- 4. 제어 및 알림 시스템
-- =============================================

-- 제어 명령 테이블
CREATE TABLE IF NOT EXISTS commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id),
    issued_by UUID REFERENCES users(id),
    ts TIMESTAMPTZ DEFAULT NOW(),
    command TEXT NOT NULL,
    payload JSONB,
    status TEXT NOT NULL DEFAULT 'pending',
    correlation_id TEXT UNIQUE
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    bed_id UUID REFERENCES beds(id),
    severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT,
    detail TEXT,
    ts TIMESTAMPTZ DEFAULT NOW(),
    ack_by UUID REFERENCES users(id)
);

-- 자동화 규칙 테이블
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
  name TEXT NOT NULL,
    trigger JSONB NOT NULL,
    condition JSONB,
    action JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. 감사 및 로깅
-- =============================================

-- 감사 로그 테이블
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    entity TEXT,
    entity_id UUID,
    action TEXT,
    diff JSONB,
    ts TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. 영양액 관리 (향후 확장)
-- =============================================

-- 작물 프로필 테이블
CREATE TABLE IF NOT EXISTS crop_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_key TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    stage TEXT NOT NULL,
    target_ppm JSONB NOT NULL,
    target_ec NUMERIC,
    target_ph NUMERIC
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

-- 염류 테이블
CREATE TABLE IF NOT EXISTS salts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    formula TEXT,
    purity_pct NUMERIC DEFAULT 100,
    density_kg_per_l NUMERIC,
    ion_contributions JSONB NOT NULL
);

-- 영양 이온 테이블
CREATE TABLE IF NOT EXISTS nutrient_ions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    valence INTEGER
);

-- 영양액 레시피 테이블
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT
);

-- 레시피 라인 테이블
CREATE TABLE IF NOT EXISTS recipe_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipes(id),
    salt_id UUID REFERENCES salts(id),
    grams NUMERIC NOT NULL,
    tank TEXT DEFAULT 'none'
);

-- =============================================
-- 7. 인덱스 생성
-- =============================================

-- 센서 데이터 인덱스 (시계열 데이터 최적화)
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id_ts 
ON sensor_readings(sensor_id, ts DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_ts 
ON sensor_readings(ts DESC);

-- 디바이스 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_devices_farm_id 
ON devices(farm_id);

CREATE INDEX IF NOT EXISTS idx_devices_bed_id 
ON devices(bed_id);

CREATE INDEX IF NOT EXISTS idx_devices_type 
ON devices(type);

-- 사용자 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_memberships_user_id 
ON memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id 
ON memberships(tenant_id);

-- 알림 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_alerts_farm_id 
ON alerts(farm_id);

CREATE INDEX IF NOT EXISTS idx_alerts_ts 
ON alerts(ts DESC);

-- 명령 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_commands_device_id 
ON commands(device_id);

CREATE INDEX IF NOT EXISTS idx_commands_status 
ON commands(status);

-- =============================================
-- 8. 제약조건 및 트리거
-- =============================================

-- 멤버십 유니크 제약조건
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_tenant 
ON memberships(user_id, tenant_id);

-- 사용자 이메일 유니크 제약조건
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- 팀 코드 유니크 제약조건
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_code 
ON teams(team_code);

-- 센서 타입 체크 제약조건
ALTER TABLE sensors ADD CONSTRAINT IF NOT EXISTS check_sensor_type 
CHECK (type IN ('temp', 'humidity', 'ec', 'ph', 'lux', 'water_temp'));

-- 디바이스 타입 체크 제약조건
ALTER TABLE devices ADD CONSTRAINT IF NOT EXISTS check_device_type 
CHECK (type IN ('switch', 'pump', 'fan', 'light', 'motor', 'sensor_gateway'));

-- 멤버십 역할 체크 제약조건
ALTER TABLE memberships ADD CONSTRAINT IF NOT EXISTS check_membership_role 
CHECK (role IN ('owner', 'operator', 'viewer'));

-- 알림 심각도 체크 제약조건
ALTER TABLE alerts ADD CONSTRAINT IF NOT EXISTS check_alert_severity 
CHECK (severity IN ('info', 'warning', 'critical'));

-- =============================================
-- 9. RLS (Row Level Security) 정책
-- =============================================

-- RLS 활성화
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 기본 정책들 (세부 정책은 03_RLS_POLICIES.sql에서 관리)

-- =============================================
-- 10. 뷰 생성 (자주 사용되는 쿼리 최적화)
-- =============================================

-- 농장별 베드 및 디바이스 현황 뷰
CREATE OR REPLACE VIEW farm_overview AS
SELECT 
    f.id as farm_id,
    f.name as farm_name,
    f.location as farm_location,
    f.tenant_id,
    COUNT(DISTINCT b.id) as bed_count,
    COUNT(DISTINCT d.id) as device_count,
    COUNT(DISTINCT CASE WHEN d.type = 'sensor_gateway' THEN d.id END) as sensor_gateway_count,
    COUNT(DISTINCT s.id) as sensor_count
FROM farms f
LEFT JOIN beds b ON f.id = b.farm_id
LEFT JOIN devices d ON f.id = d.farm_id
LEFT JOIN sensors s ON d.id = s.device_id
GROUP BY f.id, f.name, f.location, f.tenant_id;

-- 베드별 센서 현황 뷰
CREATE OR REPLACE VIEW bed_sensor_status AS
SELECT 
    b.id as bed_id,
    b.name as bed_name,
    b.farm_id,
    d.id as device_id,
    d.type as device_type,
    d.status as device_status,
    COUNT(s.id) as sensor_count,
    STRING_AGG(s.type, ', ') as sensor_types
FROM beds b
LEFT JOIN devices d ON b.id = d.bed_id
LEFT JOIN sensors s ON d.id = s.device_id
GROUP BY b.id, b.name, b.farm_id, d.id, d.type, d.status;

-- 사용자별 권한 정보 뷰
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.is_approved,
    u.is_active,
    m.role,
    t.id as tenant_id,
    t.name as tenant_name,
    tm.id as team_id,
    tm.name as team_name
FROM users u
LEFT JOIN memberships m ON u.id = m.user_id
LEFT JOIN tenants t ON m.tenant_id = t.id
LEFT JOIN teams tm ON m.team_id = tm.id;

-- 최신 센서 데이터 뷰
CREATE OR REPLACE VIEW latest_sensor_data AS
SELECT DISTINCT ON (s.id)
    s.id as sensor_id,
    s.type as sensor_type,
    s.unit,
    d.id as device_id,
    d.farm_id,
    d.bed_id,
    sr.value,
    sr.ts as reading_time,
    sr.quality
FROM sensors s
LEFT JOIN devices d ON s.device_id = d.id
LEFT JOIN sensor_readings sr ON s.id = sr.sensor_id
ORDER BY s.id, sr.ts DESC;

-- =============================================
-- 스키마 생성 완료
-- =============================================

COMMENT ON TABLE tenants IS '테넌트 관리 테이블 - 다중 고객 지원';
COMMENT ON TABLE users IS '사용자 정보 테이블 - Supabase auth와 연동';
COMMENT ON TABLE memberships IS '사용자-테넌트 관계 테이블 - 권한 관리';
COMMENT ON TABLE teams IS '팀 관리 테이블 - 조직 구조';
COMMENT ON TABLE farms IS '농장 정보 테이블 - 물리적 농장 단위';
COMMENT ON TABLE beds IS '베드 정보 테이블 - 농장 내 재배 구역';
COMMENT ON TABLE devices IS '디바이스 관리 테이블 - 센서게이트웨이 및 제어장치';
COMMENT ON TABLE sensors IS '센서 정보 테이블 - 각종 측정 센서';
COMMENT ON TABLE sensor_readings IS '센서 데이터 테이블 - 시계열 측정 데이터';
COMMENT ON TABLE commands IS '제어 명령 테이블 - 디바이스 원격 제어';
COMMENT ON TABLE alerts IS '알림 테이블 - 임계값 기반 알림 시스템';
COMMENT ON TABLE rules IS '자동화 규칙 테이블 - 조건부 자동 제어';
COMMENT ON TABLE audits IS '감사 로그 테이블 - 사용자 활동 추적';
COMMENT ON TABLE user_settings IS '사용자 설정 테이블 - 개인화 설정';