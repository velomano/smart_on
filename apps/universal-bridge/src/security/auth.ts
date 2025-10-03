/**
 * Authentication
 * 
 * PSK, JWT, X.509 인증
 */

import { tokenServer } from './jwt.js';

export type AuthMethod = 'psk' | 'jwt' | 'x509';

export interface AuthContext {
  deviceId: string;
  tenantId: string;
  farmId?: string;
  method: AuthMethod;
}

/**
 * 요청 인증
 * 
 * @param headers - 요청 헤더
 * @returns AuthContext
 * 
 * TODO:
 * - [ ] PSK 인증 구현
 * - [ ] JWT 검증
 * - [ ] X.509 인증서 검증
 * - [ ] 타임스탬프 검증 (5분 윈도우)
 */
export async function authenticateRequest(
  headers: Record<string, string | undefined>
): Promise<AuthContext> {
  const deviceId = headers['x-device-id'];
  const tenantId = headers['x-tenant-id'];
  const signature = headers['x-signature'];
  const timestamp = headers['x-timestamp'];

  if (!deviceId || !tenantId) {
    throw new AuthError('Missing required headers');
  }

  // TODO: 실제 인증 로직
  console.log('[Auth] TODO: Verify signature', { deviceId, tenantId });

  return {
    deviceId,
    tenantId,
    method: 'psk',
  };
}

/**
 * Setup Token 검증
 */
export async function verifySetupToken(
  token: string,
  clientIp?: string
): Promise<{ tenantId: string; farmId?: string }> {
  try {
    // JWT 토큰 검증
    const payload = tokenServer.verifySetupToken(token);
    
    // 토큰 만료 확인
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Setup token expired');
    }
    
    // Setup 토큰 타입 확인
    if (!payload.setup) {
      throw new Error('Invalid setup token type');
    }
    
    console.log('[Auth] Setup token verified', { 
      tenantId: payload.tenantId, 
      farmId: payload.farmId,
      clientIp 
    });
    
    return {
      tenantId: payload.tenantId,
      farmId: payload.farmId
    };
  } catch (error) {
    console.warn('[Auth] Setup token verification failed', { 
      error: error instanceof Error ? error.message : String(error),
      clientIp 
    });
    throw error;
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

