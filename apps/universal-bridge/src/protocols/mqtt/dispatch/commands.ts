import { SupabaseClient } from '@supabase/supabase-js';
import mqtt from 'mqtt';
import { logger } from '../utils/logger.js';

export async function dispatchPendingCommands(
  supabase: SupabaseClient,
  clients: Map<string, mqtt.MqttClient>
): Promise<void> {
  try {
    // Get pending commands
    const { data: commands, error } = await supabase
      .from('commands')
      .select(`
        *,
        devices!inner(
          id,
          farm_id,
          status
        )
      `)
      .eq('status', 'pending')
      .lte('expires_at', new Date().toISOString()) // Only non-expired commands
      .limit(50); // Batch size

    if (error) {
      logger.error('Failed to fetch pending commands', { error });
      return;
    }

    if (!commands || commands.length === 0) {
      return; // No pending commands
    }

    logger.debug(`Processing ${commands.length} pending commands`);

    for (const command of commands) {
      const device = command.devices;
      if (!device) continue;

      const farmId = device.farm_id;
      const deviceId = device.id;
      const client = clients.get(farmId);

      if (!client || !client.connected) {
        logger.warn('No active MQTT connection for farm', { farmId, deviceId, command_id: command.correlation_id });
        
        // Mark command as error
        await supabase
          .from('commands')
          .update({
            status: 'error',
            detail: 'No active MQTT connection',
            updated_at: new Date().toISOString()
          })
          .eq('id', command.id);
        
        continue;
      }

      // Publish command
      const topic = `farms/${farmId}/devices/${deviceId}/command`;
      const payload = {
        command_id: command.correlation_id,
        command: command.command,
        payload: command.payload,
        timestamp: new Date().toISOString()
      };

      try {
        client.publish(topic, JSON.stringify(payload), { qos: 1 });
        
        // Update command status to sent
        await supabase
          .from('commands')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', command.id);

        logger.info('Command dispatched', { 
          farmId, 
          deviceId, 
          command_id: command.correlation_id,
          command: command.command,
          topic
        });
      } catch (error) {
        logger.error('Failed to publish command', { 
          farmId, 
          deviceId, 
          command_id: command.correlation_id,
          error 
        });
        
        // Mark command as error
        await supabase
          .from('commands')
          .update({
            status: 'error',
            detail: `Publish failed: ${error}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', command.id);
      }
    }
  } catch (error) {
    logger.error('Error dispatching commands', { error });
  }
}
