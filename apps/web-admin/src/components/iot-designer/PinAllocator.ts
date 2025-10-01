// 핀 자동 할당 시스템
import { esp32Pinmap, sensors, controls } from 'iot-templates';

export type AssignedPin = { role: string; pin: number | string };
export type Allocation = {
  assigned: Record<string, AssignedPin[]>;
  conflicts: string[];
  sparePins: number[];
};

export function allocatePins(req: {
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  protocol?: string; // 통신 프로토콜 (UART/RS-485용)
}): Allocation {
  const used = new Set<number|string>();
  const assigned: Record<string, AssignedPin[]> = {};
  const conflicts: string[] = [];

  const take = (prefer: number[], label: string) => {
    const p = prefer.find(x => !used.has(x));
    if (p == null) { 
      conflicts.push(`가용 핀 부족: ${label}`); 
      return null; 
    }
    used.add(p);
    return p;
  };

  // I2C 예약 (고정 핀)
  used.add(esp32Pinmap.i2c.sda);
  used.add(esp32Pinmap.i2c.scl);

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
  req.sensors.forEach(({ type, count }) => {
    const sensor = sensors.find(s => s.type === type);
    if (!sensor) return;

    const pins: AssignedPin[] = [];
    
    for (let i = 0; i < count; i++) {
      if (sensor.alloc.i2c) {
        // I2C 센서는 고정 핀 사용
        pins.push({ role: 'I2C', pin: 'SDA/SCL' });
      } else if (sensor.alloc.prefer === 'onewire') {
        // OneWire는 같은 버스 공유 가능
        const pin = take(esp32Pinmap.onewire, `${sensor.name} ${i+1}`);
        if (pin) pins.push({ role: 'DATA', pin });
      } else if (sensor.alloc.prefer === 'analog') {
        // 아날로그 센서
        const pin = take(['A0', 'A1', 'A2', 'A3'], `${sensor.name} ${i+1}`);
        if (pin) pins.push({ role: 'SIG', pin });
      } else {
        // 디지털 센서
        const pin = take(esp32Pinmap.digital, `${sensor.name} ${i+1}`);
        if (pin) pins.push({ role: 'DATA', pin });
      }
    }
    
    assigned[`sensor_${type}`] = pins;
  });

  // 제어 핀 할당
  req.controls.forEach(({ type, count }) => {
    const control = controls.find(c => c.type === type);
    if (!control) return;

    const pins: AssignedPin[] = [];
    
    for (let i = 0; i < count; i++) {
      if (control.control === 'pwm' || control.control === 'servo') {
        // PWM 핀 필요
        const pin = take(esp32Pinmap.pwm, `${control.name} ${i+1}`);
        if (pin) pins.push({ role: 'PWM', pin });
      } else {
        // 디지털 출력
        const pin = take(esp32Pinmap.digital, `${control.name} ${i+1}`);
        if (pin) pins.push({ role: 'OUT', pin });
      }
    }
    
    assigned[`control_${type}`] = pins;
  });

  const sparePins = esp32Pinmap.digital.filter(p => !used.has(p));
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
