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
  const sensors: UnifiedSensor[] = [];

  try {
    // 1. Universal Bridge 센서 (최우선)
    const universalSensors = await getUniversalSensors(farmId);
    sensors.push(...universalSensors);

    // 2. MQTT Bridge 센서 (기존)
    const mqttSensors = await getMqttSensors(farmId);
    // 중복 제거: Universal Bridge에 없는 센서만 추가
    const uniqueMqttSensors = mqttSensors.filter(mqtt => 
      !universalSensors.some(uni => uni.sensorType === mqtt.sensorType)
    );
    sensors.push(...uniqueMqttSensors);

    // 3. Tuya 센서 (기존)
    const tuyaSensors = await getTuyaSensors(farmId);
    const uniqueTuyaSensors = tuyaSensors.filter(tuya => 
      !sensors.some(existing => existing.sensorType === tuya.sensorType)
    );
    sensors.push(...uniqueTuyaSensors);

  } catch (error) {
    console.error('Unified sensors fetch error:', error);
  }

  return deduplicateSensors(sensors);
}

// 통합 액추에이터 목록 가져오기
export async function getUnifiedActuators(farmId: string): Promise<UnifiedActuator[]> {
  const actuators: UnifiedActuator[] = [];

  try {
    // 1. Universal Bridge 액추에이터 (최우선)
    const universalActuators = await getUniversalActuators(farmId);
    actuators.push(...universalActuators);

    // 2. MQTT Bridge 액추에이터 (기존)
    const mqttActuators = await getMqttActuators(farmId);
    const uniqueMqttActuators = mqttActuators.filter(mqtt => 
      !universalActuators.some(uni => uni.actuatorType === mqtt.actuatorType)
    );
    actuators.push(...uniqueMqttActuators);

    // 3. Tuya 액추에이터 (기존)
    const tuyaActuators = await getTuyaActuators(farmId);
    const uniqueTuyaActuators = tuyaActuators.filter(tuya => 
      !actuators.some(existing => existing.actuatorType === tuya.actuatorType)
    );
    actuators.push(...uniqueTuyaActuators);

  } catch (error) {
    console.error('Unified actuators fetch error:', error);
  }

  return actuators;
}

// 통합 디바이스 목록 가져오기
export async function getUnifiedDevices(farmId: string): Promise<UnifiedDevice[]> {
  const devices: UnifiedDevice[] = [];

  try {
    // 1. Universal Bridge 디바이스 (최우선)
    const universalDevices = await getUniversalDevices(farmId);
    devices.push(...universalDevices);

    // 2. MQTT Bridge 디바이스 (기존)
    const mqttDevices = await getMqttDevices(farmId);
    const uniqueMqttDevices = mqttDevices.filter(mqtt => 
      !universalDevices.some(uni => uni.deviceId === mqtt.deviceId)
    );
    devices.push(...uniqueMqttDevices);

    // 3. Tuya 디바이스 (기존)
    const tuyaDevices = await getTuyaDevices(farmId);
    const uniqueTuyaDevices = tuyaDevices.filter(tuya => 
      !devices.some(existing => existing.deviceId === tuya.deviceId)
    );
    devices.push(...uniqueTuyaDevices);

  } catch (error) {
    console.error('Unified devices fetch error:', error);
  }

  return devices;
}

// 통합 명령 전송
export async function sendUnifiedCommand(
  farmId: string,
  deviceId: string,
  command: any
): Promise<boolean> {
  try {
    // 1. Universal Bridge로 명령 전송 시도
    const ubResult = await sendUniversalCommand(deviceId, command.type, command.payload);
    if (ubResult.success) {
      return true;
    }

    // 2. MQTT Bridge로 명령 전송 시도
    const mqttResult = await sendMqttCommand(farmId, deviceId, command);
    if (mqttResult.success) {
      return true;
    }

    // 3. Tuya로 명령 전송 시도
    const tuyaResult = await sendTuyaCommand(farmId, deviceId, command);
    return tuyaResult.success;

  } catch (error) {
    console.error('Unified command send error:', error);
    return false;
  }
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

// =====================================================
// Helper Functions
// =====================================================

// Universal Bridge 센서 데이터 조회
async function getUniversalSensors(farmId: string): Promise<UnifiedSensor[]> {
  const supabase = await createClient();
  
  try {
    const { data } = await supabase
      .from('iot_readings')
      .select(`
        key,
        unit,
        ts,
        iot_devices!inner(device_id, farm_id)
      `)
      .eq('iot_devices.farm_id', farmId)
      .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 최근 24시간
      .order('ts', { ascending: false });

    if (!data) return [];

    // 센서 타입별로 그룹화
    const sensorMap = new Map<string, UnifiedSensor>();
    
    data.forEach(reading => {
      if (!sensorMap.has(reading.key)) {
        sensorMap.set(reading.key, {
          sensorType: reading.key,
          value: 0,
          unit: reading.unit || '',
          timestamp: reading.ts,
          source: 'universal_bridge',
          connected: true
        });
      }
    });

    return Array.from(sensorMap.values());
  } catch (error) {
    console.error('Universal sensors fetch error:', error);
    return [];
  }
}

// MQTT Bridge 센서 데이터 조회
async function getMqttSensors(farmId: string): Promise<UnifiedSensor[]> {
  const supabase = await createClient();
  
  try {
    const { data } = await supabase
      .from('sensor_readings')
      .select(`
        sensors!inner(type, devices!inner(device_id, farm_id))
      `)
      .eq('sensors.devices.farm_id', farmId)
      .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 최근 24시간
      .order('ts', { ascending: false });

    if (!data) return [];

    // 센서 타입별로 그룹화
    const sensorMap = new Map<string, UnifiedSensor>();
    
    data.forEach(reading => {
      const sensorType = (reading as any).sensors.type;
      if (!sensorMap.has(sensorType)) {
        sensorMap.set(sensorType, {
          sensorType,
          value: 0,
          unit: '',
          timestamp: new Date().toISOString(),
          source: 'mqtt_bridge',
          connected: true
        });
      }
    });

    return Array.from(sensorMap.values());
  } catch (error) {
    console.error('MQTT sensors fetch error:', error);
    return [];
  }
}

// Tuya 센서 데이터 조회 (기존 구현)
async function getTuyaSensors(farmId: string): Promise<UnifiedSensor[]> {
  // Tuya API 연동 로직 구현
  // 실제 구현은 Tuya API 문서 참조
  return [];
}

// Universal Bridge 액추에이터 조회
async function getUniversalActuators(farmId: string): Promise<UnifiedActuator[]> {
  // Universal Bridge 액추에이터 조회 로직 구현
  return [];
}

// MQTT Bridge 액추에이터 조회
async function getMqttActuators(farmId: string): Promise<UnifiedActuator[]> {
  // MQTT Bridge 액추에이터 조회 로직 구현
  return [];
}

// Tuya 액추에이터 조회
async function getTuyaActuators(farmId: string): Promise<UnifiedActuator[]> {
  // Tuya 액추에이터 조회 로직 구현
  return [];
}

// Universal Bridge 디바이스 조회
async function getUniversalDevices(farmId: string): Promise<UnifiedDevice[]> {
  // Universal Bridge 디바이스 조회 로직 구현
  return [];
}

// MQTT Bridge 디바이스 조회
async function getMqttDevices(farmId: string): Promise<UnifiedDevice[]> {
  // MQTT Bridge 디바이스 조회 로직 구현
  return [];
}

// Tuya 디바이스 조회
async function getTuyaDevices(farmId: string): Promise<UnifiedDevice[]> {
  // Tuya 디바이스 조회 로직 구현
  return [];
}

// MQTT 명령 전송
async function sendMqttCommand(farmId: string, deviceId: string, command: any): Promise<{ success: boolean }> {
  // MQTT 명령 전송 로직 구현
  return { success: false };
}

// Tuya 명령 전송
async function sendTuyaCommand(farmId: string, deviceId: string, command: any): Promise<{ success: boolean }> {
  // Tuya 명령 전송 로직 구현
  return { success: false };
}