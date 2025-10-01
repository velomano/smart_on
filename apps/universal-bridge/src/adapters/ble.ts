/**
 * Bluetooth LE Transport Adapter
 * 
 * BLE GATT를 통한 무선 통신
 */

import { BridgeAdapter, Telemetry, Command, CommandAck, TransportType } from '../types/core';

export interface BleAdapterConfig {
  serviceUuid: string;
  characteristicUuid: string;
  tenantId: string;
  farmId?: string;
  deviceId?: string;
  deviceName?: string;
  scanTimeout?: number;
}

export class BleAdapter implements BridgeAdapter {
  name: TransportType = 'ble';
  private config: BleAdapterConfig;
  private device?: BluetoothDevice;
  private characteristic?: BluetoothRemoteGATTCharacteristic;
  private isConnected = false;
  private commandHandler?: (cmd: Command) => Promise<CommandAck>;

  constructor(config: BleAdapterConfig) {
    this.config = {
      scanTimeout: 10000,
      ...config
    };
  }

  async init(): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error('Bluetooth not supported');
    }

    await this.connect();
  }

  private async connect(): Promise<void> {
    try {
      // BLE 디바이스 스캔 및 연결
      this.device = await navigator.bluetooth.requestDevice({
        filters: this.config.deviceName ? [{ name: this.config.deviceName }] : undefined,
        optionalServices: [this.config.serviceUuid]
      });

      const server = await this.device.gatt?.connect();
      if (!server) throw new Error('GATT server connection failed');

      const service = await server.getPrimaryService(this.config.serviceUuid);
      this.characteristic = await service.getCharacteristic(this.config.characteristicUuid);

      // 알림 구독
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
        this.handleNotification(event);
      });

      this.isConnected = true;
      console.log('[BLE Adapter] Connected to device');

    } catch (error) {
      console.error('[BLE Adapter] Connection failed:', error);
      throw error;
    }
  }

  async publishTelemetry(payload: Telemetry): Promise<void> {
    if (!this.isConnected || !this.characteristic) {
      throw new Error('BLE not connected');
    }

    const data = new TextEncoder().encode(JSON.stringify(payload));
    await this.characteristic.writeValue(data);
    console.log('[BLE Adapter] Telemetry sent');
  }

  async sendCommand(cmd: Command): Promise<CommandAck> {
    if (!this.isConnected || !this.characteristic) {
      throw new Error('BLE not connected');
    }

    const data = new TextEncoder().encode(JSON.stringify(cmd));
    await this.characteristic.writeValue(data);
    
    return {
      device_id: cmd.device_id,
      command_id: cmd.ts,
      ts: new Date().toISOString(),
      status: 'ack'
    };
  }

  subscribeCommands?(onCmd: (cmd: Command) => Promise<CommandAck>): () => void {
    this.commandHandler = onCmd;
    return () => {
      this.commandHandler = undefined;
    };
  }

  private handleNotification(event: Event): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    
    if (!value) return;

    try {
      const data = new TextDecoder().decode(value);
      const message = JSON.parse(data);
      
      if (message.type === 'command' && this.commandHandler) {
        this.commandHandler(message).then(ack => {
          // ACK 전송
          const ackData = new TextEncoder().encode(JSON.stringify({ type: 'ack', data: ack }));
          this.characteristic?.writeValue(ackData);
        });
      }
    } catch (error) {
      console.error('[BLE Adapter] Notification parsing error:', error);
    }
  }

  async destroy?(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.isConnected = false;
  }
}
