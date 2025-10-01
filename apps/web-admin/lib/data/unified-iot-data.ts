/**
 * Unified IoT Data Layer
 * 
 * MQTT Bridge + Universal Bridge + Tuya 등 모든 데이터 소스를 통합
 * - 정규화된 형식으로 반환
 * - 중복 제거
 * - 우선순위 적용 (Universal Bridge > MQTT > Tuya)
 */

import { createClient } from '@/lib/supabase/server';

// =====================================================
// Types
// =====================================================

export interface UnifiedSensor {
  id: string;
  device_id: string;
  device_name?: string;
  key: string;
  canonical_key: string;
  label: string;
  value: number;
  unit: string;
  display_unit: string;
  timestamp: string;
  source: 'universal' | 'mqtt' | 'tuya';
  quality?: 'good' | 'warn' | 'bad';
}

export interface UnifiedActuator {
  id: string;
  device_id: string;
  device_name?: string;
  type: string;
  label: string;
  state: any;
  available_commands: Array<{
    id: string;
    label: string;
    payload: any;
  }>;
  source: 'universal' | 'mqtt' | 'tuya';
}

export interface UnifiedDevice {
  id: string;
  device_id: string;
  name: string;
  profile_id?: string;
  online: boolean;
  last_seen_at?: string;
  source: 'universal' | 'mqtt' | 'tuya';
}

// =====================================================
// Get Unified Sensors
// =====================================================

export async function getUnifiedSensors(farmId: string): Promise<UnifiedSensor[]> {
  const supabase = await createClient();
  const sensors: UnifiedSensor[] = [];

  // 1. Universal Bridge 데이터 (최우선)
  const { data: universalReadings } = await supabase
    .from('iot_readings')
    .select(`
      id,
      device_uuid,
      key,
      value,
      unit,
      ts,
      iot_devices!inner(device_id, tenant_id, farm_id, profile_id)
    `)
    .eq('iot_devices.farm_id', farmId)
    .order('ts', { ascending: false })
    .limit(100);

  if (universalReadings) {
    for (const reading of universalReadings) {
      const device = (reading as any).iot_devices;
      
      sensors.push({
        id: reading.id,
        device_id: device.device_id,
        key: reading.key,
        canonical_key: reading.key, // TODO: Profile에서 canonical_key 가져오기
        label: reading.key,
        value: reading.value,
        unit: reading.unit || '',
        display_unit: reading.unit || '',
        timestamp: reading.ts,
        source: 'universal',
      });
    }
  }

  // 2. MQTT Bridge 데이터 (기존)
  // TODO: 기존 MQTT 데이터 통합
  // const mqttSensors = await getMqttSensors(farmId);
  // sensors.push(...mqttSensors);

  // 3. Tuya 데이터 (기존)
  // TODO: 기존 Tuya 데이터 통합
  // const tuyaSensors = await getTuyaSensors(farmId);
  // sensors.push(...tuyaSensors);

  // 4. 중복 제거 (device_id + key 기준)
  const deduped = deduplicateSensors(sensors);

  return deduped;
}

// =====================================================
// Get Unified Actuators
// =====================================================

export async function getUnifiedActuators(farmId: string): Promise<UnifiedActuator[]> {
  const supabase = await createClient();
  const actuators: UnifiedActuator[] = [];

  // 1. Universal Bridge 장치에서 Actuator 추출
  const { data: devices } = await supabase
    .from('iot_devices')
    .select(`
      id,
      device_id,
      profile_id,
      device_profiles(capabilities)
    `)
    .eq('farm_id', farmId);

  if (devices) {
    for (const device of devices) {
      const profile = (device as any).device_profiles;
      const capabilities = profile?.capabilities;
      
      if (capabilities?.actuators) {
        for (const actuator of capabilities.actuators) {
          actuators.push({
            id: `${device.id}_${actuator.type}`,
            device_id: device.device_id,
            type: actuator.type,
            label: actuator.label || actuator.type,
            state: null, // TODO: 실제 상태 조회
            available_commands: actuator.commands || [],
            source: 'universal',
          });
        }
      }
    }
  }

  // 2. MQTT/Tuya Actuator 통합
  // TODO: 기존 actuator 통합

  return actuators;
}

// =====================================================
// Get Unified Devices
// =====================================================

export async function getUnifiedDevices(farmId: string): Promise<UnifiedDevice[]> {
  const supabase = await createClient();
  const devices: UnifiedDevice[] = [];

  // 1. Universal Bridge 장치
  const { data: universalDevices } = await supabase
    .from('iot_devices')
    .select('id, device_id, profile_id, last_seen_at')
    .eq('farm_id', farmId);

  if (universalDevices) {
    for (const device of universalDevices) {
      const lastSeen = device.last_seen_at ? new Date(device.last_seen_at) : null;
      const online = lastSeen ? (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000 : false;

      devices.push({
        id: device.id,
        device_id: device.device_id,
        name: device.device_id, // TODO: 실제 이름 가져오기
        profile_id: device.profile_id,
        online,
        last_seen_at: device.last_seen_at,
        source: 'universal',
      });
    }
  }

  // 2. MQTT/Tuya 장치 통합
  // TODO: 기존 장치 통합

  return devices;
}

// =====================================================
// Send Unified Command
// =====================================================

export async function sendUnifiedCommand(
  deviceId: string,
  command: string,
  payload: any
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // 1. 장치 소스 확인
    const { data: device } = await supabase
      .from('iot_devices')
      .select('id, device_id, tenant_id')
      .eq('device_id', deviceId)
      .single();

    if (!device) {
      // MQTT/Tuya 장치일 수 있음
      return { success: false, error: 'Device not found in Universal Bridge' };
    }

    // 2. Universal Bridge로 명령 전송
    const { data: commandData, error } = await supabase
      .from('iot_commands')
      .insert({
        device_uuid: device.id,
        tenant_id: device.tenant_id,
        command,
        payload,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // 3. WebSocket으로 푸시 (TODO: 실제 구현)
    // await pushCommandToDevice(device.device_id, commandData);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =====================================================
// Helper Functions
// =====================================================

function deduplicateSensors(sensors: UnifiedSensor[]): UnifiedSensor[] {
  const map = new Map<string, UnifiedSensor>();
  
  // 우선순위: universal > mqtt > tuya
  const priority = { universal: 3, mqtt: 2, tuya: 1 };
  
  for (const sensor of sensors) {
    const key = `${sensor.device_id}_${sensor.canonical_key}`;
    const existing = map.get(key);
    
    if (!existing || priority[sensor.source] > priority[existing.source]) {
      map.set(key, sensor);
    }
  }
  
  return Array.from(map.values());
}

