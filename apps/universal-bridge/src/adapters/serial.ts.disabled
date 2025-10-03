/**
 * Serial Transport Adapter
 * 
 * USB Serial을 통한 직접 통신
 */

import { BridgeAdapter, Telemetry, Command, CommandAck, TransportType } from '../types/core';

export interface SerialAdapterConfig {
  port: string;
  baudRate: number;
  tenantId: string;
  farmId?: string;
  deviceId?: string;
  dataBits?: number;
  stopBits?: number;
  parity?: 'none' | 'even' | 'odd';
}

export class SerialAdapter implements BridgeAdapter {
  name: TransportType = 'serial';
  private config: SerialAdapterConfig;
  private serialPort?: any;
  private isConnected = false;
  private commandHandler?: (cmd: Command) => Promise<CommandAck>;

  constructor(config: SerialAdapterConfig) {
    this.config = {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      ...config
    };
  }

  async init(): Promise<void> {
    const SerialPort = require('serialport');
    
    this.serialPort = new SerialPort(this.config.port, {
      baudRate: this.config.baudRate,
      dataBits: this.config.dataBits,
      stopBits: this.config.stopBits,
      parity: this.config.parity
    });

    return new Promise((resolve, reject) => {
      this.serialPort.on('open', () => {
        console.log(`[Serial Adapter] Connected to ${this.config.port}`);
        this.isConnected = true;
        resolve();
      });

      this.serialPort.on('data', (data: Buffer) => {
        this.handleData(data);
      });

      this.serialPort.on('error', (error: Error) => {
        console.error('[Serial Adapter] Error:', error);
        reject(error);
      });
    });
  }

  async publishTelemetry(payload: Telemetry): Promise<void> {
    if (!this.isConnected || !this.serialPort) {
      throw new Error('Serial port not connected');
    }

    const message = JSON.stringify(payload) + '\n';
    this.serialPort.write(message);
    console.log('[Serial Adapter] Telemetry sent');
  }

  async sendCommand(cmd: Command): Promise<CommandAck> {
    if (!this.isConnected || !this.serialPort) {
      throw new Error('Serial port not connected');
    }

    const message = JSON.stringify(cmd) + '\n';
    this.serialPort.write(message);
    
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

  private handleData(data: Buffer): void {
    try {
      const message = data.toString().trim();
      const parsed = JSON.parse(message);
      
      if (parsed.type === 'command' && this.commandHandler) {
        this.commandHandler(parsed).then(ack => {
          // ACK 전송
          this.serialPort?.write(JSON.stringify({ type: 'ack', data: ack }) + '\n');
        });
      }
    } catch (error) {
      console.error('[Serial Adapter] Data parsing error:', error);
    }
  }

  async destroy?(): Promise<void> {
    if (this.serialPort) {
      this.serialPort.close();
      this.isConnected = false;
    }
  }
}
