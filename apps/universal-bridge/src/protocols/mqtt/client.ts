/**
 * MQTT Client Integration
 * 
 * 기존 MQTT Bridge의 클라이언트 로직을 Universal Bridge에 통합
 */

import mqtt from 'mqtt';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';
import { handleRegistry } from './handlers/registry.js';
import { handleState } from './handlers/state.js';
import { handleTelemetry } from './handlers/telemetry.js';
import { handleCommandAck } from './handlers/commandAck.js';
import { dispatchPendingCommands } from './dispatch/commands.js';
import { createClient } from '@supabase/supabase-js';

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
}

export class MQTTClientManager {
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
    const key = Buffer.from(process.env.BRIDGE_ENCRYPTION_KEY!, 'hex');
    const decipher = crypto.createDecipher(ALG, key);
    return decipher.update(secret_enc, 'hex', 'utf8') + decipher.final('utf8');
  }

  async connectToFarm(farmConfig: FarmConfig): Promise<void> {
    const {
      farm_id,
      broker_url,
      port,
      auth_mode,
      username,
      secret_enc,
      client_id_prefix,
      ws_path,
      qos_default
    } = farmConfig;

    const secret = secret_enc ? await this.decryptSecret(secret_enc) : undefined;
    const clientId = `${client_id_prefix}-${farm_id}-${Date.now()}`;

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
      logger.info(`Connected to farm ${farm_id}`, { broker_url, port });
      
      // Subscribe to all topics for this farm
      const farmTopics = [
        `farms/${farm_id}/+/+/registry`,
        `farms/${farm_id}/+/+/state`,
        `farms/${farm_id}/+/+/telemetry`,
        `farms/${farm_id}/+/+/command/ack`
      ];
      
      farmTopics.forEach(topic => {
        client.subscribe(topic, { qos: qos_default }, () => {
          logger.info(`Subscribed to ${topic}`);
        });
      });

      // LWT (Last Will and Testament) for offline detection
      const lwtTopic = `farms/${farm_id}/bridge/offline`;
      client.publish(lwtTopic, JSON.stringify({
        farm_id,
        bridge_id: clientId,
        status: 'offline',
        timestamp: new Date().toISOString()
      }), { qos: 1, retain: true });
    });

    client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        // Extract farm_id and device_id from topic
        const topicParts = topic.split('/');
        if (topicParts.length < 4) return;
        
        const deviceId = topicParts[2];
        const messageType = topicParts[3];
        
        logger.debug(`Received ${messageType} for device ${deviceId}`, { topic, payload });
        
        switch (messageType) {
          case 'registry':
            await handleRegistry(this.supabase, farm_id, deviceId, payload);
            break;
          case 'state':
            await handleState(this.supabase, farm_id, deviceId, payload);
            break;
          case 'telemetry':
            await handleTelemetry(this.supabase, farm_id, deviceId, payload);
            break;
          case 'command':
            if (topicParts[4] === 'ack') {
              await handleCommandAck(this.supabase, farm_id, deviceId, payload);
            }
            break;
        }
      } catch (error) {
        logger.error(`Error processing message from ${topic}`, { error, message: message.toString() });
      }
    });

    client.on('error', (error) => {
      logger.error(`MQTT error for farm ${farm_id}`, { error });
    });

    client.on('offline', () => {
      logger.warn(`MQTT client offline for farm ${farm_id}`);
    });

    client.on('reconnect', () => {
      logger.info(`MQTT client reconnecting for farm ${farm_id}`);
    });

    this.clients.set(farm_id, client);
  }

  async disconnectFromFarm(farmId: string): Promise<void> {
    const client = this.clients.get(farmId);
    if (client) {
      await client.endAsync();
      this.clients.delete(farmId);
      logger.info(`Disconnected from farm ${farmId}`);
    }
  }

  async dispatchCommands(): Promise<void> {
    await dispatchPendingCommands(this.supabase, this.clients);
  }

  getClient(farmId: string): mqtt.MqttClient | undefined {
    return this.clients.get(farmId);
  }

  getAllClients(): Map<string, mqtt.MqttClient> {
    return this.clients;
  }
}