import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

export async function handleRegistry(
  supabase: SupabaseClient,
  farmId: string,
  deviceId: string,
  payload: any
): Promise<void> {
  try {
    const { sensors = [], actuators = [] } = payload;
    
    // Upsert device
    const { error: deviceError } = await supabase
      .from('devices')
      .upsert({
        id: deviceId,
        farm_id: farmId,
        type: 'sensor_gateway',
        status: { online: true, last_seen: new Date().toISOString() },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (deviceError) {
      logger.error('Failed to upsert device', { farmId, deviceId, error: deviceError });
      return;
    }

    // Upsert sensors
    for (const sensor of sensors) {
      const { key, unit, tier, meta } = sensor;
      
      const { error: sensorError } = await supabase
        .from('sensors')
        .upsert({
          device_id: deviceId,
          type: key,
          unit,
          tier_number: tier || 1,
          meta: meta || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'device_id,type'
        });

      if (sensorError) {
        logger.error('Failed to upsert sensor', { farmId, deviceId, sensor: key, error: sensorError });
      }
    }

    // Update device with actuator info
    const { error: updateError } = await supabase
      .from('devices')
      .update({
        status: {
          online: true,
          last_seen: new Date().toISOString(),
          actuators: actuators.map((a: any) => ({
            key: a.key,
            type: a.type,
            status: 'unknown'
          }))
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceId);

    if (updateError) {
      logger.error('Failed to update device actuators', { farmId, deviceId, error: updateError });
    }

    logger.info('Registry processed', { farmId, deviceId, sensors: sensors.length, actuators: actuators.length });
  } catch (error) {
    logger.error('Error processing registry', { farmId, deviceId, error });
  }
}
