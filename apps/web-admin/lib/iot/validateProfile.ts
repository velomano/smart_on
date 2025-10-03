import Ajv from "ajv";
import schema from "../../../../../packages/shared-iot/config/hardwareProfile.schema.json";
import { getBoard, BoardKey } from "../../../../../packages/shared-iot/boards";

const ajv = new Ajv({ allErrors: true });

export function validateHardwareProfile(profile: any) {
  const errs: string[] = [];
  const validate = ajv.compile(schema as any);
  const ok = validate(profile);
  if (!ok) (validate.errors||[]).forEach(e=>errs.push(`${e.instancePath||"/"} ${e.message}`));

  const boardKey = profile?.board as BoardKey;
  const b = getBoard(boardKey);
  if (!b) errs.push(`Unknown board: ${boardKey}`);

  // I2C 강제(보드 레지스트리와 일치)
  if (b) {
    const ps = String(profile?.i2c?.sda);
    const pc = String(profile?.i2c?.scl);
    if (String(b.i2c.sda) !== ps || String(b.i2c.scl) !== pc) {
      errs.push(`I2C mismatch: expected SDA=${b.i2c.sda} SCL=${b.i2c.scl}, got SDA=${ps} SCL=${pc}`);
    }
  }

  // RPi: WS2812B는 GPIO18 권장
  if (/raspberry-pi/.test(boardKey)) {
    const ws = profile?.actuators?.find((a:any)=>/ws2812|neopixel/i.test(a.name));
    if (ws && ws.pin != null && (b as any).ws2812Preferred != null && ws.pin !== (b as any).ws2812Preferred) {
      errs.push(`WS2812B should use GPIO${(b as any).ws2812Preferred} on ${boardKey} (got ${ws.pin})`);
    }
    // 하드웨어 PWM 핀 확인(12,13,18,19)
    for (const a of (profile?.actuators||[])) {
      if (/pwm.*led/i.test(a.name) && a.pin != null && !(b as any).hwPwmPins?.includes(a.pin)) {
        errs.push(`PWM LED uses non-HW-PWM pin GPIO${a.pin}. Use one of ${(b as any).hwPwmPins}`);
      }
    }
    // 다핀 장치 검사
    const dimmer = profile?.actuators?.find((a:any)=>/dimmer/i.test(a.name));
    if (dimmer && !(dimmer.pins && dimmer.pins.zcd!=null && dimmer.pins.triac!=null)) {
      errs.push(`AC Dimmer requires pins.zcd + pins.triac`);
    }
    const motor = profile?.actuators?.find((a:any)=>/tb6612/i.test(a.name));
    if (motor && !(motor.pins && motor.pins.pwm!=null && motor.pins.in1!=null && motor.pins.in2!=null)) {
      errs.push(`TB6612 requires pins.pwm + pins.in1 + pins.in2`);
    }
    // 예약 핀 사용 금지
    for (const a of (profile?.actuators||[])) {
      const pins = a.pin!=null ? [a.pin] : Object.values(a.pins||{});
      for (const p of pins) {
        if ((b as any).reservedPins?.includes(p)) errs.push(`Reserved pin used: GPIO${p} (${a.name})`);
      }
    }
  }

  // ESP32: 금지/입력전용 출력 금지
  if (boardKey === "esp32-wroom") {
    for (const a of (profile?.actuators||[])) {
      const pins = a.pin!=null ? [a.pin] : Object.values(a.pins||{});
      for (const p of pins) {
        if ((b as any).forbiddenOutPins?.includes(p)) errs.push(`Forbidden output pin on ESP32: GPIO${p} (${a.name})`);
      }
    }
  }

  return { ok: errs.length===0, errors: errs };
}
