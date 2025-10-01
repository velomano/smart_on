/**
 * Bind (디바이스 바인딩)
 * 
 * TODO: DB 연동 및 디바이스 키 발급
 */

import crypto from 'crypto';
import type { DeviceBinding } from '../types.js';

export interface BindRequest {
  setupToken: string;
  deviceId: string;
  deviceType: string;
  capabilities: string[];
  publicKey?: string;  // X.509 옵션
}

/**
 * 디바이스 바인딩
 * 
 * @param req - 바인딩 요청
 * @returns DeviceBinding
 * 
 * TODO:
 * - [ ] Setup Token 검증 및 사용 처리
 * - [ ] Device Key 발급 (PSK)
 * - [ ] DB에 디바이스 등록
 * - [ ] 테넌트 격리 검증
 */
export async function bindDevice(
  req: BindRequest
): Promise<DeviceBinding> {
  // TODO: Setup Token 검증
  console.log('[Bind] TODO: Verify setup token', req.setupToken);
  
  // 임시 테넌트 정보 (실제로는 토큰에서 추출)
  const tenantId = 'tenant-xxx';
  const farmId = 'farm-yyy';

  // Device Key 발급 (PSK)
  const deviceKey = `DK_${crypto.randomBytes(32).toString('hex')}`;

  const binding: DeviceBinding = {
    deviceId: req.deviceId,
    deviceType: req.deviceType,
    tenantId,
    farmId,
    deviceKey,
    capabilities: req.capabilities,
    publicKey: req.publicKey,
  };

  // TODO: DB에 저장 (device_key는 bcrypt 해시로)
  console.log('[Bind] TODO: Save device to DB', binding);

  // TODO: Setup Token을 사용됨 처리
  console.log('[Bind] TODO: Mark setup token as used');

  return binding;
}

/**
 * 디바이스 키 해시
 */
export function hashDeviceKey(deviceKey: string): string {
  // TODO: bcrypt 사용
  return crypto
    .createHash('sha256')
    .update(deviceKey)
    .digest('hex');
}

