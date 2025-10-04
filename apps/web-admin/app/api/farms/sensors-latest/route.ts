import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const deviceId = searchParams.get('deviceId');

    console.log('센서 데이터 조회 요청 (정적 라우트)', { farmId, deviceId });

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
      },
      {
        deviceId: 'sensor-003',
        deviceName: 'EC센서',
        deviceType: 'sensor',
        sensorKey: 'ec',
        value: 1.8,
        unit: 'mS/cm',
        timestamp: new Date().toISOString(),
        quality: 'good'
      },
      {
        deviceId: 'sensor-004',
        deviceName: 'pH센서',
        deviceType: 'sensor',
        sensorKey: 'ph',
        value: 6.2,
        unit: 'pH',
        timestamp: new Date().toISOString(),
        quality: 'good'
      }
    ];

    // deviceId 필터링
    const filteredData = deviceId 
      ? mockData.filter(sensor => sensor.deviceId === deviceId)
      : mockData;

    console.log('센서 데이터 조회 완료', {
      farmId,
      deviceId,
      sensorCount: filteredData.length
    });

    return NextResponse.json({ 
      data: filteredData,
      message: '센서 데이터 조회 성공 (임시 데이터)'
    });
  } catch (error) {
    console.error('센서 데이터 조회 오류', error);
    return NextResponse.json({ 
      error: '센서 데이터 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
