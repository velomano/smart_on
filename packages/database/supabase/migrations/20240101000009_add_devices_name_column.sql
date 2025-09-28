-- devices 테이블에 name 컬럼 추가
-- 베드 이름 표시를 위한 컬럼

-- devices 테이블에 name 컬럼 추가
ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS name TEXT;

-- 기존 데이터에 대한 기본 이름 설정
UPDATE public.devices 
SET name = COALESCE(meta->>'location', '디바이스-' || SUBSTRING(id::text, -4))
WHERE name IS NULL;

-- name 컬럼을 NOT NULL로 설정 (기본값과 함께)
ALTER TABLE public.devices 
ALTER COLUMN name SET NOT NULL;

-- name 컬럼에 기본값 설정
ALTER TABLE public.devices 
ALTER COLUMN name SET DEFAULT '디바이스-' || SUBSTRING(gen_random_uuid()::text, -4);

-- 인덱스 추가 (이름으로 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_devices_name 
ON public.devices(name);

-- 베드 타입 디바이스의 이름을 더 의미있게 설정
UPDATE public.devices 
SET name = '베드-' || SUBSTRING(id::text, -4)
WHERE type = 'sensor_gateway' AND name LIKE '디바이스-%';
