-- 알림 설정 업데이트 마이그레이션
-- 새로운 알림 유형들을 notification_preferences 기본값에 추가

-- 1. 기존 user_settings 테이블의 notification_preferences 기본값 업데이트
ALTER TABLE user_settings 
ALTER COLUMN notification_preferences 
SET DEFAULT '{
  "email": true,
  "telegram": false,
  "dashboard": true,
  "ph_alerts": true,
  "water_level": true,
  "low_humidity": true,
  "sensor_alerts": true,
  "system_alerts": true,
  "high_temperature": true,
  "temperature_notification": true,
  "humidity_notification": true,
  "ec_notification": true,
  "ph_notification": true,
  "water_notification": true,
  "nutrient_temperature_notification": true,
  "season_notification": true,
  "growth_stage_notification": true,
  "nutrient_remaining_notification": true,
  "maintenance_notification": true,
  "equipment_failure_notification": true,
  "harvest_reminder_notification": true
}'::jsonb;

-- 2. 기존 사용자들의 notification_preferences에 새로운 필드들 추가
UPDATE user_settings 
SET notification_preferences = notification_preferences || '{
  "temperature_notification": true,
  "humidity_notification": true,
  "ec_notification": true,
  "ph_notification": true,
  "water_notification": true,
  "nutrient_temperature_notification": true,
  "season_notification": true,
  "growth_stage_notification": true,
  "nutrient_remaining_notification": true,
  "maintenance_notification": true,
  "equipment_failure_notification": true,
  "harvest_reminder_notification": true
}'::jsonb
WHERE notification_preferences IS NOT NULL;

-- 3. notification_preferences가 NULL인 경우 기본값으로 설정
UPDATE user_settings 
SET notification_preferences = '{
  "email": true,
  "telegram": false,
  "dashboard": true,
  "ph_alerts": true,
  "water_level": true,
  "low_humidity": true,
  "sensor_alerts": true,
  "system_alerts": true,
  "high_temperature": true,
  "temperature_notification": true,
  "humidity_notification": true,
  "ec_notification": true,
  "ph_notification": true,
  "water_notification": true,
  "nutrient_temperature_notification": true,
  "season_notification": true,
  "growth_stage_notification": true,
  "nutrient_remaining_notification": true,
  "maintenance_notification": true,
  "equipment_failure_notification": true,
  "harvest_reminder_notification": true
}'::jsonb
WHERE notification_preferences IS NULL;

-- 4. 알림 로그 테이블 생성 (선택사항 - 알림 발송 기록용)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('telegram', 'email', 'dashboard')),
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 5. 알림 로그 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- 6. 생장단계 변경 로그 테이블 (생장단계 알림용)
CREATE TABLE IF NOT EXISTS growth_stage_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bed_id TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    old_stage TEXT NOT NULL,
    new_stage TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    harvest_date DATE,
    days_remaining INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 7. 생장단계 변경 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_growth_stage_changes_user_id ON growth_stage_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_stage_changes_bed_id ON growth_stage_changes(bed_id);
CREATE INDEX IF NOT EXISTS idx_growth_stage_changes_changed_at ON growth_stage_changes(changed_at);

-- 8. 알림 설정 버전 관리 (선택사항)
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS notification_settings_version INTEGER DEFAULT 1;

-- 9. 알림 설정 업데이트 트리거
CREATE OR REPLACE FUNCTION update_notification_settings_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.notification_settings_version = OLD.notification_settings_version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notification_settings_version ON user_settings;
CREATE TRIGGER trigger_update_notification_settings_version
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    WHEN (OLD.notification_preferences IS DISTINCT FROM NEW.notification_preferences)
    EXECUTE FUNCTION update_notification_settings_version();

-- 10. 마이그레이션 완료 로그
DO $$
BEGIN
    RAISE NOTICE '알림 설정 마이그레이션 완료: 새로운 알림 유형 6개 추가됨';
    RAISE NOTICE '- temperature_notification, humidity_notification, ec_notification';
    RAISE NOTICE '- ph_notification, water_notification, nutrient_temperature_notification';
    RAISE NOTICE '- season_notification, growth_stage_notification';
    RAISE NOTICE '- nutrient_remaining_notification, maintenance_notification';
    RAISE NOTICE '- equipment_failure_notification, harvest_reminder_notification';
END$$;
