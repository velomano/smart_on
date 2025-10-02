// 핀 자동 할당 시스템
<<<<<<< HEAD
import { esp32Pinmap, sensors, controls } from '../../../lib/iot-templates/index';
=======
import { esp32Pinmap, sensors, controls } from '@/lib/iot-templates/index';
>>>>>>> dc17f9bdf342b9bb54af2c88a33587ba61dacf39

export type AssignedPin = { role: string; pin: number | string };
export type Allocation = {
  assigned: Record<string, AssignedPin[]>;
  conflicts: string[];
  sparePins: (number | string)[];
};

// 디바이스별 핀맵 정의
const devicePinmaps: Record<string, any> = {
  esp32: esp32Pinmap,
  esp8266: {
    digital: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
    pwm: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
    analog: ['A0'],
    i2c: { sda: 'D2', scl: 'D1' },
    onewire: ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8']
  },
  arduino_uno: {
    digital: ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'],
    pwm: ['D3', 'D5', 'D6', 'D9', 'D10', 'D11'],
    analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
    i2c: { sda: 'A4', scl: 'A5' },
    onewire: ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13']
  },
  arduino_r4: {
    digital: ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'],
    pwm: ['D3', 'D5', 'D6', 'D9', 'D10', 'D11'],
    analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
    i2c: { sda: 'A4', scl: 'A5' },
    onewire: ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13']
  },
  raspberry_pi5: {
    digital: ['GPIO2', 'GPIO3', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO20', 'GPIO21', 'GPIO22'],
    pwm: ['GPIO12', 'GPIO13', 'GPIO18', 'GPIO19'],
    analog: [], // Raspberry Pi는 기본적으로 아날로그 핀이 없음
    i2c: { sda: 'GPIO2', scl: 'GPIO3' },
    onewire: ['GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO20', 'GPIO21', 'GPIO22']
  }
};

export function allocatePins(req: {
  device: string;
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  protocol?: string; // 통신 프로토콜 (UART/RS-485용)
}): Allocation {
  console.log('🔧 allocatePins 호출됨:', req);
  const used = new Set<number|string>();
  const assigned: Record<string, AssignedPin[]> = {};
  const conflicts: string[] = [];

<<<<<<< HEAD
  // 디바이스별 핀맵 가져오기
  const pinmap = devicePinmaps[req.device] || devicePinmaps['esp32'];
  console.log(`📌 사용할 핀맵: ${req.device}`, pinmap);

  const take = (prefer: readonly number[] | string[], label: string) => {
=======
  const take = (prefer: readonly (number | string)[], label: string) => {
>>>>>>> dc17f9bdf342b9bb54af2c88a33587ba61dacf39
    const p = prefer.find(x => !used.has(x));
    if (p == null) { 
      conflicts.push(`가용 핀 부족: ${label}`); 
      return null; 
    }
    used.add(p);
    return p;
  };

  // I2C 예약 (고정 핀) - I2C 센서가 있을 때만 예약
  // used.add(pinmap.i2c.sda);
  // used.add(pinmap.i2c.scl);

<<<<<<< HEAD
  // 센서 핀 할당 (각 인스턴스마다 별도 키 사용)
=======
  // UART/RS-485 핀 예약 (프로토콜에 따라)
  if (req.protocol === 'serial' || req.protocol === 'rs485' || req.protocol === 'modbus-tcp') {
    // UART 핀 예약 (TX, RX) - 첫 번째 UART 사용
    if (esp32Pinmap.uart && esp32Pinmap.uart.length > 0) {
      const uart = esp32Pinmap.uart[0]; // 첫 번째 UART 사용
      used.add(uart.tx);
      used.add(uart.rx);
      assigned['uart_comm'] = [
        { role: 'TX', pin: uart.tx },
        { role: 'RX', pin: uart.rx }
      ];
    }
    
    // RS-485의 경우 DE(Data Enable) 핀도 예약
    if (req.protocol === 'rs485') {
      // DE 핀은 디지털 핀 중 하나 사용
      const dePin = take(esp32Pinmap.digital, 'RS-485 DE');
      if (dePin) {
        assigned['rs485_de'] = [{ role: 'DE', pin: dePin }];
      }
      
      // RS-485 종단 저항 제어 핀 (선택적)
      const termPin = take(esp32Pinmap.digital, 'RS-485 Term');
      if (termPin) {
        assigned['rs485_term'] = [{ role: 'TERM', pin: termPin }];
      }
    }
  }

  // 센서 핀 할당
>>>>>>> dc17f9bdf342b9bb54af2c88a33587ba61dacf39
  req.sensors.forEach(({ type, count }) => {
    console.log(`📡 센서 할당: ${type} (${count}개)`);
    const sensor = sensors.find(s => s.type === type);
    if (!sensor) {
      console.log(`❌ 센서 ${type}를 찾을 수 없음`);
      return;
    }

    // 각 인스턴스마다 별도의 키로 저장
    for (let i = 0; i < count; i++) {
<<<<<<< HEAD
      const instanceKey = `sensor_${type}_${i}`;
      const pins: AssignedPin[] = [];
      
      if ('i2c' in sensor.alloc && sensor.alloc.i2c) {
        // I2C 센서는 고정 핀 사용 (처음 한 번만 예약)
        if (!used.has(pinmap.i2c.sda)) {
          used.add(pinmap.i2c.sda);
          used.add(pinmap.i2c.scl);
        }
        pins.push({ role: 'I2C', pin: 'SDA/SCL' });
        console.log(`  📌 I2C 핀 할당: SDA/SCL`);
      } else if ('prefer' in sensor.alloc && sensor.alloc.prefer === 'onewire') {
        // OneWire는 같은 버스 공유 가능
        const pin = take(pinmap.onewire, `${sensor.name} ${i+1}`);
        if (pin) {
          pins.push({ role: 'DATA', pin });
          console.log(`  📌 OneWire 핀 할당: ${pin}`);
        }
=======
      if ('i2c' in sensor.alloc && sensor.alloc.i2c) {
        // I2C 센서는 고정 핀 사용
        pins.push({ role: 'I2C', pin: 'SDA/SCL' });
      } else if ('prefer' in sensor.alloc && sensor.alloc.prefer === 'onewire') {
        // OneWire는 같은 버스 공유 가능
        const pin = take(esp32Pinmap.onewire, `${sensor.name} ${i+1}`);
        if (pin) pins.push({ role: 'DATA', pin });
>>>>>>> dc17f9bdf342b9bb54af2c88a33587ba61dacf39
      } else if ('prefer' in sensor.alloc && sensor.alloc.prefer === 'analog') {
        // 아날로그 센서
        const pin = take(pinmap.analog, `${sensor.name} ${i+1}`);
        if (pin) {
          pins.push({ role: 'SIG', pin });
          console.log(`  📌 아날로그 핀 할당: ${pin}`);
        }
      } else {
        // 디지털 센서
        const pin = take(pinmap.digital, `${sensor.name} ${i+1}`);
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
        const pin = take(pinmap.pwm, `${control.name} ${i+1}`);
        if (pin) {
          pins.push({ role: 'PWM', pin });
          console.log(`  📌 PWM 핀 할당: ${pin}`);
        }
      } else {
        // 디지털 출력
        const pin = take(pinmap.digital, `${control.name} ${i+1}`);
        if (pin) {
          pins.push({ role: 'OUT', pin });
          console.log(`  📌 디지털 핀 할당: ${pin}`);
        }
      }
      
      assigned[instanceKey] = pins;
      console.log(`✅ 제어장치 ${type} 인스턴스 ${i+1} 핀 할당 완료:`, pins);
    }
  });

  const sparePins = pinmap.digital.filter(p => !used.has(p));
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
