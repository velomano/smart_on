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

// 센서 연결 상태 확인 (최근 5분 이내 데이터가 있으면 연결됨)
export async function checkSensorConnectionStatus(
  farmId: string,
  sensorType: string
): Promise<boolean> {
  try {
    const supabase = await import('@/lib/supabase').then(m => m.getSupabaseClient());
    
    // 최근 5분 이내의 센서 데이터가 있는지 확인
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // 1. Universal Bridge 데이터 우선 확인 (iot_readings)
    const { data: ubData, error: ubError } = await supabase
      .from('iot_readings')
      .select('id, ts, iot_devices!inner(farm_id)')
      .eq('iot_devices.farm_id', farmId)
      .eq('key', sensorType)
      .gte('ts', fiveMinutesAgo)
      .limit(1);
    
    if (ubData && ubData.length > 0) {
      console.log(`📊 센서 ${sensorType} 연결 상태 (Universal Bridge):`, '연결됨');
      return true;
    }
    
    // 2. 기존 MQTT Bridge 데이터 확인 (sensor_readings)
    const { data: mqttData, error: mqttError } = await supabase
      .from('sensor_readings')
      .select('id, ts, sensors!inner(type, devices!inner(farm_id))')
      .eq('sensors.devices.farm_id', farmId)
      .eq('sensors.type', sensorType)
      .gte('ts', fiveMinutesAgo)
      .limit(1);
    
    if (mqttData && mqttData.length > 0) {
      console.log(`📊 센서 ${sensorType} 연결 상태 (MQTT Bridge):`, '연결됨');
      return true;
    }
    
    console.log(`📊 센서 ${sensorType} 연결 상태:`, '연결 안됨');
    return false;
  } catch (error) {
    console.warn(`센서 ${sensorType} 연결 상태 확인 실패:`, error);
    return false;
  }
}

// 여러 센서의 연결 상태를 한번에 확인
export async function checkMultipleSensorConnectionStatus(
  farmId: string,
  sensorTypes: string[]
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  try {
    const supabase = await import('@/lib/supabase').then(m => m.getSupabaseClient());
    
    // 먼저 실제로 존재하는 센서 타입들만 확인
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // Universal Bridge 데이터 우선 확인 (iot_readings)
    const { data: ubData } = await supabase
      .from('iot_readings')
      .select('key, iot_devices!inner(farm_id)')
      .eq('iot_devices.farm_id', farmId)
      .in('key', sensorTypes)
      .gte('ts', fiveMinutesAgo);
    
    // 기존 MQTT Bridge 데이터 확인 (sensor_readings)
    const { data: mqttData } = await supabase
      .from('sensor_readings')
      .select('sensors!inner(type, devices!inner(farm_id))')
      .eq('sensors.devices.farm_id', farmId)
      .in('sensors.type', sensorTypes)
      .gte('ts', fiveMinutesAgo);
    
    // Universal Bridge에서 연결된 센서들
    const ubConnectedTypes = new Set(ubData?.map(item => item.key) || []);
    
    // MQTT Bridge에서 연결된 센서들
    const mqttConnectedTypes = new Set(mqttData?.map(item => (item as any).sensors.type) || []);
    
    // 각 센서 타입별로 연결 상태 설정 (Universal Bridge 우선)
    sensorTypes.forEach(sensorType => {
      results[sensorType] = ubConnectedTypes.has(sensorType) || mqttConnectedTypes.has(sensorType);
    });
    
    console.log('📊 센서 연결 상태 일괄 확인 결과:', results);
    return results;
  } catch (error) {
    console.warn('센서 연결 상태 일괄 확인 실패:', error);
    // 오류 발생 시 모든 센서를 연결 안됨으로 처리
    sensorTypes.forEach(type => results[type] = false);
    return results;
  }
}