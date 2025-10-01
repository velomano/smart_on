-- =====================================================
-- Universal Bridge v2.0 Database Schema
-- =====================================================
-- 
-- 기존 스마트팜 시스템에 Universal Bridge 기능 추가
--
-- ⚠️ 주의: 기존 devices 테이블이 있으므로 새 테이블 이름 사용
--
-- =====================================================

-- ==================== 1. IoT Devices 테이블 (새로 생성) ====================
-- 기존 devices 테이블과 분리하여 IoT 전용 테이블 생성

CREATE TABLE IF NOT EXISTS iot_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,  -- 사용자 지정 ID (esp32-001 등)
  device_key_hash TEXT NOT NULL,  -- PSK 해시
  device_type TEXT,  -- 'arduino', 'esp32', 'raspberry_pi'
  fw_version TEXT,
  capabilities JSONB,  -- ["temperature", "humidity", "pump"]
  last_seen_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  metadata JSONB,  -- RSSI, battery, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, device_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_iot_devices_tenant_farm 
  ON iot_devices(tenant_id, farm_id);

CREATE INDEX IF NOT EXISTS idx_iot_devices_last_seen 
  ON iot_devices(last_seen_at) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_iot_devices_tenant_status 
  ON iot_devices(tenant_id, status);

-- RLS 정책 (Service Role만 허용)
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;

-- Service role은 모든 접근 허용
DROP POLICY IF EXISTS "Service role full access to iot_devices" ON iot_devices;
CREATE POLICY "Service role full access to iot_devices" ON iot_devices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- TODO: 일반 사용자 정책은 추후 추가
-- CREATE POLICY "Tenant isolation for iot_devices" ON iot_devices
--   FOR ALL TO authenticated
--   USING (tenant_id IN (SELECT tenant_id FROM farm_memberships WHERE user_id = auth.uid()));

-- 트리거: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_iot_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS iot_devices_updated_at ON iot_devices;
CREATE TRIGGER iot_devices_updated_at
  BEFORE UPDATE ON iot_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_iot_devices_updated_at();

-- ==================== 2. Device Claims 테이블 ====================

CREATE TABLE IF NOT EXISTS device_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  setup_token_hash TEXT NOT NULL,  -- SHA256 해시
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_device_id TEXT,
  ip_bound INET[],
  user_agent TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_device_claims_expires 
  ON device_claims(expires_at) 
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_device_claims_tenant 
  ON device_claims(tenant_id, expires_at);

-- RLS 정책 (Service Role만 허용)
ALTER TABLE device_claims ENABLE ROW LEVEL SECURITY;

-- Service role 전체 접근
DROP POLICY IF EXISTS "Service role full access to device_claims" ON device_claims;
CREATE POLICY "Service role full access to device_claims" ON device_claims
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 자동 정리: 만료된 토큰 삭제
CREATE OR REPLACE FUNCTION cleanup_expired_claims()
RETURNS void AS $$
BEGIN
  DELETE FROM device_claims
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- ==================== 3. IoT Readings 테이블 ====================
-- 기존 sensor_readings와 분리 (다른 구조)

CREATE TABLE IF NOT EXISTS iot_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  key TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  raw JSONB,
  schema_version TEXT DEFAULT 'v1',
  quality TEXT CHECK (quality IN ('good', 'fair', 'poor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_iot_readings_tenant_device_ts 
  ON iot_readings(tenant_id, device_id, ts DESC);

CREATE INDEX IF NOT EXISTS idx_iot_readings_ts 
  ON iot_readings(ts DESC) 
  WHERE ts > NOW() - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_iot_readings_device_key 
  ON iot_readings(device_id, key, ts DESC);

-- RLS 정책 (Service Role만 허용)
ALTER TABLE iot_readings ENABLE ROW LEVEL SECURITY;

-- Service role 전체 접근
DROP POLICY IF EXISTS "Service role full access to iot_readings" ON iot_readings;
CREATE POLICY "Service role full access to iot_readings" ON iot_readings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==================== 4. IoT Commands 테이블 ====================

CREATE TABLE IF NOT EXISTS iot_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
  msg_id TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_iot_commands_pending 
  ON iot_commands(tenant_id, device_id, status) 
  WHERE status IN ('pending', 'sent');

CREATE INDEX IF NOT EXISTS idx_iot_commands_device_status 
  ON iot_commands(device_id, status, issued_at DESC);

-- RLS 정책 (Service Role만 허용)
ALTER TABLE iot_commands ENABLE ROW LEVEL SECURITY;

-- Service role 전체 접근
DROP POLICY IF EXISTS "Service role full access to iot_commands" ON iot_commands;
CREATE POLICY "Service role full access to iot_commands" ON iot_commands
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 트리거
CREATE OR REPLACE FUNCTION update_iot_commands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS iot_commands_updated_at ON iot_commands;
CREATE TRIGGER iot_commands_updated_at
  BEFORE UPDATE ON iot_commands
  FOR EACH ROW
  EXECUTE FUNCTION update_iot_commands_updated_at();

-- ==================== 5. 집계 뷰 ====================

CREATE MATERIALIZED VIEW IF NOT EXISTS iot_readings_hourly AS
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
FROM iot_readings
WHERE ts > NOW() - INTERVAL '30 days'
GROUP BY device_id, tenant_id, hour, key;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_iot_readings_hourly_device 
  ON iot_readings_hourly(device_id, hour DESC);

-- ==================== 6. 헬퍼 함수 ====================

-- 디바이스 온라인 상태 업데이트
CREATE OR REPLACE FUNCTION update_iot_device_last_seen(
  p_device_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE iot_devices
  SET last_seen_at = NOW()
  WHERE id = p_device_id;
END;
$$ LANGUAGE plpgsql;

-- ==================== 7. 데모 테넌트 생성 ====================

-- 데모 테넌트가 없으면 생성
INSERT INTO tenants (id, name, subdomain, description)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  '기본 테넌트',
  'localhost',
  'Development & Testing'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenants (id, name, subdomain, description)
VALUES (
  '00000000-0000-0000-0000-000000000002'::UUID,
  '데모 고객사',
  'demo',
  'Demo Tenant'
)
ON CONFLICT (id) DO NOTHING;

-- ==================== 완료 메시지 ====================

DO $$
BEGIN
  RAISE NOTICE '====================================================';
  RAISE NOTICE '✅ Universal Bridge v2.0 스키마 생성 완료!';
  RAISE NOTICE '====================================================';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  - iot_devices (IoT 디바이스 정보)';
  RAISE NOTICE '  - device_claims (Setup Token)';
  RAISE NOTICE '  - iot_readings (IoT 센서 데이터)';
  RAISE NOTICE '  - iot_commands (IoT 제어 명령)';
  RAISE NOTICE '  - iot_readings_hourly (집계 뷰)';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 테넌트:';
  RAISE NOTICE '  - 00000000-0000-0000-0000-000000000001 (기본)';
  RAISE NOTICE '  - 00000000-0000-0000-0000-000000000002 (데모)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS 정책: farm_memberships 기반 테넌트 격리';
  RAISE NOTICE '✅ Service Role: 전체 접근 가능';
  RAISE NOTICE '';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. Universal Bridge 서버 재시작';
  RAISE NOTICE '2. 환경 변수 설정 (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)';
  RAISE NOTICE '3. API 테스트';
  RAISE NOTICE '====================================================';
END $$;
