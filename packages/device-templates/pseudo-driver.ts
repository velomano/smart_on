/**
 * PseudoDriver - 미선택 모델용 가짜값 생성기
 * I2C/OneWire 스캔 로그 포함
 */

import modelsRegistry from './registry/models.json';

export interface PseudoDriverConfig {
  device: string;
  sensors: Array<{ type: string; count: number; model?: string }>;
  controls: Array<{ type: string; count: number; model?: string }>;
  pinAssignments?: Record<string, string>;
}

export class PseudoDriver {
  private config: PseudoDriverConfig;

  constructor(config: PseudoDriverConfig) {
    this.config = config;
  }

  /**
   * 미선택 모델용 코드 생성
   */
  generatePseudoCode(): string {
    const { device, sensors, controls } = this.config;
    
    return `/**
 * PseudoDriver - 미선택 모델용 가짜값 생성기
 * 실제 센서 연결 시 모델별 코드로 교체 필요
 * 
 * 디바이스: ${device.toUpperCase()}
 * 생성 시간: ${new Date().toISOString()}
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* bridgeHost = "YOUR_BRIDGE_HOST";
const int bridgePort = 3001;
const char* deviceKey = "YOUR_DEVICE_KEY";

// I2C 스캔 결과 저장
struct I2CDevice {
  uint8_t address;
  bool found;
  String description;
};

I2CDevice i2cDevices[] = {
  {0x76, false, "BME280/BMP280 (온습압/기압센서)"},
  {0x77, false, "BME280/BMP280 (온습압/기압센서)"},
  {0x23, false, "BH1750 (조도센서)"},
  {0x5C, false, "BH1750 (조도센서)"},
  {0x40, false, "INA219 (전류/전압센서)"},
  {0x48, false, "ADS1115 (ADC)"},
  {0x49, false, "ADS1115 (ADC)"},
  {0x4A, false, "ADS1115 (ADC)"},
  {0x4B, false, "ADS1115 (ADC)"},
  {0x61, false, "SCD30 (CO2센서)"},
  {0x62, false, "SCD41 (CO2센서)"},
  {0x52, false, "ENS160 (VOC센서)"},
  {0x68, false, "MPU6050 (IMU센서)"}
};

const int i2cDeviceCount = sizeof(i2cDevices) / sizeof(i2cDevices[0]);

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=== PseudoDriver 시작 ===");
  Serial.println("미선택 모델용 가짜값 생성 모드");
  
  // WiFi 연결
  Serial.print("WiFi 연결 중: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi 연결 완료");
  Serial.print("IP 주소: ");
  Serial.println(WiFi.localIP());
  
  // I2C 초기화 및 스캔
  Wire.begin(21, 22); // SDA=21, SCL=22
  Serial.println("\\n=== I2C 스캔 시작 ===");
  scanI2CDevices();
  
  // 센서 초기화 (가짜값용)
  initializePseudoSensors();
  
  // 액추에이터 초기화
  initializePseudoActuators();
  
  Serial.println("\\n=== PseudoDriver 준비 완료 ===");
  Serial.println("실제 센서 연결 시 모델별 코드로 교체하세요");
}

void loop() {
  static unsigned long lastSensorRead = 0;
  static unsigned long lastI2CScan = 0;
  
  unsigned long currentTime = millis();
  
  // 센서 데이터 읽기 (5초마다)
  if (currentTime - lastSensorRead >= 5000) {
    lastSensorRead = currentTime;
    readPseudoSensors();
  }
  
  // I2C 스캔 (30초마다)
  if (currentTime - lastI2CScan >= 30000) {
    lastI2CScan = currentTime;
    Serial.println("\\n=== 주기적 I2C 스캔 ===");
    scanI2CDevices();
  }
  
  delay(100);
}

void scanI2CDevices() {
  Serial.println("I2C 주소 스캔 중...");
  bool foundAny = false;
  
  for (int i = 0; i < i2cDeviceCount; i++) {
    Wire.beginTransmission(i2cDevices[i].address);
    uint8_t error = Wire.endTransmission();
    
    if (error == 0) {
      i2cDevices[i].found = true;
      Serial.printf("✓ 발견: 0x%02X - %s\\n", 
                   i2cDevices[i].address, 
                   i2cDevices[i].description.c_str());
      foundAny = true;
    } else {
      i2cDevices[i].found = false;
    }
  }
  
  if (!foundAny) {
    Serial.println("❌ I2C 장치를 찾을 수 없습니다");
    Serial.println("   - 센서 연결 확인");
    Serial.println("   - 전원 공급 확인");
    Serial.println("   - I2C 핀 연결 확인 (SDA=21, SCL=22)");
  }
  
  Serial.println("I2C 스캔 완료\\n");
}

void initializePseudoSensors() {
  Serial.println("=== 가짜 센서 초기화 ===");
  
  ${this.generateSensorInit()}
  
  Serial.println("가짜 센서 초기화 완료");
}

void initializePseudoActuators() {
  Serial.println("=== 가짜 액추에이터 초기화 ===");
  
  ${this.generateActuatorInit()}
  
  Serial.println("가짜 액추에이터 초기화 완료");
}

void readPseudoSensors() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi 연결 끊김, 데이터 전송 건너뜀");
    return;
  }
  
  HTTPClient http;
  http.begin("http://" + String(bridgeHost) + ":" + String(bridgePort) + "/api/telemetry");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", deviceKey);
  
  StaticJsonDocument<1024> doc;
  doc["device_id"] = deviceKey;
  doc["ts"] = "2025-10-02T13:51:00Z";
  JsonObject metrics = doc.createNestedObject("metrics");
  
  // 가짜 센서 데이터 생성
  ${this.generatePseudoSensorData()}
  
  // I2C 스캔 결과 포함
  JsonObject i2cScan = doc.createNestedObject("i2c_scan");
  for (int i = 0; i < i2cDeviceCount; i++) {
    if (i2cDevices[i].found) {
      i2cScan[String("0x") + String(i2cDevices[i].address, HEX)] = i2cDevices[i].description;
    }
  }
  
  doc["status"] = "pseudo_mode";
  doc["note"] = "미선택 모델용 가짜값 - 실제 센서 연결 시 모델별 코드로 교체 필요";
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  Serial.println("전송 데이터:");
  Serial.println(requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode > 0) {
    Serial.printf("✓ 데이터 전송 성공: %d\\n", httpResponseCode);
    String response = http.getString();
    Serial.println("응답: " + response);
  } else {
    Serial.printf("❌ 데이터 전송 실패: %s\\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}

// 액추에이터 제어 함수들 (실제 제어 가능)
${this.generateActuatorControl()}

// 유틸리티 함수들
float randomFloat(float min, float max) {
  return min + (max - min) * (random(1000) / 1000.0);
}

void printSystemInfo() {
  Serial.println("\\n=== 시스템 정보 ===");
  Serial.printf("칩 모델: %s\\n", ESP.getChipModel());
  Serial.printf("칩 리비전: %d\\n", ESP.getChipRevision());
  Serial.printf("CPU 주파수: %d MHz\\n", ESP.getCpuFreqMHz());
  Serial.printf("플래시 크기: %d MB\\n", ESP.getFlashChipSize() / (1024 * 1024));
  Serial.printf("자유 힙: %d bytes\\n", ESP.getFreeHeap());
  Serial.printf("업타임: %lu ms\\n", millis());
  Serial.println("==================\\n");
}`;
  }

  /**
   * 센서 초기화 코드 생성
   */
  private generateSensorInit(): string {
    let code = '';
    
    this.config.sensors.forEach((sensor, sensorIdx) => {
      const model = modelsRegistry.sensors.find(s => s.model === sensor.model);
      
      for (let i = 0; i < sensor.count; i++) {
        const componentKey = `sensor_${sensorIdx}_${i}_${sensor.model || sensor.type}`;
        const pin = this.config.pinAssignments?.[componentKey] || 'GPIO27';
        
        if (model) {
          code += `  // ${model.label} ${i + 1}번 (실제 모델 감지됨)\\n`;
          code += `  Serial.printf("${model.label} ${i + 1}번 초기화 (핀: %s)\\n", "${pin}");\\n`;
        } else {
          code += `  // ${sensor.type} 센서 ${i + 1}번 (모델 미선택)\\n`;
          code += `  Serial.printf("${sensor.type} 센서 ${i + 1}번 초기화 (핀: %s)\\n", "${pin}");\\n`;
          code += `  pinMode(${pin}, INPUT);\\n`;
        }
      }
    });
    
    return code;
  }

  /**
   * 액추에이터 초기화 코드 생성
   */
  private generateActuatorInit(): string {
    let code = '';
    
    this.config.controls.forEach((control, controlIdx) => {
      const model = modelsRegistry.actuators.find(a => a.model === control.model);
      
      for (let i = 0; i < control.count; i++) {
        const componentKey = `control_${controlIdx}_${i}_${control.model || control.type}`;
        const pin = this.config.pinAssignments?.[componentKey] || 'GPIO26';
        
        if (model) {
          code += `  // ${model.label} ${i + 1}번 (실제 모델 감지됨)\\n`;
          code += `  Serial.printf("${model.label} ${i + 1}번 초기화 (핀: %s)\\n", "${pin}");\\n`;
        } else {
          code += `  // ${control.type} 액추에이터 ${i + 1}번 (모델 미선택)\\n`;
          code += `  Serial.printf("${control.type} 액추에이터 ${i + 1}번 초기화 (핀: %s)\\n", "${pin}");\\n`;
        }
        
        code += `  pinMode(${pin}, OUTPUT);\\n`;
        code += `  digitalWrite(${pin}, LOW);\\n`;
      }
    });
    
    return code;
  }

  /**
   * 가짜 센서 데이터 생성
   */
  private generatePseudoSensorData(): string {
    let code = '';
    
    this.config.sensors.forEach((sensor, sensorIdx) => {
      const model = modelsRegistry.sensors.find(s => s.model === sensor.model);
      
      for (let i = 0; i < sensor.count; i++) {
        const componentKey = `sensor_${sensorIdx}_${i}_${sensor.model || sensor.type}`;
        
        if (model && model.publish) {
          // 실제 모델이 있는 경우
          code += `  // ${model.label} ${i + 1}번 데이터\\n`;
          model.publish.forEach(pub => {
            const value = this.getPseudoValue(pub.key);
            code += `  metrics["${pub.key}_${i + 1}"] = ${value};\\n`;
          });
        } else {
          // 모델이 없는 경우 가짜값
          code += `  // ${sensor.type} 센서 ${i + 1}번 가짜값\\n`;
          code += `  metrics["${sensor.type}_${i + 1}"] = ${this.getPseudoValue(sensor.type)};\\n`;
        }
      }
    });
    
    return code;
  }

  /**
   * 액추에이터 제어 함수 생성
   */
  private generateActuatorControl(): string {
    let code = '';
    
    this.config.controls.forEach((control, controlIdx) => {
      const model = modelsRegistry.actuators.find(a => a.model === control.model);
      
      for (let i = 0; i < control.count; i++) {
        const componentKey = `control_${controlIdx}_${i}_${control.model || control.type}`;
        const pin = this.config.pinAssignments?.[componentKey] || 'GPIO26';
        
        code += `void control${control.type}_${i + 1}(bool state) {\\n`;
        code += `  digitalWrite(${pin}, state ? HIGH : LOW);\\n`;
        code += `  Serial.printf("${control.type} ${i + 1}번: %s\\n", state ? "ON" : "OFF");\\n`;
        code += `}\\n\\n`;
      }
    });
    
    return code;
  }

  /**
   * 센서 타입별 가짜값 생성
   */
  private getPseudoValue(sensorType: string): string {
    const pseudoValues: Record<string, string> = {
      'temperature': 'randomFloat(20.0, 30.0)',
      'humidity': 'randomFloat(40.0, 80.0)',
      'pressure': 'randomFloat(1000.0, 1020.0)',
      'light': 'randomFloat(100.0, 1000.0)',
      'co2': 'randomFloat(400.0, 600.0)',
      'distance': 'randomFloat(10.0, 100.0)',
      'voltage': 'randomFloat(3.0, 5.0)',
      'current': 'randomFloat(100.0, 500.0)',
      'ph': 'randomFloat(6.0, 8.0)',
      'ec': 'randomFloat(1000.0, 2000.0)',
      'moisture': 'randomFloat(30.0, 80.0)'
    };
    
    return pseudoValues[sensorType] || 'randomFloat(0.0, 100.0)';
  }
}
