-- 테넌트-소속-농장(팀)-팀원 구조로 마이그레이션
-- 4단계 권한 체계: super_admin, system_admin, team_leader, team_member
-- 실행일: 2025.09.28

BEGIN;

-- =============================================
-- 1단계: 기존 teams 데이터를 farms로 이관
-- =============================================

-- teams 테이블이 존재하고 데이터가 있는 경우에만 실행
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
        -- teams 데이터를 farms로 이관
        INSERT INTO farms (id, tenant_id, name, farm_code, is_active, created_at, updated_at)
        SELECT 
            id,
            tenant_id,
            name,
            team_code,
            is_active,
            created_at,
            updated_at
        FROM teams
        WHERE name LIKE '%농장%' OR team_code LIKE 'FARM%'
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'teams 데이터를 farms로 이관 완료';
    ELSE
        RAISE NOTICE 'teams 테이블이 존재하지 않음, 건너뜀';
    END IF;
END$$;

-- =============================================
-- 2단계: users 테이블 정리
-- =============================================

-- users.role을 4단계 권한 체계로 정리
UPDATE users 
SET role = CASE 
    WHEN role IN ('super_admin', 'system_admin', 'team_leader', 'team_member') THEN role
    ELSE 'team_member'  -- 기본값을 team_member로 설정
END,
updated_at = NOW();

-- team_id, team_name 컬럼은 유지 (현재 구조에 필요)
-- ALTER TABLE users DROP COLUMN IF EXISTS team_id CASCADE;
-- ALTER TABLE users DROP COLUMN IF EXISTS team_name CASCADE;

-- =============================================
-- 3단계: farm_memberships 테이블 생성 (이미 존재하는 경우 건너뜀)
-- =============================================

CREATE TABLE IF NOT EXISTS farm_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN('owner','operator','viewer')) DEFAULT 'operator',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, farm_id, user_id)
);

-- =============================================
-- 4단계: 기존 memberships 데이터를 farm_memberships로 이관
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
        -- memberships 데이터를 farm_memberships로 이관
        INSERT INTO farm_memberships (tenant_id, farm_id, user_id, role, assigned_at, created_at, updated_at)
        SELECT 
            u.tenant_id,
            m.team_id as farm_id,  -- team_id를 farm_id로 사용
            m.user_id,
            CASE 
                WHEN m.role = 'leader' THEN 'owner'
                WHEN m.role = 'member' THEN 'operator'
                ELSE 'operator'
            END as role,
            NOW() as assigned_at,
            NOW() as created_at,
            NOW() as updated_at
        FROM memberships m
        JOIN users u ON m.user_id = u.id
        WHERE m.team_id IN (SELECT id FROM farms)
        ON CONFLICT (tenant_id, farm_id, user_id) DO NOTHING;
        
        RAISE NOTICE 'memberships 데이터를 farm_memberships로 이관 완료';
    ELSE
        RAISE NOTICE 'memberships 테이블이 존재하지 않음, 건너뜀';
    END IF;
END$$;

-- =============================================
-- 5단계: 테스트 계정 권한 재배정
-- =============================================

-- 현재 실제 권한 설정에 맞게 업데이트
-- 1농장: test1@test.com (농장장), test2@test.com (팀원)
UPDATE users 
SET role = 'team_leader',
    team_id = (SELECT id FROM teams WHERE name = '1농장' OR team_code = 'FARM001' LIMIT 1),
    team_name = '1농장',
    updated_at = NOW()
WHERE email = 'test1@test.com';

UPDATE users 
SET role = 'team_member',
    team_id = (SELECT id FROM teams WHERE name = '1농장' OR team_code = 'FARM001' LIMIT 1),
    team_name = '1농장',
    updated_at = NOW()
WHERE email = 'test2@test.com';

-- 2농장: test3@test.com (농장장), test4@test.com (팀원)
UPDATE users 
SET role = 'team_leader',
    team_id = (SELECT id FROM teams WHERE name = '2농장' OR team_code = 'FARM002' LIMIT 1),
    team_name = '2농장',
    updated_at = NOW()
WHERE email = 'test3@test.com';

UPDATE users 
SET role = 'team_member',
    team_id = (SELECT id FROM teams WHERE name = '2농장' OR team_code = 'FARM002' LIMIT 1),
    team_name = '2농장',
    updated_at = NOW()
WHERE email = 'test4@test.com';

-- 3농장: test5@test.com (농장장), test6@test.com (팀원)
UPDATE users 
SET role = 'team_leader',
    team_id = (SELECT id FROM teams WHERE name = '3농장' OR team_code = 'FARM003' LIMIT 1),
    team_name = '3농장',
    updated_at = NOW()
WHERE email = 'test5@test.com';

UPDATE users 
SET role = 'team_member',
    team_id = (SELECT id FROM teams WHERE name = '3농장' OR team_code = 'FARM003' LIMIT 1),
    team_name = '3농장',
    updated_at = NOW()
WHERE email = 'test6@test.com';

-- memberships 테이블에 데이터가 없다면 새로 생성
INSERT INTO memberships (tenant_id, user_id, role, team_id)
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID as tenant_id,
    u.id as user_id,
    CASE 
        WHEN u.email IN ('test1@test.com', 'test3@test.com', 'test5@test.com') THEN 'owner'
        WHEN u.email IN ('test2@test.com', 'test4@test.com', 'test6@test.com') THEN 'operator'
        ELSE 'operator'
    END as role,
    u.team_id as team_id
FROM users u
WHERE u.email IN ('test1@test.com', 'test2@test.com', 'test3@test.com', 'test4@test.com', 'test5@test.com', 'test6@test.com')
ON CONFLICT (tenant_id, user_id, team_id) DO NOTHING;

-- =============================================
-- 6단계: 기존 테이블 정리 (주석 처리 - 안전을 위해)
-- =============================================

-- 현재 구조에서는 teams와 memberships 테이블을 유지
-- farm_memberships는 추가적인 농장 중심 기능을 위해 별도로 운영
-- DROP TABLE IF EXISTS farm_memberships CASCADE;  -- 필요시에만 제거

-- =============================================
-- 7단계: 인덱스 및 제약조건 추가
-- =============================================

-- memberships 테이블에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_team_id ON memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON memberships(tenant_id);

-- farm_memberships 테이블에 인덱스 추가 (존재하는 경우)
CREATE INDEX IF NOT EXISTS idx_farm_memberships_user_id ON farm_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_memberships_farm_id ON farm_memberships(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_memberships_tenant_id ON farm_memberships(tenant_id);

-- =============================================
-- 8단계: RLS 정책 업데이트
-- =============================================

-- memberships 테이블에 RLS 활성화
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- memberships 조회 정책
CREATE POLICY "memberships_select_policy" ON memberships
    FOR SELECT USING (
        tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    );

-- memberships 삽입 정책 (관리자만)
CREATE POLICY "memberships_insert_policy" ON memberships
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'system_admin')
        )
    );

-- memberships 업데이트 정책 (관리자만)
CREATE POLICY "memberships_update_policy" ON memberships
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'system_admin')
        )
    );

-- farm_memberships 테이블에 RLS 활성화 (존재하는 경우)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'farm_memberships') THEN
        ALTER TABLE farm_memberships ENABLE ROW LEVEL SECURITY;
        
        -- farm_memberships 정책들도 생성
        CREATE POLICY "farm_memberships_select_policy" ON farm_memberships
            FOR SELECT USING (
                tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
            );
    END IF;
END$$;

COMMIT;

-- 마이그레이션 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '테넌트-소속-농장(팀)-팀원 구조 마이그레이션 완료!';
    RAISE NOTICE '4단계 권한 체계: super_admin, system_admin, team_leader, team_member';
    RAISE NOTICE '1농장: test1@test.com(농장장), test2@test.com(팀원)';
    RAISE NOTICE '2농장: test3@test.com(농장장), test4@test.com(팀원)';
    RAISE NOTICE '3농장: test5@test.com(농장장), test6@test.com(팀원)';
    RAISE NOTICE '시스템관리자: velomano@naver.com (곧 test0@test.com 추가 예정)';
END$$;
