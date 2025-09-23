-- 🌱 스마트팜 데이터베이스 스키마
-- Supabase PostgreSQL 기반

-- =============================================
-- 기본 테이블 생성
-- =============================================

-- 사용자 테이블 (Supabase Auth와 연동)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raspberry Pi 기기 테이블
CREATE TABLE IF NOT EXISTS raspberry_pis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pi_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 센서 타입 테이블
CREATE TABLE IF NOT EXISTS sensor_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  unit TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 센서 테이블
CREATE TABLE IF NOT EXISTS sensors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pi_id UUID REFERENCES raspberry_pis(id) ON DELETE CASCADE,
  sensor_type_id UUID REFERENCES sensor_types(id),
  name TEXT NOT NULL,
  pin_number INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 센서 데이터 테이블
CREATE TABLE IF NOT EXISTS sensor_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sensor_id UUID REFERENCES sensors(id) ON DELETE CASCADE,
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- 제어 명령 테이블
CREATE TABLE IF NOT EXISTS control_commands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pi_id UUID REFERENCES raspberry_pis(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL,
  command_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'executed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id)
);

-- Tuya 디바이스 테이블
CREATE TABLE IF NOT EXISTS tuya_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  device_type TEXT,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 인덱스 생성
-- =============================================

-- 센서 데이터 조회 최적화
CREATE INDEX IF NOT EXISTS idx_sensor_data_sensor_id_timestamp 
ON sensor_data(sensor_id, timestamp DESC);

-- 제어 명령 조회 최적화
CREATE INDEX IF NOT EXISTS idx_control_commands_pi_id_status 
ON control_commands(pi_id, status, created_at DESC);

-- Pi 상태 조회 최적화
CREATE INDEX IF NOT EXISTS idx_raspberry_pis_status 
ON raspberry_pis(status);

-- =============================================
-- 기본 데이터 삽입
-- =============================================

-- 센서 타입 기본 데이터
INSERT INTO sensor_types (name, unit, description) VALUES
('temperature', '°C', '온도 센서'),
('humidity', '%', '습도 센서'),
('soil_moisture', '%', '토양 수분 센서'),
('light', 'lux', '조도 센서'),
('ph', 'pH', 'pH 센서'),
('water_level', 'cm', '수위 센서')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 함수 및 트리거
-- =============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 적용
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_raspberry_pis_updated_at BEFORE UPDATE ON raspberry_pis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON sensors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tuya_devices_updated_at BEFORE UPDATE ON tuya_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 뷰 생성
-- =============================================

-- 최신 센서 데이터 뷰
CREATE OR REPLACE VIEW latest_sensor_data AS
SELECT 
    s.id as sensor_id,
    s.name as sensor_name,
    st.name as sensor_type,
    st.unit,
    sd.value,
    sd.timestamp,
    rp.pi_id,
    rp.name as pi_name,
    rp.location
FROM sensors s
JOIN sensor_types st ON s.sensor_type_id = st.id
JOIN raspberry_pis rp ON s.pi_id = rp.id
LEFT JOIN LATERAL (
    SELECT value, timestamp
    FROM sensor_data
    WHERE sensor_id = s.id
    ORDER BY timestamp DESC
    LIMIT 1
) sd ON true;

-- Pi 상태 요약 뷰
CREATE OR REPLACE VIEW pi_status_summary AS
SELECT 
    rp.id,
    rp.pi_id,
    rp.name,
    rp.location,
    rp.status,
    rp.last_seen,
    COUNT(s.id) as sensor_count,
    COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_sensors
FROM raspberry_pis rp
LEFT JOIN sensors s ON rp.id = s.pi_id
GROUP BY rp.id, rp.pi_id, rp.name, rp.location, rp.status, rp.last_seen;
