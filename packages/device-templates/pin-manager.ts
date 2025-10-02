/**
 * Universal IoT Pin Manager
 * 핀 충돌 방지 및 스마트 할당 시스템
 */

export interface PinInfo {
  pin: string;
  type: 'digital' | 'pwm' | 'analog' | 'i2c' | 'spi' | 'uart';
  reserved: boolean;
  usedBy?: string;
  powerConsumption: number;
  voltage: number;
}

export interface DevicePinMap {
  [device: string]: {
    digital: string[];
    pwm: string[];
    analog: string[];
    i2c: string[];
    spi: string[];
    uart: string[];
    bootstraps: string[]; // 부팅 시 사용되는 핀
    reserved: string[]; // 예약된 핀
  };
}

export class PinManager {
  private devicePinMaps: DevicePinMap = {
    'esp32': {
      digital: ['GPIO2', 'GPIO4', 'GPIO5', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO21', 'GPIO22', 'GPIO23', 'GPIO25', 'GPIO26', 'GPIO27', 'GPIO32', 'GPIO33'],
      pwm: ['GPIO2', 'GPIO4', 'GPIO5', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO21', 'GPIO22', 'GPIO23', 'GPIO25', 'GPIO26', 'GPIO27', 'GPIO32', 'GPIO33'],
      analog: ['GPIO32', 'GPIO33', 'GPIO34', 'GPIO35', 'GPIO36', 'GPIO39'],
      i2c: ['GPIO21', 'GPIO22'], // SDA, SCL
      spi: ['GPIO23', 'GPIO19', 'GPIO18', 'GPIO5'], // MOSI, MISO, CLK, CS
      uart: ['GPIO1', 'GPIO3'], // TX, RX
      bootstraps: ['GPIO0', 'GPIO2', 'GPIO12', 'GPIO15'], // 부팅 시 사용
      reserved: ['GPIO21', 'GPIO22'] // I2C 전용
    },
    'esp8266': {
      digital: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
      pwm: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
      analog: ['A0'],
      i2c: ['D1', 'D2'], // SDA, SCL
      spi: ['D7', 'D6', 'D5', 'D8'], // MOSI, MISO, CLK, CS
      uart: ['D0', 'D1'], // TX, RX
      bootstraps: ['D0', 'D2', 'D15'], // 부팅 시 사용
      reserved: ['D1', 'D2'] // I2C 전용
    },
    'arduino_uno': {
      digital: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
      pwm: ['3', '5', '6', '9', '10', '11'],
      analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
      i2c: ['A4', 'A5'], // SDA, SCL
      spi: ['10', '11', '12', '13'], // MOSI, MISO, CLK, CS
      uart: ['0', '1'], // TX, RX
      bootstraps: ['0', '1'], // 부팅 시 사용
      reserved: ['A4', 'A5'] // I2C 전용
    },
    'arduino_r4': {
      digital: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
      pwm: ['3', '5', '6', '9', '10', '11'],
      analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
      i2c: ['A4', 'A5'], // SDA, SCL
      spi: ['10', '11', '12', '13'], // MOSI, MISO, CLK, CS
      uart: ['0', '1'], // TX, RX
      bootstraps: ['0', '1'], // 부팅 시 사용
      reserved: ['A4', 'A5'] // I2C 전용
    },
    'raspberry_pi5': {
      digital: ['GPIO2', 'GPIO3', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO20', 'GPIO21', 'GPIO22', 'GPIO23', 'GPIO24', 'GPIO25', 'GPIO26', 'GPIO27'],
      pwm: ['GPIO12', 'GPIO13', 'GPIO18', 'GPIO19'],
      analog: ['GPIO26', 'GPIO27'],
      i2c: ['GPIO2', 'GPIO3'], // SDA, SCL
      spi: ['GPIO10', 'GPIO9', 'GPIO11', 'GPIO8'], // MOSI, MISO, CLK, CS
      uart: ['GPIO14', 'GPIO15'], // TX, RX
      bootstraps: ['GPIO2', 'GPIO3'], // 부팅 시 사용
      reserved: ['GPIO2', 'GPIO3'] // I2C 전용
    }
  };

  private pinAssignments: Record<string, string> = {};
  private reservedPins: Set<string> = new Set();

  constructor(device: string) {
    this.reserveSystemPins(device);
  }

  private reserveSystemPins(device: string): void {
    const deviceMap = this.devicePinMaps[device];
    if (deviceMap) {
      // I2C 핀 예약
      deviceMap.reserved.forEach(pin => {
        this.reservedPins.add(pin);
      });
      
      // 부팅스트랩 핀 예약
      deviceMap.bootstraps.forEach(pin => {
        this.reservedPins.add(pin);
      });
    }
  }

  /**
   * 센서/액추에이터에 핀 할당
   */
  assignPin(component: string, preferredType: 'digital' | 'pwm' | 'analog' | 'i2c' | 'spi' | 'uart', device: string): string | null {
    const deviceMap = this.devicePinMaps[device];
    if (!deviceMap) return null;

    const availablePins = this.getAvailablePins(device, preferredType);
    
    if (availablePins.length === 0) {
      console.warn(`No available ${preferredType} pins for ${component}`);
      return null;
    }

    // 첫 번째 사용 가능한 핀 할당
    const assignedPin = availablePins[0];
    this.pinAssignments[component] = assignedPin;
    
    console.log(`Assigned ${preferredType} pin ${assignedPin} to ${component}`);
    return assignedPin;
  }

  /**
   * 사용 가능한 핀 목록 반환
   */
  getAvailablePins(device: string, type: 'digital' | 'pwm' | 'analog' | 'i2c' | 'spi' | 'uart'): string[] {
    const deviceMap = this.devicePinMaps[device];
    if (!deviceMap) return [];

    const pinsOfType = deviceMap[type] || [];
    
    return pinsOfType.filter(pin => {
      // 예약된 핀이 아닌지 확인
      if (this.reservedPins.has(pin)) return false;
      
      // 이미 할당된 핀이 아닌지 확인
      const isAssigned = Object.values(this.pinAssignments).includes(pin);
      return !isAssigned;
    });
  }

  /**
   * 핀 할당 해제
   */
  releasePin(component: string): void {
    if (this.pinAssignments[component]) {
      delete this.pinAssignments[component];
      console.log(`Released pin for ${component}`);
    }
  }

  /**
   * 핀 충돌 검사
   */
  checkPinConflicts(device: string): string[] {
    const conflicts: string[] = [];
    const deviceMap = this.devicePinMaps[device];
    
    if (!deviceMap) return conflicts;

    // I2C 핀 충돌 검사
    const i2cPins = deviceMap.i2c;
    Object.entries(this.pinAssignments).forEach(([component, pin]) => {
      if (i2cPins.includes(pin) && !component.includes('pressure') && !component.includes('i2c')) {
        conflicts.push(`${component} is using I2C pin ${pin}`);
      }
    });

    // 부팅스트랩 핀 충돌 검사
    const bootstrapPins = deviceMap.bootstraps;
    Object.entries(this.pinAssignments).forEach(([component, pin]) => {
      if (bootstrapPins.includes(pin)) {
        conflicts.push(`${component} is using bootstrap pin ${pin}`);
      }
    });

    return conflicts;
  }

  /**
   * 현재 핀 할당 상태 반환
   */
  getPinAssignments(): Record<string, string> {
    return { ...this.pinAssignments };
  }

  /**
   * 디바이스별 핀맵 반환
   */
  getDevicePinMap(device: string): any {
    return this.devicePinMaps[device] || null;
  }

  /**
   * 센서 타입별 권장 핀 타입 반환
   */
  getRecommendedPinType(sensorType: string): 'digital' | 'pwm' | 'analog' | 'i2c' | 'spi' | 'uart' {
    const pinTypeMap: Record<string, 'digital' | 'pwm' | 'analog' | 'i2c' | 'spi' | 'uart'> = {
      'temperature': 'analog',
      'pressure': 'i2c',
      'humidity': 'digital',
      'light': 'analog',
      'motion': 'digital',
      'distance': 'digital',
      'gas': 'analog',
      'relay': 'digital',
      'dc-motor': 'pwm',
      'servo': 'pwm',
      'stepper': 'digital',
      'led': 'pwm',
      'buzzer': 'pwm'
    };

    return pinTypeMap[sensorType] || 'digital';
  }

  /**
   * 전력 소비 계산
   */
  calculatePowerConsumption(components: Array<{type: string, count: number}>): number {
    const powerMap: Record<string, number> = {
      'temperature': 5,
      'pressure': 10,
      'humidity': 2.5,
      'light': 0.12,
      'motion': 65,
      'distance': 15,
      'gas': 800,
      'relay': 50,
      'dc-motor': 200,
      'servo': 100,
      'stepper': 200,
      'led': 20,
      'buzzer': 30
    };

    let totalPower = 0;
    components.forEach(component => {
      const powerPerUnit = powerMap[component.type] || 0;
      totalPower += powerPerUnit * component.count;
    });

    return totalPower;
  }
}
