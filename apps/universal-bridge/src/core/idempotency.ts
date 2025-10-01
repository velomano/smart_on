/**
 * Idempotency Manager
 * 
 * 중복 요청 방지
 * TODO: Redis 연동 구현
 */

/**
 * Idempotency 매니저
 * 
 * TODO:
 * - [ ] Redis 클라이언트 연동
 * - [ ] TTL 관리
 * - [ ] 클러스터 환경 대응
 */
export class IdempotencyManager {
  private cache = new Map<string, any>();  // TODO: Redis로 교체

  /**
   * Idempotency Key 확인
   * 
   * @param key - Idempotency Key
   * @returns 캐시된 응답 또는 null
   */
  async get(key: string): Promise<any | null> {
    // TODO: Redis에서 조회
    return this.cache.get(key) || null;
  }

  /**
   * Idempotency Key 저장
   * 
   * @param key - Idempotency Key
   * @param value - 응답 데이터
   * @param ttl - TTL (초)
   */
  async set(key: string, value: any, ttl: number = 86400): Promise<void> {
    // TODO: Redis에 저장 (TTL 24h)
    this.cache.set(key, value);
    
    // 메모리 캐시는 TTL 후 삭제
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl * 1000);
  }

  /**
   * Idempotency Key 삭제
   */
  async delete(key: string): Promise<void> {
    // TODO: Redis에서 삭제
    this.cache.delete(key);
  }

  /**
   * Idempotent 핸들러 래퍼
   */
  async handle<T>(
    key: string,
    handler: () => Promise<T>
  ): Promise<T> {
    // 1. 캐시 확인
    const cached = await this.get(key);
    if (cached) {
      console.log('[Idempotency] Cache hit:', key);
      return cached as T;
    }

    // 2. 핸들러 실행
    const result = await handler();

    // 3. 캐시 저장
    await this.set(key, result);

    return result;
  }
}

