// 핀 자동 할당 시스템
import { esp32Pinmap, sensors, controls } from '../../../lib/iot-templates/index';

export type AssignedPin = { role: string; pin: number | string };
export type Allocation = {
  assigned: Record<string, AssignedPin[]>;
  conflicts: string[];
  sparePins: number[];
};

export function allocatePins(req: {
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
}): Allocation {
  console.log('🔧 allocatePins 호출됨:', req);
  const used = new Set<number|string>();
  const assigned: Record<string, AssignedPin[]> = {};
  const conflicts: string[] = [];

  const take = (prefer: readonly number[] | string[], label: string) => {
    const p = prefer.find(x => !used.has(x));
    if (p == null) { 
      conflicts.push(`가용 핀 부족: ${label}`); 
      return null; 
    }
    used.add(p);
    return p;
  };

  // I2C 예약 (고정 핀) - I2C 센서가 있을 때만 예약
  // used.add(esp32Pinmap.i2c.sda);
  // used.add(esp32Pinmap.i2c.scl);

  // 센서 핀 할당 (각 인스턴스마다 별도 키 사용)
  req.sensors.forEach(({ type, count }) => {
    console.log(`📡 센서 할당: ${type} (${count}개)`);
    const sensor = sensors.find(s => s.type === type);
    if (!sensor) {
      console.log(`❌ 센서 ${type}를 찾을 수 없음`);
      return;
    }

    // 각 인스턴스마다 별도의 키로 저장
    for (let i = 0; i < count; i++) {
      const instanceKey = `sensor_${type}_${i}`;
      const pins: AssignedPin[] = [];
      
      if ('i2c' in sensor.alloc && sensor.alloc.i2c) {
        // I2C 센서는 고정 핀 사용 (처음 한 번만 예약)
        if (!used.has(esp32Pinmap.i2c.sda)) {
          used.add(esp32Pinmap.i2c.sda);
          used.add(esp32Pinmap.i2c.scl);
        }
        pins.push({ role: 'I2C', pin: 'SDA/SCL' });
        console.log(`  📌 I2C 핀 할당: SDA/SCL`);
      } else if ('prefer' in sensor.alloc && sensor.alloc.prefer === 'onewire') {
        // OneWire는 같은 버스 공유 가능
        const pin = take(esp32Pinmap.onewire, `${sensor.name} ${i+1}`);
        if (pin) {
          pins.push({ role: 'DATA', pin });
          console.log(`  📌 OneWire 핀 할당: ${pin}`);
        }
      } else if ('prefer' in sensor.alloc && sensor.alloc.prefer === 'analog') {
        // 아날로그 센서
        const pin = take(['A0', 'A1', 'A2', 'A3'], `${sensor.name} ${i+1}`);
        if (pin) {
          pins.push({ role: 'SIG', pin });
          console.log(`  📌 아날로그 핀 할당: ${pin}`);
        }
      } else {
        // 디지털 센서
        const pin = take(esp32Pinmap.digital, `${sensor.name} ${i+1}`);
        if (pin) {
          pins.push({ role: 'DATA', pin });
          console.log(`  📌 디지털 핀 할당: ${pin}`);
        }
      }
      
      assigned[instanceKey] = pins;
      console.log(`✅ 센서 ${type} 인스턴스 ${i+1} 핀 할당 완료:`, pins);
    }
  });

  // 제어 핀 할당 (각 인스턴스마다 별도 키 사용)
  req.controls.forEach(({ type, count }) => {
    console.log(`🎛️ 제어장치 할당: ${type} (${count}개)`);
    const control = controls.find(c => c.type === type);
    if (!control) {
      console.log(`❌ 제어장치 ${type}를 찾을 수 없음`);
      return;
    }

    // 각 인스턴스마다 별도의 키로 저장
    for (let i = 0; i < count; i++) {
      const instanceKey = `control_${type}_${i}`;
      const pins: AssignedPin[] = [];
      
      if (control.control === 'pwm' || control.control === 'servo') {
        // PWM 핀 필요
        const pin = take(esp32Pinmap.pwm, `${control.name} ${i+1}`);
        if (pin) {
          pins.push({ role: 'PWM', pin });
          console.log(`  📌 PWM 핀 할당: ${pin}`);
        }
      } else {
        // 디지털 출력
        const pin = take(esp32Pinmap.digital, `${control.name} ${i+1}`);
        if (pin) {
          pins.push({ role: 'OUT', pin });
          console.log(`  📌 디지털 핀 할당: ${pin}`);
        }
      }
      
      assigned[instanceKey] = pins;
      console.log(`✅ 제어장치 ${type} 인스턴스 ${i+1} 핀 할당 완료:`, pins);
    }
  });

  const sparePins = esp32Pinmap.digital.filter(p => !used.has(p));
  console.log('🎯 최종 할당 결과:', { assigned, conflicts, sparePins });
  return { assigned, conflicts, sparePins };
}

// 핀 충돌 검사
export function checkConflicts(allocation: Allocation): string[] {
  const conflicts: string[] = [];
  
  // 중복 핀 사용 검사
  const pinUsage = new Map<number|string, string[]>();
  
  Object.entries(allocation.assigned).forEach(([device, pins]) => {
    pins.forEach(({ pin, role }) => {
      if (!pinUsage.has(pin)) {
        pinUsage.set(pin, []);
      }
      pinUsage.get(pin)!.push(`${device}(${role})`);
    });
  });
  
  pinUsage.forEach((devices, pin) => {
    if (devices.length > 1) {
      conflicts.push(`핀 ${pin} 충돌: ${devices.join(', ')}`);
    }
  });
  
  return conflicts;
}
