import { NextRequest, NextResponse } from 'next/server';
import { checkSensorDataAndNotify, SensorData } from '@/lib/notificationService';

export async function POST(req: NextRequest) {
  console.log('🧪 센서 테스트 API 호출됨');
  
  try {
    const { sensorType, value, location, thresholds } = await req.json();
    
    console.log('받은 데이터:', { sensorType, value, location, thresholds });
    
    // 테스트용 센서 데이터 생성
    const testSensorData: SensorData = {
      id: 'test-sensor-' + Date.now(),
      type: sensorType || 'temperature',
      value: value || 5, // 저온 테스트용 기본값
      location: location || '조1-베드1',
      timestamp: new Date(),
      thresholds: thresholds || {
        min: 15, // 최저 온도 임계값
        max: 30  // 최고 온도 임계값
      }
    };

    console.log('🧪 테스트 센서 데이터:', testSensorData);

    // MQTT 연동 전까지 모든 알림 차단
    console.log('🔒 센서 테스트 알림 차단됨 (MQTT 연동 전까지 알림 비활성화)');
    
    return NextResponse.json({
      ok: true,
      message: '센서 테스트 알림이 차단되었습니다. (MQTT 연동 전까지 알림 비활성화)',
      sensorData: testSensorData
    });

  } catch (error: any) {
    console.error('센서 테스트 알림 에러:', error);
    return NextResponse.json({
      ok: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  // 다양한 테스트 시나리오 제공
  const testScenarios = [
    {
      name: '저온 경고',
      description: '온도가 15°C 미만일 때',
      data: {
        sensorType: 'temperature',
        value: 12,
        location: '조1-베드1',
        thresholds: { min: 15, max: 30 }
      }
    },
    {
      name: '고온 경고',
      description: '온도가 30°C 초과일 때',
      data: {
        sensorType: 'temperature',
        value: 35,
        location: '조1-베드1',
        thresholds: { min: 15, max: 30 }
      }
    },
    {
      name: 'EC 부족',
      description: 'EC 값이 너무 낮을 때',
      data: {
        sensorType: 'ec',
        value: 0.5,
        location: '조1-베드1',
        thresholds: { min: 1.0, max: 3.0 }
      }
    },
    {
      name: 'pH 이상',
      description: 'pH 값이 범위를 벗어날 때',
      data: {
        sensorType: 'ph',
        value: 4.5,
        location: '조1-베드1',
        thresholds: { min: 5.5, max: 6.5 }
      }
    }
  ];

  return NextResponse.json({
    ok: true,
    testScenarios
  });
}
