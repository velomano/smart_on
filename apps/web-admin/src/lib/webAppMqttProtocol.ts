/**
 * 웹앱 ↔ 농장 MQTT 서버 통신 프로토콜
 * 
 * 원칙:
 * - 웹앱은 하드웨어 세부사항을 모름 (아두이노/라즈베리파이 연결 방식 불관심)
 * - 농장별 MQTT 서버와만 통신
 * - 약속된 JSON 형식으로 데이터 교환
 * - 토픽 규칙과 데이터 스키마를 미리 정의
 */

// ===== 농장별 MQTT 서버 설정 =====

export interface FarmMqttConfig {
  farmId: string;
  farmName: string;
  mqttServer: {
    brokerUrl: string; // 예: mqtt://farm-a.example.com
    port: number; // 예: 1883 (일반), 8883 (SSL)
    username?: string;
    password?: string;
    qos: 0 | 1 | 2; // 메시지 품질
    keepAlive: number; // 연결 유지 시간 (초)
  };
  protocol: {
    version: string; // "1.0"
    encoding: "json";
    timestampFormat: "iso8601"; // "2024-01-01T12:00:00.000Z"
  };
}

// ===== 토픽 규칙 정의 =====

export interface MqttTopicRules {
  // 센서 데이터 토픽 패턴
  sensorData: {
    pattern: string; // "farm/{farmId}/bed/{bedId}/tier/{tierNumber}/sensor/{sensorType}"
    example: string; // "farm/farm_a/bed/bed_1/tier/tier_1/sensor/temperature"
  };
  
  // 제어 명령 토픽 패턴
  controlCommand: {
    pattern: string; // "farm/{farmId}/bed/{bedId}/control/{switchId}"
    example: string; // "farm/farm_a/bed/bed_1/control/pump_1"
  };
  
  // 상태 응답 토픽 패턴
  statusResponse: {
    pattern: string; // "farm/{farmId}/bed/{bedId}/status/{switchId}"
    example: string; // "farm/farm_a/bed/bed_1/status/pump_1"
  };
  
  // 시스템 상태 토픽 패턴
  systemStatus: {
    pattern: string; // "farm/{farmId}/system/{deviceType}"
    example: string; // "farm/farm_a/system/arduino"
  };
}

// ===== JSON 메시지 스키마 정의 =====

// 센서 데이터 (농장 → 웹앱)
export interface SensorDataMessage {
  topic: string;
  payload: {
    // 메타데이터
    farm_id: string;
    bed_id: string;
    tier_number: number;
    sensor_type: string; // "temperature", "humidity", "ec", "ph", "lux", "water_temp"
    
    // 센서 데이터
    value: number;
    unit: string; // "°C", "%", "mS/cm", "pH", "lux", "°C"
    quality: "good" | "warning" | "error";
    
    // 타임스탬프
    timestamp: string; // ISO 8601 형식
    
    // 선택적 정보
    raw_value?: number; // 원시 값 (보정 전)
    calibration_offset?: number; // 보정 오프셋
    calibration_multiplier?: number; // 보정 배수
  };
}

// 제어 명령 (웹앱 → 농장)
export interface ControlCommandMessage {
  topic: string;
  payload: {
    // 메타데이터
    farm_id: string;
    bed_id: string;
    switch_id: string;
    
    // 제어 명령
    command: "on" | "off" | "toggle";
    duration?: number; // 가동 시간 (초), undefined면 무한
    priority?: "low" | "normal" | "high"; // 명령 우선순위
    
    // 사용자 정보
    user_id?: string;
    user_name?: string;
    
    // 타임스탬프
    timestamp: string; // ISO 8601 형식
    
    // 선택적 정보
    reason?: string; // 명령 사유
    safety_check?: boolean; // 안전 검사 수행 여부
  };
}

// 상태 응답 (농장 → 웹앱)
export interface StatusResponseMessage {
  topic: string;
  payload: {
    // 메타데이터
    farm_id: string;
    bed_id: string;
    switch_id: string;
    
    // 현재 상태
    current_state: "on" | "off";
    last_command: "on" | "off";
    execution_time?: number; // 실제 가동 시간 (초)
    
    // 타임스탬프
    timestamp: string; // ISO 8601 형식
    
    // 오류 정보
    error?: string;
    error_code?: string;
    
    // 선택적 정보
    power_consumption?: number; // 전력 소비량 (W)
    temperature?: number; // 장치 온도 (°C)
  };
}

// 시스템 상태 (농장 → 웹앱)
export interface SystemStatusMessage {
  topic: string;
  payload: {
    // 메타데이터
    farm_id: string;
    device_type: "arduino" | "raspberry_pi" | "mqtt_server" | "sensor_hub";
    device_id: string;
    
    // 상태 정보
    status: "online" | "offline" | "error" | "maintenance";
    uptime: number; // 가동 시간 (초)
    
    // 성능 정보
    cpu_usage?: number; // CPU 사용률 (%)
    memory_usage?: number; // 메모리 사용률 (%)
    temperature?: number; // 온도 (°C)
    
    // 연결 정보
    connected_sensors?: number; // 연결된 센서 수
    connected_actuators?: number; // 연결된 액추에이터 수
    
    // 타임스탬프
    timestamp: string; // ISO 8601 형식
    
    // 오류 정보
    error?: string;
    error_code?: string;
    last_error_time?: string;
  };
}

// ===== 토픽 생성 함수들 =====

export function createSensorDataTopic(
  farmId: string,
  bedId: string,
  tierNumber: number,
  sensorType: string
): string {
  return `farm/${farmId}/bed/${bedId}/tier/${tierNumber}/sensor/${sensorType}`;
}

export function createControlCommandTopic(
  farmId: string,
  bedId: string,
  switchId: string
): string {
  return `farm/${farmId}/bed/${bedId}/control/${switchId}`;
}

export function createStatusResponseTopic(
  farmId: string,
  bedId: string,
  switchId: string
): string {
  return `farm/${farmId}/bed/${bedId}/status/${switchId}`;
}

export function createSystemStatusTopic(
  farmId: string,
  deviceType: string
): string {
  return `farm/${farmId}/system/${deviceType}`;
}

// ===== 메시지 검증 함수들 =====

export function validateSensorDataMessage(message: any): message is SensorDataMessage {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.topic === 'string' &&
    message.payload &&
    typeof message.payload.farm_id === 'string' &&
    typeof message.payload.bed_id === 'string' &&
    typeof message.payload.tier_number === 'number' &&
    typeof message.payload.sensor_type === 'string' &&
    typeof message.payload.value === 'number' &&
    typeof message.payload.unit === 'string' &&
    typeof message.payload.timestamp === 'string'
  );
}

export function validateControlCommandMessage(message: any): message is ControlCommandMessage {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.topic === 'string' &&
    message.payload &&
    typeof message.payload.farm_id === 'string' &&
    typeof message.payload.bed_id === 'string' &&
    typeof message.payload.switch_id === 'string' &&
    ['on', 'off', 'toggle'].includes(message.payload.command) &&
    typeof message.payload.timestamp === 'string'
  );
}

export function validateStatusResponseMessage(message: any): message is StatusResponseMessage {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.topic === 'string' &&
    message.payload &&
    typeof message.payload.farm_id === 'string' &&
    typeof message.payload.bed_id === 'string' &&
    typeof message.payload.switch_id === 'string' &&
    ['on', 'off'].includes(message.payload.current_state) &&
    typeof message.payload.timestamp === 'string'
  );
}

// ===== 농장별 프로토콜 설정 =====

export const DEFAULT_TOPIC_RULES: MqttTopicRules = {
  sensorData: {
    pattern: "farm/{farmId}/bed/{bedId}/tier/{tierNumber}/sensor/{sensorType}",
    example: "farm/farm_a/bed/bed_1/tier/tier_1/sensor/temperature"
  },
  controlCommand: {
    pattern: "farm/{farmId}/bed/{bedId}/control/{switchId}",
    example: "farm/farm_a/bed/bed_1/control/pump_1"
  },
  statusResponse: {
    pattern: "farm/{farmId}/bed/{bedId}/status/{switchId}",
    example: "farm/farm_a/bed/bed_1/status/pump_1"
  },
  systemStatus: {
    pattern: "farm/{farmId}/system/{deviceType}",
    example: "farm/farm_a/system/arduino"
  }
};

// ===== 농장별 설정 관리 =====

export interface FarmProtocolSettings {
  farmId: string;
  mqttConfig: FarmMqttConfig;
  topicRules: MqttTopicRules;
  supportedSensors: string[];
  supportedActuators: string[];
  customFields?: {
    [key: string]: any;
  };
}

export function createFarmProtocolSettings(
  farmId: string,
  farmName: string,
  mqttServerUrl: string,
  port: number = 1883
): FarmProtocolSettings {
  return {
    farmId,
    mqttConfig: {
      farmId,
      farmName,
      mqttServer: {
        brokerUrl: mqttServerUrl,
        port,
        qos: 1,
        keepAlive: 60
      },
      protocol: {
        version: "1.0",
        encoding: "json",
        timestampFormat: "iso8601"
      }
    },
    topicRules: DEFAULT_TOPIC_RULES,
    supportedSensors: [
      "temperature",
      "humidity", 
      "ec",
      "ph",
      "lux",
      "water_temp"
    ],
    supportedActuators: [
      "pump",
      "led",
      "fan",
      "heater",
      "nutrient"
    ]
  };
}

// ===== 메시지 변환 유틸리티 =====

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp);
}

export function createSensorDataPayload(
  farmId: string,
  bedId: string,
  tierNumber: number,
  sensorType: string,
  value: number,
  unit: string,
  quality: "good" | "warning" | "error" = "good"
): SensorDataMessage['payload'] {
  return {
    farm_id: farmId,
    bed_id: bedId,
    tier_number: tierNumber,
    sensor_type: sensorType,
    value,
    unit,
    quality,
    timestamp: formatTimestamp()
  };
}

export function createControlCommandPayload(
  farmId: string,
  bedId: string,
  switchId: string,
  command: "on" | "off" | "toggle",
  userId?: string,
  duration?: number
): ControlCommandMessage['payload'] {
  return {
    farm_id: farmId,
    bed_id: bedId,
    switch_id: switchId,
    command,
    duration,
    user_id: userId,
    timestamp: formatTimestamp(),
    priority: "normal",
    safety_check: true
  };
}
