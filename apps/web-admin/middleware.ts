import { NextRequest, NextResponse } from 'next/server';

/**
 * 멀티 테넌트 미들웨어
 * 서브도메인에서 테넌트를 식별하고 요청에 컨텍스트를 주입합니다.
 */

// 테넌트 매핑 (추후 DB에서 동적으로 로드 가능)
const TENANT_MAPPING: Record<string, string> = {
  // 개발 환경
  'localhost': '00000000-0000-0000-0000-000000000001',
  'localhost:3000': '00000000-0000-0000-0000-000000000001',
  
  // Vercel 기본 도메인
  'web-admin-snowy': '00000000-0000-0000-0000-000000000001',
  'web-admin-smart-ons-projects': '00000000-0000-0000-0000-000000000001',
  
  // Terahub 프로덕션 도메인
  'app': '00000000-0000-0000-0000-000000000001', // 메인 앱
  'demo': '00000000-0000-0000-0000-000000000002', // 데모 테넌트
  'acme': '00000000-0000-0000-0000-000000000003', // ACME 회사
  'farm1': '00000000-0000-0000-0000-000000000004', // 1번 농장
  'farm2': '00000000-0000-0000-0000-000000000005', // 2번 농장
  
  // 메인 도메인도 기본 테넌트로
  'terahub': '00000000-0000-0000-0000-000000000001',
};

// 인증이 필요 없는 경로
const PUBLIC_PATHS = [
  '/login',
  '/reset-password',
  '/invite/',
  '/_next',
  '/favicon.ico',
  '/api/invite/', // 초대 수락은 인증 전
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public 경로는 테넌트 체크 스킵
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // 호스트명에서 서브도메인 추출
  const hostname = request.headers.get('host') || '';
  console.log('🌐 Middleware - hostname:', hostname);
  
  // 서브도메인 추출
  let subdomain = '';
  
  if (hostname.includes('.vercel.app')) {
    // Vercel 도메인: web-admin-snowy.vercel.app → 'web-admin-snowy'
    subdomain = hostname.split('.vercel.app')[0];
  } else if (hostname.includes('terahub.ai')) {
    // Terahub 도메인: farm1.terahub.ai → 'farm1'
    const parts = hostname.split('.');
    subdomain = parts[0];
  } else if (hostname.includes('localhost')) {
    // 로컬 개발: localhost:3000 → 'localhost'
    subdomain = 'localhost';
  } else {
    // 기타: 전체 호스트명 사용
    subdomain = hostname;
  }
  
  console.log('🔍 Middleware - subdomain:', subdomain);
  
  // 테넌트 ID 조회
  const tenantId = TENANT_MAPPING[subdomain] || TENANT_MAPPING['localhost'];
  
  if (!tenantId) {
    console.error('❌ Middleware - 알 수 없는 서브도메인:', subdomain);
    // 에러 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/error/invalid-tenant', request.url));
  }
  
  console.log('✅ Middleware - tenantId:', tenantId);
  
  // 요청 헤더에 테넌트 정보 주입
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenantId);
  requestHeaders.set('x-subdomain', subdomain);
  
  // 다음 미들웨어/핸들러로 전달
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 미들웨어 적용 경로 설정
export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에 적용:
     * - api (API routes는 별도 처리)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

