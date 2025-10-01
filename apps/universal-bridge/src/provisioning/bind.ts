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
  // Setup Token 검증
  const { getClaimByToken, markClaimAsUsed } = await import('../db/index.js');
  
  const claim = await getClaimByToken(req.setupToken);
  if (!claim) {
    throw new Error('Invalid or expired setup token');
  }
  
  const tenantId = claim.tenant_id;
  const farmId = claim.farm_id;

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

  // DB에 디바이스 저장
  const { createDevice, hashDeviceKey } = await import('../db/index.js');
  
  const device = await createDevice({
    tenant_id: tenantId,
    farm_id: farmId,
    device_id: req.deviceId,
    device_key_hash: hashDeviceKey(deviceKey),
    device_type: req.deviceType,
    capabilities: req.capabilities,
  });
  
  console.log('[Bind] Device saved to DB:', device.id);

  // Setup Token을 사용됨 처리
  await markClaimAsUsed(claim.id, req.deviceId);
  console.log('[Bind] Setup token marked as used');

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

