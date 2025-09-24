-- 실제 사용자 계정 추가
-- Supabase Auth에서 사용자를 생성한 후, 생성된 사용자 ID를 확인하여 아래 쿼리를 실행하세요

-- 사용자 ID 확인 방법:
-- 1. Supabase 대시보드 > Authentication > Users에서 각 사용자의 ID 복사
-- 2. 아래 쿼리에서 '실제-사용자-ID' 부분을 실제 ID로 교체

-- 예시 (실제 사용자 ID로 교체 필요):
-- INSERT INTO users (id, email, name, is_approved, created_at)
-- VALUES 
--   ('실제-sky3rain7-사용자-ID', 'sky3rain7@gmail.com', '운영자', true, now()),
--   ('실제-admin-사용자-ID', 'admin@smartfarm.com', '시스템 관리자', true, now()),
--   ('실제-operator-사용자-ID', 'operator@smartfarm.com', '운영자', true, now()),
--   ('실제-user-사용자-ID', 'user@smartfarm.com', '일반 사용자', true, now());

-- INSERT INTO memberships (tenant_id, user_id, role)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000001', '실제-sky3rain7-사용자-ID', 'operator'),
--   ('00000000-0000-0000-0000-000000000001', '실제-admin-사용자-ID', 'admin'),
--   ('00000000-0000-0000-0000-000000000001', '실제-operator-사용자-ID', 'operator'),
--   ('00000000-0000-0000-0000-000000000001', '실제-user-사용자-ID', 'viewer');

-- 또는 SQL Editor에서 직접 실행:
-- 1. Supabase 대시보드 > SQL Editor로 이동
-- 2. 위 쿼리를 실제 사용자 ID로 수정하여 실행
