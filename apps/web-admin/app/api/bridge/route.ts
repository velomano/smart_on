import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const traceId = crypto.randomUUID();
  
  return NextResponse.json({ 
    data: { ok: true }, 
    error: null, 
    traceId 
  });
}
