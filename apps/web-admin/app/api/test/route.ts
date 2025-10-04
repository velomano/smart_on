import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'API 테스트 성공',
    timestamp: new Date().toISOString(),
    url: request.url
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ 
    message: 'POST API 테스트 성공',
    received: body,
    timestamp: new Date().toISOString()
  });
}
