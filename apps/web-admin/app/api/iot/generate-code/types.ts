/**
 * Universal IoT Code Generator Types
 */

export interface SystemSpec {
  device: string;
  protocol: 'http' | 'mqtt' | 'websocket' | 'webhook' | 'serial' | 'ble' | 'rs485' | 'modbus-tcp' | 'lorawan';
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  wifi: {
    ssid: string;
    password: string;
  };
  allocation?: any;
  bridgeIntegration?: boolean;
  pinAssignments?: Record<string, string>;
  modbusConfig?: {
    host: string;
    port: number;
    unitId: number;
    registerMappings: Record<string, number>;
    dataTypes: Record<string, 'U16' | 'S16' | 'U32' | 'S32' | 'float'>;
    safeLimits: Record<string, { min: number; max: number }>;
  };
  lorawanConfig?: {
    mode: 'mqtt' | 'webhook';
    lns: 'the-things-stack' | 'chirpstack' | 'carrier';
    region: string;
    deviceMap?: Record<string, string>;
    codec?: { type: 'js'; script?: string; scriptRef?: string };
    mqtt?: {
      host: string;
      port: number;
      username: string;
      password: string;
      uplinkTopic: string;
      downlinkTopicTpl: string;
      tls?: boolean;
    };
    webhook?: { secret: string; path: string; };
    api?: { baseUrl: string; token: string; };
  };
}

export interface SensorRegistry {
  metadata: {
    version: string;
    description: string;
    coverage: string;
    supportedInterfaces: string[];
  };
  sensors: SensorDefinition[];
  actuators: ActuatorDefinition[];
}

export interface SensorDefinition {
  type: string;
  model: string;
  protocol: string;
  libDeps: string[];
  pinHints: string[];
  initSnippet: string;
  readSnippet: string;
  notes: string;
  powerConsumption: number;
  i2cAddresses?: string[];
}

export interface ActuatorDefinition {
  type: string;
  model: string;
  protocol: string;
  libDeps: string[];
  pinHints: string[];
  initSnippet: string;
  setSnippet: string;
  notes: string;
  powerConsumption: number;
}

export interface PinAssignment {
  component: string;
  pin: string;
  type: 'digital' | 'pwm' | 'analog' | 'i2c' | 'spi' | 'uart';
}

export interface DeviceProfile {
  name: string;
  pins: {
    digital: string[];
    pwm: string[];
    analog: string[];
    i2c: string[];
    spi: string[];
    uart: string[];
  };
  powerConsumption: number;
  voltage: {
    min: number;
    max: number;
    recommended: number;
  };
}
