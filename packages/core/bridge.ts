export type Transport =
  | 'mqtt'|'http'|'ws'|'serial'|'ble'|'webhook'
  | 'rs485'|'modbus-tcp'|'lorawan';

export type Telemetry = {
  device_id: string;
  ts: string; // ISO
  metrics: Record<string, number|string|boolean>;
  status?: 'ok'|'warn'|'err';
};

export type Command = {
  device_id: string;
  type: string;
  params: Record<string, any>;
  idempotency_key?: string;
  timeout_ms?: number;
};

export type Ack = { ok: boolean; message?: string; code?: string };

export interface BridgeAdapter {
  name: Transport;
  init(): Promise<void>;
  publishTelemetry(t: Telemetry): Promise<void>;
  sendCommand(c: Command): Promise<Ack>;
}
