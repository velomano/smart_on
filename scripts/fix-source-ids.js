#!/usr/bin/env node

/**
 * nutrient_recipes 테이블의 source_id를 올바르게 업데이트하는 스크립트
 */

const SUPABASE_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4';

async function fixSourceIds() {
  try {
    console.log('🔧 source_id 수정 시작...');
    
    // 1. nutrient_sources 조회
    const sourcesResponse = await fetch(`${SUPABASE_URL}/rest/v1/nutrient_sources?select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!sourcesResponse.ok) {
      throw new Error(`nutrient_sources 조회 실패: ${sourcesResponse.status}`);
    }
    
    const sources = await sourcesResponse.json();
    console.log(`📊 ${sources.length}개의 출처 발견:`);
    sources.forEach(source => {
      console.log(`  - ${source.name} (ID: ${source.id})`);
    });
    
    // 2. nutrient_recipes 조회
    const recipesResponse = await fetch(`${SUPABASE_URL}/rest/v1/nutrient_recipes?select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!recipesResponse.ok) {
      throw new Error(`nutrient_recipes 조회 실패: ${recipesResponse.status}`);
    }
    
    const recipes = await recipesResponse.json();
    console.log(`📊 ${recipes.length}개의 레시피 발견`);
    
    // 3. 각 레시피의 source_id 업데이트
    let updatedCount = 0;
    for (const recipe of recipes) {
      // 체크섬을 기반으로 출처 매핑
      let sourceId = null;
      
      // 체크섬 패턴으로 출처 추정
      if (recipe.checksum.includes('06169e48c9d154e6b580eeed3ca13b2233a7b14bea384cad28f41ca15e32b4b1') || // 상추 농촌진흥청
          recipe.checksum.includes('86023e1567cd6ed318a3f2e8663abba7241388f0b30d0201ca3435910df6e83e') || // 토마토 농촌진흥청
          recipe.checksum.includes('0ac09b556f162a586662d93789f3a8072789d9d1b87c51a52e400402cbbad0a9')) { // 딸기 농촌진흥청
        sourceId = sources.find(s => s.name.includes('농촌진흥청'))?.id;
      } else if (recipe.checksum.includes('40a44227777989426ab27065f2973f1f7ff376e6e13ef0f4fff922af2efe6a97') || // Lettuce FAO
                 recipe.checksum.includes('e0a2773a5d587b7cbda3f454b3d33d08fcfb883efd2b7adc5c0b42ea21e612ba') || // Tomato FAO
                 recipe.checksum.includes('42b61d2604f10e3b2c0de3afaa6cfa6e753829153141765d5ab9583fecdf71bd')) { // Cucumber FAO
        sourceId = sources.find(s => s.name.includes('FAO'))?.id;
      } else if (recipe.checksum.includes('646c3b3f408597f85ed4aa3fca0dff6609f44ef60192bef86f26c815ce1eadca') || // 상추 서울대
                 recipe.checksum.includes('e247b1a2bef9509e75c1692415bfa98a14fa335bf611cb264498cdb4860cde7a') || // 토마토 서울대
                 recipe.checksum.includes('d210cdfd5552bab7a769a8c34cccc9a8a521e5060d3712a74662bb9b5419d23e')) { // 딸기 서울대
        sourceId = sources.find(s => s.name.includes('서울대'))?.id;
      } else if (recipe.checksum.includes('8ffe464814eb847996cc84ff33ab206096e7ca86635b3dcd792f7d30036f72d6')) { // 오이 경희대
        sourceId = sources.find(s => s.name.includes('경희대'))?.id;
      }
      
      if (sourceId) {
        // source_id 업데이트
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/nutrient_recipes?id=eq.${recipe.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ source_id: sourceId })
        });
        
        if (updateResponse.ok) {
          updatedCount++;
          const sourceName = sources.find(s => s.id === sourceId)?.name;
          console.log(`✅ 업데이트 완료: ${recipe.crop_name} (${recipe.stage}) → ${sourceName}`);
        } else {
          const errorText = await updateResponse.text();
          console.error(`❌ 업데이트 실패: ${recipe.crop_name}`, errorText);
        }
      } else {
        console.log(`⚠️ 출처를 찾을 수 없음: ${recipe.crop_name} (체크섬: ${recipe.checksum.substring(0, 10)}...)`);
      }
    }
    
    console.log(`🎉 source_id 업데이트 완료: ${updatedCount}/${recipes.length}건`);
    
    // 4. 결과 확인
    console.log('\n📊 업데이트 결과 확인...');
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/nutrient_recipes?select=*,nutrient_sources(name)&source_id=not.is.null&limit=5`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (checkResponse.ok) {
      const updatedRecipes = await checkResponse.json();
      console.log('📈 업데이트된 레시피:');
      updatedRecipes.forEach(recipe => {
        console.log(`  - ${recipe.crop_name} (${recipe.stage}) → ${recipe.nutrient_sources?.name || 'Unknown'}`);
      });
    }
    
  } catch (error) {
    console.error('💥 source_id 수정 실패:', error);
  }
}

// 실행
fixSourceIds();
