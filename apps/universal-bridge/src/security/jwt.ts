/**
 * JWT Token Server
 * 
 * 디바이스 인증용 JWT 토큰 발급/검증 서버
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

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
  token: string;
  tenantId: string;
  farmId?: string;
  expiresAt: Date;
  ipWhitelist?: string[];
  userAgent?: string;
}

export class JWTTokenServer {
  private readonly secretKey: string;
  private readonly algorithm: jwt.Algorithm = 'HS256';
  private readonly deviceTokenExpiry = '24h'; // 디바이스 토큰 24시간
  private readonly setupTokenExpiry = '1h';   // 설정 토큰 1시간

  constructor() {
    // 환경변수에서 JWT 시크릿 키 가져오기 (없으면 생성)
    this.secretKey = process.env.JWT_SECRET_KEY || this.generateSecretKey();
    
    if (!process.env.JWT_SECRET_KEY) {
      logger.warn('JWT_SECRET_KEY 환경변수가 설정되지 않았습니다. 임시 키를 사용합니다.');
      logger.warn('프로덕션에서는 반드시 JWT_SECRET_KEY를 설정하세요.');
    }
  }

  /**
   * 시크릿 키 생성
   */
  private generateSecretKey(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * 디바이스 토큰 발급
   * 
   * @param deviceId - 디바이스 ID
   * @param tenantId - 테넌트 ID
   * @param farmId - 농장 ID (선택사항)
   * @param deviceType - 디바이스 타입 (선택사항)
   * @param capabilities - 디바이스 기능 목록 (선택사항)
   * @returns JWT 토큰
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
      capabilities,
    };

    const token = jwt.sign(payload, this.secretKey, {
      algorithm: this.algorithm,
      expiresIn: this.deviceTokenExpiry,
      issuer: 'universal-bridge',
      audience: 'iot-devices',
    });

    logger.info('Device token generated', { deviceId, tenantId, farmId });
    return token;
  }

  /**
   * 설정 토큰 발급
   * 
   * @param tenantId - 테넌트 ID
   * @param farmId - 농장 ID (선택사항)
   * @param ipWhitelist - IP 화이트리스트 (선택사항)
   * @param userAgent - 사용자 에이전트 (선택사항)
   * @returns 설정 토큰 정보
   */
  generateSetupToken(
    tenantId: string,
    farmId?: string,
    ipWhitelist?: string[],
    userAgent?: string
  ): SetupTokenPayload {
    const token = `ST_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간

    const setupToken: SetupTokenPayload = {
      token,
      tenantId,
      farmId,
      expiresAt,
      ipWhitelist,
      userAgent,
    };

    logger.info('Setup token generated', { token, tenantId, farmId });
    return setupToken;
  }

  /**
   * JWT 토큰 검증
   * 
   * @param token - JWT 토큰
   * @returns 토큰 페이로드
   */
  verifyDeviceToken(token: string): DeviceTokenPayload {
    try {
      const payload = jwt.verify(token, this.secretKey, {
        algorithms: [this.algorithm],
        issuer: 'universal-bridge',
        audience: 'iot-devices',
      }) as DeviceTokenPayload;

      logger.debug('Device token verified', { deviceId: payload.deviceId });
      return payload;
    } catch (error: any) {
      logger.error('Device token verification failed', { error: error.message });
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * 설정 토큰 검증
   * 
   * @param token - 설정 토큰
   * @param clientIp - 클라이언트 IP (선택사항)
   * @returns 검증 결과
   */
  verifySetupToken(token: string, clientIp?: string): { tenantId: string; farmId?: string } {
    // TODO: DB에서 토큰 조회 및 검증
    // 현재는 임시 구현
    if (!token.startsWith('ST_')) {
      throw new Error('Invalid setup token format');
    }

    // 임시 검증 (실제로는 DB에서 확인)
    logger.info('Setup token verified (temporary)', { token, clientIp });
    
    return {
      tenantId: 'tenant-temp',
      farmId: 'farm-temp',
    };
  }

  /**
   * 토큰 갱신
   * 
   * @param oldToken - 기존 토큰
   * @returns 새로운 토큰
   */
  refreshDeviceToken(oldToken: string): string {
    try {
      const payload = this.verifyDeviceToken(oldToken);
      
      // 새 토큰 발급
      return this.generateDeviceToken(
        payload.deviceId,
        payload.tenantId,
        payload.farmId,
        payload.deviceType,
        payload.capabilities
      );
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message });
      throw new Error('Cannot refresh invalid token');
    }
  }

  /**
   * 토큰에서 디바이스 정보 추출 (검증 없이)
   * 
   * @param token - JWT 토큰
   * @returns 디바이스 정보 (검증되지 않음)
   */
  decodeToken(token: string): DeviceTokenPayload | null {
    try {
      const payload = jwt.decode(token) as DeviceTokenPayload;
      return payload;
    } catch (error: any) {
      logger.error('Token decode failed', { error: error.message });
      return null;
    }
  }

  /**
   * 토큰 만료 시간 확인
   * 
   * @param token - JWT 토큰
   * @returns 만료까지 남은 시간 (초)
   */
  getTokenTimeToLive(token: string): number {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) {
        return 0;
      }

      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, payload.exp - now);
    } catch (error) {
      return 0;
    }
  }
}

// 싱글톤 인스턴스
export const tokenServer = new JWTTokenServer();
