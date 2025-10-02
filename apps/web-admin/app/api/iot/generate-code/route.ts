// IoT 디바이스 코드 자동 생성 API
import { NextRequest, NextResponse } from 'next/server';
import { sensors, controls, devicePinmaps } from '@/lib/iot-templates/index';

interface SystemSpec {
  device: string;
  protocol: 'http' | 'mqtt' | 'websocket' | 'webhook' | 'serial' | 'ble' | 'rs485' | 'modbus-tcp' | 'lorawan';
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  wifi: {
    ssid: string;
    password: string;
  };
  allocation?: any; // IoT Designer에서 전달되는 핀 할당 정보
  bridgeIntegration?: boolean; // Universal Bridge 연동 여부
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
    const spec: SystemSpec = await request.json();
    
    // Universal Bridge 연동 여부 확인
    if (spec.bridgeIntegration) {
      // Universal Bridge 연동 코드 생성
      const code = await generateUniversalBridgeCode(spec);
      return new NextResponse(code, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="universal_bridge_system.ino"'
        }
      });
    } else {
      // 디바이스 타입에 따른 코드 생성
      const code = generateDeviceCode(spec);
      const filename = getFilename(body.device, body.protocol);
      return new NextResponse(code, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }
=======
    if (!spec || !spec.device || !spec.protocol) {
      return NextResponse.json({ error: '필수 설정이 누락되었습니다' }, { status: 400 });
    }

    const generatedCode = generateArduinoCode(spec);
    
    return new NextResponse(generatedCode, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="iot_device_${spec.device}_${spec.protocol}.ino"`
      }
    });
>>>>>>> dc17f9bdf342b9bb54af2c88a33587ba61dacf39
  } catch (error) {
    console.error('코드 생성 오류:', error);
    return NextResponse.json({ error: '코드 생성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

<<<<<<< HEAD
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
=======
function generateArduinoCode(spec: SystemSpec): string {
  let code = '';
  
  // 헤더 및 라이브러리
  code += generateHeaders(spec);
  code += '\n';
>>>>>>> dc17f9bdf342b9bb54af2c88a33587ba61dacf39
  
  // 상수 정의
  code += generateConstants(spec);
  code += '\n';
  
  // 객체 선언
  code += generateObjectDeclarations(spec);
  code += '\n';
  
  // 전송 어댑터 설정
  code += generateTransportSetup(spec);
  code += '\n';
  
  // 센서 초기화
  code += generateSensorSetup(spec);
  code += '\n';
  
  // 제어 초기화
  code += generateControlSetup(spec);
  code += '\n';
  
  // setup() 함수
  code += generateSetupFunction(spec);
  code += '\n';
  
  // loop() 함수
  code += generateLoopFunction(spec);
  code += '\n';
  
  // 헬퍼 함수들
  code += generateHelperFunctions(spec);
  
  return code;
}

function generateHeaders(spec: SystemSpec): string {
  let headers = '// IoT Designer 자동 생성 코드\n';
  headers += `// 생성 시간: ${new Date().toLocaleString()}\n`;
  headers += `// 디바이스: ${spec.device}\n`;
  headers += `// 프로토콜: ${spec.protocol}\n\n`;
  
  // 기본 라이브러리
  if (spec.protocol === 'http' || spec.protocol === 'mqtt' || spec.protocol === 'websocket' || spec.protocol === 'modbus-tcp') {
    headers += '#include <WiFi.h>\n';
    headers += '#include <HTTPClient.h>\n';
    headers += '#include <ArduinoJson.h>\n';
  }
  
  if (spec.protocol === 'mqtt') {
    headers += '#include <PubSubClient.h>\n';
  }
  
  if (spec.protocol === 'websocket') {
    headers += '#include <WebSocketsClient.h>\n';
  }
  
  if (spec.protocol === 'rs485' || spec.protocol === 'modbus-tcp') {
    headers += '#include <ModbusMaster.h>\n';
  }
  
  // 센서별 라이브러리
  spec.sensors.forEach(({ type }) => {
    const sensor = sensors.find(s => s.type === type);
    if (sensor) {
      if (type === 'dht22') {
        headers += '#include <DHT.h>\n';
      } else if (type === 'ds18b20') {
        headers += '#include <OneWire.h>\n';
        headers += '#include <DallasTemperature.h>\n';
      } else if (type === 'bh1750') {
        headers += '#include <Wire.h>\n';
        headers += '#include <BH1750.h>\n';
      }
    }
  });
  
  return headers;
}

function generateConstants(spec: SystemSpec): string {
  let constants = '// 상수 정의\n';
  
  // WiFi 설정
  if (spec.protocol === 'http' || spec.protocol === 'mqtt' || spec.protocol === 'websocket' || spec.protocol === 'modbus-tcp') {
    constants += `const char* WIFI_SSID = "${spec.wifi.ssid}";\n`;
    constants += `const char* WIFI_PASSWORD = "${spec.wifi.password}";\n`;
  }
  
  // 프로토콜별 설정
  switch (spec.protocol) {
    case 'http':
      constants += 'const char* SERVER_URL = "http://your-bridge-url/api/bridge";\n';
      constants += 'const char* DEVICE_ID = "ESP32_001";\n';
      break;
    case 'mqtt':
      constants += 'const char* MQTT_SERVER = "your-mqtt-broker";\n';
      constants += 'const int MQTT_PORT = 1883;\n';
      constants += 'const char* MQTT_USER = "username";\n';
      constants += 'const char* MQTT_PASSWORD = "password";\n';
      constants += 'const char* MQTT_TOPIC_TELEMETRY = "farm/001/telemetry";\n';
      constants += 'const char* MQTT_TOPIC_COMMANDS = "farm/001/commands";\n';
      break;
    case 'modbus-tcp':
      if (spec.modbusConfig) {
        constants += `const char* MODBUS_HOST = "${spec.modbusConfig.host}";\n`;
        constants += `const int MODBUS_PORT = ${spec.modbusConfig.port};\n`;
        constants += `const int MODBUS_UNIT_ID = ${spec.modbusConfig.unitId};\n`;
      }
      break;
  }
  
  constants += '\n';
  
  // 센서 핀 정의
  let pinCounter = 2;
  spec.sensors.forEach(({ type, count }) => {
    const sensor = sensors.find(s => s.type === type);
    if (sensor) {
      for (let i = 0; i < count; i++) {
        if (type === 'dht22') {
          constants += `#define DHT${i + 1}_PIN ${pinCounter}\n`;
          pinCounter++;
        } else if (type === 'ds18b20') {
          constants += `#define DS18B20${i + 1}_PIN ${pinCounter}\n`;
          pinCounter++;
        } else if (type === 'soil_moisture') {
          constants += `#define SOIL_MOISTURE${i + 1}_PIN A${i}\n`;
        } else if (type === 'bh1750') {
          constants += `// BH1750${i + 1} - I2C 통신 (SDA: 21, SCL: 22)\n`;
        }
      }
    }
  });
  
  // 제어 핀 정의
  spec.controls.forEach(({ type, count }) => {
    for (let i = 0; i < count; i++) {
      if (type === 'relay') {
        constants += `#define RELAY${i + 1}_PIN ${pinCounter}\n`;
        pinCounter++;
      } else if (type === 'dc_fan_pwm') {
        constants += `#define FAN${i + 1}_PIN ${pinCounter}\n`;
        pinCounter++;
      } else if (type === 'led_strip') {
        constants += `#define LED_STRIP${i + 1}_PIN ${pinCounter}\n`;
        pinCounter++;
      }
    }
  });
  
  return constants;
}

function generateObjectDeclarations(spec: SystemSpec): string {
  let objects = '// 객체 선언\n';
  
  // 센서 객체
  spec.sensors.forEach(({ type, count }) => {
    if (type === 'dht22') {
      for (let i = 0; i < count; i++) {
        objects += `DHT dht${i + 1}(DHT${i + 1}_PIN, DHT22);\n`;
      }
    } else if (type === 'ds18b20') {
      for (let i = 0; i < count; i++) {
        objects += `OneWire oneWire${i + 1}(DS18B20${i + 1}_PIN);\n`;
        objects += `DallasTemperature sensors${i + 1}(&oneWire${i + 1});\n`;
      }
    } else if (type === 'bh1750') {
      for (let i = 0; i < count; i++) {
        objects += `BH1750 lightMeter${i + 1};\n`;
      }
    }
  });
  
  // 통신 객체
  if (spec.protocol === 'mqtt') {
    objects += 'WiFiClient wifiClient;\n';
    objects += 'PubSubClient mqttClient(wifiClient);\n';
  } else if (spec.protocol === 'websocket') {
    objects += 'WebSocketsClient webSocket;\n';
  } else if (spec.protocol === 'rs485' || spec.protocol === 'modbus-tcp') {
    objects += 'ModbusMaster node;\n';
  }
  
  return objects;
}

function generateTransportSetup(spec: SystemSpec): string {
  let setup = '// 통신 설정 함수\n';
  
  switch (spec.protocol) {
    case 'http':
      setup += 'void setupWiFi() {\n';
      setup += '  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);\n';
      setup += '  while (WiFi.status() != WL_CONNECTED) {\n';
      setup += '    delay(1000);\n';
      setup += '    Serial.println("WiFi 연결 중...");\n';
      setup += '  }\n';
      setup += '  Serial.println("WiFi 연결됨");\n';
      setup += '  Serial.print("IP 주소: ");\n';
      setup += '  Serial.println(WiFi.localIP());\n';
      setup += '}\n\n';
      break;
      
    case 'mqtt':
      setup += 'void setupWiFi() {\n';
      setup += '  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);\n';
      setup += '  while (WiFi.status() != WL_CONNECTED) {\n';
      setup += '    delay(1000);\n';
      setup += '    Serial.println("WiFi 연결 중...");\n';
      setup += '  }\n';
      setup += '  Serial.println("WiFi 연결됨");\n';
      setup += '}\n\n';
      
      setup += 'void setupMQTT() {\n';
      setup += '  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);\n';
      setup += '  mqttClient.setCallback(onMqttMessage);\n';
      setup += '  \n';
      setup += '  while (!mqttClient.connected()) {\n';
      setup += '    if (mqttClient.connect(DEVICE_ID, MQTT_USER, MQTT_PASSWORD)) {\n';
      setup += '      Serial.println("MQTT 연결됨");\n';
      setup += '      mqttClient.subscribe(MQTT_TOPIC_COMMANDS);\n';
      setup += '    } else {\n';
      setup += '      Serial.print("MQTT 연결 실패, rc=");\n';
      setup += '      Serial.print(mqttClient.state());\n';
      setup += '      Serial.println(" 5초 후 재시도");\n';
      setup += '      delay(5000);\n';
      setup += '    }\n';
      setup += '  }\n';
      setup += '}\n\n';
      break;
  }
  
  return setup;
}

function generateSensorSetup(spec: SystemSpec): string {
  let setup = '// 센서 초기화\n';
  setup += 'void setupSensors() {\n';
  
  spec.sensors.forEach(({ type, count }) => {
    if (type === 'dht22') {
      for (let i = 0; i < count; i++) {
        setup += `  dht${i + 1}.begin();\n`;
      }
    } else if (type === 'ds18b20') {
      for (let i = 0; i < count; i++) {
        setup += `  sensors${i + 1}.begin();\n`;
      }
    } else if (type === 'bh1750') {
      setup += '  Wire.begin();\n';
      for (let i = 0; i < count; i++) {
        setup += `  lightMeter${i + 1}.begin();\n`;
      }
    }
  });
  
  setup += '}\n\n';
  return setup;
}

function generateControlSetup(spec: SystemSpec): string {
  let setup = '// 제어 장치 초기화\n';
  setup += 'void setupControls() {\n';
  
  spec.controls.forEach(({ type, count }) => {
    for (let i = 0; i < count; i++) {
      if (type === 'relay') {
        setup += `  pinMode(RELAY${i + 1}_PIN, OUTPUT);\n`;
        setup += `  digitalWrite(RELAY${i + 1}_PIN, LOW);\n`;
      } else if (type === 'dc_fan_pwm') {
        setup += `  pinMode(FAN${i + 1}_PIN, OUTPUT);\n`;
        setup += `  analogWrite(FAN${i + 1}_PIN, 0);\n`;
      } else if (type === 'led_strip') {
        setup += `  pinMode(LED_STRIP${i + 1}_PIN, OUTPUT);\n`;
        setup += `  analogWrite(LED_STRIP${i + 1}_PIN, 0);\n`;
      }
    }
  });
  
  setup += '}\n\n';
  return setup;
}

function generateSetupFunction(spec: SystemSpec): string {
  let setup = 'void setup() {\n';
  setup += '  Serial.begin(9600);\n';
  setup += '  delay(1000);\n\n';
  
  // WiFi 설정
  if (spec.protocol === 'http' || spec.protocol === 'mqtt' || spec.protocol === 'websocket' || spec.protocol === 'modbus-tcp') {
    setup += '  setupWiFi();\n';
  }
  
  // 프로토콜별 설정
  if (spec.protocol === 'mqtt') {
    setup += '  setupMQTT();\n';
  }
  
  // 센서 및 제어 초기화
  setup += '  setupSensors();\n';
  setup += '  setupControls();\n';
  
  setup += '  \n';
  setup += '  Serial.println("시스템 초기화 완료");\n';
  setup += '}\n\n';
  
  return setup;
}

function generateLoopFunction(spec: SystemSpec): string {
  let loop = 'void loop() {\n';
  
  // 센서 데이터 읽기
  loop += '  // 센서 데이터 읽기\n';
  loop += '  DynamicJsonDocument doc(1024);\n';
  loop += '  doc["device_id"] = DEVICE_ID;\n';
  loop += '  doc["timestamp"] = millis();\n\n';
  
  spec.sensors.forEach(({ type, count }) => {
    if (type === 'dht22') {
      for (let i = 0; i < count; i++) {
        loop += `  float temp${i + 1} = dht${i + 1}.readTemperature();\n`;
        loop += `  float hum${i + 1} = dht${i + 1}.readHumidity();\n`;
        loop += `  doc["temp${i + 1}"] = temp${i + 1};\n`;
        loop += `  doc["hum${i + 1}"] = hum${i + 1};\n\n`;
      }
    } else if (type === 'ds18b20') {
      for (let i = 0; i < count; i++) {
        loop += `  sensors${i + 1}.requestTemperatures();\n`;
        loop += `  float water_temp${i + 1} = sensors${i + 1}.getTempCByIndex(0);\n`;
        loop += `  doc["water_temp${i + 1}"] = water_temp${i + 1};\n\n`;
      }
    } else if (type === 'soil_moisture') {
      for (let i = 0; i < count; i++) {
        loop += `  int soil_moisture${i + 1} = analogRead(SOIL_MOISTURE${i + 1}_PIN);\n`;
        loop += `  doc["soil_moisture${i + 1}"] = soil_moisture${i + 1};\n\n`;
      }
    } else if (type === 'bh1750') {
      for (let i = 0; i < count; i++) {
        loop += `  float lux${i + 1} = lightMeter${i + 1}.readLightLevel();\n`;
        loop += `  doc["lux${i + 1}"] = lux${i + 1};\n\n`;
      }
    }
  });
  
  // 데이터 전송
  loop += '  // 데이터 전송\n';
  switch (spec.protocol) {
    case 'http':
      loop += '  sendHttpData(doc);\n';
      break;
    case 'mqtt':
      loop += '  sendMqttData(doc);\n';
      break;
    case 'rs485':
      loop += '  sendModbusData(doc);\n';
      break;
  }
  
  loop += '\n';
  loop += '  delay(5000); // 5초 대기\n';
  loop += '}\n\n';
  
  return loop;
}

function generateHelperFunctions(spec: SystemSpec): string {
  let functions = '// 헬퍼 함수들\n\n';
  
  // HTTP 전송 함수
  if (spec.protocol === 'http') {
    functions += 'void sendHttpData(DynamicJsonDocument& doc) {\n';
    functions += '  if (WiFi.status() == WL_CONNECTED) {\n';
    functions += '    HTTPClient http;\n';
    functions += '    http.begin(SERVER_URL + "/telemetry");\n';
    functions += '    http.addHeader("Content-Type", "application/json");\n';
    functions += '    \n';
    functions += '    String payload;\n';
    functions += '    serializeJson(doc, payload);\n';
    functions += '    \n';
    functions += '    int httpResponseCode = http.POST(payload);\n';
    functions += '    if (httpResponseCode > 0) {\n';
    functions += '      String response = http.getString();\n';
    functions += '      Serial.println(httpResponseCode);\n';
    functions += '      Serial.println(response);\n';
    functions += '    } else {\n';
    functions += '      Serial.print("HTTP 오류: ");\n';
    functions += '      Serial.println(httpResponseCode);\n';
    functions += '    }\n';
    functions += '    http.end();\n';
    functions += '  }\n';
    functions += '}\n\n';
  }
  
  // MQTT 전송 함수
  if (spec.protocol === 'mqtt') {
    functions += 'void sendMqttData(DynamicJsonDocument& doc) {\n';
    functions += '  if (mqttClient.connected()) {\n';
    functions += '    String payload;\n';
    functions += '    serializeJson(doc, payload);\n';
    functions += '    \n';
    functions += '    if (mqttClient.publish(MQTT_TOPIC_TELEMETRY, payload.c_str())) {\n';
    functions += '      Serial.println("MQTT 데이터 전송 성공");\n';
    functions += '    } else {\n';
    functions += '      Serial.println("MQTT 데이터 전송 실패");\n';
    functions += '    }\n';
    functions += '  } else {\n';
    functions += '    setupMQTT();\n';
    functions += '  }\n';
    functions += '}\n\n';
    
    functions += 'void onMqttMessage(char* topic, byte* payload, unsigned int length) {\n';
    functions += '  payload[length] = \'\\0\';\n';
    functions += '  String message = String((char*)payload);\n';
    functions += '  \n';
    functions += '  DynamicJsonDocument cmd(512);\n';
    functions += '  deserializeJson(cmd, message);\n';
    functions += '  \n';
    functions += '  handleCommand(cmd);\n';
    functions += '}\n\n';
  }
  
  // 명령 처리 함수
  if (spec.controls.length > 0) {
    functions += 'void handleCommand(DynamicJsonDocument& cmd) {\n';
    functions += '  String commandType = cmd["type"];\n';
    functions += '  \n';
    
    spec.controls.forEach(({ type, count }) => {
      if (type === 'relay') {
        for (let i = 0; i < count; i++) {
          functions += `  if (commandType == "relay_control" && cmd["params"]["relay"] == ${i + 1}) {\n`;
          functions += `    bool state = cmd["params"]["state"] == "on";\n`;
          functions += `    digitalWrite(RELAY${i + 1}_PIN, state ? HIGH : LOW);\n`;
          functions += `    Serial.println("릴레이 ${i + 1}: " + String(state ? "ON" : "OFF"));\n`;
          functions += `  }\n`;
        }
      } else if (type === 'dc_fan_pwm') {
        for (let i = 0; i < count; i++) {
          functions += `  if (commandType == "fan_control" && cmd["params"]["fan"] == ${i + 1}) {\n`;
          functions += `    int speed = cmd["params"]["speed"];\n`;
          functions += `    analogWrite(FAN${i + 1}_PIN, speed);\n`;
          functions += `    Serial.println("팬 ${i + 1} 속도: " + String(speed));\n`;
          functions += `  }\n`;
        }
      } else if (type === 'led_strip') {
        for (let i = 0; i < count; i++) {
          functions += `  if (commandType == "led_control" && cmd["params"]["led"] == ${i + 1}) {\n`;
          functions += `    int brightness = cmd["params"]["brightness"];\n`;
          functions += `    analogWrite(LED_STRIP${i + 1}_PIN, brightness);\n`;
          functions += `    Serial.println("LED ${i + 1} 밝기: " + String(brightness));\n`;
          functions += `  }\n`;
        }
      }
    });
    
    functions += '}\n';
  }
  
<<<<<<< HEAD
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
=======
  return functions;
}
>>>>>>> dc17f9bdf342b9bb54af2c88a33587ba61dacf39
