// IoT Designer - 센서/제어 카탈로그 및 디바이스 핀맵
export type Voltage = 3.3 | 5 | 12 | 24;
export type ControlType = 'boolean' | 'pwm' | 'servo' | 'stepper';
export type Protocol = 'http' | 'mqtt' | 'websocket' | 'webhook' | 'serial' | 'ble' | 'rs485';

// 디바이스별 핀맵 정의
export const devicePinmaps = {
  esp32: {
    digital: [2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],
    pwm:     [2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],
    onewire: [2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],
    i2c:     { sda: 21, scl: 22 },
    analog:  [36,39,34,35,32,33],
    uart:    [
      { tx: 1, rx: 3, name: 'UART0' },    // USB Serial
      { tx: 17, rx: 16, name: 'UART2' },  // RS-485용
      { tx: 14, rx: 15, name: 'UART1' }   // 추가 UART
    ]
  },
  esp8266: {
    digital: [0,1,2,3,4,5,12,13,14,15,16],
    pwm:     [0,1,2,3,4,5,12,13,14,15,16],
    onewire: [2,4,5,12,13,14,15,16],
    i2c:     { sda: 4, scl: 5 },
    analog:  ['A0'],
    uart:    [
      { tx: 1, rx: 3, name: 'UART0' }
    ]
  },
  arduino_uno: {
    digital: [2,3,4,5,6,7,8,9,10,11,12,13],
    pwm:     [3,5,6,9,10,11],
    onewire: [2,3,4,5,6,7,8,9,10,11,12,13],
    i2c:     { sda: 'A4', scl: 'A5' },
    analog:  ['A0','A1','A2','A3','A4','A5'],
    uart:    [
      { tx: 1, rx: 0, name: 'UART0' }
    ]
  },
  arduino_r4: {
    digital: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],
    pwm:     [3,5,6,9,10,11,14,15,16,17,18,19,20,21,22,23],
    onewire: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],
    i2c:     { sda: 'A4', scl: 'A5' },
    analog:  ['A0','A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11'],
    uart:    [
      { tx: 1, rx: 0, name: 'UART0' },
      { tx: 8, rx: 9, name: 'UART1' }
    ]
  },
  raspberry_pi5: {
    digital: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27],
    pwm:     [12,13,18,19],
    onewire: [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27],
    i2c:     { sda: 2, scl: 3 },
    analog:  [], // ADC 모듈 필요
    uart:    [
      { tx: 14, rx: 15, name: 'UART0' }
    ]
  }
} as const;

// 하위 호환성을 위한 esp32Pinmap
export const esp32Pinmap = devicePinmaps.esp32;

export const sensors = [
  {
    type: 'dht22',
    name: 'DHT22',
    pins: ['DATA','VCC','GND'],
    requires: [{ part: 'resistor', value: '4.7kΩ', between: 'DATA-3.3V' }],
    power: { voltage: 3.3 as Voltage, current_mA: 2 },
    bus: 'single-wire',
    alloc: { prefer: 'digital', count: 1 }
  },
  {
    type: 'ds18b20',
    name: 'DS18B20',
    pins: ['DATA','VCC','GND'],
    requires: [{ part: 'resistor', value: '4.7kΩ', between: 'DATA-3.3V' }],
    power: { voltage: 3.3 as Voltage, current_mA: 1.5 },
    bus: 'onewire',
    alloc: { prefer: 'onewire', count: 1 }
  },
  {
    type: 'bh1750',
    name: 'BH1750(조도)',
    pins: ['SDA','SCL','VCC','GND'],
    power: { voltage: 3.3 as Voltage, current_mA: 0.12 },
    bus: 'i2c',
    alloc: { i2c: true }
  },
  {
    type: 'soil_moisture',
    name: '토양 수분',
    pins: ['SIG','VCC','GND'],
    power: { voltage: 3.3 as Voltage, current_mA: 5 },
    bus: 'analog',
    alloc: { prefer: 'analog', count: 1 }
  },
  {
    type: 'ph_sensor',
    name: 'pH 센서',
    pins: ['SIG','VCC','GND'],
    power: { voltage: 3.3 as Voltage, current_mA: 3 },
    bus: 'analog',
    alloc: { prefer: 'analog', count: 1 }
  },
  {
    type: 'co2_sensor',
    name: 'CO2 센서',
    pins: ['SIG','VCC','GND'],
    power: { voltage: 5 as Voltage, current_mA: 150 },
    bus: 'analog',
    alloc: { prefer: 'analog', count: 1 }
  },
  {
    type: 'pressure_sensor',
    name: '압력 센서',
    pins: ['SIG','VCC','GND'],
    power: { voltage: 3.3 as Voltage, current_mA: 1 },
    bus: 'analog',
    alloc: { prefer: 'analog', count: 1 }
  },
  {
    type: 'motion_sensor',
    name: 'PIR 모션 센서',
    pins: ['OUT','VCC','GND'],
    power: { voltage: 5 as Voltage, current_mA: 65 },
    bus: 'digital',
    alloc: { prefer: 'digital', count: 1 }
  },
  {
    type: 'water_level',
    name: '수위 센서',
    pins: ['SIG','VCC','GND'],
    power: { voltage: 3.3 as Voltage, current_mA: 2 },
    bus: 'analog',
    alloc: { prefer: 'analog', count: 1 }
  },
  {
    type: 'camera',
    name: '카메라 모듈',
    pins: ['SDA','SCL','VCC','GND'],
    power: { voltage: 3.3 as Voltage, current_mA: 200 },
    bus: 'i2c',
    alloc: { i2c: true }
  }
] as const;

export const controls = [
  {
    type: 'relay',
    name: '릴레이(채널1)',
    control: 'boolean' as ControlType,
    driver: 'relay-module',
    pins: ['IN','VCC','GND'],
    power: { voltage: 5 as Voltage, current_mA: 70 }, // 모듈 구동
    load_note: '부하 전원 분리, 공통접지, 광절연 권장'
  },
  {
    type: 'dc_fan_pwm',
    name: 'DC 팬(PWM)',
    control: 'pwm' as ControlType,
    driver: 'motor-driver',
    pins: ['PWM','DIR?','VCC','GND'],
    power: { voltage: 12 as Voltage, current_mA: 800 },
    load_note: '드라이버 사용, 역기전력 보호'
  },
  {
    type: 'servo',
    name: '서보',
    control: 'servo' as ControlType,
    pins: ['PWM','VCC','GND'],
    power: { voltage: 5 as Voltage, current_mA: 500 },
    load_note: '서보 전원 분리, GND 공통'
  },
  {
    type: 'led_strip',
    name: 'LED 스트립',
    control: 'pwm' as ControlType,
    pins: ['PWM','VCC','GND'],
    power: { voltage: 5 as Voltage, current_mA: 300 },
    load_note: '전류 제한 저항 필요'
  },
  {
    type: 'solenoid_valve',
    name: '솔레노이드 밸브',
    control: 'boolean' as ControlType,
    driver: 'relay-module',
    pins: ['IN','VCC','GND'],
    power: { voltage: 12 as Voltage, current_mA: 200 },
    load_note: '릴레이 모듈로 구동, 역기전력 보호'
  },
  {
    type: 'stepper_motor',
    name: '스테퍼 모터',
    control: 'stepper' as ControlType,
    driver: 'stepper-driver',
    pins: ['STEP','DIR','EN','VCC','GND'],
    power: { voltage: 12 as Voltage, current_mA: 1000 },
    load_note: '스테퍼 드라이버 필요, 전원 분리 권장'
  },
  {
    type: 'water_pump',
    name: '워터 펌프',
    control: 'pwm' as ControlType,
    driver: 'motor-driver',
    pins: ['PWM','VCC','GND'],
    power: { voltage: 12 as Voltage, current_mA: 500 },
    load_note: '모터 드라이버 사용, 역기전력 보호'
  },
  {
    type: 'heater',
    name: '히터',
    control: 'pwm' as ControlType,
    driver: 'relay-module',
    pins: ['IN','VCC','GND'],
    power: { voltage: 24 as Voltage, current_mA: 2000 },
    load_note: '고전압 주의, 릴레이 모듈 필수'
  },
  {
    type: 'buzzer',
    name: '부저',
    control: 'pwm' as ControlType,
    pins: ['PWM','VCC','GND'],
    power: { voltage: 5 as Voltage, current_mA: 30 },
    load_note: '직접 구동 가능'
  },
  {
    type: 'lcd_display',
    name: 'LCD 디스플레이',
    control: 'boolean' as ControlType,
    pins: ['SDA','SCL','VCC','GND'],
    power: { voltage: 5 as Voltage, current_mA: 20 },
    load_note: 'I2C 통신, 백라이트 제어 가능'
  }
] as const;

// 키워드 매핑 (자연어 파싱용)
export const keywordMapping = {
  // 센서 키워드
  '온도': 'dht22',
  '습도': 'dht22', 
  '토양': 'soil_moisture',
  '수분': 'soil_moisture',
  '조도': 'bh1750',
  'ph': 'ph_sensor',
  'ph센서': 'ph_sensor',
  'co2': 'co2_sensor',
  '압력': 'pressure_sensor',
  '모션': 'motion_sensor',
  '수위': 'water_level',
  '카메라': 'camera',
  
  // 제어 키워드
  '릴레이': 'relay',
  '스프링클러': 'relay',
  '조명': 'led_strip',
  '팬': 'dc_fan_pwm',
  '모터': 'dc_fan_pwm',
  '서보': 'servo',
  '밸브': 'solenoid_valve',
  '솔레노이드': 'solenoid_valve',
  '스테퍼': 'stepper_motor',
  '펌프': 'water_pump',
  '히터': 'heater',
  '부저': 'buzzer',
  '디스플레이': 'lcd_display',
  'lcd': 'lcd_display'
} as const;

// 전원 요구사항 계산
export function estimatePower(items: Array<{ voltage: number; current_mA: number; count: number }>) {
  const byVoltage = new Map<number, number>();
  for (const it of items) {
    const sum = (byVoltage.get(it.voltage) || 0) + it.current_mA * it.count;
    byVoltage.set(it.voltage, sum);
  }
  // 50% 여유 권장
  return Array.from(byVoltage.entries())
    .map(([v, mA]) => ({ voltage: v, minCurrentA: +(mA/1000*1.5).toFixed(2) }));
}
