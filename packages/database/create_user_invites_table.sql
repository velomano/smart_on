-- 사용자 초대 테이블 생성
CREATE TABLE IF NOT EXISTS user_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'team_member',
  message TEXT,
  invited_by UUID NOT NULL REFERENCES users(id),
  invited_by_name VARCHAR(255) NOT NULL,
  invite_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites(email);
CREATE INDEX IF NOT EXISTS idx_user_invites_token ON user_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_user_invites_status ON user_invites(status);
CREATE INDEX IF NOT EXISTS idx_user_invites_expires_at ON user_invites(expires_at);

-- RLS 정책 설정
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- 초대한 사용자와 시스템 관리자는 조회 가능
CREATE POLICY "Users can view invites they created" ON user_invites
  FOR SELECT USING (invited_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('system_admin', 'super_admin')
    ));

-- 시스템 관리자는 모든 초대 관리 가능
CREATE POLICY "System admins can manage all invites" ON user_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('system_admin', 'super_admin')
    )
  );

-- 초대 토큰으로 조회 (초대 수락 시 사용)
CREATE POLICY "Anyone can view invite by token" ON user_invites
  FOR SELECT USING (true);

-- 만료된 초대 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_expired_invites()
RETURNS void AS $$
BEGIN
  UPDATE user_invites 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 매일 만료된 초대 업데이트 (크론 작업용)
-- SELECT cron.schedule('update-expired-invites', '0 0 * * *', 'SELECT update_expired_invites();');

-- 초대 통계 뷰
CREATE OR REPLACE VIEW v_invite_stats AS
SELECT 
  COUNT(*) as total_invites,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_invites,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_invites,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_invites,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_invites,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as invites_last_7_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as invites_last_30_days
FROM user_invites;

-- 초대 상세 정보 뷰
CREATE OR REPLACE VIEW v_invite_details AS
SELECT 
  ui.*,
  u.name as inviter_name,
  u.email as inviter_email,
  u.role as inviter_role,
  CASE 
    WHEN ui.expires_at < NOW() AND ui.status = 'pending' THEN 'expired'
    ELSE ui.status
  END as actual_status
FROM user_invites ui
LEFT JOIN users u ON ui.invited_by = u.id;

-- 코멘트 추가
COMMENT ON TABLE user_invites IS '사용자 초대 관리 테이블';
COMMENT ON COLUMN user_invites.email IS '초대받은 사용자의 이메일';
COMMENT ON COLUMN user_invites.role IS '초대받은 사용자의 역할';
COMMENT ON COLUMN user_invites.message IS '초대 메시지';
COMMENT ON COLUMN user_invites.invited_by IS '초대한 사용자 ID';
COMMENT ON COLUMN user_invites.invited_by_name IS '초대한 사용자 이름';
COMMENT ON COLUMN user_invites.invite_token IS '초대 토큰 (고유)';
COMMENT ON COLUMN user_invites.expires_at IS '초대 만료 시간';
COMMENT ON COLUMN user_invites.status IS '초대 상태 (pending, accepted, expired, cancelled)';
COMMENT ON COLUMN user_invites.accepted_at IS '초대 수락 시간';
