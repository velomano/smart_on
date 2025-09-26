import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, chatId, userId } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const defaultChatId = process.env.TELEGRAM_CHAT_ID;

    // 사용할 채팅 ID 결정 (targetChatId 정의)
    let targetChatId = chatId || defaultChatId;

    console.log('텔레그램 API 호출됨:', {
      hasBotToken: !!botToken,
      botTokenPrefix: botToken ? botToken.substring(0, 10) + '...' : '없음',
      botTokenLength: botToken ? botToken.length : 0,
      hasDefaultChatId: !!defaultChatId,
      defaultChatIdPreview: defaultChatId ? defaultChatId.substring(0, 10) + '...' : '없음',
      targetChatId,
      userId,
      timestamp: new Date().toISOString()
    });

    // 토큰 형식 검증 강화
    if (botToken && !botToken.includes(':') && botToken.length < 20) {
      console.warn('⚠️ 봇 토큰 형식이 의심스럽습니다. 형식: [숫자부]:[해시부분]');
    }

    if (!botToken) {
      console.warn('텔레그램 봇 토큰이 설정되지 않았습니다.');
      return NextResponse.json({ 
        ok: false, 
        error: '텔레그램 봇 토큰이 설정되지 않았습니다.', 
        message: 'TELEGRAM_BOT_TOKEN 환경변수가 설정되지 않았습니다.'
      }, { status: 400 });
    }
    
    // 봇 토큰 형식 검증 (더 관대하게 처리)
    const tokenRegex = /^\d+:[a-zA-Z0-9_-]+$/;
    if (!tokenRegex.test(botToken)) {
      console.warn('텔레그램 봇 토큰 형식이 틀릴 수 있습니다:', botToken ? botToken.substring(0, 10) + '...' : '없음');
      // 일단 저장이지만 경고만 출력하고 계속 진행
      console.warn('형식 검증을 건너뛰고 거져 시도합니다.');
    }

    if (!targetChatId) {
      return NextResponse.json({ 
        ok: false, 
        error: '텔레그램 채팅 ID가 설정되지 않았습니다.' 
      }, { status: 500 });
    }

    // 텔레그램 채팅 ID 유효성 체크 (더 관대하게)
    const dummyIds = ['default_id', '123456789', 'no-telegram-set']; // test1_default_id 제거
    
    if (dummyIds.includes(targetChatId)) {
      console.log('테스트용 채팅 ID:', targetChatId);
      return NextResponse.json({ 
        ok: false, 
        error: `테스트용 채팅 ID는 사용할 수 없습니다: ${targetChatId}` 
      }, { status: 500 });
    }

    // test1_default_id는 허용하되 실제 텔레그램 알림 테스트 모드로 처리
    if (targetChatId === 'test1_default_id') {
      console.log('🚨 test1 계정 텔레그램 테스트 모드 활성화');
      
      // test1 계정은 기본 텔레그램 채팅 ID 실행 (환경변수 또는 기본 설정값 사용)
      const realChatId = process.env.TELEGRAM_CHAT_ID || '6827239951';
      targetChatId = realChatId; // 실제 채팅 ID로 교체
      console.log('🔧 test1 실제 텔레그램 채팅 ID 사용:', realChatId);
    }
    
    // 실제 텔레그램 채팅 ID 형식 검증
    if ((!targetChatId.match(/^-?\d+$/) && !targetChatId.match(/^@\w+$/)) || targetChatId.length < 4) {
      console.log('유효하지 않은 채팅 ID 형식:', targetChatId);
      return NextResponse.json({ 
        ok: false, 
        error: `유효하지 않은 텔레그램 채팅 ID 형식: ${targetChatId}` 
      }, { status: 500 });
    }

    // 먼저 봇 정보 확인 (getMe API 호출로 토큰 검증)
    console.log('🔍 봇 토큰 검증 시도:', { 
      hasToken: !!botToken, 
      tokenLength: botToken?.length,
      tokenPreview: botToken ? botToken.substring(0, 20) + '...' : '없음'
    });

    try {
      // 봇 정보 먼저 확인 (토큰 유효성 테스트)
      const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const botInfoResult = await botInfoResponse.json();
      
      if (!botInfoResult.ok) {
        console.error('❌ 봇 토큰이 유효하지 않음:', botInfoResult);
        
        let detailedError = "봇 토큰이 잘못되었습니다.";
        if (botInfoResult.error_code === 401) {
          detailedError = "봇 토큰이 유효하지 않습니다. Vercel 환경변수에서 올바른 TELEGRAM_BOT_TOKEN을 설정하세요.";
        } else if (botInfoResult.error_code === 426) {
          detailedError = "HTTP 연결이 끊어졌습니다. 설정에서 봇을 다시 활성화하세요.";
        }
        
        return NextResponse.json({ 
          ok: false, 
          error: detailedError,
          tokenInfo: {
            hasToken: !!botToken,
            tokenLength: botToken?.length,
            telegramError: botInfoResult
          }
        }, { status: 400 });
      }
      
      console.log('✅ 봇 토큰 검증 성공:', {
        username: botInfoResult.result?.username,
        first_name: botInfoResult.result?.first_name,
        can_join_groups: botInfoResult.result?.can_join_groups
      });

      // 실제 메시지 전송 
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
        console.error('텔레그램 메시지 전송 실패:', {
          status: telegramResponse.status,
          errorText,
          targetChatId
        });
        
        let errorMessage = `텔레그램 메시지 전송 실패 (${telegramResponse.status})`;
        if (telegramResponse.status === 401) {
          errorMessage = "봇 토큰이 유효하지 않거나 봇이 비활성화되었습니다. Vercel에서 TELEGRAM_BOT_TOKEN을 다시 확인하세요.";
        } else if (telegramResponse.status === 403) {
          errorMessage = "봇이 해당 채팅방에 접근할 수 없습니다. 채팅방에서 봇을 추가하거나 `/start`를 명령하세요.";
        } else if (telegramResponse.status === 400) {
          errorMessage = `채팅방 정보가 올바르지 않습니다: ${targetChatId}. 유효한 채팅 ID를 입력하세요.`;
        }
        
        return NextResponse.json({ 
          ok: false, 
          error: errorMessage,
          details: errorText,
          chatIdUsed: targetChatId
        }, { status: 400 });
      }

      const telegramResult = await telegramResponse.json();

      if (!telegramResult.ok) {
        console.error('텔레그램 전송 실패:', telegramResult);
        let errorMessage = `텔레그램 전송 실패: ${telegramResult.description || '알 수 없는 오류'}`;
        
        if (telegramResult.error_code === 401) {
          errorMessage = "봇 토큰이 유효하지 않습니다. 올바른 봇 토큰을 확인하세요.";
        } else if (telegramResult.error_code === 400) {
          if (telegramResult.description?.includes('chat not found')) {
            errorMessage = "채팅방을 찾을 수 없습니다. 봇과 대화를 시작했는지 확인하고 올바른 채팅 ID를 입력하세요.";
          } else if (telegramResult.description?.includes('bot was blocked')) {
            errorMessage = "봇이 차단되었습니다. 봇을 차단해제하고 /start 명령어를 실행하세요.";
          } else {
            errorMessage = `텔레그램 요청 오류: ${telegramResult.description || '알 수 없는 오류'}`;
          }
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
