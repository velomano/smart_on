/**
 * MQTT Handler
 * 
 * MQTT 메시지 처리
 * TODO: 기존 핸들러 포팅
 */

/**
 * MQTT 메시지 핸들러
 * 
 * TODO:
 * - [ ] 기존 handlers/* 로직 포팅
 * - [ ] MessageBus 통합
 */
export function handleMqttMessage(topic: string, message: Buffer) {
  try {
    const payload = JSON.parse(message.toString());
    
    // 토픽에서 메시지 타입 추출
    const parts = topic.split('/');
    const messageType = parts[parts.length - 1];
    
    console.log('[MQTT Handler] Processing:', { topic, messageType });
    
    // TODO: MessageBus로 전달
    
  } catch (error) {
    console.error('[MQTT Handler] Error:', error);
  }
}

