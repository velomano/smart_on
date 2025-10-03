import { NextRequest, NextResponse } from 'next/server';

export default async function handler(req: NextRequest) {
  const traceId = crypto.randomUUID();
  
  return NextResponse.json({ 
    data: { ok: true }, 
    error: null, 
    traceId 
  });
}
