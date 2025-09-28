-- 최소 RLS 정책 (신속 진단용)
-- Supabase SQL Editor에서 실행

-- 1. farm_memberships 테이블 생성 (없으면)
CREATE TABLE IF NOT EXISTS farm_memberships(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN('owner','operator','viewer')) DEFAULT 'operator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, farm_id, user_id)
);

-- 2. RLS 활성화
ALTER TABLE farm_memberships ENABLE ROW LEVEL SECURITY;

-- 3. 최소 정책 설정
-- 같은 테넌트면 조회 가능
DROP POLICY IF EXISTS fm_select ON farm_memberships;
CREATE POLICY fm_select ON farm_memberships
FOR SELECT USING (
  EXISTS(SELECT 1 FROM memberships m
         WHERE m.tenant_id = farm_memberships.tenant_id
           AND m.user_id = auth.uid())
);

-- owner/operator는 insert/update 가능
DROP POLICY IF EXISTS fm_insert ON farm_memberships;
CREATE POLICY fm_insert ON farm_memberships
FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM memberships m
         WHERE m.tenant_id = farm_memberships.tenant_id
           AND m.user_id = auth.uid()
           AND m.role IN ('owner','operator'))
);

DROP POLICY IF EXISTS fm_update ON farm_memberships;
CREATE POLICY fm_update ON farm_memberships
FOR UPDATE USING (
  EXISTS(SELECT 1 FROM memberships m
         WHERE m.tenant_id = farm_memberships.tenant_id
           AND m.user_id = auth.uid()
           AND m.role IN ('owner','operator'))
);

-- 4. farms 테이블 RLS 설정
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS farms_select ON farms;
CREATE POLICY farms_select ON farms
FOR SELECT USING (
  EXISTS(SELECT 1 FROM memberships m
         WHERE m.tenant_id = farms.tenant_id
           AND m.user_id = auth.uid())
);

-- 5. users 테이블 RLS 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select ON users;
CREATE POLICY users_select ON users
FOR SELECT USING (
  EXISTS(SELECT 1 FROM memberships m
         WHERE m.tenant_id = users.tenant_id
           AND m.user_id = auth.uid())
);

-- 6. 관리자 계정 권한 확인 및 설정
DO $$
DECLARE
  current_user_id UUID;
  current_tenant_id UUID;
  membership_exists BOOLEAN;
BEGIN
  -- 현재 사용자 ID 확인
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '⚠️  현재 로그인된 사용자가 없습니다.';
    RETURN;
  END IF;
  
  -- 기본 테넌트 ID (실제 프로젝트에 맞게 수정)
  current_tenant_id := '00000000-0000-0000-0000-000000000001'::UUID;
  
  -- memberships에 있는지 확인
  SELECT EXISTS(
    SELECT 1 FROM memberships 
    WHERE user_id = current_user_id 
      AND tenant_id = current_tenant_id
  ) INTO membership_exists;
  
  IF NOT membership_exists THEN
    -- 관리자 계정을 오너로 등록
    INSERT INTO memberships(tenant_id, user_id, role)
    VALUES (current_tenant_id, current_user_id, 'owner')
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET role='owner';
    
    RAISE NOTICE '✅ 관리자 계정을 오너로 등록했습니다.';
  ELSE
    RAISE NOTICE '✅ 관리자 계정이 이미 memberships에 있습니다.';
  END IF;
  
  RAISE NOTICE '현재 사용자 ID: %', current_user_id;
  RAISE NOTICE '테넌트 ID: %', current_tenant_id;
  
END$$;

-- 7. 진단 쿼리
SELECT 
  'farm_memberships' as table_name,
  COUNT(*) as count
FROM farm_memberships
UNION ALL
SELECT 
  'farms' as table_name,
  COUNT(*) as count
FROM farms
UNION ALL
SELECT 
  'users' as table_name,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  'memberships' as table_name,
  COUNT(*) as count
FROM memberships;
