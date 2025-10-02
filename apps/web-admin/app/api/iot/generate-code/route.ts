// IoT 코드 생성 API 엔드포인트
import { NextRequest, NextResponse } from 'next/server';

// Edge 런타임 사용 (템플릿 조합만 하므로 빠르고 저렴)
export const runtime = 'edge';

interface GenerateCodeRequest {
  device: string;
  protocol: 'http' | 'mqtt' | 'websocket';
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  wifi: {
    ssid: string;
    password: string;
  };
  allocation?: any; // IoT Designer에서 전달되는 핀 할당 정보
  bridgeIntegration?: boolean; // Universal Bridge 연동 여부
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateCodeRequest = await request.json();
    
    // Universal Bridge 연동 여부 확인
    if (body.bridgeIntegration) {
      // Universal Bridge 연동 코드 생성
      const code = await generateUniversalBridgeCode(body);
      return new NextResponse(code, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="universal_bridge_system.ino"'
        }
      });
    } else {
      // 디바이스 타입에 따른 코드 생성
      const code = generateDeviceCode(body);
      const filename = getFilename(body.device, body.protocol);
      return new NextResponse(code, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }
  } catch (error) {
    console.error('코드 생성 오류:', error);
    return NextResponse.json(
      { error: '코드 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 파일명 생성 함수
function getFilename(device: string, protocol: string): string {
  const deviceMap: Record<string, string> = {
    'esp32': 'esp32',
    'esp8266': 'esp8266',
    'arduino': 'arduino',
    'raspberry-pi': 'rpi'
  };
  
  const protocolMap: Record<string, string> = {
    'mqtt': 'mqtt',
    'http': 'http',
    'websocket': 'ws',
    'lorawan': 'lorawan'
  };
  
  const deviceName = deviceMap[device] || device;
  const protocolName = protocolMap[protocol] || protocol;
  
  return `${deviceName}_${protocolName}_system.ino`;
}

// 디바이스별 코드 생성 함수
function generateDeviceCode(req: GenerateCodeRequest): string {
  const { device } = req;
  
  switch (device) {
    case 'esp32':
      return generateESP32Code(req);
    case 'esp8266':
      return generateESP8266Code(req);
    case 'arduino':
      return generateArduinoCode(req);
    case 'raspberry-pi':
      return generateRaspberryPiCode(req);
    default:
      return generateESP32Code(req); // 기본값
  }
}

function generateESP32Code(req: GenerateCodeRequest): string {
  const { device, protocol, sensors: sensorSpecs, controls: controlSpecs, wifi } = req;
  
  // ESP32용 헤더 생성
  const headers = [
    '// Auto-generated ESP32 code by IoT Designer',
    '#include <WiFi.h>',
    '#include <ArduinoJson.h>',
    protocol === 'mqtt' ? '#include <PubSubClient.h>' : '#include <HTTPClient.h>',
    '#include <WebServer.h>',
    ''
  ];
  
  // 센서별 include 및 정의
  const sensorIncludes = new Set<string>();
  const sensorDefines = new Set<string>();
  const sensorInit = new Set<string>();
  const sensorRead = new Set<string>();
  
  sensorSpecs.forEach(({ type, count }) => {
    switch (type) {
      case 'dht22':
        sensorIncludes.add('#include <DHT.h>');
        sensorDefines.add('#define DHT_PIN 4');
        sensorDefines.add('#define DHT_TYPE DHT22');
        sensorInit.add('DHT dht(DHT_PIN, DHT_TYPE);');
        sensorRead.add('float temperature = dht.readTemperature();');
        sensorRead.add('float humidity = dht.readHumidity();');
        break;
      case 'ds18b20':
        sensorIncludes.add('#include <OneWire.h>');
        sensorIncludes.add('#include <DallasTemperature.h>');
        sensorDefines.add('#define ONE_WIRE_BUS 5');
        sensorInit.add('OneWire oneWire(ONE_WIRE_BUS);');
        sensorInit.add('DallasTemperature tempSensor(&oneWire);');
        sensorRead.add('tempSensor.requestTemperatures();');
        sensorRead.add('float temp1 = tempSensor.getTempCByIndex(0);');
        break;
      case 'bh1750':
        sensorIncludes.add('#include <Wire.h>');
        sensorIncludes.add('#include <BH1750.h>');
        sensorInit.add('BH1750 lightMeter;');
        sensorRead.add('float lux = lightMeter.readLightLevel();');
        break;
      case 'soil_moisture':
        sensorDefines.add('#define SOIL_PIN A0');
        sensorRead.add('int soilMoisture = analogRead(SOIL_PIN);');
        break;
      case 'ph_sensor':
        sensorDefines.add('#define PH_PIN A1');
        sensorRead.add('int phValue = analogRead(PH_PIN);');
        break;
    }
  });
  
  // 제어별 정의
  const controlDefines = new Set<string>();
  const controlInit = new Set<string>();
  
  controlSpecs.forEach(({ type, count }) => {
    switch (type) {
      case 'relay':
        controlDefines.add('#define RELAY_PIN 12');
        controlInit.add('pinMode(RELAY_PIN, OUTPUT);');
        break;
      case 'dc_fan_pwm':
        controlDefines.add('#define FAN_PIN 18');
        controlInit.add('pinMode(FAN_PIN, OUTPUT);');
        break;
      case 'servo':
        sensorIncludes.add('#include <Servo.h>');
        controlDefines.add('#define SERVO_PIN 19');
        controlInit.add('Servo servo;');
        controlInit.add('servo.attach(SERVO_PIN);');
        break;
      case 'led_strip':
        controlDefines.add('#define LED_PIN 20');
        controlInit.add('pinMode(LED_PIN, OUTPUT);');
        break;
    }
  });
  
  // WiFi 설정
  const wifiConfig = [
    '// WiFi 설정',
    `const char* ssid = "${wifi.ssid || 'YOUR_WIFI_SSID'}";`,
    `const char* password = "${wifi.password || 'YOUR_WIFI_PASSWORD'}";`,
    '',
    '// 서버 설정',
    protocol === 'http' 
      ? 'const char* serverUrl = "http://your-server.com/api/bridge/telemetry";'
      : 'const char* mqttServer = "your-mqtt-broker.com";',
    'const int serverPort = ' + (protocol === 'http' ? '80' : '1883') + ';',
    ''
  ];
  
  // 전역 변수
  const globalVars = [
    '// 전역 변수',
    'unsigned long lastSend = 0;',
    'const unsigned long sendInterval = 5000; // 5초마다 전송',
    ''
  ];
  
  // setup 함수
  const setupFunction = [
    'void setup() {',
    '  Serial.begin(115200);',
    '  ',
    '  // WiFi 연결',
    '  WiFi.begin(ssid, password);',
    '  while (WiFi.status() != WL_CONNECTED) {',
    '    delay(1000);',
    '    Serial.println("WiFi 연결 중...");',
    '  }',
    '  Serial.println("WiFi 연결됨");',
    '  Serial.print("IP 주소: ");',
    '  Serial.println(WiFi.localIP());',
    '  ',
    '  // 센서 초기화',
    ...Array.from(sensorInit).map(line => '  ' + line),
    '  ',
    '  // 제어 초기화',
    ...Array.from(controlInit).map(line => '  ' + line),
    '}',
    ''
  ];
  
  // loop 함수
  const loopFunction = [
    'void loop() {',
    '  unsigned long currentTime = millis();',
    '  ',
    '  if (currentTime - lastSend >= sendInterval) {',
    '    // 센서 읽기',
    ...Array.from(sensorRead).map(line => '    ' + line),
    '    ',
    '    // 데이터 전송',
    '    sendSensorData();',
    '    ',
    '    lastSend = currentTime;',
    '  }',
    '  ',
    '  // 명령 수신 처리',
    '  handleCommands();',
    '  ',
    '  delay(100);',
    '}',
    ''
  ];
  
  // 데이터 전송 함수
  const sendDataFunction = [
    'void sendSensorData() {',
    '  DynamicJsonDocument doc(1024);',
    '  ',
    '  // 센서 데이터 추가',
    ...sensorSpecs.map(({ type }) => {
      switch (type) {
        case 'dht22':
          return '  doc["temperature"] = temperature;\n  doc["humidity"] = humidity;';
        case 'ds18b20':
          return '  doc["temperature"] = temp1;';
        case 'bh1750':
          return '  doc["light"] = lux;';
        case 'soil_moisture':
          return '  doc["soil_moisture"] = soilMoisture;';
        case 'ph_sensor':
          return '  doc["ph"] = phValue;';
        default:
          return '';
      }
    }).filter(Boolean),
    '  ',
    '  // 타임스탬프 추가',
    '  doc["timestamp"] = millis();',
    '  ',
    protocol === 'http' 
      ? [
          '  // HTTP 전송',
          '  HTTPClient http;',
          '  http.begin(serverUrl);',
          '  http.addHeader("Content-Type", "application/json");',
          '  ',
          '  String jsonString;',
          '  serializeJson(doc, jsonString);',
          '  ',
          '  int httpResponseCode = http.POST(jsonString);',
          '  if (httpResponseCode > 0) {',
          '    Serial.println("데이터 전송 성공");',
          '  } else {',
          '    Serial.println("데이터 전송 실패");',
          '  }',
          '  http.end();'
        ]
      : [
          '  // MQTT 전송',
          '  if (mqttClient.connected()) {',
          '    String jsonString;',
          '    serializeJson(doc, jsonString);',
          '    mqttClient.publish("sensors/data", jsonString.c_str());',
          '  }'
        ],
    '}',
    ''
  ];
  
  // 명령 처리 함수
  const handleCommandsFunction = [
    'void handleCommands() {',
    '  // 명령 수신 처리 (HTTP 또는 MQTT)',
    '  // TODO: 명령 파싱 및 제어 실행',
    '}',
    ''
  ];
  
  // 전체 코드 조합
  const fullCode = [
    ...headers,
    ...Array.from(sensorIncludes),
    ...Array.from(sensorDefines),
    ...Array.from(controlDefines),
    ...wifiConfig,
    ...globalVars,
    ...setupFunction,
    ...loopFunction,
    ...sendDataFunction,
    ...handleCommandsFunction
  ].join('\n');
  
  return fullCode;
}

// Universal Bridge 연동 코드 생성
async function generateUniversalBridgeCode(req: GenerateCodeRequest): Promise<string> {
  const { device, protocol, sensors, controls, wifi, allocation } = req;
  
  // Universal Bridge Setup Token 발급
  const bridgeUrl = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:8080';
  
  try {
    const claimResponse = await fetch(`${bridgeUrl}/api/provisioning/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: '00000000-0000-0000-0000-000000000001',
        farm_id: '1737f01f-da95-4438-bc90-4705cdfc09e8',
        ttl_seconds: 600,
      }),
    });

    if (!claimResponse.ok) {
      throw new Error('Setup Token 발급 실패');
    }

    const claimData = await claimResponse.json();
    const setupToken = claimData.setup_token;
    
    // Universal Bridge 호환 코드 생성
    return generateUniversalBridgeArduinoCode({
      device,
      protocol,
      sensors,
      controls,
      wifi,
      allocation,
      setupToken,
      bridgeUrl
    });
    
  } catch (error) {
    console.error('Universal Bridge 코드 생성 오류:', error);
    // 폴백: 기존 방식으로 코드 생성
    return generateArduinoCode(req);
  }
}

// Universal Bridge 호환 Arduino 코드 생성
function generateUniversalBridgeArduinoCode(params: {
  device: string;
  protocol: string;
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  wifi: { ssid: string; password: string };
  allocation?: any;
  setupToken: string;
  bridgeUrl: string;
}): string {
  const { device, protocol, sensors, controls, wifi, allocation, setupToken, bridgeUrl } = params;
  
  // 센서 및 액추에이터 정보 수집
  const sensorTypes = sensors.map(s => s.type).join(', ');
  const actuatorTypes = controls.map(c => c.type).join(', ');
  
  return `/**
 * Universal Bridge 호환 IoT 시스템 코드
 * 
 * 설계 사양:
 * - 디바이스: ${device.toUpperCase()}
 * - 프로토콜: ${protocol.toUpperCase()}
 * - 센서: ${sensorTypes}
 * - 액추에이터: ${actuatorTypes}
 * - WiFi: ${wifi.ssid}
 * 
 * 생성 시간: ${new Date().toISOString()}
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi 설정 (보안을 위해 직접 입력하세요)
const char* ssid = "YOUR_WIFI_SSID";        // WiFi 네트워크 이름을 입력하세요
const char* password = "YOUR_WIFI_PASSWORD"; // WiFi 비밀번호를 입력하세요

// Universal Bridge 설정
const char* serverUrl = "${bridgeUrl}";
const char* setupToken = "${setupToken}";
String deviceId = "";
String deviceKey = "";

// 센서 핀 설정
${generateSensorPinConfig(sensors, allocation)}

// 액추에이터 핀 설정
${generateActuatorPinConfig(controls, allocation)}

void setup() {
  Serial.begin(115200);
  Serial.println("🌱 Universal Bridge IoT 시스템 시작");
  
  // 센서 초기화
  ${generateSensorInit(sensors)}
  
  // 액추에이터 초기화
  ${generateActuatorInit(controls)}
  
  // WiFi 연결
  connectToWiFi();
  
  // Universal Bridge 디바이스 등록
  if (WiFi.status() == WL_CONNECTED) {
    registerDevice();
  }
}

void loop() {
  // 센서 데이터 읽기 및 전송
  sendTelemetry();
  
  // 명령 확인 및 처리
  checkCommands();
  
  delay(10000); // 10초마다 실행
}

void connectToWiFi() {
  Serial.print("WiFi 연결 중");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi 연결 성공!");
    Serial.print("IP 주소: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("❌ WiFi 연결 실패");
  }
}

void registerDevice() {
  Serial.println("📝 Universal Bridge 디바이스 등록 중...");
  
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/provisioning/bind");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-setup-token", setupToken);
  
  DynamicJsonDocument doc(1024);
  doc["device_id"] = "ESP32-" + WiFi.macAddress();
  doc["device_type"] = "${device}-${protocol}";
  doc["capabilities"] = {
    "sensors": ${JSON.stringify(sensors.map(s => s.type))},
    "actuators": ${JSON.stringify(controls.map(c => c.type))}
  };
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("✅ 디바이스 등록 성공!");
    
    // 응답에서 device_key 추출
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    deviceKey = responseDoc["device_key"].as<String>();
    deviceId = doc["device_id"].as<String>();
    
    Serial.println("Device ID: " + deviceId);
    Serial.println("Device Key: " + deviceKey);
  } else {
    Serial.println("❌ 등록 실패: " + String(httpCode));
  }
  http.end();
}

void sendTelemetry() {
  if (deviceId == "" || deviceKey == "") return;
  
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/bridge/telemetry");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", deviceId);
  http.addHeader("x-tenant-id", "00000000-0000-0000-0000-000000000001");
  
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["timestamp"] = millis();
  
  JsonArray readings = doc.createNestedArray("readings");
  
  // 센서 데이터 수집
  ${generateSensorReadings(sensors)}
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    Serial.println("📡 텔레메트리 전송 성공");
  } else {
    Serial.println("❌ 텔레메트리 전송 실패: " + String(httpCode));
  }
  http.end();
}

void checkCommands() {
  if (deviceId == "" || deviceKey == "") return;
  
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/bridge/commands/" + deviceId);
  http.addHeader("x-device-id", deviceId);
  http.addHeader("x-tenant-id", "00000000-0000-0000-0000-000000000001");
  
  int httpCode = http.GET();
  if (httpCode == 200) {
    String response = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);
    
    JsonArray commands = doc["commands"];
    for (JsonObject cmd : commands) {
      processCommand(cmd);
    }
  }
  http.end();
}

void processCommand(JsonObject command) {
  String type = command["type"];
  String action = command["action"];
  
  Serial.println("🎯 명령 수신: " + type + " -> " + action);
  
  // 액추에이터 제어
  ${generateActuatorControl(controls)}
  
  // ACK 전송
  sendCommandAck(command["id"].as<String>(), true);
}

void sendCommandAck(String commandId, bool success) {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/bridge/commands/" + commandId + "/ack");
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["status"] = success ? "success" : "error";
  doc["detail"] = success ? "Command executed" : "Command failed";
  
  String payload;
  serializeJson(doc, payload);
  
  http.POST(payload);
  http.end();
}

// 센서별 핀 설정 생성
${generateSensorFunctions(sensors)}

// 액추에이터별 제어 함수 생성
${generateActuatorFunctions(controls)}
`;
}

// 헬퍼 함수들
function generateSensorPinConfig(sensors: Array<{ type: string; count: number }>, allocation?: any): string {
  let config = "";
  sensors.forEach((sensor, index) => {
    const pin = allocation?.assigned?.[`sensor_${sensor.type}`]?.[0]?.pin || `GPIO${4 + index}`;
    config += `#define ${sensor.type.toUpperCase()}_PIN ${pin}\n`;
  });
  return config;
}

function generateActuatorPinConfig(controls: Array<{ type: string; count: number }>, allocation?: any): string {
  let config = "";
  controls.forEach((control, index) => {
    const pin = allocation?.assigned?.[`control_${control.type}`]?.[0]?.pin || `GPIO${10 + index}`;
    config += `#define ${control.type.toUpperCase()}_PIN ${pin}\n`;
  });
  return config;
}

function generateSensorInit(sensors: Array<{ type: string; count: number }>): string {
  let init = "";
  sensors.forEach(sensor => {
    if (sensor.type === 'dht22') {
      init += `  // DHT22 초기화\n`;
    } else if (sensor.type === 'ds18b20') {
      init += `  // DS18B20 초기화\n`;
    }
  });
  return init;
}

function generateActuatorInit(controls: Array<{ type: string; count: number }>): string {
  let init = "";
  controls.forEach(control => {
    init += `  pinMode(${control.type.toUpperCase()}_PIN, OUTPUT);\n`;
    init += `  digitalWrite(${control.type.toUpperCase()}_PIN, LOW); // 초기 상태 OFF\n`;
  });
  return init;
}

function generateSensorReadings(sensors: Array<{ type: string; count: number }>): string {
  let readings = "";
  sensors.forEach(sensor => {
    if (sensor.type === 'dht22') {
      readings += `  // DHT22 온습도 센서\n`;
      readings += `  float temperature = readDHT22Temperature();\n`;
      readings += `  float humidity = readDHT22Humidity();\n`;
      readings += `  readings.add(JsonObject{{"key", "temperature"}, {"value", temperature}, {"unit", "°C"}, {"ts", millis()}});\n`;
      readings += `  readings.add(JsonObject{{"key", "humidity"}, {"value", humidity}, {"unit", "%"}, {"ts", millis()}});\n`;
    } else if (sensor.type === 'ds18b20') {
      readings += `  // DS18B20 온도 센서\n`;
      readings += `  float temperature = readDS18B20();\n`;
      readings += `  readings.add(JsonObject{{"key", "temperature"}, {"value", temperature}, {"unit", "°C"}, {"ts", millis()}});\n`;
    }
  });
  return readings;
}

function generateActuatorControl(controls: Array<{ type: string; count: number }>): string {
  let control = "";
  controls.forEach(control => {
    control += `  if (type == "${control.type}") {\n`;
    control += `    if (action == "on") {\n`;
    control += `      digitalWrite(${control.type.toUpperCase()}_PIN, HIGH);\n`;
    control += `    } else if (action == "off") {\n`;
    control += `      digitalWrite(${control.type.toUpperCase()}_PIN, LOW);\n`;
    control += `    }\n`;
    control += `  }\n`;
  });
  return control;
}

function generateSensorFunctions(sensors: Array<{ type: string; count: number }>): string {
  let functions = "";
  sensors.forEach(sensor => {
    if (sensor.type === 'dht22') {
      functions += `float readDHT22Temperature() {\n`;
      functions += `  // TODO: DHT22 온도 읽기 구현\n`;
      functions += `  return 25.0; // 임시 값\n`;
      functions += `}\n\n`;
      functions += `float readDHT22Humidity() {\n`;
      functions += `  // TODO: DHT22 습도 읽기 구현\n`;
      functions += `  return 60.0; // 임시 값\n`;
      functions += `}\n\n`;
    } else if (sensor.type === 'ds18b20') {
      functions += `float readDS18B20() {\n`;
      functions += `  // TODO: DS18B20 온도 읽기 구현\n`;
      functions += `  return 24.5; // 임시 값\n`;
      functions += `}\n\n`;
    }
  });
  return functions;
}

function generateActuatorFunctions(controls: Array<{ type: string; count: number }>): string {
  let functions = "";
  controls.forEach(control => {
    functions += `void control${control.type.charAt(0).toUpperCase() + control.type.slice(1)}(bool state) {\n`;
    functions += `  digitalWrite(${control.type.toUpperCase()}_PIN, state ? HIGH : LOW);\n`;
    functions += `  Serial.println("${control.type} " + (state ? "ON" : "OFF"));\n`;
    functions += `}\n\n`;
  });
  return functions;
}

// ESP8266용 코드 생성 함수
function generateESP8266Code(req: GenerateCodeRequest): string {
  const { device, protocol, sensors: sensorSpecs, controls: controlSpecs, wifi } = req;
  
  // ESP8266용 헤더 생성 (ESP8266은 ESP32와 비슷하지만 일부 라이브러리 다름)
  const headers = [
    '// Auto-generated ESP8266 code by IoT Designer',
    '#include <ESP8266WiFi.h>',
    '#include <ArduinoJson.h>',
    protocol === 'mqtt' ? '#include <PubSubClient.h>' : '#include <ESP8266HTTPClient.h>',
    '#include <ESP8266WebServer.h>',
    ''
  ];
  
  // ESP32 코드를 기반으로 하되 ESP8266용으로 수정
  return generateESP32Code(req)
    .replace('// Auto-generated ESP32 code by IoT Designer', '// Auto-generated ESP8266 code by IoT Designer')
    .replace('#include <WiFi.h>', '#include <ESP8266WiFi.h>')
    .replace('#include <HTTPClient.h>', '#include <ESP8266HTTPClient.h>')
    .replace('#include <WebServer.h>', '#include <ESP8266WebServer.h>');
}

// Arduino용 코드 생성 함수
function generateArduinoCode(req: GenerateCodeRequest): string {
  const { device, protocol, sensors: sensorSpecs, controls: controlSpecs, wifi } = req;
  
  // Arduino용 헤더 생성
  const headers = [
    '// Auto-generated Arduino code by IoT Designer',
    '#include <WiFi.h>',
    '#include <ArduinoJson.h>',
    protocol === 'mqtt' ? '#include <PubSubClient.h>' : '#include <HTTPClient.h>',
    '#include <WebServer.h>',
    ''
  ];
  
  // 나머지는 ESP32와 동일하지만 주석만 다름
  return generateESP32Code(req).replace(
    '// Auto-generated ESP32 code by IoT Designer',
    '// Auto-generated Arduino code by IoT Designer'
  );
}

// Raspberry Pi용 코드 생성 함수 (Python)
function generateRaspberryPiCode(req: GenerateCodeRequest): string {
  const { device, protocol, sensors: sensorSpecs, controls: controlSpecs, wifi } = req;
  
  return `#!/usr/bin/env python3
# Auto-generated Raspberry Pi code by IoT Designer
# Device: ${device}, Protocol: ${protocol}

import json
import time
import requests
from datetime import datetime

# WiFi 설정
WIFI_SSID = "${wifi.ssid}"
WIFI_PASSWORD = "${wifi.password}"

# 센서 설정
SENSORS = ${JSON.stringify(sensorSpecs)}

# 제어장치 설정  
CONTROLS = ${JSON.stringify(controlSpecs)}

def main():
    print("Raspberry Pi IoT System Starting...")
    # TODO: 실제 구현 필요
    
if __name__ == "__main__":
    main()
`;
}
