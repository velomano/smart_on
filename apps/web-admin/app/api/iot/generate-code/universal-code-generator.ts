/**
 * Universal IoT Code Generator
 * 80/20 원칙 기반 실제 컴파일 가능한 코드 생성
 */

import { SystemSpec } from './types';

export class UniversalCodeGenerator {
  private spec: SystemSpec;

  constructor(spec: SystemSpec) {
    this.spec = spec;
  }

  generateCode(): string {
    const { device, protocol, sensors, controls, pinAssignments } = this.spec;
    
    return `/**
 * Universal Bridge 호환 IoT 시스템 코드
 * 디바이스: ${device.toUpperCase()}
 * 프로토콜: ${protocol.toUpperCase()}
 * 생성 시간: ${new Date().toISOString()}
 * 
 * 80/20 원칙 기반 자동 생성 코드
 * - 상위 빈도 모델 우선 지원
 * - 자동 탐지 + 늦은 결합
 * - PseudoDriver로 파이프라인 검증
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>

// WiFi 설정 (보안을 위해 직접 입력하세요)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Universal Bridge 설정
const char* bridgeHost = "YOUR_BRIDGE_HOST";
const int bridgePort = 3001;
const char* deviceKey = "YOUR_DEVICE_KEY";

${this.generatePinDefinitions()}

// 전역 변수
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 5000; // 5초

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("=== Universal IoT System Starting ===");
  Serial.println("80/20 Principle - Auto Detection Mode");

  // I2C 초기화 (압력센서용)
  Wire.begin(21, 22); // SDA=21, SCL=22
  Serial.println("I2C initialized (SDA=21, SCL=22)");

  // 센서 초기화
  ${this.generateSensorInit()}

  // 액추에이터 초기화
  ${this.generateActuatorInit()}

  // WiFi 연결
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection failed!");
  }

  // I2C 스캔 (센서 자동 탐지)
  Serial.println("Scanning I2C devices...");
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("I2C device found at address 0x%02X", addr);
      if (addr == 0x76 || addr == 0x77) {
        Serial.println(" (BME280/BMP280 pressure sensor detected!)");
      } else {
        Serial.println("");
      }
    }
  }
  
  Serial.println("=== System Ready ===");
}

void loop() {
  unsigned long currentTime = millis();
  
  // 센서 데이터 읽기 (5초마다)
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = currentTime;
    
    ${this.generateSensorReading()}
    
    // Universal Bridge로 데이터 전송
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin("http://" + String(bridgeHost) + ":" + String(bridgePort) + "/api/telemetry");
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-Device-Key", deviceKey);

      String requestBody;
      serializeJson(sensorData, requestBody);
      
      Serial.println("Sending sensor data:");
      Serial.println(requestBody);

      int httpResponseCode = http.POST(requestBody);

      if (httpResponseCode > 0) {
        Serial.printf("[HTTP] POST success, code: %d\\n", httpResponseCode);
        String response = http.getString();
        Serial.println("Response: " + response);
      } else {
        Serial.printf("[HTTP] POST failed, error: %s\\n", http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    } else {
      Serial.println("WiFi not connected, skipping data transmission");
    }
  }
  
  delay(100); // CPU 부하 방지
}

// 액추에이터 제어 함수들
void controlRelay(int pin, bool state) {
  digitalWrite(pin, state ? HIGH : LOW);
  Serial.printf("Relay on pin %d: %s\\n", pin, state ? "ON" : "OFF");
}

void controlDCMotor(int pwmPin, int channel, int speed) {
  ledcWrite(channel, speed);
  Serial.printf("DC Motor on pin %d: speed %d\\n", pwmPin, speed);
}

void controlServo(int pin, int channel, int angle) {
  int pulseWidth = map(angle, 0, 180, 500, 2500);
  ledcWrite(channel, pulseWidth);
  Serial.printf("Servo on pin %d: angle %d\\n", pin, angle);
}
`;
  }

  private generatePinDefinitions(): string {
    if (!this.spec.pinAssignments) return '';
    
    let pinDefs = '\n// 핀 정의 (사용자 할당)\n';
    Object.entries(this.spec.pinAssignments).forEach(([component, pin]) => {
      const parts = component.split('_');
      const type = parts[parts.length - 1];
      const instance = parts[parts.length - 2];
      pinDefs += `#define ${type.toUpperCase()}_${instance}_PIN ${pin}\n`;
    });
    return pinDefs;
  }

  private generateSensorInit(): string {
    let initCode = '\n// 센서 초기화\n';
    this.spec.sensors.forEach(sensor => {
      for (let i = 0; i < sensor.count; i++) {
        const componentKey = `sensor_${this.spec.sensors.indexOf(sensor)}_${i}_${sensor.type}`;
        const pin = this.spec.pinAssignments?.[componentKey] || 'GPIO27';
        
        switch (sensor.type) {
          case 'temperature':
            initCode += `  // 온도센서 ${i + 1}번 초기화 (핀: ${pin})\n`;
            initCode += `  pinMode(${pin}, INPUT);\n`;
            break;
          case 'pressure':
            initCode += `  // 압력센서 ${i + 1}번 초기화 (I2C: ${pin})\n`;
            initCode += `  Wire.begin(21, 22); // SDA=21, SCL=22\n`;
            break;
          case 'humidity':
            initCode += `  // 습도센서 ${i + 1}번 초기화 (핀: ${pin})\n`;
            initCode += `  pinMode(${pin}, INPUT);\n`;
            break;
          case 'light':
            initCode += `  // 조도센서 ${i + 1}번 초기화 (핀: ${pin})\n`;
            initCode += `  pinMode(${pin}, INPUT);\n`;
            break;
          case 'motion':
            initCode += `  // 동작센서 ${i + 1}번 초기화 (핀: ${pin})\n`;
            initCode += `  pinMode(${pin}, INPUT);\n`;
            break;
          case 'distance':
            initCode += `  // 거리센서 ${i + 1}번 초기화 (핀: ${pin})\n`;
            initCode += `  pinMode(${pin}, INPUT);\n`;
            break;
          case 'gas':
            initCode += `  // 가스센서 ${i + 1}번 초기화 (핀: ${pin})\n`;
            initCode += `  pinMode(${pin}, INPUT);\n`;
            break;
        }
      }
    });
    return initCode;
  }

  private generateActuatorInit(): string {
    let initCode = '\n// 액추에이터 초기화\n';
    let channelCounter = 0;
    
    this.spec.controls.forEach(control => {
      for (let i = 0; i < control.count; i++) {
        const componentKey = `control_${this.spec.controls.indexOf(control)}_${i}_${control.type}`;
        const pin = this.spec.pinAssignments?.[componentKey] || 'GPIO26';
        
        switch (control.type) {
          case 'relay':
            initCode += `  // 릴레이 ${i + 1}번 초기화 (핀: ${pin})\n`;
            initCode += `  pinMode(${pin}, OUTPUT);\n`;
            initCode += `  digitalWrite(${pin}, LOW);\n`;
            break;
          case 'dc-motor':
            initCode += `  // DC모터 ${i + 1}번 초기화 (PWM: ${pin})\n`;
            initCode += `  ledcSetup(${channelCounter}, 1000, 8);\n`;
            initCode += `  ledcAttachPin(${pin}, ${channelCounter});\n`;
            initCode += `  ledcWrite(${channelCounter}, 0);\n`;
            channelCounter++;
            break;
          case 'servo':
            initCode += `  // 서보모터 ${i + 1}번 초기화 (핀: ${pin})\n`;
            initCode += `  ledcSetup(${channelCounter}, 50, 16);\n`;
            initCode += `  ledcAttachPin(${pin}, ${channelCounter});\n`;
            initCode += `  ledcWrite(${channelCounter}, 1500);\n`;
            channelCounter++;
            break;
          case 'stepper':
            initCode += `  // 스테퍼모터 ${i + 1}번 초기화 (핀: ${pin})\n`;
            initCode += `  pinMode(${pin}, OUTPUT);\n`;
            break;
          case 'led':
            initCode += `  // LED ${i + 1}번 초기화 (핀: ${pin})\n`;
            initCode += `  pinMode(${pin}, OUTPUT);\n`;
            initCode += `  digitalWrite(${pin}, LOW);\n`;
            break;
          case 'buzzer':
            initCode += `  // 부저 ${i + 1}번 초기화 (핀: ${pin})\n`;
            initCode += `  ledcSetup(${channelCounter}, 2000, 8);\n`;
            initCode += `  ledcAttachPin(${pin}, ${channelCounter});\n`;
            initCode += `  ledcWrite(${channelCounter}, 0);\n`;
            channelCounter++;
            break;
        }
      }
    });
    return initCode;
  }

  private generateSensorReading(): string {
    let readCode = '\n// 센서 데이터 읽기\n';
    readCode += `  StaticJsonDocument<512> sensorData;\n`;
    readCode += `  sensorData["device_id"] = deviceKey;\n`;
    readCode += `  sensorData["ts"] = "2023-10-27T10:00:00Z";\n`;
    readCode += `  JsonObject metrics = sensorData.createNestedObject("metrics");\n`;
    
    this.spec.sensors.forEach(sensor => {
      for (let i = 0; i < sensor.count; i++) {
        const componentKey = `sensor_${this.spec.sensors.indexOf(sensor)}_${i}_${sensor.type}`;
        const pin = this.spec.pinAssignments?.[componentKey] || 'GPIO27';
        
        switch (sensor.type) {
          case 'temperature':
            readCode += `  // 온도센서 ${i + 1}번 읽기\n`;
            readCode += `  int tempRaw${i} = analogRead(${pin});\n`;
            readCode += `  float temperature${i} = (tempRaw${i} * 3.3 / 4095.0) * 100.0; // LM35 변환\n`;
            readCode += `  metrics["temperature_${i + 1}"] = temperature${i};\n`;
            break;
          case 'pressure':
            readCode += `  // 압력센서 ${i + 1}번 읽기 (I2C 스캔)\n`;
            readCode += `  Wire.beginTransmission(0x76);\n`;
            readCode += `  if (Wire.endTransmission() == 0) {\n`;
            readCode += `    metrics["pressure_${i + 1}"] = 1013.25; // BME280 감지됨\n`;
            readCode += `  } else {\n`;
            readCode += `    metrics["pressure_${i + 1}"] = 0.0; // 센서 없음\n`;
            readCode += `  }\n`;
            break;
          case 'humidity':
            readCode += `  // 습도센서 ${i + 1}번 읽기\n`;
            readCode += `  int humRaw${i} = analogRead(${pin});\n`;
            readCode += `  float humidity${i} = (humRaw${i} * 100.0 / 4095.0);\n`;
            readCode += `  metrics["humidity_${i + 1}"] = humidity${i};\n`;
            break;
          case 'light':
            readCode += `  // 조도센서 ${i + 1}번 읽기\n`;
            readCode += `  int lightRaw${i} = analogRead(${pin});\n`;
            readCode += `  float light${i} = (lightRaw${i} * 100.0 / 4095.0);\n`;
            readCode += `  metrics["light_${i + 1}"] = light${i};\n`;
            break;
          case 'motion':
            readCode += `  // 동작센서 ${i + 1}번 읽기\n`;
            readCode += `  int motion${i} = digitalRead(${pin});\n`;
            readCode += `  metrics["motion_${i + 1}"] = motion${i};\n`;
            break;
          case 'distance':
            readCode += `  // 거리센서 ${i + 1}번 읽기\n`;
            readCode += `  int distRaw${i} = analogRead(${pin});\n`;
            readCode += `  float distance${i} = (distRaw${i} * 400.0 / 4095.0);\n`;
            readCode += `  metrics["distance_${i + 1}"] = distance${i};\n`;
            break;
          case 'gas':
            readCode += `  // 가스센서 ${i + 1}번 읽기\n`;
            readCode += `  int gasRaw${i} = analogRead(${pin});\n`;
            readCode += `  float gas${i} = (gasRaw${i} * 100.0 / 4095.0);\n`;
            readCode += `  metrics["gas_${i + 1}"] = gas${i};\n`;
            break;
        }
      }
    });
    
    readCode += `  sensorData["status"] = "ok";\n`;
    return readCode;
  }
}
