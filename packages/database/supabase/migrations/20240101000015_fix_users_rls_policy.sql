-- users 테이블 RLS 정책 수정 (500 에러 해결)
-- Supabase SQL Editor에서 실행

-- 1. 기존 users RLS 정책 삭제
DROP POLICY IF EXISTS users_select ON users;

-- 2. 새로운 users RLS 정책 생성 (자신의 데이터 + 같은 테넌트)
CREATE POLICY users_select ON users
FOR SELECT USING (
  -- 자신의 데이터이거나
  id = auth.uid() OR
  -- 같은 테넌트의 데이터 (memberships 기반)
  EXISTS(
    SELECT 1 FROM memberships m1
    JOIN memberships m2 ON m1.tenant_id = m2.tenant_id
    WHERE m1.user_id = auth.uid()
      AND m2.user_id = users.id
  )
);

-- 3. users 테이블 업데이트 정책도 추가
DROP POLICY IF EXISTS users_update ON users;
CREATE POLICY users_update ON users
FOR UPDATE USING (
  -- 자신의 데이터이거나
  id = auth.uid() OR
  -- 같은 테넌트의 owner/operator
  EXISTS(
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = users.tenant_id
      AND m.role IN ('owner', 'operator')
  )
);

-- 4. 진단 쿼리
DO $$
DECLARE
  current_user_id UUID;
  user_count INTEGER;
  membership_count INTEGER;
BEGIN
  -- 현재 사용자 ID 확인
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '⚠️  현재 로그인된 사용자가 없습니다.';
    RETURN;
  END IF;
  
  -- 사용자 수 확인
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO membership_count FROM memberships WHERE user_id = current_user_id;
  
  RAISE NOTICE '현재 사용자 ID: %', current_user_id;
  RAISE NOTICE '전체 사용자 수: %', user_count;
  RAISE NOTICE '내 memberships 수: %', membership_count;
  
  -- 현재 사용자의 데이터 확인
  IF EXISTS(SELECT 1 FROM users WHERE id = current_user_id) THEN
    RAISE NOTICE '✅ 현재 사용자 데이터가 users 테이블에 있습니다.';
  ELSE
    RAISE NOTICE '❌ 현재 사용자 데이터가 users 테이블에 없습니다.';
  END IF;
  
END$$;
