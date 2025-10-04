#!/usr/bin/env node

/**
 * 작물별 성장단계 2개 이상이면 추가 수집하지 않는 스마트 수집 로직
 */

const SUPABASE_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4';

async function analyzeCollectionStatus() {
  try {
    console.log('📊 스마트 수집 로직 분석 시작...');
    
    // 1. crop_profiles에서 작물별 성장단계별 개수 조회
    const profilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/crop_profiles?select=crop_key,crop_name,stage`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!profilesResponse.ok) {
      throw new Error(`crop_profiles 조회 실패: ${profilesResponse.status}`);
    }
    
    const profiles = await profilesResponse.json();
    console.log(`📋 총 ${profiles.length}개의 레시피가 crop_profiles에 존재`);
    
    // 2. 작물별 성장단계별 개수 계산
    const cropStageCount = {};
    const cropNames = {};
    
    profiles.forEach(profile => {
      const key = `${profile.crop_key}_${profile.stage}`;
      cropStageCount[key] = (cropStageCount[key] || 0) + 1;
      cropNames[profile.crop_key] = profile.crop_name;
    });
    
    // 3. 분석 결과 출력
    console.log('\n📈 작물별 성장단계별 레시피 개수:');
    console.log('=' .repeat(60));
    
    const crops = [...new Set(profiles.map(p => p.crop_key))];
    let totalStages = 0;
    let sufficientStages = 0;
    
    crops.forEach(cropKey => {
      const cropName = cropNames[cropKey];
      console.log(`\n🌱 ${cropName} (${cropKey}):`);
      
      const stages = [...new Set(profiles.filter(p => p.crop_key === cropKey).map(p => p.stage))];
      stages.forEach(stage => {
        const key = `${cropKey}_${stage}`;
        const count = cropStageCount[key];
        const status = count >= 2 ? '✅ 충분' : '⚠️ 부족';
        console.log(`  - ${stage}: ${count}개 ${status}`);
        totalStages++;
        if (count >= 2) sufficientStages++;
      });
    });
    
    // 4. 수집 우선순위 제안
    console.log('\n🎯 수집 우선순위 (부족한 작물/단계):');
    console.log('=' .repeat(60));
    
    const needsMore = [];
    crops.forEach(cropKey => {
      const cropName = cropNames[cropKey];
      const stages = [...new Set(profiles.filter(p => p.crop_key === cropKey).map(p => p.stage))];
      
      stages.forEach(stage => {
        const key = `${cropKey}_${stage}`;
        const count = cropStageCount[key];
        if (count < 2) {
          needsMore.push({
            cropKey,
            cropName,
            stage,
            count,
            needed: 2 - count
          });
        }
      });
    });
    
    if (needsMore.length === 0) {
      console.log('🎉 모든 작물의 모든 성장단계에 2개 이상의 레시피가 있습니다!');
    } else {
      needsMore.forEach(item => {
        console.log(`⚠️ ${item.cropName} (${item.stage}): ${item.count}개 → ${item.needed}개 더 필요`);
      });
    }
    
    // 5. 새로운 작물 추가 제안
    console.log('\n🆕 새로운 작물 추가 제안:');
    console.log('=' .repeat(60));
    
    const suggestedCrops = [
      { key: 'chinese_cabbage', name: '배추' },
      { key: 'radish', name: '무' },
      { key: 'carrot', name: '당근' },
      { key: 'cabbage', name: '양배추' },
      { key: 'broccoli', name: '브로콜리' },
      { key: 'onion', name: '양파' },
      { key: 'garlic', name: '마늘' },
      { key: 'chive', name: '부추' }
    ];
    
    const existingCrops = new Set(crops);
    const newCrops = suggestedCrops.filter(crop => !existingCrops.has(crop.key));
    
    if (newCrops.length === 0) {
      console.log('모든 제안 작물이 이미 등록되어 있습니다.');
    } else {
      newCrops.forEach(crop => {
        console.log(`🆕 ${crop.name} (${crop.key}): 새로운 작물 추가 권장`);
      });
    }
    
    // 6. 요약 통계
    console.log('\n📊 수집 현황 요약:');
    console.log('=' .repeat(60));
    console.log(`총 작물 수: ${crops.length}개`);
    console.log(`총 성장단계 수: ${totalStages}개`);
    console.log(`충분한 단계 수 (2개 이상): ${sufficientStages}개`);
    console.log(`부족한 단계 수: ${totalStages - sufficientStages}개`);
    console.log(`완성도: ${Math.round((sufficientStages / totalStages) * 100)}%`);
    
    // 7. 수집 권장사항
    console.log('\n💡 수집 권장사항:');
    console.log('=' .repeat(60));
    
    if (needsMore.length > 0) {
      console.log('1. 부족한 작물/성장단계에 대한 추가 수집이 필요합니다.');
      console.log('2. 기존 작물의 중복 수집은 피하고, 새로운 작물 확장에 집중하세요.');
    } else {
      console.log('1. 현재 등록된 작물들은 충분한 레시피를 보유하고 있습니다.');
      console.log('2. 새로운 작물 추가를 통해 데이터베이스를 확장하는 것을 권장합니다.');
    }
    
    console.log('3. 수집 시 작물별 성장단계별 2개 이상이면 해당 조합은 건너뛰세요.');
    console.log('4. 새로운 작물이나 부족한 성장단계에 집중하여 수집하세요.');
    
  } catch (error) {
    console.error('💥 분석 실패:', error);
  }
}

// 실행
analyzeCollectionStatus();
