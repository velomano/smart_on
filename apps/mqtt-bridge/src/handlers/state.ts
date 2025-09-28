import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

export async function handleState(
  supabase: SupabaseClient,
  farmId: string,
  deviceId: string,
  payload: any
): Promise<void> {
  try {
    const { online, last_seen, actuators, health } = payload;
    
    // Get current device status
    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('status')
      .eq('id', deviceId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch device status', { farmId, deviceId, error: fetchError });
      return;
    }

    // Merge with existing status
    const currentStatus = device?.status || {};
    const newStatus = {
      ...currentStatus,
      online: online !== undefined ? online : currentStatus.online,
      last_seen: last_seen || new Date().toISOString(),
      ...(actuators && { actuators }),
      ...(health && { health })
    };

    // Update device status
    const { error: updateError } = await supabase
      .from('devices')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceId);

    if (updateError) {
      logger.error('Failed to update device state', { farmId, deviceId, error: updateError });
      return;
    }

    logger.debug('State updated', { farmId, deviceId, online, last_seen });
  } catch (error) {
    logger.error('Error processing state', { farmId, deviceId, error });
  }
}
