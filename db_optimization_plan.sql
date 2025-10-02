-- =====================================================
-- 데이터베이스 최적화 및 통합 계획
-- =====================================================
-- 
-- 🛡️ 안전 모드: 데이터 손상 방지를 위한 단계별 접근
-- 
-- =====================================================

-- =====================================================
-- Phase 1: 중복 테이블 분석 및 통합 전략
-- =====================================================

/*
🔍 중복 테이블 분석 결과:

1. 디바이스 관련 테이블:
   - devices (기존) vs iot_devices (신규)
   - commands (기존) vs iot_commands (신규)
   - sensor_readings (기존) vs iot_readings (신규)

2. 권한 관련 테이블:
   - memberships (기존) vs farm_memberships (신규)

3. 미사용/저사용 테이블:
   - nutrient_recipe_aliases (별칭 관리)
   - mixing_instructions, mixing_rules (믹싱 규칙)
   - modbus_configs, transport_configs (프로토콜 설정)
   - acid_bases, adjustments (화학 조정)
*/

-- =====================================================
-- Phase 2: 안전한 통합 전략
-- =====================================================

-- Step 1: 통합 테이블 생성 (기존 데이터 보존)
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

-- Step 2: 통합 읽기 테이블 생성
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

-- Step 3: 통합 명령 테이블 생성
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

-- =====================================================
-- Phase 3: 데이터 마이그레이션 함수
-- =====================================================

-- 안전한 데이터 마이그레이션 함수
CREATE OR REPLACE FUNCTION migrate_to_unified_tables()
RETURNS TEXT AS $$
DECLARE
    migrated_devices INTEGER := 0;
    migrated_readings INTEGER := 0;
    migrated_commands INTEGER := 0;
    error_msg TEXT;
BEGIN
    -- 트랜잭션 시작
    BEGIN
        -- 1. 기존 devices → unified_devices
        INSERT INTO unified_devices (
            tenant_id, farm_id, bed_id, type, vendor, tuya_device_id, 
            status, meta, name, source_table, original_id, created_at
        )
        SELECT 
            t.id as tenant_id, d.farm_id, d.bed_id, d.type, d.vendor, 
            d.tuya_device_id, d.status, d.meta, d.name, 'devices', d.id, d.created_at
        FROM devices d
        JOIN farms f ON d.farm_id = f.id
        JOIN tenants t ON f.tenant_id = t.id
        WHERE NOT EXISTS (
            SELECT 1 FROM unified_devices ud WHERE ud.original_id = d.id
        );
        
        GET DIAGNOSTICS migrated_devices = ROW_COUNT;
        
        -- 2. iot_devices → unified_devices
        INSERT INTO unified_devices (
            tenant_id, farm_id, device_id, device_key_hash, device_type, 
            fw_version, capabilities, last_seen_at, device_status, metadata,
            source_table, original_id, created_at, updated_at
        )
        SELECT 
            id.tenant_id, id.farm_id, id.device_id, id.device_key_hash, id.device_type,
            id.fw_version, id.capabilities, id.last_seen_at, id.status, id.metadata,
            'iot_devices', id.id, id.created_at, id.updated_at
        FROM iot_devices id
        WHERE NOT EXISTS (
            SELECT 1 FROM unified_devices ud WHERE ud.original_id = id.id
        );
        
        migrated_devices := migrated_devices + ROW_COUNT;
        
        -- 3. sensor_readings → unified_readings
        INSERT INTO unified_readings (
            tenant_id, device_id, sensor_id, ts, value, quality,
            source_table, original_id, created_at
        )
        SELECT 
            ud.tenant_id, ud.id as device_id, sr.sensor_id, sr.ts, sr.value, sr.quality,
            'sensor_readings', sr.id, sr.ts
        FROM sensor_readings sr
        JOIN sensors s ON sr.sensor_id = s.id
        JOIN devices d ON s.device_id = d.id
        JOIN unified_devices ud ON ud.original_id = d.id AND ud.source_table = 'devices'
        WHERE NOT EXISTS (
            SELECT 1 FROM unified_readings ur WHERE ur.original_id = sr.id
        );
        
        GET DIAGNOSTICS migrated_readings = ROW_COUNT;
        
        -- 4. iot_readings → unified_readings
        INSERT INTO unified_readings (
            tenant_id, device_id, ts, key, value, unit, raw, schema_version, reading_quality,
            source_table, original_id, created_at
        )
        SELECT 
            ir.tenant_id, ud.id as device_id, ir.ts, ir.key, ir.value, ir.unit, 
            ir.raw, ir.schema_version, ir.quality, 'iot_readings', ir.id, ir.created_at
        FROM iot_readings ir
        JOIN unified_devices ud ON ud.original_id = ir.device_id AND ud.source_table = 'iot_devices'
        WHERE NOT EXISTS (
            SELECT 1 FROM unified_readings ur WHERE ur.original_id = ir.id
        );
        
        migrated_readings := migrated_readings + ROW_COUNT;
        
        -- 5. commands → unified_commands
        INSERT INTO unified_commands (
            tenant_id, device_id, issued_by, command, payload, status, correlation_id,
            source_table, original_id, created_at
        )
        SELECT 
            ud.tenant_id, ud.id as device_id, c.issued_by, c.command, c.payload, 
            c.status, c.correlation_id, 'commands', c.id, c.ts
        FROM commands c
        JOIN devices d ON c.device_id = d.id
        JOIN unified_devices ud ON ud.original_id = d.id AND ud.source_table = 'devices'
        WHERE NOT EXISTS (
            SELECT 1 FROM unified_commands uc WHERE uc.original_id = c.id
        );
        
        GET DIAGNOSTICS migrated_commands = ROW_COUNT;
        
        -- 6. iot_commands → unified_commands
        INSERT INTO unified_commands (
            tenant_id, device_id, msg_id, issued_at, type, payload, status, 
            ack_at, retry_count, last_error, source_table, original_id, created_at, updated_at
        )
        SELECT 
            ic.tenant_id, ud.id as device_id, ic.msg_id, ic.issued_at, ic.type, 
            ic.payload, ic.status, ic.ack_at, ic.retry_count, ic.last_error,
            'iot_commands', ic.id, ic.created_at, ic.updated_at
        FROM iot_commands ic
        JOIN unified_devices ud ON ud.original_id = ic.device_id AND ud.source_table = 'iot_devices'
        WHERE NOT EXISTS (
            SELECT 1 FROM unified_commands uc WHERE uc.original_id = ic.id
        );
        
        migrated_commands := migrated_commands + ROW_COUNT;
        
        RETURN FORMAT('Migration completed successfully: %s devices, %s readings, %s commands migrated', 
                     migrated_devices, migrated_readings, migrated_commands);
        
    EXCEPTION WHEN OTHERS THEN
        -- 에러 발생 시 롤백
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RETURN FORMAT('Migration failed: %s', error_msg);
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Phase 4: 성능 최적화 인덱스
-- =====================================================

-- 통합 테이블 인덱스
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

-- =====================================================
-- Phase 5: 검증 함수
-- =====================================================

-- 데이터 무결성 검증 함수
CREATE OR REPLACE FUNCTION verify_migration_integrity()
RETURNS TABLE(
    table_name TEXT,
    original_count BIGINT,
    migrated_count BIGINT,
    integrity_status TEXT
) AS $$
BEGIN
    -- devices 검증
    RETURN QUERY
    SELECT 
        'devices'::TEXT,
        (SELECT COUNT(*) FROM devices),
        (SELECT COUNT(*) FROM unified_devices WHERE source_table = 'devices'),
        CASE 
            WHEN (SELECT COUNT(*) FROM devices) = (SELECT COUNT(*) FROM unified_devices WHERE source_table = 'devices')
            THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END;
    
    -- iot_devices 검증
    RETURN QUERY
    SELECT 
        'iot_devices'::TEXT,
        (SELECT COUNT(*) FROM iot_devices),
        (SELECT COUNT(*) FROM unified_devices WHERE source_table = 'iot_devices'),
        CASE 
            WHEN (SELECT COUNT(*) FROM iot_devices) = (SELECT COUNT(*) FROM unified_devices WHERE source_table = 'iot_devices')
            THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END;
    
    -- sensor_readings 검증
    RETURN QUERY
    SELECT 
        'sensor_readings'::TEXT,
        (SELECT COUNT(*) FROM sensor_readings),
        (SELECT COUNT(*) FROM unified_readings WHERE source_table = 'sensor_readings'),
        CASE 
            WHEN (SELECT COUNT(*) FROM sensor_readings) = (SELECT COUNT(*) FROM unified_readings WHERE source_table = 'sensor_readings')
            THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END;
    
    -- iot_readings 검증
    RETURN QUERY
    SELECT 
        'iot_readings'::TEXT,
        (SELECT COUNT(*) FROM iot_readings),
        (SELECT COUNT(*) FROM unified_readings WHERE source_table = 'iot_readings'),
        CASE 
            WHEN (SELECT COUNT(*) FROM iot_readings) = (SELECT COUNT(*) FROM unified_readings WHERE source_table = 'iot_readings')
            THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Phase 6: 롤백 함수 (안전장치)
-- =====================================================

-- 마이그레이션 롤백 함수
CREATE OR REPLACE FUNCTION rollback_migration()
RETURNS TEXT AS $$
BEGIN
    -- 통합 테이블 삭제
    DROP TABLE IF EXISTS unified_commands CASCADE;
    DROP TABLE IF EXISTS unified_readings CASCADE;
    DROP TABLE IF EXISTS unified_devices CASCADE;
    
    -- 함수 삭제
    DROP FUNCTION IF EXISTS migrate_to_unified_tables();
    DROP FUNCTION IF EXISTS verify_migration_integrity();
    DROP FUNCTION IF EXISTS rollback_migration();
    
    RETURN 'Migration rolled back successfully. All unified tables and functions removed.';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 사용법 안내
-- =====================================================

/*
🛡️ 안전한 마이그레이션 실행 순서:

1. 백업 확인:
   - backup_20251002_114629.sql (스키마)
   - backup_data_20251002_114930.sql (데이터)

2. 마이그레이션 실행:
   SELECT migrate_to_unified_tables();

3. 무결성 검증:
   SELECT * FROM verify_migration_integrity();

4. 성공 시 기존 테이블 제거 (선택사항):
   -- 주의: 이 단계는 신중하게 진행
   -- DROP TABLE IF EXISTS commands, iot_commands, sensor_readings, iot_readings, devices, iot_devices;

5. 문제 발생 시 롤백:
   SELECT rollback_migration();

⚠️ 주의사항:
- 프로덕션 환경에서는 반드시 테스트 환경에서 먼저 실행
- 마이그레이션 전 전체 데이터베이스 백업 필수
- 기존 테이블 제거는 애플리케이션 코드 수정 후 진행
*/
