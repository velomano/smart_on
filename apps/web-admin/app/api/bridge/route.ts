import { NextRequest, NextResponse } from 'next/server';

// Universal Bridge 연결 설정
const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001';

/**
 * Universal Bridge 프록시 API
 * Web Admin에서 Universal Bridge의 JWT 토큰 서버와 MQTT 브로커에 접근
 */
export async function GET(req: NextRequest) {
  const traceId = crypto.randomUUID();
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');
  
  try {
    // 기본 헬스 체크
    if (!endpoint) {
      const bridgeHealth = await fetch(`${BRIDGE_URL}/health`);
      const bridgeData = await bridgeHealth.json();
      
      return NextResponse.json({ 
        data: { 
          ok: true,
          bridge: bridgeData,
          traceId 
        }, 
        error: null
      });
    }
    
    // Universal Bridge API 프록시
    const bridgeResponse = await fetch(`${BRIDGE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // JWT 토큰이 있다면 전달
        ...(req.headers.get('authorization') && {
          'Authorization': req.headers.get('authorization')!
        })
      }
    });
    
    const bridgeData = await bridgeResponse.json();
    
    return NextResponse.json({ 
      data: bridgeData, 
      error: null,
      traceId 
    });
    
  } catch (error: any) {
    console.error('Bridge API 프록시 에러:', error);
    return NextResponse.json({ 
      data: null, 
      error: error.message,
      traceId 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const traceId = crypto.randomUUID();
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');
  const body = await req.json();
  
  try {
    if (!endpoint) {
      return NextResponse.json({ 
        data: null, 
        error: 'endpoint parameter is required',
        traceId 
      }, { status: 400 });
    }
    
    // Universal Bridge API 프록시
    const bridgeResponse = await fetch(`${BRIDGE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.get('authorization') && {
          'Authorization': req.headers.get('authorization')!
        })
      },
      body: JSON.stringify(body)
    });
    
    const bridgeData = await bridgeResponse.json();
    
    return NextResponse.json({ 
      data: bridgeData, 
      error: null,
      traceId 
    });
    
  } catch (error: any) {
    console.error('Bridge API 프록시 에러:', error);
    return NextResponse.json({ 
      data: null, 
      error: error.message,
      traceId 
    }, { status: 500 });
  }
}
