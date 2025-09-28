import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('❌ 텔레그램 API 요청 파싱 실패:', parseError);
      return NextResponse.json({ 
        ok: false, 
        error: '요청 데이터 형식이 올바르지 않습니다.',
        parseError: parseError instanceof Error ? parseError.message : '알 수 없는 파싱 오류'
      }, { status: 400 });
    }

    const { message, chatId, userId, debug } = requestData;

    // 디버그 요청이 있으면 환경변수 정보 반환
    if (debug === 'env') {
      return NextResponse.json({
        hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
        tokenPreview: process.env.TELEGRAM_BOT_TOKEN ? 
          `${process.env.TELEGRAM_BOT_TOKEN.substring(0, 10)}...` : 
          '없음',
        tokenLength: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
        hasDefaultChatId: !!process.env.TELEGRAM_CHAT_ID,
        envCheck: process.env.NODE_ENV,
        deploymentEnv: process.env.VERCEL ? 'Vercel 배포' : '로컬 개발',
        timestamp: new Date().toISOString(),
        allEnvs: {
          telegramBotTokenPresent: !!process.env.TELEGRAM_BOT_TOKEN,
          telegramChatIdPresent: !!process.env.TELEGRAM_CHAT_ID,
          nodeEnv: process.env.NODE_ENV,
          inVercel: !!process.env.VERCEL
        }
      });
    }

    // 요청 데이터 유효성 검사 추가
    if (!message) {
      console.warn('❌ 메시지 데이터가 없습니다');
      return NextResponse.json({ 
        ok: false, 
        error: '메시지 내용이 필요합니다.' 
      }, { status: 400 });
    }

    console.log('📨 텔레그램 요청 데이터 확인:', {
      hasMessage: !!message,
      messageLength: message?.length || 0,
      chatId: chatId,
      userId: userId,
      hasDebug: !!debug
    });

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
      timestamp: new Date().toISOString(),
      deploymentEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL ? '배포됨' : '로컬',
      // Vercel 배포 환경 특성 진단
      vercelDeploymentUrl: process.env.VERCEL_URL,
      hasEnvProcess: typeof process !== 'undefined',
      inServerlessFunction: process.env.VERCEL === '1'
    });

    // 토큰 형식 검증 강화
    if (botToken && !botToken.includes(':') && botToken.length < 20) {
      console.warn('⚠️ 봇 토큰 형식이 의심스럽습니다. 형식: [숫자부]:[해시부분]');
    }

    if (!botToken) {
      console.warn('텔레그램 봇 토큰이 설정되지 않았습니다.');
      const deploymentEnv = process.env.VERCEL ? 'Vercel 배포' : '로컬 개발';
      return NextResponse.json({ 
        ok: false, 
        error: `텔레그램 봇 토큰이 설정되지 않았습니다. (${deploymentEnv})`, 
        message: `${deploymentEnv}에서 TELEGRAM_BOT_TOKEN 환경변수를 설정해야 합니다.`,
        hint: deploymentEnv === 'Vercel 배포' ? 
          'Vercel 대시보드 → Settings → Environment Variables' : 
          '.env.local 파일에 토큰 추가'
      }, { status: 400 });
    }
    
    // 봇 토큰 형식 검증 (더 관대하게 처리)
    const tokenRegex = /^\d+:[a-zA-Z0-9_-]+$/;
    if (!tokenRegex.test(botToken)) {
      console.warn('텔레그램 봇 토큰 형식이 틀릴 수 있습니다:', botToken ? botToken.substring(0, 10) + '...' : '없음');
      // 일단 저장이지만 경고만 출력하고 계속 진행
      console.warn('형식 검증을 건너뛰고 거져 시도합니다.');
    }

    // 봇 토큰 상세 진단
    console.log('🔍 봇 토큰 디버깅 정보:', {
      hasToken: !!botToken,
      tokenLength: botToken?.length,
      tokenFirst10Chars: botToken?.substring(0, 10),
      tokenLast10Chars: botToken ? '...' + botToken.substring(botToken.length - 10) : '없음',
      tokenFormat: tokenRegex.test(botToken ? botToken : '') ? '올바른 형식' : '형식 오류',
      envType: typeof botToken === 'string' ? '문자열' : typeof botToken,
      environment: process.env.NODE_ENV
    });

    if (!targetChatId) {
      // 기본 채팅 ID가 없을 때 환경변수에서 우선 확인
      const fallbackChatId = process.env.TELEGRAM_CHAT_ID;
      
      if (!fallbackChatId) {
        return NextResponse.json({ 
          ok: false, 
          error: '텔레그램 채팅 ID가 설정되지 않았습니다.',
          hint: '사용자가 알림 설정에서 채팅 ID를 입력하거나, 관리자가 Vercel에서 환경변수 TELEGRAM_CHAT_ID를 설정하세요.',
          instructions: [
            '1. 마이페이지에서 "텔레그램 채팅 ID" 필드에 숫자 ID 입력',
            '2. 또는 Vercel 환경변수에 TELEGRAM_CHAT_ID 추가',
            '3. @userinfobot에게 메시지를 보내면 본인의 채팅 ID를 확인할 수 있습니다'
          ]
        }, { status: 400 });
      }
      
      targetChatId = fallbackChatId;
      console.log('🔧 기본 환경변수 채팅 ID 사용:', fallbackChatId);
    }

    // 요청 상세 로깅 추가
    console.log('🔍 텔레그램 요청 분석:', {
      originalChatId: chatId,
      finalTargetChatId: targetChatId,
      messageLength: message?.length || 0,
      messagePreview: message?.substring(0, 50) + (message?.length > 50 ? '...' : ''),
      userId: userId
    });

    // 텔레그램 채팅 ID 유효성 체크 (더 관대하게)
    const dummyIds = ['default_id', '123456789', 'no-telegram-set'];
    
    if (dummyIds.includes(targetChatId)) {
      console.log('테스트용 채팅 ID:', targetChatId);
      return NextResponse.json({ 
        ok: false, 
        error: `테스트용 채팅 ID는 사용할 수 없습니다: ${targetChatId}` 
      }, { status: 500 });
    }

    // 하드코딩된 테스트 ID들은 정상적인 절차를 따르도록 처리
    if (targetChatId === 'test1_default_id') {
      console.log('❌ 하드코딩된 테스트 ID는 지원하지 않습니다');
      
      return NextResponse.json({ 
        ok: false, 
        error: '유효하지 않은 채팅 ID입니다. 실제 채팅 ID를 입력해주세요.',
        hint: '텔레그램에서 @userinfobot에게 메시지를 보내면 본인의 채팅 ID를 확인할 수 있습니다.'
      }, { status: 400 });
    }
    
    // 실제 텔레그램 채팅 ID 형식 검증
    if ((!targetChatId.match(/^-?\d+$/) && !targetChatId.match(/^@\w+$/)) || targetChatId.length < 4) {
      console.log('유효하지 않은 채팅 ID 형식:', targetChatId);
      return NextResponse.json({ 
        ok: false, 
        error: `유효하지 않은 텔레그램 채팅 ID 형식: ${targetChatId}` 
      }, { status: 500 });
    }

    // Vercel 환경에서 token과 chatId 재확인
    console.log('🔍 Vercel 배포 환경 진단:', { 
      hasToken: !!botToken, 
      tokenLength: botToken?.length,
      hasChatId: !!targetChatId,
      chatId: targetChatId,
      tokenPreview: botToken ? botToken.substring(0, 20) + '...' : '없음',
      vercelFunctionSize: process.env.VERCEL_ENV
    });

    try {
      // 봇 정보 먼저 확인 (토큰 유효성 테스트) - Vercel에서 테스트
      const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const botInfoResult = await botInfoResponse.json();
      
      if (!botInfoResult.ok) {
        console.error('❌ Vercel 배포에서 봇 토큰 검증 실패:', botInfoResult);
        
        let detailedError = "Vercel 배포 환경에서 봇 토큰이 유효하지 않습니다.";
        if (botInfoResult.error_code === 401) {
          detailedError = "Vercel 환경변수에서 TELEGRAM_BOT_TOKEN이 올바르지 않거나 만료되었습니다.";
        } else if (botInfoResult.error_code === 426) {
          detailedError = "Vercel 서버에서 텔레그램 API 접근이 차단되었습니다.";
        }
        
        return NextResponse.json({ 
          ok: false, 
          error: detailedError,
          deploymentInfo: {
            inVercel: process.env.VERCEL,
            environment: 'production',
            tokenPresent: !!botToken,
            tokenLength: botToken?.length,
            telegramError: botInfoResult
          }
        }, { status: 400 });
      }
      
      console.log('✅ Vercel 배포 환경에서 봇 토큰 검증 성공:', {
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
        let errorData;
        try {
          errorData = await telegramResponse.json();
        } catch (parseError) {
          const errorText = await telegramResponse.text();
          errorData = { error_code: telegramResponse.status, description: errorText };
        }
        
        console.error('텔레그램 메시지 전송 상세 오류:', {
          status: telegramResponse.status,
          errorData,
          targetChatId,
          timestamp: new Date().toISOString()
        });
        
        let errorMessage = `텔레그램 전송 실패 (${telegramResponse.status})`;
        let hint = '';
        
        if (telegramResponse.status === 401) {
          errorMessage = "봇 토큰이 유효하지 않습니다.";
          hint = "Vercel 환경변수에서 TELEGRAM_BOT_TOKEN을 다시 확인하세요.";
        } else if (telegramResponse.status === 403) {
          errorMessage = "봇이 해당 채팅방에 접근할 수 없습니다.";
          hint = "봇과 대화를 시작하고, 로봇인증을 클리어해주세요.";
        } else if (telegramResponse.status === 400) {
          // 400 오류의 구체적인 원인 분석
          const errorDesc = errorData.description || '';
          
          if (errorDesc.includes('chat not found')) {
            errorMessage = "채팅방을 찾을 수 없습니다.";
            hint = "채팅 ID를 다시 확인하고, 봇과 1:1 메시지를 먼저 나누어주세요.";
          } else if (errorDesc.includes('bot was blocked')) {
            errorMessage = "봇이 차단되었습니다.";
            hint = "텔레그램에서 봇을 찾아서 차단해제하고 메시지를 보내주세요.";
          } else {
            errorMessage = `채팅방 접근 오류: ${errorDesc}`;
            hint = "채팅 ID를 다시 확인하거나 봇에게 먼저 메시지를 보내주세요.";
          }
        }
        
        return NextResponse.json({ 
          ok: false, 
          error: errorMessage,
          hint: hint,
          telegramError: errorData,
          chatIdUsed: targetChatId,
          statusCode: telegramResponse.status
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
