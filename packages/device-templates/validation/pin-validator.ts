/**
 * 핀 검증 및 충돌 방지 시스템
 * 출고 전 최종 체크리스트 준수
 */

import modelsRegistry from '../registry/models.json';

export interface PinAssignment {
  [componentKey: string]: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ComponentSpec {
  type: string;
  count: number;
  model?: string;
}

export interface SystemSpec {
  device: string;
  sensors: ComponentSpec[];
  controls: ComponentSpec[];
  pinAssignments?: PinAssignment;
}

export class PinValidator {
  private device: string;
  private pinSafety: any;
  private assignedPins: Set<string>;
  private interfaceConflicts: Map<string, string[]>;

  constructor(device: string) {
    this.device = device;
    this.pinSafety = modelsRegistry.pinSafety[device] || modelsRegistry.pinSafety.esp32;
    this.assignedPins = new Set();
    this.interfaceConflicts = new Map();
  }

  /**
   * 전체 시스템 검증
   */
  validateSystem(spec: SystemSpec): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // 1. 핀 충돌 검사
    this.checkPinConflicts(spec, result);

    // 2. 인터페이스 충돌 검사
    this.checkInterfaceConflicts(spec, result);

    // 3. 부트스트랩 핀 사용 검사
    this.checkBootstrapPins(spec, result);

    // 4. 안전 핀 사용 검사
    this.checkSafePins(spec, result);

    // 5. 라이브러리 의존성 검사
    this.checkLibraryDependencies(spec, result);

    // 6. 안전 등급 검사
    this.checkSafetyLevels(spec, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * 핀 충돌 검사
   */
  private checkPinConflicts(spec: SystemSpec, result: ValidationResult): void {
    const pinUsage: Map<string, string[]> = new Map();

    // 모든 컴포넌트의 핀 사용량 수집
    [...spec.sensors, ...spec.controls].forEach((component, componentIdx) => {
      for (let i = 0; i < component.count; i++) {
        const componentKey = `${component.type}_${componentIdx}_${i}_${component.model || component.type}`;
        const pin = spec.pinAssignments?.[componentKey];
        
        if (pin) {
          if (!pinUsage.has(pin)) {
            pinUsage.set(pin, []);
          }
          pinUsage.get(pin)!.push(componentKey);
        }
      }
    });

    // 충돌 검사
    pinUsage.forEach((components, pin) => {
      if (components.length > 1) {
        result.errors.push(`핀 ${pin}이 여러 컴포넌트에서 사용됨: ${components.join(', ')}`);
      }
    });
  }

  /**
   * 인터페이스 충돌 검사
   */
  private checkInterfaceConflicts(spec: SystemSpec, result: ValidationResult): void {
    const interfaceUsage: Map<string, string[]> = new Map();

    spec.sensors.forEach((sensor, sensorIdx) => {
      const model = modelsRegistry.sensors.find(s => s.model === sensor.model);
      if (model) {
        for (let i = 0; i < sensor.count; i++) {
          const componentKey = `sensor_${sensorIdx}_${i}_${sensor.model}`;
          const pin = spec.pinAssignments?.[componentKey];
          
          if (pin && model.iface) {
            const interfaceKey = `${model.iface}_${pin}`;
            if (!interfaceUsage.has(interfaceKey)) {
              interfaceUsage.set(interfaceKey, []);
            }
            interfaceUsage.get(interfaceKey)!.push(componentKey);
          }
        }
      }
    });

    // I2C 충돌 검사
    const i2cPins = new Set<string>();
    interfaceUsage.forEach((components, interfaceKey) => {
      if (interfaceKey.startsWith('i2c_')) {
        const pin = interfaceKey.split('_')[1];
        if (i2cPins.has(pin)) {
          result.errors.push(`I2C 핀 ${pin}이 여러 센서에서 사용됨: ${components.join(', ')}`);
        }
        i2cPins.add(pin);
      }
    });
  }

  /**
   * 부트스트랩 핀 사용 검사
   */
  private checkBootstrapPins(spec: SystemSpec, result: ValidationResult): void {
    const bootstrapPins = this.pinSafety.bootstraps || [];
    
    Object.entries(spec.pinAssignments || {}).forEach(([componentKey, pin]) => {
      if (bootstrapPins.includes(parseInt(pin))) {
        result.warnings.push(`부트스트랩 핀 ${pin} 사용: ${componentKey} - 부팅 시 문제 발생 가능`);
      }
    });
  }

  /**
   * 안전 핀 사용 검사
   */
  private checkSafePins(spec: SystemSpec, result: ValidationResult): void {
    const safeDigital = this.pinSafety.safeDigital || [];
    const safePWM = this.pinSafety.safePWM || [];
    const safeAnalog = this.pinSafety.safeAnalog || [];

    Object.entries(spec.pinAssignments || {}).forEach(([componentKey, pin]) => {
      const pinNum = parseInt(pin);
      
      if (!safeDigital.includes(pinNum)) {
        result.warnings.push(`비안전 핀 ${pin} 사용: ${componentKey} - 안정성 문제 가능`);
      }
    });
  }

  /**
   * 라이브러리 의존성 검사
   */
  private checkLibraryDependencies(spec: SystemSpec, result: ValidationResult): void {
    const allLibDeps = new Set<string>();
    const duplicateLibs = new Set<string>();

    [...spec.sensors, ...spec.controls].forEach(component => {
      const model = modelsRegistry.sensors.find(s => s.model === component.model) ||
                   modelsRegistry.actuators.find(a => a.model === component.model);
      
      if (model && model.libDeps) {
        model.libDeps.forEach(lib => {
          if (allLibDeps.has(lib)) {
            duplicateLibs.add(lib);
          } else {
            allLibDeps.add(lib);
          }
        });
      }
    });

    if (duplicateLibs.size > 0) {
      result.suggestions.push(`중복 라이브러리 발견: ${Array.from(duplicateLibs).join(', ')} - 버전 통일 권장`);
    }
  }

  /**
   * 안전 등급 검사
   */
  private checkSafetyLevels(spec: SystemSpec, result: ValidationResult): void {
    const highRiskComponents: string[] = [];

    spec.controls.forEach((control, controlIdx) => {
      const model = modelsRegistry.actuators.find(a => a.model === control.model);
      if (model && model.safetyLevel === 'HIGH') {
        for (let i = 0; i < control.count; i++) {
          highRiskComponents.push(`${model.label} ${i + 1}번`);
        }
      }
    });

    if (highRiskComponents.length > 0) {
      result.warnings.push(`고위험 컴포넌트 사용: ${highRiskComponents.join(', ')} - 안전 주의사항 확인 필수`);
    }
  }

  /**
   * 안전한 핀 자동 할당
   */
  autoAssignSafePins(spec: SystemSpec): PinAssignment {
    const assignments: PinAssignment = {};
    const availablePins = [...this.pinSafety.safeDigital];
    let pinIndex = 0;

    [...spec.sensors, ...spec.controls].forEach((component, componentIdx) => {
      for (let i = 0; i < component.count; i++) {
        const componentKey = `${component.type}_${componentIdx}_${i}_${component.model || component.type}`;
        
        // 이미 할당된 핀 사용
        if (spec.pinAssignments?.[componentKey]) {
          assignments[componentKey] = spec.pinAssignments[componentKey];
          continue;
        }

        // 안전한 핀 할당
        if (pinIndex < availablePins.length) {
          assignments[componentKey] = availablePins[pinIndex].toString();
          pinIndex++;
        } else {
          // 안전 핀이 부족한 경우 경고
          console.warn(`안전 핀 부족: ${componentKey}에 핀 할당 실패`);
        }
      }
    });

    return assignments;
  }

  /**
   * 토픽 규칙 검증
   */
  validateTopicRules(tenant: string, deviceId: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const pattern = modelsRegistry.topicRules.pattern;
    const expectedPattern = pattern.replace('{tenant}', tenant).replace('{deviceId}', deviceId);

    if (!deviceId || deviceId.length < 8) {
      result.errors.push('deviceId는 최소 8자 이상이어야 합니다');
    }

    if (!tenant || tenant.length < 2) {
      result.errors.push('tenant는 최소 2자 이상이어야 합니다');
    }

    result.suggestions.push(`토픽 패턴: ${expectedPattern}`);

    return result;
  }
}
