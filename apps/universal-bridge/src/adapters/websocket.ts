/**
 * WebSocket Transport Adapter
 * 
 * WebSocket을 통한 실시간 양방향 통신
 */

import { BridgeAdapter, Telemetry, Command, CommandAck, TransportType } from '../types/core';

export interface WebSocketAdapterConfig {
  wsUrl: string;
  tenantId: string;
  farmId?: string;
  deviceId?: string;
  reconnectInterval?: number;
  pingInterval?: number;
}

export class WebSocketAdapter implements BridgeAdapter {
  name: TransportType = 'websocket';
  private config: WebSocketAdapterConfig;
  private ws?: WebSocket;
  private isConnected = false;
  private commandHandler?: (cmd: Command) => Promise<CommandAck>;
  private reconnectTimer?: NodeJS.Timeout;
  private pingTimer?: NodeJS.Timeout;

  constructor(config: WebSocketAdapterConfig) {
    this.config = {
      reconnectInterval: 5000,
      pingInterval: 30000,
      ...config
    };
  }

  async init(): Promise<void> {
    await this.connect();
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.wsUrl);

        this.ws.onopen = () => {
          console.log(`[WebSocket Adapter] Connected to ${this.config.wsUrl}`);
          this.isConnected = true;
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket Adapter] Connection closed');
          this.isConnected = false;
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket Adapter] Connection error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  async publishTelemetry(payload: Telemetry): Promise<void> {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    const message = {
      type: 'telemetry',
      data: payload
    };

    this.ws.send(JSON.stringify(message));
    console.log('[WebSocket Adapter] Telemetry sent');
  }

  async sendCommand(cmd: Command): Promise<CommandAck> {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    const message = {
      type: 'command',
      data: cmd
    };

    this.ws.send(JSON.stringify(message));
    
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

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'command' && this.commandHandler) {
        this.commandHandler(message.data).then(ack => {
          // ACK 전송
          const ackMessage = {
            type: 'ack',
            data: ack
          };
          this.ws?.send(JSON.stringify(ackMessage));
        });
      } else if (message.type === 'ping') {
        // Pong 응답
        this.ws?.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      console.error('[WebSocket Adapter] Message parsing error:', error);
    }
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.pingInterval);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined;
      try {
        await this.connect();
      } catch (error) {
        console.error('[WebSocket Adapter] Reconnect failed:', error);
        this.scheduleReconnect();
      }
    }, this.config.reconnectInterval);
  }

  async destroy?(): Promise<void> {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}
