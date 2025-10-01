import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/apiMiddleware';
import { createValidationError, createDatabaseError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

export const POST = withApiMiddleware(async (request: NextRequest) => {
  const supabase = getServiceClient();
  if (!supabase) {
    throw createDatabaseError('Supabase 클라이언트를 사용할 수 없습니다.');
  }

  // 요청 본문 검증
  const body = await validateRequestBody(request, (data): data is {
    deviceId: string;
    tierNumber: number;
    cropData: {
      cropName: string;
      growingMethod?: string;
      plantType?: string;
      startDate?: string;
      harvestDate?: string;
      stageBoundaries?: {
        seed: number[];
        seedling: number[];
      };
    };
  } => {
    return !!(
      data &&
      typeof data.deviceId === 'string' &&
      typeof data.tierNumber === 'number' &&
      data.cropData &&
      typeof data.cropData.cropName === 'string'
    );
  });

  logger.info('작물 정보 저장 요청', {
    deviceId: body.deviceId,
    tierNumber: body.tierNumber,
    cropName: body.cropData.cropName
  });

  // 작물 정보 저장 (upsert 사용)
  const { data, error } = await supabase
    .from('bed_crop_data')
    .upsert({
      device_id: body.deviceId,
      tier_number: body.tierNumber,
      crop_name: body.cropData.cropName,
      growing_method: body.cropData.growingMethod,
      plant_type: body.cropData.plantType,
      start_date: body.cropData.startDate || null,
      harvest_date: body.cropData.harvestDate || null,
      stage_boundaries: body.cropData.stageBoundaries || null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'device_id,tier_number'
    })
    .select();

  if (error) {
    logger.error('작물 정보 저장 실패', { error: error.message });
    throw createDatabaseError('작물 정보 저장에 실패했습니다.');
  }

  logger.info('작물 정보 저장 완료', {
    deviceId: body.deviceId,
    tierNumber: body.tierNumber,
    recordCount: data?.length || 0
  });

  return createApiResponse(data, 200, '작물 정보가 성공적으로 저장되었습니다.');
}, {
  logRequest: true,
  logResponse: true,
  rateLimit: true
});

export const GET = withApiMiddleware(async (request: NextRequest) => {
  const supabase = getServiceClient();
  if (!supabase) {
    throw createDatabaseError('Supabase 클라이언트를 사용할 수 없습니다.');
  }

  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');

  logger.info('작물 정보 조회 요청', { deviceId: deviceId || undefined });

  let query = supabase
    .from('bed_crop_data')
    .select('*')
    .order('tier_number', { ascending: true });

  if (deviceId) {
    query = query.eq('device_id', deviceId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('작물 정보 조회 실패', { error: error.message, deviceId: deviceId || undefined });
    throw createDatabaseError('작물 정보 조회에 실패했습니다.');
  }

  logger.info('작물 정보 조회 완료', {
    deviceId: deviceId || undefined,
    recordCount: data?.length || 0
  });

  return createApiResponse(data);
}, {
  logRequest: true,
  logResponse: true,
  rateLimit: true
});

export const DELETE = withApiMiddleware(async (request: NextRequest) => {
  const supabase = getServiceClient();
  if (!supabase) {
    throw createDatabaseError('Supabase 클라이언트를 사용할 수 없습니다.');
  }

  // 요청 본문 검증
  const body = await validateRequestBody(request, (data): data is {
    deviceId: string;
    tier: string | number;
  } => {
    return !!(
      data &&
      typeof data.deviceId === 'string' &&
      (typeof data.tier === 'string' || typeof data.tier === 'number')
    );
  });

  const tierNumber = parseInt(body.tier.toString());

  logger.info('작물 정보 삭제 요청', {
    deviceId: body.deviceId,
    tier: tierNumber
  });

  // 1. bed_crop_data 테이블에서 작물 정보 삭제
  const { error: cropDataError } = await supabase
    .from('bed_crop_data')
    .delete()
    .eq('device_id', body.deviceId)
    .eq('tier_number', tierNumber);

  if (cropDataError) {
    logger.error('bed_crop_data 삭제 실패', { error: cropDataError.message });
    throw createDatabaseError('작물 정보 삭제에 실패했습니다.');
  }

  // 2. 디바이스 정보 조회 (베드 정보 확인용)
  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('id, bed_id, meta')
    .eq('id', body.deviceId)
    .single();

  if (deviceError) {
    logger.warn('디바이스 조회 실패', { error: deviceError.message });
  } else if (device?.bed_id) {
    // 3. beds 테이블에서 crop 정보 삭제 (해당 베드가 단일 작물을 가진 경우)
    const { error: bedError } = await supabase
      .from('beds')
      .update({ crop: null })
      .eq('id', device.bed_id);

    if (bedError) {
      logger.warn('beds 테이블 crop 정보 삭제 실패', { error: bedError.message });
    }

    // 4. devices.meta에서 crop_name 정보 삭제
    if (device.meta && device.meta.crop_name) {
      const updatedMeta = { ...device.meta };
      delete updatedMeta.crop_name;
      
      const { error: metaError } = await supabase
        .from('devices')
        .update({ meta: updatedMeta })
        .eq('id', body.deviceId);

      if (metaError) {
        logger.warn('devices.meta crop_name 삭제 실패', { error: metaError.message });
      }
    }
  }

  // 5. bed_notes에서 해당 베드의 노트들 삭제 (선택적)
  const { error: notesError } = await supabase
    .from('bed_notes')
    .delete()
    .eq('bed_id', body.deviceId);

  if (notesError) {
    logger.warn('bed_notes 삭제 실패', { error: notesError.message });
    // 노트 삭제 실패는 전체 작업을 중단하지 않음
  }

  logger.info('작물 정보 삭제 완료', {
    deviceId: body.deviceId,
    tier: tierNumber
  });

  return createApiResponse(
    null, 
    200, 
    '작물 정보 및 관련 데이터가 성공적으로 삭제되었습니다.'
  );
}, {
  logRequest: true,
  logResponse: true,
  rateLimit: true
});
