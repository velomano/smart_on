// 메모리 기반 캐싱 시스템
interface CacheItem<T> {
  value: T;
  expires: number;
  createdAt: number;
}

interface CacheOptions {
  ttl?: number; // Time To Live in milliseconds
  maxSize?: number; // Maximum number of items
}

class MemoryCache<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5분 기본값
    this.maxSize = options.maxSize || 1000; // 1000개 기본값

    // 주기적으로 만료된 항목 정리 (1분마다)
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  // 캐시에 항목 저장
  set(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    
    // 최대 크기 초과 시 가장 오래된 항목 제거
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expires,
      createdAt: Date.now()
    });
  }

  // 캐시에서 항목 조회
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 만료 확인
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  // 캐시에서 항목 제거
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // 캐시 초기화
  clear(): void {
    this.cache.clear();
  }

  // 캐시 크기 반환
  size(): number {
    return this.cache.size;
  }

  // 캐시 통계
  getStats(): {
    size: number;
    hitRate: number;
    oldestItem: number;
    newestItem: number;
  } {
    const items = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: 히트율 계산 구현
      oldestItem: items.length > 0 ? Math.min(...items.map(item => item.createdAt)) : now,
      newestItem: items.length > 0 ? Math.max(...items.map(item => item.createdAt)) : now
    };
  }

  // 만료된 항목 정리
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  // 캐시 인스턴스 정리
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// 전역 캐시 인스턴스들
export const systemMetricsCache = new MemoryCache({
  ttl: 30 * 1000, // 30초
  maxSize: 100
});

export const userDataCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5분
  maxSize: 500
});

export const farmDataCache = new MemoryCache({
  ttl: 2 * 60 * 1000, // 2분
  maxSize: 200
});

export const deviceDataCache = new MemoryCache({
  ttl: 1 * 60 * 1000, // 1분
  maxSize: 1000
});

// 캐시 키 생성 헬퍼
export function generateCacheKey(prefix: string, ...params: (string | number)[]): string {
  return `${prefix}:${params.join(':')}`;
}

// 캐시 래퍼 함수
export async function withCache<T>(
  cache: MemoryCache<T>,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // 캐시에서 조회
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // 캐시에 없으면 데이터 가져와서 저장
  const data = await fetcher();
  cache.set(key, data, ttl);
  
  return data;
}

// 캐시 무효화 헬퍼
export function invalidateCachePattern(
  cache: MemoryCache,
  pattern: string
): void {
  const keys = Array.from((cache as any).cache.keys());
  const regex = new RegExp(pattern);
  
  keys.forEach(key => {
    if (typeof key === 'string' && regex.test(key)) {
      cache.delete(key);
    }
  });
}

// 모든 캐시 정리
export function clearAllCaches(): void {
  systemMetricsCache.clear();
  userDataCache.clear();
  farmDataCache.clear();
  deviceDataCache.clear();
}

// 캐시 통계 조회
export function getCacheStats(): Record<string, any> {
  return {
    systemMetrics: systemMetricsCache.getStats(),
    userData: userDataCache.getStats(),
    farmData: farmDataCache.getStats(),
    deviceData: deviceDataCache.getStats()
  };
}

// Redis 기반 캐싱 (선택적)
export class RedisCache {
  private redis: any;
  private connected: boolean = false;

  constructor(redisClient?: any) {
    this.redis = redisClient;
    this.connected = !!redisClient;
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    if (!this.connected) {
      throw new Error('Redis client not connected');
    }

    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async get(key: string): Promise<any | null> {
    if (!this.connected) {
      throw new Error('Redis client not connected');
    }

    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async delete(key: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Redis client not connected');
    }

    await this.redis.del(key);
  }

  async clear(): Promise<void> {
    if (!this.connected) {
      throw new Error('Redis client not connected');
    }

    await this.redis.flushdb();
  }
}

// 캐시 미들웨어
export function withCacheMiddleware<T>(
  cache: MemoryCache<T>,
  keyGenerator: (request: any) => string,
  fetcher: (request: any) => Promise<T>,
  ttl?: number
) {
  return async (request: any): Promise<T> => {
    const key = keyGenerator(request);
    return withCache(cache, key, () => fetcher(request), ttl);
  };
}

// 캐시 성능 모니터링
export class CacheMonitor {
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };

  recordHit(): void {
    this.stats.hits++;
  }

  recordMiss(): void {
    this.stats.misses++;
  }

  recordSet(): void {
    this.stats.sets++;
  }

  recordDelete(): void {
    this.stats.deletes++;
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  getStats() {
    return {
      ...this.stats,
      hitRate: this.getHitRate()
    };
  }

  reset(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }
}

export const cacheMonitor = new CacheMonitor();
