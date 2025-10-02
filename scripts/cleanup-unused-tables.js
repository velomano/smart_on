#!/usr/bin/env node

/**
 * 불필요한 테이블들을 정리하는 스크립트
 * nutrient_sources, nutrient_recipes 테이블 삭제
 */

const SUPABASE_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4';

async function cleanupUnusedTables() {
  try {
    console.log('🧹 불필요한 테이블 정리 시작...');
    
    // 1. nutrient_recipes 테이블 삭제
    console.log('🗑️ nutrient_recipes 테이블 삭제 중...');
    const deleteRecipesResponse = await fetch(`${SUPABASE_URL}/rest/v1/nutrient_recipes`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (deleteRecipesResponse.ok) {
      console.log('✅ nutrient_recipes 테이블 삭제 완료');
    } else {
      console.log('⚠️ nutrient_recipes 테이블 삭제 실패 또는 이미 삭제됨');
    }
    
    // 2. nutrient_sources 테이블 삭제
    console.log('🗑️ nutrient_sources 테이블 삭제 중...');
    const deleteSourcesResponse = await fetch(`${SUPABASE_URL}/rest/v1/nutrient_sources`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (deleteSourcesResponse.ok) {
      console.log('✅ nutrient_sources 테이블 삭제 완료');
    } else {
      console.log('⚠️ nutrient_sources 테이블 삭제 실패 또는 이미 삭제됨');
    }
    
    // 3. 관련 테이블들도 삭제
    const relatedTables = [
      'nutrient_recipe_aliases',
      'nutrient_jobs'
    ];
    
    for (const tableName of relatedTables) {
      console.log(`🗑️ ${tableName} 테이블 삭제 중...`);
      const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      
      if (deleteResponse.ok) {
        console.log(`✅ ${tableName} 테이블 삭제 완료`);
      } else {
        console.log(`⚠️ ${tableName} 테이블 삭제 실패 또는 이미 삭제됨`);
      }
    }
    
    // 4. 결과 확인
    console.log('\n📊 정리 후 테이블 상태 확인...');
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/crop_profiles?select=count`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    if (checkResponse.ok) {
      const count = checkResponse.headers.get('content-range')?.split('/')[1] || 'Unknown';
      console.log(`📈 crop_profiles 테이블 레코드 수: ${count}`);
    }
    
    console.log('🎉 불필요한 테이블 정리 완료!');
    console.log('📋 이제 구조가 간단해졌습니다:');
    console.log('   워커 수집 → crop_profiles 직접 저장');
    
  } catch (error) {
    console.error('💥 테이블 정리 실패:', error);
  }
}

// 실행
cleanupUnusedTables();
