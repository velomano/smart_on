/**
 * Provisioning Database Functions
 * 
 * 디바이스 프로비저닝 관련 DB 작업
 */

import { getSupabase } from './client.js';

export interface SetupToken {
  id?: string;
  setup_token: string;
  device_key?: string;
  status: 'active' | 'used' | 'expired';
  device_id?: string;
  tenant_id: string;
  farm_id?: string;
  device_type?: string;
  capabilities?: any;
  expires_at: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Setup Token 상태 조회
 */
export async function getSetupTokenStatus(setupToken: string): Promise<SetupToken | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('device_claims')
    .select('*')
    .eq('setup_token', setupToken)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get setup token status: ${error.message}`);
  }

  return data;
}

/**
 * Setup Token 생성
 */
export async function createSetupToken(tokenData: Omit<SetupToken, 'id' | 'created_at' | 'updated_at'>): Promise<SetupToken> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('device_claims')
    .insert({
      setup_token: tokenData.setup_token,
      device_key: tokenData.device_key,
      status: tokenData.status,
      device_id: tokenData.device_id,
      tenant_id: tokenData.tenant_id,
      farm_id: tokenData.farm_id,
      device_type: tokenData.device_type,
      capabilities: tokenData.capabilities,
      expires_at: tokenData.expires_at
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create setup token: ${error.message}`);
  }

  return data;
}

/**
 * Setup Token 상태 업데이트
 */
export async function updateSetupTokenStatus(
  setupToken: string, 
  status: SetupToken['status'],
  deviceId?: string
): Promise<void> {
  const supabase = getSupabase();
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (deviceId) {
    updateData.device_id = deviceId;
  }

  const { error } = await supabase
    .from('device_claims')
    .update(updateData)
    .eq('setup_token', setupToken);

  if (error) {
    throw new Error(`Failed to update setup token status: ${error.message}`);
  }
}
