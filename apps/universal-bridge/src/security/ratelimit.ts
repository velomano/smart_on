/**
 * Rate Limiter
 * 
 * Token Bucket 알고리즘
 * TODO: Redis 기반 분산 레이트리밋
 */

interface RateLimitConfig {
  points: number;      // 허용 요청 수
  duration: number;    // 기간 (초)
  blockDuration?: number;  // 차단 시간 (초)
}

/**
 * 레이트 리미터
 * 
 * TODO:
 * - [ ] Redis 연동
 * - [ ] 분산 환경 지원
 * - [ ] 동적 레이트 조정
 */
export class RateLimiter {
  private limits = new Map<string, { count: number; resetAt: number }>();

  constructor(private config: RateLimitConfig) {}

  /**
   * 레이트 리밋 확인 및 소비
   * 
   * @param key - 리밋 키 (tenant:device 등)
   * @returns 허용 여부
   */
  async consume(key: string): Promise<boolean> {
    const now = Date.now();
    let limit = this.limits.get(key);

    // 리밋 초기화 또는 리셋
    if (!limit || now > limit.resetAt) {
      limit = {
        count: this.config.points,
        resetAt: now + this.config.duration * 1000,
      };
      this.limits.set(key, limit);
    }

    // 포인트 소비
    if (limit.count > 0) {
      limit.count--;
      return true;
    }

    // 리밋 초과
    console.warn('[RateLimit] Limit exceeded:', { key, config: this.config });
    return false;
  }

  /**
   * 남은 포인트 확인
   */
  async getRemaining(key: string): Promise<number> {
    const limit = this.limits.get(key);
    if (!limit || Date.now() > limit.resetAt) {
      return this.config.points;
    }
    return limit.count;
  }

  /**
   * 리밋 리셋
   */
  async reset(key: string): Promise<void> {
    this.limits.delete(key);
  }
}

// 사전 정의된 리미터들
export const tenantLimiter = new RateLimiter({
  points: 10000,    // 1만 req/min
  duration: 60,
});

export const deviceLimiter = new RateLimiter({
  points: 60,       // 60 req/min
  duration: 60,
  blockDuration: 300,  // 5분 차단
});

