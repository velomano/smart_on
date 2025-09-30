import { NextRequest, NextResponse } from 'next/server';
import { createSbServer } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 nutrient_sources 테이블 디버그 시작');
    
    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        error: 'Supabase 연결 실패' 
      }, { status: 500 });
    }

    // nutrient_sources 테이블의 모든 데이터 조회
    const { data: sources, error } = await sb
      .from('nutrient_sources')
      .select('*');

    if (error) {
      console.error('❌ 쿼리 오류:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 500 });
    }

    console.log('✅ 쿼리 성공, 소스 개수:', sources?.length || 0);
    console.log('📊 첫 번째 소스 샘플:', sources?.[0]);

    return NextResponse.json({
      ok: true,
      count: sources?.length || 0,
      sources: sources
    });

  } catch (error) {
    console.error('❌ 디버그 API 오류:', error);
    return NextResponse.json({ 
      ok: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
