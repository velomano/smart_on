/**
 * HTTP Transport Adapter
 * 
 * REST API를 통한 텔레메트리 전송 및 명령 수신
 */

import { BridgeAdapter, Telemetry, Command, CommandAck, TransportType } from '../types/core';

export interface HttpAdapterConfig {
  baseUrl: string;
  tenantId: string;
  farmId?: string;
  deviceId?: string;
  deviceKey?: string;
  timeout?: number;
  retries?: number;
}

export class HttpAdapter implements BridgeAdapter {
  name: TransportType = 'http';
  private config: HttpAdapterConfig;
  private commandPollingInterval?: NodeJS.Timeout;

  constructor(config: HttpAdapterConfig) {
    this.config = {
      timeout: 5000,
      retries: 3,
      ...config
    };
  }

  async init(): Promise<void> {
    console.log(`[HTTP Adapter] Initialized for ${this.config.baseUrl}`);
    
    // 명령 폴링 시작 (디바이스 모드일 때)
    if (this.config.deviceId) {
      this.startCommandPolling();
    }
  }

  async publishTelemetry(payload: Telemetry): Promise<void> {
    const url = `${this.config.baseUrl}/api/bridge/telemetry`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-id': this.config.tenantId,
      'x-device-id': payload.device_id,
      'x-ts': payload.ts,
    };

    // HMAC 서명 추가 (디바이스 키가 있는 경우)
    if (this.config.deviceKey) {
      const signature = await this.generateHmacSignature(payload, this.config.deviceKey);
      headers['x-sig'] = signature;
    }

    const response = await this.makeRequest(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  }

  async sendCommand(cmd: Command): Promise<CommandAck> {
    const url = `${this.config.baseUrl}/api/bridge/commands/${cmd.device_id}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-id': this.config.tenantId,
    };

    const response = await this.makeRequest(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(cmd)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return await response.json() as CommandAck;
  }

  subscribeCommands?(onCmd: (cmd: Command) => Promise<CommandAck>): () => void {
    if (!this.config.deviceId) {
      throw new Error('Device ID required for command subscription');
    }

    this.startCommandPolling(onCmd);
    
    return () => {
      if (this.commandPollingInterval) {
        clearInterval(this.commandPollingInterval);
        this.commandPollingInterval = undefined;
      }
    };
  }

  private startCommandPolling(onCmd?: (cmd: Command) => Promise<CommandAck>): void {
    if (!this.config.deviceId) return;

    this.commandPollingInterval = setInterval(async () => {
      try {
        const url = `${this.config.baseUrl}/api/bridge/commands/${this.config.deviceId}`;
        
        const headers: Record<string, string> = {
          'x-tenant-id': this.config.tenantId,
        };

        const response = await this.makeRequest(url, {
          method: 'GET',
          headers
        });

        if (response.ok) {
          const command = await response.json() as Command;
          if (command && onCmd) {
            const ack = await onCmd(command);
            // ACK 전송
            await this.sendAck(command.command_id || command.id || '', ack);
          }
        }
      } catch (error) {
        console.error('[HTTP Adapter] Command polling error:', error);
      }
    }, 2000); // 2초마다 폴링
  }

  private async sendAck(commandId: string, ack: CommandAck): Promise<void> {
    const url = `${this.config.baseUrl}/api/bridge/commands/${commandId}/ack`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-id': this.config.tenantId,
      'x-device-id': this.config.deviceId!,
    };

    await this.makeRequest(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(ack)
    });
  }

  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async generateHmacSignature(payload: Telemetry, key: string): Promise<string> {
    // HMAC-SHA256 서명 생성
    const message = `${payload.device_id}:${payload.ts}:${JSON.stringify(payload.metrics)}`;
    
    // 브라우저 환경에서는 Web Crypto API 사용 (현재 비활성화)
    // if (typeof window !== 'undefined' && window.crypto) {
    //   const encoder = new TextEncoder();
    //   const keyData = encoder.encode(key);
    //   const messageData = encoder.encode(message);
    //   
    //   const cryptoKey = await window.crypto.subtle.importKey(
    //     'raw',
    //     keyData,
    //     { name: 'HMAC', hash: 'SHA-256' },
    //     false,
    //     ['sign']
    //   );
    //   
    //   const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
    //   const hashArray = Array.from(new Uint8Array(signature));
    //   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    // }
    
    // Node.js 환경에서는 crypto 모듈 사용
    const crypto = require('crypto');
    return crypto.createHmac('sha256', key).update(message).digest('hex');
  }

  async destroy?(): Promise<void> {
    if (this.commandPollingInterval) {
      clearInterval(this.commandPollingInterval);
      this.commandPollingInterval = undefined;
    }
  }
}
