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

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const tierNumber = searchParams.get('tierNumber');

    if (!deviceId || !tierNumber) {
      return NextResponse.json({ error: 'Missing deviceId or tierNumber' }, { status: 400 });
    }

    const { error } = await supabase
      .from('bed_crop_data')
      .delete()
      .eq('device_id', deviceId)
      .eq('tier_number', parseInt(tierNumber));

    if (error) {
      console.error('작물 정보 삭제 오류:', error);
      return NextResponse.json({ error: 'Failed to delete crop data' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
