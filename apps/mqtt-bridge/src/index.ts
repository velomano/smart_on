import { createClient } from '@supabase/supabase-js';
import mqtt from 'mqtt';
import crypto from 'crypto';
import cron from 'node-cron';
import { logger } from './utils/logger.js';
import { loadFarmConfigs } from './loadConfig.js';
import { handleRegistry } from './handlers/registry.js';
import { handleState } from './handlers/state.js';
import { handleTelemetry } from './handlers/telemetry.js';
import { handleCommandAck } from './handlers/commandAck.js';
import { dispatchPendingCommands } from './dispatch/commands.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const clients = new Map<string, mqtt.MqttClient>();

interface FarmConfig {
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

async function decryptSecret(secret_enc: string): Promise<string> {
  const ALG = 'aes-256-cbc';
  const KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'change-me').digest();
  const IV = Buffer.alloc(16, 0);
  
  const decipher = crypto.createDecipheriv(ALG, KEY, IV);
  return decipher.update(secret_enc, 'hex', 'utf8') + decipher.final('utf8');
}

async function connectToFarm(farmConfig: FarmConfig): Promise<void> {
  const { farm_id, broker_url, port, auth_mode, username, secret_enc, client_id_prefix, ws_path, qos_default } = farmConfig;
  
  const secret = secret_enc ? await decryptSecret(secret_enc) : undefined;
  
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
      client.subscribe(topic, { qos: qos_default });
      logger.info(`Subscribed to ${topic}`);
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
      
      logger.debug(`Received ${messageType} for device ${deviceId}`, { topic, payload });
      
      switch (messageType) {
        case 'registry':
          await handleRegistry(supabase, farm_id, deviceId, payload);
          break;
        case 'state':
          await handleState(supabase, farm_id, deviceId, payload);
          break;
        case 'telemetry':
          await handleTelemetry(supabase, farm_id, deviceId, payload);
          break;
        case 'command':
          if (topicParts[4] === 'ack') {
            await handleCommandAck(supabase, farm_id, deviceId, payload);
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

  // LWT (Last Will and Testament) for offline detection
  client.on('connect', () => {
    const lwtTopic = `farms/${farm_id}/bridge/offline`;
    client.publish(lwtTopic, JSON.stringify({
      farm_id,
      bridge_id: clientId,
      status: 'offline',
      timestamp: new Date().toISOString()
    }), { qos: 1, retain: true });
  });

  clients.set(farm_id, client);
}

async function disconnectFromFarm(farmId: string): Promise<void> {
  const client = clients.get(farmId);
  if (client) {
    client.end();
    clients.delete(farmId);
    logger.info(`Disconnected from farm ${farmId}`);
  }
}

async function reloadConfigs(): Promise<void> {
  logger.info('Reloading farm configurations...');
  
  try {
    const configs = await loadFarmConfigs(supabase);
    
    // Disconnect from farms that are no longer active
    for (const [farmId, client] of clients.entries()) {
      if (!configs.find(c => c.farm_id === farmId && c.is_active)) {
        await disconnectFromFarm(farmId);
      }
    }
    
    // Connect to new or updated farms
    for (const config of configs) {
      if (config.is_active) {
        const existingClient = clients.get(config.farm_id);
        if (!existingClient || existingClient.connected === false) {
          await connectToFarm(config);
        }
      }
    }
    
    logger.info(`Active connections: ${clients.size}`);
  } catch (error) {
    logger.error('Error reloading configurations', { error });
  }
}

async function main(): Promise<void> {
  logger.info('Starting MQTT Bridge...');
  
  // Initial load
  await reloadConfigs();
  
  // Schedule periodic config reload (every 5 minutes)
  cron.schedule('*/5 * * * *', reloadConfigs);
  
  // Schedule command dispatch (every 10 seconds)
  cron.schedule('*/10 * * * * *', async () => {
    try {
      await dispatchPendingCommands(supabase, clients);
    } catch (error) {
      logger.error('Error dispatching commands', { error });
    }
  });
  
  logger.info('MQTT Bridge started successfully');
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down MQTT Bridge...');
  
  for (const [farmId] of clients.entries()) {
    await disconnectFromFarm(farmId);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down MQTT Bridge...');
  
  for (const [farmId] of clients.entries()) {
    await disconnectFromFarm(farmId);
  }
  
  process.exit(0);
});

// Start the bridge
main().catch((error) => {
  logger.error('Fatal error in MQTT Bridge', { error });
  process.exit(1);
});
