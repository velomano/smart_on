-- 사용자 설정 및 데이터 영속화를 위한 마이그레이션
-- 기존 localStorage 기반 시스템을 Supabase 데이터베이스로 이전

-- 1. 사용자 설정 테이블 (알림, UI 설정 등)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 알림 설정
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    telegram_chat_id TEXT,
    telegram_bot_token TEXT,
    
    -- UI 설정
    ui_preferences JSONB DEFAULT '{}'::jsonb,
    dashboard_preferences JSONB DEFAULT '{}'::jsonb,
    
    -- 생성/수정 시간
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id)
);

-- 2. 베드 노트 데이터베이스 저장 (localStorage -> DB)
CREATE TABLE IF NOT EXISTS bed_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bed_id TEXT NOT NULL, -- 디바이스 ID (device.id 형태)
    bed_name TEXT,
    
    -- 노트 내용
    title TEXT NOT NULL,
    content TEXT,
    is_announcement BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}', -- 배열 형태로 태그들 저장
    
    -- 변동 사항 추적
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- 방문 정보 (edit history)
    author_id UUID NOT NULL REFERENCES users(id),
    author_name TEXT
);

-- 3. 기존 users 테이블 확장 (이미 있는지 확인)
-- 사용자 상태 추가 확인을 위해 필요한 컬럼들 체크
DO $$ 
BEGIN
    -- 사용자 승인 상태 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_approved') THEN
        ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT false;
    END IF;
    
    -- 사용자 활성 상태 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- 사용자 이름
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE users ADD COLUMN name TEXT;
    END IF;
    
    -- 생성 시간
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    -- 수정 시간
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_bed_notes_user_id ON bed_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_bed_notes_bed_id ON bed_notes(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_notes_announcement ON bed_notes(is_announcement);
CREATE INDEX IF NOT EXISTS idx_bed_notes_created_at ON bed_notes(created_at DESC);

-- 5. RLS 정책 설정 (보안)
-- 사용자별 데이터 접근 제한
CREATE POLICY "Users can view their own settings" 
    ON user_settings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
    ON user_settings FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
    ON user_settings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bed notes" 
    ON bed_notes FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bed notes" 
    ON bed_notes FOR ALL 
    USING (auth.uid() = user_id);

-- 6. 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER set_timestamp_user_settings
    BEFORE UPDATE ON user_settings
    FOR EACH ROW 
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_bed_notes
    BEFORE UPDATE ON bed_notes
    FOR EACH ROW 
    EXECUTE PROCEDURE trigger_set_timestamp();

-- 7. 기본 사용자 설정 생성 함수
CREATE OR REPLACE FUNCTION setup_user_default_settings(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- 사용자가 첫 로그인 시 기본 설정 자동 생성
    INSERT INTO user_settings (
        user_id,
        notification_preferences,
        ui_preferences,
        dashboard_preferences
    ) VALUES (
        user_uuid,
        '{"temperature_notification": true, "ec_notification": true, "ph_notification": true, "humidity_notification": true, "water_notification": true}'::jsonb,
        '{"language": "ko", "theme": "light"}'::jsonb,
        '{"showTeamBedsOnDashboard": true, "showAllBedsInBedManagement": false}'::jsonb
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 8. 댓글 추가 (문서화 목적)
COMMENT ON TABLE user_settings IS '사용자별 개인 설정 저장 (알림, UI 설정 등)';
COMMENT ON TABLE bed_notes IS '베드별 성자 노트 및 공지사항 저장';
COMMENT ON COLUMN bed_notes.bed_id IS '디바이스 ID (device.id)와 매핑됨';
COMMENT ON COLUMN bed_notes.is_announcement IS '공지사항 여부 (베드 최상단 표시)';
COMMENT ON COLUMN bed_notes.tags IS '노트 분류를 위한 태그 배열';
COMMENT ON COLUMN user_settings.notification_preferences IS '알림 설정 (온도, 습도, EC, pH 등)';
COMMENT ON COLUMN user_settings.ui_preferences IS '사용자 인터페이스 설정';
COMMENT ON COLUMN user_settings.dashboard_preferences IS '대시보드 표시 설정';

