// IoT 디바이스 코드 자동 생성 API
import { NextRequest, NextResponse } from 'next/server';
import { sensors, controls, devicePinmaps } from '@/lib/iot-templates/index';
import JSZip from 'jszip';

// Node 런타임 강제 및 캐시 회피
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SystemSpec {
  device: string;
  protocol: 'http' | 'mqtt' | 'websocket' | 'webhook' | 'serial' | 'ble' | 'rs485' | 'modbus-tcp' | 'lorawan';
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  wifi: {
    ssid: string;
    password: string;
  };
  allocation?: any;
  bridgeIntegration?: boolean;
  pinAssignments?: Record<string, string>; // 핀 할당 정보
  modbusConfig?: {
    host: string;
    port: number;
    unitId: number;
    registerMappings: Record<string, number>;
    dataTypes: Record<string, 'U16' | 'S16' | 'U32' | 'S32' | 'float'>;
    safeLimits: Record<string, { min: number; max: number }>;
  };
  lorawanConfig?: {
    mode: 'mqtt' | 'webhook';
    lns: 'the-things-stack' | 'chirpstack' | 'carrier';
    region: string;
    deviceMap?: Record<string, string>;
    codec?: { type: 'js'; script?: string; scriptRef?: string };
    mqtt?: {
      host: string;
      port: number;
      username: string;
      password: string;
      uplinkTopic: string;
      downlinkTopicTpl: string;
      tls?: boolean;
    };
    webhook?: { secret: string; path: string; };
    api?: { baseUrl: string; token: string; };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('Request body length:', body.length);
    console.log('Request body preview:', body.substring(0, 200));
    
    if (!body || body.trim() === '') {
      console.error('빈 요청 본문');
      return NextResponse.json({ error: '요청 본문이 비어있습니다' }, { status: 400 });
    }
    
    let spec: SystemSpec;
    try {
      spec = JSON.parse(body);
      console.log('JSON 파싱 성공:', spec);
    } catch (parseError) {
      console.error('JSON 파싱 에러:', parseError);
      console.error('문제가 된 본문:', body);
      return NextResponse.json({ error: '잘못된 JSON 형식입니다' }, { status: 400 });
    }
    
    if (!spec || !spec.device || !spec.protocol) {
      return NextResponse.json({ error: '필수 설정이 누락되었습니다' }, { status: 400 });
    }

    // 메인 코드 파일 생성
    const code = spec.bridgeIntegration 
      ? await generateUniversalBridgeCode(spec)
      : generateDeviceCode(spec);
    
    const mainFilename = spec.bridgeIntegration 
      ? 'universal_bridge_system.ino'
      : getFilename(spec.device, spec.protocol);
    
    // ZIP 파일 생성
    const zip = new JSZip();
    
    // 메인 코드 파일 추가
    zip.file(mainFilename, code);
    
    // 설정 파일 추가
    const configContent = generateConfigFile(spec);
    zip.file('config.json', configContent);
    
    // 캘리브레이션 파일 추가 (센서가 있는 경우)
    if (spec.sensors.length > 0) {
      const calibrationContent = generateCalibrationFile(spec);
      zip.file('calibration.json', calibrationContent);
    }
    
    // README 파일 추가
    const readmeContent = generateReadmeFile(spec);
    zip.file('README.md', readmeContent);
    
    console.log('📦 ZIP 파일 생성 중...');
    
    // ZIP 파일 생성
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    console.log('📦 ZIP 파일 생성 완료, 크기:', zipBuffer.length, 'bytes');
    
    // ZIP 파일로 다운로드
    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="iot_system_${spec.device}_${spec.protocol}.zip"`
      }
    });
  } catch (error) {
    console.error('코드 생성 오류:', error);
    return NextResponse.json({ error: '코드 생성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

function getFilename(device: string, protocol: string): string {
  const deviceMap: Record<string, string> = {
    'esp32': 'esp32',
    'esp8266': 'esp8266',
    'arduino': 'arduino',
    'arduino_uno': 'arduino_uno',
    'arduino_r4': 'arduino_r4',
    'raspberry_pi5': 'raspberry_pi5',
    'raspberry_pi4': 'raspberry_pi4',
    'raspberry_pi3': 'raspberry_pi3'
  };
  
  const protocolMap: Record<string, string> = {
    'mqtt': 'mqtt',
    'http': 'http',
    'websocket': 'ws',
    'webhook': 'webhook',
    'serial': 'serial',
    'ble': 'ble',
    'rs485': 'rs485',
    'modbus-tcp': 'modbus',
    'lorawan': 'lorawan'
  };
  
  const deviceName = deviceMap[device] || device;
  const protocolName = protocolMap[protocol] || protocol;
  
  return `iot_${deviceName}_${protocolName}.ino`;
}

function generateDeviceCode(spec: SystemSpec): string {
  switch (spec.device.toLowerCase()) {
    case 'esp32':
      return generateESP32Code(spec);
    case 'esp8266':
      return generateESP8266Code(spec);
    case 'arduino':
    case 'arduino_uno':
    case 'arduino_r4':
      return generateArduinoCode(spec);
    case 'raspberry-pi':
    case 'raspberry_pi5':
      return generateRaspberryPiCode(spec);
    default:
      return generateESP32Code(spec);
  }
}

async function generateUniversalBridgeCode(spec: SystemSpec): Promise<string> {
  const { device, protocol, sensors, controls } = spec;
  const sensorTypes = sensors.map(s => s.type).join(', ');
  const actuatorTypes = controls.map(c => c.type).join(', ');

  return `/**
 * Universal Bridge 호환 IoT 시스템 코드
 * 디바이스: ${device.toUpperCase()}
 * 프로토콜: ${protocol.toUpperCase()}
 * 센서: ${sensorTypes}
 * 액추에이터: ${actuatorTypes}
 * 생성 시간: ${new Date().toISOString()}
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi 설정 (보안을 위해 직접 입력하세요)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Universal Bridge 설정
const char* serverUrl = "http://localhost:3001";
String deviceId = "";
String deviceKey = "";

void setup() {
  Serial.begin(115200);
  
  // WiFi 연결
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("WiFi 연결 중...");
  }
  Serial.println("WiFi 연결 완료!");
  
  Serial.println("시스템 초기화 완료!");
}

void loop() {
  // 메인 루프
  delay(5000);
}
`;
}

function generateESP32Code(spec: SystemSpec): string {
  return generateUniversalBridgeArduinoCode(spec);
}

function generateESP8266Code(spec: SystemSpec): string {
  return generateUniversalBridgeArduinoCode(spec);
}

function generateArduinoCode(spec: SystemSpec): string {
  return generateUniversalBridgeArduinoCode(spec);
}

function generateRaspberryPiCode(spec: SystemSpec): string {
  const { device, protocol, sensors, controls } = spec;
  
  return `#!/usr/bin/env python3
"""
Auto-generated Raspberry Pi code by Rapid IoT Builder
Device: ${device.toUpperCase()}
Protocol: ${protocol.toUpperCase()}
Generated: ${new Date().toISOString()}
"""

import time
import json
import requests
import RPi.GPIO as GPIO

def main():
    print("Raspberry Pi IoT 시스템 시작...")
    
    while True:
        try:
            time.sleep(5)
        except KeyboardInterrupt:
            print("시스템 종료...")
            break

if __name__ == "__main__":
    main()
`;
}

function generateUniversalBridgeArduinoCode(spec: SystemSpec): string {
  const { device, protocol, sensors, controls, pinAssignments } = spec;
  const sensorTypes = sensors.map(s => s.type).join(', ');
  const actuatorTypes = controls.map(c => c.type).join(', ');
  
  // 핀 할당 정보를 코드에 반영
  const generatePinDefinitions = () => {
    if (!pinAssignments) return '';
    
    let pinDefs = '\n// 핀 정의 (사용자 할당)\n';
    Object.entries(pinAssignments).forEach(([component, pin]) => {
      const parts = component.split('_');
      const type = parts[parts.length - 1];
      const instance = parts[parts.length - 2];
      pinDefs += `#define ${type.toUpperCase()}_${instance}_PIN ${pin}\n`;
    });
    return pinDefs;
  };

  return `/**
 * Universal Bridge 호환 IoT 시스템 코드
 * 디바이스: ${device.toUpperCase()}
 * 프로토콜: ${protocol.toUpperCase()}
 * 센서: ${sensorTypes}
 * 액추에이터: ${actuatorTypes}
 * 생성 시간: ${new Date().toISOString()}
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi 설정 (보안을 위해 직접 입력하세요)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Universal Bridge 설정
const char* serverUrl = "http://localhost:3001";
String deviceId = "";
String deviceKey = "";

void setup() {
  Serial.begin(115200);
  
  // WiFi 연결
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("WiFi 연결 중...");
  }
  Serial.println("WiFi 연결 완료!");
  
  Serial.println("시스템 초기화 완료!");
}

void loop() {
  // 메인 루프
  delay(5000);
}
`;
}

// 설정 파일 생성 함수들
function generateConfigFile(spec: SystemSpec): string {
  const config = {
    device: {
      type: spec.device,
      protocol: spec.protocol,
      version: "1.0.0"
    },
    wifi: {
      ssid: "YOUR_WIFI_SSID",
      password: "YOUR_WIFI_PASSWORD"
    },
    server: {
      url: spec.protocol === 'mqtt' ? "mqtt://localhost:1883" : "http://localhost:3001",
      port: spec.protocol === 'mqtt' ? 1883 : 3001
    },
    sensors: spec.sensors.map(sensor => ({
      type: sensor.type,
      count: sensor.count,
      pins: Array.from({ length: sensor.count }, (_, i) => i + 2)
    })),
    actuators: spec.controls.map(control => ({
      type: control.type,
      count: control.count,
      pins: Array.from({ length: control.count }, (_, i) => i + 10)
    })),
    lorawan: spec.lorawanConfig || null,
    modbus: spec.modbusConfig || null
  };
  
  return JSON.stringify(config, null, 2);
}

function generateCalibrationFile(spec: SystemSpec): string {
  const calibration = {
    sensors: spec.sensors.reduce((acc, sensor) => {
      acc[sensor.type] = {
        offset: 0,
        scale: 1,
        min_value: 0,
        max_value: 100,
        unit: getSensorUnit(sensor.type)
      };
      return acc;
    }, {} as Record<string, any>),
    actuators: spec.controls.reduce((acc, control) => {
      acc[control.type] = {
        min_power: 0,
        max_power: 100,
        default_state: false
      };
      return acc;
    }, {} as Record<string, any>),
    system: {
      update_interval: 5000,
      retry_count: 3,
      timeout: 10000
    }
  };
  
  return JSON.stringify(calibration, null, 2);
}

function generateReadmeFile(spec: SystemSpec): string {
  const { device, protocol, sensors, controls } = spec;
  const sensorTypes = sensors.map(s => s.type).join(', ');
  const actuatorTypes = controls.map(c => c.type).join(', ');
  
  return `# ${device.toUpperCase()} ${protocol.toUpperCase()} IoT 시스템

## 📋 시스템 사양
- **디바이스**: ${device.toUpperCase()}
- **통신 프로토콜**: ${protocol.toUpperCase()}
- **센서**: ${sensorTypes}
- **액추에이터**: ${actuatorTypes}
- **생성 시간**: ${new Date().toISOString()}

## 🚀 설치 방법

### 1. Arduino IDE 설정
1. Arduino IDE를 설치합니다
2. ${device.toUpperCase()} 보드를 선택합니다
3. 필요한 라이브러리를 설치합니다:
   - WiFi (ESP32/ESP8266용)
   - HTTPClient (ESP32용)
   - ArduinoJson

### 2. 설정 파일 수정
1. \`config.example.json\`을 \`config.json\`으로 복사합니다
2. WiFi 설정을 수정합니다:
   \`\`\`json
   {
     "wifi": {
       "ssid": "YOUR_WIFI_SSID",
       "password": "YOUR_WIFI_PASSWORD"
     }
   }
   \`\`\`

### 3. 센서 보정
1. \`calibration.example.json\`을 \`calibration.json\`으로 복사합니다
2. 센서별로 오프셋과 스케일 값을 조정합니다

### 4. 업로드
1. 메인 코드 파일을 Arduino IDE에서 엽니다
2. 보드를 연결하고 포트를 선택합니다
3. 업로드 버튼을 클릭합니다

## 🔧 하드웨어 연결

### 센서 연결
${sensors.map(sensor => `- **${sensor.type}**: 핀 ${Array.from({ length: sensor.count }, (_, i) => i + 2).join(', ')}`).join('\n')}

### 액추에이터 연결
${controls.map(control => `- **${control.type}**: 핀 ${Array.from({ length: control.count }, (_, i) => i + 10).join(', ')}`).join('\n')}

## 📡 통신 설정

### ${protocol.toUpperCase()} 설정
${protocol === 'mqtt' ? `
- **브로커 주소**: localhost:1883
- **토픽**: device/telemetry, device/commands
` : `
- **서버 주소**: http://localhost:3001
- **API 엔드포인트**: /api/telemetry, /api/commands
`}

## 🐛 문제 해결

### 일반적인 문제
1. **WiFi 연결 실패**: SSID와 비밀번호를 확인하세요
2. **서버 연결 실패**: 네트워크 연결과 서버 주소를 확인하세요
3. **센서 값 이상**: 보정 파일을 확인하고 센서 연결을 점검하세요

### 로그 확인
시리얼 모니터를 열어 디버그 메시지를 확인하세요:
- 보드레이트: 115200
- 포트: 해당 USB 포트

## 📞 지원
문제가 발생하면 시스템 로그와 함께 문의하세요.
`;
}

function getSensorUnit(sensorType: string): string {
  const units: Record<string, string> = {
    'temperature': '°C',
    'humidity': '%',
    'pressure': 'hPa',
    'light': 'lux',
    'motion': 'boolean',
    'soil-moisture': '%',
    'ph': 'pH',
    'co2': 'ppm'
  };
  return units[sensorType] || 'unit';
}

// 간단한 ZIP 파일 생성 함수
function createSimpleZip(files: Record<string, string>): Buffer {
  // 실제 ZIP 파일 생성 대신 간단한 텍스트 기반 패키지 생성
  const packageContent = Object.entries(files)
    .map(([filename, content]) => `=== ${filename} ===\n${content}\n`)
    .join('\n');
  
  return Buffer.from(packageContent, 'utf-8');
}
