// GitHub Actions 워크플로우 로직 테스트
const { env } = process;

const SUPA_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4';
const SRC = 'all';
const BATCH = 2;

function parseCountFromContentRange(header) {
  // e.g. "0-0/123"
  if (!header) return 0;
  const m = header.match(/\/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

async function getRecipeCount() {
  // 최소 데이터만 요청 + 정확한 카운트 요청
  const url = `${SUPA_URL}/rest/v1/crop_profiles?select=id`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Prefer': 'count=exact',
      'Range': '0-0'
    }
  });
  if (!res.ok) throw new Error(`Supabase count query failed: ${res.status}`);
  const contentRange = res.headers.get('Content-Range');
  return parseCountFromContentRange(contentRange);
}

// 간단한 양액 데이터 생성 (실제 구현에서는 외부 API 호출)
async function collectNutrientData() {
  console.log(`📊 ${SRC} 소스에서 양액 데이터 수집 중...`);
  
  // 임시 데이터 생성 (실제로는 Cornell, FAO 등에서 수집)
  const sampleData = [
    {
      crop_key: 'lettuce',
      crop_name: '상추',
      stage: 'vegetative',
      target_ppm: 150,
      target_ec: 1.2,
      target_ph: 6.0
    },
    {
      crop_key: 'tomato',
      crop_name: '토마토',
      stage: 'fruiting',
      target_ppm: 250,
      target_ec: 2.0,
      target_ph: 6.5
    }
  ];
  
  console.log(`📊 생성된 샘플 데이터: ${sampleData.length}건`);
  return sampleData.slice(0, BATCH);
}

async function saveToSupabase(data) {
  if (!data || data.length === 0) return 0;
  
  console.log(`💾 ${data.length}건의 데이터를 Supabase에 저장 중...`);
  
  // crop_profiles 테이블에 저장
  const response = await fetch(`${SUPA_URL}/rest/v1/crop_profiles`, {
    method: 'POST',
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Supabase 저장 실패: ${response.status}`);
  }
  
  return data.length;
}

async function main() {
  try {
    console.log('🚀 영양액 레시피 수집 시작 (소스: all, 배치: 2)');
    
    const before = await getRecipeCount();
    console.log(`📊 기존 레시피 수: ${before}건`);

    const collectedData = await collectNutrientData();
    console.log(`📊 수집된 데이터: ${collectedData.length}건`);

    const savedCount = await saveToSupabase(collectedData);
    console.log(`✅ Supabase 저장 완료: ${savedCount}건`);

    const after = await getRecipeCount();
    console.log(`📊 최종 레시피 수: ${after}건`);
    console.log(`💾 추가된 레시피: ${Math.max(after - before, 0)}건`);
    console.log('🎉 영양액 레시피 수집 작업 완료');
  } catch (err) {
    console.error('❌ 수집 작업 실패:', err?.message || err);
    process.exit(1);
  }
}

main();
