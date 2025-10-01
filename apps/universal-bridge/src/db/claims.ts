/**
 * Device Claims DB Operations
 * 
 * Setup Token 관련 DB 작업
 */

import { getSupabase } from './client.js';
import crypto from 'crypto';

export interface ClaimRecord {
  id?: string;
  tenant_id: string;
  setup_token_hash: string;
  farm_id?: string;
  expires_at: Date;
  ip_bound?: string[];
  user_agent?: string;
  created_by?: string;
}

/**
 * Setup Token 저장
 */
export async function createClaim(claim: ClaimRecord) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('device_claims')
    .insert({
      tenant_id: claim.tenant_id,
      setup_token_hash: claim.setup_token_hash,
      farm_id: claim.farm_id,
      expires_at: claim.expires_at.toISOString(),
      ip_bound: claim.ip_bound,
      user_agent: claim.user_agent,
      created_by: claim.created_by,
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] Failed to create claim:', error);
    throw error;
  }

  console.log('[DB] Claim created:', data.id);
  return data;
}

/**
 * Setup Token 검증 및 조회
 */
export async function getClaimByToken(token: string) {
  const supabase = getSupabase();
  const tokenHash = hashSetupToken(token);
  
  const { data, error } = await supabase
    .from('device_claims')
    .select('*')
    .eq('setup_token_hash', tokenHash)
    .is('used_at', null)  // 미사용
    .gt('expires_at', new Date().toISOString())  // 미만료
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[DB] Failed to get claim:', error);
    throw error;
  }

  return data;
}

/**
 * Setup Token 사용 처리
 */
export async function markClaimAsUsed(claimId: string, deviceId: string) {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('device_claims')
    .update({
      used_at: new Date().toISOString(),
      used_by_device_id: deviceId,
    })
    .eq('id', claimId);

  if (error) {
    console.error('[DB] Failed to mark claim as used:', error);
    throw error;
  }

  console.log('[DB] Claim marked as used:', claimId);
}

/**
 * Setup Token 해시
 */
export function hashSetupToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

/**
 * 만료된 토큰 정리
 */
export async function cleanupExpiredClaims() {
  const supabase = getSupabase();
  
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  
  const { error } = await supabase
    .from('device_claims')
    .delete()
    .lt('expires_at', oneDayAgo);

  if (error) {
    console.error('[DB] Failed to cleanup claims:', error);
  } else {
    console.log('[DB] Expired claims cleaned up');
  }
}

