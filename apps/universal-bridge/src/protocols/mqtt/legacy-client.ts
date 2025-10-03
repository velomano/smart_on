/**
 * Legacy MQTT Client for Universal Bridge
 * 
 * 기존 MQTT Bridge와의 호환성을 위한 Legacy 토픽 지원
 * 토픽: farms/{farmId}/devices/{deviceId}/...
 */

import mqtt from 'mqtt';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';
import { createClient } from '@supabase/supabase-js';

export interface LegacyFarmConfig {
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

export class LegacyMQTTClientManager {
  private clients = new Map<string, mqtt.MqttClient>();
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async decryptSecret(secret_enc: string): Promise<string> {
    const ALG = 'aes-256-cbc';
    const KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'change-me').digest();
    const IV = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv(ALG, KEY, IV);
    return decipher.update(secret_enc, 'hex', 'utf8') + decipher.final('utf8');
  }

  async connectToFarm(farmConfig: LegacyFarmConfig): Promise<void> {
    const { farm_id, broker_url, port, auth_mode, username, secret_enc, client_id_prefix, ws_path, qos_default } = farmConfig;
    
    if (!farmConfig.is_active) {
      logger.info(`Skipping inactive farm: ${farm_id}`);
      return;
    }

    const secret = secret_enc ? await this.decryptSecret(secret_enc) : undefined;
    const clientId = `legacy-${client_id_prefix}-${farm_id}-${Date.now()}`;
    
    const options: mqtt.IClientOptions = {
      clientId,
      port,
      username: auth_mode === 'api_key' ? 'apikey' : username || undefined,
      password: secret,
      keepalive: 60,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      rejectUnauthorized: true,
      clean: false, // persistent session
      ...(ws_path && { path: ws_path })
    };

    const client = mqtt.connect(broker_url, options);

    client.on('connect', () => {
      logger.info(`[Legacy] Connected to farm ${farm_id}`, { broker_url, port });
      
      // Subscribe to legacy topics
      const farmTopics = [
        `farms/${farm_id}/+/+/registry`,
        `farms/${farm_id}/+/+/state`,
        `farms/${farm_id}/+/+/telemetry`,
        `farms/${farm_id}/+/+/command/ack`
      ];
      
      farmTopics.forEach(topic => {
        client.subscribe(topic, { qos: qos_default as any });
        logger.info(`[Legacy] Subscribed to ${topic}`);
      });
    });

    client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        // Extract farm_id and device_id from topic
        const topicParts = topic.split('/');
        if (topicParts.length < 4) return;
        
        const deviceId = topicParts[2];
        const messageType = topicParts[3];
        
        logger.debug(`[Legacy] Received ${messageType} for device ${deviceId}`, { topic, payload });
        
        // Convert legacy topic to new format and save to iot_readings
        await this.handleLegacyMessage(farm_id, deviceId, messageType, payload);
        
      } catch (error: unknown) {
        logger.error(`[Legacy] Error processing message from ${topic}`, { 
          error: error instanceof Error ? error.message : String(error), 
          message: message.toString() 
        });
      }
    });

    client.on('error', (error) => {
      logger.error(`[Legacy] MQTT error for farm ${farm_id}`, { error });
    });

    client.on('offline', () => {
      logger.warn(`[Legacy] MQTT client offline for farm ${farm_id}`);
    });

    client.on('reconnect', () => {
      logger.info(`[Legacy] MQTT client reconnecting for farm ${farm_id}`);
    });

    this.clients.set(farm_id, client);
  }

  private async handleLegacyMessage(
    farmId: string, 
    deviceId: string, 
    messageType: string, 
    payload: any
  ): Promise<void> {
    try {
      switch (messageType) {
        case 'registry':
          await this.handleLegacyRegistry(farmId, deviceId, payload);
          break;
        case 'state':
          await this.handleLegacyState(farmId, deviceId, payload);
          break;
        case 'telemetry':
          await this.handleLegacyTelemetry(farmId, deviceId, payload);
          break;
        case 'command':
          if (payload.command_id) {
            await this.handleLegacyCommandAck(farmId, deviceId, payload);
          }
          break;
      }
    } catch (error) {
      logger.error(`[Legacy] Error handling ${messageType} message`, { error, farmId, deviceId });
    }
  }

  private async handleLegacyRegistry(farmId: string, deviceId: string, payload: any): Promise<void> {
    // Convert legacy registry to iot_devices table
    try {
      const { data: device } = await this.supabase
        .from('iot_devices')
        .upsert({
          device_id: deviceId,
          tenant_id: farmId, // Use farm_id as tenant_id for legacy compatibility
          farm_id: farmId,
          profile_id: null,
          device_type: 'sensor_gateway',
          capabilities: payload,
          last_seen_at: new Date().toISOString()
        }, {
          onConflict: 'device_id,tenant_id'
        })
        .select()
        .single();

      if (device) {
        logger.info(`[Legacy] Device ${deviceId} registered successfully`);
      }
        } catch (error: unknown) {
          logger.error(`[Legacy] Error registering device ${deviceId}`, { 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
  }

  private async handleLegacyState(farmId: string, deviceId: string, payload: any): Promise<void> {
    // Update device last seen time
    try {
      await this.supabase
        .from('iot_devices')
        .update({
          last_seen_at: new Date().toISOString(),
          device_status: payload.online ? 'online' : 'offline'
        })
        .eq('device_id', deviceId)
        .eq('tenant_id', farmId);

      logger.debug(`[Legacy] Device ${deviceId} state updated`);
    } catch (error) {
      logger.error(`[Legacy] Error updating device state ${deviceId}`, { error });
    }
  }

  private async handleLegacyTelemetry(farmId: string, deviceId: string, payload: any): Promise<void> {
    // Convert legacy telemetry to iot_readings table
    try {
      if (payload.readings && Array.isArray(payload.readings)) {
        const readings = payload.readings.map((reading: any) => ({
          device_uuid: deviceId,
          key: reading.key,
          value: reading.value,
          unit: reading.unit || '',
          ts: reading.ts || new Date().toISOString(),
          tenant_id: farmId
        }));

        const { error } = await this.supabase
          .from('iot_readings')
          .insert(readings);

        if (error) {
          logger.error(`[Legacy] Error inserting telemetry for device ${deviceId}`, { error });
        } else {
          logger.debug(`[Legacy] Inserted ${readings.length} readings for device ${deviceId}`);
        }
      }
    } catch (error: unknown) {
      logger.error(`[Legacy] Error processing telemetry for device ${deviceId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  private async handleLegacyCommandAck(farmId: string, deviceId: string, payload: any): Promise<void> {
    // Handle command acknowledgments
    try {
      const { error } = await this.supabase
        .from('iot_commands')
        .update({
          status: payload.status,
          ack_payload: payload,
          ack_timestamp: new Date().toISOString()
        })
        .eq('device_id', deviceId)
        .eq('command_id', payload.command_id);

      if (error) {
        logger.error(`[Legacy] Error updating command ACK for device ${deviceId}`, { error });
      } else {
        logger.debug(`[Legacy] Command ACK processed for device ${deviceId}, command ${payload.command_id}`);
      }
    } catch (error: unknown) {
      logger.error(`[Legacy] Error processing command ACK for device ${deviceId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  async disconnectFromFarm(farmId: string): Promise<void> {
    const client = this.clients.get(farmId);
    if (client) {
      client.end();
      this.clients.delete(farmId);
      logger.info(`[Legacy] Disconnected from farm ${farmId}`);
    }
  }

  async loadFarmConfigs(): Promise<LegacyFarmConfig[]> {
    try {
      const { data, error } = await this.supabase
        .from('farm_mqtt_configs')
        .select('*')
        .eq('is_active', true);

      if (error) {
        logger.error('[Legacy] Error loading farm configurations', { error });
        return [];
      }

      return data || [];
    } catch (error: unknown) {
      logger.error('[Legacy] Error loading farm configurations', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return [];
    }
  }

  async reloadConfigs(): Promise<void> {
    logger.info('[Legacy] Reloading farm configurations...');
    
    try {
      const configs = await this.loadFarmConfigs();
      
      // Disconnect from farms that are no longer active
      for (const [farmId, client] of this.clients.entries()) {
        if (!configs.find(c => c.farm_id === farmId && c.is_active)) {
          await this.disconnectFromFarm(farmId);
        }
      }
      
      // Connect to new or updated farms
      for (const config of configs) {
        if (config.is_active) {
          const existingClient = this.clients.get(config.farm_id);
          if (!existingClient || existingClient.connected === false) {
            await this.connectToFarm(config);
          }
        }
      }
      
      logger.info(`[Legacy] Active connections: ${this.clients.size}`);
    } catch (error: unknown) {
      logger.error('[Legacy] Error reloading configurations', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  getActiveConnections(): number {
    return this.clients.size;
  }

  async shutdown(): Promise<void> {
    logger.info('[Legacy] Shutting down Legacy MQTT Client Manager...');
    
    for (const [farmId] of this.clients.entries()) {
      await this.disconnectFromFarm(farmId);
    }
    
    logger.info('[Legacy] Legacy MQTT Client Manager shutdown complete');
  }
}
