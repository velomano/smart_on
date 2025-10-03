import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/apiMiddleware';
import { createDatabaseError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

export const POST = withApiMiddleware(async (request: NextRequest, { params }: { params: { farmId: string } }) => {
  const supabase = getServiceClient();
  if (!supabase) {
    throw createDatabaseError('Supabase 클라이언트를 사용할 수 없습니다.');
  }

  const { farmId } = params;

  // 요청 본문 검증
  const body = await validateRequestBody(request, (data): data is {
    deviceId: string;
    actuatorType: string;
    action: 'on' | 'off' | 'toggle';
    value?: number;
  } => {
    return !!(
      data &&
      typeof data.deviceId === 'string' &&
      typeof data.actuatorType === 'string' &&
      ['on', 'off', 'toggle'].includes(data.action)
    );
  });

  logger.info('액추에이터 제어 요청', {
    farmId,
    deviceId: body.deviceId,
    actuatorType: body.actuatorType,
    action: body.action
  });

  try {
    // 액추에이터 제어 명령을 iot_commands 테이블에 저장
    const { data: commandData, error } = await supabase
      .from('iot_commands')
      .insert({
        device_id: body.deviceId,
        command_type: body.actuatorType,
        command_data: {
          action: body.action,
          value: body.value || null,
          timestamp: new Date().toISOString()
        },
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      logger.error('액추에이터 제어 명령 저장 실패', { error: error.message });
      throw createDatabaseError('액추에이터 제어 명령 저장에 실패했습니다.');
    }

    // TODO: 실제 하드웨어 제어 로직 (MQTT, HTTP 등)
    // 여기서는 명령을 저장만 하고, 별도 워커에서 처리하도록 함

    logger.info('액추에이터 제어 명령 저장 완료', {
      commandId: commandData?.[0]?.id,
      deviceId: body.deviceId,
      actuatorType: body.actuatorType,
      action: body.action
    });

    return createApiResponse(commandData, 200, '액추에이터 제어 명령이 전송되었습니다.');
  } catch (error) {
    logger.error('액추에이터 제어 오류', { error, farmId, deviceId: body.deviceId });
    throw error;
  }
}, {
  logRequest: true,
  logResponse: true,
  rateLimit: true
});

export const GET = withApiMiddleware(async (request: NextRequest, { params }: { params: { farmId: string } }) => {
  const supabase = getServiceClient();
  if (!supabase) {
    throw createDatabaseError('Supabase 클라이언트를 사용할 수 없습니다.');
  }

  const { farmId } = params;
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');

  logger.info('액추에이터 상태 조회 요청', { farmId, deviceId });

  try {
    // iot_devices 테이블에서 액추에이터 정보 조회
    let query = supabase
      .from('iot_devices')
      .select(`
        device_id,
        device_name,
        device_type,
        meta,
        status,
        last_seen
      `)
      .eq('farm_id', farmId)
      .in('device_type', ['led', 'pump', 'fan', 'heater', 'cooler']);

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('액추에이터 상태 조회 실패', { error: error.message, farmId, deviceId });
      throw createDatabaseError('액추에이터 상태 조회에 실패했습니다.');
    }

    // 액추에이터별 상태 정보 구성
    const actuatorData = data?.map(device => ({
      deviceId: device.device_id,
      deviceName: device.device_name,
      deviceType: device.device_type,
      status: device.status || 'offline',
      isOnline: device.last_seen ? 
        (new Date().getTime() - new Date(device.last_seen).getTime()) < 5 * 60 * 1000 : false,
      meta: device.meta || {},
      lastSeen: device.last_seen
    })) || [];

    logger.info('액추에이터 상태 조회 완료', {
      farmId,
      deviceId,
      actuatorCount: actuatorData.length
    });

    return createApiResponse(actuatorData);
  } catch (error) {
    logger.error('액추에이터 상태 조회 오류', { error, farmId, deviceId });
    throw error;
  }
}, {
  logRequest: true,
  logResponse: true,
  rateLimit: true
});
