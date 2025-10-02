-- =====================================================
-- 성능 최적화 및 인덱스 개선
-- =====================================================

-- =====================================================
-- 1. 기존 테이블 성능 분석
-- =====================================================

-- 테이블 크기 및 행 수 분석
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN ('sensor_readings', 'iot_readings', 'commands', 'iot_commands', 'devices', 'iot_devices')
ORDER BY tablename, attname;

-- =====================================================
-- 2. 누락된 인덱스 식별
-- =====================================================

-- 자주 사용되는 쿼리 패턴에 맞는 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_sensor_readings_ts_quality 
    ON sensor_readings(ts DESC, quality) 
    WHERE quality = 1;

CREATE INDEX IF NOT EXISTS idx_iot_readings_tenant_device_key 
    ON iot_readings(tenant_id, device_id, key, ts DESC);

CREATE INDEX IF NOT EXISTS idx_commands_status_created 
    ON commands(status, created_at DESC) 
    WHERE status IN ('pending', 'sent');

CREATE INDEX IF NOT EXISTS idx_iot_commands_pending_retry 
    ON iot_commands(tenant_id, status, retry_count) 
    WHERE status IN ('pending', 'sent');

-- =====================================================
-- 3. 파티셔닝 고려사항
-- =====================================================

-- sensor_readings 파티셔닝 (월별)
-- 주의: 파티셔닝은 데이터량이 많을 때만 적용
/*
CREATE TABLE sensor_readings_partitioned (
    LIKE sensor_readings INCLUDING ALL
) PARTITION BY RANGE (ts);

-- 월별 파티션 생성 예시
CREATE TABLE sensor_readings_2025_10 PARTITION OF sensor_readings_partitioned
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE sensor_readings_2025_11 PARTITION OF sensor_readings_partitioned
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
*/

-- =====================================================
-- 4. 통계 정보 업데이트
-- =====================================================

-- 테이블 통계 정보 업데이트 (성능 향상)
ANALYZE sensor_readings;
ANALYZE iot_readings;
ANALYZE commands;
ANALYZE iot_commands;
ANALYZE devices;
ANALYZE iot_devices;

-- =====================================================
-- 5. 쿼리 성능 최적화 뷰
-- =====================================================

-- 최근 센서 데이터 조회 최적화 뷰
CREATE OR REPLACE VIEW vw_recent_sensor_data AS
SELECT 
    s.id as sensor_id,
    d.id as device_id,
    d.name as device_name,
    f.name as farm_name,
    t.name as tenant_name,
    sr.value,
    sr.unit,
    sr.ts,
    sr.quality
FROM sensor_readings sr
JOIN sensors s ON sr.sensor_id = s.id
JOIN devices d ON s.device_id = d.id
JOIN farms f ON d.farm_id = f.id
JOIN tenants t ON f.tenant_id = t.id
WHERE sr.ts >= NOW() - INTERVAL '24 hours'
ORDER BY sr.ts DESC;

-- IoT 디바이스 상태 조회 최적화 뷰
CREATE OR REPLACE VIEW vw_iot_device_status AS
SELECT 
    id.id,
    id.device_id,
    id.tenant_id,
    t.name as tenant_name,
    f.name as farm_name,
    id.device_type,
    id.fw_version,
    id.capabilities,
    id.last_seen_at,
    id.status,
    CASE 
        WHEN id.last_seen_at > NOW() - INTERVAL '5 minutes' THEN 'online'
        WHEN id.last_seen_at > NOW() - INTERVAL '1 hour' THEN 'recent'
        ELSE 'offline'
    END as connection_status
FROM iot_devices id
JOIN tenants t ON id.tenant_id = t.id
LEFT JOIN farms f ON id.farm_id = f.id
ORDER BY id.last_seen_at DESC;

-- =====================================================
-- 6. 자동 정리 함수
-- =====================================================

-- 오래된 데이터 자동 정리 함수
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TEXT AS $$
DECLARE
    deleted_sensor_readings INTEGER := 0;
    deleted_iot_readings INTEGER := 0;
    deleted_commands INTEGER := 0;
    deleted_iot_commands INTEGER := 0;
    deleted_audits INTEGER := 0;
BEGIN
    -- 6개월 이상 된 센서 데이터 삭제
    DELETE FROM sensor_readings 
    WHERE ts < NOW() - INTERVAL '6 months';
    GET DIAGNOSTICS deleted_sensor_readings = ROW_COUNT;
    
    -- 6개월 이상 된 IoT 데이터 삭제
    DELETE FROM iot_readings 
    WHERE ts < NOW() - INTERVAL '6 months';
    GET DIAGNOSTICS deleted_iot_readings = ROW_COUNT;
    
    -- 3개월 이상 된 완료된 명령 삭제
    DELETE FROM commands 
    WHERE status IN ('acked', 'failed') 
    AND created_at < NOW() - INTERVAL '3 months';
    GET DIAGNOSTICS deleted_commands = ROW_COUNT;
    
    -- 3개월 이상 된 완료된 IoT 명령 삭제
    DELETE FROM iot_commands 
    WHERE status IN ('acked', 'failed') 
    AND created_at < NOW() - INTERVAL '3 months';
    GET DIAGNOSTICS deleted_iot_commands = ROW_COUNT;
    
    -- 1년 이상 된 감사 로그 삭제
    DELETE FROM audits 
    WHERE ts < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS deleted_audits = ROW_COUNT;
    
    RETURN FORMAT('Cleanup completed: %s sensor_readings, %s iot_readings, %s commands, %s iot_commands, %s audits deleted', 
                 deleted_sensor_readings, deleted_iot_readings, deleted_commands, deleted_iot_commands, deleted_audits);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. 모니터링 함수
-- =====================================================

-- 데이터베이스 성능 모니터링 함수
CREATE OR REPLACE FUNCTION get_db_performance_stats()
RETURNS TABLE(
    table_name TEXT,
    table_size TEXT,
    index_size TEXT,
    total_size TEXT,
    row_count BIGINT,
    seq_scan BIGINT,
    seq_tup_read BIGINT,
    idx_scan BIGINT,
    idx_tup_fetch BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))::TEXT,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename))::TEXT,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))::TEXT,
        t.n_live_tup,
        s.seq_scan,
        s.seq_tup_read,
        s.idx_scan,
        s.idx_tup_fetch
    FROM pg_stat_user_tables s
    JOIN pg_tables t ON s.relname = t.tablename
    WHERE t.schemaname = 'public'
    ORDER BY pg_total_relation_size(t.schemaname||'.'||t.tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. 최적화 권장사항
-- =====================================================

/*
🎯 성능 최적화 권장사항:

1. 인덱스 최적화:
   - 자주 사용되는 쿼리 패턴에 맞는 복합 인덱스 추가
   - 부분 인덱스 활용 (WHERE 조건이 있는 인덱스)
   - 불필요한 인덱스 제거

2. 쿼리 최적화:
   - EXPLAIN ANALYZE로 쿼리 실행 계획 분석
   - N+1 쿼리 문제 해결
   - 적절한 JOIN 사용

3. 데이터 관리:
   - 정기적인 데이터 정리 (cleanup_old_data 함수 활용)
   - 파티셔닝 고려 (대용량 테이블)
   - 통계 정보 주기적 업데이트

4. 모니터링:
   - get_db_performance_stats() 함수로 정기 모니터링
   - 느린 쿼리 로그 분석
   - 인덱스 사용률 모니터링

5. 캐싱 전략:
   - 자주 조회되는 데이터는 Redis 등 캐시 활용
   - Materialized View 활용
   - 애플리케이션 레벨 캐싱
*/
