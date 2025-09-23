-- 테스트용 더미 데이터
-- 테넌트 생성
insert into tenants (id, name) values 
  ('550e8400-e29b-41d4-a716-446655440000', '테스트 팜');

-- 사용자 생성 (Supabase Auth와 연동될 예정)
insert into users (id, email, name) values 
  ('550e8400-e29b-41d4-a716-446655440001', 'test@example.com', '테스트 사용자');

-- 멤버십 생성
insert into memberships (tenant_id, user_id, role) values 
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'owner');

-- 팜 생성
insert into farms (id, tenant_id, name, location) values 
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '메인 팜', '서울시 강남구');

-- 베드 생성 (3개 조, 각 2개 베드)
insert into beds (id, farm_id, name, crop, target_temp, target_humidity, target_ec, target_ph) values 
  -- 조1 베드들
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '조1-베드1', '토마토', 25.0, 60.0, 2.0, 6.5),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '조1-베드2', '상추', 22.0, 65.0, 1.5, 6.0),
  -- 조2 베드들
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '조2-베드1', '오이', 26.0, 70.0, 2.2, 6.2),
  ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', '조2-베드2', '고추', 28.0, 55.0, 2.5, 6.8),
  -- 조3 베드들
  ('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', '조3-베드1', '딸기', 20.0, 75.0, 1.8, 5.8),
  ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', '조3-베드2', '바질', 24.0, 60.0, 1.2, 6.3);

-- 디바이스 생성 (각 베드별 센서 게이트웨이 + 제어 장치)
insert into devices (id, farm_id, bed_id, type, vendor, status, meta) values 
  -- 조1 디바이스들
  ('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'sensor_gateway', 'custom', '{"online": true}', '{"pi_id": "pi-001", "location": "조1-베드1"}'),
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'light', 'tuya', '{"online": true, "on": false}', '{"tuya_device_id": "tuya_light_001", "channel": "relay1"}'),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'fan', 'tuya', '{"online": true, "on": false}', '{"tuya_device_id": "tuya_fan_001", "channel": "relay2"}'),
  
  -- 조2 디바이스들
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'sensor_gateway', 'custom', '{"online": true}', '{"pi_id": "pi-002", "location": "조2-베드1"}'),
  ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'pump', 'tuya', '{"online": true, "on": false}', '{"tuya_device_id": "tuya_pump_001", "channel": "relay1"}'),
  
  -- 조3 디바이스들
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', 'sensor_gateway', 'custom', '{"online": true}', '{"pi_id": "pi-003", "location": "조3-베드1"}'),
  ('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', 'motor', 'tuya', '{"online": true, "on": false}', '{"tuya_device_id": "tuya_motor_001", "channel": "relay1"}');

-- 센서 생성
insert into sensors (id, device_id, type, unit, meta) values 
  -- 조1 센서들
  ('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440009', 'temp', '°C', '{"sensor_model": "DHT22", "pin": 2}'),
  ('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440009', 'humidity', '%', '{"sensor_model": "DHT22", "pin": 2}'),
  ('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440009', 'ec', 'mS/cm', '{"sensor_model": "EC-5", "pin": 3}'),
  ('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440009', 'ph', 'pH', '{"sensor_model": "pH-4502C", "pin": 4}'),
  
  -- 조2 센서들
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440012', 'temp', '°C', '{"sensor_model": "DHT22", "pin": 2}'),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440012', 'humidity', '%', '{"sensor_model": "DHT22", "pin": 2}'),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', 'lux', 'lux', '{"sensor_model": "BH1750", "pin": 5}'),
  
  -- 조3 센서들
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440014', 'temp', '°C', '{"sensor_model": "DHT22", "pin": 2}'),
  ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', 'humidity', '%', '{"sensor_model": "DHT22", "pin": 2}'),
  ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440014', 'water_temp', '°C', '{"sensor_model": "DS18B20", "pin": 6}');

-- 샘플 센서 데이터 (최근 24시간)
insert into sensor_readings (sensor_id, ts, value, quality) 
select 
  s.id,
  ts_series as ts,
  case s.type
    when 'temp' then 20 + random() * 10 + sin(extract(epoch from ts_series) / 3600) * 3
    when 'humidity' then 50 + random() * 20 + cos(extract(epoch from ts_series) / 3600) * 10
    when 'ec' then 1.5 + random() * 1.0
    when 'ph' then 6.0 + random() * 1.0
    when 'lux' then 100 + random() * 500 + sin(extract(epoch from ts_series) / 3600) * 200
    when 'water_temp' then 18 + random() * 8
    else 0
  end as value,
  1 as quality
from sensors s,
generate_series(
  now() - interval '24 hours',
  now(),
  interval '5 minutes'
) as ts_series
where s.device_id in (
  '550e8400-e29b-41d4-a716-446655440009',
  '550e8400-e29b-41d4-a716-446655440012', 
  '550e8400-e29b-41d4-a716-446655440014'
);
