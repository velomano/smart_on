import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import { batchTelemetryReadings } from '../utils/batching.js';

export async function handleTelemetry(
  supabase: SupabaseClient,
  farmId: string,
  deviceId: string,
  payload: any
): Promise<void> {
  try {
    const { readings = [], batch_seq, window_ms } = payload;
    
    if (readings.length === 0) {
      logger.debug('No readings in telemetry payload', { farmId, deviceId });
      return;
    }

    // Get device sensors for mapping
    const { data: sensors, error: sensorsError } = await supabase
      .from('sensors')
      .select('id, type, unit')
      .eq('device_id', deviceId);

    if (sensorsError) {
      logger.error('Failed to fetch device sensors', { farmId, deviceId, error: sensorsError });
      return;
    }

    // Create sensor lookup map
    const sensorMap = new Map();
    sensors?.forEach(sensor => {
      sensorMap.set(`${sensor.type}-${sensor.unit}`, sensor.id);
    });

    // Prepare readings for batch insert
    const readingsToInsert = readings
      .map((reading: any) => {
        const { key, tier, unit, ts, value } = reading;
        const sensorId = sensorMap.get(`${key}-${unit}`);
        
        if (!sensorId) {
          logger.warn('Unknown sensor type/unit combination', { farmId, deviceId, key, unit });
          return null;
        }

        return {
          sensor_id: sensorId,
          value: parseFloat(value),
          unit,
          ts: new Date(ts).toISOString(),
          quality: 'good', // Default quality, could be enhanced
          created_at: new Date().toISOString()
        };
      })
      .filter(Boolean);

    if (readingsToInsert.length === 0) {
      logger.warn('No valid readings to insert', { farmId, deviceId, totalReadings: readings.length });
      return;
    }

    // Batch insert with conflict resolution
    const { error: insertError } = await supabase
      .from('sensor_readings')
      .upsert(readingsToInsert, {
        onConflict: 'sensor_id,ts',
        ignoreDuplicates: false
      });

    if (insertError) {
      logger.error('Failed to insert telemetry readings', { 
        farmId, 
        deviceId, 
        error: insertError,
        readingsCount: readingsToInsert.length
      });
      return;
    }

    logger.info('Telemetry processed', { 
      farmId, 
      deviceId, 
      readings: readingsToInsert.length,
      batch_seq,
      window_ms
    });
  } catch (error) {
    logger.error('Error processing telemetry', { farmId, deviceId, error });
  }
}
