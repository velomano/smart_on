import { NextRequest, NextResponse } from 'next/server';
import { createSbServer } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 nutrient_recipes 테이블 디버그 시작');
    
    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        error: 'Supabase 연결 실패' 
      }, { status: 500 });
    }

    // nutrient_recipes 테이블의 전체 개수 조회
    const { count: totalCount, error: countError } = await sb
      .from('nutrient_recipes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ 카운트 쿼리 오류:', countError);
      return NextResponse.json({ 
        error: countError.message,
        details: countError
      }, { status: 500 });
    }

    // nutrient_recipes 테이블의 모든 데이터 조회 (처음 10개만)
    const { data: recipes, error } = await sb
      .from('nutrient_recipes')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ 쿼리 오류:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 500 });
    }

    console.log('✅ 쿼리 성공, 전체 레시피 개수:', totalCount);
    console.log('📊 첫 번째 레시피 샘플:', recipes?.[0]);

    return NextResponse.json({
      ok: true,
      totalCount: totalCount,
      sampleCount: recipes?.length || 0,
      recipes: recipes,
      sample_metadata: recipes?.[0] || null
    });

  } catch (error) {
    console.error('❌ 디버그 API 오류:', error);
    return NextResponse.json({ 
      ok: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
