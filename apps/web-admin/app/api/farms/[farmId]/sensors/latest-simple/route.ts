import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { farmId: string } }) {
  try {
    const { farmId } = params;
    
    console.log('센서 데이터 조회 요청 (단순화)', { farmId });

    // 임시 데이터 반환
    const mockData = [
      {
        deviceId: 'sensor-001',
        deviceName: '온도센서',
        deviceType: 'sensor',
        sensorKey: 'temperature',
        value: 25.5,
        unit: '°C',
        timestamp: new Date().toISOString(),
        quality: 'good'
      },
      {
        deviceId: 'sensor-002',
        deviceName: '습도센서',
        deviceType: 'sensor',
        sensorKey: 'humidity',
        value: 65.2,
        unit: '%',
        timestamp: new Date().toISOString(),
        quality: 'good'
      }
    ];

    return NextResponse.json({ 
      data: mockData,
      message: '센서 데이터 조회 성공 (임시 데이터)'
    });
  } catch (error) {
    console.error('센서 데이터 조회 오류', error);
    return NextResponse.json({ 
      error: '센서 데이터 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
