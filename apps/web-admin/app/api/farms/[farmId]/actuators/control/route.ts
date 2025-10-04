import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ farmId: string }> }) {
  try {
    const { farmId } = await params;

    // 요청 본문 검증
    const body = await request.json();
    
    if (!body || 
        typeof body.deviceId !== 'string' || 
        typeof body.actuatorType !== 'string' || 
        !['on', 'off', 'toggle', 'mode', 'set', 'schedule', 'dual_time'].includes(body.action)) {
      return NextResponse.json({ error: '잘못된 요청 데이터입니다.' }, { status: 400 });
    }

    console.log('액추에이터 제어 요청', {
      farmId,
      deviceId: body.deviceId,
      actuatorType: body.actuatorType,
      action: body.action,
      value: body.value,
      mode: body.mode,
      schedule: body.schedule,
      dualTime: body.dualTime
    });

    // 실제 유니버셜 브릿지로 액추에이터 제어 명령 전송
    const bridgeUrl = process.env.BRIDGE_INTERNAL_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${bridgeUrl}/api/farms/${farmId}/actuators/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BRIDGE_API_TOKEN || 'dev-bridge-token-123'}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const bridgeData = await response.json();
        console.log('유니버셜 브릿지로 액추에이터 제어 명령 전송 성공', {
          deviceId: body.deviceId,
          actuatorType: body.actuatorType,
          action: body.action
        });

        return NextResponse.json({ 
          data: bridgeData.data || [],
          message: '액추에이터 제어 명령이 전송되었습니다.'
        });
      } else {
        console.error('유니버셜 브릿지 제어 명령 실패:', response.status);
        return NextResponse.json({ 
          error: '액추에이터 제어에 실패했습니다. 유니버셜 브릿지를 확인해주세요.'
        }, { status: 500 });
      }
    } catch (error) {
      console.error('유니버셜 브릿지 연결 오류:', error);
      return NextResponse.json({ 
        error: '유니버셜 브릿지 연결 실패. 디바이스 연결을 확인해주세요.'
      }, { status: 500 });
    }
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

    // 실제 유니버셜 브릿지에서 액추에이터 데이터 조회
    const bridgeUrl = process.env.BRIDGE_INTERNAL_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${bridgeUrl}/api/farms/${farmId}/actuators/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BRIDGE_API_TOKEN || 'dev-bridge-token-123'}`
        }
      });

      if (response.ok) {
        const bridgeData = await response.json();
        console.log('유니버셜 브릿지에서 액추에이터 데이터 조회 성공', {
          farmId,
          deviceId,
          actuatorCount: bridgeData.data?.length || 0
        });

        return NextResponse.json({ 
          data: bridgeData.data || [],
          message: '액추에이터 상태 조회 성공'
        });
      } else {
        console.warn('유니버셜 브릿지 연결 실패, 빈 데이터 반환');
        return NextResponse.json({ 
          data: [],
          message: '연결된 액추에이터가 없습니다. 유니버셜 브릿지를 확인해주세요.'
        });
      }
    } catch (error) {
      console.error('유니버셜 브릿지 연결 오류:', error);
      return NextResponse.json({ 
        data: [],
        message: '유니버셜 브릿지 연결 실패. 디바이스 연결을 확인해주세요.'
      });
    }
  } catch (error) {
    console.error('액추에이터 상태 조회 오류', error);
    return NextResponse.json({ 
      error: '액추에이터 상태 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
