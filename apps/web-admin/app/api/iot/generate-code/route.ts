// IoT 디바이스 코드 자동 생성 API
import { NextRequest, NextResponse } from 'next/server';
import { sensors, controls, devicePinmaps } from '@/lib/iot-templates/index';
import JSZip from 'jszip';
// import { EnhancedCodeGenerator, EnhancedSystemSpec } from '../../../../packages/device-templates/enhanced-code-generator';
import { SystemSpec } from './types';

// Node 런타임 강제 및 캐시 회피
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 간단한 코드 생성 함수 (테스트용)
function generateSimpleCode(spec: SystemSpec): string {
  // 안전문구 생성
  const safetyWarnings = generateSafetyWarnings(spec);
  
  // 토픽 규칙 적용
  const topicBase = `terahub/demo/${spec.device}-${Math.random().toString(36).substr(2, 8)}`;

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

// 토픽 규칙: terahub/{tenant}/{deviceId}/{kind}/{name}
const char* topicBase = "${topicBase}";

// I2C 설정 (디바이스별)
${spec.device.startsWith('raspberry') ? 
  'const int I2C_SDA = 2;  // 라즈베리파이 기본 I2C 핀\nconst int I2C_SCL = 3;' : 
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
  
  // Universal Bridge MQTT 연결
  mqtt.setServer(mqtt_host, mqtt_port);
  String clientId = "${spec.device}-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  while (!mqtt.connect(clientId.c_str())) {
    delay(1000);
    Serial.println("Universal Bridge MQTT 연결 중...");
  }
  Serial.println("Universal Bridge MQTT 연결 완료!");
  
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
  
  return `# ${spec.device.toUpperCase()} ${spec.protocol.toUpperCase()} IoT 시스템

## 📋 시스템 사양
- **디바이스**: ${spec.device.toUpperCase()}
- **통신 프로토콜**: ${spec.protocol.toUpperCase()}
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
   - HTTPClient (ESP32용)
   - ArduinoJson
   ${spec.protocol === 'mqtt' ? '- PubSubClient (MQTT용)' : ''}

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
- **센서 토픽**: terahub/demo/esp32-xxx/sensors/bme280/temperature
- **액추에이터 토픽**: terahub/demo/esp32-xxx/actuators/relay1/set

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

        // 메인 코드 파일 생성 (기존 방식으로 임시 테스트)
        const code = generateSimpleCode(spec);
    
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
    
    // PlatformIO 설정 파일 추가
    const platformioContent = generatePlatformIOConfig(spec);
    zip.file('platformio.ini', platformioContent);
    
    // 안전 주의사항 포함 README 파일 추가 (임시 비활성화)
    // const readmeContent = codeGenerator.generateSafetyReadme();
    // zip.file('README.md', readmeContent);
    
    // 기존 README 파일 추가
    const readmeContent = generateSimpleReadme(spec);
    zip.file('README.md', readmeContent);
    
    console.log('📦 ZIP 파일 생성 중...');
    
    // NodeBuffer 대신 범용적인 uint8array로 생성
    const content = await zip.generateAsync({ type: 'uint8array' });
    
    console.log('📦 ZIP 파일 생성 완료, 크기:', content.byteLength, 'bytes');
    
    // ZIP 파일로 다운로드
    return new Response(content as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="iot_system_${spec.device}_${spec.protocol}.zip"`,
        'Content-Length': String(content.byteLength),
        'Cache-Control': 'no-store',
      },
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
  
  spec.controls.forEach((control, index) => {
    switch(control.type) {
      case 'WS2812B_NeoPixel':
        pins.push(`// WS2812B 핀: DATA=GPIO27 (레벨시프터 권장)`);
        break;
      case 'A4988_Stepper':
        pins.push(`// A4988 핀: STEP=GPIO33, DIR=GPIO32, EN=GPIO14`);
        break;
      case 'AC_Relay_Lamp':
        pins.push(`// 릴레이 핀: GPIO26 (외부 전원 필요)`);
        break;
    }
  });
  
  return pins.join('\n');
}

// 센서 초기화 코드 생성
function generateSensorInitialization(spec: SystemSpec): string {
  const initCode: string[] = [];
  
  spec.sensors.forEach((sensor, index) => {
    switch(sensor.type) {
      case 'BME280':
        initCode.push(`
  // BME280 초기화 (I2C 주소 자동 감지: 0x76 또는 0x77)
  if (!bme${index}.begin(0x76)) {
    if (!bme${index}.begin(0x77)) {
      Serial.println("BME280 초기화 실패!");
    } else {
      Serial.println("BME280 초기화 성공 (주소: 0x77)");
    }
  } else {
    Serial.println("BME280 초기화 성공 (주소: 0x76)");
  }`);
        break;
      case 'ENS160':
        initCode.push(`
  // ENS160 초기화 (I2C 주소 자동 감지: 0x52 또는 0x53)
  if (!ens160_${index}.begin(0x52)) {
    if (!ens160_${index}.begin(0x53)) {
      Serial.println("ENS160 초기화 실패!");
    } else {
      Serial.println("ENS160 초기화 성공 (주소: 0x53)");
    }
  } else {
    Serial.println("ENS160 초기화 성공 (주소: 0x52)");
  }`);
        break;
      case 'HC-SR04':
        initCode.push(`
  // HC-SR04 초기화 (TRIG/ECHO 핀 설정)
  pinMode(TRIG_PIN_${index}, OUTPUT);
  pinMode(ECHO_PIN_${index}, INPUT);
  Serial.println("HC-SR04 초기화 완료");`);
        break;
    }
  });
  
  spec.controls.forEach((control, index) => {
    switch(control.type) {
      case 'WS2812B_NeoPixel':
        initCode.push(`
  // WS2812B 초기화
  strip${index}.begin();
  strip${index}.show();
  Serial.println("WS2812B 초기화 완료");`);
        break;
      case 'A4988_Stepper':
        initCode.push(`
  // A4988 스테퍼 초기화
  pinMode(STEP_PIN_${index}, OUTPUT);
  pinMode(DIR_PIN_${index}, OUTPUT);
  pinMode(EN_PIN_${index}, OUTPUT);
  digitalWrite(EN_PIN_${index}, LOW);  // 활성화
  Serial.println("A4988 스테퍼 초기화 완료");`);
        break;
      case 'AC_Relay_Lamp':
        initCode.push(`
  // 릴레이 초기화
  pinMode(RELAY_PIN_${index}, OUTPUT);
  digitalWrite(RELAY_PIN_${index}, LOW);  // 초기값 OFF
  Serial.println("릴레이 초기화 완료");`);
        break;
    }
  });
  
  return initCode.join('');
}

// 센서 데이터 읽기 코드 생성
function generateSensorReading(spec: SystemSpec): string {
  const readingCode: string[] = [];
  
  spec.sensors.forEach((sensor, index) => {
    switch(sensor.type) {
      case 'BME280':
        readingCode.push(`
    // BME280 데이터 읽기
    float temp${index} = bme${index}.readTemperature();
    float hum${index} = bme${index}.readHumidity();
    float press${index} = bme${index}.readPressure() / 100.0;
    
    char tempStr[10], humStr[10], pressStr[10];
    dtostrf(temp${index}, 1, 2, tempStr);
    dtostrf(hum${index}, 1, 2, humStr);
    dtostrf(press${index}, 1, 2, pressStr);
    
    mqtt.publish((String(topicBase) + "/sensors/bme280_${index}/temperature").c_str(), tempStr, true);
    mqtt.publish((String(topicBase) + "/sensors/bme280_${index}/humidity").c_str(), humStr, true);
    mqtt.publish((String(topicBase) + "/sensors/bme280_${index}/pressure").c_str(), pressStr, true);`);
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

async function generateUniversalBridgeCode(spec: SystemSpec): Promise<string> {
  const { device, protocol, sensors, controls } = spec;
  const sensorTypes = sensors.map(s => s.type).join(', ');
  const actuatorTypes = controls.map(c => c.type).join(', ');

  // 안전문구 생성
  const safetyWarnings = generateSafetyWarnings(spec);
  
  // 토픽 규칙 적용
  const topicBase = `terahub/demo/${device}-${Math.random().toString(36).substr(2, 8)}`;

  return `/**
 * Universal Bridge 호환 IoT 시스템 코드
 * 디바이스: ${device.toUpperCase()}
 * 프로토콜: ${protocol.toUpperCase()}
 * 센서: ${sensorTypes}
 * 액추에이터: ${actuatorTypes}
 * 생성 시간: ${new Date().toISOString()}
 * 
 * ${safetyWarnings}
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
- **브로커 주소**: localhost:1883
- **토픽 규칙**: terahub/{tenant}/{deviceId}/{kind}/{name}
- **센서 토픽**: terahub/demo/esp32-xxx/sensors/bme280/temperature
- **액추에이터 토픽**: terahub/demo/esp32-xxx/actuators/relay1/set
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
