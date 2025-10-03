import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, payload } = body;

    console.log('Self-Test 명령 수신:', { topic, payload });

    // TODO: 실제 MQTT 클라이언트로 명령 전송
    // 현재는 시뮬레이션 모드
    if (!topic || !payload) {
      return NextResponse.json({ 
        ok: false, 
        error: "토픽과 페이로드가 필요합니다" 
      }, { status: 400 });
    }

    // Universal Bridge로 MQTT 명령 전달
    const bridgeResponse = await fetch(`${process.env.BRIDGE_URL || 'http://localhost:3001'}/api/mqtt/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        payload,
        qos: 1
      })
    });

    if (bridgeResponse.ok) {
      const bridgeResult = await bridgeResponse.json();
      return NextResponse.json({ 
        ok: true, 
        message: "Self-Test 명령이 전송되었습니다",
        bridgeResult 
      });
    } else {
      return NextResponse.json({ 
        ok: false, 
        error: "Universal Bridge 연결 실패" 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Self-Test API 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}
