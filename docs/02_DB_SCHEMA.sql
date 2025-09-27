-- 🌱 스마트팜 데이터베이스 스키마
-- Supabase PostgreSQL 기반
-- 최종 업데이트: 2025.01.24

-- =============================================
-- 사용자 권한 시스템 테이블
-- =============================================

-- 테넌트 테이블
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 팀 테이블
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  team_code TEXT UNIQUE, -- 팀 식별 코드 (예: FARM001)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- 사용자 테이블 (Supabase Auth와 연동) - 완전한 권한 시스템
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'team_member' CHECK (role IN ('system_admin', 'team_leader', 'team_member')),
  tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  team_id UUID REFERENCES teams(id),
  team_name TEXT,
  preferred_team TEXT DEFAULT 'admin_assign',
  is_approved BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  company TEXT,
  phone TEXT,
  avatar_url TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id)
);

-- 멤버십 테이블 (사용자-팀 관계)
CREATE TABLE IF NOT EXISTS memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

-- 사용자 설정 테이블
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 알림 설정
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "telegram": false,
    "dashboard": true,
    "sensor_alerts": true,
    "system_alerts": true,
    "low_humidity": true,
    "high_temperature": true,
    "water_level": true,
    "ph_alerts": true
  }',
  
  -- UI 설정
  ui_preferences JSONB DEFAULT '{
    "theme": "light",
    "language": "ko",
    "dashboard_layout": "default",
    "sidebar_collapsed": false,
    "show_advanced_options": false
  }',
  
  -- 대시보드 설정
  dashboard_preferences JSONB DEFAULT '{
    "show_team_beds": true,
    "show_all_beds": false,
    "auto_refresh": true,
    "refresh_interval": 30,
    "default_view": "grid",
    "show_sensor_charts": true,
    "show_weather_info": true
  }',
  
  -- 텔레그램 설정
  telegram_chat_id TEXT,
  telegram_bot_token TEXT,
  telegram_notifications_enabled BOOLEAN DEFAULT false,
  
  -- 센서 임계값 설정
  sensor_thresholds JSONB DEFAULT '{
    "temperature": {"min": 15, "max": 35},
    "humidity": {"min": 40, "max": 80},
    "soil_moisture": {"min": 30, "max": 70},
    "ph": {"min": 6.0, "max": 7.5},
    "light": {"min": 200, "max": 1000}
  }',
  
  -- 시간대 및 지역 설정
  timezone TEXT DEFAULT 'Asia/Seoul',
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  time_format TEXT DEFAULT '24h',
  
  -- 접근성 설정
  accessibility JSONB DEFAULT '{
    "high_contrast": false,
    "large_text": false,
    "screen_reader": false,
    "keyboard_navigation": true
  }',
  
  -- 개인정보 설정
  privacy JSONB DEFAULT '{
    "share_analytics": true,
    "share_performance_data": false,
    "allow_team_visibility": true
  }',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- login, logout, create_bed, update_settings 등
  resource_type TEXT, -- bed, user, team 등
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- IoT 및 센서 관련 테이블
-- =============================================

-- Raspberry Pi 기기 테이블
CREATE TABLE IF NOT EXISTS raspberry_pis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pi_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 센서 타입 테이블
CREATE TABLE IF NOT EXISTS sensor_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  unit TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 센서 테이블
CREATE TABLE IF NOT EXISTS sensors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pi_id UUID REFERENCES raspberry_pis(id) ON DELETE CASCADE,
  sensor_type_id UUID REFERENCES sensor_types(id),
  name TEXT NOT NULL,
  pin_number INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 센서 데이터 테이블
CREATE TABLE IF NOT EXISTS sensor_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sensor_id UUID REFERENCES sensors(id) ON DELETE CASCADE,
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- 제어 명령 테이블
CREATE TABLE IF NOT EXISTS control_commands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pi_id UUID REFERENCES raspberry_pis(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL,
  command_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'executed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id)
);

-- Tuya 디바이스 테이블
CREATE TABLE IF NOT EXISTS tuya_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  device_type TEXT,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 인덱스 생성
-- =============================================

-- 사용자 권한 시스템 인덱스
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_teams_tenant_id ON teams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_code ON teams(team_code);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_team_id ON memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_memberships_is_active ON memberships(is_active);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_telegram_enabled ON user_settings(telegram_notifications_enabled);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);

-- 센서 데이터 조회 최적화
CREATE INDEX IF NOT EXISTS idx_sensor_data_sensor_id_timestamp 
ON sensor_data(sensor_id, timestamp DESC);

-- 제어 명령 조회 최적화
CREATE INDEX IF NOT EXISTS idx_control_commands_pi_id_status 
ON control_commands(pi_id, status, created_at DESC);

-- Pi 상태 조회 최적화
CREATE INDEX IF NOT EXISTS idx_raspberry_pis_status 
ON raspberry_pis(status);

-- =============================================
-- 기본 데이터 삽입
-- =============================================

-- 기본 테넌트 생성
INSERT INTO tenants (id, name, description) VALUES
('00000000-0000-0000-0000-000000000001', '스마트팜 메인 테넌트', '메인 스마트팜 운영 테넌트')
ON CONFLICT (id) DO NOTHING;

-- 기본 팀 생성
INSERT INTO teams (id, tenant_id, name, description, team_code) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '1농장', '1번 농장 팀', 'FARM001'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2농장', '2번 농장 팀', 'FARM002'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '3농장', '3번 농장 팀', 'FARM003')
ON CONFLICT (id) DO NOTHING;

-- 센서 타입 기본 데이터
INSERT INTO sensor_types (name, unit, description) VALUES
('temperature', '°C', '온도 센서'),
('humidity', '%', '습도 센서'),
('soil_moisture', '%', '토양 수분 센서'),
('light', 'lux', '조도 센서'),
('ph', 'pH', 'pH 센서'),
('water_level', 'cm', '수위 센서')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 함수 및 트리거
-- =============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- 사용자 권한 시스템 유틸리티 함수
-- =============================================

-- 사용자 역할 확인 함수
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT role FROM users WHERE id = user_uuid;
$$;

-- 사용자가 시스템 관리자인지 확인하는 함수
CREATE OR REPLACE FUNCTION is_system_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_uuid 
        AND role = 'system_admin'
        AND is_active = true
    );
$$;

-- 사용자가 팀 리더인지 확인하는 함수
CREATE OR REPLACE FUNCTION is_team_leader(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_uuid 
        AND role = 'team_leader'
        AND is_active = true
    );
$$;

-- 사용자 활동 로그 기록 함수
CREATE OR REPLACE FUNCTION log_user_activity(
    user_uuid UUID,
    action_type TEXT,
    resource_type TEXT DEFAULT NULL,
    resource_uuid UUID DEFAULT NULL,
    details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_activity_logs (
        user_id, action, resource_type, resource_id, details
    ) VALUES (
        user_uuid, action_type, resource_type, resource_uuid, details
    );
END;
$$;

-- 사용자 설정 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_setting(
    user_uuid UUID,
    setting_category TEXT,
    setting_key TEXT,
    setting_value JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_settings JSONB;
BEGIN
    -- 현재 설정 조회
    SELECT 
        CASE setting_category
            WHEN 'notification' THEN notification_preferences
            WHEN 'ui' THEN ui_preferences
            WHEN 'dashboard' THEN dashboard_preferences
            WHEN 'sensor' THEN sensor_thresholds
            WHEN 'accessibility' THEN accessibility
            WHEN 'privacy' THEN privacy
            ELSE NULL
        END INTO current_settings
    FROM user_settings 
    WHERE user_id = user_uuid;
    
    -- 설정이 없으면 기본값으로 초기화
    IF current_settings IS NULL THEN
        current_settings := '{}';
    END IF;
    
    -- 설정 업데이트
    current_settings := jsonb_set(current_settings, ARRAY[setting_key], setting_value);
    
    -- 데이터베이스 업데이트
    UPDATE user_settings SET
        notification_preferences = CASE WHEN setting_category = 'notification' THEN current_settings ELSE notification_preferences END,
        ui_preferences = CASE WHEN setting_category = 'ui' THEN current_settings ELSE ui_preferences END,
        dashboard_preferences = CASE WHEN setting_category = 'dashboard' THEN current_settings ELSE dashboard_preferences END,
        sensor_thresholds = CASE WHEN setting_category = 'sensor' THEN current_settings ELSE sensor_thresholds END,
        accessibility = CASE WHEN setting_category = 'accessibility' THEN current_settings ELSE accessibility END,
        privacy = CASE WHEN setting_category = 'privacy' THEN current_settings ELSE privacy END,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN FOUND;
END;
$$;

-- 사용자 설정 조회 함수
CREATE OR REPLACE FUNCTION get_user_setting(
    user_uuid UUID,
    setting_category TEXT,
    setting_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        CASE setting_category
            WHEN 'notification' THEN notification_preferences
            WHEN 'ui' THEN ui_preferences
            WHEN 'dashboard' THEN dashboard_preferences
            WHEN 'sensor' THEN sensor_thresholds
            WHEN 'accessibility' THEN accessibility
            WHEN 'privacy' THEN privacy
            ELSE NULL
        END
    FROM user_settings 
    WHERE user_id = user_uuid;
$$;

-- updated_at 트리거 적용
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_raspberry_pis_updated_at BEFORE UPDATE ON raspberry_pis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON sensors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tuya_devices_updated_at BEFORE UPDATE ON tuya_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 뷰 생성
-- =============================================

-- 최신 센서 데이터 뷰
CREATE OR REPLACE VIEW latest_sensor_data AS
SELECT 
    s.id as sensor_id,
    s.name as sensor_name,
    st.name as sensor_type,
    st.unit,
    sd.value,
    sd.timestamp,
    rp.pi_id,
    rp.name as pi_name,
    rp.location
FROM sensors s
JOIN sensor_types st ON s.sensor_type_id = st.id
JOIN raspberry_pis rp ON s.pi_id = rp.id
LEFT JOIN LATERAL (
    SELECT value, timestamp
    FROM sensor_data
    WHERE sensor_id = s.id
    ORDER BY timestamp DESC
    LIMIT 1
) sd ON true;

-- Pi 상태 요약 뷰
CREATE OR REPLACE VIEW pi_status_summary AS
SELECT 
    rp.id,
    rp.pi_id,
    rp.name,
    rp.location,
    rp.status,
    rp.last_seen,
    COUNT(s.id) as sensor_count,
    COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_sensors
FROM raspberry_pis rp
LEFT JOIN sensors s ON rp.id = s.pi_id
GROUP BY rp.id, rp.pi_id, rp.name, rp.location, rp.status, rp.last_seen;
