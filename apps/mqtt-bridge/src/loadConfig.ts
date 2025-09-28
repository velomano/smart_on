import { SupabaseClient } from '@supabase/supabase-js';

export interface FarmConfig {
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

  return data || [];
}
