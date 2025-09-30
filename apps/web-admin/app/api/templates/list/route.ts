import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const templates = [
      {
        id: 'arduino',
        name: 'Arduino/ESP32',
        description: '마이크로컨트롤러 기반 MQTT 템플릿',
        icon: '🔌',
        filename: 'arduino_mqtt_template.cpp',
        category: 'device'
      },
      {
        id: 'python',
        name: 'Python',
        description: '고급 기능 및 데이터 처리용 템플릿',
        icon: '🐍',
        filename: 'python_mqtt_template.py',
        category: 'device'
      },
      {
        id: 'nodejs',
        name: 'Node.js',
        description: '웹 기반 IoT 게이트웨이 템플릿',
        icon: '🟢',
        filename: 'nodejs_mqtt_template.js',
        category: 'device'
      },
      {
        id: 'config',
        name: '설정 템플릿',
        description: '디바이스 설정 파일 템플릿',
        icon: '⚙️',
        filename: 'config_template.json',
        category: 'config'
      },
      {
        id: 'mosquitto',
        name: 'Mosquitto 설정',
        description: '오픈소스 MQTT 브로커 설정 가이드',
        icon: '🐛',
        filename: 'mosquitto_setup.md',
        category: 'broker'
      },
      {
        id: 'emqx',
        name: 'EMQX 설정',
        description: '엔터프라이즈급 MQTT 브로커 설정 가이드',
        icon: '⚡',
        filename: 'emqx_setup.md',
        category: 'broker'
      },
      {
        id: 'aws-iot',
        name: 'AWS IoT Core',
        description: '클라우드 MQTT 서비스 설정 가이드',
        icon: '☁️',
        filename: 'aws_iot_core_setup.md',
        category: 'broker'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        templates,
        categories: [
          {
            id: 'device',
            name: '디바이스 템플릿',
            description: '다양한 플랫폼용 디바이스 연동 코드'
          },
          {
            id: 'config',
            name: '설정 템플릿',
            description: '디바이스 설정 파일 템플릿'
          },
          {
            id: 'broker',
            name: '브로커 설정',
            description: 'MQTT 브로커 설정 가이드'
          }
        ]
      }
    });

  } catch (error) {
    console.error('템플릿 목록 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '템플릿 목록을 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
