/**
 * Universal Bridge Proxy API
 * 
 * Web Admin에서 Universal Bridge로 요청을 프록시하는 API
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const bridgeUrl = process.env.BRIDGE_INTERNAL_URL;
    const bridgeToken = process.env.BRIDGE_API_TOKEN;
    
    if (!bridgeUrl || !bridgeToken) {
      return NextResponse.json(
        { success: false, error: 'Bridge configuration missing' },
        { status: 500 }
      );
    }
    
    // URL 구성
    const path = params.path.join('/');
    const url = new URL(request.url);
    const targetUrl = `${bridgeUrl}/rpc/${path}${url.search}`;
    
    // 헤더 구성
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bridgeToken}`,
    };
    
    // 테넌트 헤더 전달
    const tenantId = request.headers.get('x-tenant-id');
    if (tenantId) {
      headers['x-tenant-id'] = tenantId;
    }
    
    // 요청 옵션
    const requestOptions: RequestInit = {
      method,
      headers,
    };
    
    // POST/PUT 요청의 경우 body 전달
    if (method === 'POST' || method === 'PUT') {
      const body = await request.text();
      requestOptions.body = body;
    }
    
    // Bridge로 요청 전달
    const response = await fetch(targetUrl, requestOptions);
    const responseText = await response.text();
    
    // 응답 헤더 구성
    const responseHeaders: Record<string, string> = {
      'Content-Type': response.headers.get('content-type') || 'application/json',
    };
    
    // CORS 헤더 추가
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    responseHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-tenant-id';
    
    return new NextResponse(responseText, {
      status: response.status,
      headers: responseHeaders,
    });
    
  } catch (error: any) {
    console.error('[Bridge Proxy] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bridge proxy error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
    },
  });
}
