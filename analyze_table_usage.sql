-- =====================================================
-- 테이블 사용량 및 데이터량 분석 쿼리
-- =====================================================

-- 1. 테이블별 행 수 및 크기 분석
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    most_common_vals,
    most_common_freqs,
    histogram_bounds
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN (
    'acid_bases', 'adjustments', 'alerts', 'audits', 'bed_crop_data', 'beds', 
    'commands', 'crop_alias', 'crop_profiles', 'device_claims', 'device_profiles', 
    'device_registry', 'device_ui_templates', 'devices', 'farm_memberships', 
    'farm_mqtt_configs', 'farms', 'iot_commands', 'iot_devices', 'iot_readings', 
    'memberships', 'mixing_instructions', 'mixing_rules', 'modbus_configs', 
    'nutrient_ions', 'nutrient_jobs', 'nutrient_recipe_aliases', 'nutrient_recipes', 
    'nutrient_sources', 'recipe_lines', 'recipes', 'rules', 'salts', 
    'sensor_readings', 'sensors', 'tenants', 'transport_configs', 'user_invites', 
    'user_settings', 'users', 'water_profiles'
)
ORDER BY tablename, attname;

-- 2. 테이블별 행 수 및 크기
SELECT 
    t.table_name,
    COALESCE(t.row_count, 0) as row_count,
    pg_size_pretty(COALESCE(s.table_size, 0)) as table_size,
    pg_size_pretty(COALESCE(s.index_size, 0)) as index_size,
    pg_size_pretty(COALESCE(s.total_size, 0)) as total_size
FROM (
    SELECT 
        table_name,
        CASE 
            WHEN table_name = 'acid_bases' THEN (SELECT COUNT(*) FROM acid_bases)
            WHEN table_name = 'adjustments' THEN (SELECT COUNT(*) FROM adjustments)
            WHEN table_name = 'alerts' THEN (SELECT COUNT(*) FROM alerts)
            WHEN table_name = 'audits' THEN (SELECT COUNT(*) FROM audits)
            WHEN table_name = 'bed_crop_data' THEN (SELECT COUNT(*) FROM bed_crop_data)
            WHEN table_name = 'beds' THEN (SELECT COUNT(*) FROM beds)
            WHEN table_name = 'commands' THEN (SELECT COUNT(*) FROM commands)
            WHEN table_name = 'crop_alias' THEN (SELECT COUNT(*) FROM crop_alias)
            WHEN table_name = 'crop_profiles' THEN (SELECT COUNT(*) FROM crop_profiles)
            WHEN table_name = 'device_claims' THEN (SELECT COUNT(*) FROM device_claims)
            WHEN table_name = 'device_profiles' THEN (SELECT COUNT(*) FROM device_profiles)
            WHEN table_name = 'device_registry' THEN (SELECT COUNT(*) FROM device_registry)
            WHEN table_name = 'device_ui_templates' THEN (SELECT COUNT(*) FROM device_ui_templates)
            WHEN table_name = 'devices' THEN (SELECT COUNT(*) FROM devices)
            WHEN table_name = 'farm_memberships' THEN (SELECT COUNT(*) FROM farm_memberships)
            WHEN table_name = 'farm_mqtt_configs' THEN (SELECT COUNT(*) FROM farm_mqtt_configs)
            WHEN table_name = 'farms' THEN (SELECT COUNT(*) FROM farms)
            WHEN table_name = 'iot_commands' THEN (SELECT COUNT(*) FROM iot_commands)
            WHEN table_name = 'iot_devices' THEN (SELECT COUNT(*) FROM iot_devices)
            WHEN table_name = 'iot_readings' THEN (SELECT COUNT(*) FROM iot_readings)
            WHEN table_name = 'memberships' THEN (SELECT COUNT(*) FROM memberships)
            WHEN table_name = 'mixing_instructions' THEN (SELECT COUNT(*) FROM mixing_instructions)
            WHEN table_name = 'mixing_rules' THEN (SELECT COUNT(*) FROM mixing_rules)
            WHEN table_name = 'modbus_configs' THEN (SELECT COUNT(*) FROM modbus_configs)
            WHEN table_name = 'nutrient_ions' THEN (SELECT COUNT(*) FROM nutrient_ions)
            WHEN table_name = 'nutrient_jobs' THEN (SELECT COUNT(*) FROM nutrient_jobs)
            WHEN table_name = 'nutrient_recipe_aliases' THEN (SELECT COUNT(*) FROM nutrient_recipe_aliases)
            WHEN table_name = 'nutrient_recipes' THEN (SELECT COUNT(*) FROM nutrient_recipes)
            WHEN table_name = 'nutrient_sources' THEN (SELECT COUNT(*) FROM nutrient_sources)
            WHEN table_name = 'recipe_lines' THEN (SELECT COUNT(*) FROM recipe_lines)
            WHEN table_name = 'recipes' THEN (SELECT COUNT(*) FROM recipes)
            WHEN table_name = 'rules' THEN (SELECT COUNT(*) FROM rules)
            WHEN table_name = 'salts' THEN (SELECT COUNT(*) FROM salts)
            WHEN table_name = 'sensor_readings' THEN (SELECT COUNT(*) FROM sensor_readings)
            WHEN table_name = 'sensors' THEN (SELECT COUNT(*) FROM sensors)
            WHEN table_name = 'tenants' THEN (SELECT COUNT(*) FROM tenants)
            WHEN table_name = 'transport_configs' THEN (SELECT COUNT(*) FROM transport_configs)
            WHEN table_name = 'user_invites' THEN (SELECT COUNT(*) FROM user_invites)
            WHEN table_name = 'user_settings' THEN (SELECT COUNT(*) FROM user_settings)
            WHEN table_name = 'users' THEN (SELECT COUNT(*) FROM users)
            WHEN table_name = 'water_profiles' THEN (SELECT COUNT(*) FROM water_profiles)
        END as row_count
    FROM (
        SELECT unnest(ARRAY[
            'acid_bases', 'adjustments', 'alerts', 'audits', 'bed_crop_data', 'beds', 
            'commands', 'crop_alias', 'crop_profiles', 'device_claims', 'device_profiles', 
            'device_registry', 'device_ui_templates', 'devices', 'farm_memberships', 
            'farm_mqtt_configs', 'farms', 'iot_commands', 'iot_devices', 'iot_readings', 
            'memberships', 'mixing_instructions', 'mixing_rules', 'modbus_configs', 
            'nutrient_ions', 'nutrient_jobs', 'nutrient_recipe_aliases', 'nutrient_recipes', 
            'nutrient_sources', 'recipe_lines', 'recipes', 'rules', 'salts', 
            'sensor_readings', 'sensors', 'tenants', 'transport_configs', 'user_invites', 
            'user_settings', 'users', 'water_profiles'
        ]) as table_name
    ) t
) t
LEFT JOIN (
    SELECT 
        schemaname,
        tablename as table_name,
        pg_total_relation_size(schemaname||'.'||tablename) as table_size,
        pg_indexes_size(schemaname||'.'||tablename) as index_size,
        pg_total_relation_size(schemaname||'.'||tablename) as total_size
    FROM pg_tables 
    WHERE schemaname = 'public'
) s ON t.table_name = s.table_name
ORDER BY COALESCE(s.total_size, 0) DESC;

-- 3. 인덱스 사용률 분석
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 4. 테이블 접근 패턴 분석
SELECT 
    schemaname,
    tablename,
    seq_scan as sequential_scans,
    seq_tup_read as sequential_tuples_read,
    idx_scan as index_scans,
    idx_tup_fetch as index_tuples_fetched,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY seq_scan + idx_scan DESC;
