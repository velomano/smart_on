/**
 * Security Middleware
 * 
 * 인증 및 권한 검증 미들웨어
 */

import type { Request, Response, NextFunction } from 'express';
import { tokenServer, type DeviceTokenPayload } from './jwt.js';

export interface AuthenticatedRequest extends Request {
  device?: DeviceTokenPayload;
  tenantId?: string;
  farmId?: string;
}

/**
 * 디바이스 인증 미들웨어
 */
export function authenticateDevice(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const payload = tokenServer.verifyToken(token);
      
      req.device = payload;
      req.tenantId = payload.tenantId;
      req.farmId = payload.farmId;
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
    return;
  }
}

/**
 * 테넌트 ID 검증 미들웨어
 */
export function validateTenantId(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const tenantId = req.headers['x-tenant-id'] as string || req.device?.tenantId;
  
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required' });
    return;
  }

  req.tenantId = tenantId;
  next();
}

/**
 * 선택적 인증 (토큰이 있으면 검증, 없으면 통과)
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next(); // No token, continue without auth
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = tokenServer.verifyToken(token);
      
      req.device = payload;
      req.tenantId = payload.tenantId;
      req.farmId = payload.farmId;
    } catch (error) {
      // Invalid token, but continue without auth
    }
    
    next();
  } catch (error) {
    next(); // Continue without auth on error
  }
}