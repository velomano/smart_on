#!/usr/bin/env node

/**
 * 수집된 데이터를 직접 Supabase에 저장하는 스크립트
 */

const SUPABASE_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4';

// 수집된 실제 데이터
const collectedData = [
  {
    crop_key: "lettuce",
    crop_name: "상추",
    stage: "vegetative",
    target_ec: 1.6,
    target_ph: 6,
    macro: { N: 120, P: 30, K: 200, Ca: 150, Mg: 40, S: 60 },
    micro: { Fe: 2, Mn: 0.5, B: 0.5, Zn: 0.05, Cu: 0.02, Mo: 0.01 },
    env: { temp: 20, humidity: 70, lux: 15000 },
    source: {
      name: "농촌진흥청 스마트팜 기술정보센터",
      url: "https://www.rda.go.kr/board/board.do?mode=search&prgId=day_farmprmninfoEntry",
      org_type: "government",
      license: "Public Domain",
      reliability_default: 0.95
    },
    checksum: "06169e48c9d154e6b580eeed3ca13b2233a7b14bea384cad28f41ca15e32b4b1"
  },
  {
    crop_key: "tomato",
    crop_name: "토마토",
    stage: "vegetative",
    target_ec: 2,
    target_ph: 6.2,
    macro: { N: 140, P: 40, K: 220, Ca: 150, Mg: 45, S: 70 },
    micro: { Fe: 2.5, Mn: 0.6, B: 0.6, Zn: 0.06, Cu: 0.03, Mo: 0.02 },
    env: { temp: 22, humidity: 65, lux: 20000 },
    source: {
      name: "농촌진흥청 스마트팜 기술정보센터",
      url: "https://www.rda.go.kr/board/board.do?mode=search&prgId=day_farmprmninfoEntry",
      org_type: "government",
      license: "Public Domain",
      reliability_default: 0.95
    },
    checksum: "86023e1567cd6ed318a3f2e8663abba7241388f0b30d0201ca3435910df6e83e"
  },
  {
    crop_key: "strawberry",
    crop_name: "딸기",
    stage: "vegetative",
    target_ec: 1.4,
    target_ph: 5.8,
    macro: { N: 110, P: 35, K: 180, Ca: 120, Mg: 40, S: 60 },
    micro: { Fe: 2, Mn: 0.5, B: 0.5, Zn: 0.05, Cu: 0.02, Mo: 0.01 },
    env: { temp: 18, humidity: 75, lux: 12000 },
    source: {
      name: "농촌진흥청 스마트팜 기술정보센터",
      url: "https://www.rda.go.kr/board/board.do?mode=search&prgId=day_farmprmninfoEntry",
      org_type: "government",
      license: "Public Domain",
      reliability_default: 0.95
    },
    checksum: "0ac09b556f162a586662d93789f3a8072789d9d1b87c51a52e400402cbbad0a9"
  },
  {
    crop_key: "lettuce",
    crop_name: "Lettuce",
    stage: "vegetative",
    target_ec: 1.7,
    target_ph: 5.9,
    macro: { N: 130, P: 32, K: 210, Ca: 160, Mg: 45, S: 65 },
    micro: { Fe: 2.2, Mn: 0.55, B: 0.55, Zn: 0.055, Cu: 0.025, Mo: 0.015 },
    env: { temp: 21, humidity: 68, lux: 16000 },
    source: {
      name: "FAO Open Knowledge Platform",
      url: "https://www.fao.org/land-water/databases-and-software/crop-information/",
      org_type: "government",
      license: "CC BY-SA 3.0",
      reliability_default: 0.95
    },
    checksum: "40a44227777989426ab27065f2973f1f7ff376e6e13ef0f4fff922af2efe6a97"
  },
  {
    crop_key: "tomato",
    crop_name: "Tomato",
    stage: "vegetative",
    target_ec: 2.1,
    target_ph: 6.1,
    macro: { N: 150, P: 42, K: 230, Ca: 160, Mg: 48, S: 75 },
    micro: { Fe: 2.7, Mn: 0.65, B: 0.65, Zn: 0.065, Cu: 0.035, Mo: 0.025 },
    env: { temp: 23, humidity: 63, lux: 22000 },
    source: {
      name: "FAO Open Knowledge Platform",
      url: "https://www.fao.org/land-water/databases-and-software/crop-information/",
      org_type: "government",
      license: "CC BY-SA 3.0",
      reliability_default: 0.95
    },
    checksum: "e0a2773a5d587b7cbda3f454b3d33d08fcfb883efd2b7adc5c0b42ea21e612ba"
  },
  {
    crop_key: "cucumber",
    crop_name: "Cucumber",
    stage: "vegetative",
    target_ec: 1.9,
    target_ph: 6,
    macro: { N: 135, P: 37, K: 240, Ca: 155, Mg: 47, S: 72 },
    micro: { Fe: 2.3, Mn: 0.58, B: 0.58, Zn: 0.058, Cu: 0.028, Mo: 0.018 },
    env: { temp: 22, humidity: 70, lux: 18000 },
    source: {
      name: "FAO Open Knowledge Platform",
      url: "https://www.fao.org/land-water/databases-and-software/crop-information/",
      org_type: "government",
      license: "CC BY-SA 3.0",
      reliability_default: 0.95
    },
    checksum: "42b61d2604f10e3b2c0de3afaa6cfa6e753829153141765d5ab9583fecdf71bd"
  },
  {
    crop_key: "lettuce",
    crop_name: "상추",
    stage: "vegetative",
    target_ec: 1.5,
    target_ph: 5.7,
    macro: { N: 115, P: 28, K: 190, Ca: 145, Mg: 38, S: 58 },
    micro: { Fe: 1.8, Mn: 0.48, B: 0.48, Zn: 0.048, Cu: 0.018, Mo: 0.012 },
    env: { temp: 19, humidity: 72, lux: 14000 },
    source: {
      name: "서울대학교 농업생명과학대학",
      url: "https://agri.snu.ac.kr/research/smart-farm",
      org_type: "academic",
      license: "Academic Research",
      reliability_default: 0.9
    },
    checksum: "646c3b3f408597f85ed4aa3fca0dff6609f44ef60192bef86f26c815ce1eadca"
  },
  {
    crop_key: "tomato",
    crop_name: "토마토",
    stage: "flowering",
    target_ec: 2.3,
    target_ph: 6.3,
    macro: { N: 160, P: 45, K: 250, Ca: 170, Mg: 50, S: 80 },
    micro: { Fe: 2.8, Mn: 0.7, B: 0.7, Zn: 0.07, Cu: 0.04, Mo: 0.03 },
    env: { temp: 24, humidity: 60, lux: 25000 },
    source: {
      name: "서울대학교 농업생명과학대학",
      url: "https://agri.snu.ac.kr/research/smart-farm",
      org_type: "academic",
      license: "Academic Research",
      reliability_default: 0.9
    },
    checksum: "e247b1a2bef9509e75c1692415bfa98a14fa335bf611cb264498cdb4860cde7a"
  },
  {
    crop_key: "strawberry",
    crop_name: "딸기",
    stage: "fruiting",
    target_ec: 1.6,
    target_ph: 5.9,
    macro: { N: 125, P: 40, K: 200, Ca: 130, Mg: 45, S: 70 },
    micro: { Fe: 2.2, Mn: 0.6, B: 0.6, Zn: 0.06, Cu: 0.03, Mo: 0.02 },
    env: { temp: 20, humidity: 68, lux: 15000 },
    source: {
      name: "서울대학교 농업생명과학대학",
      url: "https://agri.snu.ac.kr/research/smart-farm",
      org_type: "academic",
      license: "Academic Research",
      reliability_default: 0.9
    },
    checksum: "d210cdfd5552bab7a769a8c34cccc9a8a521e5060d3712a74662bb9b5419d23e"
  },
  {
    crop_key: "cucumber",
    crop_name: "오이",
    stage: "vegetative",
    target_ec: 1.8,
    target_ph: 5.8,
    macro: { N: 125, P: 33, K: 220, Ca: 145, Mg: 43, S: 68 },
    micro: { Fe: 2.1, Mn: 0.55, B: 0.55, Zn: 0.055, Cu: 0.025, Mo: 0.015 },
    env: { temp: 21, humidity: 75, lux: 17000 },
    source: {
      name: "경희대학교 생명과학대학",
      url: "https://life.khu.ac.kr/research/hydroponics",
      org_type: "academic",
      license: "Academic Research",
      reliability_default: 0.9
    },
    checksum: "8ffe464814eb847996cc84ff33ab206096e7ca86635b3dcd792f7d30036f72d6"
  }
];

async function saveToSupabase() {
  try {
    console.log('💾 수집된 데이터를 Supabase에 저장 중...');
    
    // 1. 출처 정보 저장
    const sources = {};
    for (const recipe of collectedData) {
      const sourceKey = `${recipe.source.name}::${recipe.source.url}`;
      if (!sources[sourceKey]) {
        sources[sourceKey] = recipe.source;
      }
    }
    
    console.log(`📊 ${Object.keys(sources).length}개 출처 발견`);
    
    // 2. 각 출처를 Supabase에 저장
    const sourceIds = {};
    for (const [key, source] of Object.entries(sources)) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/nutrient_sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(source)
      });
      
      if (response.ok) {
        const responseText = await response.text();
        console.log(`📝 출처 응답: ${responseText}`);
        if (responseText) {
          const data = JSON.parse(responseText);
          sourceIds[key] = data.id;
        }
        console.log(`✅ 출처 저장: ${source.name}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ 출처 저장 실패: ${source.name}`, errorText);
      }
    }
    
    // 3. 레시피 데이터 저장
    let savedCount = 0;
    for (const recipe of collectedData) {
      const sourceKey = `${recipe.source.name}::${recipe.source.url}`;
      const sourceId = sourceIds[sourceKey];
      
      const recipeData = {
        crop_key: recipe.crop_key,
        crop_name: recipe.crop_name,
        stage: recipe.stage,
        target_ec: recipe.target_ec,
        target_ph: recipe.target_ph,
        macro: recipe.macro,
        micro: recipe.micro,
        env: recipe.env,
        source_id: sourceId,
        reliability: recipe.source.reliability_default,
        checksum: recipe.checksum,
        collected_at: new Date().toISOString()
      };
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/nutrient_recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(recipeData)
      });
      
      if (response.ok) {
        savedCount++;
        console.log(`✅ 레시피 저장: ${recipe.crop_name} (${recipe.source.name})`);
      } else {
        console.error(`❌ 레시피 저장 실패: ${recipe.crop_name}`, await response.text());
      }
    }
    
    console.log(`🎉 저장 완료: ${savedCount}/${collectedData.length}건`);
    
  } catch (error) {
    console.error('💥 저장 실패:', error);
  }
}

// 실행
saveToSupabase();
