/**
 * Universal Bridge Core Schema
 * 
 * 모든 Transport Adapter가 사용하는 단일 스키마
 */

// 공통 텔레메트리 스키마
export interface Telemetry {
  device_id: string;
  ts: string;                    // ISO 8601 timestamp
  metrics: Record<string, number | string | boolean>;
  status?: 'ok' | 'warn' | 'err';
  battery?: number;              // 0-100%
  signal_strength?: number;      // RSSI, dBm 등
  version?: string;              // 펌웨어 버전
}

// 공통 커맨드 스키마
export interface Command {
  device_id: string;
  command_id?: string;           // 명령 고유 ID
  id?: string;                   // 명령 ID (command_id의 별칭)
  ts: string;                    // ISO 8601 timestamp
  type: string;                  // 'relay_control' | 'set_pwm' | 'set_servo' 등
  params: Record<string, any>;
  idempotency_key?: string;      // 중복 실행 방지
  timeout_ms?: number;           // 명령 타임아웃
  priority?: 'low' | 'normal' | 'high';
}

// 명령 응답 스키마
export interface CommandAck {
  device_id: string;
  command_id: string;
  ts: string;
  status: 'ack' | 'nack' | 'timeout';
  result?: any;
  error?: string;
}

// Transport Adapter 인터페이스
export interface BridgeAdapter {
  name: TransportType;
  init(): Promise<void>;
  publishTelemetry(payload: Telemetry): Promise<void>;
  sendCommand(cmd: Command): Promise<CommandAck>;
  subscribeCommands?(onCmd: (cmd: Command) => Promise<CommandAck>): Unsubscribe;
  destroy?(): Promise<void>;
}

// 지원하는 Transport 타입들
export type TransportType = 
  | 'mqtt' 
  | 'http' 
  | 'websocket' 
  | 'serial' 
  | 'ble' 
  | 'webhook' 
  | 'rs485';

// Unsubscribe 함수 타입
export type Unsubscribe = () => void;

// 디바이스 상태
export interface DeviceStatus {
  device_id: string;
  last_seen: string;
  status: 'online' | 'offline' | 'error';
  transport: TransportType;
  metrics_count: number;
  commands_pending: number;
}

// 농장별 설정
export interface FarmConfig {
  farm_id: string;
  tenant_id: string;
  transport_configs: {
    [K in TransportType]?: any;
  };
  devices: DeviceStatus[];
}
