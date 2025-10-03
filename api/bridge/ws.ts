import { NextRequest, NextResponse } from 'next/server';

export default async function handler(req: NextRequest) {
  // WebSocket 업그레이드는 나중에 구현
  // 현재는 기본 응답만 제공
  return NextResponse.json({ 
    data: { message: 'WebSocket endpoint ready' }, 
    error: null, 
    traceId: crypto.randomUUID()
  });
}
