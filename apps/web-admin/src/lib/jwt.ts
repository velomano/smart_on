import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// JWT 설정
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// JWT 페이로드 인터페이스
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
  iat?: number;
  exp?: number;
}

// JWT 토큰 생성
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'smarton-web-admin',
    audience: 'smarton-users'
  });
}

// JWT 리프레시 토큰 생성
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'smarton-web-admin',
    audience: 'smarton-users'
  });
}

// JWT 토큰 검증
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'smarton-web-admin',
      audience: 'smarton-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    console.error('JWT 토큰 검증 실패:', error);
    return null;
  }
}

// JWT 토큰에서 사용자 정보 추출
export function extractUserFromToken(token: string): {
  userId: string;
  userRole: string;
  email: string;
  tenantId?: string;
} | null {
  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }
  
  return {
    userId: payload.userId,
    userRole: payload.role,
    email: payload.email,
    tenantId: payload.tenantId
  };
}

// 요청에서 JWT 토큰 추출
export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

// JWT 토큰 검증 및 사용자 정보 반환
export function authenticateRequest(request: NextRequest): {
  userId: string;
  userRole: string;
  email: string;
  tenantId?: string;
} | null {
  const token = extractTokenFromRequest(request);
  
  if (!token) {
    return null;
  }
  
  return extractUserFromToken(token);
}

// 토큰 만료 시간 확인
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
}

// 토큰에서 남은 시간 계산 (초 단위)
export function getTokenTimeRemaining(token: string): number {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    
    if (!decoded || !decoded.exp) {
      return 0;
    }
    
    const remaining = decoded.exp - Math.floor(Date.now() / 1000);
    return Math.max(0, remaining);
  } catch (error) {
    return 0;
  }
}

// 보안을 위한 토큰 블랙리스트 (실제 구현에서는 Redis 사용 권장)
const tokenBlacklist = new Set<string>();

// 토큰 블랙리스트에 추가
export function blacklistToken(token: string): void {
  tokenBlacklist.add(token);
}

// 토큰이 블랙리스트에 있는지 확인
export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

// 토큰 검증 (블랙리스트 포함)
export function validateToken(token: string): {
  valid: boolean;
  payload?: JWTPayload;
  reason?: string;
} {
  // 블랙리스트 확인
  if (isTokenBlacklisted(token)) {
    return {
      valid: false,
      reason: '토큰이 무효화되었습니다.'
    };
  }
  
  // 토큰 검증
  const payload = verifyToken(token);
  
  if (!payload) {
    return {
      valid: false,
      reason: '유효하지 않은 토큰입니다.'
    };
  }
  
  // 만료 확인
  if (isTokenExpired(token)) {
    return {
      valid: false,
      reason: '토큰이 만료되었습니다.'
    };
  }
  
  return {
    valid: true,
    payload
  };
}

// 사용자 권한 검증
export function hasPermission(
  userRole: string,
  requiredRoles: string[]
): boolean {
  // 역할 우선순위 (높은 권한이 낮은 권한을 포함)
  const roleHierarchy: Record<string, number> = {
    'system_admin': 4,
    'super_admin': 3,
    'team_leader': 2,
    'team_member': 1,
    'user': 0
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = Math.min(...requiredRoles.map(role => roleHierarchy[role] || 0));
  
  return userLevel >= requiredLevel;
}

// 리소스 접근 권한 검증
export function canAccessResource(
  userRole: string,
  resourceType: 'system' | 'admin' | 'team' | 'farm' | 'device',
  action: 'read' | 'write' | 'delete'
): boolean {
  const permissions: Record<string, Record<string, string[]>> = {
    'system_admin': {
      'system': ['read', 'write', 'delete'],
      'admin': ['read', 'write', 'delete'],
      'team': ['read', 'write', 'delete'],
      'farm': ['read', 'write', 'delete'],
      'device': ['read', 'write', 'delete']
    },
    'super_admin': {
      'admin': ['read', 'write', 'delete'],
      'team': ['read', 'write', 'delete'],
      'farm': ['read', 'write', 'delete'],
      'device': ['read', 'write', 'delete']
    },
    'team_leader': {
      'team': ['read', 'write'],
      'farm': ['read', 'write'],
      'device': ['read', 'write']
    },
    'team_member': {
      'farm': ['read'],
      'device': ['read']
    }
  };
  
  const userPermissions = permissions[userRole];
  
  if (!userPermissions) {
    return false;
  }
  
  const resourcePermissions = userPermissions[resourceType];
  
  if (!resourcePermissions) {
    return false;
  }
  
  return resourcePermissions.includes(action);
}
