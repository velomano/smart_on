/**
 * Transport Adapters
 * 
 * Universal Bridge의 모든 통신 프로토콜을 통일된 인터페이스로 관리
 */

export type { BridgeAdapter, TransportType, Telemetry, Command, CommandAck } from '../types/core';

// Adapter 구현들
export type { HttpAdapter } from './http';
export type { MqttAdapter } from './mqtt';
export type { WebSocketAdapter } from './websocket';
export type { SerialAdapter } from './serial';
export type { BleAdapter } from './ble';
export type { WebhookAdapter } from './webhook';
export type { Rs485Adapter } from './rs485';

// Adapter 팩토리
export { createAdapter } from './factory';
