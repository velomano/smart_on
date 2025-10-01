/**
 * Devices DB Operations
 * 
 * 디바이스 관련 DB 작업
 */

import { getSupabase } from './client.js';
import crypto from 'crypto';

export interface DeviceRecord {
  id?: string;
  tenant_id: string;
  farm_id?: string;
  device_id: string;
  device_key_hash: string;
  device_type?: string;
  fw_version?: string;
  capabilities?: string[];
  status?: string;
  metadata?: any;
}

/**
 * 디바이스 생성
 */
export async function createDevice(device: DeviceRecord) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('iot_devices')
    .insert({
      tenant_id: device.tenant_id,
      farm_id: device.farm_id,
      device_id: device.device_id,
      device_key_hash: device.device_key_hash,
      device_type: device.device_type,
      fw_version: device.fw_version,
      capabilities: device.capabilities,
      status: device.status || 'active',
      metadata: device.metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] Failed to create device:', error);
    throw error;
  }

  console.log('[DB] Device created:', data.id);
  return data;
}

/**
 * 디바이스 조회 (device_id로)
 */
export async function getDeviceByDeviceId(tenantId: string, deviceId: string) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('iot_devices')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('device_id', deviceId)
    .single();

  if (error && error.code !== 'PGRST116') {  // Not found is ok
    console.error('[DB] Failed to get device:', error);
    throw error;
  }

  return data;
}

/**
 * 디바이스 키 해시 생성 (bcrypt 대신 간단히)
 */
export function hashDeviceKey(deviceKey: string): string {
  return crypto
    .createHash('sha256')
    .update(deviceKey)
    .digest('hex');
}

/**
 * 디바이스 마지막 접속 시간 업데이트
 */
export async function updateDeviceLastSeen(deviceId: string) {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('iot_devices')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', deviceId);

  if (error) {
    console.error('[DB] Failed to update last_seen:', error);
  }
}

