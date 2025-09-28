/**
 * 베드 단별 센서 & 제어 시스템 아키텍처
 */

// ===== 데이터 구조 정의 =====

export interface TierSensor {
  tierNumber: number;
  sensorId: string;
  sensorType: 'temperature' | 'humidity' | 'ec' | 'ph' | 'lux' | 'water_temp';
  mqttTopic: string;
  isActive: boolean;
  lastReading?: {
    value: number;
    unit: string;
    timestamp: Date;
  };
}

export interface ControlSwitch {
  switchId: string;
  switchName: string;
  switchType: 'pump' | 'led' | 'fan' | 'heater' | 'nutrient' | 'custom';
  mqttTopic: string;
  isActive: boolean;
  currentState: 'on' | 'off';
  lastCommand?: {
    state: 'on' | 'off';
    timestamp: Date;
  };
}

export interface BedTierSystem {
  bedId: string;
  bedName: string;
  totalTiers: number;
  activeTiers: number;
  tiers: {
    [tierNumber: number]: {
      tierNumber: number;
      isActive: boolean;
      sensors: TierSensor[];
      hasSensors: boolean;
    };
  };
  controlSwitches: ControlSwitch[];
  mqttConfig: {
    baseTopic: string; // farm_a/bed_1
    sensorTopic: string; // farm_a/bed_1/sensors
    controlTopic: string; // farm_a/bed_1/control
  };
}

// ===== MQTT 토픽 구조 설계 =====

export interface MqttTopicStructure {
  // 센서 데이터 토픽
  sensorTopics: {
    farm: string; // farm_a
    bed: string;  // bed_1
    tier: string; // tier_1 (선택적)
    sensor: string; // temperature, humidity, etc.
    fullTopic: string; // farm_a/bed_1/tier_1/temperature
  };
  
  // 제어 명령 토픽
  controlTopics: {
    farm: string; // farm_a
    bed: string;  // bed_1
    switch: string; // pump_1, led_1, etc.
    fullTopic: string; // farm_a/bed_1/control/pump_1
  };
  
  // 상태 응답 토픽
  statusTopics: {
    farm: string; // farm_a
    bed: string;  // bed_1
    switch: string; // pump_1, led_1, etc.
    fullTopic: string; // farm_a/bed_1/status/pump_1
  };
}

// ===== JSON 통신 프로토콜 =====

export interface SensorDataMessage {
  topic: string;
  payload: {
    farm_id: string;
    bed_id: string;
    tier_number?: number;
    sensor_type: string;
    sensor_id: string;
    value: number;
    unit: string;
    timestamp: string;
    quality: 'good' | 'warning' | 'error';
  };
}

export interface ControlCommandMessage {
  topic: string;
  payload: {
    farm_id: string;
    bed_id: string;
    switch_id: string;
    command: 'on' | 'off' | 'toggle';
    timestamp: string;
    user_id?: string;
  };
}

export interface SwitchStatusMessage {
  topic: string;
  payload: {
    farm_id: string;
    bed_id: string;
    switch_id: string;
    current_state: 'on' | 'off';
    last_command: 'on' | 'off';
    timestamp: string;
    error?: string;
  };
}

// ===== 유틸리티 함수들 =====

/**
 * MQTT 토픽 생성
 */
export function generateMqttTopics(farmId: string, bedId: string): MqttTopicStructure {
  const farm = `farm_${farmId}`;
  const bed = `bed_${bedId}`;
  
  return {
    sensorTopics: {
      farm,
      bed,
      tier: `${bed}/tier_`,
      sensor: '',
      fullTopic: `${farm}/${bed}/tier_`
    },
    controlTopics: {
      farm,
      bed,
      switch: `${farm}/${bed}/control/`,
      fullTopic: `${farm}/${bed}/control/`
    },
    statusTopics: {
      farm,
      bed,
      switch: `${farm}/${bed}/status/`,
      fullTopic: `${farm}/${bed}/status/`
    }
  };
}

/**
 * 센서 데이터 토픽 생성
 */
export function createSensorTopic(
  farmId: string, 
  bedId: string, 
  tierNumber: number, 
  sensorType: string
): string {
  return `farm_${farmId}/bed_${bedId}/tier_${tierNumber}/${sensorType}`;
}

/**
 * 제어 명령 토픽 생성
 */
export function createControlTopic(
  farmId: string, 
  bedId: string, 
  switchId: string
): string {
  return `farm_${farmId}/bed_${bedId}/control/${switchId}`;
}

/**
 * 상태 응답 토픽 생성
 */
export function createStatusTopic(
  farmId: string, 
  bedId: string, 
  switchId: string
): string {
  return `farm_${farmId}/bed_${bedId}/status/${switchId}`;
}

/**
 * 베드 시스템 초기화
 */
export function initializeBedSystem(
  bedId: string, 
  bedName: string, 
  totalTiers: number,
  farmId: string
): BedTierSystem {
  const mqttConfig = generateMqttTopics(farmId, bedId);
  
  const tiers: { [tierNumber: number]: any } = {};
  for (let i = 1; i <= 5; i++) {
    tiers[i] = {
      tierNumber: i,
      isActive: i <= totalTiers,
      sensors: [],
      hasSensors: false
    };
  }

  return {
    bedId,
    bedName,
    totalTiers,
    activeTiers: totalTiers,
    tiers,
    controlSwitches: [],
    mqttConfig: {
      baseTopic: `${mqttConfig.sensorTopics.farm}/${mqttConfig.sensorTopics.bed}`,
      sensorTopic: `${mqttConfig.sensorTopics.farm}/${mqttConfig.sensorTopics.bed}/sensors`,
      controlTopic: `${mqttConfig.sensorTopics.farm}/${mqttConfig.sensorTopics.bed}/control`
    }
  };
}

/**
 * 센서 추가
 */
export function addSensorToTier(
  bedSystem: BedTierSystem,
  tierNumber: number,
  sensorType: TierSensor['sensorType'],
  sensorId: string
): BedTierSystem {
  if (tierNumber < 1 || tierNumber > 5) {
    throw new Error('단 번호는 1-5 사이여야 합니다.');
  }

  const sensorTopic = createSensorTopic(
    bedSystem.mqttConfig.baseTopic.split('/')[0].replace('farm_', ''),
    bedSystem.mqttConfig.baseTopic.split('/')[1].replace('bed_', ''),
    tierNumber,
    sensorType
  );

  const newSensor: TierSensor = {
    tierNumber,
    sensorId,
    sensorType,
    mqttTopic: sensorTopic,
    isActive: true
  };

  const updatedTiers = { ...bedSystem.tiers };
  updatedTiers[tierNumber] = {
    ...updatedTiers[tierNumber],
    sensors: [...updatedTiers[tierNumber].sensors, newSensor],
    hasSensors: true
  };

  return {
    ...bedSystem,
    tiers: updatedTiers
  };
}

/**
 * 제어 스위치 추가
 */
export function addControlSwitch(
  bedSystem: BedTierSystem,
  switchId: string,
  switchName: string,
  switchType: ControlSwitch['switchType']
): BedTierSystem {
  const controlTopic = createControlTopic(
    bedSystem.mqttConfig.baseTopic.split('/')[0].replace('farm_', ''),
    bedSystem.mqttConfig.baseTopic.split('/')[1].replace('bed_', ''),
    switchId
  );

  const newSwitch: ControlSwitch = {
    switchId,
    switchName,
    switchType,
    mqttTopic: controlTopic,
    isActive: true,
    currentState: 'off'
  };

  return {
    ...bedSystem,
    controlSwitches: [...bedSystem.controlSwitches, newSwitch]
  };
}
