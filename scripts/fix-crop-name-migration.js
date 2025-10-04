#!/usr/bin/env node

/**
 * nutrient_recipes의 crop_name을 수정하고 crop_profiles로 마이그레이션하는 스크립트
 */

const SUPABASE_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4';

async function fixAndMigrate() {
  try {
    console.log('🔄 nutrient_recipes → crop_profiles 마이그레이션 시작...');
    
    // 1. nutrient_recipes 데이터 조회
    const recipesResponse = await fetch(`${SUPABASE_URL}/rest/v1/nutrient_recipes?select=*,nutrient_sources(*)`, {
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
    
    // 2. crop_key를 crop_name으로 매핑하는 함수
    function getCropName(cropKey) {
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
    
    // 3. 각 레시피를 crop_profiles 형식으로 변환
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const recipe of recipes) {
      const source = recipe.nutrient_sources;
      
      // crop_name 설정
      const cropName = getCropName(recipe.crop_key);
      
      // macro/micro 데이터를 target_ppm 형식으로 변환
      const targetPpm = {
        N: recipe.macro?.N || 0,
        P: recipe.macro?.P || 0,
        K: recipe.macro?.K || 0,
        Ca: recipe.macro?.Ca || 0,
        Mg: recipe.macro?.Mg || 0,
        S: recipe.macro?.S || 0
      };
      
      // NPK 비율 계산
      const npkRatio = `${targetPpm.N}:${targetPpm.P}:${targetPpm.K}`;
      
      // 환경 조건 정보 생성
      const growingConditions = {
        temperature: `${recipe.env?.temp || 20}°C`,
        humidity: `${recipe.env?.humidity || 65}%`,
        light_hours: `${Math.round((recipe.env?.lux || 15000) / 1000)}시간`,
        co2_level: "800-1200ppm"
      };
      
      // 영양소 상세 정보 생성
      const nutrientsDetail = {
        nitrogen: targetPpm.N,
        phosphorus: targetPpm.P,
        potassium: targetPpm.K,
        calcium: targetPpm.Ca,
        magnesium: targetPpm.Mg,
        trace_elements: ['Fe', 'Mn', 'B', 'Zn', 'Cu', 'Mo']
      };
      
      // 사용법 및 주의사항
      const usageNotes = [
        "주 1회 EC 측정 권장",
        "pH는 6.0-6.5 범위 유지",
        "온도가 높을 때는 EC를 낮춰 사용"
      ];
      
      const warnings = [
        "칼슘 결핍 시 잎 끝 갈변 현상",
        "과도한 질소는 과번무 유발"
      ];
      
      // crop_profiles 형식으로 변환
      const cropProfile = {
        crop_key: recipe.crop_key,
        crop_name: cropName,
        stage: recipe.stage,
        target_ppm: targetPpm,
        target_ec: recipe.target_ec,
        target_ph: recipe.target_ph,
        author: "자동 수집 시스템",
        source_title: source?.name || "스마트팜 데이터베이스",
        source_year: new Date(recipe.collected_at).getFullYear(),
        license: source?.license || "CC BY 4.0",
        description: `${cropName} ${recipe.stage}에 최적화된 배양액 레시피입니다. (출처: ${source?.name || 'Unknown'})`,
        growing_conditions: growingConditions,
        nutrients_detail: nutrientsDetail,
        usage_notes: usageNotes,
        warnings: warnings,
        last_updated: new Date(recipe.collected_at).toISOString().split('T')[0],
        volume_l: 100,
        ec_target: recipe.target_ec,
        ph_target: recipe.target_ph,
        npk_ratio: npkRatio
      };
      
      // 중복 확인을 위해 기존 데이터 체크
      const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/crop_profiles?crop_key=eq.${recipe.crop_key}&stage=eq.${recipe.stage}&select=count`, {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'count=exact'
        }
      });
      
      if (checkResponse.ok) {
        const count = checkResponse.headers.get('content-range')?.split('/')[1] || '0';
        if (parseInt(count) > 0) {
          console.log(`⏭️  건너뜀: ${cropName} (${recipe.stage}) - 이미 존재`);
          skippedCount++;
          continue;
        }
      }
      
      // crop_profiles에 저장
      const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/crop_profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify(cropProfile)
      });
      
      if (saveResponse.ok) {
        migratedCount++;
        console.log(`✅ 마이그레이션 완료: ${cropName} (${recipe.stage}) - ${source?.name || 'Unknown'}`);
      } else {
        const errorText = await saveResponse.text();
        console.error(`❌ 마이그레이션 실패: ${cropName} (${recipe.stage})`, errorText);
      }
    }
    
    console.log(`🎉 마이그레이션 완료: ${migratedCount}/${recipes.length}건 (건너뜀: ${skippedCount}건)`);
    
    // 4. 결과 확인
    console.log('\n📊 마이그레이션 후 crop_profiles 데이터 확인...');
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/crop_profiles?select=count`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    if (checkResponse.ok) {
      const count = checkResponse.headers.get('content-range')?.split('/')[1] || 'Unknown';
      console.log(`📈 총 crop_profiles 레코드 수: ${count}`);
    }
    
  } catch (error) {
    console.error('💥 마이그레이션 실패:', error);
  }
}

// 실행
fixAndMigrate();
