import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, chatId } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const defaultChatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken) {
      return NextResponse.json({ 
        ok: false, 
        error: '텔레그램 봇 토큰이 설정되지 않았습니다.' 
      }, { status: 500 });
    }

    const targetChatId = chatId || defaultChatId;
    if (!targetChatId) {
      return NextResponse.json({ 
        ok: false, 
        error: '텔레그램 채팅 ID가 설정되지 않았습니다.' 
      }, { status: 500 });
    }

    // 텔레그램 봇 API 호출
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'HTML'
        }),
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      console.error('텔레그램 전송 실패:', telegramResult);
      return NextResponse.json({ 
        ok: false, 
        error: `텔레그램 전송 실패: ${telegramResult.description}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: '텔레그램 알림이 성공적으로 전송되었습니다.',
      telegramResult
    });

  } catch (error) {
    console.error('텔레그램 알림 API 에러:', error);
    return NextResponse.json({ 
      ok: false, 
      error: `서버 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
    }, { status: 500 });
  }
}

// GET 메서드로 봇 정보 확인
export async function GET(req: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json({ 
        ok: false, 
        error: '텔레그램 봇 토큰이 설정되지 않았습니다.' 
      }, { status: 500 });
    }

    // 봇 정보 조회
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botInfo = await response.json();

    if (!botInfo.ok) {
      return NextResponse.json({ 
        ok: false, 
        error: `봇 정보 조회 실패: ${botInfo.description}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      botInfo: botInfo.result
    });

  } catch (error) {
    console.error('텔레그램 봇 정보 조회 에러:', error);
    return NextResponse.json({ 
      ok: false, 
      error: `서버 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
    }, { status: 500 });
  }
}
