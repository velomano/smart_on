import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ farmId: string }> }) {
  try {
    const { farmId } = await params;
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    console.log('센서 데이터 조회 요청', { farmId, deviceId });

    // 실제 유니버셜 브릿지에서 센서 데이터 조회
    const bridgeUrl = process.env.BRIDGE_INTERNAL_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${bridgeUrl}/api/farms/${farmId}/sensors/latest`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BRIDGE_API_TOKEN || 'dev-bridge-token-123'}`
        }
      });

      if (response.ok) {
        const bridgeData = await response.json();
        console.log('유니버셜 브릿지에서 센서 데이터 조회 성공', {
          farmId,
          deviceId,
          sensorCount: bridgeData.data?.length || 0
        });

        return NextResponse.json({ 
          data: bridgeData.data || [],
          message: '센서 데이터 조회 성공'
        });
      } else {
        console.warn('유니버셜 브릿지 연결 실패, 빈 데이터 반환');
        return NextResponse.json({ 
          data: [],
          message: '연결된 센서가 없습니다. 유니버셜 브릿지를 확인해주세요.'
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
    console.error('센서 데이터 조회 오류', error);
    return NextResponse.json({ 
      error: '센서 데이터 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 센서 품질 평가 함수
function getSensorQuality(sensorKey: string, value: number): 'good' | 'warning' | 'error' {
  switch (sensorKey) {
    case 'temperature':
      return value >= 18 && value <= 35 ? 'good' : value >= 10 && value <= 45 ? 'warning' : 'error';
    case 'humidity':
      return value >= 40 && value <= 80 ? 'good' : value >= 20 && value <= 95 ? 'warning' : 'error';
    case 'ec':
      return value >= 1.0 && value <= 3.0 ? 'good' : value >= 0.5 && value <= 4.0 ? 'warning' : 'error';
    case 'ph':
      return value >= 5.5 && value <= 7.5 ? 'good' : value >= 4.0 && value <= 9.0 ? 'warning' : 'error';
    case 'water_level':
      return value >= 20 ? 'good' : value >= 10 ? 'warning' : 'error';
    default:
      return 'good';
  }
}