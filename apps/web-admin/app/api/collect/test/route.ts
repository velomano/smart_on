import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { source = 'all' } = body;
    
    console.log(`🧪 수동 수집 테스트 시작: ${source} - ${new Date().toISOString()}`);
    
    // 테스트용 샘플 레시피 데이터 생성
    const testRecipes = [
      {
        crop_key: "lettuce",
        crop_name: "상추",
        stage: "vegetative",
        target_ec: 1.8,
        target_ph: 5.8,
        macro: { N: 150, P: 30, K: 200, Ca: 180, Mg: 50, S: 60 },
        micro: { Fe: 2, Mn: 0.5, B: 0.5, Zn: 0.05, Cu: 0.02, Mo: 0.01 },
        source: { 
          name: "테스트 수집", 
          url: "http://test.com", 
          org_type: "academic", 
          reliability_default: 0.9 
        },
        checksum: `test-${Date.now()}-lettuce-vegetative`
      },
      {
        crop_key: "tomato",
        crop_name: "토마토",
        stage: "vegetative",
        target_ec: 2.0,
        target_ph: 6.2,
        macro: { N: 140, P: 40, K: 220, Ca: 150, Mg: 45, S: 70 },
        micro: { Fe: 2.5, Mn: 0.6, B: 0.6, Zn: 0.06, Cu: 0.03, Mo: 0.02 },
        source: { 
          name: "테스트 수집", 
          url: "http://test.com", 
          org_type: "academic", 
          reliability_default: 0.9 
        },
        checksum: `test-${Date.now()}-tomato-vegetative`
      }
    ];
    
    console.log(`📊 테스트 레시피 ${testRecipes.length}건 생성 완료`);
    
    // Supabase Edge Function으로 데이터 저장 시도
    const supabaseFnUrl = process.env.SUPABASE_FN_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let savedCount = 0;
    let errorMessage = null;
    
    if (supabaseFnUrl && serviceRoleKey) {
      try {
        console.log('💾 Supabase에 테스트 데이터 저장 시도...');
        
        const ingestResponse = await fetch(`${supabaseFnUrl}/ingest-nutrient`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify(testRecipes),
          timeout: 30000
        });
        
        if (ingestResponse.ok) {
          const ingestResult = await ingestResponse.json();
          savedCount = ingestResult.count || testRecipes.length;
          console.log(`✅ Supabase 저장 성공: ${savedCount}건`);
        } else {
          const errorText = await ingestResponse.text();
          errorMessage = `Supabase 저장 실패: ${ingestResponse.status} ${errorText}`;
          console.error(`❌ ${errorMessage}`);
        }
      } catch (error) {
        errorMessage = `Supabase 연결 실패: ${error.message}`;
        console.error(`❌ ${errorMessage}`);
      }
    } else {
      errorMessage = 'Supabase 환경변수가 설정되지 않음';
      console.warn('⚠️ Supabase 환경변수 누락');
    }
    
    return NextResponse.json({
      success: true,
      message: '수동 수집 테스트 완료',
      data: {
        source: source,
        test_mode: true,
        generated_count: testRecipes.length,
        saved_count: savedCount,
        error: errorMessage,
        processed_at: new Date().toISOString(),
        recipes: testRecipes.map(r => ({
          crop: r.crop_name,
          stage: r.stage,
          ec: r.target_ec,
          ph: r.target_ph,
          checksum: r.checksum
        }))
      }
    });
    
  } catch (error) {
    console.error('🧪 수동 수집 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      test_mode: true
    }, { status: 500 });
  }
}

// GET 요청 처리 (테스트 상태 확인)
export async function GET(req: Request) {
  try {
    return NextResponse.json({
      success: true,
      message: '수동 수집 테스트 API 준비됨',
      endpoints: {
        'POST /api/collect/test': '수동 수집 테스트 실행',
        'GET /api/collect/test': '테스트 상태 확인'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
