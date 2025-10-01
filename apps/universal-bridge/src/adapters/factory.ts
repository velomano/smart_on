/**
 * Transport Adapter Factory
 * 
 * 설정에 따라 적절한 Adapter 인스턴스 생성
 */

import { BridgeAdapter, TransportType } from '../types/core';
import { HttpAdapter } from './http';
import { MqttAdapter } from './mqtt';
import { WebSocketAdapter } from './websocket';
import { SerialAdapter } from './serial';
import { BleAdapter } from './ble';
import { WebhookAdapter } from './webhook';
import { Rs485Adapter } from './rs485';

export interface AdapterConfig {
  transport: TransportType;
  config: any;
  tenantId: string;
  farmId?: string;
}

/**
 * Transport 타입에 따라 적절한 Adapter 생성
 */
export async function createAdapter(config: AdapterConfig): Promise<BridgeAdapter> {
  const { transport, config: transportConfig, tenantId, farmId } = config;

  switch (transport) {
    case 'http':
      return new HttpAdapter({
        baseUrl: transportConfig.baseUrl || 'http://localhost:3001',
        tenantId,
        farmId,
        ...transportConfig
      });

    case 'mqtt':
      return new MqttAdapter({
        brokerUrl: transportConfig.brokerUrl,
        port: transportConfig.port || 1883,
        username: transportConfig.username,
        password: transportConfig.password,
        clientId: transportConfig.clientId,
        tenantId,
        farmId,
        ...transportConfig
      });

    case 'websocket':
      return new WebSocketAdapter({
        wsUrl: transportConfig.wsUrl || 'ws://localhost:3001',
        tenantId,
        farmId,
        ...transportConfig
      });

    case 'serial':
      return new SerialAdapter({
        port: transportConfig.port,
        baudRate: transportConfig.baudRate || 9600,
        tenantId,
        farmId,
        ...transportConfig
      });

    case 'ble':
      return new BleAdapter({
        serviceUuid: transportConfig.serviceUuid,
        characteristicUuid: transportConfig.characteristicUuid,
        tenantId,
        farmId,
        ...transportConfig
      });

    case 'webhook':
      return new WebhookAdapter({
        webhookUrl: transportConfig.webhookUrl,
        secret: transportConfig.secret,
        tenantId,
        farmId,
        ...transportConfig
      });

    case 'rs485':
      return new Rs485Adapter({
        port: transportConfig.port,
        baudRate: transportConfig.baudRate || 9600,
        parity: transportConfig.parity || 'none',
        stopBits: transportConfig.stopBits || 1,
        slaveId: transportConfig.slaveId || 1,
        timeoutMs: transportConfig.timeoutMs || 1000,
        tenantId,
        farmId,
        ...transportConfig
      });

    default:
      throw new Error(`Unsupported transport type: ${transport}`);
  }
}

/**
 * 여러 Transport를 동시에 지원하는 멀티 어댑터
 */
export class MultiAdapter implements BridgeAdapter {
  name: TransportType = 'http'; // 기본값
  private adapters: Map<TransportType, BridgeAdapter> = new Map();

  async addAdapter(transport: TransportType, adapter: BridgeAdapter): Promise<void> {
    this.adapters.set(transport, adapter);
  }

  async init(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      await adapter.init();
    }
  }

  async publishTelemetry(payload: any): Promise<void> {
    // 모든 활성 어댑터로 전송
    const promises = Array.from(this.adapters.values()).map(adapter => 
      adapter.publishTelemetry(payload).catch(err => 
        console.error(`Failed to publish via ${adapter.name}:`, err)
      )
    );
    await Promise.allSettled(promises);
  }

  async sendCommand(cmd: any): Promise<any> {
    // 첫 번째 활성 어댑터로 전송
    const adapter = Array.from(this.adapters.values())[0];
    if (!adapter) {
      throw new Error('No active adapters');
    }
    return adapter.sendCommand(cmd);
  }

  subscribeCommands?(onCmd: (cmd: any) => Promise<any>): () => void {
    const unsubscribers: (() => void)[] = [];
    
    for (const adapter of this.adapters.values()) {
      if (adapter.subscribeCommands) {
        const unsubscribe = adapter.subscribeCommands(onCmd);
        unsubscribers.push(unsubscribe);
      }
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  async destroy?(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      if (adapter.destroy) {
        await adapter.destroy();
      }
    }
  }
}
