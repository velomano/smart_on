/**
 * Readings DB Operations
 * 
 * 센서 데이터 관련 DB 작업
 */

import { getSupabase } from './client.js';
import type { Reading } from '../types.js';

export interface ReadingRecord {
  tenant_id: string;
  device_id: string;  // UUID (iot_devices.id)
  ts: string;
  key: string;
  value: number;
  unit: string;
  raw?: any;
  schema_version?: string;
  quality?: 'good' | 'fair' | 'poor';
}

/**
 * 센서 데이터 배치 저장
 * 
 * @param tenantId - 테넌트 ID
 * @param deviceUuid - 디바이스 UUID (iot_devices.id)
 * @param readings - 센서 데이터 배열
 */
export async function insertReadings(
  tenantId: string,
  deviceUuid: string,  // iot_devices.id (UUID)
  readings: Reading[]
) {
  const supabase = getSupabase();
  
  const records: ReadingRecord[] = readings.map(reading => ({
    tenant_id: tenantId,
    device_id: deviceUuid,  // UUID 사용
    ts: reading.ts,
    key: reading.key,
    value: reading.value,
    unit: reading.unit,
    quality: reading.quality || 'good',
    schema_version: 'v1',
  }));

  const { data, error } = await supabase
    .from('iot_readings')
    .insert(records)
    .select();

  if (error) {
    console.error('[DB] Failed to insert readings:', error);
    throw error;
  }

  console.log(`[DB] Inserted ${data.length} readings for device ${deviceUuid}`);
  return data;
}

/**
 * 최근 센서 데이터 조회
 */
export async function getRecentReadings(
  deviceId: string,
  limit: number = 100
) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('iot_readings')
    .select('*')
    .eq('device_id', deviceId)
    .order('ts', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[DB] Failed to get readings:', error);
    throw error;
  }

  return data;
}

