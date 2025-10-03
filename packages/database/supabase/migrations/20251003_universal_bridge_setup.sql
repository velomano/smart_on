-- Universal Bridge 초기 설정
-- 실행 전에 Supabase 프로젝트 설정에서 API 키를 확인하세요

-- 1. 테넌트 설정 확인
INSERT INTO tenants (id, name, domain, status, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Tenant',
  'localhost',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 2. Universal Bridge 디바이스 등록
INSERT INTO iot_devices (id, device_id, tenant_id, name, type, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'universal-bridge-server',
  '00000000-0000-0000-0000-000000000001',
  'Universal Bridge Server',
  'bridge',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (device_id, tenant_id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 3. 테스트 농장 생성 (Universal Bridge 테스트용)
INSERT INTO farms (id, tenant_id, name, location, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Test Farm for Universal Bridge',
  'Test Location',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 4. 테스트 디바이스 생성
INSERT INTO iot_devices (id, device_id, tenant_id, farm_id, name, type, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'test-sensor-001',
  '00000000-0000-0000-0000-000000000001',
  f.id,
  'Test Temperature Sensor',
  'sensor',
  'active',
  NOW(),
  NOW()
FROM farms f 
WHERE f.tenant_id = '00000000-0000-0000-0000-000000000001' 
  AND f.name = 'Test Farm for Universal Bridge'
LIMIT 1
ON CONFLICT (device_id, tenant_id) DO UPDATE SET
  farm_id = EXCLUDED.farm_id,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 5. 테스트 센서 데이터 생성
INSERT INTO iot_readings (id, device_id, key, value, unit, ts, created_at)
SELECT 
  gen_random_uuid(),
  id,
  'temperature',
  (20 + random() * 10)::numeric(10,2),
  '°C',
  NOW() - (random() * interval '1 hour'),
  NOW()
FROM iot_devices 
WHERE device_id = 'test-sensor-001'
  AND tenant_id = '00000000-0000-0000-0000-000000000001'
LIMIT 10;

-- 6. 환경 변수 확인 쿼리
SELECT 
  'SUPABASE_URL' as env_var,
  'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co' as value
UNION ALL
SELECT 
  'BRIDGE_TENANT_ID' as env_var,
  '00000000-0000-0000-0000-000000000001' as value
UNION ALL
SELECT 
  'JWT_SECRET' as env_var,
  'your-jwt-secret-key-here' as value;

-- 7. 설정 확인
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.status as tenant_status,
  COUNT(f.id) as farm_count,
  COUNT(d.id) as device_count
FROM tenants t
LEFT JOIN farms f ON f.tenant_id = t.id
LEFT JOIN iot_devices d ON d.tenant_id = t.id
WHERE t.id = '00000000-0000-0000-0000-000000000001'
GROUP BY t.id, t.name, t.status;
