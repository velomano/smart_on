-- 데이터 수집 요청 테이블 생성
CREATE TABLE IF NOT EXISTS data_collection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name TEXT NOT NULL,
    stage TEXT,
    user_id UUID REFERENCES users(id),
    user_email TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id),
    estimated_completion_date TIMESTAMPTZ,
    actual_completion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_data_collection_requests_status 
ON data_collection_requests(status);

CREATE INDEX IF NOT EXISTS idx_data_collection_requests_crop_name 
ON data_collection_requests(crop_name);

CREATE INDEX IF NOT EXISTS idx_data_collection_requests_created_at 
ON data_collection_requests(created_at DESC);

-- RLS 정책 (모든 사용자가 요청 생성 가능, 관리자만 조회 가능)
ALTER TABLE data_collection_requests ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 요청 생성 가능
CREATE POLICY "Users can create data collection requests" ON data_collection_requests
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 관리자만 모든 요청 조회 가능
CREATE POLICY "Admins can view all requests" ON data_collection_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.role IN ('super_admin', 'system_admin')
        )
    );

-- 사용자는 자신이 생성한 요청만 조회 가능
CREATE POLICY "Users can view their own requests" ON data_collection_requests
    FOR SELECT USING (user_id = auth.uid());

-- 관리자만 요청 상태 업데이트 가능
CREATE POLICY "Admins can update requests" ON data_collection_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.role IN ('super_admin', 'system_admin')
        )
    );
