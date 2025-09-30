import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

// 간단한 메트릭 조회 (미들웨어 없이)
export async function GET(request: NextRequest) {
  try {
    console.log('간단한 메트릭 조회 요청');

    const supabase = getServiceClient();
    if (!supabase) {
      throw new Error('Supabase 클라이언트를 사용할 수 없습니다.');
    }

    // 기본 메트릭 수집
    const [usersResult, farmsResult, devicesResult, sensorsResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('farms').select('id', { count: 'exact', head: true }),
      supabase.from('devices').select('id', { count: 'exact', head: true }),
      supabase.from('sensors').select('id', { count: 'exact', head: true })
    ]);

    const metrics = {
      timestamp: new Date().toISOString(),
      users: {
        total: usersResult.count || 0,
        active: 0, // TODO: 실제 활성 사용자 계산
        approved: 0, // TODO: 실제 승인된 사용자 계산
        pending: 0 // TODO: 실제 대기 중인 사용자 계산
      },
      farms: {
        total: farmsResult.count || 0,
        active: farmsResult.count || 0 // 임시로 모든 농장을 활성으로 간주
      },
      devices: {
        total: devicesResult.count || 0,
        online: 0, // TODO: 실제 온라인 디바이스 계산
        offline: 0, // TODO: 실제 오프라인 디바이스 계산
        byType: {} // TODO: 디바이스 타입별 분포 계산
      },
      sensors: {
        total: sensorsResult.count || 0,
        active: sensorsResult.count || 0, // 임시로 모든 센서를 활성으로 간주
        inactive: 0,
        byType: {} // TODO: 센서 타입별 분포 계산
      },
      data: {
        totalReadings: 0, // TODO: 실제 센서 데이터 수 계산
        last24Hours: 0, // TODO: 최근 24시간 데이터 수 계산
        averagePerHour: 0 // TODO: 시간당 평균 데이터 수 계산
      },
      performance: {
        averageResponseTime: 100, // 임시값
        errorRate: 0.01, // 임시값
        uptime: Math.round(process.uptime())
      }
    };

    console.log('간단한 메트릭 조회 완료:', {
      totalUsers: metrics.users.total,
      totalFarms: metrics.farms.total,
      totalDevices: metrics.devices.total,
      totalSensors: metrics.sensors.total
    });

    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('간단한 메트릭 조회 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
