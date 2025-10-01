// IoT Designer - 센서/제어 카탈로그 및 ESP32 핀맵
export type Voltage = 3.3 | 5 | 12 | 24;
export type ControlType = 'boolean' | 'pwm' | 'servo' | 'stepper';

export const esp32Pinmap = {
  digital: [2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],
  pwm:     [2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],
  onewire: [4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],
  i2c:     { sda: 21, scl: 22 }
} as const;

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
  
  // 제어 키워드
  '릴레이': 'relay',
  '스프링클러': 'relay',
  '조명': 'led_strip',
  '팬': 'dc_fan_pwm',
  '모터': 'dc_fan_pwm',
  '서보': 'servo',
  '밸브': 'solenoid_valve',
  '솔레노이드': 'solenoid_valve'
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
