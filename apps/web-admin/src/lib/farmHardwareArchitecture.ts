/**
 * 농장 하드웨어 아키텍처 정의
 * 
 * 하드웨어 구조:
 * - 아두이노: 센서 데이터 수집 (온도, 습도, EC, pH 등)
 * - 라즈베리파이: 액추에이터 제어 (펌프, LED, 팬 등)
 * - MQTT 서버: 데이터 수집 및 제어 명령 전달
 */

// ===== 농장 모듈 구성 =====

export interface FarmModule {
  farmId: string;
  farmName: string;
  hardware: {
    arduino: ArduinoConfig;
    raspberryPi: RaspberryPiConfig;
    mqttServer: MqttServerConfig;
  };
  beds: BedModule[];
}

export interface ArduinoConfig {
  deviceId: string;
  connectionType: 'serial' | 'wifi' | 'bluetooth';
  sensorPorts: {
    [port: string]: {
      sensorType: string;
      isConnected: boolean;
    };
  };
  dataTransmissionInterval: number; // ms
}

export interface RaspberryPiConfig {
  deviceId: string;
  ipAddress: string;
  controlPorts: {
    [port: string]: {
      actuatorType: string;
      isConnected: boolean;
    };
  };
}

export interface MqttServerConfig {
  brokerUrl: string;
  port: number;
  username?: string;
  password?: string;
  qos: 0 | 1 | 2;
}

export interface BedModule {
  bedId: string;
  bedName: string;
  tiers: TierModule[];
  controlSwitches: ControlModule[];
}

export interface TierModule {
  tierNumber: number;
  arduinoSensorId: string; // 아두이노에서의 센서 포트
  sensors: SensorModule[];
}

export interface SensorModule {
  sensorId: string;
  sensorType: 'temperature' | 'humidity' | 'ec' | 'ph' | 'lux' | 'water_temp';
  arduinoPort: string;
  calibrationData?: {
    offset: number;
    multiplier: number;
  };
}

export interface ControlModule {
  switchId: string;
  switchName: string;
  actuatorType: 'pump' | 'led' | 'fan' | 'heater' | 'nutrient';
  raspberryPiPort: string; // 라즈베리파이에서의 제어 포트
  currentState: 'on' | 'off';
  safetyLimits?: {
    maxRuntime?: number; // 최대 가동 시간 (분)
    cooldownTime?: number; // 쿨다운 시간 (분)
  };
}

// ===== MQTT 토픽 구조 (하드웨어 기반) =====

export interface HardwareMqttTopics {
  // 센서 데이터 (아두이노 → 라즈베리파이 → MQTT)
  sensorData: {
    farmTopic: string; // farm_a
    bedTopic: string;  // bed_1
    tierTopic: string; // tier_1
    sensorTopic: string; // temperature
    fullTopic: string; // farm_a/bed_1/tier_1/temperature
  };
  
  // 제어 명령 (웹앱 → MQTT → 라즈베리파이)
  controlCommand: {
    farmTopic: string; // farm_a
    bedTopic: string;  // bed_1
    switchTopic: string; // pump_1
    fullTopic: string; // farm_a/bed_1/control/pump_1
  };
  
  // 상태 응답 (라즈베리파이 → MQTT → 웹앱)
  statusResponse: {
    farmTopic: string; // farm_a
    bedTopic: string;  // bed_1
    switchTopic: string; // pump_1
    fullTopic: string; // farm_a/bed_1/status/pump_1
  };
  
  // 시스템 상태 (라즈베리파이 → MQTT)
  systemStatus: {
    farmTopic: string; // farm_a
    systemTopic: string; // system
    fullTopic: string; // farm_a/system
  };
}

// ===== JSON 메시지 구조 =====

export interface ArduinoSensorData {
  topic: string;
  payload: {
    farm_id: string;
    bed_id: string;
    tier_number: number;
    arduino_id: string;
    sensor_port: string;
    sensor_type: string;
    raw_value: number;
    calibrated_value: number;
    unit: string;
    timestamp: string;
    quality: 'good' | 'warning' | 'error';
  };
}

export interface RaspberryPiControlCommand {
  topic: string;
  payload: {
    farm_id: string;
    bed_id: string;
    raspberry_pi_id: string;
    control_port: string;
    switch_id: string;
    command: 'on' | 'off' | 'toggle';
    duration?: number; // 가동 시간 (초)
    timestamp: string;
    user_id?: string;
  };
}

export interface RaspberryPiStatusResponse {
  topic: string;
  payload: {
    farm_id: string;
    bed_id: string;
    raspberry_pi_id: string;
    control_port: string;
    switch_id: string;
    current_state: 'on' | 'off';
    last_command: 'on' | 'off';
    execution_time?: number; // 실제 가동 시간 (초)
    timestamp: string;
    error?: string;
  };
}

export interface SystemStatusMessage {
  topic: string;
  payload: {
    farm_id: string;
    system_type: 'arduino' | 'raspberry_pi' | 'mqtt_server';
    device_id: string;
    status: 'online' | 'offline' | 'error';
    uptime: number; // 가동 시간 (초)
    timestamp: string;
    error_details?: string;
  };
}

// ===== 토픽 생성 함수들 =====

export function createArduinoSensorTopic(
  farmId: string,
  bedId: string,
  tierNumber: number,
  sensorType: string
): string {
  return `farm_${farmId}/bed_${bedId}/tier_${tierNumber}/${sensorType}`;
}

export function createRaspberryPiControlTopic(
  farmId: string,
  bedId: string,
  switchId: string
): string {
  return `farm_${farmId}/bed_${bedId}/control/${switchId}`;
}

export function createRaspberryPiStatusTopic(
  farmId: string,
  bedId: string,
  switchId: string
): string {
  return `farm_${farmId}/bed_${bedId}/status/${switchId}`;
}

export function createSystemStatusTopic(
  farmId: string,
  deviceType: 'arduino' | 'raspberry_pi' | 'mqtt_server',
  deviceId: string
): string {
  return `farm_${farmId}/system/${deviceType}/${deviceId}`;
}

// ===== 하드웨어 연결 상태 관리 =====

export interface HardwareConnectionStatus {
  farmId: string;
  devices: {
    arduino: {
      deviceId: string;
      isConnected: boolean;
      lastDataReceived?: Date;
      errorCount: number;
    };
    raspberryPi: {
      deviceId: string;
      isConnected: boolean;
      lastCommandReceived?: Date;
      errorCount: number;
    };
    mqttServer: {
      isConnected: boolean;
      lastHeartbeat?: Date;
      errorCount: number;
    };
  };
  overallStatus: 'healthy' | 'warning' | 'error';
  lastUpdated: Date;
}

// ===== 농장 모듈 초기화 =====

export function initializeFarmModule(
  farmId: string,
  farmName: string,
  mqttConfig: MqttServerConfig
): FarmModule {
  return {
    farmId,
    farmName,
    hardware: {
      arduino: {
        deviceId: `arduino_${farmId}`,
        connectionType: 'wifi',
        sensorPorts: {},
        dataTransmissionInterval: 30000 // 30초마다 데이터 전송
      },
      raspberryPi: {
        deviceId: `raspberry_pi_${farmId}`,
        ipAddress: '',
        controlPorts: {}
      },
      mqttServer: mqttConfig
    },
    beds: []
  };
}

// ===== 하드웨어 상태 모니터링 =====

export function createHardwareStatusMonitor(farmId: string) {
  const status: HardwareConnectionStatus = {
    farmId,
    devices: {
      arduino: {
        deviceId: `arduino_${farmId}`,
        isConnected: false,
        errorCount: 0
      },
      raspberryPi: {
        deviceId: `raspberry_pi_${farmId}`,
        isConnected: false,
        errorCount: 0
      },
      mqttServer: {
        isConnected: false,
        errorCount: 0
      }
    },
    overallStatus: 'error',
    lastUpdated: new Date()
  };

  return {
    getStatus: () => status,
    updateArduinoStatus: (isConnected: boolean, errorCount?: number) => {
      status.devices.arduino.isConnected = isConnected;
      if (errorCount !== undefined) {
        status.devices.arduino.errorCount = errorCount;
      }
      if (isConnected) {
        status.devices.arduino.lastDataReceived = new Date();
      }
      updateOverallStatus();
    },
    updateRaspberryPiStatus: (isConnected: boolean, errorCount?: number) => {
      status.devices.raspberryPi.isConnected = isConnected;
      if (errorCount !== undefined) {
        status.devices.raspberryPi.errorCount = errorCount;
      }
      if (isConnected) {
        status.devices.raspberryPi.lastCommandReceived = new Date();
      }
      updateOverallStatus();
    },
    updateMqttStatus: (isConnected: boolean, errorCount?: number) => {
      status.devices.mqttServer.isConnected = isConnected;
      if (errorCount !== undefined) {
        status.devices.mqttServer.errorCount = errorCount;
      }
      if (isConnected) {
        status.devices.mqttServer.lastHeartbeat = new Date();
      }
      updateOverallStatus();
    }
  };

  function updateOverallStatus() {
    const { arduino, raspberryPi, mqttServer } = status.devices;
    
    if (arduino.isConnected && raspberryPi.isConnected && mqttServer.isConnected) {
      status.overallStatus = 'healthy';
    } else if (arduino.errorCount > 0 || raspberryPi.errorCount > 0 || mqttServer.errorCount > 0) {
      status.overallStatus = 'warning';
    } else {
      status.overallStatus = 'error';
    }
    
    status.lastUpdated = new Date();
  }
}
