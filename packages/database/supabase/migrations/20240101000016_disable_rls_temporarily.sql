-- RLS 임시 비활성화 (500 에러 해결용)
-- Supabase SQL Editor에서 실행

-- 1. 모든 테이블의 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE farms DISABLE ROW LEVEL SECURITY;
ALTER TABLE farm_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE sensors DISABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings DISABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 모두 삭제
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_update ON users;
DROP POLICY IF EXISTS farms_select ON farms;
DROP POLICY IF EXISTS farm_memberships_select ON farm_memberships;
DROP POLICY IF EXISTS farm_memberships_insert ON farm_memberships;
DROP POLICY IF EXISTS farm_memberships_update ON farm_memberships;
DROP POLICY IF EXISTS farm_memberships_delete ON farm_memberships;
DROP POLICY IF EXISTS memberships_select ON memberships;
DROP POLICY IF EXISTS memberships_insert ON memberships;
DROP POLICY IF EXISTS memberships_update ON memberships;
DROP POLICY IF EXISTS memberships_delete ON memberships;

-- 3. 진단 쿼리
DO $$
DECLARE
  user_count INTEGER;
  farm_count INTEGER;
  membership_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO farm_count FROM farms;
  SELECT COUNT(*) INTO membership_count FROM memberships;
  
  RAISE NOTICE '✅ RLS 비활성화 완료';
  RAISE NOTICE '사용자 수: %', user_count;
  RAISE NOTICE '농장 수: %', farm_count;
  RAISE NOTICE '멤버십 수: %', membership_count;
  
END$$;
