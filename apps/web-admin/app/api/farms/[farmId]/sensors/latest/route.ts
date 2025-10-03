import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { withApiMiddleware, createApiResponse } from '@/lib/apiMiddleware';
import { createDatabaseError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

export const GET = withApiMiddleware(async (request: NextRequest, { params }: { params: { farmId: string } }) => {
  const supabase = getServiceClient();
  if (!supabase) {
    throw createDatabaseError('Supabase 클라이언트를 사용할 수 없습니다.');
  }

  const { farmId } = params;
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');

  logger.info('센서 데이터 조회 요청', { farmId, deviceId });

  try {
    // iot_readings 테이블에서 최신 센서 데이터 조회
    let query = supabase
      .from('iot_readings')
      .select(`
        key,
        value,
        unit,
        ts,
        iot_devices!inner(
          device_id,
          farm_id,
          device_name,
          device_type
        )
      `)
      .eq('iot_devices.farm_id', farmId)
      .gte('ts', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 최근 5분
      .order('ts', { ascending: false });

    if (deviceId) {
      query = query.eq('iot_devices.device_id', deviceId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('센서 데이터 조회 실패', { error: error.message, farmId, deviceId });
      throw createDatabaseError('센서 데이터 조회에 실패했습니다.');
    }

    // 센서별로 최신 데이터만 그룹화
    const sensorMap = new Map<string, any>();
    
    data?.forEach(reading => {
      const key = `${reading.iot_devices.device_id}_${reading.key}`;
      if (!sensorMap.has(key)) {
        sensorMap.set(key, {
          deviceId: reading.iot_devices.device_id,
          deviceName: reading.iot_devices.device_name,
          deviceType: reading.iot_devices.device_type,
          sensorKey: reading.key,
          value: reading.value,
          unit: reading.unit,
          timestamp: reading.ts,
          quality: getSensorQuality(reading.key, reading.value)
        });
      }
    });

    const sensorData = Array.from(sensorMap.values());

    logger.info('센서 데이터 조회 완료', {
      farmId,
      deviceId,
      sensorCount: sensorData.length
    });

    return createApiResponse(sensorData);
  } catch (error) {
    logger.error('센서 데이터 조회 오류', { error, farmId, deviceId });
    throw error;
  }
}, {
  logRequest: true,
  logResponse: true,
  rateLimit: true
});

// 센서 품질 평가 함수
function getSensorQuality(sensorKey: string, value: number): 'good' | 'warning' | 'error' {
  switch (sensorKey) {
    case 'temperature':
      return value >= 18 && value <= 35 ? 'good' : value >= 10 && value <= 45 ? 'warning' : 'error';
    case 'humidity':
      return value >= 40 && value <= 80 ? 'good' : value >= 20 && value <= 95 ? 'warning' : 'error';
    case 'ec':
      return value >= 1.0 && value <= 3.0 ? 'good' : value >= 0.5 && value <= 4.0 ? 'warning' : 'error';
    case 'ph':
      return value >= 5.5 && value <= 7.5 ? 'good' : value >= 4.0 && value <= 9.0 ? 'warning' : 'error';
    case 'water_level':
      return value >= 20 ? 'good' : value >= 10 ? 'warning' : 'error';
    default:
      return 'good';
  }
}