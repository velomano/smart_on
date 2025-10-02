/**
 * Enhanced Code Generator - 출고 전 최종 체크리스트 준수
 * 안전 게이트, 토픽 규칙, PlatformIO lib_deps 포함
 */

import modelsRegistry from './registry/models.json';
import { PinValidator, SystemSpec, ValidationResult } from './validation/pin-validator';
import { PseudoDriver } from './pseudo-driver';

export interface EnhancedSystemSpec extends SystemSpec {
  tenant: string;
  deviceId: string;
  wifi: {
    ssid: string;
    password: string;
  };
  mqtt?: {
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
  bridgeIntegration?: boolean;
  pinAssignments?: Record<string, string>;
}

export class EnhancedCodeGenerator {
  private spec: EnhancedSystemSpec;
  private validator: PinValidator;
  private validationResult: ValidationResult;

  constructor(spec: EnhancedSystemSpec) {
    this.spec = spec;
    this.validator = new PinValidator(spec.device);
    this.validationResult = this.validator.validateSystem(spec);
  }

  /**
   * 메인 코드 생성
   */
  generateCode(): string {
    // 검증 실패 시 PseudoDriver 사용
    if (!this.validationResult.isValid) {
      console.warn('시스템 검증 실패, PseudoDriver 모드로 전환');
      const pseudoDriver = new PseudoDriver(this.spec);
      return pseudoDriver.generatePseudoCode();
    }

    return this.generateProductionCode();
  }

  /**
   * 프로덕션 코드 생성
   */
  private generateProductionCode(): string {
    const { device, protocol, sensors, controls, tenant, deviceId } = this.spec;
    
    return `/**
 * Universal IoT 시스템 코드 - 출고 전 최종 체크리스트 준수
 * 
 * 디바이스: ${device.toUpperCase()}
 * 프로토콜: ${protocol.toUpperCase()}
 * 테넌트: ${tenant}
 * 디바이스 ID: ${deviceId}
 * 생성 시간: ${new Date().toISOString()}
 * 
 * ✅ 핀 충돌 검사 통과
 * ✅ 인터페이스 충돌 검사 통과
 * ✅ 안전 핀 사용 확인
 * ✅ 라이브러리 의존성 검증
 * ✅ 안전 등급 검사 완료
 */

${this.generateIncludes()}

// WiFi 설정
const char* ssid = "${this.spec.wifi.ssid}";
const char* password = "${this.spec.wifi.password}";

// Universal Bridge 설정
const char* bridgeHost = "${this.spec.mqtt?.host || 'YOUR_BRIDGE_HOST'}";
const int bridgePort = ${this.spec.mqtt?.port || 3001};
const char* deviceKey = "YOUR_DEVICE_KEY";

// 토픽 규칙: terahub/{tenant}/{deviceId}/{kind}/{name}
const char* topicBase = "terahub/${tenant}/${deviceId}";

// 센서 및 액추에이터 선언
${this.generateDeclarations()}

// 전역 변수
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 5000; // 5초

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=== Universal IoT 시스템 시작 ===");
  Serial.printf("디바이스: %s\\n", "${device.toUpperCase()}");
  Serial.printf("테넌트: %s\\n", "${tenant}");
  Serial.printf("디바이스 ID: %s\\n", "${deviceId}");
  
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
  
  // I2C 초기화
  Wire.begin(21, 22); // SDA=21, SCL=22
  Serial.println("I2C 초기화 완료");
  
  // 센서 초기화
  ${this.generateSensorInit()}
  
  // 액추에이터 초기화
  ${this.generateActuatorInit()}
  
  Serial.println("=== 시스템 준비 완료 ===");
}

void loop() {
  unsigned long currentTime = millis();
  
  // 센서 데이터 읽기
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = currentTime;
    readSensors();
  }
  
  delay(100);
}

void readSensors() {
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
  
  // 센서 데이터 읽기
  ${this.generateSensorReading()}
  
  doc["status"] = "ok";
  
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

// 액추에이터 제어 함수들
${this.generateActuatorControl()}

// 유틸리티 함수들
float randomFloat(float min, float max) {
  return min + (max - min) * (random(1000) / 1000.0);
}`;
  }

  /**
   * 라이브러리 포함문 생성
   */
  private generateIncludes(): string {
    const includes = new Set<string>();
    includes.add('#include <WiFi.h>');
    includes.add('#include <HTTPClient.h>');
    includes.add('#include <ArduinoJson.h>');
    includes.add('#include <Wire.h>');

    // 센서별 라이브러리 추가
    this.spec.sensors.forEach(sensor => {
      const model = modelsRegistry.sensors.find(s => s.model === sensor.model);
      if (model && model.libDeps) {
        model.libDeps.forEach(lib => {
          const libName = lib.split('/').pop()?.replace(/ /g, '_').replace(/_Library$/, '');
          if (libName) {
            includes.add(`#include <${libName}.h>`);
          }
        });
      }
    });

    // 액추에이터별 라이브러리 추가
    this.spec.controls.forEach(control => {
      const model = modelsRegistry.actuators.find(a => a.model === control.model);
      if (model && model.libDeps) {
        model.libDeps.forEach(lib => {
          const libName = lib.split('/').pop()?.replace(/ /g, '_').replace(/_Library$/, '');
          if (libName) {
            includes.add(`#include <${libName}.h>`);
          }
        });
      }
    });

    return Array.from(includes).join('\n');
  }

  /**
   * 센서/액추에이터 선언문 생성
   */
  private generateDeclarations(): string {
    let code = '';
    
    this.spec.sensors.forEach((sensor, sensorIdx) => {
      const model = modelsRegistry.sensors.find(s => s.model === sensor.model);
      if (model) {
        for (let i = 0; i < sensor.count; i++) {
          code += `// ${model.label} ${i + 1}번\n`;
          code += this.generateSensorDeclaration(model, i);
        }
      }
    });

    this.spec.controls.forEach((control, controlIdx) => {
      const model = modelsRegistry.actuators.find(a => a.model === control.model);
      if (model) {
        for (let i = 0; i < control.count; i++) {
          code += `// ${model.label} ${i + 1}번\n`;
          code += this.generateActuatorDeclaration(model, i);
        }
      }
    });

    return code;
  }

  /**
   * 센서 선언문 생성
   */
  private generateSensorDeclaration(model: any, index: number): string {
    const componentKey = `sensor_${this.spec.sensors.findIndex(s => s === this.spec.sensors[0])}_${index}_${model.model}`;
    const pin = this.spec.pinAssignments?.[componentKey] || 'GPIO27';
    
    switch (model.model) {
      case 'BME280':
        return `Adafruit_BME280 bme${index};\n`;
      case 'BMP280':
        return `Adafruit_BMP280 bmp${index};\n`;
      case 'DHT22':
        return `DHT dht${index}(${pin}, DHT22);\n`;
      case 'DS18B20':
        return `OneWire ow${index}(${pin});\nDallasTemperature ds${index}(&ow${index});\n`;
      case 'BH1750':
        return `BH1750 lightMeter${index};\n`;
      case 'SCD30':
        return `SCD30 scd30${index};\n`;
      case 'INA219':
        return `Adafruit_INA219 ina${index};\n`;
      default:
        return `// ${model.model} 선언 (구현 필요)\n`;
    }
  }

  /**
   * 액추에이터 선언문 생성
   */
  private generateActuatorDeclaration(model: any, index: number): string {
    const componentKey = `control_${this.spec.controls.findIndex(c => c === this.spec.controls[0])}_${index}_${model.model}`;
    const pin = this.spec.pinAssignments?.[componentKey] || 'GPIO26';
    
    switch (model.model) {
      case 'ws2812b':
        return `Adafruit_NeoPixel strip${index}(60, ${pin}, NEO_GRB + NEO_KHZ800);\n`;
      default:
        return `// ${model.model} 선언 (구현 필요)\n`;
    }
  }

  /**
   * 센서 초기화 코드 생성
   */
  private generateSensorInit(): string {
    let code = '';
    
    this.spec.sensors.forEach((sensor, sensorIdx) => {
      const model = modelsRegistry.sensors.find(s => s.model === sensor.model);
      if (model) {
        for (let i = 0; i < sensor.count; i++) {
          const componentKey = `sensor_${sensorIdx}_${i}_${sensor.model}`;
          const pin = this.spec.pinAssignments?.[componentKey] || 'GPIO27';
          
          code += `  // ${model.label} ${i + 1}번 초기화\n`;
          code += this.generateSensorInitCode(model, i, pin);
        }
      }
    });

    return code;
  }

  /**
   * 센서 초기화 코드 생성 (모델별)
   */
  private generateSensorInitCode(model: any, index: number, pin: string): string {
    switch (model.model) {
      case 'BME280':
        return `  if (!bme${index}.begin(0x76)) {\n    Serial.println("BME280 ${index + 1}번 초기화 실패");\n  } else {\n    Serial.println("BME280 ${index + 1}번 초기화 성공");\n  }\n`;
      case 'BMP280':
        return `  if (!bmp${index}.begin(0x76)) {\n    Serial.println("BMP280 ${index + 1}번 초기화 실패");\n  } else {\n    Serial.println("BMP280 ${index + 1}번 초기화 성공");\n  }\n`;
      case 'DHT22':
        return `  dht${index}.begin();\n  Serial.println("DHT22 ${index + 1}번 초기화 완료");\n`;
      case 'DS18B20':
        return `  ds${index}.begin();\n  Serial.println("DS18B20 ${index + 1}번 초기화 완료");\n`;
      case 'BH1750':
        return `  if (lightMeter${index}.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {\n    Serial.println("BH1750 ${index + 1}번 초기화 성공");\n  } else {\n    Serial.println("BH1750 ${index + 1}번 초기화 실패");\n  }\n`;
      case 'SCD30':
        return `  if (scd30${index}.begin()) {\n    Serial.println("SCD30 ${index + 1}번 초기화 성공");\n  } else {\n    Serial.println("SCD30 ${index + 1}번 초기화 실패");\n  }\n`;
      case 'INA219':
        return `  if (ina${index}.begin()) {\n    Serial.println("INA219 ${index + 1}번 초기화 성공");\n  } else {\n    Serial.println("INA219 ${index + 1}번 초기화 실패");\n  }\n`;
      default:
        return `  pinMode(${pin}, INPUT);\n  Serial.println("${model.label} ${index + 1}번 초기화 완료");\n`;
    }
  }

  /**
   * 액추에이터 초기화 코드 생성
   */
  private generateActuatorInit(): string {
    let code = '';
    
    this.spec.controls.forEach((control, controlIdx) => {
      const model = modelsRegistry.actuators.find(a => a.model === control.model);
      if (model) {
        for (let i = 0; i < control.count; i++) {
          const componentKey = `control_${controlIdx}_${i}_${control.model}`;
          const pin = this.spec.pinAssignments?.[componentKey] || 'GPIO26';
          
          code += `  // ${model.label} ${i + 1}번 초기화\n`;
          code += this.generateActuatorInitCode(model, i, pin);
        }
      }
    });

    return code;
  }

  /**
   * 액추에이터 초기화 코드 생성 (모델별)
   */
  private generateActuatorInitCode(model: any, index: number, pin: string): string {
    switch (model.model) {
      case 'relay_ac_lamp':
        return `  pinMode(${pin}, OUTPUT);\n  digitalWrite(${pin}, LOW);\n  Serial.println("AC 릴레이 ${index + 1}번 초기화 완료");\n`;
      case 'pwm_12v_led':
        return `  ledcSetup(${index}, 1000, 8);\n  ledcAttachPin(${pin}, ${index});\n  ledcWrite(${index}, 0);\n  Serial.println("12V LED ${index + 1}번 초기화 완료");\n`;
      case 'ws2812b':
        return `  strip${index}.begin();\n  strip${index}.show();\n  Serial.println("WS2812B ${index + 1}번 초기화 완료");\n`;
      case 'tb6612':
        return `  pinMode(${pin}, OUTPUT);\n  ledcSetup(${index + 10}, 1000, 8);\n  ledcAttachPin(${pin}, ${index + 10});\n  Serial.println("TB6612 DC모터 ${index + 1}번 초기화 완료");\n`;
      case 'ssr':
        return `  pinMode(${pin}, OUTPUT);\n  digitalWrite(${pin}, LOW);\n  Serial.println("SSR ${index + 1}번 초기화 완료");\n`;
      default:
        return `  pinMode(${pin}, OUTPUT);\n  digitalWrite(${pin}, LOW);\n  Serial.println("${model.label} ${index + 1}번 초기화 완료");\n`;
    }
  }

  /**
   * 센서 데이터 읽기 코드 생성
   */
  private generateSensorReading(): string {
    let code = '';
    
    this.spec.sensors.forEach((sensor, sensorIdx) => {
      const model = modelsRegistry.sensors.find(s => s.model === sensor.model);
      if (model) {
        for (let i = 0; i < sensor.count; i++) {
          const componentKey = `sensor_${sensorIdx}_${i}_${sensor.model}`;
          const pin = this.spec.pinAssignments?.[componentKey] || 'GPIO27';
          
          code += `  // ${model.label} ${i + 1}번 데이터 읽기\n`;
          code += this.generateSensorReadCode(model, i, pin);
        }
      }
    });

    return code;
  }

  /**
   * 센서 데이터 읽기 코드 생성 (모델별)
   */
  private generateSensorReadCode(model: any, index: number, pin: string): string {
    let code = '';
    
    if (model.publish) {
      model.publish.forEach((pub: any) => {
        switch (model.model) {
          case 'BME280':
            if (pub.key === 'temperature') code += `  float t${index} = bme${index}.readTemperature();\n`;
            if (pub.key === 'humidity') code += `  float h${index} = bme${index}.readHumidity();\n`;
            if (pub.key === 'pressure') code += `  float p${index} = bme${index}.readPressure() / 100.0F;\n`;
            break;
          case 'BMP280':
            if (pub.key === 'pressure') code += `  float p${index} = bmp${index}.readPressure() / 100.0F;\n`;
            if (pub.key === 'temperature') code += `  float t${index} = bmp${index}.readTemperature();\n`;
            break;
          case 'DHT22':
            if (pub.key === 'temperature') code += `  float t${index} = dht${index}.readTemperature();\n`;
            if (pub.key === 'humidity') code += `  float h${index} = dht${index}.readHumidity();\n`;
            break;
          case 'DS18B20':
            if (pub.key === 'temperature') {
              code += `  ds${index}.requestTemperatures();\n`;
              code += `  float t${index} = ds${index}.getTempCByIndex(0);\n`;
            }
            break;
          case 'BH1750':
            if (pub.key === 'illuminance') code += `  float lx${index} = lightMeter${index}.readLightLevel();\n`;
            break;
          case 'SCD30':
            if (pub.key === 'co2') code += `  float co2${index} = scd30${index}.getCO2();\n`;
            if (pub.key === 'temperature') code += `  float t${index} = scd30${index}.getTemperature();\n`;
            if (pub.key === 'humidity') code += `  float h${index} = scd30${index}.getHumidity();\n`;
            break;
          case 'INA219':
            if (pub.key === 'voltage') code += `  float v${index} = ina${index}.getBusVoltage_V();\n`;
            if (pub.key === 'current') code += `  float mA${index} = ina${index}.getCurrent_mA();\n`;
            break;
          default:
            code += `  float ${pub.key}${index} = randomFloat(0.0, 100.0); // 가짜값\n`;
        }
        
        // 메트릭 추가
        const varName = pub.key + index;
        code += `  metrics["${pub.key}_${index + 1}"] = ${varName};\n`;
      });
    }

    return code;
  }

  /**
   * 액추에이터 제어 함수 생성
   */
  private generateActuatorControl(): string {
    let code = '';
    
    this.spec.controls.forEach((control, controlIdx) => {
      const model = modelsRegistry.actuators.find(a => a.model === control.model);
      if (model) {
        for (let i = 0; i < control.count; i++) {
          const componentKey = `control_${controlIdx}_${i}_${control.model}`;
          const pin = this.spec.pinAssignments?.[componentKey] || 'GPIO26';
          
          code += `void control${control.model}_${i + 1}(bool state) {\n`;
          code += this.generateActuatorControlCode(model, i, pin);
          code += `  Serial.printf("${model.label} ${i + 1}번: %s\\n", state ? "ON" : "OFF");\n`;
          code += `}\n\n`;
        }
      }
    });

    return code;
  }

  /**
   * 액추에이터 제어 코드 생성 (모델별)
   */
  private generateActuatorControlCode(model: any, index: number, pin: string): string {
    switch (model.model) {
      case 'relay_ac_lamp':
        return `  digitalWrite(${pin}, state ? HIGH : LOW);\n`;
      case 'pwm_12v_led':
        return `  ledcWrite(${index}, state ? 255 : 0);\n`;
      case 'ws2812b':
        return `  strip${index}.fill(strip${index}.Color(state ? 255 : 0, state ? 255 : 0, state ? 255 : 0));\n  strip${index}.show();\n`;
      case 'tb6612':
        return `  digitalWrite(${pin}, state ? HIGH : LOW);\n  ledcWrite(${index + 10}, state ? 255 : 0);\n`;
      case 'ssr':
        return `  digitalWrite(${pin}, state ? HIGH : LOW);\n`;
      default:
        return `  digitalWrite(${pin}, state ? HIGH : LOW);\n`;
    }
  }

  /**
   * PlatformIO lib_deps 생성
   */
  generatePlatformIODeps(): string {
    const libDeps = new Set<string>();
    
    // 센서별 라이브러리 의존성
    this.spec.sensors.forEach(sensor => {
      const model = modelsRegistry.sensors.find(s => s.model === sensor.model);
      if (model && model.libDeps) {
        model.libDeps.forEach(lib => libDeps.add(lib));
      }
    });

    // 액추에이터별 라이브러리 의존성
    this.spec.controls.forEach(control => {
      const model = modelsRegistry.actuators.find(a => a.model === control.model);
      if (model && model.libDeps) {
        model.libDeps.forEach(lib => libDeps.add(lib));
      }
    });

    return Array.from(libDeps).map(lib => `"${lib}"`).join(',\n    ');
  }

  /**
   * 안전 주의사항 포함 README 생성
   */
  generateSafetyReadme(): string {
    const highRiskComponents = this.spec.controls.filter(control => {
      const model = modelsRegistry.actuators.find(a => a.model === control.model);
      return model && model.safetyLevel === 'HIGH';
    });

    let readme = `# Universal IoT 시스템 가이드

## 🚨 안전 주의사항

`;

    if (highRiskComponents.length > 0) {
      readme += `### ⚠️ 고위험 컴포넌트 사용 중

다음 컴포넌트는 고전압/고전류를 사용하므로 **반드시** 안전 수칙을 준수하세요:

`;

      highRiskComponents.forEach(control => {
        const model = modelsRegistry.actuators.find(a => a.model === control.model);
        if (model) {
          readme += `#### ${model.label}\n`;
          readme += `${model.safety}\n\n`;
        }
      });

      readme += `### 🔧 일반 안전 수칙

1. **전원 차단**: 작업 전 반드시 전원을 차단하세요
2. **절연 확인**: 모든 연결부의 절연 상태를 확인하세요
3. **정격 확인**: 모든 부품의 정격 전압/전류를 확인하세요
4. **방열판**: 발열 부품에는 적절한 방열판을 설치하세요
5. **차단기**: 고전압 회로에는 차단기를 설치하세요

`;
    }

    readme += `## 📋 시스템 정보

- **디바이스**: ${this.spec.device.toUpperCase()}
- **프로토콜**: ${this.spec.protocol.toUpperCase()}
- **테넌트**: ${this.spec.tenant}
- **디바이스 ID**: ${this.spec.deviceId}

## 🔌 핀 할당

`;

    // 핀 할당 정보
    Object.entries(this.spec.pinAssignments || {}).forEach(([component, pin]) => {
      readme += `- ${component}: ${pin}\n`;
    });

    readme += `
## 📡 센서 목록

`;

    this.spec.sensors.forEach(sensor => {
      const model = modelsRegistry.sensors.find(s => s.model === sensor.model);
      if (model) {
        readme += `- ${model.label} (${sensor.count}개)\n`;
      }
    });

    readme += `
## 🎛️ 액추에이터 목록

`;

    this.spec.controls.forEach(control => {
      const model = modelsRegistry.actuators.find(a => a.model === control.model);
      if (model) {
        readme += `- ${model.label} (${control.count}개)\n`;
      }
    });

    readme += `
## ⚙️ 설정 방법

1. **WiFi 설정**: 코드에서 ssid와 password를 수정하세요
2. **Bridge 설정**: bridgeHost와 deviceKey를 설정하세요
3. **업로드**: Arduino IDE 또는 PlatformIO로 코드를 업로드하세요
4. **모니터링**: 시리얼 모니터로 연결 상태를 확인하세요

## 🔍 문제 해결

- **WiFi 연결 실패**: SSID와 비밀번호를 확인하세요
- **센서 데이터 없음**: 센서 연결과 핀 할당을 확인하세요
- **액추에이터 작동 안함**: 전원 공급과 핀 연결을 확인하세요

## 📞 지원

문제가 발생하면 시스템 로그를 확인하고 기술 지원팀에 문의하세요.
`;

    return readme;
  }

  /**
   * 검증 결과 반환
   */
  getValidationResult(): ValidationResult {
    return this.validationResult;
  }
}
