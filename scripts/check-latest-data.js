#!/usr/bin/env node

/**
 * 최근 저장된 데이터 확인 스크립트
 */

const SUPABASE_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4';

async function checkLatestData() {
  try {
    console.log('📊 최근 저장된 데이터 확인...');
    
    // 최근 저장된 데이터 조회
    const response = await fetch(`${SUPABASE_URL}/rest/v1/crop_profiles?select=source_title,author,created_at,crop_name,stage&author=eq.자동 수집 시스템&order=created_at.desc&limit=10`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`조회 실패: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📈 최근 저장된 데이터: ${data.length}건`);
    
    data.forEach((item, index) => {
      console.log(`${index + 1}. ${item.crop_name} (${item.stage}) - ${item.source_title}`);
      console.log(`   저장시간: ${item.created_at}`);
    });
    
    // 출처별 통계
    const sourceStats = data.reduce((acc, item) => {
      const source = item.source_title || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 출처별 통계:');
    Object.entries(sourceStats).forEach(([source, count]) => {
      console.log(`  - ${source}: ${count}건`);
    });
    
    // 전체 데이터 수 확인
    const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/crop_profiles?select=count`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    if (countResponse.ok) {
      const count = countResponse.headers.get('content-range')?.split('/')[1] || 'Unknown';
      console.log(`\n📈 전체 crop_profiles 레코드 수: ${count}`);
    }
    
  } catch (error) {
    console.error('💥 데이터 확인 실패:', error);
  }
}

// 실행
checkLatestData();
