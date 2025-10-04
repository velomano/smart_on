#!/usr/bin/env node

/**
 * nutrient_recipes 테이블의 crop_name을 영문에서 한글로 수정하는 스크립트
 */

const SUPABASE_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4';

async function fixCropNames() {
  try {
    console.log('🔄 nutrient_recipes crop_name 한글화 시작...');
    
    // 1. 모든 nutrient_recipes 데이터 조회
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
    console.log(`📊 ${recipes.length}건의 nutrient_recipes 데이터 발견`);
    
    // 2. crop_key를 한글 crop_name으로 매핑하는 함수
    function getKoreanCropName(cropKey) {
      const cropMap = {
        'lettuce': '상추',
        'tomato': '토마토', 
        'strawberry': '딸기',
        'cucumber': '오이',
        'pepper': '고추',
        'basil': '바질',
        'spinach': '시금치',
        'kale': '케일',
        'broccoli': '브로콜리',
        'cabbage': '양배추',
        'carrot': '당근',
        'radish': '무',
        'chinese cabbage': '배추',
        'chive': '부추',
        'garlic': '마늘',
        'onion': '양파'
      };
      return cropMap[cropKey] || cropKey;
    }
    
    // 3. 각 레시피의 crop_name을 한글로 수정
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const recipe of recipes) {
      const koreanCropName = getKoreanCropName(recipe.crop_key);
      
      // 이미 한글이면 건너뜀
      if (recipe.crop_name === koreanCropName) {
        skippedCount++;
        continue;
      }
      
      // crop_name 업데이트
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/nutrient_recipes?id=eq.${recipe.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          crop_name: koreanCropName
        })
      });
      
      if (updateResponse.ok) {
        updatedCount++;
        console.log(`✅ 업데이트 완료: ${recipe.crop_name} → ${koreanCropName} (${recipe.stage})`);
      } else {
        const errorText = await updateResponse.text();
        console.error(`❌ 업데이트 실패: ${recipe.crop_name}`, errorText);
      }
    }
    
    console.log(`🎉 crop_name 수정 완료: ${updatedCount}/${recipes.length}건 (건너뜀: ${skippedCount}건)`);
    
    // 4. 결과 확인
    console.log('\n📊 수정 후 nutrient_recipes 데이터 확인...');
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/nutrient_recipes?select=crop_name,crop_key&limit=10`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (checkResponse.ok) {
      const sampleData = await checkResponse.json();
      console.log('📋 샘플 데이터:');
      sampleData.forEach(item => {
        console.log(`  - ${item.crop_key} → ${item.crop_name}`);
      });
    }
    
  } catch (error) {
    console.error('💥 crop_name 수정 실패:', error);
  }
}

// 실행
fixCropNames();
