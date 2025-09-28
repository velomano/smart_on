-- 🔒 Row Level Security (RLS) 정책
-- 최종 업데이트: 2025.09.28
-- 
-- 🆕 최근 개선사항 (2025.09.28):
-- ✅ 중복 정책 제거 및 정리
-- ✅ 보안 취약점 해결 (allow_user_selects/updates 삭제)
-- ✅ 조건부 정책 생성으로 안정성 향상
-- ✅ 시스템 관리자 권한 최적화
-- ✅ 사용자별 프로필 접근 제어 강화
-- Supabase 보안 설정

-- =============================================
-- RLS 활성화
-- =============================================

-- RLS 활성화 (테이블이 존재하는 경우에만)
DO $$
BEGIN
    -- users 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- tenants 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- teams 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
        ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- memberships 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
        ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- user_settings 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- user_activity_logs 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_logs') THEN
        ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- profiles 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- raspberry_pis 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'raspberry_pis') THEN
        ALTER TABLE raspberry_pis ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- sensors 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensors') THEN
        ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- sensor_data 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensor_data') THEN
        ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- control_commands 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'control_commands') THEN
        ALTER TABLE control_commands ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- tuya_devices 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tuya_devices') THEN
        ALTER TABLE tuya_devices ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =============================================
-- 사용자 테이블 정책
-- =============================================

-- 사용자 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- 기존 정책 삭제 후 재생성
        DROP POLICY IF EXISTS "Users can view own profile" ON users;
        DROP POLICY IF EXISTS "Users can update own profile" ON users;
        DROP POLICY IF EXISTS "Users can insert own profile" ON users;
        DROP POLICY IF EXISTS "System admins can view all users" ON users;
        DROP POLICY IF EXISTS "System admins can update all users" ON users;
        
        -- 사용자는 자신의 정보만 조회/수정 가능
        CREATE POLICY "Users can view own profile" ON users
            FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (auth.uid() = id);

        -- 새 사용자 정보 자동 생성 (회원가입 시)
        CREATE POLICY "Users can insert own profile" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);

        -- 시스템 관리자는 모든 사용자 조회/수정 가능
        CREATE POLICY "System admins can view all users" ON users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = 'system_admin' 
                    AND is_active = true
                )
            );

        CREATE POLICY "System admins can update all users" ON users
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = 'system_admin' 
                    AND is_active = true
                )
            );
    END IF;
END $$;

-- =============================================
-- 테넌트 정책
-- =============================================

-- tenants 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        -- 모든 인증된 사용자가 테넌트 조회 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'Authenticated users can view tenants') THEN
            CREATE POLICY "Authenticated users can view tenants" ON tenants
                FOR SELECT USING (auth.role() = 'authenticated');
        END IF;

        -- 시스템 관리자만 테넌트 생성/수정 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'System admins can manage tenants') THEN
            CREATE POLICY "System admins can manage tenants" ON tenants
                FOR ALL USING (
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE id = auth.uid() 
                        AND role = 'system_admin' 
                        AND is_active = true
                    )
                );
        END IF;
    END IF;
END $$;

-- =============================================
-- 팀 정책
-- =============================================

-- teams 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
        -- 모든 인증된 사용자가 팀 조회 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Authenticated users can view teams') THEN
            CREATE POLICY "Authenticated users can view teams" ON teams
                FOR SELECT USING (auth.role() = 'authenticated');
        END IF;

        -- 시스템 관리자와 팀 리더만 팀 관리 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Admins and leaders can manage teams') THEN
            CREATE POLICY "Admins and leaders can manage teams" ON teams
                FOR ALL USING (
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE id = auth.uid() 
                        AND role IN ('system_admin', 'team_leader') 
                        AND is_active = true
                    )
                );
        END IF;
    END IF;
END $$;

-- =============================================
-- 멤버십 정책
-- =============================================

-- memberships 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
        -- 사용자는 자신의 멤버십 조회 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'memberships' AND policyname = 'Users can view own memberships') THEN
            CREATE POLICY "Users can view own memberships" ON memberships
                FOR SELECT USING (user_id = auth.uid());
        END IF;

        -- 시스템 관리자와 팀 리더만 멤버십 관리 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'memberships' AND policyname = 'Admins and leaders can manage memberships') THEN
            CREATE POLICY "Admins and leaders can manage memberships" ON memberships
                FOR ALL USING (
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE id = auth.uid() 
                        AND role IN ('system_admin', 'team_leader') 
                        AND is_active = true
                    )
                );
        END IF;
    END IF;
END $$;

-- =============================================
-- 사용자 설정 정책
-- =============================================

-- user_settings 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        -- 사용자는 자신의 설정만 조회/수정 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view own settings') THEN
            CREATE POLICY "Users can view own settings" ON user_settings
                FOR SELECT USING (user_id = auth.uid());
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update own settings') THEN
            CREATE POLICY "Users can update own settings" ON user_settings
                FOR UPDATE USING (user_id = auth.uid());
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can insert own settings') THEN
            CREATE POLICY "Users can insert own settings" ON user_settings
                FOR INSERT WITH CHECK (user_id = auth.uid());
        END IF;
    END IF;
END $$;

-- =============================================
-- 사용자 활동 로그 정책
-- =============================================

-- user_activity_logs 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_logs') THEN
        -- 사용자는 자신의 활동 로그 조회 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_activity_logs' AND policyname = 'Users can view own activity logs') THEN
            CREATE POLICY "Users can view own activity logs" ON user_activity_logs
                FOR SELECT USING (user_id = auth.uid());
        END IF;

        -- 시스템 관리자는 모든 활동 로그 조회 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_activity_logs' AND policyname = 'System admins can view all activity logs') THEN
            CREATE POLICY "System admins can view all activity logs" ON user_activity_logs
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE id = auth.uid() 
                        AND role = 'system_admin' 
                        AND is_active = true
                    )
                );
        END IF;
    END IF;
END $$;

-- =============================================
-- 사용자 프로필 정책 (기존)
-- =============================================

-- profiles 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- 사용자는 자신의 프로필만 조회/수정 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
            CREATE POLICY "Users can view own profile" ON profiles
                FOR SELECT USING (auth.uid() = id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
            CREATE POLICY "Users can update own profile" ON profiles
                FOR UPDATE USING (auth.uid() = id);
        END IF;

        -- 새 사용자 프로필 자동 생성
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
            CREATE POLICY "Users can insert own profile" ON profiles
                FOR INSERT WITH CHECK (auth.uid() = id);
        END IF;
    END IF;
END $$;

-- =============================================
-- Raspberry Pi 정책
-- =============================================

-- raspberry_pis 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'raspberry_pis') THEN
        -- 모든 사용자가 Pi 목록 조회 가능 (모니터링용)
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raspberry_pis' AND policyname = 'Anyone can view raspberry pis') THEN
            CREATE POLICY "Anyone can view raspberry pis" ON raspberry_pis
                FOR SELECT USING (true);
        END IF;

        -- 인증된 사용자만 Pi 생성 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raspberry_pis' AND policyname = 'Authenticated users can create pis') THEN
            CREATE POLICY "Authenticated users can create pis" ON raspberry_pis
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        END IF;

        -- Pi 소유자만 수정/삭제 가능 (향후 소유권 시스템 구현시)
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raspberry_pis' AND policyname = 'Pi owners can update pis') THEN
            CREATE POLICY "Pi owners can update pis" ON raspberry_pis
                FOR UPDATE USING (auth.role() = 'authenticated');
        END IF;
    END IF;
END $$;

-- =============================================
-- 농장 정책
-- =============================================

-- farms 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'farms') THEN
        -- 모든 인증된 사용자가 농장 조회 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'farms' AND policyname = 'Authenticated users can view farms') THEN
            CREATE POLICY "Authenticated users can view farms" ON farms
                FOR SELECT USING (auth.role() = 'authenticated');
        END IF;

        -- 시스템 관리자만 농장 생성/수정/삭제 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'farms' AND policyname = 'System admins can manage farms') THEN
            CREATE POLICY "System admins can manage farms" ON farms
                FOR ALL USING (
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE id = auth.uid() 
                        AND role = 'system_admin' 
                        AND is_active = true
                    )
                );
        END IF;
    END IF;
END $$;

-- =============================================
-- 디바이스 정책
-- =============================================

-- devices 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devices') THEN
        -- 모든 인증된 사용자가 디바이스 조회 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devices' AND policyname = 'Authenticated users can view devices') THEN
            CREATE POLICY "Authenticated users can view devices" ON devices
                FOR SELECT USING (auth.role() = 'authenticated');
        END IF;

        -- 시스템 관리자와 농장장만 디바이스 생성/수정/삭제 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devices' AND policyname = 'Admins and leaders can manage devices') THEN
            CREATE POLICY "Admins and leaders can manage devices" ON devices
                FOR ALL USING (
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE id = auth.uid() 
                        AND role IN ('system_admin', 'team_leader') 
                        AND is_active = true
                    )
                );
        END IF;
    END IF;
END $$;

-- =============================================
-- 센서 정책
-- =============================================

-- sensors 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensors') THEN
        -- 모든 인증된 사용자가 센서 조회 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sensors' AND policyname = 'Authenticated users can view sensors') THEN
            CREATE POLICY "Authenticated users can view sensors" ON sensors
                FOR SELECT USING (auth.role() = 'authenticated');
        END IF;

        -- 시스템 관리자와 농장장만 센서 생성/수정/삭제 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sensors' AND policyname = 'Admins and leaders can manage sensors') THEN
            CREATE POLICY "Admins and leaders can manage sensors" ON sensors
                FOR ALL USING (
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE id = auth.uid() 
                        AND role IN ('system_admin', 'team_leader') 
                        AND is_active = true
                    )
                );
        END IF;
    END IF;
END $$;

-- =============================================
-- 센서 데이터 정책
-- =============================================

-- sensor_readings 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensor_readings') THEN
        -- 모든 인증된 사용자가 센서 데이터 조회 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sensor_readings' AND policyname = 'Authenticated users can view sensor readings') THEN
            CREATE POLICY "Authenticated users can view sensor readings" ON sensor_readings
                FOR SELECT USING (auth.role() = 'authenticated');
        END IF;

        -- 서비스 역할만 센서 데이터 삽입 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sensor_readings' AND policyname = 'Service role can insert sensor readings') THEN
            CREATE POLICY "Service role can insert sensor readings" ON sensor_readings
                FOR INSERT WITH CHECK (auth.role() = 'service_role');
        END IF;
    END IF;
END $$;

-- sensor_data 테이블이 존재하는 경우에만 정책 생성 (기존 호환성)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensor_data') THEN
        -- 모든 사용자가 센서 데이터 조회 가능 (모니터링용)
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sensor_data' AND policyname = 'Anyone can view sensor data') THEN
            CREATE POLICY "Anyone can view sensor data" ON sensor_data
                FOR SELECT USING (true);
        END IF;

        -- Raspberry Pi 서비스만 센서 데이터 삽입 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sensor_data' AND policyname = 'Service role can insert sensor data') THEN
            CREATE POLICY "Service role can insert sensor data" ON sensor_data
                FOR INSERT WITH CHECK (auth.role() = 'service_role');
        END IF;
    END IF;
END $$;

-- =============================================
-- 제어 명령 정책
-- =============================================

-- control_commands 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'control_commands') THEN
        -- 인증된 사용자만 명령 조회 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'control_commands' AND policyname = 'Authenticated users can view commands') THEN
            CREATE POLICY "Authenticated users can view commands" ON control_commands
                FOR SELECT USING (auth.role() = 'authenticated');
        END IF;

        -- 인증된 사용자만 명령 생성 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'control_commands' AND policyname = 'Authenticated users can create commands') THEN
            CREATE POLICY "Authenticated users can create commands" ON control_commands
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        END IF;

        -- Raspberry Pi 서비스만 명령 상태 업데이트 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'control_commands' AND policyname = 'Service role can update command status') THEN
            CREATE POLICY "Service role can update command status" ON control_commands
                FOR UPDATE USING (auth.role() = 'service_role');
        END IF;
    END IF;
END $$;

-- =============================================
-- Tuya 디바이스 정책
-- =============================================

-- tuya_devices 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tuya_devices') THEN
        -- 모든 사용자가 Tuya 디바이스 조회 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tuya_devices' AND policyname = 'Anyone can view tuya devices') THEN
            CREATE POLICY "Anyone can view tuya devices" ON tuya_devices
                FOR SELECT USING (true);
        END IF;

        -- 인증된 사용자만 Tuya 디바이스 생성 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tuya_devices' AND policyname = 'Authenticated users can create tuya devices') THEN
            CREATE POLICY "Authenticated users can create tuya devices" ON tuya_devices
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        END IF;

        -- 인증된 사용자만 Tuya 디바이스 수정 가능
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tuya_devices' AND policyname = 'Authenticated users can update tuya devices') THEN
            CREATE POLICY "Authenticated users can update tuya devices" ON tuya_devices
                FOR UPDATE USING (auth.role() = 'authenticated');
        END IF;
    END IF;
END $$;

-- =============================================
-- 뷰 RLS 설정
-- =============================================

-- 뷰가 존재하는 경우에만 RLS 정책 적용
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'latest_sensor_data') THEN
        ALTER VIEW latest_sensor_data SET (security_invoker = true);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'pi_status_summary') THEN
        ALTER VIEW pi_status_summary SET (security_invoker = true);
    END IF;
END $$;

-- =============================================
-- 함수 보안 설정
-- =============================================

-- 센서 데이터 집계 함수 (보안 강화) - sensor_data 테이블이 존재하는 경우에만 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensor_data') THEN
        EXECUTE '
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
        AS $func$
            SELECT 
                AVG(value) as avg_value,
                MIN(value) as min_value,
                MAX(value) as max_value,
                COUNT(*) as count_readings
            FROM sensor_data
            WHERE sensor_id = sensor_id_param
            AND timestamp >= NOW() - INTERVAL ''1 hour'' * hours_back;
        $func$;';
    END IF;
END $$;

-- =============================================
-- 관리자 권한 설정
-- =============================================

-- 관리자 역할 정의 (향후 확장용)
CREATE ROLE admin_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_role;

-- 관리자 정책 (사용자 지정 관리자 확인) - profiles 테이블이 존재하는 경우에만
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can do everything') THEN
            CREATE POLICY "Admins can do everything" ON profiles
                FOR ALL USING (
                    auth.uid() IN (
                        SELECT id FROM users 
                        WHERE email IN ('admin@smartfarm.com', 'sky3rain7@gmail.com')
                        AND role = 'system_admin'
                        AND is_active = true
                    )
                );
        END IF;
    END IF;
END $$;

-- =============================================
-- API 보안 강화
-- =============================================

-- API 키 기반 인증 (Raspberry Pi용) - raspberry_pis 테이블이 존재하는 경우에만 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'raspberry_pis') THEN
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
    END IF;
END $$;

-- API 키 인증 함수 - api_keys 테이블이 존재하는 경우에만 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys') THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION authenticate_api_key(api_key TEXT)
        RETURNS UUID
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        DECLARE
            pi_uuid UUID;
        BEGIN
            SELECT ak.pi_id INTO pi_uuid
            FROM api_keys ak
            WHERE ak.key_hash = encode(sha256(api_key::bytea), ''hex'')
            AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
            AND ak.pi_id IS NOT NULL;
            
            RETURN pi_uuid;
        END;
        $func$;';
    END IF;
END $$;

-- API 키 기반 센서 데이터 삽입 정책 - sensor_data 테이블이 존재하는 경우에만
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensor_data') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sensor_data' AND policyname = 'API key can insert sensor data') THEN
            CREATE POLICY "API key can insert sensor data" ON sensor_data
                FOR INSERT WITH CHECK (
                    authenticate_api_key(current_setting('request.headers', true)::json->>'x-api-key') IS NOT NULL
                );
        END IF;
    END IF;
END $$;
