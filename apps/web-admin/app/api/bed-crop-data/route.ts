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

  // bed_crop_data 테이블에서 작물 정보 삭제
  const { error: cropDataError } = await supabase
    .from('bed_crop_data')
    .delete()
    .eq('device_id', body.deviceId)
    .eq('tier_number', tierNumber);

  if (cropDataError) {
    logger.error('bed_crop_data 삭제 실패', { error: cropDataError.message });
    throw createDatabaseError('작물 정보 삭제에 실패했습니다.');
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
