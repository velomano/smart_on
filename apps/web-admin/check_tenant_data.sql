-- 현재 데이터베이스의 테넌트 분포 확인

-- 1. 전체 테넌트 목록
SELECT 'tenants' as table_name, COUNT(*) as count, 
       STRING_AGG(DISTINCT id::text, ', ') as tenant_ids
FROM tenants;

-- 2. 사용자별 테넌트 분포
SELECT 'users' as table_name, 
       tenant_id, 
       COUNT(*) as user_count,
       STRING_AGG(email, ', ') as emails
FROM users
GROUP BY tenant_id;

-- 3. 농장별 테넌트 분포  
SELECT 'farms' as table_name,
       tenant_id,
       COUNT(*) as farm_count,
       STRING_AGG(name, ', ') as farm_names
FROM farms
GROUP BY tenant_id;

-- 4. farm_memberships 테넌트 분포
SELECT 'farm_memberships' as table_name,
       tenant_id,
       COUNT(*) as membership_count
FROM farm_memberships
GROUP BY tenant_id;

-- 5. 디바이스 수 (farm을 통한 간접 확인)
SELECT 'devices' as table_name,
       f.tenant_id,
       COUNT(d.id) as device_count
FROM devices d
JOIN farms f ON d.farm_id = f.id
GROUP BY f.tenant_id;

-- 6. 센서 데이터 수 (device → farm을 통한 간접 확인)
SELECT 'sensor_readings' as table_name,
       f.tenant_id,
       COUNT(sr.id) as reading_count
FROM sensor_readings sr
JOIN sensors s ON sr.sensor_id = s.id
JOIN devices d ON s.device_id = d.id
JOIN farms f ON d.farm_id = f.id
GROUP BY f.tenant_id
LIMIT 10;

-- 7. bed_crop_data 테넌트 확인 (device → farm을 통한 간접 확인)
SELECT 'bed_crop_data' as table_name,
       f.tenant_id,
       COUNT(bcd.id) as crop_data_count
FROM bed_crop_data bcd
JOIN devices d ON bcd.device_id = d.id
JOIN farms f ON d.farm_id = f.id
GROUP BY f.tenant_id;

-- 8. 공용 데이터 확인 (tenant_id 없음 - 모든 테넌트 공유)
SELECT 'nutrient_recipes' as table_name, COUNT(*) as count, 'SHARED' as tenant_type
FROM nutrient_recipes
UNION ALL
SELECT 'crop_profiles' as table_name, COUNT(*) as count, 'SHARED' as tenant_type
FROM crop_profiles
UNION ALL
SELECT 'nutrient_sources' as table_name, COUNT(*) as count, 'SHARED' as tenant_type
FROM nutrient_sources;

-- 결론 요약
SELECT 
  '=== 테넌트 데이터 요약 ===' as summary,
  (SELECT COUNT(DISTINCT tenant_id) FROM users) as total_tenants,
  (SELECT COUNT(*) FROM users WHERE tenant_id = '00000000-0000-0000-0000-000000000001') as default_tenant_users,
  (SELECT COUNT(*) FROM farms WHERE tenant_id = '00000000-0000-0000-0000-000000000001') as default_tenant_farms,
  (SELECT COUNT(*) FROM nutrient_recipes) as shared_recipes;

