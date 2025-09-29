import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../src/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const supabaseAdmin = supaAdmin();
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('사용자 설정 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
