-- 테스트 사용자들을 농장에 배정
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 현재 상태 확인
SELECT '현재 farm_memberships 데이터:' as info;
SELECT * FROM farm_memberships ORDER BY created_at;

-- 2. 테스트 사용자들을 농장에 배정
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
    ELSE 'operator'
  END as role
FROM users u
CROSS JOIN farms f
WHERE u.email LIKE 'test%@test.com'
  AND (
    (u.email IN ('test1@test.com', 'test2@test.com') AND f.name = '1조') OR
    (u.email IN ('test3@test.com', 'test4@test.com') AND f.name = '2조') OR
    (u.email IN ('test5@test.com', 'test6@test.com') AND f.name = '3조')
  )
ON CONFLICT (tenant_id, farm_id, user_id) DO NOTHING;

-- 3. 결과 확인
SELECT '배정 완료!' as info;
SELECT 
  u.email,
  f.name as farm_name,
  fm.role,
  fm.created_at
FROM farm_memberships fm
JOIN users u ON fm.user_id = u.id
JOIN farms f ON fm.farm_id = f.id
WHERE u.email LIKE 'test%@test.com'
ORDER BY f.name, fm.role DESC, u.email;
