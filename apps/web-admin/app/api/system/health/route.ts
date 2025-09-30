import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware, createApiResponse, requireResourceAccess } from '@/lib/apiMiddleware';
import { getServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// 시스템 상태 체크 함수들
async function checkDatabase(): Promise<{ status: string; responseTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const supabase = getServiceClient();
    if (!supabase) {
      throw new Error('Supabase 클라이언트를 사용할 수 없습니다.');
    }

    // 간단한 쿼리로 데이터베이스 연결 확인
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'error',
        responseTime,
        error: error.message
      };
    }

    return {
      status: 'healthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkSystemResources(): Promise<{
  memory: { used: number; total: number; percentage: number };
  uptime: number;
  nodeVersion: string;
  platform: string;
}> {
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal + memUsage.external;
  const usedMem = memUsage.heapUsed;
  
  return {
    memory: {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024), // MB
      percentage: Math.round((usedMem / totalMem) * 100)
    },
    uptime: Math.round(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform
  };
}

async function getSystemMetrics(): Promise<{
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
}> {
  try {
    const supabase = getServiceClient();
    if (!supabase) {
      throw new Error('Supabase 클라이언트를 사용할 수 없습니다.');
    }

    // 활성 사용자 수 (최근 1시간 내 로그인한 사용자)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login_at', oneHourAgo);

    // TODO: 실제 메트릭 수집 로직 구현
    // 현재는 임시 데이터 반환
    return {
      activeUsers: activeUsers || 0,
      totalRequests: 1250, // 임시
      errorRate: 0.02, // 2% 임시
      averageResponseTime: 150 // 150ms 임시
    };
  } catch (error) {
    logger.error('시스템 메트릭 수집 실패', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return {
      activeUsers: 0,
      totalRequests: 0,
      errorRate: 0,
      averageResponseTime: 0
    };
  }
}

export const GET = withApiMiddleware(async (request: NextRequest) => {
  // TODO: 시스템 모니터링은 system_admin만 접근 가능하도록 인증 구현 필요
  // await requireResourceAccess(request, 'system', 'read');
  
  const startTime = Date.now();
  
  logger.info('시스템 헬스 체크 요청');

  try {
    // 모든 체크를 병렬로 실행
    const [database, resources, metrics] = await Promise.all([
      checkDatabase(),
      checkSystemResources(),
      getSystemMetrics()
    ]);

    const overallStatus = database.status === 'healthy' ? 'healthy' : 'unhealthy';
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime,
      services: {
        database
      },
      resources,
      metrics,
      version: {
        api: '1.0.0',
        node: process.version,
        platform: process.platform
      }
    };

    logger.info('시스템 헬스 체크 완료', {
      status: overallStatus,
      responseTime,
      databaseStatus: database.status
    });

    return createApiResponse(healthData);
  } catch (error) {
    logger.error('시스템 헬스 체크 실패', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });

    return createApiResponse({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}, {
  logRequest: true,
  logResponse: true,
  rateLimit: true, // 보안을 위해 Rate Limit 적용
  maxRequestSize: 1024 * 10 // 10KB 제한
});
