import { NextRequest, NextResponse } from 'next/server';
import { createSbServer } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 crop_profiles 테이블 디버그 시작');
    
    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        error: 'Supabase 연결 실패' 
      }, { status: 500 });
    }

    // crop_profiles 테이블의 모든 데이터 조회 (처음 5개만)
    const { data: profiles, error } = await sb
      .from('crop_profiles')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ 쿼리 오류:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 500 });
    }

    console.log('✅ 쿼리 성공, 프로필 개수:', profiles?.length || 0);
    console.log('📊 첫 번째 프로필 샘플:', profiles?.[0]);

    return NextResponse.json({
      ok: true,
      count: profiles?.length || 0,
      profiles: profiles,
      sample_metadata: profiles?.[0]?.metadata || null
    });

  } catch (error) {
    console.error('❌ 디버그 API 오류:', error);
    return NextResponse.json({ 
      ok: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
