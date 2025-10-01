/**
 * Message Signer
 * 
 * HMAC-SHA256 서명
 * TODO: 실제 서명 구현
 */

import crypto from 'crypto';

/**
 * HMAC-SHA256 서명 생성
 * 
 * @param key - 디바이스 키
 * @param data - 서명할 데이터
 * @returns 서명 (hex)
 */
export function sign(key: string, data: string): string {
  return crypto
    .createHmac('sha256', key)
    .update(data)
    .digest('hex');
}

/**
 * 서명 검증
 * 
 * @param key - 디바이스 키
 * @param data - 원본 데이터
 * @param signature - 검증할 서명
 * @returns 검증 성공 여부
 */
export function verify(key: string, data: string, signature: string): boolean {
  const expected = sign(key, data);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

/**
 * 요청 서명 생성 (body + timestamp)
 * 
 * TODO:
 * - [ ] 타임스탬프 검증 로직
 * - [ ] Replay attack 방지
 */
export function signRequest(
  deviceKey: string,
  body: string,
  timestamp: number
): string {
  return sign(deviceKey, body + timestamp.toString());
}

/**
 * 요청 서명 검증
 */
export function verifyRequest(
  deviceKey: string,
  body: string,
  timestamp: number,
  signature: string
): boolean {
  // 타임스탬프 검증 (5분 윈도우)
  const now = Date.now();
  const timeDiff = Math.abs(now - timestamp);
  if (timeDiff > 300000) {  // 5분
    console.warn('[Signer] Timestamp out of window:', { timeDiff });
    return false;
  }

  return verify(deviceKey, body + timestamp.toString(), signature);
}

