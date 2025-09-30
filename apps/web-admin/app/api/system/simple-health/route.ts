import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

// 간단한 헬스 체크 (미들웨어 없이)
export async function GET(request: NextRequest) {
  try {
    console.log('간단한 헬스 체크 요청');

    // 데이터베이스 연결 확인
    const supabase = getServiceClient();
    let dbStatus = 'disconnected';
    let dbLatency = -1;
    let dbError: string | null = null;

    if (supabase) {
      const startTime = Date.now();
      try {
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) {
          dbStatus = 'error';
          dbError = error.message;
        } else {
          dbStatus = 'connected';
          dbLatency = Date.now() - startTime;
        }
      } catch (e: any) {
        dbStatus = 'error';
        dbError = e.message;
      }
    } else {
      dbError = 'Supabase client not initialized';
    }

    const healthData = {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          latency_ms: dbLatency,
          error: dbError,
        },
      },
      system: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      }
    };

    console.log('간단한 헬스 체크 완료:', healthData.status);

    return NextResponse.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error('간단한 헬스 체크 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
