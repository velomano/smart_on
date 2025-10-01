/**
 * Connect API
 * 
 * 연결 마법사 API 래퍼
 * TODO: 실제 API 호출 구현
 */

/**
 * Setup Token 발급
 */
export async function generateSetupToken(params: {
  tenantId: string;
  farmId?: string;
  ttl?: number;
}) {
  // TODO: POST /api/provisioning/claim
  console.log('[API] TODO: generateSetupToken', params);
  
  return {
    token: 'ST_xxxxxxxxxxxx',
    expiresAt: new Date(Date.now() + 600000).toISOString(),
    qrCode: 'data:image/png;base64,...',
  };
}

/**
 * 디바이스 바인딩
 */
export async function bindDevice(params: {
  setupToken: string;
  deviceId: string;
  deviceType: string;
  capabilities: string[];
}) {
  // TODO: POST /api/provisioning/bind
  console.log('[API] TODO: bindDevice', params);
  
  return {
    deviceKey: 'DK_yyyyyyyyyyyy',
    tenantId: 'tenant-xxx',
    farmId: 'farm-yyy',
  };
}

/**
 * 키 회전
 */
export async function rotateKey(params: {
  deviceId: string;
  currentKey: string;
  reason: string;
}) {
  // TODO: POST /api/provisioning/rotate
  console.log('[API] TODO: rotateKey', params);
  
  return {
    newKey: 'DK_zzzzzzzzzz',
    gracePeriod: 3600,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  };
}

/**
 * 대기 중인 명령 조회
 */
export async function pollCommands(deviceId: string) {
  // TODO: GET /api/bridge/commands/:deviceId
  console.log('[API] TODO: pollCommands', deviceId);
  
  return {
    commands: [],
  };
}

