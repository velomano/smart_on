-- 농장별 MQTT 설정 테이블 생성
-- 고정 스키마 기반 동적 센서 데이터 수집을 위한 테이블

-- 확장 (암호화용)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 농장별 MQTT 브로커 설정
CREATE TABLE IF NOT EXISTS public.farm_mqtt_configs (
  farm_id UUID PRIMARY KEY REFERENCES public.farms(id) ON DELETE CASCADE,
  broker_url TEXT NOT NULL,            -- mqtts://host or wss://host/mqtt
  port INTEGER NOT NULL DEFAULT 8883,
  auth_mode TEXT NOT NULL CHECK (auth_mode IN ('api_key','user_pass')),
  username TEXT,
  secret_enc TEXT,                     -- api_key or password (encrypted)
  client_id_prefix TEXT DEFAULT 'terahub-bridge',
  ws_path TEXT,
  qos_default INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  last_test_at TIMESTAMPTZ,
  last_test_ok BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- sensors에 tier_number가 없다면 추가 (층별 센서 구분용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensors' AND column_name = 'tier_number'
  ) THEN
    ALTER TABLE public.sensors ADD COLUMN tier_number INTEGER;
  END IF;
END $$;

-- 인덱스 (중복 방지 + 성능 최적화)

-- 센서 중복 방지: 디바이스 내 타입/층 조합 유니크
CREATE UNIQUE INDEX IF NOT EXISTS ux_sensors_device_type_tier
  ON public.sensors(device_id, type, COALESCE(tier_number, 0));

-- 센서 리딩 중복 방지 + 업서트 키
CREATE UNIQUE INDEX IF NOT EXISTS ux_sensor_readings_unique
  ON public.sensor_readings(sensor_id, ts);

-- 최근값/범위 조회 최적화
CREATE INDEX IF NOT EXISTS idx_readings_sensor_ts
  ON public.sensor_readings(sensor_id, ts DESC);

-- 명령어 상관관계 유니크
CREATE UNIQUE INDEX IF NOT EXISTS ux_commands_correlation
  ON public.commands(correlation_id);

-- MQTT 설정 조회 최적화
CREATE INDEX IF NOT EXISTS idx_farm_mqtt_configs_active
  ON public.farm_mqtt_configs(is_active);

-- RLS 정책 (기존 테넌트 규칙 따름)
-- 농장 소유자/운영자만 해당 농장의 MQTT 설정에 접근 가능
ALTER TABLE public.farm_mqtt_configs ENABLE ROW LEVEL SECURITY;

-- 농장 소유자/운영자는 자신의 농장 MQTT 설정에 접근 가능
CREATE POLICY "Users can manage their farm MQTT configs" ON public.farm_mqtt_configs
  FOR ALL USING (
    farm_id IN (
      SELECT f.id FROM public.farms f
      JOIN public.memberships m ON f.tenant_id = m.tenant_id
      WHERE m.user_id = auth.uid()
    )
  );

-- 시스템 관리자는 모든 MQTT 설정에 접근 가능
CREATE POLICY "System admins can manage all farm MQTT configs" ON public.farm_mqtt_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid() 
      AND m.role = 'system_admin'
    )
  );

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_farm_mqtt_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_farm_mqtt_configs_updated_at
  BEFORE UPDATE ON public.farm_mqtt_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_farm_mqtt_configs_updated_at();
