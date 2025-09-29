-- =============================================
-- RLS (Row Level Security) 정책 (2025.01.01 기준)
-- =============================================

-- =============================================
-- 1. 기본 RLS 활성화
-- =============================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_ions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_recipe_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_collection_requests ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. 사용자 관리 관련 정책
-- =============================================

-- 사용자는 자신의 정보만 조회/수정 가능
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 사용자 설정은 본인만 접근 가능
CREATE POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 3. 멤버십 및 권한 관련 정책
-- =============================================

-- 멤버십은 본인 것만 조회 가능
CREATE POLICY "Users can view their own memberships" ON memberships
    FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모든 멤버십 조회 가능
CREATE POLICY "Admins can view all memberships" ON memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.role IN ('super_admin', 'system_admin')
        )
    );

-- 관리자만 멤버십 생성/수정/삭제 가능
CREATE POLICY "Admins can manage memberships" ON memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.role IN ('super_admin', 'system_admin')
        )
    );

-- =============================================
-- 4. 농장 및 베드 관련 정책
-- =============================================

-- 농장은 소속 테넌트 사용자만 조회 가능
CREATE POLICY "Users can view farms in their tenant" ON farms
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

-- 농장 관리자는 농장 생성/수정/삭제 가능
CREATE POLICY "Farm managers can manage farms" ON farms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = farms.tenant_id
            AND m.role IN ('super_admin', 'system_admin', 'team_leader')
        )
    );

-- 베드는 소속 농장 사용자만 조회 가능
CREATE POLICY "Users can view beds in their farms" ON beds
    FOR SELECT USING (
        farm_id IN (
            SELECT f.id FROM farms f
            JOIN memberships m ON f.tenant_id = m.tenant_id
            WHERE m.user_id = auth.uid()
        )
    );

-- 베드 관리자는 베드 생성/수정/삭제 가능
CREATE POLICY "Bed managers can manage beds" ON beds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM farms f
            JOIN memberships m ON f.tenant_id = m.tenant_id
            WHERE f.id = beds.farm_id
            AND m.user_id = auth.uid()
            AND m.role IN ('super_admin', 'system_admin', 'team_leader')
        )
    );

-- =============================================
-- 5. 디바이스 및 센서 관련 정책
-- =============================================

-- 디바이스는 소속 농장 사용자만 조회 가능
CREATE POLICY "Users can view devices in their farms" ON devices
    FOR SELECT USING (
        farm_id IN (
            SELECT f.id FROM farms f
            JOIN memberships m ON f.tenant_id = m.tenant_id
            WHERE m.user_id = auth.uid()
        )
    );

-- 디바이스 관리자는 디바이스 생성/수정/삭제 가능
CREATE POLICY "Device managers can manage devices" ON devices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM farms f
            JOIN memberships m ON f.tenant_id = m.tenant_id
            WHERE f.id = devices.farm_id
            AND m.user_id = auth.uid()
            AND m.role IN ('super_admin', 'system_admin', 'team_leader')
        )
    );

-- 센서는 소속 디바이스 사용자만 조회 가능
CREATE POLICY "Users can view sensors in their devices" ON sensors
    FOR SELECT USING (
        device_id IN (
            SELECT d.id FROM devices d
            JOIN farms f ON d.farm_id = f.id
            JOIN memberships m ON f.tenant_id = m.tenant_id
            WHERE m.user_id = auth.uid()
        )
    );

-- 센서 데이터는 소속 센서 사용자만 조회 가능
CREATE POLICY "Users can view sensor readings in their sensors" ON sensor_readings
    FOR SELECT USING (
        sensor_id IN (
            SELECT s.id FROM sensors s
            JOIN devices d ON s.device_id = d.id
            JOIN farms f ON d.farm_id = f.id
            JOIN memberships m ON f.tenant_id = m.tenant_id
            WHERE m.user_id = auth.uid()
        )
    );

-- 센서 데이터는 Edge Function만 삽입 가능 (Service Role)
CREATE POLICY "Service role can insert sensor readings" ON sensor_readings
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- 6. 제어 및 자동화 관련 정책
-- =============================================

-- 제어 명령은 소속 농장 사용자만 조회 가능
CREATE POLICY "Users can view commands in their farms" ON commands
    FOR SELECT USING (
        device_id IN (
            SELECT d.id FROM devices d
            JOIN farms f ON d.farm_id = f.id
            JOIN memberships m ON f.tenant_id = m.tenant_id
            WHERE m.user_id = auth.uid()
        )
    );

-- 제어 명령은 권한 있는 사용자만 생성 가능
CREATE POLICY "Authorized users can create commands" ON commands
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM devices d
            JOIN farms f ON d.farm_id = f.id
            JOIN memberships m ON f.tenant_id = m.tenant_id
            WHERE d.id = commands.device_id
            AND m.user_id = auth.uid()
            AND m.role IN ('super_admin', 'system_admin', 'team_leader', 'team_member')
        )
    );

-- 자동화 규칙은 소속 농장 사용자만 조회 가능
CREATE POLICY "Users can view rules in their farms" ON rules
    FOR SELECT USING (
        farm_id IN (
            SELECT f.id FROM farms f
            JOIN memberships m ON f.tenant_id = m.tenant_id
            WHERE m.user_id = auth.uid()
        )
    );

-- 자동화 규칙은 관리자만 생성/수정/삭제 가능
CREATE POLICY "Admins can manage rules" ON rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM farms f
            JOIN memberships m ON f.tenant_id = m.tenant_id
            WHERE f.id = rules.farm_id
            AND m.user_id = auth.uid()
            AND m.role IN ('super_admin', 'system_admin', 'team_leader')
        )
    );

-- =============================================
-- 7. 알림 및 감사 관련 정책
-- =============================================

-- 알림은 소속 농장 사용자만 조회 가능
CREATE POLICY "Users can view alerts in their farms" ON alerts
    FOR SELECT USING (
        farm_id IN (
            SELECT f.id FROM farms f
            JOIN memberships m ON f.tenant_id = m.tenant_id
            WHERE m.user_id = auth.uid()
        )
    );

-- 알림은 시스템만 생성 가능 (Edge Function)
CREATE POLICY "System can create alerts" ON alerts
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 감사 로그는 관리자만 조회 가능
CREATE POLICY "Admins can view audit logs" ON audits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.role IN ('super_admin', 'system_admin')
        )
    );

-- 감사 로그는 시스템만 생성 가능
CREATE POLICY "System can create audit logs" ON audits
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- 8. 영양액 관련 정책 (기존)
-- =============================================

-- 영양 이온은 모든 인증된 사용자가 조회 가능
CREATE POLICY "Authenticated users can view nutrient ions" ON nutrient_ions
    FOR SELECT TO authenticated USING (true);

-- 염류는 모든 인증된 사용자가 조회 가능
CREATE POLICY "Authenticated users can view salts" ON salts
    FOR SELECT TO authenticated USING (true);

-- 작물 프로필은 모든 인증된 사용자가 조회 가능
CREATE POLICY "Authenticated users can view crop profiles" ON crop_profiles
    FOR SELECT TO authenticated USING (true);

-- 물 프로필은 소속 테넌트 사용자만 조회 가능
CREATE POLICY "Users can view water profiles in their tenant" ON water_profiles
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

-- 레시피는 소속 테넌트 사용자만 조회 가능
CREATE POLICY "Users can view recipes in their tenant" ON recipes
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

-- 레시피는 권한 있는 사용자만 생성/수정 가능
CREATE POLICY "Authorized users can manage recipes" ON recipes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = recipes.tenant_id
            AND m.role IN ('super_admin', 'system_admin', 'team_leader', 'team_member')
        )
    );

-- =============================================
-- 9. 영양액 자동 수집 시스템 정책 (신규)
-- =============================================

-- 영양액 데이터 소스는 모든 인증된 사용자가 조회 가능
CREATE POLICY "Authenticated users can view nutrient sources" ON nutrient_sources
    FOR SELECT TO authenticated USING (true);

-- 영양액 레시피는 모든 인증된 사용자가 조회 가능 (공개 데이터)
CREATE POLICY "Authenticated users can view nutrient recipes" ON nutrient_recipes
    FOR SELECT TO authenticated USING (true);

-- 영양액 레시피는 Edge Function만 삽입/수정 가능 (Service Role)
CREATE POLICY "Service role can manage nutrient recipes" ON nutrient_recipes
    FOR ALL USING (auth.role() = 'service_role');

-- 영양액 레시피 별칭은 모든 인증된 사용자가 조회 가능
CREATE POLICY "Authenticated users can view recipe aliases" ON nutrient_recipe_aliases
    FOR SELECT TO authenticated USING (true);

-- 영양액 수집 작업은 작성자와 운영자만 조회 가능
CREATE POLICY "Users can view their own nutrient jobs" ON nutrient_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.role IN ('super_admin', 'system_admin', 'team_leader')
        )
    );

-- 영양액 수집 작업은 Service Role만 삽입 가능
CREATE POLICY "Service role can insert nutrient jobs" ON nutrient_jobs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 데이터 수집 요청은 모든 인증된 사용자가 생성 가능
CREATE POLICY "Authenticated users can create data collection requests" ON data_collection_requests
    FOR INSERT TO authenticated WITH CHECK (true);

-- 데이터 수집 요청은 관리자만 모든 요청 조회 가능
CREATE POLICY "Admins can view all data collection requests" ON data_collection_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.role IN ('super_admin', 'system_admin')
        )
    );

-- 사용자는 자신이 생성한 요청만 조회 가능
CREATE POLICY "Users can view their own data collection requests" ON data_collection_requests
    FOR SELECT USING (user_id = auth.uid());

-- 관리자만 요청 상태 업데이트 가능
CREATE POLICY "Admins can update data collection requests" ON data_collection_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.role IN ('super_admin', 'system_admin')
        )
    );

-- =============================================
-- 10. 안전한 뷰 접근 정책
-- =============================================

-- 최신 영양액 레시피 뷰는 모든 인증된 사용자가 조회 가능
-- (뷰 자체는 RLS가 적용되지 않으므로 별도 정책 불필요)

-- =============================================
-- 11. 정책 정리 및 최적화
-- =============================================

-- 중복 정책 제거를 위한 정책 삭제 (필요시)
-- DROP POLICY IF EXISTS "old_policy_name" ON table_name;

-- 정책 재생성을 위한 명령어 (개발 시 사용)
-- DROP POLICY IF EXISTS "policy_name" ON table_name;
-- CREATE POLICY "policy_name" ON table_name ...;