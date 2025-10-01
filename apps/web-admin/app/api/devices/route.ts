import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경 변수가 없을 때를 위한 조건부 클라이언트 생성
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

export async function GET(request: NextRequest) {
  try {
    // Supabase 클라이언트가 없으면 환경 변수 오류 반환
    if (!supabase) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 설정이 필요합니다. 환경 변수를 확인해주세요.' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farm_id');
    const status = searchParams.get('status');
    const deviceType = searchParams.get('device_type');

    let query = supabase
      .from('devices')
      .select(`
        *,
        farm:farm_id(name),
        sensors(*),
        latest_data:sensor_data(
          temperature,
          humidity,
          ec_value,
          ph_value,
          timestamp
        )
      `)
      .order('created_at', { ascending: false });

    // 농장별 필터링
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    // 상태별 필터링
    if (status) {
      query = query.eq('status', status);
    }

    // 디바이스 타입별 필터링
    if (deviceType) {
      query = query.eq('device_type', deviceType);
    }

    const { data: devices, error } = await query;

    if (error) {
      console.error('디바이스 조회 오류:', error);
      return NextResponse.json({ 
        ok: false, 
        error: '디바이스 조회에 실패했습니다.' 
      }, { status: 500 });
    }

    // 디바이스별 최신 센서 데이터 조회
    const devicesWithLatestData = await Promise.all(
      (devices || []).map(async (device) => {
        const { data: latestData } = await supabase
          .from('sensor_data')
          .select('temperature, humidity, ec_value, ph_value, timestamp')
          .eq('device_id', device.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        return {
          ...device,
          latest_data: latestData
        };
      })
    );

    return NextResponse.json({
      ok: true,
      data: devicesWithLatestData
    });

  } catch (error) {
    console.error('디바이스 API 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Supabase 클라이언트가 없으면 환경 변수 오류 반환
    if (!supabase) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 설정이 필요합니다. 환경 변수를 확인해주세요.' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { 
      name, 
      device_type, 
      farm_id, 
      location, 
      description,
      mqtt_topic,
      status = 'active'
    } = body;

    // 입력 검증
    if (!name || !device_type || !farm_id) {
      return NextResponse.json({ 
        ok: false, 
        error: '디바이스명, 타입, 농장은 필수입니다.' 
      }, { status: 400 });
    }

    // 디바이스 생성
    const { data: newDevice, error } = await supabase
      .from('devices')
      .insert({
        name,
        device_type,
        farm_id,
        location: location || null,
        description: description || null,
        mqtt_topic: mqtt_topic || `device/${name.toLowerCase().replace(/\s+/g, '_')}`,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('디바이스 생성 오류:', error);
      return NextResponse.json({ 
        ok: false, 
        error: '디바이스 생성에 실패했습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: newDevice,
      message: '디바이스가 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('디바이스 생성 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Supabase 클라이언트가 없으면 환경 변수 오류 반환
    if (!supabase) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 설정이 필요합니다. 환경 변수를 확인해주세요.' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ 
        ok: false, 
        error: '디바이스 ID가 필요합니다.' 
      }, { status: 400 });
    }

    // 디바이스 업데이트
    const { data: updatedDevice, error } = await supabase
      .from('devices')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('디바이스 업데이트 오류:', error);
      return NextResponse.json({ 
        ok: false, 
        error: '디바이스 업데이트에 실패했습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: updatedDevice,
      message: '디바이스가 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('디바이스 업데이트 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Supabase 클라이언트가 없으면 환경 변수 오류 반환
    if (!supabase) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 설정이 필요합니다. 환경 변수를 확인해주세요.' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        ok: false, 
        error: '디바이스 ID가 필요합니다.' 
      }, { status: 400 });
    }

    // 디바이스 삭제 (소프트 삭제)
    const { error } = await supabase
      .from('devices')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('디바이스 삭제 오류:', error);
      return NextResponse.json({ 
        ok: false, 
        error: '디바이스 삭제에 실패했습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: '디바이스가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('디바이스 삭제 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
