-- 테스트용 계정 생성 스크립트
-- 실제 운영에서는 이 스크립트를 사용하지 않음

-- Supabase Auth에 사용자 생성 (이 부분은 Supabase 대시보드에서 수동으로 해야 함)
-- 또는 Supabase Admin API를 사용하여 프로그래밍적으로 생성

-- 1. admin@smartfarm.com 계정 생성
-- 2. operator@smartfarm.com 계정 생성  
-- 3. user@smartfarm.com 계정 생성

-- 각 계정의 비밀번호는 123456으로 설정

-- 참고: Supabase Auth 사용자를 생성하려면:
-- 1. Supabase 대시보드 > Authentication > Users에서 수동 생성
-- 2. 또는 Admin API 사용: https://supabase.com/docs/reference/api/admin-api
-- 3. 또는 Supabase CLI 사용: supabase auth users create

-- 아래는 사용자 생성 후 실행할 수 있는 SQL (사용자 ID는 실제 생성된 ID로 교체 필요)

-- 예시 (실제 사용자 ID로 교체 필요):
-- INSERT INTO users (id, email, name, is_approved, created_at)
-- VALUES 
--   ('실제-admin-사용자-ID', 'admin@smartfarm.com', '시스템 관리자', true, now()),
--   ('실제-operator-사용자-ID', 'operator@smartfarm.com', '운영자', true, now()),
--   ('실제-user-사용자-ID', 'user@smartfarm.com', '일반 사용자', true, now());

-- INSERT INTO memberships (tenant_id, user_id, role)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000001', '실제-admin-사용자-ID', 'admin'),
--   ('00000000-0000-0000-0000-000000000001', '실제-operator-사용자-ID', 'operator'),
--   ('00000000-0000-0000-0000-000000000001', '실제-user-사용자-ID', 'viewer');
