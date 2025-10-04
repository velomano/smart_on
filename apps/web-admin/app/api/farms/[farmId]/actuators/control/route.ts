import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ farmId: string }> }) {
  try {
    const { farmId } = await params;

    // 요청 본문 검증
    const body = await request.json();
    
    if (!body || 
        typeof body.deviceId !== 'string' || 
        typeof body.actuatorType !== 'string' || 
        !['on', 'off', 'toggle'].includes(body.action)) {
      return NextResponse.json({ error: '잘못된 요청 데이터입니다.' }, { status: 400 });
    }

    console.log('액추에이터 제어 요청', {
      farmId,
      deviceId: body.deviceId,
      actuatorType: body.actuatorType,
      action: body.action
    });

    // 임시 응답 (Supabase 연결 문제 해결 전까지)
    const mockResponse = {
      id: `cmd_${Date.now()}`,
      device_id: body.deviceId,
      command_type: body.actuatorType,
      command_data: {
        action: body.action,
        value: body.value || null,
        timestamp: new Date().toISOString()
      },
      status: 'pending',
      created_at: new Date().toISOString()
    };

    console.log('액추에이터 제어 명령 처리 완료', {
      commandId: mockResponse.id,
      deviceId: body.deviceId,
      actuatorType: body.actuatorType,
      action: body.action
    });

    return NextResponse.json({ 
      data: [mockResponse], 
      message: '액추에이터 제어 명령이 전송되었습니다. (임시 처리)'
    });
  } catch (error) {
    console.error('액추에이터 제어 오류', error);
    return NextResponse.json({ error: '액추에이터 제어 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ farmId: string }> }) {
  try {
    const { farmId } = await params;
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    console.log('액추에이터 상태 조회 요청', { farmId, deviceId });

    // 임시 데이터 반환 (Supabase 연결 문제 해결 전까지)
    const mockData = [
      {
        deviceId: 'actuator-001',
        deviceName: 'LED 조명',
        deviceType: 'led',
        status: 'off',
        isOnline: true,
        meta: { brightness: 80 },
        lastSeen: new Date().toISOString()
      },
      {
        deviceId: 'actuator-002',
        deviceName: '물 펌프',
        deviceType: 'pump',
        status: 'off',
        isOnline: true,
        meta: { flowRate: 2.5 },
        lastSeen: new Date().toISOString()
      },
      {
        deviceId: 'actuator-003',
        deviceName: '팬',
        deviceType: 'fan',
        status: 'on',
        isOnline: true,
        meta: { speed: 3 },
        lastSeen: new Date().toISOString()
      },
      {
        deviceId: 'actuator-004',
        deviceName: '히터',
        deviceType: 'heater',
        status: 'off',
        isOnline: false,
        meta: { temperature: 0 },
        lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      }
    ];

    // deviceId 필터링
    const filteredData = deviceId 
      ? mockData.filter(actuator => actuator.deviceId === deviceId)
      : mockData;

    console.log('액추에이터 상태 조회 완료', {
      farmId,
      deviceId,
      actuatorCount: filteredData.length
    });

    return NextResponse.json({ 
      data: filteredData,
      message: '액추에이터 상태 조회 성공 (임시 데이터)'
    });
  } catch (error) {
    console.error('액추에이터 상태 조회 오류', error);
    return NextResponse.json({ 
      error: '액추에이터 상태 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
