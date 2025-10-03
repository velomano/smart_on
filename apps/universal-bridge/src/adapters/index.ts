/**
 * Transport Adapters
 * 
 * Universal Bridge의 모든 통신 프로토콜을 통일된 인터페이스로 관리
 */

export type { BridgeAdapter, TransportType, Telemetry, Command, CommandAck } from '../types/core';

// Adapter 구현들 (현재 활성화된 것들만)
export type { HttpAdapter } from './http';
export type { MqttAdapter } from './mqtt';
export type { WebSocketAdapter } from './websocket';

// 비활성화된 어댑터들 (의존성 문제로 임시 비활성화)
// export type { SerialAdapter } from './serial';
// export type { BleAdapter } from './ble';
// export type { WebhookAdapter } from './webhook';
// export type { Rs485Adapter } from './rs485';

// Adapter 팩토리
export { createAdapter } from './factory';
