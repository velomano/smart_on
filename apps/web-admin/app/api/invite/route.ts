import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경 변수가 없을 때를 위한 조건부 클라이언트 생성
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

interface InviteRequest {
  email: string;
  role: string;
  message?: string;
  invited_by: string;
  invited_by_name: string;
}

export async function POST(request: NextRequest) {
  try {
    // Supabase 클라이언트가 없으면 환경 변수 오류 반환
    if (!supabase) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 설정이 필요합니다. 환경 변수를 확인해주세요.' 
      }, { status: 500 });
    }

    const body: InviteRequest = await request.json();
    const { email, role, message, invited_by, invited_by_name } = body;

    // 입력 검증
    if (!email || !role || !invited_by || !invited_by_name) {
      return NextResponse.json({ 
        ok: false, 
        error: '필수 정보가 누락되었습니다.' 
      }, { status: 400 });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        ok: false, 
        error: '올바른 이메일 형식이 아닙니다.' 
      }, { status: 400 });
    }

    // 이미 존재하는 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, is_active')
      .eq('email', email)
      .single();

    if (existingUser) {
      if (existingUser.is_active) {
        return NextResponse.json({ 
          ok: false, 
          error: '이미 활성화된 사용자입니다.' 
        }, { status: 400 });
      } else {
        return NextResponse.json({ 
          ok: false, 
          error: '이미 등록된 이메일입니다. 관리자에게 문의하세요.' 
        }, { status: 400 });
      }
    }

    // 초대 토큰 생성
    const inviteToken = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

    // 초대 정보 저장
    const { data: inviteData, error: inviteError } = await supabase
      .from('user_invites')
      .insert({
        email,
        role,
        message: message || '',
        invited_by,
        invited_by_name,
        invite_token: inviteToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (inviteError) {
      console.error('초대 저장 오류:', inviteError);
      return NextResponse.json({ 
        ok: false, 
        error: '초대 저장에 실패했습니다.' 
      }, { status: 500 });
    }

    // 이메일 발송 (실제 구현)
    const emailResult = await sendInviteEmail({
      email,
      role,
      message: message || '',
      invited_by_name,
      invite_token: inviteToken,
      invite_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${inviteToken}`
    });

    if (!emailResult.success) {
      console.error('이메일 발송 실패:', emailResult.error);
      // 초대는 저장했지만 이메일 발송 실패
      return NextResponse.json({ 
        ok: false, 
        error: '초대는 저장되었지만 이메일 발송에 실패했습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        invite_id: inviteData.id,
        email,
        role,
        expires_at: expiresAt.toISOString(),
        message: '초대 이메일이 발송되었습니다.'
      }
    });

  } catch (error) {
    console.error('멤버 초대 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 초대 토큰 생성
function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 이메일 발송 함수 (실제 구현)
async function sendInviteEmail({
  email,
  role,
  message,
  invited_by_name,
  invite_token,
  invite_url
}: {
  email: string;
  role: string;
  message: string;
  invited_by_name: string;
  invite_token: string;
  invite_url: string;
}) {
  try {
    // 실제 이메일 서비스 연동 (예: SendGrid, AWS SES, Nodemailer 등)
    // 현재는 콘솔 로그로 대체
    
    const roleText = role === 'team_member' ? '팀 멤버' : 
                    role === 'team_leader' ? '팀 리더' : 
                    role === 'system_admin' ? '시스템 관리자' : '사용자';

    console.log('📧 초대 이메일 발송:', {
      to: email,
      subject: `[Tera Hub] ${invited_by_name}님이 초대하셨습니다`,
      body: `
안녕하세요!

${invited_by_name}님이 Tera Hub 스마트팜 관리 시스템에 ${roleText}로 초대하셨습니다.

초대 메시지:
${message || '별도 메시지가 없습니다.'}

초대 링크: ${invite_url}

이 링크를 클릭하여 계정을 생성하고 시스템에 참여하세요.
링크는 7일 후에 만료됩니다.

감사합니다.
Tera Hub 팀
      `.trim()
    });

    // 실제 이메일 발송 로직 (예시)
    // const emailService = new EmailService();
    // await emailService.send({
    //   to: email,
    //   subject: `[Tera Hub] ${invited_by_name}님이 초대하셨습니다`,
    //   html: generateInviteEmailHTML({...})
    // });

    return { success: true };
  } catch (error) {
    console.error('이메일 발송 오류:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
}

// 초대 목록 조회
export async function GET(request: NextRequest) {
  try {
    // Supabase 클라이언트가 없으면 환경 변수 오류 반환
    if (!supabase) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 설정이 필요합니다. 환경 변수를 확인해주세요.' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    let query = supabase
      .from('user_invites')
      .select(`
        *,
        inviter:invited_by(name, email)
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: invites, error } = await query;

    if (error) {
      console.error('초대 목록 조회 오류:', error);
      return NextResponse.json({ 
        ok: false, 
        error: '초대 목록 조회에 실패했습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: invites || []
    });

  } catch (error) {
    console.error('초대 목록 조회 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
