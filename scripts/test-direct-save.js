#!/usr/bin/env node

/**
 * 워커에서 수집한 데이터를 crop_profiles에 직접 저장하는 테스트
 */

const SUPABASE_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4';

async function testDirectSave() {
  try {
    console.log('🧪 워커 데이터를 crop_profiles에 직접 저장 테스트 시작...');
    
    // 1. 워커에서 데이터 수집
    console.log('📡 워커에서 데이터 수집 중...');
    const workerResponse = await fetch('http://localhost:3002/sources/all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!workerResponse.ok) {
      throw new Error(`워커 응답 실패: ${workerResponse.status}`);
    }
    
    const workerData = await workerResponse.json();
    const recipes = workerData.data || [];
    console.log(`📊 워커에서 수집된 데이터: ${recipes.length}건`);
    
    // 2. 각 레시피를 crop_profiles 형식으로 변환하여 저장
    let savedCount = 0;
    for (const recipe of recipes) {
      const source = recipe.source;
      
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
        crop_name: recipe.crop_name,
        stage: recipe.stage,
        target_ppm: targetPpm,
        target_ec: recipe.target_ec,
        target_ph: recipe.target_ph,
        author: "자동 수집 시스템",
        source_title: source?.name || "스마트팜 데이터베이스",
        source_year: new Date().getFullYear(),
        license: source?.license || "CC BY 4.0",
        description: `${recipe.crop_name} ${recipe.stage}에 최적화된 배양액 레시피입니다. (출처: ${source?.name || 'Unknown'})`,
        growing_conditions: growingConditions,
        nutrients_detail: nutrientsDetail,
        usage_notes: usageNotes,
        warnings: warnings,
        last_updated: new Date().toISOString().split('T')[0],
        volume_l: 100,
        ec_target: recipe.target_ec,
        ph_target: recipe.target_ph,
        npk_ratio: npkRatio
      };
      
      // crop_profiles에 직접 저장
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
        savedCount++;
        console.log(`✅ 저장 완료: ${recipe.crop_name} (${recipe.stage}) - ${source?.name || 'Unknown'}`);
      } else {
        const errorText = await saveResponse.text();
        console.error(`❌ 저장 실패: ${recipe.crop_name}`, errorText);
      }
    }
    
    console.log(`🎉 직접 저장 테스트 완료: ${savedCount}/${recipes.length}건`);
    
    // 3. 결과 확인
    console.log('\n📊 저장 결과 확인...');
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/crop_profiles?select=source_title,author,created_at&author=eq.자동 수집 시스템&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (checkResponse.ok) {
      const recentData = await checkResponse.json();
      console.log('📈 최근 저장된 데이터:');
      recentData.forEach(item => {
        console.log(`  - ${item.source_title} (${item.created_at})`);
      });
    }
    
  } catch (error) {
    console.error('💥 직접 저장 테스트 실패:', error);
  }
}

// 실행
testDirectSave();
