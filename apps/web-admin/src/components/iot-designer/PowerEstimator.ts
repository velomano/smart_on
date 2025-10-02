// 전원 요구사항 계산
import { sensors, controls, estimatePower } from '@/lib/iot-templates/index';

export interface PowerRequirement {
  voltage: number;
  minCurrentA: number;
  devices: string[];
}

export function calculatePowerRequirements(req: {
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  protocol?: string; // 통신 프로토콜 (RS-485용)
}): PowerRequirement[] {
  const powerItems: Array<{ voltage: number; current_mA: number; count: number; device: string }> = [];

  // 센서 전원 요구사항
  req.sensors.forEach(({ type, count }) => {
    const sensor = sensors.find(s => s.type === type);
    if (sensor) {
      powerItems.push({
        voltage: sensor.power.voltage,
        current_mA: sensor.power.current_mA,
        count,
        device: `${sensor.name} × ${count}`
      });
    }
  });

  // 제어 전원 요구사항
  req.controls.forEach(({ type, count }) => {
    const control = controls.find(c => c.type === type);
    if (control) {
      powerItems.push({
        voltage: control.power.voltage,
        current_mA: control.power.current_mA,
        count,
        device: `${control.name} × ${count}`
      });
    }
  });

  // 전압별 그룹화 및 계산
  const byVoltage = new Map<number, { current_mA: number; devices: string[] }>();
  
  powerItems.forEach(item => {
    const existing = byVoltage.get(item.voltage);
    if (existing) {
      existing.current_mA += item.current_mA * item.count;
      existing.devices.push(item.device);
    } else {
      byVoltage.set(item.voltage, {
        current_mA: item.current_mA * item.count,
        devices: [item.device]
      });
    }
  });

  // 결과 생성 (50% 여유 포함)
  return Array.from(byVoltage.entries()).map(([voltage, data]) => ({
    voltage,
    minCurrentA: +(data.current_mA / 1000 * 1.5).toFixed(2),
    devices: data.devices
  }));
}

// 전원 공급 제안
export function suggestPowerSupplies(requirements: PowerRequirement[]): string[] {
  const suggestions: string[] = [];
  
  requirements.forEach(req => {
    if (req.voltage === 3.3) {
      suggestions.push(`3.3V: ESP32 내장 레귤레이터 사용 (최대 1A)`);
    } else if (req.voltage === 5) {
      suggestions.push(`5V: USB 전원 또는 외부 5V 어댑터 (${req.minCurrentA}A 이상)`);
    } else if (req.voltage === 12) {
      suggestions.push(`12V: 외부 어댑터 필요 (${req.minCurrentA}A 이상)`);
    } else if (req.voltage === 24) {
      suggestions.push(`24V: 산업용 전원 공급 장치 필요 (${req.minCurrentA}A 이상)`);
    }
  });
  
  // 안전 주의사항
  suggestions.push(`⚠️ 고전압 부하는 ESP32와 전원 분리 필수`);
  suggestions.push(`⚠️ 공통 접지(GND) 연결 필수`);
  suggestions.push(`⚠️ 릴레이/모터는 역기전력 보호 다이오드 권장`);
  
  return suggestions;
}

// RS-485 종단/바이어스 저항 체크
export function checkRS485Resistors(req: {
  protocol?: string;
  deviceCount?: number;
  cableLength?: number; // 미터 단위
}): string[] {
  const checks: string[] = [];
  
  if (req.protocol === 'rs485') {
    // 기본 저항 체크
    checks.push(`🔌 RS-485 종단 저항: 120Ω (버스 양 끝단에만)`);
    checks.push(`🔌 RS-485 바이어스 저항: 4.7kΩ (A선과 B선에 각각)`);
    
    // 거리 및 노드 제한
    const maxDistance = req.cableLength || 1200;
    const nodeCount = req.deviceCount || 32;
    checks.push(`🔌 최대 거리: ${Math.min(maxDistance, 1200)}m`);
    checks.push(`🔌 최대 노드 수: ${Math.min(nodeCount, 32)}개`);
    
    // 설치 규칙
    checks.push(`⚠️ 종단 저항은 버스 양 끝단에만 설치`);
    checks.push(`⚠️ 바이어스 저항은 마스터에만 설치`);
    checks.push(`⚠️ 케이블 길이에 따른 신호 품질 고려`);
    
    // 추가 안전 체크
    if (req.cableLength && req.cableLength > 1000) {
      checks.push(`⚠️ 장거리 통신: 신호 증폭기 또는 리피터 고려`);
    }
    
    if (req.deviceCount && req.deviceCount > 20) {
      checks.push(`⚠️ 다중 노드: 각 노드별 고유 주소 확인`);
    }
    
    // 전원 요구사항
    checks.push(`⚡ RS-485 트랜시버 전원: 3.3V 또는 5V (5mA)`);
    checks.push(`⚡ DE 핀 제어: 디지털 출력 핀 필요`);
  }
  
  return checks;
}
