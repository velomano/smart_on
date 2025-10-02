/**
 * Claim (Setup Token 발급)
 * 
 * TODO: DB 연동 및 QR 코드 생성
 */

import crypto from 'crypto';
import type { SetupToken } from '../types.js';

export interface ClaimRequest {
  tenantId: string;
  farmId?: string;
  ttl?: number;  // seconds, default 600 (10분)
  ipWhitelist?: string[];
  userAgent?: string;
}

/**
 * Setup Token 발급
 * 
 * @param req - 발급 요청
 * @returns SetupToken
 * 
 * TODO:
 * - [ ] DB에 저장 (bcrypt 해시)
 * - [ ] QR 코드 생성
 * - [ ] 만료 시간 자동 정리
 */
export async function generateSetupToken(
  req: ClaimRequest
): Promise<SetupToken> {
  const ttl = req.ttl || 600;  // 기본 10분
  
  // 토큰 생성
  const token = `ST_${crypto.randomBytes(24).toString('hex')}`;
  
  const setupToken: SetupToken = {
    token,
    tenantId: req.tenantId,
    farmId: req.farmId,
    expiresAt: new Date(Date.now() + ttl * 1000),
    ipWhitelist: req.ipWhitelist,
    userAgent: req.userAgent,
  };

  // DB에 저장 (임시로 콘솔 로그만)
  console.log('[Claim] Setup token generated:', {
    token: setupToken.token,
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

