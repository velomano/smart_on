/**
 * MQTT Transport Adapter
 * 
 * MQTT 브로커를 통한 Pub/Sub 통신
 */

import { BridgeAdapter, Telemetry, Command, CommandAck, TransportType } from '../types/core';

export interface MqttAdapterConfig {
  brokerUrl: string;
  port: number;
  username?: string;
  password?: string;
  clientId: string;
  tenantId: string;
  farmId?: string;
  deviceId?: string;
  qos?: 0 | 1 | 2;
  keepalive?: number;
  clean?: boolean;
}

export class MqttAdapter implements BridgeAdapter {
  name: TransportType = 'mqtt';
  private config: MqttAdapterConfig;
  private client: any; // mqtt.Client
  private isConnected = false;
  private commandHandler?: (cmd: Command) => Promise<CommandAck>;

  constructor(config: MqttAdapterConfig) {
    this.config = {
      qos: 1,
      keepalive: 60,
      clean: true,
      ...config
    };
  }

  async init(): Promise<void> {
    const mqtt = require('mqtt');
    
    const connectOptions = {
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      clientId: this.config.clientId,
      keepalive: this.config.keepalive,
      clean: this.config.clean,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    };

    this.client = mqtt.connect(this.config.brokerUrl, connectOptions);

    return new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        console.log(`[MQTT Adapter] Connected to ${this.config.brokerUrl}`);
        this.isConnected = true;
        
        // 명령 구독 (디바이스 모드일 때)
        if (this.config.deviceId) {
          this.subscribeToCommands();
        }
        
        resolve();
      });

      this.client.on('error', (error: Error) => {
        console.error('[MQTT Adapter] Connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.client.on('close', () => {
        console.log('[MQTT Adapter] Connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnect', () => {
        console.log('[MQTT Adapter] Reconnecting...');
      });

      this.client.on('message', (topic: string, message: Buffer) => {
        this.handleMessage(topic, message);
      });
    });
  }

  async publishTelemetry(payload: Telemetry): Promise<void> {
    if (!this.isConnected) {
      throw new Error('MQTT client not connected');
    }

    const topic = this.getTelemetryTopic();
    const message = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      this.client.publish(topic, message, { qos: this.config.qos }, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`[MQTT Adapter] Telemetry published to ${topic}`);
          resolve();
        }
      });
    });
  }

  async sendCommand(cmd: Command): Promise<CommandAck> {
    if (!this.isConnected) {
      throw new Error('MQTT client not connected');
    }

    const topic = this.getCommandTopic(cmd.device_id);
    const message = JSON.stringify(cmd);

    return new Promise((resolve, reject) => {
      this.client.publish(topic, message, { qos: this.config.qos }, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`[MQTT Adapter] Command sent to ${topic}`);
          
          // 간단한 ACK 반환 (실제로는 디바이스에서 ACK 토픽으로 응답해야 함)
          resolve({
            device_id: cmd.device_id,
            command_id: cmd.ts, // 임시로 ts를 command_id로 사용
            ts: new Date().toISOString(),
            status: 'ack'
          });
        }
      });
    });
  }

  subscribeCommands?(onCmd: (cmd: Command) => Promise<CommandAck>): () => void {
    if (!this.config.deviceId) {
      throw new Error('Device ID required for command subscription');
    }

    this.commandHandler = onCmd;
    this.subscribeToCommands();

    return () => {
      this.commandHandler = undefined;
      this.unsubscribeFromCommands();
    };
  }

  private subscribeToCommands(): void {
    if (!this.config.deviceId) return;

    const topic = this.getCommandTopic(this.config.deviceId);
    
    this.client.subscribe(topic, { qos: this.config.qos }, (error?: Error) => {
      if (error) {
        console.error(`[MQTT Adapter] Failed to subscribe to ${topic}:`, error);
      } else {
        console.log(`[MQTT Adapter] Subscribed to commands: ${topic}`);
      }
    });
  }

  private unsubscribeFromCommands(): void {
    if (!this.config.deviceId) return;

    const topic = this.getCommandTopic(this.config.deviceId);
    
    this.client.unsubscribe(topic, (error?: Error) => {
      if (error) {
        console.error(`[MQTT Adapter] Failed to unsubscribe from ${topic}:`, error);
      } else {
        console.log(`[MQTT Adapter] Unsubscribed from commands: ${topic}`);
      }
    });
  }

  private handleMessage(topic: string, message: Buffer): void {
    try {
      const data = JSON.parse(message.toString());
      
      if (topic.includes('/commands/') && this.commandHandler) {
        // 명령 메시지 처리
        this.commandHandler(data as Command).then(ack => {
          // ACK 토픽으로 응답
          this.publishAck(ack);
        }).catch(error => {
          console.error('[MQTT Adapter] Command handling error:', error);
        });
      } else if (topic.includes('/telemetry/')) {
        // 텔레메트리 메시지 처리 (서버 모드)
        console.log(`[MQTT Adapter] Telemetry received from ${topic}:`, data);
      }
    } catch (error) {
      console.error('[MQTT Adapter] Message parsing error:', error);
    }
  }

  private publishAck(ack: CommandAck): void {
    const topic = this.getAckTopic(ack.device_id);
    const message = JSON.stringify(ack);

    this.client.publish(topic, message, { qos: this.config.qos }, (error?: Error) => {
      if (error) {
        console.error(`[MQTT Adapter] Failed to publish ACK:`, error);
      } else {
        console.log(`[MQTT Adapter] ACK published to ${topic}`);
      }
    });
  }

  private getTelemetryTopic(): string {
    const farmId = this.config.farmId || 'default';
    return `farm/${farmId}/telemetry/${this.config.deviceId || 'unknown'}`;
  }

  private getCommandTopic(deviceId: string): string {
    const farmId = this.config.farmId || 'default';
    return `farm/${farmId}/commands/${deviceId}`;
  }

  private getAckTopic(deviceId: string): string {
    const farmId = this.config.farmId || 'default';
    return `farm/${farmId}/ack/${deviceId}`;
  }

  async destroy?(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client.end(false, () => {
          console.log('[MQTT Adapter] Disconnected');
          resolve();
        });
      });
    }
  }
}
