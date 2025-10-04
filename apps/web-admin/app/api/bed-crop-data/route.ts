import { NextRequest, NextResponse } from 'next/server';
import { createSbServer } from '@/lib/db';
import { withTimeout } from '../_lib/withTimeout';

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        ok: false, 
        error: '데이터베이스 연결이 필요합니다. 환경 변수를 확인해주세요.' 
      }, { status: 500 });
    }

    const body = await request.json();
    
    // 작물 정보 저장 (upsert 사용)
    const { data, error } = await withTimeout(
      sb
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
      .select(),
      8_000
    );

    if (error) {
      console.error('작물 정보 저장 실패:', error);
      return NextResponse.json({ 
        ok: false, 
        error: '작물 정보 저장에 실패했습니다.' 
      }, { status: 500 });
    }

    console.log('작물 정보 저장 완료:', {
      deviceId: body.deviceId,
      tierNumber: body.tierNumber,
      cropName: body.cropData.cropName,
      recordId: data?.[0]?.id
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('작물 정보 저장 API 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        ok: false, 
        error: '데이터베이스 연결이 필요합니다. 환경 변수를 확인해주세요.' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    console.log('작물 정보 조회 요청:', { deviceId: deviceId || undefined });

    let query = sb
      .from('bed_crop_data')
      .select('*')
      .order('tier_number', { ascending: true });

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await withTimeout(query, 8_000);

    if (error) {
      console.error('작물 정보 조회 실패:', error);
      return NextResponse.json({ 
        ok: false, 
        error: '작물 정보 조회에 실패했습니다.' 
      }, { status: 500 });
    }

    console.log('작물 정보 조회 완료:', {
      deviceId: deviceId || undefined,
      recordCount: data?.length || 0
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('작물 정보 조회 API 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        ok: false, 
        error: '데이터베이스 연결이 필요합니다. 환경 변수를 확인해주세요.' 
      }, { status: 500 });
    }

    const body = await request.json();
    const tierNumber = parseInt(body.tier.toString());

    console.log('작물 정보 삭제 요청:', {
      deviceId: body.deviceId,
      tier: tierNumber
    });

    // bed_crop_data 테이블에서 작물 정보 삭제
    const { error: cropDataError } = await sb
      .from('bed_crop_data')
      .delete()
      .eq('device_id', body.deviceId)
      .eq('tier_number', tierNumber);

    if (cropDataError) {
      console.error('bed_crop_data 삭제 실패:', cropDataError);
      return NextResponse.json({ 
        ok: false, 
        error: '작물 정보 삭제에 실패했습니다.' 
      }, { status: 500 });
    }

    console.log('작물 정보 삭제 완료:', {
      deviceId: body.deviceId,
      tier: tierNumber
    });

    return NextResponse.json({ 
      ok: true, 
      message: '작물 정보 및 관련 데이터가 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('작물 정보 삭제 API 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}