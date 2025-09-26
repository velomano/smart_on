// Mock MQTT 클라이언트 시뮬레이션
export class MockMqttClient {
  constructor() {
    this.isConnected = false
    this.subscriptions = new Map()
    this.messageHandlers = new Map()
    this.sensorCollector = null
    this.actuatorManager = null
    this.messageQueue = []
  }

  // 센서 수집기와 액추에이터 관리자 연결
  connect(sensorCollector, actuatorManager) {
    this.sensorCollector = sensorCollector
    this.actuatorManager = actuatorManager
    this.isConnected = true
    console.log('🔌 Mock MQTT 클라이언트 연결됨')
  }

  disconnect() {
    this.isConnected = false
    this.subscriptions.clear()
    this.messageHandlers.clear()
    console.log('🔌 Mock MQTT 클라이언트 연결 해제됨')
  }

  // 토픽 구독
  subscribe(topic, callback) {
    this.subscriptions.set(topic, callback)
    console.log(`📡 Mock MQTT 구독: ${topic}`)
  }

  // 토픽 구독 해제
  unsubscribe(topic) {
    this.subscriptions.delete(topic)
    console.log(`📡 Mock MQTT 구독 해제: ${topic}`)
  }

  // 메시지 발행
  publish(topic, message) {
    const messageData = {
      topic,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      timestamp: new Date().toISOString()
    }

    this.messageQueue.push(messageData)
    console.log(`📤 Mock MQTT 발행: ${topic}`, messageData.message)

    // 구독된 핸들러 실행
    this.executeSubscribers(topic, messageData)
  }

  // 구독자 실행
  executeSubscribers(topic, messageData) {
    for (const [subscribedTopic, callback] of this.subscriptions) {
      if (this.topicMatches(topic, subscribedTopic)) {
        try {
          callback(topic, messageData.message)
        } catch (error) {
          console.error(`❌ MQTT 구독자 실행 오류 (${subscribedTopic}):`, error)
        }
      }
    }
  }

  // 토픽 매칭 (와일드카드 지원)
  topicMatches(topic, pattern) {
    if (pattern === topic) return true
    if (pattern.includes('+')) {
      const patternParts = pattern.split('/')
      const topicParts = topic.split('/')
      
      if (patternParts.length !== topicParts.length) return false
      
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i] !== '+' && patternParts[i] !== topicParts[i]) {
          return false
        }
      }
      return true
    }
    if (pattern.includes('#')) {
      const patternPrefix = pattern.replace('#', '')
      return topic.startsWith(patternPrefix)
    }
    return false
  }

  // 센서 데이터 수집 시작
  startSensorDataCollection(intervalMs = 5000) {
    console.log('⏸️ MQTT 센서 데이터 발행이 비활성화됨 (연동 대기)');
    return; // MQTT 연동 전까지 임시 비활성화
    
    if (!this.sensorCollector) {
      throw new Error('센서 수집기가 연결되지 않았습니다.')
    }

    this.sensorCollector.startCollection(intervalMs)
    
    // 센서 데이터를 MQTT로 발행
    setInterval(() => {
      if (this.isConnected && this.sensorCollector) {
        const readings = this.sensorCollector.collectAllSensors()
        
        for (const reading of readings) {
          const topic = `sensors/${reading.farmId}/${reading.bedId}/${reading.type}`
          this.publish(topic, reading)
        }
      }
    }, intervalMs)
  }

  // 센서 데이터 수집 중지
  stopSensorDataCollection() {
    if (this.sensorCollector) {
      this.sensorCollector.stopCollection()
    }
  }

  // 제어 명령 처리
  handleControlCommand(topic, message) {
    try {
      const command = typeof message === 'string' ? JSON.parse(message) : message
      
      if (this.actuatorManager) {
        const result = this.actuatorManager.handleCommand(command.deviceId, command)
        
        // 제어 결과를 MQTT로 발행
        const resultTopic = `control/${command.farmId}/${command.bedId}/${command.deviceId}/result`
        this.publish(resultTopic, {
          ...result,
          commandId: command.commandId || Date.now().toString()
        })
      }
    } catch (error) {
      console.error('❌ Mock MQTT 제어 명령 처리 오류:', error)
      
      // 오류 결과를 MQTT로 발행
      const errorTopic = `control/error`
      this.publish(errorTopic, {
        error: error.message,
        topic,
        message,
        timestamp: new Date().toISOString()
      })
    }
  }

  // 메시지 큐 조회
  getMessageQueue(limit = 100) {
    return this.messageQueue.slice(-limit)
  }

  // 연결 상태 조회
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      subscriptions: Array.from(this.subscriptions.keys()),
      messageCount: this.messageQueue.length
    }
  }
}

// 전역 Mock MQTT 클라이언트 인스턴스
export const mockMqttClient = new MockMqttClient()
