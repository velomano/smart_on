-- 🔒 Row Level Security (RLS) 정책
-- Supabase 보안 설정

-- =============================================
-- RLS 활성화
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE raspberry_pis ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuya_devices ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 사용자 프로필 정책
-- =============================================

-- 사용자는 자신의 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 새 사용자 프로필 자동 생성
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- Raspberry Pi 정책
-- =============================================

-- 모든 사용자가 Pi 목록 조회 가능 (모니터링용)
CREATE POLICY "Anyone can view raspberry pis" ON raspberry_pis
    FOR SELECT USING (true);

-- 인증된 사용자만 Pi 생성 가능
CREATE POLICY "Authenticated users can create pis" ON raspberry_pis
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Pi 소유자만 수정/삭제 가능 (향후 소유권 시스템 구현시)
CREATE POLICY "Pi owners can update pis" ON raspberry_pis
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================
-- 센서 정책
-- =============================================

-- 모든 사용자가 센서 목록 조회 가능
CREATE POLICY "Anyone can view sensors" ON sensors
    FOR SELECT USING (true);

-- 인증된 사용자만 센서 생성 가능
CREATE POLICY "Authenticated users can create sensors" ON sensors
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 인증된 사용자만 센서 수정 가능
CREATE POLICY "Authenticated users can update sensors" ON sensors
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================
-- 센서 데이터 정책
-- =============================================

-- 모든 사용자가 센서 데이터 조회 가능 (모니터링용)
CREATE POLICY "Anyone can view sensor data" ON sensor_data
    FOR SELECT USING (true);

-- Raspberry Pi 서비스만 센서 데이터 삽입 가능
CREATE POLICY "Service role can insert sensor data" ON sensor_data
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- 제어 명령 정책
-- =============================================

-- 인증된 사용자만 명령 조회 가능
CREATE POLICY "Authenticated users can view commands" ON control_commands
    FOR SELECT USING (auth.role() = 'authenticated');

-- 인증된 사용자만 명령 생성 가능
CREATE POLICY "Authenticated users can create commands" ON control_commands
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Raspberry Pi 서비스만 명령 상태 업데이트 가능
CREATE POLICY "Service role can update command status" ON control_commands
    FOR UPDATE USING (auth.role() = 'service_role');

-- =============================================
-- Tuya 디바이스 정책
-- =============================================

-- 모든 사용자가 Tuya 디바이스 조회 가능
CREATE POLICY "Anyone can view tuya devices" ON tuya_devices
    FOR SELECT USING (true);

-- 인증된 사용자만 Tuya 디바이스 생성 가능
CREATE POLICY "Authenticated users can create tuya devices" ON tuya_devices
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 인증된 사용자만 Tuya 디바이스 수정 가능
CREATE POLICY "Authenticated users can update tuya devices" ON tuya_devices
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================
-- 뷰 RLS 설정
-- =============================================

-- 뷰도 RLS 정책 적용
ALTER VIEW latest_sensor_data SET (security_invoker = true);
ALTER VIEW pi_status_summary SET (security_invoker = true);

-- =============================================
-- 함수 보안 설정
-- =============================================

-- 센서 데이터 집계 함수 (보안 강화)
CREATE OR REPLACE FUNCTION get_sensor_data_summary(
    sensor_id_param UUID,
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    avg_value DECIMAL,
    min_value DECIMAL,
    max_value DECIMAL,
    count_readings BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as count_readings
    FROM sensor_data
    WHERE sensor_id = sensor_id_param
    AND timestamp >= NOW() - INTERVAL '1 hour' * hours_back;
$$;

-- =============================================
-- 관리자 권한 설정
-- =============================================

-- 관리자 역할 정의 (향후 확장용)
CREATE ROLE admin_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_role;

-- 관리자 정책 (사용자 지정 관리자 확인)
CREATE POLICY "Admins can do everything" ON profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE email IN ('admin@smartfarm.com', 'seochunwoo@example.com')
        )
    );

-- =============================================
-- API 보안 강화
-- =============================================

-- API 키 기반 인증 (Raspberry Pi용)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_hash TEXT UNIQUE NOT NULL,
    pi_id UUID REFERENCES raspberry_pis(id),
    name TEXT NOT NULL,
    permissions TEXT[] DEFAULT ARRAY['sensor:write', 'command:read'],
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- API 키 인증 함수
CREATE OR REPLACE FUNCTION authenticate_api_key(api_key TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pi_uuid UUID;
BEGIN
    SELECT ak.pi_id INTO pi_uuid
    FROM api_keys ak
    WHERE ak.key_hash = encode(sha256(api_key::bytea), 'hex')
    AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
    AND ak.pi_id IS NOT NULL;
    
    RETURN pi_uuid;
END;
$$;

-- API 키 기반 센서 데이터 삽입 정책
CREATE POLICY "API key can insert sensor data" ON sensor_data
    FOR INSERT WITH CHECK (
        authenticate_api_key(current_setting('request.headers', true)::json->>'x-api-key') IS NOT NULL
    );
