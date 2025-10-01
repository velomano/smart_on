import { NextRequest } from 'next/server';
import crypto from 'crypto';

// 보안 헤더 설정
export function setSecurityHeaders(response: Response): Response {
  // XSS 보호
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:;"
  );
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  return response;
}

// 민감한 데이터 마스킹
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'api_key', 
    'auth', 'credential', 'private', 'service_key'
  ];
  
  const masked = { ...data };
  
  for (const key in masked) {
    if (sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    )) {
      if (typeof masked[key] === 'string' && masked[key].length > 0) {
        masked[key] = '***MASKED***';
      }
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  
  return masked;
}

// IP 화이트리스트 체크
export function isAllowedIP(ip: string, allowedIPs: string[] = []): boolean {
  // 개발환경에서는 모든 IP 허용
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // 운영환경에서 화이트리스트 체크
  if (allowedIPs.length === 0) {
    return true; // 화이트리스트가 없으면 모든 IP 허용
  }
  
  return allowedIPs.includes(ip);
}

// 요청 크기 제한 체크
export function validateRequestSize(contentLength: string | null, maxSize: number = 1024 * 1024): boolean {
  if (!contentLength) {
    return true; // Content-Length가 없으면 체크 스킵
  }
  
  const size = parseInt(contentLength, 10);
  return size <= maxSize;
}

// SQL Injection 방지
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // 기본적인 SQL Injection 패턴 제거
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi,
    /(\bOR\b|\bAND\b).*(\b=\b|\bLIKE\b)/gi
  ];
  
  let sanitized = input;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
}

// XSS 방지
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // HTML 태그 제거
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// CSRF 토큰 생성
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// CSRF 토큰 검증
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false;
  }
  
  // 시간 기반 토큰 검증 (선택적)
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(sessionToken, 'hex')
  );
}

// 요청 출처 검증
export function validateOrigin(request: NextRequest, allowedOrigins: string[] = []): boolean {
  const origin = request.headers.get('origin');
  
  if (!origin) {
    return true; // Origin 헤더가 없으면 허용 (서버 간 통신)
  }
  
  if (process.env.NODE_ENV === 'development') {
    return true; // 개발환경에서는 모든 Origin 허용
  }
  
  if (allowedOrigins.length === 0) {
    return true; // 허용 목록이 없으면 모든 Origin 허용
  }
  
  return allowedOrigins.includes(origin);
}

// 비밀번호 강도 검증
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // 길이 검증
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('비밀번호는 최소 8자 이상이어야 합니다.');
  }
  
  // 대문자 포함
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('대문자를 포함해야 합니다.');
  }
  
  // 소문자 포함
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('소문자를 포함해야 합니다.');
  }
  
  // 숫자 포함
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('숫자를 포함해야 합니다.');
  }
  
  // 특수문자 포함
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('특수문자를 포함해야 합니다.');
  }
  
  // 일반적인 비밀번호 패턴 검증
  const commonPatterns = [
    /password/i,
    /123456/,
    /qwerty/i,
    /admin/i,
    /letmein/i
  ];
  
  if (commonPatterns.some(pattern => pattern.test(password))) {
    feedback.push('너무 일반적인 비밀번호입니다.');
    score -= 2;
  }
  
  const isValid = score >= 3 && feedback.length === 0;
  
  return {
    isValid,
    score,
    feedback
  };
}

// Rate Limiting을 위한 메모리 기반 저장소
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  
  increment(key: string, windowMs: number, maxRequests: number): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // 만료된 항목 제거
    for (const [k, v] of this.store.entries()) {
      if (v.resetTime < now) {
        this.store.delete(k);
      }
    }
    
    const current = this.store.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (current.resetTime < now) {
      // 새로운 윈도우 시작
      current.count = 1;
      current.resetTime = now + windowMs;
    } else {
      current.count += 1;
    }
    
    this.store.set(key, current);
    
    return {
      allowed: current.count <= maxRequests,
      remaining: Math.max(0, maxRequests - current.count),
      resetTime: current.resetTime
    };
  }
}

export const rateLimitStore = new RateLimitStore();

// 고급 Rate Limiting
export function advancedRateLimit(
  request: NextRequest,
  options: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: NextRequest) => string;
  }
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  headers: Record<string, string>;
} {
  const {
    windowMs = 60 * 1000, // 1분
    maxRequests = 100,
    keyGenerator = (req) => getClientIP(req)
  } = options;
  
  const key = keyGenerator(request);
  const result = rateLimitStore.increment(key, windowMs, maxRequests);
  
  const headers = {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'Retry-After': result.allowed ? '0' : Math.ceil((result.resetTime - Date.now()) / 1000).toString()
  };
  
  return {
    ...result,
    headers
  };
}

// 클라이언트 IP 추출 (프록시 고려)
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// 세션 보안 검증
export function validateSessionSecurity(request: NextRequest): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // User-Agent 검증
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    issues.push('유효하지 않은 User-Agent');
  }
  
  // Referer 검증 (선택적)
  const referer = request.headers.get('referer');
  if (referer) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://web-admin-snowy.vercel.app',
      'https://web-admin-smart-ons-projects.vercel.app',
      process.env.NEXT_PUBLIC_APP_URL
    ].filter(Boolean);
    
    const isAllowedReferer = allowedOrigins.some(origin => referer.startsWith(origin as string));
    if (!isAllowedReferer) {
      issues.push('외부 도메인에서의 접근');
    }
  }
  
  // 요청 헤더 검증
  const contentType = request.headers.get('content-type');
  if (request.method === 'POST' && !contentType) {
    issues.push('Content-Type 헤더 누락');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}
