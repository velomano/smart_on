-- 커스텀 영양액 레시피 테이블 생성
CREATE TABLE IF NOT EXISTS custom_nutrient_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop TEXT NOT NULL,
    stage TEXT NOT NULL,
    volume_l NUMERIC NOT NULL DEFAULT 1000,
    ec_target NUMERIC DEFAULT 1.5,
    ph_target NUMERIC DEFAULT 6.0,
    npk_ratio TEXT DEFAULT '3-1-2',
    description TEXT,
    growing_conditions JSONB DEFAULT '{}',
    nutrients_detail JSONB DEFAULT '{}',
    usage_notes TEXT[] DEFAULT '{}',
    warnings TEXT[] DEFAULT '{}',
    author TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_custom_nutrient_recipes_crop_stage ON custom_nutrient_recipes(crop, stage);
CREATE INDEX IF NOT EXISTS idx_custom_nutrient_recipes_author ON custom_nutrient_recipes(author);
CREATE INDEX IF NOT EXISTS idx_custom_nutrient_recipes_created_at ON custom_nutrient_recipes(created_at DESC);

-- RLS 정책 적용
ALTER TABLE custom_nutrient_recipes ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신이 작성한 레시피만 조회/수정/삭제 가능
CREATE POLICY "Users can view their own custom recipes" ON custom_nutrient_recipes
    FOR SELECT USING (auth.email() = author);

CREATE POLICY "Users can insert their own custom recipes" ON custom_nutrient_recipes
    FOR INSERT WITH CHECK (auth.email() = author);

CREATE POLICY "Users can update their own custom recipes" ON custom_nutrient_recipes
    FOR UPDATE USING (auth.email() = author);

CREATE POLICY "Users can delete their own custom recipes" ON custom_nutrient_recipes
    FOR DELETE USING (auth.email() = author);

-- 관리자는 모든 레시피 조회 가능
CREATE POLICY "Admins can view all custom recipes" ON custom_nutrient_recipes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_nutrient_recipes_updated_at 
    BEFORE UPDATE ON custom_nutrient_recipes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
