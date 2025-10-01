-- =====================================================
-- Device Profiles & Registry Schema
-- Universal Bridge v2.0 - Dynamic UI System
-- =====================================================

-- ==================== Device Profiles ====================
-- 디바이스 종류별 능력 명세 (템플릿)
CREATE TABLE IF NOT EXISTS device_profiles (
  id TEXT PRIMARY KEY,  -- 'esp32-dht22-v1'
  version TEXT NOT NULL DEFAULT '1.0.0',  -- Semver
  scope TEXT NOT NULL DEFAULT 'public',  -- 'public' | 'tenant'
  tenant_id UUID NULL,  -- scope='tenant'일 때만
  name TEXT NOT NULL,
  manufacturer TEXT,
  capabilities JSONB NOT NULL,  -- { sensors: [], actuators: [] }
  ui_template JSONB,  -- 레이아웃/카드 정의
  safety_rules JSONB,  -- 안전 규칙 (interlock, duration 등)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_profiles_tenant ON device_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_profiles_scope ON device_profiles(scope);

-- ==================== Device Registry ====================
-- 실제 디바이스가 신고한 능력 (런타임)
CREATE TABLE IF NOT EXISTS device_registry (
  device_id UUID PRIMARY KEY,
  version TEXT NOT NULL DEFAULT '1.0.0',
  profile_id TEXT NULL REFERENCES device_profiles(id),
  tenant_id UUID NOT NULL,
  capabilities JSONB NOT NULL,  -- 실제 하드웨어 능력
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_registry_tenant ON device_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_registry_profile ON device_registry(profile_id);

-- ==================== User UI Templates ====================
-- 사용자가 커스터마이징한 UI 템플릿
CREATE TABLE IF NOT EXISTS device_ui_templates (
  device_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  template JSONB NOT NULL,  -- 사용자 레이아웃
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_ui_templates_tenant ON device_ui_templates(tenant_id);

-- ==================== RLS Policies ====================
-- Service Role만 접근 (백엔드에서 처리)
ALTER TABLE device_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_ui_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_profiles_service_role ON device_profiles;
CREATE POLICY device_profiles_service_role ON device_profiles
  FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS device_registry_service_role ON device_registry;
CREATE POLICY device_registry_service_role ON device_registry
  FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS device_ui_templates_service_role ON device_ui_templates;
CREATE POLICY device_ui_templates_service_role ON device_ui_templates
  FOR ALL TO service_role USING (true);

-- ==================== Sample Data ====================
-- ESP32 + DHT22 프로파일 (공용)
INSERT INTO device_profiles (id, version, scope, name, capabilities, ui_template)
VALUES (
  'esp32-dht22-v1',
  '1.0.0',
  'public',
  'ESP32 + DHT22 온습도 센서',
  '{
    "sensors": [
      {
        "key": "temperature",
        "canonical_key": "temp",
        "label": "온도",
        "labels": {"ko": "온도", "en": "Temperature"},
        "unit": "°C",
        "display_unit": "°C",
        "kind": "temperature",
        "range": {"min": -40, "max": 80},
        "accuracy": 0.5
      },
      {
        "key": "humidity",
        "canonical_key": "hum",
        "label": "습도",
        "labels": {"ko": "습도", "en": "Humidity"},
        "unit": "%",
        "display_unit": "%",
        "kind": "humidity",
        "range": {"min": 0, "max": 100},
        "accuracy": 2
      }
    ],
    "actuators": []
  }'::jsonb,
  '{
    "version": "1",
    "layout": "grid-2col",
    "cards": [
      {"type": "line-chart", "series": ["temp", "hum"], "span": 12},
      {"type": "gauge", "metric": "temp", "thresholds": {"warn": 30, "danger": 35}, "span": 6},
      {"type": "gauge", "metric": "hum", "thresholds": {"warn": 80}, "span": 6}
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET
  capabilities = EXCLUDED.capabilities,
  ui_template = EXCLUDED.ui_template,
  updated_at = NOW();

-- ESP32 + 2채널 릴레이 프로파일
INSERT INTO device_profiles (id, version, scope, name, capabilities, ui_template, safety_rules)
VALUES (
  'esp32-relay2ch-v1',
  '1.0.0',
  'public',
  'ESP32 + 2채널 릴레이',
  '{
    "sensors": [],
    "actuators": [
      {
        "type": "relay",
        "canonical_key": "relay",
        "label": "릴레이",
        "labels": {"ko": "릴레이", "en": "Relay"},
        "channels": 2,
        "commands": [
          {"id": "on", "label": "켜기", "labels": {"ko": "켜기", "en": "ON"}, "payload": {"state": "on"}},
          {"id": "off", "label": "끄기", "labels": {"ko": "끄기", "en": "OFF"}, "payload": {"state": "off"}},
          {"id": "toggle", "label": "토글", "labels": {"ko": "토글", "en": "Toggle"}, "payload": {"state": "toggle"}}
        ]
      }
    ]
  }'::jsonb,
  '{
    "version": "1",
    "layout": "grid-1col",
    "cards": [
      {"type": "actuator", "actuatorType": "relay", "channels": 2, "span": 12}
    ]
  }'::jsonb,
  '{
    "interlock": [1, 2],
    "max_duration": 300,
    "cooldown": 5
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET
  capabilities = EXCLUDED.capabilities,
  ui_template = EXCLUDED.ui_template,
  safety_rules = EXCLUDED.safety_rules,
  updated_at = NOW();

-- ==================== Functions ====================
-- UI Model 생성 함수
CREATE OR REPLACE FUNCTION build_device_ui_model(p_device_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_device RECORD;
  v_profile JSONB;
  v_registry JSONB;
  v_user_template JSONB;
  v_result JSONB;
BEGIN
  -- 1. Device 정보 조회
  SELECT * INTO v_device FROM iot_devices WHERE id = p_device_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Device not found: %', p_device_id;
  END IF;
  
  -- 2. Registry 조회
  SELECT capabilities INTO v_registry FROM device_registry WHERE device_id = p_device_id;
  
  -- 3. Profile 조회
  SELECT capabilities, ui_template INTO v_profile 
  FROM device_profiles 
  WHERE id = v_device.profile_id;
  
  -- 4. User Template 조회
  SELECT template INTO v_user_template FROM device_ui_templates WHERE device_id = p_device_id;
  
  -- 5. Merge (우선순위: Registry > Profile)
  v_result := jsonb_build_object(
    'device', jsonb_build_object('id', v_device.id, 'tenant_id', v_device.tenant_id),
    'capabilities', COALESCE(v_registry, v_profile, '{}'::jsonb),
    'template', COALESCE(v_user_template, v_profile->'ui_template', '{}'::jsonb),
    'updated_at', NOW()
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE device_profiles IS 'Device Profile - 디바이스 종류별 능력 명세';
COMMENT ON TABLE device_registry IS 'Device Registry - 실제 하드웨어가 신고한 능력';
COMMENT ON TABLE device_ui_templates IS 'User UI Templates - 사용자 커스터마이징';
COMMENT ON FUNCTION build_device_ui_model IS 'UI Model 자동 생성 (Registry > Profile > Auto)';

