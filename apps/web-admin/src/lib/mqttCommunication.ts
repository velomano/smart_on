/**
 * MQTT 통신 관리 시스템
 */

import { 
  SensorDataMessage, 
  ControlCommandMessage, 
  SwitchStatusMessage,
  createSensorTopic,
  createControlTopic,
  createStatusTopic
} from './bedSystemArchitecture';

// MQTT 클라이언트 타입 (실제 구현에서는 mqtt.js 또는 다른 라이브러리 사용)
export interface MqttClient {
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (topic: string, callback: (message: any) => void) => void;
  unsubscribe: (topic: string) => void;
  publish: (topic: string, message: string) => void;
  isConnected: boolean;
}

// MQTT 연결 상태
export interface MqttConnectionStatus {
  isConnected: boolean;
  serverUrl: string;
  farmId: string;
  lastConnected?: Date;
  error?: string;
}

// 센서 데이터 구독 관리
export interface SensorSubscription {
  topic: string;
  farmId: string;
  bedId: string;
  tierNumber: number;
  sensorType: string;
  callback: (data: SensorDataMessage) => void;
}

// 스위치 상태 구독 관리
export interface SwitchSubscription {
  topic: string;
  farmId: string;
  bedId: string;
  switchId: string;
  callback: (status: SwitchStatusMessage) => void;
}

export class MqttManager {
  private client: MqttClient | null = null;
  private connectionStatus: MqttConnectionStatus;
  private sensorSubscriptions: Map<string, SensorSubscription> = new Map();
  private switchSubscriptions: Map<string, SwitchSubscription> = new Map();

  constructor(farmId: string, serverUrl: string) {
    this.connectionStatus = {
      isConnected: false,
      serverUrl,
      farmId
    };
  }

  // MQTT 클라이언트 초기화 및 연결
  async initialize(client: MqttClient): Promise<void> {
    try {
      this.client = client;
      await client.connect();
      
      this.connectionStatus = {
        isConnected: true,
        serverUrl: this.connectionStatus.serverUrl,
        farmId: this.connectionStatus.farmId,
        lastConnected: new Date()
      };

      console.log('✅ MQTT 연결 성공:', this.connectionStatus);
    } catch (error) {
      this.connectionStatus.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ MQTT 연결 실패:', error);
      throw error;
    }
  }

  // 연결 해제
  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.connectionStatus.isConnected = false;
      console.log('🔌 MQTT 연결 해제');
    }
  }

  // 센서 데이터 구독
  subscribeToSensor(
    farmId: string,
    bedId: string,
    tierNumber: number,
    sensorType: string,
    callback: (data: SensorDataMessage) => void
  ): string {
    const topic = createSensorTopic(farmId, bedId, tierNumber, sensorType);
    const subscriptionKey = `${farmId}/${bedId}/tier_${tierNumber}/${sensorType}`;

    if (!this.client || !this.client.isConnected) {
      throw new Error('MQTT 클라이언트가 연결되지 않았습니다.');
    }

    // 기존 구독이 있다면 해제
    if (this.sensorSubscriptions.has(subscriptionKey)) {
      this.unsubscribeFromSensor(subscriptionKey);
    }

    // 새 구독 등록
    const subscription: SensorSubscription = {
      topic,
      farmId,
      bedId,
      tierNumber,
      sensorType,
      callback
    };

    this.sensorSubscriptions.set(subscriptionKey, subscription);

    // MQTT 구독
    this.client.subscribe(topic, (message) => {
      try {
        const data: SensorDataMessage = JSON.parse(message.toString());
        callback(data);
      } catch (error) {
        console.error('❌ 센서 데이터 파싱 오류:', error);
      }
    });

    console.log('📡 센서 데이터 구독:', topic);
    return subscriptionKey;
  }

  // 센서 데이터 구독 해제
  unsubscribeFromSensor(subscriptionKey: string): void {
    const subscription = this.sensorSubscriptions.get(subscriptionKey);
    if (subscription && this.client) {
      this.client.unsubscribe(subscription.topic);
      this.sensorSubscriptions.delete(subscriptionKey);
      console.log('📡 센서 데이터 구독 해제:', subscription.topic);
    }
  }

  // 스위치 상태 구독
  subscribeToSwitch(
    farmId: string,
    bedId: string,
    switchId: string,
    callback: (status: SwitchStatusMessage) => void
  ): string {
    const topic = createStatusTopic(farmId, bedId, switchId);
    const subscriptionKey = `${farmId}/${bedId}/switch_${switchId}`;

    if (!this.client || !this.client.isConnected) {
      throw new Error('MQTT 클라이언트가 연결되지 않았습니다.');
    }

    // 기존 구독이 있다면 해제
    if (this.switchSubscriptions.has(subscriptionKey)) {
      this.unsubscribeFromSwitch(subscriptionKey);
    }

    // 새 구독 등록
    const subscription: SwitchSubscription = {
      topic,
      farmId,
      bedId,
      switchId,
      callback
    };

    this.switchSubscriptions.set(subscriptionKey, subscription);

    // MQTT 구독
    this.client.subscribe(topic, (message) => {
      try {
        const status: SwitchStatusMessage = JSON.parse(message.toString());
        callback(status);
      } catch (error) {
        console.error('❌ 스위치 상태 파싱 오류:', error);
      }
    });

    console.log('📡 스위치 상태 구독:', topic);
    return subscriptionKey;
  }

  // 스위치 상태 구독 해제
  unsubscribeFromSwitch(subscriptionKey: string): void {
    const subscription = this.switchSubscriptions.get(subscriptionKey);
    if (subscription && this.client) {
      this.client.unsubscribe(subscription.topic);
      this.switchSubscriptions.delete(subscriptionKey);
      console.log('📡 스위치 상태 구독 해제:', subscription.topic);
    }
  }

  // 제어 명령 발송
  async sendControlCommand(
    farmId: string,
    bedId: string,
    switchId: string,
    command: 'on' | 'off' | 'toggle',
    userId?: string
  ): Promise<void> {
    const topic = createControlTopic(farmId, bedId, switchId);
    
    if (!this.client || !this.client.isConnected) {
      throw new Error('MQTT 클라이언트가 연결되지 않았습니다.');
    }

    const message: ControlCommandMessage = {
      topic,
      payload: {
        farm_id: farmId,
        bed_id: bedId,
        switch_id: switchId,
        command,
        timestamp: new Date().toISOString(),
        user_id: userId
      }
    };

    this.client.publish(topic, JSON.stringify(message.payload));
    console.log('📤 제어 명령 발송:', message);
  }

  // 연결 상태 조회
  getConnectionStatus(): MqttConnectionStatus {
    return { ...this.connectionStatus };
  }

  // 활성 구독 목록 조회
  getActiveSubscriptions(): {
    sensors: string[];
    switches: string[];
  } {
    return {
      sensors: Array.from(this.sensorSubscriptions.keys()),
      switches: Array.from(this.switchSubscriptions.keys())
    };
  }

  // 모든 구독 해제
  unsubscribeAll(): void {
    this.sensorSubscriptions.forEach((_, key) => {
      this.unsubscribeFromSensor(key);
    });
    
    this.switchSubscriptions.forEach((_, key) => {
      this.unsubscribeFromSwitch(key);
    });

    console.log('📡 모든 MQTT 구독 해제 완료');
  }
}

// 전역 MQTT 매니저 인스턴스
let globalMqttManager: MqttManager | null = null;

export function getMqttManager(farmId?: string, serverUrl?: string): MqttManager {
  if (!globalMqttManager) {
    if (!farmId || !serverUrl) {
      throw new Error('MQTT 매니저를 초기화하려면 farmId와 serverUrl이 필요합니다.');
    }
    globalMqttManager = new MqttManager(farmId, serverUrl);
  }
  return globalMqttManager;
}

export function destroyMqttManager(): void {
  if (globalMqttManager) {
    globalMqttManager.disconnect();
    globalMqttManager = null;
  }
}
