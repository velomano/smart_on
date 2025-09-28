-- users 테이블에 is_active 컬럼 추가
alter table users add column if not exists is_active boolean default true;

-- 인덱스 추가
create index if not exists idx_users_active on users(is_active);

-- 기존 사용자들의 is_active를 true로 설정
update users set is_active = true where is_active is null;

