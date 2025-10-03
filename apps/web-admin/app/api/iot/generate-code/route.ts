// IoT 디바이스 코드 자동 생성 API
import { NextRequest, NextResponse } from 'next/server';
import { sensors, controls, devicePinmaps } from '@/lib/iot-templates/index';
import JSZip from 'jszip';

interface SystemSpec {
  device: string;
  protocol: 'mqtt' | 'serial' | 'ble' | 'rs485' | 'modbus-tcp' | 'lorawan';
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  wifi: {
    ssid: string;
    password: string;
  };
  bridgeIntegration?: boolean;
  pinAssignments?: Record<string, string>;
  farmId?: string;
}
// import { EnhancedCodeGenerator, EnhancedSystemSpec } from '../../../../packages/device-templates/enhanced-code-generator';
// import { SystemSpec } from './types';

// Node 런타임 강제 및 캐시 회피
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 토픽 세이프 변환 함수 (MQTT 토픽 규칙 준수)
function sanitize(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// 토픽 베이스 생성 함수
function topicBase(farmId: string, deviceId: string): string {
  const safeFarmId = sanitize(farmId);
  const safeDeviceId = sanitize(deviceId);
  return `terahub/${safeFarmId}/${safeDeviceId}`;
}

// ZIP 파일명 생성 함수 (재현성/검색성)
function generateZipFilename(farmId: string, deviceId: string, protocol: string): string {
  const safeFarmId = sanitize(farmId);
  const safeDeviceId = sanitize(deviceId);
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  return `${safeFarmId}__${safeDeviceId}__${timestamp}__${protocol}.zip`;
}

// 간단한 코드 생성 함수 (테스트용)
function generateSimpleCode(spec: SystemSpec): string {
  // 안전문구 생성
  const safetyWarnings = generateSafetyWarnings(spec);
  
  // 토픽 규칙 적용 (농장 ID 사용)
  const farmId = spec.farmId || 'demo';
  const deviceId = `${spec.device}-${Math.random().toString(36).substr(2, 8)}`;
  const topicBaseStr = topicBase(farmId, deviceId);

  // 센서별 라이브러리 및 핀 정의 생성
  const sensorIncludes = generateSensorIncludes(spec);
  const sensorInit = generateSensorInitialization(spec);
  const sensorReading = generateSensorReading(spec);
  const actuatorControl = generateActuatorControl(spec);

  return `/**
 * Universal Bridge 호환 IoT 시스템 코드
 * 디바이스: ${spec.device.toUpperCase()}
 * 생성 시간: ${new Date().toISOString()}
 * 
 * ${safetyWarnings}
 */

${sensorIncludes}
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi 설정 (보안을 위해 직접 입력하세요)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Universal Bridge MQTT 설정 (브로커 내장)
const char* mqtt_host = "bridge.local";  // 브릿지 호스트/IP (절대 localhost 금지!)
const int mqtt_port = 1883;  // TLS면 8883 권장
WiFiClient esp;
PubSubClient mqtt(esp);

// 토픽 규칙: terahub/{farmId}/{deviceId}/{kind}/{name}
const char* topicBase = "${topicBaseStr}";

// I2C 설정 (디바이스별)
${spec.device.startsWith('raspberry') ? 
  'const int I2C_SDA = 2;  // 라즈베리파이 5 기본 I2C 핀 (핀3)\nconst int I2C_SCL = 3;  // 라즈베리파이 5 기본 I2C 핀 (핀5)' : 
  'const int I2C_SDA = 21;  // ESP32/ESP8266 I2C 핀\nconst int I2C_SCL = 22;'}

// 센서 객체 선언
${generateSensorDeclarations(spec)}

// 액추에이터 핀 정의
${generateActuatorPins(spec)}

void setup() {
  Serial.begin(115200);
  
  // WiFi 연결 (디바이스별)
  ${spec.device.startsWith('raspberry') ? 
    '// 라즈베리파이는 시스템 WiFi 사용\n  Serial.println("라즈베리파이 WiFi 연결 완료!");' : 
    'WiFi.begin(ssid, password);\n  while (WiFi.status() != WL_CONNECTED) {\n    delay(1000);\n    Serial.println("WiFi 연결 중...");\n  }\n  Serial.println("WiFi 연결 완료!");'}
  
  // I2C 초기화
  Wire.begin(I2C_SDA, I2C_SCL);
  Serial.println("I2C 초기화 완료!");
  
  // 센서 초기화
  ${sensorInit}
  
  // Universal Bridge MQTT 연결 (LWT 설정)
  mqtt.setServer(mqtt_host, mqtt_port);
  String clientId = "${spec.device}-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  mqtt.setWill(String(topicBase + "/state/online").c_str(), "0", true); // LWT
  while (!mqtt.connect(clientId.c_str())) {
    delay(1000);
    Serial.println("Universal Bridge MQTT 연결 중...");
  }
  Serial.println("Universal Bridge MQTT 연결 완료!");
  
  // 연결 성립 시 온라인 상태 발행 (retained)
  mqtt.publish(String(topicBase + "/state/online").c_str(), "1", true);
  
  // MQTT 구독 설정
  mqtt.setCallback(mqttCallback);
  ${generateMQTTSubscriptions(spec)}
  
  Serial.println("시스템 초기화 완료!");
}

void loop() {
  if (!mqtt.connected()) {
    String clientId = "${spec.device}-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    mqtt.connect(clientId.c_str());
    ${generateMQTTSubscriptions(spec)}
  }
  mqtt.loop();
  
  // 센서 데이터 발행 (5초 주기)
  static unsigned long lastPublish = 0;
  if (millis() - lastPublish > 5000) {
    lastPublish = millis();
    
    ${sensorReading}
    
    Serial.println("센서 데이터 발행 완료");
  }
  
  delay(100);
}

// MQTT 메시지 수신 콜백
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("MQTT 메시지 수신: " + String(topic) + " = " + message);
  
  ${actuatorControl}
}`;
}

// 간단한 설정 파일 생성 함수
function generateSimpleConfig(spec: SystemSpec): string {
  return JSON.stringify({
    wifi: spec.wifi,
    bridge: {
      host: "your-bridge-host",
      port: 3001,
      deviceKey: "your-device-key"
    },
    sensors: spec.sensors,
    controls: spec.controls
  }, null, 2);
}

// 간단한 캘리브레이션 파일 생성 함수
function generateSimpleCalibration(spec: SystemSpec): string {
  const calibration: any = { sensors: {} };
  spec.sensors.forEach(sensor => {
    calibration.sensors[sensor.type] = {
      offset: 0,
      scale: 1,
      unit: "C"
    };
  });
  return JSON.stringify(calibration, null, 2);
}

// 간단한 README 파일 생성 함수
function generateSimpleReadme(spec: SystemSpec): string {
  // 안전문구 생성
  const safetyWarnings = generateSafetyWarnings(spec);
  
  // 농장 ID 가져오기
  const farmId = spec.farmId || 'demo';
  const deviceId = `${spec.device}-${Math.random().toString(36).substr(2, 8)}`;
  const topicBaseStr = topicBase(farmId, deviceId);
  
  return `# ${spec.device.toUpperCase()} ${spec.protocol.toUpperCase()} IoT 시스템

## 📋 시스템 사양
- **디바이스**: ${spec.device.toUpperCase()}
- **통신 프로토콜**: ${spec.protocol.toUpperCase()}
- **농장 ID**: ${farmId}${farmId === 'demo' ? ' (데모 모드)' : ''}
- **디바이스 ID**: ${deviceId}
- **토픽 베이스**: ${topicBaseStr}
- **브릿지 호스트**: bridge.local:1883
- **센서**: ${spec.sensors.map(s => s.type).join(', ')}
- **액추에이터**: ${spec.controls.map(c => c.type).join(', ')}
- **생성 시간**: ${new Date().toISOString()}

## ⚠️ 안전 주의사항

${safetyWarnings ? `
${safetyWarnings.split('\n * ').map(warning => `- ${warning}`).join('\n')}
` : '- 일반적인 전기 안전 수칙을 준수하세요'}

## 🚀 설치 방법

### 1. Arduino IDE 설정
1. Arduino IDE를 설치합니다
2. ${spec.device.toUpperCase()} 보드를 선택합니다
3. 필요한 라이브러리를 설치합니다:
   - WiFi (ESP32/ESP8266용)
   - PubSubClient (MQTT용)
   - ArduinoJson

### 2. 설정 파일 수정
1. \`config.json\` 파일에서 WiFi 설정을 수정합니다:
   \`\`\`json
   {
     "wifi": {
       "ssid": "YOUR_WIFI_SSID",
       "password": "YOUR_WIFI_PASSWORD"
     }
   }
   \`\`\`

### 3. 센서 보정
1. \`calibration.json\` 파일에서 센서별로 오프셋과 스케일 값을 조정합니다

### 4. 업로드
1. 메인 코드 파일을 Arduino IDE에서 엽니다
2. 보드를 연결하고 포트를 선택합니다
3. 업로드 버튼을 클릭합니다

## 🔧 하드웨어 연결

### 센서 연결
${spec.sensors.map(sensor => `- **${sensor.type}**: 핀 ${Array.from({ length: sensor.count }, (_, i) => i + 2).join(', ')}`).join('\n')}

### 액추에이터 연결
${spec.controls.map(control => `- **${control.type}**: 핀 ${Array.from({ length: control.count }, (_, i) => i + 10).join(', ')}`).join('\n')}

## 📡 Universal Bridge 연결

### MQTT 설정 (브로커 내장)
- **Universal Bridge 주소**: bridge.local:1883 (또는 브릿지 IP)
- **토픽 규칙**: terahub/{tenant}/{deviceId}/{kind}/{name}
- **센서 토픽**: terahub/${farmId}/esp32-xxx/sensors/bme280/temperature
- **액추에이터 토픽**: terahub/${farmId}/esp32-xxx/actuators/relay1/set

### 연결 방법
1. Universal Bridge가 실행 중인지 확인
2. ESP32가 같은 네트워크에 연결되어 있는지 확인
3. 코드에서 WiFi 설정만 수정하면 자동 연결

## 🐛 문제 해결

### 일반적인 문제
1. **WiFi 연결 실패**: SSID와 비밀번호를 확인하세요
2. **Universal Bridge 연결 실패**: Bridge가 실행 중인지, mqtt_host가 올바른지 확인하세요 (localhost 금지!)
3. **센서 데이터 없음**: 핀 연결과 센서 전원을 확인하세요
4. **액추에이터 작동 안함**: 핀 연결과 전원 공급을 확인하세요

### 시리얼 모니터 확인
- WiFi 연결 상태 메시지
- Universal Bridge MQTT 연결 상태
- 센서 데이터 발행 로그
- 오류 메시지 확인`;
}

// PlatformIO 설정 파일 생성 함수
function generatePlatformIOConfig(spec: SystemSpec): string {
  const libDeps = generatePlatformIOLibDeps(spec);
  
  // 장치별 PlatformIO 설정
  switch (spec.device) {
    case 'raspberrypi5':
      return `[env:raspberry-pi-5]
platform = linux_arm
board = raspberry-pi-5
framework = arduino
monitor_speed = 115200

; 라이브러리 의존성 (버전 고정)
lib_deps = 
    knolleary/PubSubClient @ ^2.8
    bblanchon/ArduinoJson @ ^7.0.4
${libDeps}

; 빌드 플래그
build_flags = 
    -DCORE_DEBUG_LEVEL=0

; 업로드 설정
upload_protocol = pi
upload_port = /dev/ttyUSB0

; 모니터 설정
monitor_port = /dev/ttyUSB0
monitor_filters = 
    default
    time
    log2file`;

    case 'raspberry_pi4':
      return `[env:raspberry-pi-4]
platform = linux_arm
board = raspberry-pi-4
framework = arduino
monitor_speed = 115200

; 라이브러리 의존성 (버전 고정)
lib_deps = 
    knolleary/PubSubClient @ ^2.8
    bblanchon/ArduinoJson @ ^7.0.4
${libDeps}

; 빌드 플래그
build_flags = 
    -DCORE_DEBUG_LEVEL=0

; 업로드 설정
upload_protocol = pi
upload_port = /dev/ttyUSB0

; 모니터 설정
monitor_port = /dev/ttyUSB0
monitor_filters = 
    default
    time
    log2file`;

    case 'raspberry_pi3':
      return `[env:raspberry-pi-3]
platform = linux_arm
board = raspberry-pi-3
framework = arduino
monitor_speed = 115200

; 라이브러리 의존성 (버전 고정)
lib_deps = 
    knolleary/PubSubClient @ ^2.8
    bblanchon/ArduinoJson @ ^7.0.4
${libDeps}

; 빌드 플래그
build_flags = 
    -DCORE_DEBUG_LEVEL=0

; 업로드 설정
upload_protocol = pi
upload_port = /dev/ttyUSB0

; 모니터 설정
monitor_port = /dev/ttyUSB0
monitor_filters = 
    default
    time
    log2file`;

    case 'esp8266':
      return `[env:nodemcuv2]
platform = espressif8266
board = nodemcuv2
framework = arduino
monitor_speed = 115200
upload_speed = 921600

; 라이브러리 의존성 (버전 고정)
lib_deps = 
    knolleary/PubSubClient @ ^2.8
    bblanchon/ArduinoJson @ ^7.0.4
${libDeps}

; 빌드 플래그
build_flags = 
    -DCORE_DEBUG_LEVEL=0

; 업로드 설정
upload_protocol = esptool
upload_port = /dev/ttyUSB0

; 모니터 설정
monitor_port = /dev/ttyUSB0
monitor_filters = 
    default
    time
    log2file`;

    case 'arduino_uno':
      return `[env:uno]
platform = atmelavr
board = uno
framework = arduino
monitor_speed = 115200

; 라이브러리 의존성 (버전 고정)
lib_deps = 
    knolleary/PubSubClient @ ^2.8
    bblanchon/ArduinoJson @ ^7.0.4
${libDeps}

; 빌드 플래그
build_flags = 
    -DCORE_DEBUG_LEVEL=0

; 업로드 설정
upload_protocol = arduino
upload_port = /dev/ttyUSB0

; 모니터 설정
monitor_port = /dev/ttyUSB0
monitor_filters = 
    default
    time
    log2file`;

    case 'arduino_r4':
      return `[env:uno_r4_wifi]
platform = renesas_uno
board = uno_r4_wifi
framework = arduino
monitor_speed = 115200

; 라이브러리 의존성 (버전 고정)
lib_deps = 
    knolleary/PubSubClient @ ^2.8
    bblanchon/ArduinoJson @ ^7.0.4
${libDeps}

; 빌드 플래그
build_flags = 
    -DCORE_DEBUG_LEVEL=0

; 업로드 설정
upload_protocol = renesas_uno
upload_port = /dev/ttyUSB0

; 모니터 설정
monitor_port = /dev/ttyUSB0
monitor_filters = 
    default
    time
    log2file`;

    default: // ESP32
      return `[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_speed = 921600

; 라이브러리 의존성 (버전 고정)
lib_deps = 
    knolleary/PubSubClient @ ^2.8
    bblanchon/ArduinoJson @ ^7.0.4
${libDeps}

; 빌드 플래그
build_flags = 
    -DCORE_DEBUG_LEVEL=0
    -DARDUINO_USB_CDC_ON_BOOT=1

; 업로드 설정
upload_protocol = esptool
upload_port = /dev/ttyUSB0

; 모니터 설정
monitor_port = /dev/ttyUSB0
monitor_filters = 
    default
    time
    log2file`;
  }
}

// PlatformIO 라이브러리 의존성 생성
function generatePlatformIOLibDeps(spec: SystemSpec): string {
  const libs: string[] = [];
  
  // 센서별 라이브러리
  spec.sensors.forEach(sensor => {
    switch(sensor.type) {
      case 'BME280':
        libs.push('    adafruit/Adafruit BME280 Library @ ^2.6.8');
        libs.push('    adafruit/Adafruit Unified Sensor @ ^1.1.14');
      break;
      case 'ENS160':
        libs.push('    sparkfun/SparkFun Indoor Air Quality Sensor - ENS160 Arduino Library @ ^1.0.8');
      break;
    }
  });
  
  // 액추에이터별 라이브러리
  spec.controls.forEach(control => {
    switch(control.type) {
      case 'WS2812B_NeoPixel':
        libs.push('    adafruit/Adafruit NeoPixel @ ^1.12.3');
      break;
  }
  });
  
  return [...new Set(libs)].join('\n');
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
    
    // 농장 ID 확인 (선택사항)
    const farmId = spec.farmId || 'demo';
    
    // 향후 지원 프로토콜 체크
    const futureProtocols = ['serial', 'ble', 'rs485', 'modbus-tcp', 'lorawan'];
    if (futureProtocols.includes(spec.protocol)) {
      return NextResponse.json({ 
        error: `${spec.protocol.toUpperCase()} 프로토콜은 향후 지원 예정입니다. 현재는 MQTT만 지원됩니다.`,
        supportedProtocols: ['mqtt'],
        futureProtocols: futureProtocols
      }, { status: 400 });
    }

    // 메인 코드 파일 생성 (디바이스별 분기)
    console.log('🔧 코드 생성 시작...');
    let code: string;
    let mainFilename: string;
    
    try {
      if (spec.device.startsWith('raspberry')) {
        // 라즈베리 파이용 Python 코드 생성
        code = generateRaspberryPiCode(spec);
        mainFilename = 'main.py';
        console.log('🍓 라즈베리 파이 Python 코드 생성 완료, 길이:', code.length);
      } else {
        // ESP32/Arduino용 C++ 코드 생성
        code = generateSimpleCode(spec);
        mainFilename = spec.bridgeIntegration 
          ? 'universal_bridge_system.ino'
          : getFilename(spec.device, spec.protocol);
        console.log('🔧 Arduino/C++ 코드 생성 완료, 길이:', code.length);
      }
    } catch (codeError) {
      console.error('❌ 코드 생성 오류:', codeError);
      return NextResponse.json({ error: `코드 생성 오류: ${codeError instanceof Error ? codeError.message : '알 수 없는 오류'}` }, { status: 500 });
    }
    
    // returnType 파라미터 확인
    const returnType = (spec as any).returnType || 'zip';
    
    if (returnType === 'text') {
      // 텍스트 형태로 파일들을 결합하여 반환
      const files: Record<string, string> = {};
      
      // 메인 코드 파일 추가
      files[mainFilename] = code;
      
      if (spec.device.startsWith('raspberry')) {
        // 라즈베리 파이 전용 파일들
        files['config.yaml'] = generateRaspberryPiConfig(spec);
        files['requirements.txt'] = generateRaspberryPiRequirements(spec);
        files['terahub-rpi.service'] = generateRaspberryPiService(spec);
        files['README.md'] = generateRaspberryPiReadme(spec);
      } else {
        // ESP32/Arduino 전용 파일들
        files['config.json'] = generateConfigFile(spec);
        
        // 캘리브레이션 파일 추가 (센서가 있는 경우)
        if (spec.sensors.length > 0) {
          files['calibration.json'] = generateCalibrationFile(spec);
        }
        
        files['platformio.ini'] = generatePlatformIOConfig(spec);
        files['README.md'] = generateSimpleReadme(spec);
      }
      
      // JSON 형태로 파일들을 반환 (인코딩 문제 해결)
      console.log('📝 JSON 형태 코드 반환, 파일 수:', Object.keys(files).length);
      
      return NextResponse.json({
        files: files,
        device: spec.device,
        protocol: spec.protocol,
        farmId: spec.farmId
      }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    } else {
      // ZIP 파일 생성
      const zip = new JSZip();
      
      // 메인 코드 파일 추가
      zip.file(mainFilename, code);
      
      // ZIP 파일명 생성 (재현성/검색성)
      const zipFilename = generateZipFilename(spec.farmId || 'demo', spec.device, spec.protocol);
      
      if (spec.device.startsWith('raspberry')) {
        // 라즈베리 파이 전용 파일들
        const configContent = generateRaspberryPiConfig(spec);
        zip.file('config.yaml', configContent);
        
        const requirementsContent = generateRaspberryPiRequirements(spec);
        zip.file('requirements.txt', requirementsContent);
        
        const serviceContent = generateRaspberryPiService(spec);
        zip.file('terahub-rpi.service', serviceContent);
        
        const readmeContent = generateRaspberryPiReadme(spec);
        zip.file('README.md', readmeContent);
      } else {
        // ESP32/Arduino 전용 파일들
        const configContent = generateConfigFile(spec);
        zip.file('config.json', configContent);
        
        // 캘리브레이션 파일 추가 (센서가 있는 경우)
        if (spec.sensors.length > 0) {
          const calibrationContent = generateCalibrationFile(spec);
          zip.file('calibration.json', calibrationContent);
        }
        
        const platformioContent = generatePlatformIOConfig(spec);
        zip.file('platformio.ini', platformioContent);
        
        const readmeContent = generateSimpleReadme(spec);
        zip.file('README.md', readmeContent);
      }
      
      console.log('📦 ZIP 파일 생성 중...');
      
      // NodeBuffer 대신 범용적인 uint8array로 생성
      const content = await zip.generateAsync({ type: 'uint8array' });
      
      console.log('📦 ZIP 파일 생성 완료, 크기:', content.byteLength, 'bytes');
      
      // ZIP 파일로 다운로드
      return new Response(content as any, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${zipFilename}"`,
          'Content-Length': String(content.byteLength),
          'Cache-Control': 'no-store',
        },
      });
    }
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
    'serial': 'serial',
    'ble': 'ble',
    'rs485': 'rs485',
    'modbus-tcp': 'modbus',
    'lorawan': 'lorawan'
  };
  
  // 향후 지원 프로토콜 체크
  const futureProtocols = ['serial', 'ble', 'rs485', 'modbus-tcp', 'lorawan'];
  if (futureProtocols.includes(protocol)) {
    throw new Error(`${protocol.toUpperCase()} 프로토콜은 향후 지원 예정입니다. 현재는 MQTT만 지원됩니다.`);
  }
  
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

// 센서별 라이브러리 include 생성
function generateSensorIncludes(spec: SystemSpec): string {
  const includes = [];
  
  // 디바이스별 기본 라이브러리
  if (spec.device.startsWith('raspberry')) {
    includes.push('#include <Arduino.h>');
    includes.push('#include <Wire.h>');
  } else {
    includes.push('#include <WiFi.h>');
    includes.push('#include <Wire.h>');
  }
  
  spec.sensors.forEach(sensor => {
    switch(sensor.type) {
      case 'BME280':
        includes.push('#include <Adafruit_BME280.h>');
        includes.push('#include <Adafruit_Sensor.h>');
        break;
      case 'ENS160':
        includes.push('#include <SparkFun_ENS160.h>');
        break;
      case 'HC-SR04':
        // HC-SR04는 별도 라이브러리 없이 직접 구현
        break;
    }
  });
  
  spec.controls.forEach(control => {
    switch(control.type) {
      case 'WS2812B_NeoPixel':
        includes.push('#include <Adafruit_NeoPixel.h>');
        break;
    }
  });
  
  return [...new Set(includes)].join('\n');
}

// 센서 객체 선언 생성
function generateSensorDeclarations(spec: SystemSpec): string {
  const declarations: string[] = [];
  
  spec.sensors.forEach((sensor, index) => {
    switch(sensor.type) {
      case 'BME280':
        declarations.push(`Adafruit_BME280 bme${index};`);
      break;
      case 'ENS160':
        declarations.push(`SparkFun_ENS160 ens160_${index};`);
        break;
      case 'HC-SR04':
        declarations.push(`const int TRIG_PIN_${index} = 18;`);
        declarations.push(`const int ECHO_PIN_${index} = 19;`);
        break;
    }
  });
  
  spec.controls.forEach((control, index) => {
    switch(control.type) {
      case 'WS2812B_NeoPixel':
        declarations.push(`Adafruit_NeoPixel strip${index}(60, 27, NEO_GRB + NEO_KHZ800);`);  // GPIO27 사용 (부트스트랩 핀 회피)
        break;
      case 'A4988_Stepper':
        declarations.push(`const int STEP_PIN_${index} = 33;`);
        declarations.push(`const int DIR_PIN_${index} = 32;`);
        declarations.push(`const int EN_PIN_${index} = 14;`);
        break;
      case 'AC_Relay_Lamp':
        declarations.push(`const int RELAY_PIN_${index} = 26;`);
        break;
    }
  });
  
  return declarations.join('\n');
}

// 액추에이터 핀 정의 생성
function generateActuatorPins(spec: SystemSpec): string {
  const pins: string[] = [];
  
  spec.controls.forEach((control, controlIndex) => {
    for (let i = 0; i < control.count; i++) {
      const componentKey = `control_${controlIndex}_${i}_${control.type}`;
      const assignedPin = spec.pinAssignments?.[componentKey];
      
      switch(control.type) {
        case 'WS2812B_NeoPixel':
          pins.push(`// WS2812B ${i + 1}번 핀: DATA=${assignedPin || 'GPIO27'} (레벨시프터 권장)`);
          break;
        case 'A4988_Stepper':
          pins.push(`// A4988 ${i + 1}번 핀: STEP=${assignedPin || 'GPIO33'}, DIR=GPIO32, EN=GPIO14`);
          break;
        case 'AC_Relay_Lamp':
          pins.push(`// AC 릴레이 ${i + 1}번 핀: ${assignedPin || 'GPIO26'} (외부 전원 필요)`);
          break;
        case 'PWM_12V_LED':
          pins.push(`// 12V LED ${i + 1}번 핀: ${assignedPin || 'GPIO25'} (MOSFET PWM)`);
          break;
        case 'TB6612_DC_Motor':
          pins.push(`// DC 모터 ${i + 1}번 핀: AIN1=${assignedPin || 'GPIO32'}, AIN2=GPIO33, PWMA=GPIO25`);
          break;
        case 'SG90_Servo':
          pins.push(`// 서보모터 ${i + 1}번 핀: ${assignedPin || 'GPIO18'} (PWM)`);
          break;
        case 'Solenoid_Valve':
          pins.push(`// 솔레노이드 밸브 ${i + 1}번 핀: ${assignedPin || 'GPIO26'} (릴레이 제어)`);
          break;
        case 'PWM_DC_Fan':
          pins.push(`// DC 팬 ${i + 1}번 핀: ${assignedPin || 'GPIO25'} (PWM 제어)`);
          break;
        case 'Generic_LED':
          pins.push(`// LED ${i + 1}번 핀: ${assignedPin || 'GPIO2'}`);
          break;
        default:
          pins.push(`// ${control.type} ${i + 1}번 핀: ${assignedPin || 'GPIO26'}`);
          break;
      }
    }
  });
  
  return pins.join('\n');
}

// 센서 초기화 코드 생성
function generateSensorInitialization(spec: SystemSpec): string {
  const initCode: string[] = [];
  
  spec.sensors.forEach((sensor, sensorIndex) => {
    for (let i = 0; i < sensor.count; i++) {
      const componentKey = `sensor_${sensorIndex}_${i}_${sensor.type}`;
      const assignedPin = spec.pinAssignments?.[componentKey];
      
      switch(sensor.type) {
        case 'BME280':
          initCode.push(`
  // BME280 ${i + 1}번 초기화 (I2C 주소 자동 감지: 0x76 또는 0x77)
  if (!bme${sensorIndex}_${i}.begin(0x76)) {
    if (!bme${sensorIndex}_${i}.begin(0x77)) {
      Serial.println("BME280 ${i + 1}번 초기화 실패!");
    } else {
      Serial.println("BME280 ${i + 1}번 초기화 성공 (주소: 0x77)");
    }
  } else {
    Serial.println("BME280 ${i + 1}번 초기화 성공 (주소: 0x76)");
  }`);
          break;
        case 'ENS160':
          initCode.push(`
  // ENS160 ${i + 1}번 초기화 (I2C 주소 자동 감지: 0x52 또는 0x53)
  if (!ens160_${sensorIndex}_${i}.begin(0x52)) {
    if (!ens160_${sensorIndex}_${i}.begin(0x53)) {
      Serial.println("ENS160 ${i + 1}번 초기화 실패!");
    } else {
      Serial.println("ENS160 ${i + 1}번 초기화 성공 (주소: 0x53)");
    }
  } else {
    Serial.println("ENS160 ${i + 1}번 초기화 성공 (주소: 0x52)");
  }`);
          break;
        case 'HC-SR04':
          initCode.push(`
  // HC-SR04 ${i + 1}번 초기화 (TRIG/ECHO 핀 설정)
  pinMode(${assignedPin || 'GPIO4'}, OUTPUT);  // TRIG 핀
  pinMode(${assignedPin || 'GPIO5'}, INPUT);   // ECHO 핀
  Serial.println("HC-SR04 ${i + 1}번 초기화 완료");`);
          break;
        case 'DHT22':
          initCode.push(`
  // DHT22 ${i + 1}번 초기화 (디지털 핀)
  pinMode(${assignedPin || 'GPIO4'}, INPUT_PULLUP);
  Serial.println("DHT22 ${i + 1}번 초기화 완료");`);
          break;
        case 'Generic_Analog':
          initCode.push(`
  // 아날로그 센서 ${i + 1}번 초기화
  Serial.println("아날로그 센서 ${i + 1}번 초기화 완료 (핀: ${assignedPin || 'A0'})");`);
          break;
        default:
          initCode.push(`
  // ${sensor.type} ${i + 1}번 초기화
  Serial.println("${sensor.type} ${i + 1}번 초기화 완료");`);
          break;
      }
    }
  });
  
  return initCode.join('\n');
}

// 센서 데이터 읽기 코드 생성
function generateSensorReading(spec: SystemSpec): string {
  const readingCode: string[] = [];
  
  spec.sensors.forEach((sensor, sensorIndex) => {
    for (let i = 0; i < sensor.count; i++) {
      switch(sensor.type) {
        case 'BME280':
          readingCode.push(`
    // BME280 ${i + 1}번 데이터 읽기
    float temp${sensorIndex}_${i} = bme${sensorIndex}_${i}.readTemperature();
    float hum${sensorIndex}_${i} = bme${sensorIndex}_${i}.readHumidity();
    float press${sensorIndex}_${i} = bme${sensorIndex}_${i}.readPressure() / 100.0;
    
    char tempStr[10], humStr[10], pressStr[10];
    dtostrf(temp${sensorIndex}_${i}, 1, 2, tempStr);
    dtostrf(hum${sensorIndex}_${i}, 1, 2, humStr);
    dtostrf(press${sensorIndex}_${i}, 1, 2, pressStr);
    
    mqtt.publish((String(topicBase) + "/sensors/bme280_${sensorIndex}_${i}/temperature").c_str(), tempStr, true);
    mqtt.publish((String(topicBase) + "/sensors/bme280_${sensorIndex}_${i}/humidity").c_str(), humStr, true);
    mqtt.publish((String(topicBase) + "/sensors/bme280_${sensorIndex}_${i}/pressure").c_str(), pressStr, true);`);
          break;
      case 'ENS160':
        readingCode.push(`
    // ENS160 데이터 읽기
    if (ens160_${index}.dataAvailable()) {
      float aqi${index} = ens160_${index}.getAQI();
      float tvoc${index} = ens160_${index}.getTVOC();
      float eco2${index} = ens160_${index}.getECO2();
      
      char aqiStr[10], tvocStr[10], eco2Str[10];
      dtostrf(aqi${index}, 1, 2, aqiStr);
      dtostrf(tvoc${index}, 1, 2, tvocStr);
      dtostrf(eco2${index}, 1, 2, eco2Str);
      
      mqtt.publish((String(topicBase) + "/sensors/ens160_${index}/aqi").c_str(), aqiStr, true);
      mqtt.publish((String(topicBase) + "/sensors/ens160_${index}/tvoc").c_str(), tvocStr, true);
      mqtt.publish((String(topicBase) + "/sensors/ens160_${index}/eco2").c_str(), eco2Str, true);
    }`);
        break;
      case 'HC-SR04':
        readingCode.push(`
    // HC-SR04 거리 측정
    digitalWrite(TRIG_PIN_${index}, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN_${index}, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN_${index}, LOW);
    
    long duration${index} = pulseIn(ECHO_PIN_${index}, HIGH, 30000);
    float distance${index} = duration${index} / 58.0;  // cm 단위
    
    char distStr[10];
    dtostrf(distance${index}, 1, 2, distStr);
    mqtt.publish((String(topicBase) + "/sensors/hcsr04_${index}/distance").c_str(), distStr, true);`);
        break;
    }
  });
  
  return readingCode.join('');
}

// 액추에이터 제어 코드 생성
function generateActuatorControl(spec: SystemSpec): string {
  const controlCode: string[] = [];
  
  spec.controls.forEach((control, index) => {
    switch(control.type) {
      case 'WS2812B_NeoPixel':
        controlCode.push(`
  // WS2812B 제어
  if (String(topic).endsWith("/actuators/neopixel_${index}/set")) {
    StaticJsonDocument<200> doc;
    deserializeJson(doc, message);
    
    int r = doc["r"] | 0;
    int g = doc["g"] | 0;
    int b = doc["b"] | 0;
    int count = doc["count"] | 60;
    
    strip${index}.fill(strip${index}.Color(r, g, b));
    strip${index}.show();
    Serial.println("NeoPixel 설정: R=" + String(r) + " G=" + String(g) + " B=" + String(b));
  }`);
        break;
      case 'A4988_Stepper':
        controlCode.push(`
  // A4988 스테퍼 제어
  if (String(topic).endsWith("/actuators/stepper_${index}/set")) {
    StaticJsonDocument<200> doc;
    deserializeJson(doc, message);
    
    int steps = doc["steps"] | 0;
    int dir = doc["dir"] | 0;
    int speed_hz = doc["speed_hz"] | 1000;
    bool enable = doc["enable"] | true;
    
    digitalWrite(EN_PIN_${index}, enable ? LOW : HIGH);
    digitalWrite(DIR_PIN_${index}, dir);
    
    for (int i = 0; i < steps; i++) {
      digitalWrite(STEP_PIN_${index}, HIGH);
      delayMicroseconds(1000000 / speed_hz / 2);
      digitalWrite(STEP_PIN_${index}, LOW);
      delayMicroseconds(1000000 / speed_hz / 2);
    }
    Serial.println("스테퍼 이동: " + String(steps) + " 스텝");
  }`);
        break;
      case 'AC_Relay_Lamp':
        controlCode.push(`
  // 릴레이 제어
  if (String(topic).endsWith("/actuators/relay_${index}/set")) {
    if (message == "on") {
      digitalWrite(RELAY_PIN_${index}, HIGH);
      Serial.println("릴레이 ON");
    } else if (message == "off") {
      digitalWrite(RELAY_PIN_${index}, LOW);
      Serial.println("릴레이 OFF");
    }
  }`);
        break;
    }
  });
  
  return controlCode.join('');
}

// MQTT 구독 설정 생성
function generateMQTTSubscriptions(spec: SystemSpec): string {
  const subscriptions: string[] = [];
  
  spec.controls.forEach((control, index) => {
    switch(control.type) {
      case 'WS2812B_NeoPixel':
        subscriptions.push(`mqtt.subscribe((String(topicBase) + "/actuators/neopixel_${index}/set").c_str());`);
        break;
      case 'A4988_Stepper':
        subscriptions.push(`mqtt.subscribe((String(topicBase) + "/actuators/stepper_${index}/set").c_str());`);
        break;
      case 'AC_Relay_Lamp':
        subscriptions.push(`mqtt.subscribe((String(topicBase) + "/actuators/relay_${index}/set").c_str());`);
        break;
    }
  });
  
  return subscriptions.join('\n  ');
}

// 안전문구 생성 함수
function generateSafetyWarnings(spec: SystemSpec): string {
  const warnings = [];
  
  // 고위험 액추에이터 검사
  const highRiskActuators = spec.controls.filter(control => 
    ['ac_dimmer_triac', 'ssr', 'relay_ac_lamp'].includes(control.type)
  );
  
  if (highRiskActuators.length > 0) {
    warnings.push('⚠️ 고위험 액추에이터 사용 주의:');
    warnings.push('   - AC 고전압 작업 시 절연 릴레이 모듈 사용 필수');
    warnings.push('   - 공통 GND 연결 확인');
    warnings.push('   - 적절한 차단기 설치');
    warnings.push('   - 배선 전 전원 차단 확인');
  }
  
  // SSR 특별 경고
  if (spec.controls.some(c => c.type === 'ssr')) {
    warnings.push('🔥 SSR 사용 시 주의:');
    warnings.push('   - 발열 주의, 방열판 설치 필수');
    warnings.push('   - 적절한 냉각 시스템 구비');
  }
  
  // AC 디머 특별 경고
  if (spec.controls.some(c => c.type === 'ac_dimmer_triac')) {
    warnings.push('⚡ AC 디머 사용 시 주의:');
    warnings.push('   - 제로크로스(ZCD) 핀 연결 필수');
    warnings.push('   - 트라이악 적절한 스펙 확인');
  }
  
  return warnings.length > 0 ? warnings.join('\n * ') : '';
}

// HTTP 코드 생성 함수 제거됨 (MQTT 전용 아키텍처)

function generateESP32Code(spec: SystemSpec): string {
  return generateUniversalBridgeArduinoCode(spec);
}

function generateESP8266Code(spec: SystemSpec): string {
  return generateUniversalBridgeArduinoCode(spec);
}

function generateArduinoCode(spec: SystemSpec): string {
  return generateUniversalBridgeArduinoCode(spec);
}


function generateUniversalBridgeArduinoCode(spec: SystemSpec): string {
  // MQTT 전용 아키텍처로 generateSimpleCode 사용
  return generateSimpleCode(spec);
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
    mqtt: {
      host: "bridge.local",
      port: 1883,
      tls: false
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
    // 향후 지원 예정
    lorawan: null,
    modbus: null
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
  const farmId = spec.farmId || 'demo';
  
  // 안전문구 생성
  const safetyWarnings = generateSafetyWarnings(spec);
  
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
   - PubSubClient (MQTT용)
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

## ⚠️ 안전 주의사항

${safetyWarnings ? `
${safetyWarnings.split('\n * ').map(warning => `- ${warning}`).join('\n')}
` : '- 일반적인 전기 안전 수칙을 준수하세요'}

## 🔧 하드웨어 연결

### 센서 연결
${sensors.map(sensor => `- **${sensor.type}**: 핀 ${Array.from({ length: sensor.count }, (_, i) => i + 2).join(', ')}`).join('\n')}

### 액추에이터 연결
${controls.map(control => `- **${control.type}**: 핀 ${Array.from({ length: control.count }, (_, i) => i + 10).join(', ')}`).join('\n')}

## 📡 통신 설정

### ${protocol.toUpperCase()} 설정
${protocol === 'mqtt' ? `
- **브로커 주소**: bridge.local:1883
- **토픽 규칙**: terahub/{tenant}/{deviceId}/{kind}/{name}
- **센서 토픽**: terahub/${farmId}/esp32-xxx/sensors/bme280/temperature
- **액추에이터 토픽**: terahub/${farmId}/esp32-xxx/actuators/relay1/set
` : `
- **프로토콜**: ${protocol.toUpperCase()} (향후 지원 예정)
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

// 라즈베리 파이용 Python 코드 생성 함수
function generateRaspberryPiCode(spec: SystemSpec): string {
  const farmId = spec.farmId || 'demo';
  const deviceId = `${spec.device}-${Math.random().toString(36).substr(2, 8)}`;
  const topicBase = `terahub/${farmId}/${deviceId}`;
  
  const sensorImports = generateRaspberryPiSensorImports(spec);
  const sensorInit = generateRaspberryPiSensorInit(spec);
  const sensorReading = generateRaspberryPiSensorReading(spec);
  const actuatorInit = generateRaspberryPiActuatorInit(spec);
  const actuatorControl = generateRaspberryPiActuatorControl(spec);
  
  return `#!/usr/bin/env python3
"""
Universal Bridge 호환 Raspberry Pi IoT 시스템
디바이스: ${spec.device.toUpperCase()}
생성 시간: ${new Date().toISOString()}
농장 ID: ${farmId}

⚠️ 안전 주의사항:
- WS2812B는 외부 5V 전원과 레벨시프터 필수
- A4988 스테퍼모터는 외부 VM 전원 필요
- 릴레이는 옵토/드라이버 내장 모듈 사용
- AC 배선은 절연/퓨즈/차단기 필수
"""

import time
import json
import yaml
import os
import threading
import paho.mqtt.client as mqtt
from smbus2 import SMBus
from gpiozero import OutputDevice
import pigpio

# 센서 라이브러리 (선택적 임포트)
${sensorImports}

# 설정 로드
try:
    with open("config.yaml") as f:
        CFG = yaml.safe_load(f)
except:
    # 기본 설정
    CFG = {
        "mqtt": {"host": "bridge.local", "port": 1883, "username": "", "password": ""},
        "ids": {"tenant": "${farmId}", "deviceId": "${deviceId}"},
        "topics": {"base": "${topicBase}"}
    }

TENANT = CFG["ids"]["tenant"]
DEVICE = CFG["ids"]["deviceId"]
BASE = CFG["topics"]["base"]

MQTT_HOST = CFG["mqtt"]["host"]
MQTT_PORT = int(CFG["mqtt"]["port"])
USER = CFG["mqtt"].get("username") or None
PWD = CFG["mqtt"].get("password") or None

def T(kind, name): 
    return f"{BASE}/{kind}/{name}"

def jpub(client, topic, val, unit=None):
    msg = {"v": val, "ts": int(time.time())}
    if unit: 
        msg["unit"] = unit
    client.publish(topic, json.dumps(msg), retain=True, qos=0)

# MQTT 클라이언트 설정 (LWT 설정)
cli = mqtt.Client(client_id=f"rpi-{int(time.time())}")
cli.will_set(T("state", "online"), "0", retain=True)  # LWT
if USER and PWD: 
    cli.username_pw_set(USER, PWD)

# GPIO/pigpio 초기화
pi = pigpio.pi()
if not pi.connected:
    print("WARN: pigpio not connected; PWM/stepper timing may be limited.")

# 센서 초기화
${sensorInit}

# 액추에이터 초기화
${actuatorInit}

# MQTT 메시지 핸들러
def on_message(client, userdata, msg):
    t = msg.topic
    p = msg.payload.decode(errors="ignore").strip()
    
    ${actuatorControl}

def ensure_mqtt():
    while True:
        try:
            if cli.is_connected(): 
                return
            cli.connect(MQTT_HOST, MQTT_PORT, 60)
            cli.publish(T("state", "online"), "1", retain=True)  # 연결 성립 시 온라인 상태 발행
            # 구독 설정
            for control in ${JSON.stringify(spec.controls.map(c => c.type))}:
                cli.subscribe(T("actuators", f"{control}/set"))
            return
        except Exception as e:
            print(f"MQTT 연결 실패: {e}")
            time.sleep(2)

cli.on_message = on_message
ensure_mqtt()

# 메인 루프
def read_and_publish():
    while True:
        try:
            ${sensorReading}
        except Exception as e:
            print(f"센서 읽기 오류: {e}")
        finally:
            for _ in range(50):  # 5초 주기
                cli.loop(0.1)
                time.sleep(0.1)

if __name__ == "__main__":
    print(f"🚀 Raspberry Pi IoT 시스템 시작: {DEVICE}")
    print(f"📡 MQTT 브로커: {MQTT_HOST}:{MQTT_PORT}")
    print(f"🏠 농장 ID: {TENANT}")
    read_and_publish()
`;
}

// 라즈베리 파이 센서 임포트 생성
function generateRaspberryPiSensorImports(spec: SystemSpec): string {
  const imports: string[] = [];
  
  spec.sensors.forEach(sensor => {
    switch(sensor.type) {
      case 'DS18B20':
        imports.push('from w1thermsensor import W1ThermSensor');
        break;
      case 'BME280':
        imports.push('import adafruit_bme280');
        imports.push('import board');
        imports.push('import busio');
        break;
      case 'ADS1115':
        imports.push('import adafruit_ads1x15.ads1115 as ADS');
        imports.push('from adafruit_ads1x15.analog_in import AnalogIn');
        break;
      case 'BH1750':
        imports.push('import bh1750');
        break;
    }
  });
  
  // WS2812B가 있으면 NeoPixel 임포트 추가
  if (spec.controls.some(c => c.type === 'WS2812B_NeoPixel')) {
    imports.push('from rpi_ws281x import Adafruit_NeoPixel, Color');
  }
  
  return imports.join('\n');
}

// 라즈베리 파이 센서 초기화 생성
function generateRaspberryPiSensorInit(spec: SystemSpec): string {
  const initCode: string[] = [];
  
  spec.sensors.forEach(sensor => {
    switch(sensor.type) {
      case 'DS18B20':
        initCode.push(`# DS18B20 초기화
ds18 = None
try:
    ds_list = W1ThermSensor.get_available_sensors()
    ds18 = ds_list[0] if ds_list else None
    print(f"DS18B20 센서 발견: {len(ds_list)}개")
except Exception as e:
    print(f"DS18B20 초기화 실패: {e}")`);
        break;
      case 'BME280':
        initCode.push(`# BME280 초기화 (I2C: SDA=GPIO2, SCL=GPIO3)
bme = None
try:
    i2c = busio.I2C(board.SCL, board.SDA)  # GPIO2/GPIO3 (핀3/핀5)
    bme = adafruit_bme280.Adafruit_BME280_I2C(i2c, address=0x76)
    print("BME280 초기화 성공 (I2C 주소: 0x76)")
except Exception as e:
    print(f"BME280 초기화 실패: {e}")`);
        break;
      case 'ADS1115':
        initCode.push(`# ADS1115 초기화
ads = None
ch_objs = []
try:
    i2c = busio.I2C(board.SCL, board.SDA)
    ads = ADS.ADS1115(i2c, address=0x48)
    for ch in [0, 1]:  # 채널 0, 1 사용
        ch_objs.append(AnalogIn(ads, getattr(ADS, f"P{ch}")))
    print("ADS1115 초기화 성공")
except Exception as e:
    print(f"ADS1115 초기화 실패: {e}")`);
        break;
      case 'BH1750':
        initCode.push(`# BH1750 초기화
bh = None
try:
    bh = bh1750.BH1750(bus=1)
    print("BH1750 초기화 성공")
except Exception as e:
    print(f"BH1750 초기화 실패: {e}")`);
        break;
    }
  });
  
  return initCode.join('\n\n');
}

// 라즈베리 파이 센서 읽기 생성
function generateRaspberryPiSensorReading(spec: SystemSpec): string {
  const readingCode: string[] = [];
  
  spec.sensors.forEach(sensor => {
    switch(sensor.type) {
      case 'DS18B20':
        readingCode.push(`if ds18:
    try:
        temp = ds18.get_temperature()
        jpub(cli, T("sensors", "ds18b20/tempC"), temp, "C")
    except Exception as e:
        print(f"DS18B20 읽기 오류: {e}")`);
        break;
      case 'BME280':
        readingCode.push(`if bme:
    try:
        jpub(cli, T("sensors", "bme280/temperature"), bme.temperature, "C")
        jpub(cli, T("sensors", "bme280/humidity"), bme.humidity, "%")
        jpub(cli, T("sensors", "bme280/pressure"), bme.pressure, "hPa")
    except Exception as e:
        print(f"BME280 읽기 오류: {e}")`);
        break;
      case 'ADS1115':
        readingCode.push(`if ads and ch_objs:
    try:
        for i, ch in enumerate(ch_objs):
            jpub(cli, T("sensors", f"ads1115/ch{i}"), ch.voltage, "V")
    except Exception as e:
        print(f"ADS1115 읽기 오류: {e}")`);
        break;
      case 'BH1750':
        readingCode.push(`if bh:
    try:
        lux = bh.luminance(bh1750.CONT_HIRES_1)
        jpub(cli, T("sensors", "bh1750/lux"), lux, "lx")
    except Exception as e:
        print(f"BH1750 읽기 오류: {e}")`);
        break;
    }
  });
  
  return readingCode.join('\n\n');
}

// 라즈베리 파이 액추에이터 초기화 생성
function generateRaspberryPiActuatorInit(spec: SystemSpec): string {
  const initCode: string[] = [];
  
  spec.controls.forEach(control => {
    switch(control.type) {
      case 'AC_Relay_Lamp':
        initCode.push(`# 릴레이 초기화
relay1 = OutputDevice(23, active_high=False, initial_value=False)
print("릴레이 1 초기화 완료 (GPIO23)")`);
        break;
      case 'Solid_State_Relay':
        initCode.push(`# SSR 초기화
relay2 = OutputDevice(24, active_high=False, initial_value=False)
print("릴레이 2 초기화 완료 (GPIO24)")`);
        break;
      case 'A4988_Stepper':
        initCode.push(`# A4988 스테퍼모터 초기화 (외부 VM 전원 필요)
step_pin = 12  # GPIO12 (핀32, 하드웨어 PWM)
dir_pin = 16   # GPIO16 (핀36)
en_pin = 20    # GPIO20 (핀38)
pi.set_mode(step_pin, pigpio.OUTPUT)
pi.set_mode(dir_pin, pigpio.OUTPUT)
pi.set_mode(en_pin, pigpio.OUTPUT)
pi.write(en_pin, 1)  # 비활성화 (초기 안전 상태)
print("A4988 스테퍼모터 초기화 완료 (STEP=GPIO12, DIR=GPIO16, EN=GPIO20)")
print("⚠️ 외부 VM 전원 연결 및 Vref 전류 제한 설정 필요")`);
        break;
      case 'WS2812B_NeoPixel':
        initCode.push(`# WS2812B NeoPixel 초기화 (외부 5V 전원 + 레벨시프터 필요)
neo = None
try:
    neo = Adafruit_NeoPixel(
        60,  # 픽셀 수
        18,  # GPIO18
        0x00100800,  # GRB + 800kHz
        brightness=0.3
    )
    neo.begin()
    print("WS2812B NeoPixel 초기화 완료")
except Exception as e:
    print(f"WS2812B 초기화 실패: {e}")`);
        break;
    }
  });
  
  return initCode.join('\n\n');
}

// 라즈베리 파이 액추에이터 제어 생성
function generateRaspberryPiActuatorControl(spec: SystemSpec): string {
  const controlCode: string[] = [];
  
  spec.controls.forEach(control => {
    switch(control.type) {
      case 'AC_Relay_Lamp':
        controlCode.push(`if t == T("actuators", "relay1/set"):
    on = p.lower() in ("1", "on", "true")
    relay1.on() if on else relay1.off()
    print(f"릴레이 1: {'ON' if on else 'OFF'}")`);
        break;
      case 'Solid_State_Relay':
        controlCode.push(`if t == T("actuators", "relay2/set"):
    on = p.lower() in ("1", "on", "true")
    relay2.on() if on else relay2.off()
    print(f"릴레이 2: {'ON' if on else 'OFF'}")`);
        break;
      case 'A4988_Stepper':
        controlCode.push(`if t == T("actuators", "stepper/cmd"):
    try:
        d = json.loads(p)
        steps = d.get("steps", 0)
        direction = d.get("dir", 1)
        speed_hz = d.get("speed_hz", 800)
        
        pi.write(dir_pin, 1 if direction > 0 else 0)
        pi.write(en_pin, 0)  # 활성화
        
        delay_us = max(1000000 // max(speed_hz, 1), 200)
        for _ in range(max(0, int(steps))):
            pi.write(step_pin, 1)
            pigpio.time_sleep(delay_us / 1_000_000)
            pi.write(step_pin, 0)
            pigpio.time_sleep(delay_us / 1_000_000)
        
        pi.write(en_pin, 1)  # 비활성화
        print(f"스테퍼모터: {steps} 스텝, 방향 {direction}")
    except Exception as e:
        print(f"스테퍼모터 제어 오류: {e}")`);
        break;
      case 'WS2812B_NeoPixel':
        controlCode.push(`if t == T("actuators", "neopixel/set"):
    try:
        d = json.loads(p)
        r = int(d.get("r", 0))
        g = int(d.get("g", 0))
        b = int(d.get("b", 0))
        count = d.get("count", 60)
        
        if neo:
            for i in range(min(count, neo.numPixels())):
                neo.setPixelColor(i, Color(r, g, b))
            neo.show()
        print(f"NeoPixel: RGB({r},{g},{b}), {count}개 픽셀")
    except Exception as e:
        print(f"NeoPixel 제어 오류: {e}")`);
        break;
    }
  });
  
  return controlCode.join('\n\n');
}

// 라즈베리 파이용 설정 파일 생성
function generateRaspberryPiConfig(spec: SystemSpec): string {
  const farmId = spec.farmId || 'demo';
  const deviceId = `${spec.device}-${Math.random().toString(36).substr(2, 8)}`;
  
  const config: any = {
    wifi: {}, // 라즈베리 파이는 OS에서 관리
    mqtt: {
      host: "bridge.local",
      port: 1883,
      username: "",
      password: ""
    },
    ids: {
      tenant: farmId,
      deviceId: deviceId
    },
    topics: {
      base: `terahub/${farmId}/${deviceId}`
    },
    sensors: {},
    actuators: {}
  };
  
  // 센서 설정 추가
  spec.sensors.forEach(sensor => {
    switch(sensor.type) {
      case 'DS18B20':
        config.sensors.ds18b20 = { enabled: true, gpio: 4 };
        break;
      case 'BME280':
        config.sensors.bme280 = { enabled: true, i2c_bus: 1, address: 0x76 };
        break;
      case 'ADS1115':
        config.sensors.ads1115 = { enabled: true, i2c_bus: 1, address: 0x48, channels: [0, 1] };
        break;
      case 'BH1750':
        config.sensors.bh1750 = { enabled: true, i2c_bus: 1, address: 0x23 };
        break;
    }
  });
  
  // 액추에이터 설정 추가
  spec.controls.forEach(control => {
    switch(control.type) {
      case 'AC_Relay_Lamp':
        config.actuators.relay1 = { enabled: true, gpio: 23, active_low: true };
        break;
      case 'Solid_State_Relay':
        config.actuators.relay2 = { enabled: true, gpio: 24, active_low: true };
        break;
      case 'A4988_Stepper':
        config.actuators.stepper = { enabled: true, step: 12, dir: 16, en: 20, default_speed_hz: 800 };
        break;
      case 'WS2812B_NeoPixel':
        config.actuators.neopixel = { enabled: true, gpio: 18, count: 60, brightness: 0.3 };
        break;
    }
  });
  
  return `# Universal Bridge 호환 Raspberry Pi 설정
# 생성 시간: ${new Date().toISOString()}
# 농장 ID: ${farmId}

${JSON.stringify(config, null, 2)}`;
}

// 라즈베리 파이용 requirements.txt 생성
function generateRaspberryPiRequirements(spec: SystemSpec): string {
  const requirements: string[] = [
    'paho-mqtt==1.6.1',
    'smbus2==0.5.1',
    'gpiozero==2.0',
    'pigpio==1.78',
    'PyYAML==6.0.2'
  ];
  
  // 센서별 라이브러리 추가
  spec.sensors.forEach(sensor => {
    switch(sensor.type) {
      case 'DS18B20':
        requirements.push('w1thermsensor==2.3.0');
        break;
      case 'BME280':
        requirements.push('adafruit-circuitpython-bme280==2.6.23');
        requirements.push('adafruit-circuitpython-busdevice==5.3.1');
        break;
      case 'ADS1115':
        requirements.push('adafruit-circuitpython-ads1x15==2.4.9');
        requirements.push('adafruit-circuitpython-busdevice==5.3.1');
        break;
      case 'BH1750':
        requirements.push('bh1750==0.1.7');
        break;
    }
  });
  
  // 액추에이터별 라이브러리 추가
  spec.controls.forEach(control => {
    if (control.type === 'WS2812B_NeoPixel') {
      requirements.push('rpi_ws281x==4.3.4');
    }
  });
  
  return requirements.join('\n');
}

// 라즈베리 파이용 systemd 서비스 파일 생성
function generateRaspberryPiService(spec: SystemSpec): string {
  return `[Unit]
Description=Terahub Raspberry Pi MQTT Agent
After=network-online.target pigpiod.service
Wants=network-online.target

[Service]
User=pi
WorkingDirectory=/opt/terahub-agent
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target`;
}

// 라즈베리 파이용 README 생성
function generateRaspberryPiReadme(spec: SystemSpec): string {
  const farmId = spec.farmId || 'demo';
  const deviceId = `${spec.device}-${Math.random().toString(36).substr(2, 8)}`;
  const topicBaseStr = topicBase(farmId, deviceId);
  
  return `# 🍓 Raspberry Pi IoT 시스템

## 📋 시스템 정보
- **디바이스**: ${spec.device.toUpperCase()}
- **농장 ID**: ${farmId}${farmId === 'demo' ? ' (데모 모드)' : ''}
- **디바이스 ID**: ${deviceId}
- **토픽 베이스**: ${topicBaseStr}
- **브릿지 호스트**: bridge.local:1883
- **생성 시간**: ${new Date().toISOString()}

## 🔧 설치 및 설정

### 1. 시스템 설정
\`\`\`bash
# I2C 활성화
sudo raspi-config
# Interface Options → I2C → Enable

# 1-Wire 활성화 (DS18B20 사용 시)
echo "dtoverlay=w1-gpio,gpiopin=4" | sudo tee -a /boot/config.txt

# pigpio 설치 (WS2812B/A4988 사용 시)
sudo apt install pigpio
sudo systemctl enable --now pigpiod

# 재부팅
sudo reboot
\`\`\`

### 2. 프로젝트 설정
\`\`\`bash
# 프로젝트 폴더 생성
sudo mkdir -p /opt/terahub-agent
cd /opt/terahub-agent

# 파일 복사 (이 ZIP 파일의 내용을 복사)
# main.py, config.yaml, requirements.txt, terahub-rpi.service

# 가상환경 생성 및 패키지 설치
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
\`\`\`

### 3. 설정 수정
\`config.yaml\` 파일에서 다음 항목을 수정하세요:
- \`mqtt.host\`: Universal Bridge IP 주소 (예: "192.168.1.100")
- \`mqtt.username/password\`: MQTT 인증 정보 (필요시)

### 4. 서비스 등록 및 시작
\`\`\`bash
# 서비스 파일 복사
sudo cp terahub-rpi.service /etc/systemd/system/

# 서비스 활성화 및 시작
sudo systemctl daemon-reload
sudo systemctl enable terahub-rpi.service
sudo systemctl start terahub-rpi.service

# 상태 확인
sudo systemctl status terahub-rpi.service
\`\`\`

## 🔌 하드웨어 연결

### I2C 센서들 (공통 버스)
- **SDA**: GPIO2 (핀 3)
- **SCL**: GPIO3 (핀 5)
- **전원**: 3.3V, **GND**: 공통

### 1-Wire 센서
- **DS18B20 DATA**: GPIO4 (핀 7) + 4.7kΩ 풀업 저항 (DATA↔3.3V)

### 액추에이터들
- **릴레이 1**: GPIO23 (핀 16)
- **릴레이 2**: GPIO24 (핀 18)
- **A4988 STEP**: GPIO12 (핀 32)
- **A4988 DIR**: GPIO16 (핀 36)
- **A4988 EN**: GPIO20 (핀 38)
- **WS2812B DATA**: GPIO18 (핀 12)

## ⚠️ 안전 주의사항

### 전원 공급 (라즈베리 파이 5 기준)
- **라즈베리 파이 5**: 5V 5A급 어댑터 권장 (USB/카메라/추가 HAT 고려)
- **WS2812B**: 외부 5V 전원 + 레벨시프터 + 직렬 저항 + 대용량 캐패시터
- **A4988**: 외부 VM 전원 (12V 등) + Vref 전류 제한 설정 + 모터/전원 연결 순서 주의
- **SG90 서보**: 외부 5V 전원 (서보 전류 급변 대응) + GND 공통
- **릴레이**: 옵토/드라이버 내장 모듈 사용 (코일 직접 구동 금지)

### AC 배선
- 절연/퓨즈/차단기 필수
- 접점 정격 확인
- 전문가 설치 권장

## 📡 MQTT 토픽

### 센서 데이터 발행
- \`terahub/${farmId}/${deviceId}/sensors/ds18b20/tempC\`
- \`terahub/${farmId}/${deviceId}/sensors/bme280/temperature\`
- \`terahub/${farmId}/${deviceId}/sensors/bme280/humidity\`
- \`terahub/${farmId}/${deviceId}/sensors/bme280/pressure\`
- \`terahub/${farmId}/${deviceId}/sensors/bh1750/lux\`
- \`terahub/${farmId}/${deviceId}/sensors/ads1115/ch0\`
- \`terahub/${farmId}/${deviceId}/sensors/ads1115/ch1\`

### 액추에이터 제어 (구독)
- \`terahub/${farmId}/${deviceId}/actuators/relay1/set\` → "on"/"off"
- \`terahub/${farmId}/${deviceId}/actuators/relay2/set\` → "on"/"off"
- \`terahub/${farmId}/${deviceId}/actuators/stepper/cmd\` → {"steps": 1200, "dir": 1, "speed_hz": 800}
- \`terahub/${farmId}/${deviceId}/actuators/neopixel/set\` → {"r": 255, "g": 0, "b": 0, "count": 60}

### 상태 토픽
- \`terahub/${farmId}/${deviceId}/state/online\` → "1" (연결됨) / "0" (연결 끊김)

## 🔍 문제 해결

### 로그 확인
\`\`\`bash
sudo journalctl -u terahub-rpi.service -f
\`\`\`

### 수동 실행
\`\`\`bash
cd /opt/terahub-agent
source venv/bin/activate
python3 main.py
\`\`\`

### 일반적인 문제들
1. **I2C 오류**: \`sudo raspi-config\`에서 I2C 활성화 확인
2. **1-Wire 오류**: \`/boot/config.txt\`에 \`dtoverlay=w1-gpio,gpiopin=4\` 추가
3. **pigpio 오류**: \`sudo systemctl status pigpiod\` 확인
4. **MQTT 연결 실패**: 네트워크 및 브로커 주소 확인

## 📞 지원
문제가 발생하면 시스템 로그와 함께 문의하세요.
`;
}

// 간단한 ZIP 파일 생성 함수
function createSimpleZip(files: Record<string, string>): Buffer {
  // 실제 ZIP 파일 생성 대신 간단한 텍스트 기반 패키지 생성
  const packageContent = Object.entries(files)
    .map(([filename, content]) => `=== ${filename} ===\n${content}\n`)
    .join('\n');
  
  return Buffer.from(packageContent, 'utf-8');
}
