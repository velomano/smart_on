/**
 * Rotate (키 회전)
 * 
 * TODO: 무중단 키 교체 구현
 */

import crypto from 'crypto';
import type { KeyRotation } from '../types.js';

export interface RotateRequest {
  deviceId: string;
  currentKey: string;
  reason: 'scheduled_rotation' | 'key_compromised';
}

/**
 * 디바이스 키 회전
 * 
 * @param req - 회전 요청
 * @returns KeyRotation
 * 
 * TODO:
 * - [ ] 현재 키 검증
 * - [ ] 새 키 발급
 * - [ ] Grace Period 동안 두 키 모두 유효
 * - [ ] 만료 후 구 키 삭제
 */
export async function rotateDeviceKey(
  req: RotateRequest
): Promise<KeyRotation> {
  // TODO: 현재 키 검증
  console.log('[Rotate] TODO: Verify current key', req.deviceId);

  // 새 키 발급
  const newKey = `DK_${crypto.randomBytes(32).toString('hex')}`;
  
  // Grace Period 설정 (1시간)
  const gracePeriod = 3600;  // seconds
  const expiresAt = new Date(Date.now() + gracePeriod * 1000);

  const rotation: KeyRotation = {
    deviceId: req.deviceId,
    oldKey: req.currentKey,
    newKey,
    gracePeriod,
    expiresAt,
  };

  // TODO: DB에 새 키 저장 (두 키 모두 유효하게)
  console.log('[Rotate] TODO: Update device keys in DB', rotation);

  // TODO: Grace Period 후 구 키 삭제 스케줄링
  console.log('[Rotate] TODO: Schedule old key deletion', {
    deviceId: req.deviceId,
    expiresAt,
  });

  return rotation;
}

/**
 * Grace Period 종료 후 구 키 삭제
 * 
 * TODO:
 * - [ ] Cron job으로 주기적 실행
 * - [ ] 만료된 키 일괄 삭제
 */
export async function cleanupExpiredKeys(): Promise<void> {
  // TODO: DB에서 만료된 키 삭제
  console.log('[Rotate] TODO: Cleanup expired keys');
}

