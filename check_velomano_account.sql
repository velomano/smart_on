-- velomano@naver.com 계정의 현재 상태 확인
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. velomano@naver.com 계정의 users 테이블 정보 확인
SELECT 'velomano@naver.com 계정 정보:' as info;
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
WHERE email = 'velomano@naver.com';

-- 2. velomano@naver.com 계정의 farm_memberships 정보 확인
SELECT 'velomano@naver.com farm_memberships 정보:' as info;
SELECT 
  fm.id,
  fm.role as farm_role,
  u.email,
  f.name as farm_name,
  fm.created_at
FROM farm_memberships fm
JOIN users u ON fm.user_id = u.id
JOIN farms f ON fm.farm_id = f.id
WHERE u.email = 'velomano@naver.com';

-- 3. velomano@naver.com 계정의 memberships 정보 확인
SELECT 'velomano@naver.com memberships 정보:' as info;
SELECT 
  m.id,
  m.role as membership_role,
  u.email,
  m.team_id,
  m.created_at
FROM memberships m
JOIN users u ON m.user_id = u.id
WHERE u.email = 'velomano@naver.com';

-- 4. velomano@naver.com 계정을 system_admin으로 업데이트 (필요시)
-- UPDATE users 
-- SET role = 'system_admin'
-- WHERE email = 'velomano@naver.com';

-- 5. 업데이트 후 결과 확인
-- SELECT '업데이트 후 velomano@naver.com 계정 정보:' as info;
-- SELECT id, email, name, role, is_approved, is_active FROM users WHERE email = 'velomano@naver.com';
