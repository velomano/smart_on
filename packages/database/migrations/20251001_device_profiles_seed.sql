-- =====================================================
-- Device Profiles Seed Data (개선 버전)
-- =====================================================
-- 
-- ESP32 기반 디바이스 프로파일 2종:
-- 1. esp32-dht22-v1: 온습도 센서
-- 2. esp32-relay2ch-v1: 2채널 릴레이
--
-- 이 프로파일은 Dynamic UI 시스템에서 자동으로 UI를 생성합니다.
-- =====================================================

-- 1️⃣ ESP32 + DHT22 온습도 센서
INSERT INTO device_profiles (
  id, 
  version, 
  scope, 
  tenant_id, 
  name, 
  manufacturer,
  capabilities, 
  ui_template,
  safety_rules
)
VALUES (
  'esp32-dht22-v1',
  '1.0.0',
  'public',
  NULL,
  'ESP32 + DHT22 온습도 센서',
  'Generic',
  '{
    "sensors": [
      {
        "key": "temperature",
        "canonical_key": "temp",
        "label": "온도",
        "labels": {"en": "Temperature", "ko": "온도"},
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
        "labels": {"en": "Humidity", "ko": "습도"},
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
      {"type": "gauge", "metric": "temp", "span": 6, "thresholds": {"warn": 30, "danger": 35}},
      {"type": "gauge", "metric": "hum", "span": 6, "thresholds": {"warn": 80}}
    ]
  }'::jsonb,
  NULL
)
ON CONFLICT (id) DO UPDATE
  SET version = EXCLUDED.version,
      name = EXCLUDED.name,
      manufacturer = EXCLUDED.manufacturer,
      capabilities = EXCLUDED.capabilities,
      ui_template = EXCLUDED.ui_template,
      safety_rules = EXCLUDED.safety_rules,
      updated_at = NOW();

-- 2️⃣ ESP32 + 2채널 릴레이
INSERT INTO device_profiles (
  id, 
  version, 
  scope, 
  tenant_id, 
  name, 
  manufacturer,
  capabilities, 
  ui_template,
  safety_rules
)
VALUES (
  'esp32-relay2ch-v1',
  '1.0.0',
  'public',
  NULL,
  'ESP32 + 2채널 릴레이',
  'Generic',
  '{
    "sensors": [],
    "actuators": [
      {
        "type": "relay",
        "canonical_key": "relay",
        "channels": 2,
        "label": "릴레이",
        "labels": {"en": "Relay", "ko": "릴레이"},
        "commands": [
          {"id": "on", "label": "켜기", "labels": {"en": "ON", "ko": "켜기"}, "payload": {"state": "on"}},
          {"id": "off", "label": "끄기", "labels": {"en": "OFF", "ko": "끄기"}, "payload": {"state": "off"}},
          {"id": "toggle", "label": "토글", "labels": {"en": "Toggle", "ko": "토글"}, "payload": {"state": "toggle"}}
        ]
      }
    ]
  }'::jsonb,
  '{
    "version": "1",
    "layout": "grid-2col",
    "cards": [
      {"type": "actuator", "actuatorType": "relay", "channels": 2, "span": 12},
      {"type": "event-log", "metric": "commands", "span": 12}
    ]
  }'::jsonb,
  '{
    "cooldown": 5,
    "interlock": [1, 2],
    "max_duration": 300
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET version = EXCLUDED.version,
      name = EXCLUDED.name,
      manufacturer = EXCLUDED.manufacturer,
      capabilities = EXCLUDED.capabilities,
      ui_template = EXCLUDED.ui_template,
      safety_rules = EXCLUDED.safety_rules,
      updated_at = NOW();

-- =====================================================
-- 확인 쿼리
-- =====================================================

-- 프로파일 목록 확인
-- SELECT id, name, version FROM device_profiles;

-- 상세 확인
-- SELECT * FROM device_profiles WHERE id = 'esp32-dht22-v1';
-- SELECT * FROM device_profiles WHERE id = 'esp32-relay2ch-v1';

-- UI 템플릿 확인
-- SELECT id, name, ui_template FROM device_profiles;

-- Safety Rules 확인
-- SELECT id, name, safety_rules FROM device_profiles WHERE safety_rules IS NOT NULL;

