// Unified IoT Data Layer
// 통합 IoT 데이터 레이어

export interface SensorValue {
  value: number;
  unit: string;
  ts: string;
}

export interface UnifiedSensor {
  id: string;
  key: string;
  canonical_key: string;
  label: string;
  unit: string;
  value?: number;
  ts?: string;
}

export interface UnifiedActuator {
  id: string;
  type: string;
  label: string;
  channels?: number;
  commands: Array<{
    id: string;
    label: string;
    payload: any;
  }>;
}

export interface UnifiedDevice {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'unknown';
  sensors: UnifiedSensor[];
  actuators: UnifiedActuator[];
  lastSeen?: string;
}

// Universal Bridge에서 최신 센서 값 가져오기
export async function getLatestSensorValue(
  farmId: string, 
  deviceId: string, 
  key: string
): Promise<SensorValue | null> {
  try {
    // Universal Bridge API 호출
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BRIDGE_URL}/api/devices/${deviceId}/readings/latest?key=${key}`,
      { 
        cache: 'no-store',
        headers: {
          'x-tenant-id': farmId
        }
      }
    );
    
    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching latest sensor value:', error);
    return null;
  }
}

// 여러 센서 값 한번에 가져오기
export async function getLatestSensorValues(
  farmId: string,
  deviceId: string,
  keys: string[]
): Promise<Record<string, SensorValue>> {
  const results: Record<string, SensorValue> = {};
  
  for (const key of keys) {
    const value = await getLatestSensorValue(farmId, deviceId, key);
    if (value) {
      results[key] = value;
    }
  }
  
  return results;
}

// 통합 센서 목록 가져오기
export async function getUnifiedSensors(farmId: string): Promise<UnifiedSensor[]> {
  // TODO: Universal Bridge, MQTT, Tuya 데이터 통합
  return [];
}

// 통합 액추에이터 목록 가져오기
export async function getUnifiedActuators(farmId: string): Promise<UnifiedActuator[]> {
  // TODO: Universal Bridge, MQTT, Tuya 데이터 통합
  return [];
}

// 통합 디바이스 목록 가져오기
export async function getUnifiedDevices(farmId: string): Promise<UnifiedDevice[]> {
  // TODO: Universal Bridge, MQTT, Tuya 데이터 통합
  return [];
}

// 통합 명령 전송
export async function sendUnifiedCommand(
  farmId: string,
  deviceId: string,
  command: any
): Promise<boolean> {
  // TODO: Universal Bridge, MQTT, Tuya 명령 통합
  return false;
}

// 센서 중복 제거
export function deduplicateSensors(sensors: UnifiedSensor[]): UnifiedSensor[] {
  const seen = new Set<string>();
  return sensors.filter(sensor => {
    const key = sensor.canonical_key || sensor.key;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// 키 정규화
export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '_');
}
