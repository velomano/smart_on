/**
 * Universal Bridge v2.0 - Core Types
 * 
 * 프로토콜 독립적인 메시지 타입 정의
 */

// ==================== Device Message ====================

export type Protocol = 'mqtt' | 'http' | 'websocket' | 'serial' | 'ble';
export type MessageType = 'registry' | 'state' | 'telemetry' | 'command' | 'ack';

export interface DeviceMessage {
  deviceId: string;
  farmId: string;
  tenantId: string;
  messageType: MessageType;
  protocol: Protocol;
  payload: any;
  timestamp: string;
  schemaVersion?: string;
}

// ==================== Provisioning ====================

export interface SetupToken {
  token: string;
  tenantId: string;
  farmId?: string;
  expiresAt: Date;
  ipWhitelist?: string[];
  userAgent?: string;
}

export interface DeviceBinding {
  deviceId: string;
  deviceType: string;
  tenantId: string;
  farmId?: string;
  deviceKey: string;  // PSK
  capabilities: string[];
  publicKey?: string;  // X.509 옵션
}

export interface KeyRotation {
  deviceId: string;
  oldKey: string;
  newKey: string;
  gracePeriod: number;  // seconds
  expiresAt: Date;
}

// ==================== Telemetry ====================

export interface Reading {
  key: string;
  value: number;
  unit: string;
  ts: string;
  tier?: number;
  quality?: 'good' | 'fair' | 'poor';
}

export interface TelemetryPayload {
  deviceId: string;
  readings: Reading[];
  schemaVersion: string;
  timestamp: string;
  batchSeq?: number;
  windowMs?: number;
}

// ==================== Command ====================

export interface Command {
  id: string;
  msgId: string;  // Idempotency Key
  deviceId: string;
  tenantId: string;
  farmId?: string;
  type: string;
  payload?: Record<string, any>;
  status: 'pending' | 'sent' | 'acked' | 'failed' | 'timeout';
  issuedAt: Date;
  ackAt?: Date;
  retryCount: number;
  lastError?: string;
}

export interface CommandAck {
  commandId: string;
  msgId: string;
  status: 'success' | 'error';
  detail?: string;
  state?: any;
  timestamp: string;
}

// ==================== Device Info ====================

export interface Device {
  id: string;
  tenantId: string;
  farmId?: string;
  deviceId: string;
  deviceKeyHash: string;
  profileId?: string;
  fwVersion?: string;
  lastSeenAt?: Date;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
}

export interface DeviceHealth {
  deviceId: string;
  online: boolean;
  rssi?: number;
  battery?: number;
  fwVersion?: string;
  lastSeen: Date;
  errorLog: ErrorEntry[];
  retryRate: number;
  uptime: number;
}

export interface ErrorEntry {
  ts: string;
  type: string;
  detail: string;
}

// ==================== Config ====================

export interface BridgeConfig {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  security: {
    encryptionKey: string;
  };
  redis?: {
    url: string;
  };
  mqtt?: {
    brokerType: 'managed' | 'self-hosted';
    url: string;
    username?: string;
    password?: string;
  };
  http: {
    port: number;
  };
  websocket: {
    port: number;
  };
  observability?: {
    otelEnabled: boolean;
    otelEndpoint?: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

