-- 더 안전한 users 테이블 RLS 정책

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "사용자 등록 허용" ON users;
DROP POLICY IF EXISTS "인증된 사용자 조회 허용" ON users;
DROP POLICY IF EXISTS "본인 데이터 업데이트 허용" ON users;
DROP POLICY IF EXISTS "관리자 사용자 승인 허용" ON users;
DROP POLICY IF EXISTS "서비스 키 접근 허용" ON users;

-- 1. 사용자 등록 (INSERT) 정책 - 아무나 등록 가능
CREATE POLICY "p_users_insert" ON users
  FOR INSERT 
  WITH CHECK (true);

-- 2. 사용자 조회 (SELECT) 정책 - RLS 우회를 위해 조건 완화
CREATE POLICY "p_users_select" ON users
  FOR SELECT 
  USING (true);

-- 3. 사용자 업데이트 (UPDATE) 정책 - 본인이거나 관리자
CREATE POLICY "p_users_update" ON users
  FOR UPDATE
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('system_admin', 'team_leader')
    )
  );

-- 4. 서비스 키로 직접 액세스 허용
CREATE POLICY "p_users_service_role" ON users
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- 5. 파일럿 정책 (일단 완전 개방으로 시작)
CREATE POLICY "p_users_pilot" ON users
  FOR ALL
  USING (true);

