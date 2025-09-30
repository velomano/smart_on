import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 });
    }

    const { deviceId, tierNumber, cropData } = await request.json();

    if (!deviceId || !tierNumber || !cropData?.cropName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 작물 정보 저장 (upsert 사용)
    const { data, error } = await supabase
      .from('bed_crop_data')
      .upsert({
        device_id: deviceId,
        tier_number: tierNumber,
        crop_name: cropData.cropName,
        growing_method: cropData.growingMethod,
        plant_type: cropData.plantType,
        start_date: cropData.startDate || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'device_id,tier_number'
      })
      .select();

    if (error) {
      console.error('작물 정보 저장 오류:', error);
      return NextResponse.json({ error: 'Failed to save crop data' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    let query = supabase
      .from('bed_crop_data')
      .select('*')
      .order('tier_number', { ascending: true });

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('작물 정보 조회 오류:', error);
      return NextResponse.json({ error: 'Failed to fetch crop data' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 });
    }

    const { deviceId, tier } = await request.json();

    if (!deviceId || !tier) {
      return NextResponse.json({ error: 'Missing deviceId or tier' }, { status: 400 });
    }

    console.log(`🗑️ 작물 정보 삭제 시작: deviceId=${deviceId}, tier=${tier}`);

    // 1. bed_crop_data 테이블에서 작물 정보 삭제
    const { error: cropDataError } = await supabase
      .from('bed_crop_data')
      .delete()
      .eq('device_id', deviceId)
      .eq('tier_number', parseInt(tier));

    if (cropDataError) {
      console.error('bed_crop_data 삭제 오류:', cropDataError);
      return NextResponse.json({ error: 'Failed to delete bed_crop_data' }, { status: 500 });
    }

    // 2. 디바이스 정보 조회 (베드 정보 확인용)
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, bed_id, meta')
      .eq('id', deviceId)
      .single();

    if (deviceError) {
      console.error('디바이스 조회 오류:', deviceError);
    } else if (device?.bed_id) {
      // 3. beds 테이블에서 crop 정보 삭제 (해당 베드가 단일 작물을 가진 경우)
      const { error: bedError } = await supabase
        .from('beds')
        .update({ crop: null })
        .eq('id', device.bed_id);

      if (bedError) {
        console.error('beds 테이블 crop 정보 삭제 오류:', bedError);
      }

      // 4. devices.meta에서 crop_name 정보 삭제
      if (device.meta && device.meta.crop_name) {
        const updatedMeta = { ...device.meta };
        delete updatedMeta.crop_name;
        
        const { error: metaError } = await supabase
          .from('devices')
          .update({ meta: updatedMeta })
          .eq('id', deviceId);

        if (metaError) {
          console.error('devices.meta crop_name 삭제 오류:', metaError);
        }
      }
    }

    // 5. bed_notes에서 해당 베드의 노트들 삭제 (선택적)
    const { error: notesError } = await supabase
      .from('bed_notes')
      .delete()
      .eq('bed_id', deviceId);

    if (notesError) {
      console.error('bed_notes 삭제 오류:', notesError);
      // 노트 삭제 실패는 전체 작업을 중단하지 않음
    }

    console.log(`✅ 작물 정보 삭제 완료: deviceId=${deviceId}, tier=${tier}`);

    return NextResponse.json({ 
      success: true, 
      message: '작물 정보 및 관련 데이터가 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
