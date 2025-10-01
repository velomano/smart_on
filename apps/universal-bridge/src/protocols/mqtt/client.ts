/**
 * MQTT Client
 * 
 * 기존 mqtt-bridge 로직 재사용
 * TODO: 기존 코드 포팅
 */

import mqtt from 'mqtt';

/**
 * MQTT 클라이언트 생성
 * 
 * TODO:
 * - [ ] 기존 mqtt-bridge/src/index.ts 로직 포팅
 * - [ ] 농장별 클라이언트 관리
 * - [ ] 자동 재연결
 */
export function createMqttClient(config: {
  broker_url: string;
  port: number;
  username?: string;
  password?: string;
  client_id_prefix: string;
}) {
  const client = mqtt.connect(config.broker_url, {
    port: config.port,
    username: config.username,
    password: config.password,
    clientId: `${config.client_id_prefix}-${Date.now()}`,
    keepalive: 60,
    reconnectPeriod: 5000,
    clean: false,
  });

  client.on('connect', () => {
    console.log('[MQTT] Connected to broker:', config.broker_url);
    
    // TODO: 토픽 구독
  });

  client.on('message', (topic, message) => {
    console.log('[MQTT] Message received:', topic);
    // TODO: 메시지 처리
  });

  client.on('error', (error) => {
    console.error('[MQTT] Error:', error);
  });

  return client;
}

