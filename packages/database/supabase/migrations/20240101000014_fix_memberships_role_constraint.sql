-- memberships 테이블 role 체크 제약조건 수정
-- Supabase SQL Editor에서 실행

-- 1. 기존 체크 제약조건 삭제
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_role_check;

-- 2. 새로운 체크 제약조건 추가 (operator, owner 포함)
ALTER TABLE memberships ADD CONSTRAINT memberships_role_check 
CHECK (role IN ('owner', 'operator', 'viewer'));

-- 3. 이제 memberships 데이터 추가
DO $$
DECLARE
  current_user_id UUID;
  current_tenant_id UUID;
BEGIN
  -- 현재 사용자 ID 확인
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '⚠️  현재 로그인된 사용자가 없습니다.';
    RETURN;
  END IF;
  
  -- 기본 테넌트 ID
  current_tenant_id := '00000000-0000-0000-0000-000000000001'::UUID;
  
  -- 현재 사용자 정보 확인
  RAISE NOTICE '현재 사용자 ID: %', current_user_id;
  RAISE NOTICE '테넌트 ID: %', current_tenant_id;
  
  -- memberships에 현재 사용자 추가 (owner 권한)
  INSERT INTO memberships(tenant_id, user_id, role)
  VALUES (current_tenant_id, current_user_id, 'owner')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role='owner';
  
  RAISE NOTICE '✅ 현재 사용자를 memberships에 owner로 추가했습니다.';
  
END$$;

-- 4. 모든 사용자를 memberships에 추가 (기본 테넌트)
INSERT INTO memberships(tenant_id, user_id, role)
SELECT 
  '00000000-0000-0000-0000-000000000001'::UUID as tenant_id,
  id as user_id,
  CASE 
    WHEN role = 'super_admin' THEN 'owner'
    WHEN role = 'system_admin' THEN 'owner'
    WHEN role = 'team_leader' THEN 'operator'
    WHEN role = 'team_member' THEN 'operator'
    ELSE 'operator'
  END as role
FROM users
WHERE id NOT IN (
  SELECT user_id FROM memberships 
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::UUID
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- 5. 결과 확인
SELECT 
  'memberships' as table_name,
  COUNT(*) as count
FROM memberships
UNION ALL
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
FROM users;
