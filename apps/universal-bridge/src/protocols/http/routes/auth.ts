/**
 * Authentication API Routes
 * 
 * 토큰 발급, 검증, 갱신 관련 API 엔드포인트
 */

import type { Request, Response } from 'express';
import { tokenServer } from '../../security/jwt.js';
import { authenticateDevice, type AuthenticatedRequest } from '../../security/middleware.js';
import { logger } from '../../utils/logger.js';

/**
 * 디바이스 토큰 발급
 * 
 * POST /api/auth/token
 * 
 * Body: {
 *   deviceId: string,
 *   tenantId: string,
 *   farmId?: string,
 *   deviceType?: string,
 *   capabilities?: string[]
 * }
 */
export async function generateToken(req: Request, res: Response): Promise<void> {
  try {
    const { deviceId, tenantId, farmId, deviceType, capabilities } = req.body;

    // 필수 필드 검증
    if (!deviceId || !tenantId) {
      res.status(400).json({ 
        error: 'deviceId and tenantId are required' 
      });
      return;
    }

    // 토큰 발급
    const token = tokenServer.generateDeviceToken(
      deviceId,
      tenantId,
      farmId,
      deviceType,
      capabilities
    );

    // 토큰 TTL 확인
    const ttl = tokenServer.getTokenTimeToLive(token);

    logger.info('Device token generated via API', { 
      deviceId, 
      tenantId, 
      farmId 
    });

    res.json({
      success: true,
      token,
      expiresIn: ttl,
      deviceId,
      tenantId,
      farmId
    });
  } catch (error: any) {
    logger.error('Token generation failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to generate token' 
    });
  }
}

/**
 * 토큰 검증
 * 
 * GET /api/auth/verify
 * 
 * Headers: Authorization: Bearer <token>
 */
export async function verifyToken(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.device) {
      res.status(401).json({ error: 'No device information found' });
      return;
    }

    const ttl = tokenServer.getTokenTimeToLive(req.headers.authorization!.substring(7));

    res.json({
      success: true,
      valid: true,
      device: req.device,
      expiresIn: ttl
    });
  } catch (error: any) {
    logger.error('Token verification failed', { error: error.message });
    res.status(500).json({ 
      error: 'Token verification failed' 
    });
  }
}

/**
 * 토큰 갱신
 * 
 * POST /api/auth/refresh
 * 
 * Headers: Authorization: Bearer <old-token>
 */
export async function refreshToken(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const oldToken = authHeader.substring(7);
    const newToken = tokenServer.refreshDeviceToken(oldToken);
    const ttl = tokenServer.getTokenTimeToLive(newToken);

    logger.info('Token refreshed', { 
      deviceId: req.device?.deviceId,
      tenantId: req.device?.tenantId 
    });

    res.json({
      success: true,
      token: newToken,
      expiresIn: ttl,
      device: req.device
    });
  } catch (error: any) {
    logger.error('Token refresh failed', { error: error.message });
    res.status(401).json({ 
      error: 'Token refresh failed: ' + error.message 
    });
  }
}

/**
 * 설정 토큰 발급
 * 
 * POST /api/auth/setup-token
 * 
 * Body: {
 *   tenantId: string,
 *   farmId?: string,
 *   ipWhitelist?: string[],
 *   userAgent?: string
 * }
 */
export async function generateSetupToken(req: Request, res: Response): Promise<void> {
  try {
    const { tenantId, farmId, ipWhitelist, userAgent } = req.body;

    if (!tenantId) {
      res.status(400).json({ 
        error: 'tenantId is required' 
      });
      return;
    }

    const setupToken = tokenServer.generateSetupToken(
      tenantId,
      farmId,
      ipWhitelist,
      userAgent
    );

    logger.info('Setup token generated via API', { 
      tenantId, 
      farmId,
      ipWhitelist 
    });

    res.json({
      success: true,
      setupToken: setupToken.token,
      expiresAt: setupToken.expiresAt.toISOString(),
      tenantId: setupToken.tenantId,
      farmId: setupToken.farmId
    });
  } catch (error: any) {
    logger.error('Setup token generation failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to generate setup token' 
    });
  }
}

/**
 * 설정 토큰 검증
 * 
 * POST /api/auth/verify-setup-token
 * 
 * Body: {
 *   token: string,
 *   clientIp?: string
 * }
 */
export async function verifySetupToken(req: Request, res: Response): Promise<void> {
  try {
    const { token, clientIp } = req.body;

    if (!token) {
      res.status(400).json({ 
        error: 'token is required' 
      });
      return;
    }

    const result = tokenServer.verifySetupToken(token, clientIp);

    logger.info('Setup token verified via API', { 
      token: token.substring(0, 10) + '...', // 보안을 위해 일부만 로그
      clientIp 
    });

    res.json({
      success: true,
      valid: true,
      tenantId: result.tenantId,
      farmId: result.farmId
    });
  } catch (error) {
    logger.warn('Setup token verification failed', { 
      error: error.message,
      clientIp: req.ip 
    });
    res.status(401).json({ 
      error: 'Setup token verification failed: ' + error.message 
    });
  }
}

/**
 * 토큰 정보 조회 (디코드만, 검증 없음)
 * 
 * POST /api/auth/decode-token
 * 
 * Body: {
 *   token: string
 * }
 */
export async function decodeToken(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ 
        error: 'token is required' 
      });
      return;
    }

    const payload = tokenServer.decodeToken(token);

    if (!payload) {
      res.status(400).json({ 
        error: 'Invalid token format' 
      });
      return;
    }

    res.json({
      success: true,
      payload,
      ttl: tokenServer.getTokenTimeToLive(token)
    });
  } catch (error: any) {
    logger.error('Token decode failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to decode token' 
    });
  }
}

/**
 * 인증 상태 확인
 * 
 * GET /api/auth/status
 * 
 * Headers: Authorization: Bearer <token>
 */
export async function getAuthStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.device) {
      res.status(401).json({ 
        authenticated: false,
        error: 'Not authenticated' 
      });
      return;
    }

    const authHeader = req.headers.authorization!;
    const token = authHeader.substring(7);
    const ttl = tokenServer.getTokenTimeToLive(token);

    res.json({
      authenticated: true,
      device: req.device,
      expiresIn: ttl,
      needsRefresh: ttl < 3600 // 1시간 미만이면 갱신 권장
    });
  } catch (error: any) {
    logger.error('Auth status check failed', { error: error.message });
    res.status(500).json({ 
      error: 'Auth status check failed' 
    });
  }
}
