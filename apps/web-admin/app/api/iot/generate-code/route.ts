// IoT 디바이스 코드 자동 생성 API
import { NextRequest, NextResponse } from 'next/server';
import { sensors, controls, devicePinmaps } from '../../../../../packages/iot-templates/index';

interface SystemSpec {
  device: string;
  protocol: 'http' | 'mqtt' | 'websocket' | 'webhook' | 'serial' | 'ble' | 'rs485' | 'modbus-tcp';
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  wifi: {
    ssid: string;
    password: string;
  };
  modbusConfig?: {
    host: string;
    port: number;
    unitId: number;
    registerMappings: Record<string, number>;
    dataTypes: Record<string, 'U16' | 'S16' | 'U32' | 'S32' | 'float'>;
    safeLimits: Record<string, { min: number; max: number }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const spec: SystemSpec = await request.json();
    
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
  } catch (error) {
    console.error('코드 생성 오류:', error);
    return NextResponse.json({ error: '코드 생성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

function generateArduinoCode(spec: SystemSpec): string {
  let code = '';
  
  // 헤더 및 라이브러리
  code += generateHeaders(spec);
  code += '\n';
  
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
  
  return functions;
}