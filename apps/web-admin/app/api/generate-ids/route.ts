import { supaAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const supa = supaAdmin();
    
    // 실제 데이터베이스에서 농장과 베드 정보 조회
    const { data: farms, error: farmsError } = await supa
      .from('farms')
      .select('id, name')
      .order('created_at', { ascending: true });

    if (farmsError) {
      console.error('Farms fetch error:', farmsError);
      return Response.json(
        { success: false, error: '농장 정보를 조회할 수 없습니다.' }, 
        { status: 500 }
      );
    }

    const { data: beds, error: bedsError } = await supa
      .from('beds')
      .select('id, name, farm_id')
      .order('created_at', { ascending: true });

    if (bedsError) {
      console.error('Beds fetch error:', bedsError);
      return Response.json(
        { success: false, error: '베드 정보를 조회할 수 없습니다.' }, 
        { status: 500 }
      );
    }

    // 베드를 농장별로 그룹화
    const bedsByFarm = beds?.reduce((acc, bed) => {
      if (!acc[bed.farm_id]) {
        acc[bed.farm_id] = [];
      }
      acc[bed.farm_id].push(bed);
      return acc;
    }, {} as Record<string, any[]>) || {};

    // 농장별로 베드 정보 추가
    const farmsWithBeds = farms?.map(farm => ({
      ...farm,
      beds: bedsByFarm[farm.id] || []
    })) || [];

    return Response.json({ 
      success: true, 
      data: {
        farms: farmsWithBeds,
        total_farms: farmsWithBeds.length,
        total_beds: beds?.length || 0
      }
    });

  } catch (error) {
    console.error('ID generation API error:', error);
    
    if (error instanceof Error && error.message.includes('환경변수가 설정되지 않았습니다')) {
      return Response.json(
        { success: false, error: '데이터베이스 연결 설정이 필요합니다.' }, 
        { status: 503 }
      );
    }
    
    return Response.json(
      { success: false, error: '서버 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { type, farm_id, count = 1 } = await request.json();
    const supa = supaAdmin();

    if (type === 'bed_ids') {
      // 베드 ID들을 대량 생성
      const bedIds = [];
      for (let i = 0; i < count; i++) {
        const bedId = crypto.randomUUID();
        bedIds.push({
          id: bedId,
          name: `베드-${i + 1}`,
          display_id: bedId.slice(-8).toUpperCase()
        });
      }
      
      return Response.json({ 
        success: true, 
        data: {
          type: 'bed_ids',
          farm_id: farm_id,
          beds: bedIds,
          total_count: count
        }
      });
    }

    if (type === 'device_id') {
      // 디바이스 ID 생성 (UUID v4)
      const deviceId = crypto.randomUUID();
      
      return Response.json({ 
        success: true, 
        data: {
          type: 'device_id',
          id: deviceId,
          suggestion: `device-${deviceId.slice(-8)}`
        }
      });
    }

    if (type === 'custom_device_id') {
      // 커스텀 디바이스 ID 생성 (사용자 친화적)
      const prefixes = ['pi', 'esp32', 'arduino', 'sensor', 'gateway', 'controller'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const number = Math.floor(Math.random() * 999) + 1;
      
      return Response.json({ 
        success: true, 
        data: {
          type: 'custom_device_id',
          id: `${prefix}-${number.toString().padStart(3, '0')}`,
          suggestion: `${prefix}-${number.toString().padStart(3, '0')}`
        }
      });
    }

    return Response.json(
      { success: false, error: '지원되지 않는 ID 타입입니다.' }, 
      { status: 400 }
    );

  } catch (error) {
    console.error('ID generation API error:', error);
    
    return Response.json(
      { success: false, error: 'ID 생성 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
}
