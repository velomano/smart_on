import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// 환경 변수가 없을 때를 위한 조건부 클라이언트 생성
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

interface AcceptInviteRequest {
  name: string;
  password: string;
  phone?: string;
  company?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Supabase 클라이언트가 없으면 환경 변수 오류 반환
    if (!supabase) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 설정이 필요합니다. 환경 변수를 확인해주세요.' 
      }, { status: 500 });
    }

    const { token } = await params;
    const body: AcceptInviteRequest = await request.json();
    const { name, password, phone, company } = body;

    // 입력 검증
    if (!name || !password) {
      return NextResponse.json({ 
        ok: false, 
        error: '이름과 비밀번호는 필수입니다.' 
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        ok: false, 
        error: '비밀번호는 6자 이상이어야 합니다.' 
      }, { status: 400 });
    }

    // 초대 정보 조회
    const { data: inviteData, error: inviteError } = await supabase
      .from('user_invites')
      .select('*')
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
    if (isExpired) {
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

    // 이미 존재하는 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', inviteData.email)
      .single();

    if (existingUser) {
      return NextResponse.json({ 
        ok: false, 
        error: '이미 등록된 이메일입니다.' 
      }, { status: 400 });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12);

    // 트랜잭션으로 사용자 생성 및 초대 상태 업데이트
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: inviteData.email,
        name: name,
        password_hash: hashedPassword,
        role: inviteData.role,
        is_active: true,
        phone: phone || null,
        company: company || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('사용자 생성 오류:', userError);
      return NextResponse.json({ 
        ok: false, 
        error: '사용자 생성에 실패했습니다.' 
      }, { status: 500 });
    }

    // 초대 상태 업데이트
    const { error: updateError } = await supabase
      .from('user_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', inviteData.id);

    if (updateError) {
      console.error('초대 상태 업데이트 오류:', updateError);
      // 사용자는 생성되었지만 초대 상태 업데이트 실패
      // 이 경우는 로그만 남기고 성공으로 처리
    }

    // 환영 이메일 발송 (선택사항)
    try {
      await sendWelcomeEmail({
        email: inviteData.email,
        name: name,
        role: inviteData.role
      });
    } catch (emailError) {
      console.error('환영 이메일 발송 실패:', emailError);
      // 이메일 발송 실패는 계정 생성에 영향을 주지 않음
    }

    return NextResponse.json({
      ok: true,
      data: {
        user_id: newUser.id,
        email: inviteData.email,
        name: name,
        role: inviteData.role,
        message: '계정이 성공적으로 생성되었습니다.'
      }
    });

  } catch (error) {
    console.error('초대 수락 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 환영 이메일 발송 함수
async function sendWelcomeEmail({
  email,
  name,
  role
}: {
  email: string;
  name: string;
  role: string;
}) {
  try {
    const roleText = role === 'team_member' ? '팀 멤버' : 
                    role === 'team_leader' ? '팀 리더' : 
                    role === 'system_admin' ? '시스템 관리자' : '사용자';

    console.log('📧 환영 이메일 발송:', {
      to: email,
      subject: '[Tera Hub] 계정이 성공적으로 생성되었습니다',
      body: `
안녕하세요 ${name}님!

Tera Hub 스마트팜 관리 시스템에 ${roleText}로 가입하신 것을 환영합니다!

이제 다음 기능들을 이용하실 수 있습니다:
- 농장 및 베드 관리
- 센서 데이터 모니터링
- 배양액 레시피 검색
- 팀 협업 기능

로그인하여 시스템을 시작해보세요: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login

감사합니다.
Tera Hub 팀
      `.trim()
    });

    return { success: true };
  } catch (error) {
    console.error('환영 이메일 발송 오류:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
}
