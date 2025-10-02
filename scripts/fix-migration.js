#!/usr/bin/env node

/**
 * 잘못된 마이그레이션 데이터를 삭제하고 올바르게 다시 마이그레이션하는 스크립트
 */

const SUPABASE_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4';

async function fixMigration() {
  try {
    console.log('🔧 마이그레이션 수정 시작...');
    
    // 1. 잘못된 마이그레이션 데이터 삭제 (2025-10-02 02:16 이후 생성된 "자동 수집 시스템" 데이터)
    console.log('🗑️ 잘못된 마이그레이션 데이터 삭제 중...');
    
    const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/crop_profiles?author=eq.자동 수집 시스템&created_at=gte.2025-10-02T02:16:00`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (deleteResponse.ok) {
      console.log('✅ 잘못된 마이그레이션 데이터 삭제 완료');
    } else {
      console.log('⚠️ 삭제 실패 또는 삭제할 데이터 없음');
    }
    
    // 2. nutrient_recipes 데이터를 올바르게 마이그레이션
    console.log('🔄 올바른 마이그레이션 시작...');
    
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
    
    // 3. 각 레시피를 올바른 출처 정보와 함께 마이그레이션
    let migratedCount = 0;
    for (const recipe of recipes) {
      const source = recipe.nutrient_sources;
      
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
      
      // 실제 출처 정보 사용
      const sourceTitle = source?.name || "스마트팜 데이터베이스";
      const license = source?.license || "CC BY 4.0";
      
      // crop_profiles 형식으로 변환
      const cropProfile = {
        crop_key: recipe.crop_key,
        crop_name: recipe.crop_name,
        stage: recipe.stage,
        target_ppm: targetPpm,
        target_ec: recipe.target_ec,
        target_ph: recipe.target_ph,
        author: "자동 수집 시스템",
        source_title: sourceTitle,
        source_year: new Date(recipe.collected_at).getFullYear(),
        license: license,
        description: `${recipe.crop_name} ${recipe.stage}에 최적화된 배양액 레시피입니다. (출처: ${sourceTitle})`,
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
      
      // crop_profiles에 저장
      const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/crop_profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(cropProfile)
      });
      
      if (saveResponse.ok) {
        migratedCount++;
        console.log(`✅ 마이그레이션 완료: ${recipe.crop_name} (${recipe.stage}) - ${sourceTitle}`);
      } else {
        const errorText = await saveResponse.text();
        console.error(`❌ 마이그레이션 실패: ${recipe.crop_name}`, errorText);
      }
    }
    
    console.log(`🎉 수정된 마이그레이션 완료: ${migratedCount}/${recipes.length}건`);
    
    // 4. 결과 확인
    console.log('\n📊 수정된 마이그레이션 결과 확인...');
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/crop_profiles?select=source_title,author,created_at&author=eq.자동 수집 시스템&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (checkResponse.ok) {
      const recentData = await checkResponse.json();
      console.log('📈 최근 마이그레이션된 데이터:');
      recentData.forEach(item => {
        console.log(`  - ${item.source_title} (${item.created_at})`);
      });
    }
    
  } catch (error) {
    console.error('💥 마이그레이션 수정 실패:', error);
  }
}

// 실행
fixMigration();
