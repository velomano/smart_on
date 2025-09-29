-- sky3rain7@gmail.com 계정의 현재 상태 확인
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. sky3rain7@gmail.com 계정의 users 테이블 정보 확인
SELECT 'sky3rain7@gmail.com 계정 정보:' as info;
SELECT 
  id,
  email,
  name,
  role,
  is_approved,
  is_active,
  team_id,
  team_name,
  created_at
FROM users 
WHERE email = 'sky3rain7@gmail.com';

-- 2. sky3rain7@gmail.com 계정의 farm_memberships 정보 확인
SELECT 'sky3rain7@gmail.com farm_memberships 정보:' as info;
SELECT 
  fm.id,
  fm.role as farm_role,
  u.email,
  f.name as farm_name,
  fm.created_at
FROM farm_memberships fm
JOIN users u ON fm.user_id = u.id
JOIN farms f ON fm.farm_id = f.id
WHERE u.email = 'sky3rain7@gmail.com';

-- 3. sky3rain7@gmail.com 계정의 memberships 정보 확인
SELECT 'sky3rain7@gmail.com memberships 정보:' as info;
SELECT 
  m.id,
  m.role as membership_role,
  u.email,
  m.team_id,
  m.created_at
FROM memberships m
JOIN users u ON m.user_id = u.id
WHERE u.email = 'sky3rain7@gmail.com';

-- 4. sky3rain7@gmail.com을 system_admin으로 업데이트 (필요시)
-- UPDATE users 
-- SET role = 'system_admin'
-- WHERE email = 'sky3rain7@gmail.com';

-- 5. sky3rain7@gmail.com을 farm_memberships에서 제거 (시스템 관리자는 모든 농장 접근 가능)
-- DELETE FROM farm_memberships 
-- WHERE user_id = (SELECT id FROM users WHERE email = 'sky3rain7@gmail.com');

-- 6. 업데이트 후 결과 확인
-- SELECT '업데이트 후 sky3rain7@gmail.com 계정 정보:' as info;
-- SELECT id, email, name, role, is_approved, is_active FROM users WHERE email = 'sky3rain7@gmail.com';
