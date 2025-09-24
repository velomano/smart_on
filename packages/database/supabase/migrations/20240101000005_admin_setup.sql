-- 기본 관리자 계정 설정
-- 실제 운영에서는 별도의 시드 스크립트로 관리

-- 기본 관리자 사용자 생성 (이미 존재하면 무시)
insert into users (id, email, name, is_approved, created_at)
values (
  '00000000-0000-0000-0000-000000000000',
  'admin@smartfarm.com',
  '시스템 관리자',
  true,
  now()
) on conflict (id) do nothing;

-- 기본 테넌트 생성 (이미 존재하면 무시)
insert into tenants (id, name, created_at)
values (
  '00000000-0000-0000-0000-000000000001',
  '스마트팜 시스템',
  now()
) on conflict (id) do nothing;

-- 기본 관리자 멤버십 생성 (이미 존재하면 무시)
insert into memberships (tenant_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin'
) on conflict (tenant_id, user_id) do nothing;

-- 테스트용 일반 사용자 계정 생성
insert into users (id, email, name, is_approved, created_at)
values (
  '00000000-0000-0000-0000-000000000002',
  'user@smartfarm.com',
  '일반 사용자',
  true,
  now()
) on conflict (id) do nothing;

-- 테스트용 일반 사용자 멤버십 생성
insert into memberships (tenant_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'viewer'
) on conflict (tenant_id, user_id) do nothing;

-- 운영자 계정 생성
insert into users (id, email, name, is_approved, created_at)
values (
  '00000000-0000-0000-0000-000000000003',
  'operator@smartfarm.com',
  '운영자',
  true,
  now()
) on conflict (id) do nothing;

-- 운영자 멤버십 생성
insert into memberships (tenant_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'operator'
) on conflict (tenant_id, user_id) do nothing;
