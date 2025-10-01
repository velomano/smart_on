/**
 * Universal Bridge Core Types & Schemas
 * 
 * Web Admin과 Universal Bridge가 공유하는 타입 정의
 */

// ==================== Transport Types ====================
export type Transport = 
  | 'mqtt' 
  | 'http' 
  | 'websocket' 
  | 'serial' 
  | 'ble' 
  | 'webhook' 
  | 'rs485' 
  | 'modbus-tcp';

// ==================== Core Schemas ====================
export interface Telemetry {
  device_id: string;
  ts: string;                    // ISO 8601 timestamp
  metrics: Record<string, number | string | boolean>;
  status?: 'ok' | 'warn' | 'err';
  battery?: number;              // 0-100%
  signal_strength?: number;      // RSSI, dBm 등
  version?: string;              // 펌웨어 버전
}

export interface Command {
  device_id: string;
  ts?: string;                  // ISO 8601 timestamp (생성 시 자동)
  type: string;                 // 'relay_control' | 'set_pwm' | 'set_servo' 등
  params: Record<string, any>;
  idempotency_key?: string;      // 중복 실행 방지
  timeout_ms?: number;           // 명령 타임아웃
  priority?: 'low' | 'normal' | 'high';
}

export interface CommandAck {
  device_id: string;
  command_id: string;
  ts: string;
  status: 'ack' | 'nack' | 'timeout';
  result?: any;
  error?: string;
}

// ==================== Device Management ====================
export interface Device {
  id: string;
  device_id: string;            // 사용자 지정 ID (esp32-001 등)
  tenant_id: string;
  farm_id?: string;
  device_type: string;          // 'arduino', 'esp32', 'raspberry_pi'
  transport: Transport;
  fw_version?: string;
  capabilities: string[];       // ["temperature", "humidity", "pump"]
  last_seen_at?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DeviceProvisioning {
  setup_token: string;
  expires_at: string;
  tenant_id: string;
  farm_id?: string;
  device_type?: string;
  transport?: Transport;
  profile_id?: string;
}

// ==================== Adapter Interface ====================
export interface BridgeAdapter {
  name: Transport;
  init(): Promise<void>;
  publishTelemetry(telemetry: Telemetry): Promise<void>;
  sendCommand(command: Command): Promise<CommandAck>;
  subscribeCommands?(onCommand: (command: Command) => Promise<CommandAck>): () => void;
  destroy?(): Promise<void>;
}

// ==================== Transport Configurations ====================
export interface TransportConfig {
  transport: Transport;
  config: Record<string, any>;
  is_active: boolean;
  tenant_id: string;
  farm_id?: string;
}

// MQTT Config
export interface MqttConfig {
  broker_url: string;
  port: number;
  username?: string;
  password?: string;
  client_id: string;
  qos?: 0 | 1 | 2;
  keepalive?: number;
  clean?: boolean;
}

// HTTP Config
export interface HttpConfig {
  base_url: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// WebSocket Config
export interface WebSocketConfig {
  ws_url: string;
  reconnect_interval?: number;
  ping_interval?: number;
}

// Serial Config
export interface SerialConfig {
  port: string;
  baud_rate: number;
  data_bits?: number;
  stop_bits?: number;
  parity?: 'none' | 'even' | 'odd';
}

// BLE Config
export interface BleConfig {
  service_uuid: string;
  characteristic_uuid: string;
  device_name?: string;
  scan_timeout?: number;
}

// Webhook Config
export interface WebhookConfig {
  webhook_url: string;
  secret?: string;
  timeout?: number;
  retries?: number;
}

// RS-485 Config
export interface Rs485Config {
  port: string;
  baud_rate: number;
  parity: 'none' | 'even' | 'odd';
  stop_bits: number;
  slave_id: number;
  timeout_ms: number;
  register_mappings?: Record<string, number>;
}

// Modbus TCP Config
export interface ModbusTcpConfig {
  host: string;
  port: number;
  unit_id: number;
  timeout_ms: number;
  register_mappings?: Record<string, number>;
}

// ==================== Utility Types ====================
export type Unsubscribe = () => void;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

// ==================== Error Types ====================
export interface BridgeError extends Error {
  code: string;
  status: number;
  details?: Record<string, any>;
}

export class BridgeError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BridgeError';
  }
}

// ==================== Constants ====================
export const TRANSPORT_LABELS: Record<Transport, string> = {
  'mqtt': 'MQTT',
  'http': 'HTTP',
  'websocket': 'WebSocket',
  'serial': 'Serial (USB)',
  'ble': 'Bluetooth LE',
  'webhook': 'Webhook',
  'rs485': 'RS-485 (Modbus RTU)',
  'modbus-tcp': 'Modbus TCP'
};

export const TRANSPORT_DESCRIPTIONS: Record<Transport, string> = {
  'mqtt': 'MQTT 브로커를 통한 Pub/Sub 통신',
  'http': 'REST API를 통한 HTTP 통신',
  'websocket': 'WebSocket을 통한 실시간 양방향 통신',
  'serial': 'USB Serial을 통한 직접 통신',
  'ble': 'Bluetooth Low Energy를 통한 무선 통신',
  'webhook': 'HTTP POST를 통한 이벤트 기반 통신',
  'rs485': 'RS-485를 통한 산업용 센서/제어기 통신',
  'modbus-tcp': 'Modbus TCP를 통한 산업용 네트워크 통신'
};

// ==================== Validation Schemas ====================
export const TELEMETRY_SCHEMA = {
  device_id: { type: 'string', required: true },
  ts: { type: 'string', required: true },
  metrics: { type: 'object', required: true },
  status: { type: 'string', enum: ['ok', 'warn', 'err'] },
  battery: { type: 'number', min: 0, max: 100 },
  signal_strength: { type: 'number' },
  version: { type: 'string' }
};

export const COMMAND_SCHEMA = {
  device_id: { type: 'string', required: true },
  ts: { type: 'string' },
  type: { type: 'string', required: true },
  params: { type: 'object', required: true },
  idempotency_key: { type: 'string' },
  timeout_ms: { type: 'number', min: 1000, max: 300000 },
  priority: { type: 'string', enum: ['low', 'normal', 'high'] }
};
