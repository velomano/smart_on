// 자연어 IoT 시스템 설계 파싱 API
import { NextRequest, NextResponse } from 'next/server';
import { keywordMapping, sensors, controls } from 'iot-templates';

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: '입력이 필요합니다' }, { status: 400 });
    }

    // LLM 스타일 자연어 파싱 (규칙 기반 + AI 추론)
    const result = await parseNaturalLanguage(input);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('자연어 파싱 오류:', error);
    return NextResponse.json({ error: '파싱 중 오류가 발생했습니다' }, { status: 500 });
  }
}

async function parseNaturalLanguage(input: string) {
  const sensors: Array<{ type: string; count: number }> = [];
  const controls: Array<{ type: string; count: number }> = [];
  
  // 1단계: 직접적인 숫자+키워드 매칭
  const directMatches = parseDirectMatches(input);
  sensors.push(...directMatches.sensors);
  controls.push(...directMatches.controls);
  
  // 2단계: 맥락 기반 추론
  const contextualMatches = parseContextualMatches(input);
  sensors.push(...contextualMatches.sensors);
  controls.push(...contextualMatches.controls);
  
  // 3단계: 중복 제거 및 병합
  const mergedSensors = mergeSensorTypes(sensors);
  const mergedControls = mergeControlTypes(controls);
  
  return {
    sensors: mergedSensors,
    controls: mergedControls
  };
}

function parseDirectMatches(input: string) {
  const sensors: Array<{ type: string; count: number }> = [];
  const controls: Array<{ type: string; count: number }> = [];
  
  // 다양한 패턴으로 매칭
  const patterns = [
    // "온도 센서 2개" 패턴
    /(\d+)\s*개?\s*(센서|sensor)?\s*(온도|습도|토양|수분|조도|ph|co2|압력|모션|수위|카메라)/gi,
    // "2개의 온도 센서" 패턴
    /(\d+)\s*개?의?\s*(온도|습도|토양|수분|조도|ph|co2|압력|모션|수위|카메라)\s*(센서|sensor)?/gi,
    // "온도 2개" 패턴
    /(온도|습도|토양|수분|조도|ph|co2|압력|모션|수위|카메라)\s*(\d+)\s*개/gi,
    // 제어 장치 패턴
    /(\d+)\s*개?\s*(릴레이|스프링클러|조명|팬|모터|서보|밸브|솔레노이드|스테퍼|펌프|히터|부저|디스플레이|lcd)/gi,
    /(\d+)\s*개?의?\s*(릴레이|스프링클러|조명|팬|모터|서보|밸브|솔레노이드|스테퍼|펌프|히터|부저|디스플레이|lcd)/gi,
    /(릴레이|스프링클러|조명|팬|모터|서보|밸브|솔레노이드|스테퍼|펌프|히터|부저|디스플레이|lcd)\s*(\d+)\s*개/gi
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(input)) !== null) {
      const count = parseInt(match[1] || match[2]);
      const keyword = (match[2] || match[1] || match[3] || match[2]).trim();
      
      const mappedType = keywordMapping[keyword.toLowerCase() as keyof typeof keywordMapping];
      if (mappedType) {
        if (isSensor(mappedType)) {
          sensors.push({ type: mappedType, count });
        } else {
          controls.push({ type: mappedType, count });
        }
      }
    }
  });
  
  return { sensors, controls };
}

function parseContextualMatches(input: string) {
  const sensors: Array<{ type: string; count: number }> = [];
  const controls: Array<{ type: string; count: number }> = [];
  
  // 맥락 기반 키워드 매칭
  const contextPatterns = {
    // 스마트팜 관련
    '스마트팜': ['dht22', 'soil_moisture', 'relay', 'water_pump'],
    '식물': ['soil_moisture', 'dht22', 'led_strip'],
    '온실': ['dht22', 'relay', 'dc_fan_pwm'],
    '재배': ['soil_moisture', 'ph_sensor', 'dht22'],
    '관수': ['soil_moisture', 'water_pump', 'relay'],
    
    // 환경 모니터링
    '환경': ['dht22', 'co2_sensor', 'pressure_sensor'],
    '공기': ['co2_sensor', 'pressure_sensor'],
    '조명': ['bh1750', 'led_strip'],
    '온도': ['dht22', 'dc_fan_pwm', 'heater'],
    '습도': ['dht22', 'water_pump'],
    
    // 보안/안전
    '보안': ['motion_sensor', 'camera'],
    '감지': ['motion_sensor', 'pressure_sensor'],
    '알림': ['buzzer', 'lcd_display'],
    
    // 자동화
    '자동': ['relay', 'solenoid_valve', 'servo'],
    '제어': ['relay', 'dc_fan_pwm', 'servo'],
    '밸브': ['solenoid_valve', 'relay'],
    '펌프': ['water_pump', 'relay'],
    '팬': ['dc_fan_pwm'],
    '모터': ['dc_fan_pwm', 'stepper_motor']
  };
  
  // 기본 개수 (명시되지 않은 경우)
  let defaultCount = 1;
  const countMatch = input.match(/(\d+)\s*(개|대|채널|개소)/);
  if (countMatch) {
    defaultCount = parseInt(countMatch[1]);
  }
  
  // 맥락 매칭
  Object.entries(contextPatterns).forEach(([context, devices]) => {
    if (input.toLowerCase().includes(context)) {
      devices.forEach(deviceType => {
        if (isSensor(deviceType)) {
          sensors.push({ type: deviceType, count: defaultCount });
        } else {
          controls.push({ type: deviceType, count: defaultCount });
        }
      });
    }
  });
  
  return { sensors, controls };
}

function isSensor(type: string): boolean {
  return ['dht22', 'ds18b20', 'bh1750', 'soil_moisture', 'ph_sensor', 'co2_sensor', 'pressure_sensor', 'motion_sensor', 'water_level', 'camera'].includes(type);
}

function mergeSensorTypes(sensors: Array<{ type: string; count: number }>) {
  const merged = new Map<string, number>();
  
  sensors.forEach(({ type, count }) => {
    const existing = merged.get(type) || 0;
    merged.set(type, existing + count);
  });
  
  return Array.from(merged.entries()).map(([type, count]) => ({ type, count }));
}

function mergeControlTypes(controls: Array<{ type: string; count: number }>) {
  const merged = new Map<string, number>();
  
  controls.forEach(({ type, count }) => {
    const existing = merged.get(type) || 0;
    merged.set(type, existing + count);
  });
  
  return Array.from(merged.entries()).map(([type, count]) => ({ type, count }));
}
