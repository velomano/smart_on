import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware, createApiResponse } from '@/lib/apiMiddleware';
import { getServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface SystemMetrics {
  timestamp: string;
  users: {
    total: number;
    active: number;
    approved: number;
    pending: number;
  };
  farms: {
    total: number;
    active: number;
  };
  devices: {
    total: number;
    online: number;
    offline: number;
    byType: Record<string, number>;
  };
  sensors: {
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
  };
  data: {
    totalReadings: number;
    last24Hours: number;
    averagePerHour: number;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

async function getUserMetrics() {
  try {
    const supabase = getServiceClient();
    if (!supabase) return null;

    const [totalResult, approvedResult, activeResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_approved', true),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [recentLoginResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('last_login_at', oneDayAgo)
    ]);

    return {
      total: totalResult.count || 0,
      active: recentLoginResult.count || 0,
      approved: approvedResult.count || 0,
      pending: (totalResult.count || 0) - (approvedResult.count || 0)
    };
  } catch (error) {
    logger.error('사용자 메트릭 수집 실패', { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}

async function getFarmMetrics() {
  try {
    const supabase = getServiceClient();
    if (!supabase) return null;

    const [totalResult, activeResult] = await Promise.all([
      supabase.from('farms').select('id', { count: 'exact', head: true }),
      supabase.from('farms').select('id', { count: 'exact', head: true }).not('name', 'is', null)
    ]);

    return {
      total: totalResult.count || 0,
      active: activeResult.count || 0
    };
  } catch (error) {
    logger.error('농장 메트릭 수집 실패', { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}

async function getDeviceMetrics() {
  try {
    const supabase = getServiceClient();
    if (!supabase) return null;

    const [totalResult, devicesResult] = await Promise.all([
      supabase.from('devices').select('id', { count: 'exact', head: true }),
      supabase.from('devices').select('type, status')
    ]);

    const deviceData = devicesResult.data || [];
    const onlineCount = deviceData.filter((d: any) => d.status?.online === true).length;
    const offlineCount = deviceData.length - onlineCount;

    // 디바이스 타입별 카운트
    const byType: Record<string, number> = {};
    deviceData.forEach((device: any) => {
      byType[device.type] = (byType[device.type] || 0) + 1;
    });

    return {
      total: totalResult.count || 0,
      online: onlineCount,
      offline: offlineCount,
      byType
    };
  } catch (error) {
    logger.error('디바이스 메트릭 수집 실패', { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}

async function getSensorMetrics() {
  try {
    const supabase = getServiceClient();
    if (!supabase) return null;

    const [totalResult, sensorsResult] = await Promise.all([
      supabase.from('sensors').select('id', { count: 'exact', head: true }),
      supabase.from('sensors').select('type')
    ]);

    const sensorData = sensorsResult.data || [];
    
    // 센서 타입별 카운트
    const byType: Record<string, number> = {};
    sensorData.forEach((sensor: any) => {
      byType[sensor.type] = (byType[sensor.type] || 0) + 1;
    });

    // TODO: 실제 활성/비활성 센서 로직 구현
    const activeCount = sensorData.length; // 임시로 모든 센서를 활성으로 간주

    return {
      total: totalResult.count || 0,
      active: activeCount,
      inactive: sensorData.length - activeCount,
      byType
    };
  } catch (error) {
    logger.error('센서 메트릭 수집 실패', { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}

async function getDataMetrics() {
  try {
    const supabase = getServiceClient();
    if (!supabase) return null;

    const [totalResult, recentResult] = await Promise.all([
      supabase.from('sensor_readings').select('id', { count: 'exact', head: true }),
      supabase.from('sensor_readings').select('id', { count: 'exact', head: true }).gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    const totalReadings = totalResult.count || 0;
    const last24Hours = recentResult.count || 0;
    const averagePerHour = Math.round(last24Hours / 24);

    return {
      totalReadings,
      last24Hours,
      averagePerHour
    };
  } catch (error) {
    logger.error('데이터 메트릭 수집 실패', { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}

export const GET = withApiMiddleware(async (request: NextRequest) => {
  const startTime = Date.now();
  
  logger.info('시스템 메트릭 수집 요청');

  try {
    // 모든 메트릭을 병렬로 수집
    const [users, farms, devices, sensors, data] = await Promise.all([
      getUserMetrics(),
      getFarmMetrics(),
      getDeviceMetrics(),
      getSensorMetrics(),
      getDataMetrics()
    ]);

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      users: users || { total: 0, active: 0, approved: 0, pending: 0 },
      farms: farms || { total: 0, active: 0 },
      devices: devices || { total: 0, online: 0, offline: 0, byType: {} },
      sensors: sensors || { total: 0, active: 0, inactive: 0, byType: {} },
      data: data || { totalReadings: 0, last24Hours: 0, averagePerHour: 0 },
      performance: {
        averageResponseTime: Date.now() - startTime,
        errorRate: 0.02, // TODO: 실제 에러율 계산
        uptime: Math.round(process.uptime())
      }
    };

    logger.info('시스템 메트릭 수집 완료', {
      responseTime: metrics.performance.averageResponseTime,
      totalUsers: metrics.users.total,
      totalFarms: metrics.farms.total,
      totalDevices: metrics.devices.total
    });

    return createApiResponse(metrics);
  } catch (error) {
    logger.error('시스템 메트릭 수집 실패', { 
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
  rateLimit: true
});
