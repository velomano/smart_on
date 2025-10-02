// 전원 요구사항 계산
<<<<<<< HEAD
import { sensors, controls, estimatePower } from '../../../lib/iot-templates/index';
=======
import { sensors, controls, estimatePower } from '@/lib/iot-templates/index';
>>>>>>> dc17f9bdf342b9bb54af2c88a33587ba61dacf39

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
      if (req.minCurrentA <= 0.5) {
        suggestions.push(`🔋 AMS1117-3.3 (1A): ${req.minCurrentA}A 필요, 여유 50%`);
      } else if (req.minCurrentA <= 1.0) {
        suggestions.push(`🔋 LM1117-3.3 (1.5A): ${req.minCurrentA}A 필요, 여유 50%`);
      } else {
        suggestions.push(`🔋 DC-DC 컨버터 (3A): ${req.minCurrentA}A 필요, 여유 50%`);
      }
    } else if (req.voltage === 5) {
      if (req.minCurrentA <= 1.0) {
        suggestions.push(`🔌 USB 어댑터 (2A): ${req.minCurrentA}A 필요, 여유 100%`);
      } else if (req.minCurrentA <= 3.0) {
        suggestions.push(`🔌 5V 어댑터 (5A): ${req.minCurrentA}A 필요, 여유 67%`);
      } else {
        suggestions.push(`🔌 5V 어댑터 (10A): ${req.minCurrentA}A 필요, 여유 67%`);
      }
    } else if (req.voltage === 12) {
      if (req.minCurrentA <= 2.0) {
        suggestions.push(`🔌 12V 어댑터 (3A): ${req.minCurrentA}A 필요, 여유 50%`);
      } else if (req.minCurrentA <= 5.0) {
        suggestions.push(`🔌 12V 어댑터 (8A): ${req.minCurrentA}A 필요, 여유 60%`);
      } else {
        suggestions.push(`🔌 12V 어댑터 (15A): ${req.minCurrentA}A 필요, 여유 67%`);
      }
    } else if (req.voltage === 24) {
      if (req.minCurrentA <= 1.0) {
        suggestions.push(`🔌 24V 어댑터 (2A): ${req.minCurrentA}A 필요, 여유 100%`);
      } else if (req.minCurrentA <= 3.0) {
        suggestions.push(`🔌 24V 어댑터 (5A): ${req.minCurrentA}A 필요, 여유 67%`);
      } else {
        suggestions.push(`🔌 24V 어댑터 (10A): ${req.minCurrentA}A 필요, 여유 67%`);
      }
    }
  });
  
  // 추가 권장사항
  suggestions.push(`⚠️ 전원 공급 시 주의사항:`);
  suggestions.push(`• 각 전압별로 별도 레귤레이터 사용 권장`);
  suggestions.push(`• 고전류 부하(모터, 히터)는 별도 전원 공급`);
  suggestions.push(`• 접지(GND)는 모든 전원에서 공통으로 연결`);
  suggestions.push(`• 전원 케이블은 충분한 굵기 사용 (AWG 18 이상)`);
  
  return suggestions;
}

<<<<<<< HEAD
// 전원 효율성 분석
export function analyzePowerEfficiency(requirements: PowerRequirement[]): {
  totalPower: number;
  efficiency: string;
  recommendations: string[];
} {
  const totalPower = requirements.reduce((sum, req) => sum + (req.voltage * req.minCurrentA), 0);
  
  let efficiency = '양호';
  const recommendations: string[] = [];
  
  if (totalPower > 50) {
    efficiency = '높음';
    recommendations.push('고전력 시스템: 전원 분산 공급 권장');
    recommendations.push('열 관리: 방열판 또는 쿨링 팬 고려');
  } else if (totalPower > 20) {
    efficiency = '보통';
    recommendations.push('중전력 시스템: 전원 모니터링 권장');
  } else {
    efficiency = '낮음';
    recommendations.push('저전력 시스템: 배터리 백업 고려');
  }
  
  // 전압별 효율성 분석
  const voltageCount = requirements.length;
  if (voltageCount > 3) {
    recommendations.push('다중 전압: 전원 통합 고려 (DC-DC 컨버터)');
  }
  
  return {
    totalPower: Math.round(totalPower * 100) / 100,
    efficiency,
    recommendations
  };
}

// 전원 공급 비용 추정
export function estimatePowerCost(requirements: PowerRequirement[]): {
  totalCost: number;
  costBreakdown: Array<{ voltage: number; cost: number; reason: string }>;
} {
  const costBreakdown = requirements.map(req => {
    let cost = 0;
    let reason = '';
    
    if (req.voltage === 3.3) {
      cost = req.minCurrentA <= 1.0 ? 3000 : 8000;
      reason = req.minCurrentA <= 1.0 ? '레귤레이터' : 'DC-DC 컨버터';
    } else if (req.voltage === 5) {
      cost = req.minCurrentA <= 2.0 ? 5000 : req.minCurrentA <= 5.0 ? 15000 : 25000;
      reason = '어댑터';
    } else if (req.voltage === 12) {
      cost = req.minCurrentA <= 3.0 ? 10000 : req.minCurrentA <= 8.0 ? 20000 : 35000;
      reason = '어댑터';
    } else if (req.voltage === 24) {
      cost = req.minCurrentA <= 2.0 ? 15000 : req.minCurrentA <= 5.0 ? 25000 : 40000;
      reason = '어댑터';
    }
    
    return { voltage: req.voltage, cost, reason };
  });
  
  const totalCost = costBreakdown.reduce((sum, item) => sum + item.cost, 0);
  
  return { totalCost, costBreakdown };
=======
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
>>>>>>> dc17f9bdf342b9bb54af2c88a33587ba61dacf39
}
