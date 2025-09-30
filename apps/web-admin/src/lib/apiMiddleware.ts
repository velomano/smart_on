import { NextRequest, NextResponse } from 'next/server';
import { logger, LogContext } from './logger';
import { withErrorHandler, createAuthError, createRateLimitError } from './errorHandler';

// 요청 ID 생성
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 클라이언트 IP 추출
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// 요청 컨텍스트 추출
function extractRequestContext(request: NextRequest): LogContext {
  return {
    requestId: generateRequestId(),
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || undefined,
    method: request.method,
    url: request.url
  };
}

// Rate Limiting (간단한 메모리 기반)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1분
const RATE_LIMIT_MAX_REQUESTS = 100; // 분당 100회

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = ip;
  
  const current = requestCounts.get(key);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  current.count++;
  return true;
}

// API 미들웨어 래퍼
export function withApiMiddleware<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimit?: boolean;
    logRequest?: boolean;
    logResponse?: boolean;
  } = {}
) {
  const {
    requireAuth = false,
    rateLimit = true,
    logRequest = true,
    logResponse = true
  } = options;

  return withErrorHandler(async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const context = extractRequestContext(request);

    // Rate Limiting 체크
    if (rateLimit && !checkRateLimit(context.ip!)) {
      logger.logSecurity('Rate limit exceeded', context);
      throw createRateLimitError('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.', context);
    }

    // 요청 로깅
    if (logRequest) {
      logger.logApiRequest(request.method, request.url, context);
    }

    const startTime = Date.now();

    try {
      // 인증 체크 (필요한 경우)
      if (requireAuth) {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          logger.logSecurity('Unauthenticated request attempt', context);
          throw createAuthError('인증이 필요합니다.', context);
        }
      }

      // 핸들러 실행
      const response = await handler(...args);
      const responseTime = Date.now() - startTime;

      // 응답 로깅
      if (logResponse) {
      logger.logApiResponse(
        request.method,
        request.url,
        response.status,
        responseTime,
        { ...context, responseTime }
      );
      }

      // 응답 헤더에 요청 ID 추가
      response.headers.set('X-Request-ID', context.requestId!);
      response.headers.set('X-Response-Time', `${responseTime}ms`);

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // 에러 응답 로깅
      logger.logApiResponse(
        request.method,
        request.url,
        500, // 에러는 errorHandler에서 처리
        responseTime,
        { ...context, responseTime, error: true }
      );

      throw error; // errorHandler가 처리하도록 재throw
    }
  });
}

// 인증 미들웨어
export async function requireAuth(request: NextRequest): Promise<{ userId: string; userRole: string }> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createAuthError('인증 토큰이 필요합니다.');
  }

  const token = authHeader.substring(7);
  
  // TODO: JWT 토큰 검증 로직 구현
  // 현재는 임시로 토큰이 존재하는지만 확인
  if (!token || token.length < 10) {
    throw createAuthError('유효하지 않은 인증 토큰입니다.');
  }

  // TODO: 실제 토큰에서 사용자 정보 추출
  // 임시로 하드코딩된 사용자 정보 반환
  return {
    userId: 'temp-user-id',
    userRole: 'user'
  };
}

// 권한 체크 미들웨어
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ userId: string; userRole: string }> {
  const user = await requireAuth(request);
  
  if (!allowedRoles.includes(user.userRole)) {
    throw createAuthError('접근 권한이 없습니다.');
  }

  return user;
}

// 관리자 권한 체크
export async function requireAdmin(request: NextRequest): Promise<{ userId: string; userRole: string }> {
  return requireRole(request, ['admin', 'super_admin']);
}

// 요청 본문 검증
export async function validateRequestBody<T>(
  request: NextRequest,
  validator: (data: any) => data is T
): Promise<T> {
  try {
    const body = await request.json();
    
    if (!validator(body)) {
      throw new Error('Invalid request body format');
    }
    
    return body;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

// 쿼리 파라미터 검증
export function validateQueryParams(
  searchParams: URLSearchParams,
  requiredParams: string[]
): Record<string, string> {
  const params: Record<string, string> = {};
  
  for (const param of requiredParams) {
    const value = searchParams.get(param);
    if (!value) {
      throw new Error(`Missing required query parameter: ${param}`);
    }
    params[param] = value;
  }
  
  return params;
}

// CORS 헤더 설정
export function setCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

// API 응답 헬퍼
export function createApiResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }, { status });

  return setCorsHeaders(response);
}

export function createApiError(
  message: string,
  status: number = 500,
  code?: string
): NextResponse {
  const response = NextResponse.json({
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString()
    }
  }, { status });

  return setCorsHeaders(response);
}
