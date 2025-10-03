/**
 * Claim (Setup Token 발급)
 * 
 * JWT 토큰 서버와 연동된 완전한 프로비저닝 시스템
 */

import crypto from 'crypto';
import { tokenServer, type SetupTokenPayload } from '../security/jwt.js';
import { logger } from '../utils/logger.js';
import type { SetupToken } from '../types.js';

export interface ClaimRequest {
  tenantId: string;
  farmId?: string;
  deviceType?: string;
  capabilities?: string[];
  ttl?: number;  // seconds, default 600 (10분)
  ipWhitelist?: string[];
  userAgent?: string;
}

/**
 * Setup Token 발급 (JWT 토큰 서버 연동)
 * 
 * @param req - 발급 요청
 * @returns SetupToken
 */
export async function generateSetupToken(
  req: ClaimRequest
): Promise<SetupToken> {
  // JWT 토큰 서버를 사용하여 설정 토큰 생성
  const tokenString = tokenServer.generateSetupToken(
    req.tenantId,
    req.farmId,
    req.deviceType,
    req.capabilities
  );

  const setupToken: SetupToken = {
    token: tokenString,
    tenantId: req.tenantId,
    farmId: req.farmId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1시간 후
    ipWhitelist: req.ipWhitelist,
    userAgent: req.userAgent,
  };

  logger.info('Setup token generated via JWT server', {
    token: setupToken.token.substring(0, 10) + '...',
    tenantId: setupToken.tenantId,
    farmId: setupToken.farmId,
    expiresAt: setupToken.expiresAt
  });

  // TODO: 실제 DB 저장 구현
  // const { createClaim, hashSetupToken } = await import('../db/index.js');
  // await createClaim({...});

  return setupToken;
}

/**
 * QR 코드 데이터 생성
 * 
 * TODO:
 * - [ ] QR 코드 이미지 생성
 * - [ ] 데이터 압축
 */
export function generateQRData(token: SetupToken): string {
  // QR 코드는 모바일 웹 프로비저닝 페이지로 연결
  const webAdminUrl = process.env.WEB_ADMIN_URL || 'http://localhost:3001';
  const provisionUrl = `${webAdminUrl}/provision?token=${token.token}&tenant=${token.tenantId}&farm=${token.farmId || ''}`;
  
  return provisionUrl;
}

