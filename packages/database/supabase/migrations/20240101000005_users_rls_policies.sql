-- users 테이블 RLS 정책 추가
-- 기본 내용물 이름: users_rls_policies

-- users 테이블에 대한 RLS 정책 설정

-- 1. 사용자 등록을 위한 INSERT 정책 (누구나 새 사용자 등록 가능)
create policy "사용자 등록 허용" on users
  for insert
  with check (true);

-- 2. 사용자 조회를 위한 SELECT 정책 (인증된 사용자만)
create policy "인증된 사용자 조회 허용" on users
  for select
  using (auth.uid() is not null);

-- 3. 사용자 정보 업데이트를 위한 UPDATE 정책 (본인 데이터만)
create policy "본인 데이터 업데이트 허용" on users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. 관리자가 사용자 승인을 위한 UPDATE 정책
create policy "관리자 사용자 승인 허용" on users
  for update
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid() 
      and u.role = 'system_admin'
    )
  );

-- 5. 개발/테스트용 임시 정책 (서비스 키로 액세스할 때 허용)
create policy "서비스 키 접근 허용" on users
  for all
  using (current_setting('role') = 'service_role');

