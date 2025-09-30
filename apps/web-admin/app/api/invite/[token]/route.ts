import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 초대 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ 
        ok: false, 
        error: '초대 토큰이 필요합니다.' 
      }, { status: 400 });
    }

    // 초대 정보 조회
    const { data: inviteData, error: inviteError } = await supabase
      .from('user_invites')
      .select(`
        *,
        inviter:invited_by(name, email)
      `)
      .eq('invite_token', token)
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json({ 
        ok: false, 
        error: '유효하지 않은 초대 링크입니다.' 
      }, { status: 404 });
    }

    // 만료 확인
    const isExpired = new Date(inviteData.expires_at) < new Date();
    if (isExpired && inviteData.status === 'pending') {
      // 만료된 초대 상태 업데이트
      await supabase
        .from('user_invites')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', inviteData.id);

      return NextResponse.json({ 
        ok: false, 
        error: '초대가 만료되었습니다.' 
      }, { status: 410 });
    }

    // 이미 처리된 초대 확인
    if (inviteData.status !== 'pending') {
      return NextResponse.json({ 
        ok: false, 
        error: `이미 ${inviteData.status === 'accepted' ? '수락된' : '취소된'} 초대입니다.` 
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      data: inviteData
    });

  } catch (error) {
    console.error('초대 정보 조회 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
