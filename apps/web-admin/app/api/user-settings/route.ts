import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../src/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 user-settings API 호출됨');
    
    const body = await request.json();
    console.log('🔍 요청 데이터:', body);
    
    // 환경변수 확인
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔍 환경변수 확인:', {
      hasUrl: !!url,
      hasServiceKey: !!serviceKey,
      urlLength: url?.length || 0,
      serviceKeyLength: serviceKey?.length || 0
    });
    
    if (!url || !serviceKey) {
      console.error('❌ Supabase 환경변수 누락');
      return NextResponse.json({ 
        error: 'Supabase 환경변수가 설정되지 않았습니다' 
      }, { status: 500 });
    }
    
    const supabaseAdmin = supaAdmin();
    console.log('🔍 Supabase 클라이언트 생성됨');
    
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .insert(body)
      .select()
      .single();

    console.log('🔍 Supabase 응답:', { data, error });

    if (error) {
      console.error('사용자 설정 생성 오류:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    console.log('✅ 사용자 설정 생성 성공');
    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
