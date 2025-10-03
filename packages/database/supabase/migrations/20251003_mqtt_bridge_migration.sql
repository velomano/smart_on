-- =====================================================
-- MQTT Bridge → Universal Bridge 데이터 마이그레이션
-- 생성일: 2025-10-03
-- 목적: sensor_readings 테이블 데이터를 iot_readings로 마이그레이션
-- =====================================================

-- 1. 마이그레이션 로그 테이블 생성
CREATE TABLE IF NOT EXISTS migration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 마이그레이션 시작 로그
INSERT INTO migration_logs (migration_name, status) 
VALUES ('mqtt_bridge_to_universal_bridge', 'running');

-- 3. 기존 데이터 백업 (안전을 위해)
CREATE TABLE IF NOT EXISTS sensor_readings_backup AS 
SELECT *, NOW() as backup_created_at FROM sensor_readings;

-- 4. 데이터 마이그레이션 실행
-- sensor_readings → iot_readings 변환
INSERT INTO iot_readings (
    device_uuid,
    key,
    value,
    unit,
    ts,
    tenant_id,
    created_at
)
SELECT 
    d.device_id as device_uuid,
    s.type as key,
    sr.value,
    sr.unit,
    sr.ts,
    d.farm_id as tenant_id,  -- Legacy 호환성을 위해 farm_id를 tenant_id로 사용
    NOW() as created_at
FROM sensor_readings sr
JOIN sensors s ON sr.sensor_id = s.id
JOIN devices d ON s.device_id = d.id
WHERE NOT EXISTS (
    -- 중복 방지: 이미 iot_readings에 존재하는 데이터는 제외
    SELECT 1 FROM iot_readings ir 
    WHERE ir.device_uuid = d.device_id 
    AND ir.key = s.type 
    AND ir.ts = sr.ts
);

-- 5. 디바이스 정보 마이그레이션
-- devices → iot_devices 변환
INSERT INTO iot_devices (
    device_id,
    tenant_id,
    farm_id,
    profile_id,
    device_type,
    capabilities,
    status,
    last_seen_at,
    created_at
)
SELECT 
    d.device_id,
    d.farm_id as tenant_id,  -- Legacy 호환성을 위해 farm_id를 tenant_id로 사용
    d.farm_id,
    NULL as profile_id,
    COALESCE(d.device_type, 'sensor_gateway') as device_type,
    jsonb_build_object(
        'sensors', COALESCE(d.sensors, '[]'::json),
        'actuators', COALESCE(d.actuators, '[]'::json),
        'capabilities', COALESCE(d.capabilities, '[]'::json)
    ) as capabilities,
    CASE 
        WHEN d.last_seen_at > NOW() - INTERVAL '5 minutes' THEN 'online'
        ELSE 'offline'
    END as status,
    d.last_seen_at,
    NOW() as created_at
FROM devices d
WHERE NOT EXISTS (
    -- 중복 방지: 이미 iot_devices에 존재하는 디바이스는 제외
    SELECT 1 FROM iot_devices id 
    WHERE id.device_id = d.device_id 
    AND id.tenant_id = d.farm_id
);

-- 6. 마이그레이션 통계 계산
WITH migration_stats AS (
    SELECT 
        COUNT(*) as total_sensor_readings,
        COUNT(DISTINCT d.device_id) as total_devices,
        COUNT(DISTINCT s.type) as sensor_types
    FROM sensor_readings sr
    JOIN sensors s ON sr.sensor_id = s.id
    JOIN devices d ON s.device_id = d.id
),
migrated_stats AS (
    SELECT 
        COUNT(*) as migrated_readings,
        COUNT(DISTINCT device_uuid) as migrated_devices
    FROM iot_readings ir
    WHERE ir.created_at > NOW() - INTERVAL '1 hour'
)
UPDATE migration_logs 
SET 
    status = 'completed',
    completed_at = NOW(),
    records_processed = (
        SELECT total_sensor_readings + total_devices 
        FROM migration_stats
    ),
    error_message = jsonb_build_object(
        'total_sensor_readings', ms.total_sensor_readings,
        'total_devices', ms.total_devices,
        'sensor_types', ms.sensor_types,
        'migrated_readings', mig.migrated_readings,
        'migrated_devices', mig.migrated_devices
    )::text
FROM migration_stats ms, migrated_stats mig
WHERE migration_name = 'mqtt_bridge_to_universal_bridge'
AND status = 'running';

-- 7. 마이그레이션 결과 확인
SELECT 
    'Migration completed' as status,
    ml.records_processed,
    ml.completed_at,
    ml.error_message
FROM migration_logs ml
WHERE ml.migration_name = 'mqtt_bridge_to_universal_bridge'
ORDER BY ml.created_at DESC
LIMIT 1;

-- 8. 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_iot_readings_device_ts 
ON iot_readings(device_uuid, ts DESC);

CREATE INDEX IF NOT EXISTS idx_iot_readings_tenant_ts 
ON iot_readings(tenant_id, ts DESC);

CREATE INDEX IF NOT EXISTS idx_iot_devices_tenant 
ON iot_devices(tenant_id, device_id);

-- 9. 마이그레이션 완료 알림
DO $$
BEGIN
    RAISE NOTICE 'MQTT Bridge 데이터 마이그레이션이 완료되었습니다.';
    RAISE NOTICE '백업 테이블: sensor_readings_backup';
    RAISE NOTICE '마이그레이션 로그: migration_logs 테이블을 확인하세요.';
END $$;
