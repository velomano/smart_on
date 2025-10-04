import { smartCrawlNutrientData, batchSmartCrawl } from "./smartCrawler";

// 스마트 배치 수집 실행 함수
export async function runSmartBatchCollection() {
  try {
    console.log('🚀 스마트 대량 배치 수집 시작');
    console.log('⏰ 예상 소요시간: 3-4시간');
    console.log('🎯 목표: 500-1000개 레시피 수집');
    console.log('=' .repeat(80));
    
    // 배치 크롤링 실행
    const results = await batchSmartCrawl();
    
    if (results.length === 0) {
      console.log('⚠️ 수집된 레시피가 없습니다.');
      return { success: false, count: 0 };
    }
    
    console.log('\n💾 수집된 데이터를 Supabase에 저장 중...');
    
    // Supabase Edge Function으로 데이터 저장
    const supabaseFnUrl = process.env.SUPABASE_FN_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseFnUrl || !serviceRoleKey) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다');
    }
    
    const response = await fetch(`${supabaseFnUrl}/ingest-nutrient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify(results)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`데이터 저장 실패: ${response.status} ${errorText}`);
    }
    
    const saveResult = await response.json();
    
    console.log('\n' + '=' .repeat(80));
    console.log('🎉 스마트 대량 배치 수집 완료!');
    console.log(`📊 수집된 레시피: ${results.length}개`);
    console.log(`💾 저장된 레시피: ${saveResult.count}개`);
    console.log(`⏭️ 건너뛴 레시피: ${saveResult.skipped}개`);
    console.log('=' .repeat(80));
    
    return {
      success: true,
      collected: results.length,
      saved: saveResult.count,
      skipped: saveResult.skipped
    };
    
  } catch (error) {
    console.error('💥 스마트 배치 수집 실패:', error);
    return {
      success: false,
      error: error.message,
      count: 0
    };
  }
}

// 단일 배치 테스트 함수
export async function runSingleBatchTest() {
  try {
    console.log('🧪 단일 배치 테스트 시작...');
    
    const results = await smartCrawlNutrientData();
    
    console.log(`📊 테스트 완료: ${results.length}개 레시피 수집`);
    
    if (results.length > 0) {
      console.log('\n📋 수집된 레시피 샘플:');
      results.slice(0, 3).forEach((recipe, index) => {
        console.log(`${index + 1}. ${recipe.crop_name} (${recipe.stage}) - ${recipe.source.name}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ 단일 배치 테스트 실패:', error);
    return [];
  }
}
