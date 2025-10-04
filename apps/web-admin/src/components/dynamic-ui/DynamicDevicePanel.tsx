'use client';

import React, { useState, useEffect } from 'react';
import SensorCard, { SENSOR_CONFIGS, SensorConfig, SensorData } from './SensorCard';
import ActuatorCard, { ACTUATOR_CONFIGS, ActuatorConfig, ActuatorData } from './ActuatorCard';

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'sensor_gateway' | 'actuator_controller' | 'mixed';
  status: 'online' | 'offline' | 'error';
  sensors?: SensorInfo[];
  actuators?: ActuatorInfo[];
}

export interface SensorInfo {
  id: string;
  type: string;
  deviceId: string;
  name?: string;
  targetRange?: { min: number; max: number };
}

export interface ActuatorInfo {
  id: string;
  type: string;
  deviceId: string;
  name?: string;
  hasBrightness?: boolean;
  hasSpeed?: boolean;
  hasSchedule?: boolean;
  hasDualTime?: boolean;
}

export interface DynamicDevicePanelProps {
  device: DeviceInfo;
  sensorData?: Record<string, SensorData>;
  actuatorData?: Record<string, ActuatorData>;
  onSensorTargetChange?: (deviceId: string, sensorType: string, targetRange: { min: number; max: number }) => void;
  onActuatorStatusChange?: (deviceId: string, actuatorType: string, status: 'on' | 'off') => void;
  onActuatorModeChange?: (deviceId: string, actuatorType: string, mode: 'manual' | 'auto' | 'schedule') => void;
  onActuatorValueChange?: (deviceId: string, actuatorType: string, value: number) => void;
  onActuatorScheduleChange?: (deviceId: string, actuatorType: string, schedule: any) => void;
  onActuatorDualTimeChange?: (deviceId: string, actuatorType: string, dualTime: any) => void;
  onSensorChartClick?: (deviceId: string, sensorType: string) => void;
}

export default function DynamicDevicePanel({
  device,
  sensorData = {},
  actuatorData = {},
  onSensorTargetChange,
  onActuatorStatusChange,
  onActuatorModeChange,
  onActuatorValueChange,
  onActuatorScheduleChange,
  onActuatorDualTimeChange,
  onSensorChartClick
}: DynamicDevicePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDeviceStatusColor = (status: string): string => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-gray-400';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDeviceStatusText = (status: string): string => {
    switch (status) {
      case 'online': return '온라인';
      case 'offline': return '오프라인';
      case 'error': return '오류';
      default: return '알 수 없음';
    }
  };

  const getDeviceIcon = (type: string): string => {
    switch (type) {
      case 'sensor_gateway': return '📊';
      case 'actuator_controller': return '🔧';
      case 'mixed': return '⚙️';
      default: return '📱';
    }
  };

  // 센서 타입 추론 함수
  const inferSensorConfig = (sensor: SensorInfo): SensorConfig => {
    const type = sensor.type.toLowerCase();
    const name = sensor.name.toLowerCase();
    
    // 온도 관련
    if (type.includes('temp') || name.includes('온도') || name.includes('temperature')) {
      return {
        type: 'temperature',
        icon: '🌡️',
        color: 'red',
        unit: '°C',
        gaugeType: 'circular',
        targetRange: { min: 20, max: 30 },
        displayName: '온도'
      };
    }
    
    // 습도 관련
    if (type.includes('humid') || name.includes('습도') || name.includes('humidity')) {
      return {
        type: 'humidity',
        icon: '💧',
        color: 'blue',
        unit: '%',
        gaugeType: 'circular',
        targetRange: { min: 50, max: 80 },
        displayName: '습도'
      };
    }
    
    // EC 관련
    if (type.includes('ec') || name.includes('ec') || name.includes('전기전도도')) {
      return {
        type: 'ec',
        icon: '⚡',
        color: 'green',
        unit: 'mS/cm',
        gaugeType: 'linear',
        targetRange: { min: 1.0, max: 2.5 },
        displayName: 'EC'
      };
    }
    
    // pH 관련
    if (type.includes('ph') || name.includes('ph') || name.includes('산성도')) {
      return {
        type: 'ph',
        icon: '🧪',
        color: 'purple',
        unit: 'pH',
        gaugeType: 'circular',
        targetRange: { min: 5.5, max: 7.0 },
        displayName: 'pH'
      };
    }
    
    // 조도 관련
    if (type.includes('lux') || type.includes('light') || name.includes('조도') || name.includes('빛')) {
      return {
        type: 'lux',
        icon: '☀️',
        color: 'yellow',
        unit: 'lux',
        gaugeType: 'linear',
        targetRange: { min: 10000, max: 50000 },
        displayName: '조도'
      };
    }
    
    // CO2 관련
    if (type.includes('co2') || name.includes('co2') || name.includes('이산화탄소')) {
      return {
        type: 'co2',
        icon: '🌫️',
        color: 'gray',
        unit: 'ppm',
        gaugeType: 'circular',
        targetRange: { min: 400, max: 1200 },
        displayName: 'CO₂'
      };
    }
    
    // 수위 관련
    if (type.includes('water') || type.includes('level') || name.includes('수위') || name.includes('물')) {
      return {
        type: 'water_level',
        icon: '🌊',
        color: 'cyan',
        unit: '%',
        gaugeType: 'circular',
        targetRange: { min: 70, max: 90 },
        displayName: '수위'
      };
    }
    
    // 토양 수분
    if (type.includes('soil') || type.includes('moisture') || name.includes('토양') || name.includes('수분')) {
      return {
        type: 'water_level', // 재사용
        icon: '🌱',
        color: 'green',
        unit: '%',
        gaugeType: 'circular',
        targetRange: { min: 30, max: 70 },
        displayName: '토양 수분'
      };
    }
    
    // 공기질
    if (type.includes('air') || type.includes('quality') || name.includes('공기') || name.includes('질')) {
      return {
        type: 'co2', // 재사용
        icon: '🌬️',
        color: 'blue',
        unit: 'ppm',
        gaugeType: 'circular',
        targetRange: { min: 0, max: 1000 },
        displayName: '공기질'
      };
    }
    
    // 풍속
    if (type.includes('wind') || type.includes('speed') || name.includes('풍속') || name.includes('바람')) {
      return {
        type: 'temperature', // 재사용
        icon: '💨',
        color: 'sky',
        unit: 'm/s',
        gaugeType: 'linear',
        targetRange: { min: 0, max: 20 },
        displayName: '풍속'
      };
    }
    
    // 기본 fallback
    return {
      type: 'temperature',
      icon: '❓',
      color: 'gray',
      unit: 'unit',
      gaugeType: 'circular',
      targetRange: { min: 0, max: 100 },
      displayName: sensor.name || sensor.type || '알 수 없는 센서'
    };
  };

  const renderSensorCard = (sensor: SensorInfo) => {
    const config = SENSOR_CONFIGS[sensor.type];
    if (!config) {
      console.warn(`Unknown sensor type: ${sensor.type}, inferring from name: ${sensor.name}`);
      // 센서 타입 추론을 통한 설정 생성
      const fallbackConfig = inferSensorConfig(sensor);
      
      const data = sensorData[sensor.id] || {
        value: 0,
        timestamp: new Date().toISOString(),
        status: 'offline' as const
      };

      return (
        <SensorCard
          key={sensor.id}
          config={fallbackConfig}
          data={data}
          deviceId={device.id}
          onTargetChange={onSensorTargetChange}
          onChartClick={onSensorChartClick}
        />
      );
    }

    const data = sensorData[sensor.id] || {
      value: 0,
      timestamp: new Date().toISOString(),
      status: 'offline' as const
    };

    const sensorConfig: SensorConfig = {
      ...config,
      targetRange: sensor.targetRange || config.targetRange
    };

    return (
      <SensorCard
        key={sensor.id}
        config={sensorConfig}
        data={data}
        deviceId={device.id}
        onTargetChange={onSensorTargetChange}
        onChartClick={onSensorChartClick}
      />
    );
  };

  // 액추에이터 타입 추론 함수
  const inferActuatorConfig = (actuator: ActuatorInfo): ActuatorConfig => {
    const type = actuator.type.toLowerCase();
    const name = actuator.name.toLowerCase();
    
    // LED 관련
    if (type.includes('led') || type.includes('light') || name.includes('led') || name.includes('조명') || name.includes('빛')) {
      return {
        type: 'led',
        icon: '💡',
        color: 'yellow',
        displayName: 'LED 조명',
        hasBrightness: true,
        hasSpeed: false,
        hasSchedule: true,
        hasDualTime: true
      };
    }
    
    // 펌프 관련
    if (type.includes('pump') || name.includes('펌프') || name.includes('물') || name.includes('급수')) {
      return {
        type: 'pump',
        icon: '💧',
        color: 'blue',
        displayName: '펌프',
        hasBrightness: false,
        hasSpeed: true,
        hasSchedule: true,
        hasDualTime: false
      };
    }
    
    // 팬 관련
    if (type.includes('fan') || name.includes('팬') || name.includes('환기') || name.includes('공기')) {
      return {
        type: 'fan',
        icon: '🌀',
        color: 'cyan',
        displayName: '팬',
        hasBrightness: false,
        hasSpeed: true,
        hasSchedule: true,
        hasDualTime: false
      };
    }
    
    // 히터 관련
    if (type.includes('heater') || type.includes('heat') || name.includes('히터') || name.includes('난방')) {
      return {
        type: 'heater',
        icon: '🔥',
        color: 'red',
        displayName: '히터',
        hasBrightness: false,
        hasSpeed: false,
        hasSchedule: true,
        hasDualTime: false
      };
    }
    
    // 영양액 디스펜서
    if (type.includes('nutrient') || type.includes('dispenser') || name.includes('영양액') || name.includes('디스펜서')) {
      return {
        type: 'nutrient_dispenser',
        icon: '🧪',
        color: 'green',
        displayName: '영양액 디스펜서',
        hasBrightness: false,
        hasSpeed: true,
        hasSchedule: true,
        hasDualTime: false
      };
    }
    
    // CO2 인젝터
    if (type.includes('co2') || name.includes('co2') || name.includes('이산화탄소')) {
      return {
        type: 'co2_injector',
        icon: '🌫️',
        color: 'gray',
        displayName: 'CO₂ 인젝터',
        hasBrightness: false,
        hasSpeed: true,
        hasSchedule: true,
        hasDualTime: false
      };
    }
    
    // 스프링클러
    if (type.includes('sprinkler') || name.includes('스프링클러') || name.includes('분무')) {
      return {
        type: 'pump', // 재사용
        icon: '💦',
        color: 'blue',
        displayName: '스프링클러',
        hasBrightness: false,
        hasSpeed: true,
        hasSchedule: true,
        hasDualTime: false
      };
    }
    
    // 환기팬
    if (type.includes('ventilation') || name.includes('환기팬') || name.includes('환기')) {
      return {
        type: 'fan', // 재사용
        icon: '🌪️',
        color: 'cyan',
        displayName: '환기팬',
        hasBrightness: false,
        hasSpeed: true,
        hasSchedule: true,
        hasDualTime: false
      };
    }
    
    // 기본 fallback
    return {
      type: 'led',
      icon: '❓',
      color: 'gray',
      displayName: actuator.name || actuator.type || '알 수 없는 액추에이터',
      hasBrightness: true,
      hasSpeed: false,
      hasSchedule: true,
      hasDualTime: false
    };
  };

  const renderActuatorCard = (actuator: ActuatorInfo) => {
    const config = ACTUATOR_CONFIGS[actuator.type];
    if (!config) {
      console.warn(`Unknown actuator type: ${actuator.type}, inferring from name: ${actuator.name}`);
      // 액추에이터 타입 추론을 통한 설정 생성
      const fallbackConfig = inferActuatorConfig(actuator);
      
      const data = actuatorData[actuator.id] || {
        status: 'off' as const,
        mode: 'manual' as const,
        value: 0
      };

      return (
        <ActuatorCard
          key={actuator.id}
          config={fallbackConfig}
          data={data}
          deviceId={device.id}
          onStatusChange={onActuatorStatusChange}
          onModeChange={onActuatorModeChange}
          onValueChange={onActuatorValueChange}
          onScheduleChange={onActuatorScheduleChange}
          onDualTimeChange={onActuatorDualTimeChange}
        />
      );
    }

    const data = actuatorData[actuator.id] || {
      status: 'off' as const,
      mode: 'manual' as const,
      value: 0
    };

    const actuatorConfig: ActuatorConfig = {
      ...config,
      hasBrightness: actuator.hasBrightness ?? config.hasBrightness,
      hasSpeed: actuator.hasSpeed ?? config.hasSpeed,
      hasSchedule: actuator.hasSchedule ?? config.hasSchedule,
      hasDualTime: actuator.hasDualTime ?? config.hasDualTime
    };

    return (
      <ActuatorCard
        key={actuator.id}
        config={actuatorConfig}
        data={data}
        deviceId={device.id}
        onStatusChange={onActuatorStatusChange}
        onModeChange={onActuatorModeChange}
        onValueChange={onActuatorValueChange}
        onScheduleChange={onActuatorScheduleChange}
        onDualTimeChange={onActuatorDualTimeChange}
      />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* 디바이스 헤더 */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getDeviceIcon(device.type)}</span>
            <div>
              <h3 className="font-bold text-gray-800">{device.name}</h3>
              <p className="text-sm text-gray-500">디바이스 ID: {device.id.slice(-8)}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${getDeviceStatusColor(device.status)}`}>
              {getDeviceStatusText(device.status)}
            </div>
            <div className="text-xs text-gray-500">
              {device.sensors?.length || 0}개 센서, {device.actuators?.length || 0}개 액추에이터
            </div>
          </div>
        </div>
      </div>

      {/* 확장된 내용 */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* 센서 섹션 */}
          {device.sensors && device.sensors.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                📊 실시간 센서 데이터
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {device.sensors.map(renderSensorCard)}
              </div>
            </div>
          )}

          {/* 액추에이터 섹션 */}
          {device.actuators && device.actuators.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                🔧 액추에이터 제어
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {device.actuators.map(renderActuatorCard)}
              </div>
            </div>
          )}

          {/* 디바이스 정보가 없는 경우 */}
          {(!device.sensors || device.sensors.length === 0) && 
           (!device.actuators || device.actuators.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📱</div>
              <p>연결된 센서나 액추에이터가 없습니다.</p>
              <p className="text-sm">유니버셜 브릿지를 통해 디바이스를 연결해보세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 유틸리티 함수들
export const createMockSensorData = (sensorType: string): SensorData => {
  const config = SENSOR_CONFIGS[sensorType];
  if (!config) {
    return {
      value: 0,
      timestamp: new Date().toISOString(),
      status: 'offline'
    };
  }

  // 목 데이터 생성 (실제 구현에서는 API에서 가져옴)
  const { min, max } = config.targetRange;
  const value = min + Math.random() * (max - min);
  
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (value < min * 0.9 || value > max * 1.1) {
    status = 'critical';
  } else if (value < min * 0.95 || value > max * 1.05) {
    status = 'warning';
  }

  return {
    value,
    timestamp: new Date().toISOString(),
    status
  };
};

export const createMockActuatorData = (actuatorType: string): ActuatorData => {
  const config = ACTUATOR_CONFIGS[actuatorType];
  if (!config) {
    return {
      status: 'off',
      mode: 'manual',
      value: 0
    };
  }

  // 목 데이터 생성
  return {
    status: Math.random() > 0.5 ? 'on' : 'off',
    mode: ['manual', 'auto', 'schedule'][Math.floor(Math.random() * 3)] as 'manual' | 'auto' | 'schedule',
    value: Math.floor(Math.random() * 101)
  };
};

export const createMockDevice = (id: string, name: string, type: DeviceInfo['type']): DeviceInfo => {
  const sensors: SensorInfo[] = [];
  const actuators: ActuatorInfo[] = [];

  // 센서 추가 (타입에 따라)
  if (type === 'sensor_gateway' || type === 'mixed') {
    ['temperature', 'humidity', 'ec', 'ph'].forEach((sensorType, index) => {
      sensors.push({
        id: `${id}_sensor_${index}`,
        type: sensorType,
        deviceId: id,
        name: `${name} ${SENSOR_CONFIGS[sensorType]?.displayName || sensorType}`
      });
    });
  }

  // 액추에이터 추가 (타입에 따라)
  if (type === 'actuator_controller' || type === 'mixed') {
    ['led', 'pump', 'fan'].forEach((actuatorType, index) => {
      actuators.push({
        id: `${id}_actuator_${index}`,
        type: actuatorType,
        deviceId: id,
        name: `${name} ${ACTUATOR_CONFIGS[actuatorType]?.displayName || actuatorType}`
      });
    });
  }

  return {
    id,
    name,
    type,
    status: 'online',
    sensors,
    actuators
  };
};

// 알 수 없는 디바이스 타입을 위한 동적 디바이스 생성 함수
export const createDynamicDevice = (
  id: string, 
  name: string, 
  deviceType: string,
  sensors: Array<{type: string, unit?: string, name?: string}> = [],
  actuators: Array<{type: string, name?: string}> = []
): DeviceInfo => {
  const sensorInfos: SensorInfo[] = sensors.map((sensor, index) => ({
    id: `${id}_sensor_${index}`,
    type: sensor.type,
    deviceId: id,
    name: sensor.name || `${name} ${sensor.type}`
  }));

  const actuatorInfos: ActuatorInfo[] = actuators.map((actuator, index) => ({
    id: `${id}_actuator_${index}`,
    type: actuator.type,
    deviceId: id,
    name: actuator.name || `${name} ${actuator.type}`
  }));

  // 디바이스 타입 결정
  let type: DeviceInfo['type'] = 'mixed';
  if (sensorInfos.length > 0 && actuatorInfos.length === 0) {
    type = 'sensor_gateway';
  } else if (sensorInfos.length === 0 && actuatorInfos.length > 0) {
    type = 'actuator_controller';
  }

  return {
    id,
    name,
    type,
    status: 'online',
    sensors: sensorInfos,
    actuators: actuatorInfos
  };
};
