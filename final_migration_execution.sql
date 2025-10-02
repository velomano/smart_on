-- =====================================================
-- 최종 마이그레이션 실행 계획 (안전 모드)
-- =====================================================
-- 
-- 🛡️ 안전 우선 원칙:
-- 1. 백업 완료 확인
-- 2. 단계별 검증
-- 3. 롤백 준비
-- 4. 모니터링 강화
-- 
-- =====================================================

-- =====================================================
-- Step 1: 백업 상태 확인
-- =====================================================

-- 백업 파일 존재 확인
-- backup_20251002_114629.sql (스키마)
-- backup_data_20251002_114930.sql (데이터)

-- =====================================================
-- Step 2: 현재 데이터베이스 상태 확인
-- =====================================================

-- 현재 테이블 상태 확인
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_tuples_returned(c.oid) as rows_returned,
    pg_stat_get_tuples_fetched(c.oid) as rows_fetched
FROM pg_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public'
AND tablename IN ('devices', 'iot_devices', 'sensor_readings', 'iot_readings', 'commands', 'iot_commands')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- Step 3: 통합 테이블 생성 (안전 모드)
-- =====================================================

-- 기존 통합 테이블이 있다면 백업
CREATE TABLE IF NOT EXISTS unified_devices_backup AS 
SELECT * FROM unified_devices WHERE FALSE;

CREATE TABLE IF NOT EXISTS unified_readings_backup AS 
SELECT * FROM unified_readings WHERE FALSE;

CREATE TABLE IF NOT EXISTS unified_commands_backup AS 
SELECT * FROM unified_commands WHERE FALSE;

-- 통합 테이블 생성 (기존 파일에서)
-- 이 부분은 db_optimization_plan.sql에서 가져옴

-- =====================================================
-- Step 4: 데이터 마이그레이션 실행
-- =====================================================

-- 마이그레이션 함수 실행
SELECT migrate_to_unified_tables();

-- =====================================================
-- Step 5: 무결성 검증
-- =====================================================

-- 데이터 무결성 검증
SELECT * FROM verify_migration_integrity();

-- =====================================================
-- Step 6: 성능 테스트
-- =====================================================

-- 통합 테이블 성능 확인
EXPLAIN ANALYZE 
SELECT COUNT(*) 
FROM unified_devices 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

EXPLAIN ANALYZE 
SELECT COUNT(*) 
FROM unified_readings 
WHERE ts >= NOW() - INTERVAL '24 hours';

-- =====================================================
-- Step 7: 애플리케이션 호환성 확인
-- =====================================================

-- 기존 API와 호환되는 뷰 생성
CREATE OR REPLACE VIEW vw_devices_compatible AS
SELECT 
    id,
    tenant_id,
    farm_id,
    bed_id,
    type,
    vendor,
    tuya_device_id,
    status,
    meta,
    name,
    created_at,
    updated_at,
    CASE 
        WHEN source_table = 'devices' THEN 'legacy'
        WHEN source_table = 'iot_devices' THEN 'iot'
        ELSE 'unknown'
    END as device_category
FROM unified_devices;

CREATE OR REPLACE VIEW vw_readings_compatible AS
SELECT 
    id,
    sensor_id,
    ts,
    value,
    quality,
    unit,
    created_at
FROM unified_readings
WHERE source_table = 'sensor_readings';

CREATE OR REPLACE VIEW vw_commands_compatible AS
SELECT 
    id,
    device_id,
    issued_by,
    command,
    payload,
    status,
    correlation_id,
    created_at
FROM unified_commands
WHERE source_table = 'commands';

-- =====================================================
-- Step 8: 모니터링 설정
-- =====================================================

-- 성능 모니터링 함수 실행
SELECT * FROM get_db_performance_stats();

-- =====================================================
-- Step 9: 정리 작업 (선택사항)
-- =====================================================

-- 주의: 이 단계는 신중하게 진행
-- 기존 테이블 제거는 애플리케이션 코드 수정 후 진행

/*
-- 기존 테이블 제거 (애플리케이션 코드 수정 후)
-- DROP TABLE IF EXISTS commands CASCADE;
-- DROP TABLE IF EXISTS iot_commands CASCADE;
-- DROP TABLE IF EXISTS sensor_readings CASCADE;
-- DROP TABLE IF EXISTS iot_readings CASCADE;
-- DROP TABLE IF EXISTS devices CASCADE;
-- DROP TABLE IF EXISTS iot_devices CASCADE;
*/

-- =====================================================
-- Step 10: 롤백 준비
-- =====================================================

-- 롤백 함수 생성
CREATE OR REPLACE FUNCTION emergency_rollback()
RETURNS TEXT AS $$
BEGIN
    -- 통합 테이블 삭제
    DROP VIEW IF EXISTS vw_devices_compatible CASCADE;
    DROP VIEW IF EXISTS vw_readings_compatible CASCADE;
    DROP VIEW IF EXISTS vw_commands_compatible CASCADE;
    
    DROP TABLE IF EXISTS unified_commands CASCADE;
    DROP TABLE IF EXISTS unified_readings CASCADE;
    DROP TABLE IF EXISTS unified_devices CASCADE;
    
    -- 함수 삭제
    DROP FUNCTION IF EXISTS migrate_to_unified_tables();
    DROP FUNCTION IF EXISTS verify_migration_integrity();
    DROP FUNCTION IF EXISTS get_db_performance_stats();
    DROP FUNCTION IF EXISTS cleanup_old_data();
    DROP FUNCTION IF EXISTS emergency_rollback();
    
    RETURN 'Emergency rollback completed. All unified tables and functions removed.';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 실행 체크리스트
-- =====================================================

/*
✅ 실행 전 체크리스트:

1. 백업 완료:
   - [ ] backup_20251002_114629.sql (스키마)
   - [ ] backup_data_20251002_114930.sql (데이터)

2. 환경 확인:
   - [ ] 프로덕션 데이터베이스 연결 확인
   - [ ] 충분한 디스크 공간 확인
   - [ ] 애플리케이션 서비스 중단 (필요시)

3. 실행 순서:
   - [ ] Step 1-3: 테이블 생성 및 백업
   - [ ] Step 4: 데이터 마이그레이션
   - [ ] Step 5: 무결성 검증
   - [ ] Step 6: 성능 테스트
   - [ ] Step 7: 호환성 확인
   - [ ] Step 8: 모니터링 설정

4. 문제 발생 시:
   - [ ] SELECT emergency_rollback(); 실행
   - [ ] 백업에서 복원
   - [ ] 문제 분석 및 해결

⚠️ 주의사항:
- 모든 단계에서 결과 확인 필수
- 무결성 검증 실패 시 즉시 롤백
- 애플리케이션 테스트 후 기존 테이블 제거
*/
