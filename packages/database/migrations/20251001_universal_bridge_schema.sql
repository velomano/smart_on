-- =====================================================
-- Universal Bridge v2.0 Database Schema
-- =====================================================
-- 
-- 이 스크립트를 Supabase SQL Editor에 복사-붙여넣기 하세요!
--
-- 실행 순서:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 전체 스크립트 복사
-- 3. Run 클릭
-- 4. 성공 메시지 확인
--
-- =====================================================

-- ==================== 1. Devices 테이블 ====================

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_key_hash TEXT NOT NULL,  -- bcrypt 해시
  profile_id UUID,  -- 향후 device_profiles 테이블 참조
  device_type TEXT,  -- 'arduino', 'esp32', 'raspberry_pi', etc.
  fw_version TEXT,
  capabilities JSONB,  -- ["temperature", "humidity", "pump"]
  last_seen_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  metadata JSONB,  -- 추가 정보 (RSSI, battery, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, device_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_devices_tenant_farm 
  ON devices(tenant_id, farm_id);

CREATE INDEX IF NOT EXISTS idx_devices_last_seen 
  ON devices(last_seen_at) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_devices_tenant_status 
  ON devices(tenant_id, status);

-- RLS 정책
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for devices" ON devices;
CREATE POLICY "Tenant isolation for devices" ON devices
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM farm_memberships WHERE user_id = auth.uid() LIMIT 1));

-- 트리거: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS devices_updated_at ON devices;
CREATE TRIGGER devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_devices_updated_at();

-- ==================== 2. Device Claims 테이블 ====================

CREATE TABLE IF NOT EXISTS device_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  setup_token_hash TEXT NOT NULL,  -- bcrypt 해시
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_device_id TEXT,
  ip_bound INET[],  -- IP 화이트리스트 (옵션)
  user_agent TEXT,  -- User-Agent 제한 (옵션)
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_claims_expires 
  ON device_claims(expires_at) 
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_claims_tenant 
  ON device_claims(tenant_id, expires_at);

-- RLS 정책
ALTER TABLE device_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for claims" ON device_claims;
CREATE POLICY "Tenant isolation for claims" ON device_claims
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM farm_memberships WHERE user_id = auth.uid() LIMIT 1));

-- 자동 정리: 만료된 토큰 삭제 (일일 실행)
CREATE OR REPLACE FUNCTION cleanup_expired_claims()
RETURNS void AS $$
BEGIN
  DELETE FROM device_claims
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- ==================== 3. Readings 테이블 ====================

CREATE TABLE IF NOT EXISTS readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  key TEXT NOT NULL,  -- 'temperature', 'humidity', etc.
  value NUMERIC,
  unit TEXT,
  raw JSONB,  -- 원본 데이터
  schema_version TEXT DEFAULT 'v1',
  quality TEXT CHECK (quality IN ('good', 'fair', 'poor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_readings_tenant_device_ts 
  ON readings(tenant_id, device_id, ts DESC);

CREATE INDEX IF NOT EXISTS idx_readings_ts 
  ON readings(ts DESC) 
  WHERE ts > NOW() - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_readings_device_key 
  ON readings(device_id, key, ts DESC);

-- RLS 정책
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for readings" ON readings;
CREATE POLICY "Tenant isolation for readings" ON readings
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM farm_memberships WHERE user_id = auth.uid() LIMIT 1));

-- 파티셔닝 (옵션 - 대용량 데이터용)
-- CREATE TABLE readings_archive (LIKE readings INCLUDING ALL) PARTITION BY RANGE (ts);

-- ==================== 4. Commands 테이블 ====================

CREATE TABLE IF NOT EXISTS commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  msg_id TEXT NOT NULL,  -- Idempotency Key
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,  -- 'on', 'off', 'set_value', etc.
  payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acked', 'failed', 'timeout')),
  ack_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, msg_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_commands_pending 
  ON commands(tenant_id, device_id, status) 
  WHERE status IN ('pending', 'sent');

CREATE INDEX IF NOT EXISTS idx_commands_device_status 
  ON commands(device_id, status, issued_at DESC);

-- RLS 정책
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for commands" ON commands;
CREATE POLICY "Tenant isolation for commands" ON commands
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM farm_memberships WHERE user_id = auth.uid() LIMIT 1));

-- 트리거: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_commands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS commands_updated_at ON commands;
CREATE TRIGGER commands_updated_at
  BEFORE UPDATE ON commands
  FOR EACH ROW
  EXECUTE FUNCTION update_commands_updated_at();

-- ==================== 5. 집계 뷰 (성능 최적화) ====================

-- 시간별 센서 데이터 집계 (대시보드용)
CREATE MATERIALIZED VIEW IF NOT EXISTS readings_hourly AS
SELECT
  device_id,
  tenant_id,
  date_trunc('hour', ts) as hour,
  key,
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  STDDEV(value) as stddev_value,
  COUNT(*) as count
FROM readings
WHERE ts > NOW() - INTERVAL '30 days'  -- 최근 30일만
GROUP BY device_id, tenant_id, hour, key;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_readings_hourly_device 
  ON readings_hourly(device_id, hour DESC);

-- 일일 새로고침 (cron 또는 pg_cron으로 실행)
-- SELECT cron.schedule('refresh-readings-hourly', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY readings_hourly');

-- ==================== 6. 헬퍼 함수 ====================

-- 현재 사용자의 tenant_id 조회
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM farm_memberships 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 디바이스 온라인 상태 업데이트
CREATE OR REPLACE FUNCTION update_device_last_seen(
  p_device_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE devices
  SET last_seen_at = NOW()
  WHERE id = p_device_id;
END;
$$ LANGUAGE plpgsql;

-- ==================== 7. 초기 데이터 (옵션) ====================

-- 디바이스 타입 예시 (필요 시)
-- INSERT INTO device_profiles (name, type, capabilities) VALUES
-- ('Arduino DHT22', 'arduino', '["temperature", "humidity"]'::jsonb),
-- ('ESP32 Multi-Sensor', 'esp32', '["temperature", "humidity", "ec", "ph"]'::jsonb),
-- ('Raspberry Pi Gateway', 'raspberry_pi', '["gateway", "multi-sensor"]'::jsonb);

-- ==================== 완료 메시지 ====================

DO $$
BEGIN
  RAISE NOTICE '✅ Universal Bridge v2.0 스키마 생성 완료!';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  - devices (디바이스 정보)';
  RAISE NOTICE '  - device_claims (Setup Token)';
  RAISE NOTICE '  - readings (센서 데이터)';
  RAISE NOTICE '  - commands (제어 명령)';
  RAISE NOTICE '  - readings_hourly (집계 뷰)';
  RAISE NOTICE '';
  RAISE NOTICE '다음 단계: Universal Bridge 서버에서 DB 연동 테스트';
END $$;

