/**
 * Transport Adapters
 * 
 * Universal Bridge의 모든 통신 프로토콜을 통일된 인터페이스로 관리
 */

export { BridgeAdapter, TransportType, Telemetry, Command, CommandAck } from '../types/core';

// Adapter 구현들
export { HttpAdapter } from './http';
export { MqttAdapter } from './mqtt';
export { WebSocketAdapter } from './websocket';
export { SerialAdapter } from './serial';
export { BleAdapter } from './ble';
export { WebhookAdapter } from './webhook';
export { Rs485Adapter } from './rs485';

// Adapter 팩토리
export { createAdapter } from './factory';
