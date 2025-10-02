import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

export async function handleCommandAck(
  supabase: SupabaseClient,
  farmId: string,
  deviceId: string,
  payload: any
): Promise<void> {
  try {
    const { command_id, status, detail, state } = payload;
    
    if (!command_id) {
      logger.warn('Command ACK without command_id', { farmId, deviceId, payload });
      return;
    }

    // Update command status
    const { error: updateError } = await supabase
      .from('commands')
      .update({
        status: status === 'success' ? 'done' : 'error',
        detail: detail || null,
        executed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('correlation_id', command_id);

    if (updateError) {
      logger.error('Failed to update command status', { 
        farmId, 
        deviceId, 
        command_id, 
        error: updateError 
      });
      return;
    }

    // Update device state if provided
    if (state) {
      const { error: stateError } = await supabase
        .from('devices')
        .update({
          status: {
            online: true,
            last_seen: new Date().toISOString(),
            ...state
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', deviceId);

      if (stateError) {
        logger.error('Failed to update device state from ACK', { 
          farmId, 
          deviceId, 
          error: stateError 
        });
      }
    }

    logger.info('Command ACK processed', { 
      farmId, 
      deviceId, 
      command_id, 
      status,
      detail 
    });
  } catch (error) {
    logger.error('Error processing command ACK', { farmId, deviceId, error });
  }
}
