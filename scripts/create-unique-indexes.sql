-- Supabase SQL (SQL editor)
-- 유니크 인덱스 생성
CREATE UNIQUE INDEX IF NOT EXISTS uq_crop_profile 
ON public.crop_profiles (crop_key, stage, checksum);

-- 기존 중복 데이터 확인
SELECT crop_key, stage, checksum, COUNT(*) as count
FROM public.crop_profiles 
GROUP BY crop_key, stage, checksum
HAVING COUNT(*) > 1;

-- 중복 데이터 정리 (가장 최근 것만 유지)
WITH ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY crop_key, stage, checksum ORDER BY created_at DESC) as rn
  FROM public.crop_profiles
)
DELETE FROM public.crop_profiles 
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- 인덱스 생성 확인
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'crop_profiles' 
AND indexname = 'uq_crop_profile';
