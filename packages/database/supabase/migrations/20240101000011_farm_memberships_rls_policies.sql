-- farm_memberships RLS 정책 및 관련 테이블 정책 설정
-- Supabase SQL Editor에서 실행

-- 1. farm_memberships 테이블이 실제로 있는지/구조가 맞는지
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

-- 2. RLS 켜기
ALTER TABLE farm_memberships ENABLE ROW LEVEL SECURITY;

-- 3. 조회 정책: 같은 tenant면 볼 수 있게
DROP POLICY IF EXISTS p_select_farm_memberships ON farm_memberships;
CREATE POLICY p_select_farm_memberships ON farm_memberships
FOR SELECT USING (
  EXISTS(SELECT 1 FROM memberships m
         WHERE m.tenant_id = farm_memberships.tenant_id
           AND m.user_id = auth.uid())
);

-- 4. 추가/수정 정책: owner/operator만 쓰기 가능(필요 시 조건 조정)
DROP POLICY IF EXISTS p_upsert_farm_memberships ON farm_memberships;
CREATE POLICY p_upsert_farm_memberships ON farm_memberships
FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM memberships m
         WHERE m.tenant_id = farm_memberships.tenant_id
           AND m.user_id = auth.uid()
           AND m.role IN ('owner','operator'))
);

-- upsert의 update 분도 허용
DROP POLICY IF EXISTS p_update_farm_memberships ON farm_memberships;
CREATE POLICY p_update_farm_memberships ON farm_memberships
FOR UPDATE USING (
  EXISTS(SELECT 1 FROM memberships m
         WHERE m.tenant_id = farm_memberships.tenant_id
           AND m.user_id = auth.uid()
           AND m.role IN ('owner','operator'))
);

-- 5. 삭제 정책(필요하면 owner만)
DROP POLICY IF EXISTS p_delete_farm_memberships ON farm_memberships;
CREATE POLICY p_delete_farm_memberships ON farm_memberships
FOR DELETE USING (
  EXISTS(SELECT 1 FROM memberships m
         WHERE m.tenant_id = farm_memberships.tenant_id
           AND m.user_id = auth.uid()
           AND m.role IN ('owner'))
);

-- 6. farms도 못 보아서 '농장별 사용자 보기'가 비는 경우가 많습니다.
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_select_farms ON farms;
CREATE POLICY p_select_farms ON farms
FOR SELECT USING (
  EXISTS(SELECT 1 FROM memberships m
         WHERE m.tenant_id = farms.tenant_id
           AND m.user_id = auth.uid())
);

-- 7. users도 같은 테넌트만 보이게 (관리 화면에 필요)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_select_users ON users;
CREATE POLICY p_select_users ON users
FOR SELECT USING (
  EXISTS(SELECT 1 FROM memberships m
         WHERE m.tenant_id = users.tenant_id
           AND m.user_id = auth.uid())
);

-- 8. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_farm_memberships_tenant_farm 
ON farm_memberships(tenant_id, farm_id);

CREATE INDEX IF NOT EXISTS idx_farm_memberships_user 
ON farm_memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_farm_memberships_role 
ON farm_memberships(role);

-- 9. 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_farm_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_farm_memberships_updated_at ON farm_memberships;
CREATE TRIGGER trigger_update_farm_memberships_updated_at
  BEFORE UPDATE ON farm_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_farm_memberships_updated_at();

-- 10. 진단용 쿼리 (실행 후 결과 확인)
DO $$
DECLARE
  current_user_id UUID;
  membership_count INTEGER;
  farm_count INTEGER;
  user_count INTEGER;
  fm_count INTEGER;
BEGIN
  -- 현재 사용자 ID 확인
  SELECT auth.uid() INTO current_user_id;
  
  -- 각 테이블의 데이터 수 확인
  SELECT COUNT(*) INTO membership_count FROM memberships WHERE user_id = current_user_id;
  SELECT COUNT(*) INTO farm_count FROM farms;
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO fm_count FROM farm_memberships;
  
  RAISE NOTICE '=== 진단 결과 ===';
  RAISE NOTICE '현재 사용자 ID: %', current_user_id;
  RAISE NOTICE '내 memberships 수: %', membership_count;
  RAISE NOTICE '전체 farms 수: %', farm_count;
  RAISE NOTICE '전체 users 수: %', user_count;
  RAISE NOTICE '전체 farm_memberships 수: %', fm_count;
  
  IF membership_count = 0 THEN
    RAISE NOTICE '⚠️  경고: 현재 사용자가 memberships에 없습니다!';
  END IF;
END$$;
