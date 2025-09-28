-- 농장 중심 사용자 배정 시스템으로 마이그레이션
-- teams 테이블 제거하고 farms + farm_memberships 조인 테이블로 전환

-- 1. 조인 테이블 신설: 사용자 ↔ 농장 배정
CREATE TABLE IF NOT EXISTS farm_memberships(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN('owner','operator','viewer')) DEFAULT 'operator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, farm_id, user_id)
);

-- 2. 과거 users.team_id/teams 사용 흔적 정리
DO $$
BEGIN
  -- users.team_id가 있으면 farm_memberships로 이관
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='team_id'
  ) THEN
    -- 기존 team_id를 farm_id로 사용하여 farm_memberships에 이관
    INSERT INTO farm_memberships(tenant_id, farm_id, user_id, role)
    SELECT 
      u.tenant_id, 
      u.team_id as farm_id, 
      u.id as user_id, 
      CASE 
        WHEN u.role = 'team_leader' THEN 'owner'
        WHEN u.role = 'team_member' THEN 'operator'
        ELSE 'operator'
      END as role
    FROM users u
    WHERE u.team_id IS NOT NULL
    ON CONFLICT (tenant_id, farm_id, user_id) DO NOTHING;

    -- users.team_id 컬럼 제거
    ALTER TABLE users DROP COLUMN IF EXISTS team_id;
  END IF;
END$$;

-- 3. teams 테이블이 있으면 제거하고 farms 기반 뷰로 대체
DROP TABLE IF EXISTS teams CASCADE;

-- teams 호환성을 위한 뷰 생성 (기존 코드 호환성)
CREATE VIEW teams AS
SELECT 
  id, 
  name, 
  location as description, 
  tenant_id,
  created_at
FROM farms;

-- 4. RLS 정책 설정
ALTER TABLE farm_memberships ENABLE ROW LEVEL SECURITY;

-- 보기 정책: 테넌트 일치하면 조회 가능
CREATE POLICY p_select_farm_memberships ON farm_memberships
FOR SELECT USING (
  EXISTS(
    SELECT 1 FROM memberships m 
    WHERE m.tenant_id = farm_memberships.tenant_id 
      AND m.user_id = auth.uid()
  )
);

-- 쓰기 정책: 테넌트 일치 & 적절한 권한
CREATE POLICY p_insert_farm_memberships ON farm_memberships
FOR INSERT WITH CHECK (
  EXISTS(
    SELECT 1 FROM memberships m 
    WHERE m.tenant_id = farm_memberships.tenant_id 
      AND m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'system_admin', 'team_leader')
  )
);

CREATE POLICY p_update_farm_memberships ON farm_memberships
FOR UPDATE USING (
  EXISTS(
    SELECT 1 FROM memberships m 
    WHERE m.tenant_id = farm_memberships.tenant_id 
      AND m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'system_admin', 'team_leader')
  )
);

CREATE POLICY p_delete_farm_memberships ON farm_memberships
FOR DELETE USING (
  EXISTS(
    SELECT 1 FROM memberships m 
    WHERE m.tenant_id = farm_memberships.tenant_id 
      AND m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'system_admin')
  )
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_farm_memberships_tenant_farm 
ON farm_memberships(tenant_id, farm_id);

CREATE INDEX IF NOT EXISTS idx_farm_memberships_user 
ON farm_memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_farm_memberships_role 
ON farm_memberships(role);

-- 6. 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_farm_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_farm_memberships_updated_at
  BEFORE UPDATE ON farm_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_farm_memberships_updated_at();

-- 7. 마이그레이션 완료 후 데이터 검증
DO $$
DECLARE
  farm_count INTEGER;
  membership_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO farm_count FROM farms;
  SELECT COUNT(*) INTO membership_count FROM farm_memberships;
  SELECT COUNT(*) INTO user_count FROM users;
  
  RAISE NOTICE '마이그레이션 완료:';
  RAISE NOTICE '  - 농장 수: %', farm_count;
  RAISE NOTICE '  - 농장 멤버십 수: %', membership_count;
  RAISE NOTICE '  - 사용자 수: %', user_count;
END$$;
