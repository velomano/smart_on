/**
 * MQTT Farm Configuration Loader
 * 
 * 기존 MQTT Bridge의 설정 로더를 Universal Bridge에 통합
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { FarmConfig } from './client.js';

export interface FarmConfigRow {
  farm_id: string;
  broker_url: string;
  port: number;
  auth_mode: 'api_key' | 'user_pass';
  username?: string;
  secret_enc?: string;
  client_id_prefix: string;
  ws_path?: string;
  qos_default: number;
  is_active: boolean;
}

export async function loadFarmConfigs(supabase: SupabaseClient): Promise<FarmConfig[]> {
  const { data, error } = await supabase
    .from('farm_mqtt_configs')
    .select('*')
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to load farm configs: ${error.message}`);
  }

  return data?.map((row: FarmConfigRow) => ({
    farm_id: row.farm_id,
    broker_url: row.broker_url,
    port: row.port,
    auth_mode: row.auth_mode,
    username: row.username,
    secret_enc: row.secret_enc,
    client_id_prefix: row.client_id_prefix,
    ws_path: row.ws_path,
    qos_default: row.qos_default
  })) || [];
}
