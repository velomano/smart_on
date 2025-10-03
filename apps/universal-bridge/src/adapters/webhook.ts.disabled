/**
 * Webhook Transport Adapter
 * 
 * HTTP POST를 통한 이벤트 기반 통신
 */

import { BridgeAdapter, Telemetry, Command, CommandAck, TransportType } from '../types/core';

export interface WebhookAdapterConfig {
  webhookUrl: string;
  secret?: string;
  tenantId: string;
  farmId?: string;
  deviceId?: string;
  timeout?: number;
  retries?: number;
}

export class WebhookAdapter implements BridgeAdapter {
  name: TransportType = 'webhook';
  private config: WebhookAdapterConfig;
  private commandHandler?: (cmd: Command) => Promise<CommandAck>;

  constructor(config: WebhookAdapterConfig) {
    this.config = {
      timeout: 5000,
      retries: 3,
      ...config
    };
  }

  async init(): Promise<void> {
    console.log(`[Webhook Adapter] Initialized for ${this.config.webhookUrl}`);
  }

  async publishTelemetry(payload: Telemetry): Promise<void> {
    const webhookPayload = {
      type: 'telemetry',
      device_id: payload.device_id,
      tenant_id: this.config.tenantId,
      farm_id: this.config.farmId,
      timestamp: payload.ts,
      data: payload.metrics,
      status: payload.status,
      battery: payload.battery,
      signal_strength: payload.signal_strength
    };

    await this.sendWebhook(webhookPayload);
    console.log('[Webhook Adapter] Telemetry sent');
  }

  async sendCommand(cmd: Command): Promise<CommandAck> {
    const webhookPayload = {
      type: 'command',
      device_id: cmd.device_id,
      tenant_id: this.config.tenantId,
      farm_id: this.config.farmId,
      timestamp: cmd.ts,
      command_type: cmd.type,
      params: cmd.params,
      idempotency_key: cmd.idempotency_key,
      timeout_ms: cmd.timeout_ms,
      priority: cmd.priority
    };

    await this.sendWebhook(webhookPayload);
    
    return {
      device_id: cmd.device_id,
      command_id: cmd.ts,
      ts: new Date().toISOString(),
      status: 'ack'
    };
  }

  subscribeCommands?(onCmd: (cmd: Command) => Promise<CommandAck>): () => void {
    // Webhook은 수신형이므로 구독은 서버에서 처리
    this.commandHandler = onCmd;
    console.log('[Webhook Adapter] Command subscription enabled (server-side)');
    
    return () => {
      this.commandHandler = undefined;
    };
  }

  /**
   * 서버에서 수신한 명령 처리 (Express/Next.js 라우트에서 호출)
   */
  async handleIncomingCommand(commandData: any): Promise<void> {
    if (this.commandHandler) {
      try {
        const ack = await this.commandHandler(commandData);
        console.log('[Webhook Adapter] Command processed:', ack);
      } catch (error) {
        console.error('[Webhook Adapter] Command processing error:', error);
      }
    }
  }

  private async sendWebhook(payload: any): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Universal-Bridge-Webhook/1.0'
    };

    // HMAC 서명 추가 (secret이 있는 경우)
    if (this.config.secret) {
      const signature = await this.generateHmacSignature(payload, this.config.secret);
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retries!; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        console.log(`[Webhook Adapter] Webhook sent successfully (attempt ${attempt})`);
        return;

      } catch (error) {
        lastError = error as Error;
        console.warn(`[Webhook Adapter] Attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.retries!) {
          // 지수 백오프
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Webhook failed after ${this.config.retries} attempts: ${lastError?.message}`);
  }

  private async generateHmacSignature(payload: any, secret: string): Promise<string> {
    const message = JSON.stringify(payload);
    
    // 브라우저 환경에서는 Web Crypto API 사용
    if (typeof window !== 'undefined' && window.crypto) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(message);
      
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const hashArray = Array.from(new Uint8Array(signature));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Node.js 환경에서는 crypto 모듈 사용
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  async destroy?(): Promise<void> {
    console.log('[Webhook Adapter] Destroyed');
  }
}
