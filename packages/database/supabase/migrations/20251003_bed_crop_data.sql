-- 베드별 작물 데이터 테이블 생성
CREATE TABLE IF NOT EXISTS bed_crop_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    tier_number INTEGER NOT NULL CHECK (tier_number >= 1 AND tier_number <= 10),
    crop_name TEXT NOT NULL,
    growing_method TEXT,
    plant_type TEXT CHECK (plant_type IN ('seed', 'seedling')),
    start_date DATE,
    harvest_date DATE,
    stage_boundaries JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 동일한 베드의 동일한 단에 하나의 작물만 등록 가능
    UNIQUE(device_id, tier_number)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bed_crop_data_device_id ON bed_crop_data(device_id);
CREATE INDEX IF NOT EXISTS idx_bed_crop_data_tier_number ON bed_crop_data(tier_number);
CREATE INDEX IF NOT EXISTS idx_bed_crop_data_crop_name ON bed_crop_data(crop_name);

-- RLS 정책 (임시로 비활성화)
ALTER TABLE bed_crop_data DISABLE ROW LEVEL SECURITY;

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_bed_crop_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bed_crop_data_updated_at
    BEFORE UPDATE ON bed_crop_data
    FOR EACH ROW
    EXECUTE FUNCTION update_bed_crop_data_updated_at();

-- 테이블 코멘트
COMMENT ON TABLE bed_crop_data IS '베드별 작물 재배 정보';
COMMENT ON COLUMN bed_crop_data.device_id IS '베드 디바이스 ID';
COMMENT ON COLUMN bed_crop_data.tier_number IS '베드 단수 (1-10)';
COMMENT ON COLUMN bed_crop_data.crop_name IS '작물명';
COMMENT ON COLUMN bed_crop_data.growing_method IS '재배 방법 (담액식, NFT, DWC 등)';
COMMENT ON COLUMN bed_crop_data.plant_type IS '작물 유형 (seed: 파종, seedling: 육묘)';
COMMENT ON COLUMN bed_crop_data.start_date IS '정식 시작일자';
COMMENT ON COLUMN bed_crop_data.harvest_date IS '수확 예정일자';
COMMENT ON COLUMN bed_crop_data.stage_boundaries IS '생육 단계 경계값 (JSON)';
