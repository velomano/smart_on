-- =====================================================
-- 데이터베이스 최적화 마이그레이션
-- =====================================================
-- 생성일: 2025-10-02
-- 설명: 중복 테이블 통합 및 성능 최적화
-- =====================================================

-- Phase 1: 통합 테이블 생성
CREATE TABLE IF NOT EXISTS unified_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    bed_id UUID REFERENCES beds(id) ON DELETE SET NULL,
    
    -- 기존 devices 필드
    type TEXT NOT NULL CHECK (type IN ('switch','pump','fan','light','motor','sensor_gateway','arduino','esp32','raspberry_pi')),
    vendor TEXT,
    tuya_device_id TEXT,
    status JSONB,
    meta JSONB,
    name TEXT,
    
    -- iot_devices 필드
    device_id TEXT,  -- 사용자 지정 ID
    device_key_hash TEXT,  -- PSK 해시
    device_type TEXT,  -- 하드웨어 타입
    fw_version TEXT,
    capabilities JSONB,
    last_seen_at TIMESTAMPTZ,
    device_status TEXT DEFAULT 'active' CHECK (device_status IN ('active', 'inactive', 'maintenance')),
    
    -- 공통 필드
    source_table TEXT NOT NULL CHECK (source_table IN ('devices', 'iot_devices')),
    original_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unified_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES unified_devices(id) ON DELETE CASCADE,
    
    -- 기존 sensor_readings 필드
    sensor_id UUID,  -- 기존 센서 ID (참조용)
    ts TIMESTAMPTZ NOT NULL,
    value NUMERIC NOT NULL,
    quality INT DEFAULT 1,
    
    -- iot_readings 필드
    key TEXT,  -- 센서 키
    unit TEXT,
    raw JSONB,
    schema_version TEXT DEFAULT 'v1',
    reading_quality TEXT CHECK (reading_quality IN ('good', 'fair', 'poor')),
    
    -- 공통 필드
    source_table TEXT NOT NULL CHECK (source_table IN ('sensor_readings', 'iot_readings')),
    original_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unified_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES unified_devices(id) ON DELETE CASCADE,
    issued_by UUID REFERENCES users(id),
    
    -- 기존 commands 필드
    command TEXT NOT NULL,
    payload JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acked', 'failed')),
    correlation_id TEXT,
    
    -- iot_commands 필드
    msg_id TEXT,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    type TEXT,
    ack_at TIMESTAMPTZ,
    retry_count INT DEFAULT 0,
    last_error TEXT,
    
    -- 공통 필드
    source_table TEXT NOT NULL CHECK (source_table IN ('commands', 'iot_commands')),
    original_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 2: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_unified_devices_tenant_farm 
    ON unified_devices(tenant_id, farm_id);

CREATE INDEX IF NOT EXISTS idx_unified_devices_source_original 
    ON unified_devices(source_table, original_id);

CREATE INDEX IF NOT EXISTS idx_unified_devices_last_seen 
    ON unified_devices(last_seen_at) WHERE device_status = 'active';

CREATE INDEX IF NOT EXISTS idx_unified_readings_device_ts 
    ON unified_readings(device_id, ts DESC);

CREATE INDEX IF NOT EXISTS idx_unified_readings_source_original 
    ON unified_readings(source_table, original_id);

CREATE INDEX IF NOT EXISTS idx_unified_commands_device_status 
    ON unified_commands(device_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unified_commands_source_original 
    ON unified_commands(source_table, original_id);

-- Phase 3: RLS 정책 적용
ALTER TABLE unified_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_commands ENABLE ROW LEVEL SECURITY;

-- Service role 전체 접근 허용
CREATE POLICY "Service role full access to unified_devices" ON unified_devices
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to unified_readings" ON unified_readings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to unified_commands" ON unified_commands
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Phase 4: 마이그레이션 완료 로그
INSERT INTO migration_history (migration_name, description) VALUES (
    '20251002_database_optimization',
    '중복 테이블 통합 및 성능 최적화 - unified_devices, unified_readings, unified_commands 테이블 생성'
);
