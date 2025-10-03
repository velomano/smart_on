// ESP32 핀 정책 정의
export const BOOT_STRAP_PINS = new Set([0, 2, 4, 12, 15]); // 5도 회피 권장
export const INPUT_ONLY_PINS = new Set([34, 35, 36, 37, 38, 39]); // 입력 전용 핀
export const RECOMMENDED_OUTPUT = new Set([16, 17, 18, 19, 23, 25, 26, 27, 32, 33]);

// 금지 핀 체크
export function isForbiddenOutputPin(pin: number): boolean {
  return BOOT_STRAP_PINS.has(pin) || INPUT_ONLY_PINS.has(pin);
}

// 액추에이터 핀 검증
export function validateActuatorPins(pins: number[]): string[] {
  const errors: string[] = [];
  for (const pin of pins) {
    if (isForbiddenOutputPin(pin)) {
      if (BOOT_STRAP_PINS.has(pin)) {
        errors.push(`부팅 스트랩 핀 사용 금지: GPIO${pin}`);
      } else if (INPUT_ONLY_PINS.has(pin)) {
        errors.push(`입력 전용 핀 사용 금지: GPIO${pin}`);
      }
    }
  }
  return errors;
}

// I2C 핀 검증 (고정)
export function validateI2C(sda: number, scl: number): string[] {
  const errors: string[] = [];
  if (sda !== 21) {
    errors.push(`I2C SDA는 GPIO21로 고정해야 합니다 (현재: GPIO${sda})`);
  }
  if (scl !== 22) {
    errors.push(`I2C SCL는 GPIO22로 고정해야 합니다 (현재: GPIO${scl})`);
  }
  return errors;
}

// DHT22 핀 검증
export function validateDhtPin(pin: number): string[] {
  if (isForbiddenOutputPin(pin)) {
    return [`DHT22 데이터 핀 금지 핀 사용: GPIO${pin}`];
  }
  return [];
}

// PWM 지원 핀 체크
export function isPwmSupportedPin(pin: number): boolean {
  const pwmPins = new Set([2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33]);
  return pwmPins.has(pin) && !isForbiddenOutputPin(pin);
}

// 안전한 출력 핀 목록 반환
export function getSafeOutputPins(): number[] {
  return Array.from(RECOMMENDED_OUTPUT).sort((a, b) => a - b);
}

// PWM 지원 안전 핀 목록 반환
export function getSafePwmPins(): number[] {
  return getSafeOutputPins().filter(isPwmSupportedPin);
}
