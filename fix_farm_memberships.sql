-- farm_memberships 테이블 상태 확인 및 누락된 사용자 추가
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 현재 farm_memberships 상태 확인
SELECT '현재 farm_memberships 데이터:' as info;
SELECT 
  fm.id,
  fm.role,
  u.email,
  f.name as farm_name,
  fm.created_at
FROM farm_memberships fm
JOIN users u ON fm.user_id = u.id
JOIN farms f ON fm.farm_id = f.id
WHERE u.email LIKE 'test%@test.com'
ORDER BY f.name, fm.role DESC, u.email;

-- 2. 누락된 사용자 확인
SELECT 'farm_memberships에 없는 테스트 사용자들:' as info;
SELECT u.id, u.email, u.role
FROM users u
WHERE u.email LIKE 'test%@test.com'
  AND u.id NOT IN (
    SELECT user_id FROM farm_memberships WHERE user_id = u.id
  )
ORDER BY u.email;

-- 3. 누락된 사용자들을 farm_memberships에 추가
INSERT INTO farm_memberships (tenant_id, farm_id, user_id, role)
SELECT 
  '00000000-0000-0000-0000-000000000001'::UUID as tenant_id,
  f.id as farm_id,
  u.id as user_id,
  CASE 
    WHEN u.email = 'test1@test.com' THEN 'owner'
    WHEN u.email = 'test2@test.com' THEN 'operator'
    WHEN u.email = 'test3@test.com' THEN 'owner'
    WHEN u.email = 'test4@test.com' THEN 'operator'
    WHEN u.email = 'test5@test.com' THEN 'owner'
    WHEN u.email = 'test6@test.com' THEN 'operator'
    WHEN u.email = 'test7@test.com' THEN 'operator'
    ELSE 'operator'
  END as role
FROM users u
CROSS JOIN farms f
WHERE u.email LIKE 'test%@test.com'
  AND u.id NOT IN (SELECT user_id FROM farm_memberships WHERE user_id = u.id)
  AND (
    (u.email IN ('test1@test.com', 'test2@test.com') AND f.name = '1조') OR
    (u.email IN ('test3@test.com', 'test4@test.com') AND f.name = '2조') OR
    (u.email IN ('test5@test.com', 'test6@test.com') AND f.name = '3조') OR
    (u.email = 'test7@test.com' AND f.name = '1조') -- test7을 1조에 추가
  )
ON CONFLICT (tenant_id, farm_id, user_id) DO NOTHING;

-- 4. 최종 결과 확인
SELECT '최종 farm_memberships 데이터:' as info;
SELECT 
  fm.id,
  fm.role,
  u.email,
  f.name as farm_name,
  fm.created_at
FROM farm_memberships fm
JOIN users u ON fm.user_id = u.id
JOIN farms f ON fm.farm_id = f.id
WHERE u.email LIKE 'test%@test.com'
ORDER BY f.name, fm.role DESC, u.email;
