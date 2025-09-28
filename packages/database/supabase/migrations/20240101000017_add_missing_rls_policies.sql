-- =============================================
-- 누락된 RLS 정책 추가
-- 최종 업데이트: 2025.01.01
-- 
-- 🆕 추가된 정책:
-- ✅ farms 테이블 RLS 정책
-- ✅ devices 테이블 RLS 정책  
-- ✅ sensors 테이블 RLS 정책
-- ✅ sensor_readings 테이블 RLS 정책
-- =============================================

-- =============================================
-- RLS 활성화
-- =============================================

-- RLS 활성화 (테이블이 존재하는 경우에만)
DO $$
BEGIN
    -- farms 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'farms') THEN
        ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- devices 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devices') THEN
        ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- sensors 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensors') THEN
        ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- sensor_readings 테이블
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensor_readings') THEN
        ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =============================================
-- 농장 정책
-- =============================================

-- farms 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'farms') THEN
        -- 기존 정책 삭제 후 재생성
        DROP POLICY IF EXISTS "Authenticated users can view farms" ON farms;
        DROP POLICY IF EXISTS "System admins can manage farms" ON farms;
        
        -- 모든 인증된 사용자가 농장 조회 가능
        CREATE POLICY "Authenticated users can view farms" ON farms
            FOR SELECT USING (auth.role() = 'authenticated');

        -- 시스템 관리자만 농장 생성/수정/삭제 가능
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
END $$;

-- =============================================
-- 디바이스 정책
-- =============================================

-- devices 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devices') THEN
        -- 기존 정책 삭제 후 재생성
        DROP POLICY IF EXISTS "Authenticated users can view devices" ON devices;
        DROP POLICY IF EXISTS "Admins and leaders can manage devices" ON devices;
        
        -- 모든 인증된 사용자가 디바이스 조회 가능
        CREATE POLICY "Authenticated users can view devices" ON devices
            FOR SELECT USING (auth.role() = 'authenticated');

        -- 시스템 관리자와 농장장만 디바이스 생성/수정/삭제 가능
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
END $$;

-- =============================================
-- 센서 정책
-- =============================================

-- sensors 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensors') THEN
        -- 기존 정책 삭제 후 재생성
        DROP POLICY IF EXISTS "Authenticated users can view sensors" ON sensors;
        DROP POLICY IF EXISTS "Admins and leaders can manage sensors" ON sensors;
        
        -- 모든 인증된 사용자가 센서 조회 가능
        CREATE POLICY "Authenticated users can view sensors" ON sensors
            FOR SELECT USING (auth.role() = 'authenticated');

        -- 시스템 관리자와 농장장만 센서 생성/수정/삭제 가능
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
END $$;

-- =============================================
-- 센서 데이터 정책
-- =============================================

-- sensor_readings 테이블이 존재하는 경우에만 정책 생성
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensor_readings') THEN
        -- 기존 정책 삭제 후 재생성
        DROP POLICY IF EXISTS "Authenticated users can view sensor readings" ON sensor_readings;
        DROP POLICY IF EXISTS "Service role can insert sensor readings" ON sensor_readings;
        
        -- 모든 인증된 사용자가 센서 데이터 조회 가능
        CREATE POLICY "Authenticated users can view sensor readings" ON sensor_readings
            FOR SELECT USING (auth.role() = 'authenticated');

        -- 서비스 역할만 센서 데이터 삽입 가능
        CREATE POLICY "Service role can insert sensor readings" ON sensor_readings
            FOR INSERT WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- =============================================
-- 정책 확인
-- =============================================

-- 생성된 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('farms', 'devices', 'sensors', 'sensor_readings')
ORDER BY tablename, policyname;
