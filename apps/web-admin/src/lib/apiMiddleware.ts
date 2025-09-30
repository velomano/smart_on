import { NextRequest, NextResponse } from 'next/server';
import { logger, LogContext } from './logger';
import { withErrorHandler, createAuthError, createRateLimitError } from './errorHandler';
import { 
  setSecurityHeaders, 
  maskSensitiveData, 
  validateRequestSize, 
  sanitizeInput,
  advancedRateLimit,
  getClientIP,
  validateOrigin,
  validateSessionSecurity
} from './security';
import { authenticateRequest, validateToken, hasPermission, canAccessResource } from './jwt';

// 요청 ID 생성
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 클라이언트 IP 추출 (security.ts에서 import)

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

// Rate Limiting은 security.ts의 advancedRateLimit 사용

// API 미들웨어 래퍼 (보안 강화)
export function withApiMiddleware<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimit?: boolean;
    logRequest?: boolean;
    logResponse?: boolean;
    maxRequestSize?: number;
    allowedOrigins?: string[];
  } = {}
) {
  const {
    requireAuth = false,
    rateLimit = true,
    logRequest = true,
    logResponse = true,
    maxRequestSize = 1024 * 1024, // 1MB
    allowedOrigins = []
  } = options;

  return withErrorHandler(async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const context = extractRequestContext(request);

    // 1. 보안 헤더 검증
    const sessionValidation = validateSessionSecurity(request);
    if (!sessionValidation.isValid) {
      logger.logSecurity('Session security validation failed', {
        ...context,
        issues: sessionValidation.issues
      });
      throw createAuthError('보안 검증에 실패했습니다.', context);
    }

    // 2. Origin 검증
    if (!validateOrigin(request, allowedOrigins)) {
      logger.logSecurity('Invalid origin', context);
      throw createAuthError('허용되지 않은 출처입니다.', context);
    }

    // 3. 요청 크기 검증
    const contentLength = request.headers.get('content-length');
    if (!validateRequestSize(contentLength, maxRequestSize)) {
      logger.logSecurity('Request size exceeded', context);
      throw createAuthError('요청 크기가 너무 큽니다.', context);
    }

    // 4. Rate Limiting 체크
    if (rateLimit) {
      const rateLimitResult = advancedRateLimit(request, {
        windowMs: 60 * 1000, // 1분
        maxRequests: 100
      });

      if (!rateLimitResult.allowed) {
        logger.logSecurity('Rate limit exceeded', {
          ...context,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        });
        
        const errorResponse = NextResponse.json({
          success: false,
          error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: rateLimitResult.headers['Retry-After']
        }, { status: 429 });
        
        // Rate limit 헤더 추가
        Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
          errorResponse.headers.set(key, value);
        });
        
        return errorResponse;
      }
    }

    // 5. 요청 로깅 (민감한 데이터 마스킹)
    if (logRequest) {
      const maskedContext = maskSensitiveData(context);
      logger.logApiRequest(request.method, request.url, maskedContext);
    }

    const startTime = Date.now();

    try {
      // 6. 인증 체크 (필요한 경우)
      if (requireAuth) {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          logger.logSecurity('Unauthenticated request attempt', context);
          throw createAuthError('인증이 필요합니다.', context);
        }
      }

      // 7. 핸들러 실행
      const response = await handler(...args);
      const responseTime = Date.now() - startTime;

      // 8. 응답 로깅 (민감한 데이터 마스킹)
      if (logResponse) {
        const maskedContext = maskSensitiveData({
          ...context,
          responseTime
        });
        logger.logApiResponse(
          request.method,
          request.url,
          response.status,
          responseTime,
          maskedContext
        );
      }

      // 9. 보안 헤더 추가
      const securedResponse = setSecurityHeaders(response);
      
      // 10. 응답 헤더에 요청 ID 추가
      securedResponse.headers.set('X-Request-ID', context.requestId!);
      securedResponse.headers.set('X-Response-Time', `${responseTime}ms`);

      return securedResponse as NextResponse;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // 에러 응답 로깅 (민감한 데이터 마스킹)
      const maskedContext = maskSensitiveData({
        ...context,
        responseTime,
        error: true
      });
      logger.logApiResponse(
        request.method,
        request.url,
        500, // 에러는 errorHandler에서 처리
        responseTime,
        maskedContext
      );

      throw error; // errorHandler가 처리하도록 재throw
    }
  });
}

// 인증 미들웨어 (JWT 기반)
export async function requireAuth(request: NextRequest): Promise<{ 
  userId: string; 
  userRole: string; 
  email: string;
  tenantId?: string;
}> {
  const user = authenticateRequest(request);
  
  if (!user) {
    throw createAuthError('인증 토큰이 필요합니다.');
  }
  
  return user;
}

// 권한 체크 미들웨어 (보안 강화)
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ 
  userId: string; 
  userRole: string; 
  email: string;
  tenantId?: string;
}> {
  const user = await requireAuth(request);
  
  if (!hasPermission(user.userRole, allowedRoles)) {
    throw createAuthError('접근 권한이 없습니다.');
  }

  return user;
}

// 관리자 권한 체크
export async function requireAdmin(request: NextRequest): Promise<{ 
  userId: string; 
  userRole: string; 
  email: string;
  tenantId?: string;
}> {
  return requireRole(request, ['system_admin', 'super_admin']);
}

// 리소스 접근 권한 체크
export async function requireResourceAccess(
  request: NextRequest,
  resourceType: 'system' | 'admin' | 'team' | 'farm' | 'device',
  action: 'read' | 'write' | 'delete'
): Promise<{ 
  userId: string; 
  userRole: string; 
  email: string;
  tenantId?: string;
}> {
  const user = await requireAuth(request);
  
  if (!canAccessResource(user.userRole, resourceType, action)) {
    throw createAuthError(`${resourceType} 리소스에 대한 ${action} 권한이 없습니다.`);
  }

  return user;
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
