export interface BootStatus {
  ok?: boolean;
  i2c?: string[];
  wifi?: boolean;
  ip?: string;
  sensors?: {
    bme280?: boolean;
    ads1115?: boolean;
    dht22?: boolean;
  };
  fw?: string;
  board?: string;
  timestamp?: number;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function checkBootStatus(status: BootStatus): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 필수 연결 확인
  if (!status.wifi) {
    errors.push("WiFi 미연결");
  }
  
  if (!status.ip) {
    errors.push("IP 주소 미할당");
  }

  // I2C 디바이스 확인
  const i2cAddresses = status.i2c || [];
  const hasBME = i2cAddresses.some(addr => addr === "76" || addr === "77");
  const hasADS = i2cAddresses.some(addr => {
    const num = parseInt(addr, 16);
    return num >= 0x48 && num <= 0x4B;
  });

  if (!hasBME) {
    errors.push("BME280 미검출 (예상 주소: 0x76 또는 0x77)");
  }
  
  if (!hasADS) {
    errors.push("ADS1115 미검출 (예상 주소: 0x48~0x4B)");
  }

  // 센서 상태 확인
  if (status.sensors) {
    if (status.sensors.bme280 === false) {
      warnings.push("BME280 초기화 실패");
    }
    if (status.sensors.ads1115 === false) {
      warnings.push("ADS1115 초기화 실패");
    }
    if (status.sensors.dht22 === false) {
      warnings.push("DHT22 초기화 실패");
    }
  }

  // 펌웨어 버전 확인
  if (!status.fw) {
    warnings.push("펌웨어 버전 정보 없음");
  } else if (status.fw !== "1.0.0") {
    warnings.push(`펌웨어 버전 불일치 (현재: ${status.fw}, 예상: 1.0.0)`);
  }

  // 보드 타입 확인
  if (!status.board) {
    warnings.push("보드 타입 정보 없음");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

export function formatBootStatusReport(status: BootStatus): string {
  const validation = checkBootStatus(status);
  
  let report = "=== 부팅 상태 보고서 ===\n";
  report += `시간: ${new Date(status.timestamp || 0).toLocaleString()}\n`;
  report += `보드: ${status.board || "알 수 없음"}\n`;
  report += `펌웨어: ${status.fw || "알 수 없음"}\n`;
  report += `WiFi: ${status.wifi ? "연결됨" : "연결 안됨"}\n`;
  report += `IP: ${status.ip || "없음"}\n`;
  
  if (status.i2c && status.i2c.length > 0) {
    report += `I2C 디바이스: ${status.i2c.map(addr => `0x${addr}`).join(", ")}\n`;
  } else {
    report += "I2C 디바이스: 없음\n";
  }

  if (status.sensors) {
    report += "센서 상태:\n";
    report += `  BME280: ${status.sensors.bme280 ? "정상" : "오류"}\n`;
    report += `  ADS1115: ${status.sensors.ads1115 ? "정상" : "오류"}\n`;
    report += `  DHT22: ${status.sensors.dht22 ? "정상" : "오류"}\n`;
  }

  if (validation.errors.length > 0) {
    report += "\n❌ 오류:\n";
    validation.errors.forEach(error => report += `  - ${error}\n`);
  }

  if (validation.warnings.length > 0) {
    report += "\n⚠️ 경고:\n";
    validation.warnings.forEach(warning => report += `  - ${warning}\n`);
  }

  report += `\n결과: ${validation.ok ? "✅ 통과" : "❌ 실패"}`;
  
  return report;
}
