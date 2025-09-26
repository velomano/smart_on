import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, chatId, userId } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const defaultChatId = process.env.TELEGRAM_CHAT_ID;

    console.log('텔레그램 API 호출됨:', {
      hasBotToken: !!botToken,
      botTokenPrefix: botToken ? botToken.substring(0, 10) : '없음',
      hasDefaultChatId: !!defaultChatId,
      chatId,
      userId
    });

    if (!botToken) {
      console.warn('텔레그램 봇 토큰이 설정되지 않았습니다.');
      return NextResponse.json({ 
        ok: false, 
        error: '텔레그램 봇 토큰이 설정되지 않았습니다.', 
        message: 'TELEGRAM_BOT_TOKEN 환경변수가 설정되지 않았습니다.'
      }, { status: 400 });
    }
    
    // 봇 토큰 형식 검증
    const tokenRegex = /^\d+:[a-zA-Z0-9_-]+$/;
    if (!tokenRegex.test(botToken)) {
      console.error('잘못된 봇 토큰 형식:', botToken);
      return NextResponse.json({ 
        ok: false, 
        error: '잘못된 봇 토큰 형식입니다. 올바른 형식: "123456:abcd123"', 
        message: 'TELEGRAM_BOT_TOKEN 토큰 형식이 올바르지 않습니다.'
      }, { status: 400 });
    }

    // 사용할 채팅 ID 결정
    let targetChatId = chatId || defaultChatId;

    if (!targetChatId) {
      return NextResponse.json({ 
        ok: false, 
        error: '텔레그램 채팅 ID가 설정되지 않았습니다.' 
      }, { status: 500 });
    }

    // 텔레그램 채팅 ID 유효성 체크 (더 관대하게)
    const dummyIds = ['test1_default_id', 'default_id', '123456789', 'no-telegram-set'];
    
    if (dummyIds.includes(targetChatId)) {
      console.log('테스트용 채팅 ID:', targetChatId);
      return NextResponse.json({ 
        ok: false, 
        error: `테스트용 채팅 ID는 사용할 수 없습니다: ${targetChatId}` 
      }, { status: 500 });
    }
    
    // 실제 텔레그램 채팅 ID 형식 검증
    if ((!targetChatId.match(/^-?\d+$/) && !targetChatId.match(/^@\w+$/)) || targetChatId.length < 4) {
      console.log('유효하지 않은 채팅 ID 형식:', targetChatId);
      return NextResponse.json({ 
        ok: false, 
        error: `유효하지 않은 텔레그램 채팅 ID 형식: ${targetChatId}` 
      }, { status: 500 });
    }

    // 텔레그램 봇 API 호출
    try {
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

      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text();
        console.error('텔레그램 API 응답 실패:', {
          status: telegramResponse.status,
          errorText
        });
        
        let errorMessage = `텔레그램 API 호출 실패 (${telegramResponse.status})`;
        if (telegramResponse.status === 401) {
          errorMessage = "텔레그램 봇 토큰이 잘못되었거나 유효하지 않습니다. 봇 토큰을 확인해주세요.";
        }
        
        return NextResponse.json({ 
          ok: false, 
          error: errorMessage,
          details: errorText
        }, { status: 400 });
      }

      const telegramResult = await telegramResponse.json();

      if (!telegramResult.ok) {
        console.error('텔레그램 전송 실패:', telegramResult);
        let errorMessage = `텔레그램 전송 실패: ${telegramResult.description || '알 수 없는 오류'}`;
        
        if (telegramResult.error_code === 401) {
          errorMessage = "텔레그램 봇 토큰이 잘못되었습니다. 올바른 봇 토큰을 설정해주세요.";
        } else if (telegramResult.error_code === 400) {
          errorMessage = `채팅 ID가 잘못되었거나 비활성화되었습니다: ${telegramResult.description}`;
        }
        
        return NextResponse.json({ 
          ok: false, 
          error: errorMessage,
          telegramError: telegramResult
        }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        message: '텔레그램 알림이 성공적으로 전송되었습니다.',
        telegramResult
      });

    } catch (telegramError) {
      console.error('텔레그램 API 호출 에러:', telegramError);
      return NextResponse.json({ 
        ok: false, 
        error: `텔레그램 API 호출 중 에러: ${telegramError instanceof Error ? telegramError.message : '알 수 없는 오류'}` 
      }, { status: 500 });
    }

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
    
    console.log('서버에서 환경변수 확인:', { 
      botToken: botToken ? `${botToken.substring(0, 10)}...` : '없음',
      hasToken: !!botToken 
    });
    
    if (!botToken) {
      console.error('텔레그램 봇 토큰이 환경변수에서 읽혀지지 않았습니다');
      return NextResponse.json({ 
        ok: false, 
        error: '텔레그램 봇 토큰이 설정되지 않았습니다.',
        hint: '환경변수 TELEGRAM_BOT_TOKEN을 확인해주세요'
      }, { status: 500 });
    }

    // 봇 정보 조회
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botInfo = await response.json();

    console.log('텔레그램 API 응답:', botInfo);

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
      error: `서버 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      details: error instanceof Error ? error.stack : 'No details available'
    }, { status: 500 });
  }
}
