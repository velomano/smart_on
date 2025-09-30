import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get('type');

    if (!templateType) {
      return NextResponse.json({
        success: false,
        error: '템플릿 타입이 지정되지 않았습니다.'
      }, { status: 400 });
    }

    // 템플릿 파일 매핑
    const templateFiles: { [key: string]: { filename: string; contentType: string; description: string } } = {
      'arduino': {
        filename: 'arduino_mqtt_template.cpp',
        contentType: 'text/x-c++src',
        description: 'Arduino/ESP32 MQTT 템플릿'
      },
      'python': {
        filename: 'python_mqtt_template.py',
        contentType: 'text/x-python',
        description: 'Python MQTT 템플릿'
      },
      'nodejs': {
        filename: 'nodejs_mqtt_template.js',
        contentType: 'application/javascript',
        description: 'Node.js MQTT 템플릿'
      },
      'config': {
        filename: 'config_template.json',
        contentType: 'application/json',
        description: '디바이스 설정 템플릿'
      },
      'mosquitto': {
        filename: 'mosquitto_setup.md',
        contentType: 'text/markdown',
        description: 'Mosquitto 브로커 설정 가이드'
      },
      'emqx': {
        filename: 'emqx_setup.md',
        contentType: 'text/markdown',
        description: 'EMQX 브로커 설정 가이드'
      },
      'aws-iot': {
        filename: 'aws_iot_core_setup.md',
        contentType: 'text/markdown',
        description: 'AWS IoT Core 설정 가이드'
      },
      'raspberry-pi': {
        filename: 'raspberry_pi_mqtt_template.py',
        contentType: 'text/x-python',
        description: '라즈베리파이5 MQTT 템플릿'
      },
      'raspberry-pi-setup': {
        filename: 'raspberry_pi_setup.md',
        contentType: 'text/markdown',
        description: '라즈베리파이5 설정 가이드'
      },
      'broker-bridge': {
        filename: 'mqtt_broker_bridge_connection.md',
        contentType: 'text/markdown',
        description: 'MQTT 브로커-브리지 연결 가이드'
      }
    };

    const template = templateFiles[templateType];
    if (!template) {
      return NextResponse.json({
        success: false,
        error: '지원하지 않는 템플릿 타입입니다.'
      }, { status: 400 });
    }

    // 파일 경로 생성
    const filePath = path.join(process.cwd(), 'apps/web-admin/public/templates', template.filename);
    
    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        success: false,
        error: '템플릿 파일을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 파일 읽기
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // 다운로드 응답 생성
    const response = new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': template.contentType,
        'Content-Disposition': `attachment; filename="${template.filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

    return response;

  } catch (error) {
    console.error('템플릿 다운로드 오류:', error);
    return NextResponse.json({
      success: false,
      error: '템플릿 다운로드 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
