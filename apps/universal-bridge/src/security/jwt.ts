/**
 * JWT Token Server
 * 
 * 디바이스 토큰 발급 및 검증
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || '24h';

export interface DeviceTokenPayload {
  deviceId: string;
  tenantId: string;
  farmId?: string;
  deviceType?: string;
  capabilities?: string[];
  iat?: number;
  exp?: number;
}

export interface SetupTokenPayload {
  type: 'setup';
  tenantId: string;
  farmId?: string;
  deviceType?: string;
  capabilities?: string[];
  setup: boolean;
  iat?: number;
  exp?: number;
}

export class TokenServer {
  /**
   * 디바이스 토큰 생성
   */
  generateDeviceToken(
    deviceId: string,
    tenantId: string,
    farmId?: string,
    deviceType?: string,
    capabilities?: string[]
  ): string {
    const payload: DeviceTokenPayload = {
      deviceId,
      tenantId,
      farmId,
      deviceType,
      capabilities
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRES_IN,
      issuer: 'universal-bridge',
      audience: 'iot-devices'
    } as any);
  }

  /**
   * 토큰 검증
   */
  verifyToken(token: string): DeviceTokenPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        issuer: 'universal-bridge',
        audience: 'iot-devices'
      } as any) as unknown as DeviceTokenPayload;

      return payload;
    } catch (error) {
      throw new Error(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 토큰 TTL 확인
   */
  getTokenTimeToLive(token: string): number {
    try {
      const payload = jwt.decode(token) as DeviceTokenPayload;
      if (!payload || !payload.exp) {
        return 0;
      }

      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, payload.exp - now);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 토큰에서 디바이스 정보 추출
   */
  extractDeviceInfo(token: string): DeviceTokenPayload {
    const payload = jwt.decode(token) as DeviceTokenPayload;
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    return payload;
  }

  /**
   * 디바이스 토큰 검증 (별칭)
   */
  verifyDeviceToken(token: string): DeviceTokenPayload {
    return this.verifyToken(token);
  }

  /**
   * Setup Token 생성 (프로비저닝용)
   */
  generateSetupToken(
    tenantId: string,
    farmId?: string,
    deviceType?: string,
    capabilities?: string[]
  ): string {
    const payload = {
      type: 'setup',
      tenantId,
      farmId,
      deviceType,
      capabilities,
      setup: true
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '1h',
      issuer: 'universal-bridge',
      audience: 'setup-tokens'
    } as any);
  }

  /**
   * 디바이스 토큰 갱신
   */
  refreshDeviceToken(
    deviceId: string,
    tenantId: string,
    farmId?: string,
    deviceType?: string,
    capabilities?: string[]
  ): string {
    return this.generateDeviceToken(deviceId, tenantId, farmId, deviceType, capabilities);
  }

  /**
   * Setup Token 검증
   */
  verifySetupToken(token: string): SetupTokenPayload {
    return this.verifyToken(token) as unknown as SetupTokenPayload;
  }

  /**
   * 토큰 디코딩 (검증 없이)
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}

export const tokenServer = new TokenServer();