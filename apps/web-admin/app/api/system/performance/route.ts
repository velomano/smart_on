import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware, createApiResponse, requireResourceAccess } from '@/lib/apiMiddleware';
import { logger } from '@/lib/logger';
import { getCacheStats } from '@/lib/cache';

// 성능 메트릭 인터페이스
interface PerformanceMetrics {
  timestamp: string;
  memory: {
    used: number;
    total: number;
    percentage: number;
    heap: {
      used: number;
      total: number;
      external: number;
    };
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  uptime: number;
  cache: {
    systemMetrics: any;
    userData: any;
    farmData: any;
    deviceData: any;
  };
  requests: {
    total: number;
    perSecond: number;
    averageResponseTime: number;
    errorRate: number;
  };
  database: {
    connections: number;
    queryTime: number;
    cacheHitRate: number;
  };
}

// 메모리 사용량 모니터링
function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  const totalMemory = require('os').totalmem();
  const freeMemory = require('os').freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    used: usedMemory,
    total: totalMemory,
    percentage: Math.round((usedMemory / totalMemory) * 100),
    heap: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      external: memUsage.external
    }
  };
}

// CPU 사용량 모니터링
function getCPUUsage() {
  const cpus = require('os').cpus();
  const loadAverage = require('os').loadavg();
  
  // 간단한 CPU 사용률 계산
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach((cpu: any) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = Math.round(100 - ~~(100 * idle / total));

  return {
    usage,
    loadAverage
  };
}

// 요청 통계 (메모리 기반)
class RequestStats {
  private static instance: RequestStats;
  private requests: number = 0;
  private errors: number = 0;
  private totalResponseTime: number = 0;
  private lastReset: number = Date.now();
  private readonly windowMs = 60 * 1000; // 1분 윈도우

  static getInstance(): RequestStats {
    if (!RequestStats.instance) {
      RequestStats.instance = new RequestStats();
    }
    return RequestStats.instance;
  }

  recordRequest(responseTime: number, isError: boolean = false): void {
    const now = Date.now();
    
    // 윈도우 리셋
    if (now - this.lastReset > this.windowMs) {
      this.requests = 0;
      this.errors = 0;
      this.totalResponseTime = 0;
      this.lastReset = now;
    }

    this.requests++;
    if (isError) this.errors++;
    this.totalResponseTime += responseTime;
  }

  getStats(): {
    total: number;
    perSecond: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const now = Date.now();
    const windowSeconds = Math.max(1, (now - this.lastReset) / 1000);
    
    return {
      total: this.requests,
      perSecond: Math.round(this.requests / windowSeconds * 100) / 100,
      averageResponseTime: this.requests > 0 ? Math.round(this.totalResponseTime / this.requests) : 0,
      errorRate: this.requests > 0 ? Math.round((this.errors / this.requests) * 100 * 100) / 100 : 0
    };
  }
}

// 데이터베이스 성능 모니터링
async function getDatabasePerformance() {
  try {
    const { getServiceClient } = await import('@/lib/supabase');
    const supabase = getServiceClient();
    
    if (!supabase) {
      return {
        connections: 0,
        queryTime: 0,
        cacheHitRate: 0
      };
    }

    const startTime = Date.now();
    await supabase.from('users').select('id').limit(1);
    const queryTime = Date.now() - startTime;

    return {
      connections: 1, // TODO: 실제 연결 수 모니터링
      queryTime,
      cacheHitRate: 0 // TODO: Supabase 캐시 히트율 모니터링
    };
  } catch (error) {
    logger.error('데이터베이스 성능 모니터링 실패', { error });
    return {
      connections: 0,
      queryTime: -1,
      cacheHitRate: 0
    };
  }
}

export const GET = withApiMiddleware(async (request: NextRequest) => {
  // TODO: 시스템 모니터링은 system_admin만 접근 가능하도록 인증 구현 필요
  // await requireResourceAccess(request, 'system', 'read');
  
  const startTime = Date.now();
  
  logger.info('성능 메트릭 수집 요청');

  try {
    // 모든 성능 메트릭을 병렬로 수집
    const [memory, cpu, database, cacheStats] = await Promise.all([
      Promise.resolve(getMemoryUsage()),
      Promise.resolve(getCPUUsage()),
      getDatabasePerformance(),
      Promise.resolve(getCacheStats())
    ]);

    const requestStats = RequestStats.getInstance();
    const requestMetrics = requestStats.getStats();

    const performanceMetrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      memory,
      cpu,
      uptime: Math.round(process.uptime()),
      cache: cacheStats as { systemMetrics: any; userData: any; farmData: any; deviceData: any; },
      requests: requestMetrics,
      database
    };

    const responseTime = Date.now() - startTime;
    
    logger.info('성능 메트릭 수집 완료', {
      responseTime,
      memoryUsage: memory.percentage,
      cpuUsage: cpu.usage,
      requestsPerSecond: requestMetrics.perSecond
    });

    return createApiResponse(performanceMetrics);
  } catch (error) {
    logger.error('성능 메트릭 수집 실패', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });

    return createApiResponse({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}, {
  logRequest: true,
  logResponse: true,
  rateLimit: true,
  maxRequestSize: 1024 * 5 // 5KB 제한
});

// 성능 메트릭 수집을 위한 미들웨어 헬퍼
function recordPerformanceMetrics(responseTime: number, isError: boolean = false): void {
  const requestStats = RequestStats.getInstance();
  requestStats.recordRequest(responseTime, isError);
}

// 성능 알림 체크
function checkPerformanceAlerts(metrics: PerformanceMetrics): string[] {
  const alerts: string[] = [];

  // 메모리 사용률 체크
  if (metrics.memory.percentage > 80) {
    alerts.push(`높은 메모리 사용률: ${metrics.memory.percentage}%`);
  }

  // CPU 사용률 체크
  if (metrics.cpu.usage > 80) {
    alerts.push(`높은 CPU 사용률: ${metrics.cpu.usage}%`);
  }

  // 응답 시간 체크
  if (metrics.requests.averageResponseTime > 1000) {
    alerts.push(`느린 평균 응답 시간: ${metrics.requests.averageResponseTime}ms`);
  }

  // 에러율 체크
  if (metrics.requests.errorRate > 5) {
    alerts.push(`높은 에러율: ${metrics.requests.errorRate}%`);
  }

  // 데이터베이스 쿼리 시간 체크
  if (metrics.database.queryTime > 500) {
    alerts.push(`느린 데이터베이스 쿼리: ${metrics.database.queryTime}ms`);
  }

  return alerts;
}
