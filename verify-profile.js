const fs = require('fs');
const path = require('path');

// 간단한 검증 함수 (Ajv 없이)
function validateHardwareProfile(profile) {
  const errs = [];
  
  // 기본 스키마 검증
  if (!profile.schemaVersion || profile.schemaVersion !== "1.0.0") {
    errs.push("schemaVersion must be '1.0.0'");
  }
  
  if (!profile.board) {
    errs.push("board is required");
  }
  
  if (!profile.i2c || !profile.i2c.sda || !profile.i2c.scl) {
    errs.push("i2c.sda and i2c.scl are required");
  }
  
  if (!Array.isArray(profile.sensors)) {
    errs.push("sensors must be an array");
  }
  
  if (!Array.isArray(profile.actuators)) {
    errs.push("actuators must be an array");
  }
  
  // 보드별 검증
  if (profile.board === "raspberry-pi-4") {
    if (profile.i2c.sda !== 2 || profile.i2c.scl !== 3) {
      errs.push("Raspberry Pi 4 I2C pins must be SDA=2, SCL=3");
    }
    
    // WS2812B GPIO18 권장 검증
    const ws2812 = profile.actuators.find(a => /ws2812|neopixel/i.test(a.name));
    if (ws2812 && ws2812.pin !== 18) {
      errs.push("WS2812B should use GPIO18 on Raspberry Pi 4");
    }
    
    // 하드웨어 PWM 핀 검증
    for (const actuator of profile.actuators) {
      if (/pwm.*led/i.test(actuator.name) && actuator.pin) {
        const hwPwmPins = [12, 13, 18, 19];
        if (!hwPwmPins.includes(actuator.pin)) {
          errs.push(`PWM LED should use hardware PWM pins: ${hwPwmPins.join(', ')}`);
        }
      }
    }
    
    // 예약 핀 검증
    const reservedPins = [14, 15, 8, 9, 10, 11];
    for (const actuator of profile.actuators) {
      const pins = actuator.pin ? [actuator.pin] : Object.values(actuator.pins || {});
      for (const pin of pins) {
        if (reservedPins.includes(pin)) {
          errs.push(`Reserved pin GPIO${pin} used in ${actuator.name}`);
        }
      }
    }
  }
  
  return { ok: errs.length === 0, errors: errs };
}

// 메인 실행
const profilePath = process.argv[2] || "packages/shared-iot/config/example.hardwareProfile.json";
try {
  const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
  const { ok, errors } = validateHardwareProfile(profile);
  
  if (!ok) {
    console.error("❌ 프로필 오류:");
    for (const e of errors) console.error(" -", e);
    process.exit(1);
  }
  console.log("✅ 프로필 검증 통과");
} catch (error) {
  console.error("❌ 파일 읽기 오류:", error.message);
  process.exit(1);
}
