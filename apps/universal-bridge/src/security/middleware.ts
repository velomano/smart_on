/**
 * Authentication Middleware
 * 
 * HTTP 요청 및 MQTT 연결 인증 미들웨어
 */

import type { Request, Response, NextFunction } from 'express';
import type { MqttClient } from 'mqtt';
import { tokenServer, type DeviceTokenPayload } from './jwt.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  device?: DeviceTokenPayload;
  tenantId?: string;
  farmId?: string;
}

/**
 * HTTP 요청 디바이스 인증 미들웨어
 */
export function authenticateDevice(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header', { 
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거
    const deviceInfo = tokenServer.verifyDeviceToken(token);

    // 요청 객체에 디바이스 정보 추가
    req.device = deviceInfo;
    req.tenantId = deviceInfo.tenantId;
    req.farmId = deviceInfo.farmId;

    logger.debug('Device authenticated', { 
      deviceId: deviceInfo.deviceId,
      tenantId: deviceInfo.tenantId,
      farmId: deviceInfo.farmId
    });

    next();
    } catch (error: any) {
      logger.warn('Device authentication failed', { 
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(401).json({ error: 'Authentication failed' });
    }
}

/**
 * MQTT 연결 인증
 * 
 * @param client - MQTT 클라이언트
 * @param username - 사용자명
 * @param password - 비밀번호 (JWT 토큰)
 * @returns 인증 결과
 */
export function authenticateMQTTConnection(
  client: MqttClient,
  username: string,
  password: string
): Promise<{ success: boolean; deviceInfo?: DeviceTokenPayload }> {
  return new Promise((resolve) => {
    try {
      // JWT 토큰을 비밀번호로 사용
      const deviceInfo = tokenServer.verifyDeviceToken(password);

      logger.info('MQTT device authenticated', {
        clientId: client.options.clientId,
        deviceId: deviceInfo.deviceId,
        tenantId: deviceInfo.tenantId,
        farmId: deviceInfo.farmId
      });

      resolve({ success: true, deviceInfo });
    } catch (error: any) {
      logger.warn('MQTT authentication failed', {
        clientId: client.options.clientId,
        username,
        error: error.message
      });
      resolve({ success: false });
    }
  });
}

/**
 * 테넌트별 접근 권한 확인
 * 
 * @param req - 인증된 요청
 * @param targetTenantId - 대상 테넌트 ID
 * @returns 권한 확인 결과
 */
export function checkTenantAccess(
  req: AuthenticatedRequest,
  targetTenantId: string
): boolean {
  if (!req.device) {
    return false;
  }

  const hasAccess = req.device.tenantId === targetTenantId;
  
  if (!hasAccess) {
    logger.warn('Tenant access denied', {
      deviceId: req.device.deviceId,
      deviceTenant: req.device.tenantId,
      targetTenant: targetTenantId
    });
  }

  return hasAccess;
}

/**
 * 농장별 접근 권한 확인
 * 
 * @param req - 인증된 요청
 * @param targetFarmId - 대상 농장 ID
 * @returns 권한 확인 결과
 */
export function checkFarmAccess(
  req: AuthenticatedRequest,
  targetFarmId: string
): boolean {
  if (!req.device || !req.device.farmId) {
    return false;
  }

  const hasAccess = req.device.farmId === targetFarmId;
  
  if (!hasAccess) {
    logger.warn('Farm access denied', {
      deviceId: req.device.deviceId,
      deviceFarm: req.device.farmId,
      targetFarm: targetFarmId
    });
  }

  return hasAccess;
}

/**
 * 디바이스 기능 확인
 * 
 * @param req - 인증된 요청
 * @param requiredCapability - 필요한 기능
 * @returns 기능 보유 여부
 */
export function checkDeviceCapability(
  req: AuthenticatedRequest,
  requiredCapability: string
): boolean {
  if (!req.device || !req.device.capabilities) {
    return false;
  }

  const hasCapability = req.device.capabilities.includes(requiredCapability);
  
  if (!hasCapability) {
    logger.warn('Device capability check failed', {
      deviceId: req.device.deviceId,
      requiredCapability,
      availableCapabilities: req.device.capabilities
    });
  }

  return hasCapability;
}

/**
 * 선택적 인증 미들웨어 (인증 실패해도 계속 진행)
 */
export function optionalAuthenticateDevice(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 인증 정보가 없어도 계속 진행
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const deviceInfo = tokenServer.verifyDeviceToken(token);

    req.device = deviceInfo;
    req.tenantId = deviceInfo.tenantId;
    req.farmId = deviceInfo.farmId;

    logger.debug('Optional device authentication successful', { 
      deviceId: deviceInfo.deviceId
    });
    } catch (error: any) {
      logger.debug('Optional device authentication failed', { 
        error: error.message 
      });
    }

  next();
}
