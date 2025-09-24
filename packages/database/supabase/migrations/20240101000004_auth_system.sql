-- 사용자 인증 시스템 추가
-- users 테이블에 승인 관련 컬럼 추가
alter table users add column if not exists is_approved boolean default false;
alter table users add column if not exists company text;
alter table users add column if not exists phone text;
alter table users add column if not exists approved_at timestamptz;
alter table users add column if not exists approved_by uuid references users(id);

-- 사용자 승인 로그 테이블
create table if not exists user_approvals(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  approved_by uuid not null references users(id),
  action text not null check(action in('approve','reject')),
  role text check(role in('admin','operator','viewer')),
  tenant_id uuid references tenants(id),
  reason text,
  created_at timestamptz default now()
);

-- 기본 관리자 계정 생성 (개발용)
-- 실제 운영에서는 별도의 시드 스크립트로 관리
insert into users (id, email, name, is_approved, created_at)
values (
  '00000000-0000-0000-0000-000000000000',
  'admin@smartfarm.com',
  '시스템 관리자',
  true,
  now()
) on conflict (id) do nothing;

-- 기본 테넌트 생성
insert into tenants (id, name, created_at)
values (
  '00000000-0000-0000-0000-000000000001',
  '스마트팜 시스템',
  now()
) on conflict (id) do nothing;

-- 기본 관리자 멤버십 생성
insert into memberships (tenant_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin'
) on conflict (tenant_id, user_id) do nothing;

-- 인덱스 추가
create index if not exists idx_users_approved on users(is_approved);
create index if not exists idx_user_approvals_user on user_approvals(user_id);
create index if not exists idx_user_approvals_created on user_approvals(created_at desc);
