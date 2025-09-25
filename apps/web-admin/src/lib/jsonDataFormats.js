// JSON 데이터 형식 표준화
export class JsonDataFormats {
  // 센서 데이터 JSON 형식
  static createSensorReading(farmId, bedId, sensorType, value, unit) {
    return {
      farm_id: farmId,
      bed_id: bedId,
      sensor_type: sensorType,
      value: value,
      unit: unit,
      timestamp: new Date().toISOString(),
      quality: 'good' // good, warning, error
    }
  }

  // 제어 명령 JSON 형식
  static createControlCommand(farmId, bedId, deviceId, action, parameters = {}) {
    return {
      farm_id: farmId,
      bed_id: bedId,
      device_id: deviceId,
      action: action, // turn_on, turn_off, set_brightness, toggle
      parameters: parameters,
      timestamp: new Date().toISOString(),
      command_id: Date.now().toString()
    }
  }

  // 디바이스 상태 JSON 형식
  static createDeviceStatus(deviceId, name, type, status, brightness = 0, isOnline = true) {
    return {
      device_id: deviceId,
      name: name,
      type: type,
      status: status, // on, off
      brightness: brightness, // 0-100
      is_online: isOnline,
      last_update: new Date().toISOString()
    }
  }

  // 농장 정보 JSON 형식
  static createFarmInfo(farmId, name, bedCount, activeBeds, totalSensors) {
    return {
      farm_id: farmId,
      name: name,
      bed_count: bedCount,
      active_beds: activeBeds,
      total_sensors: totalSensors,
      last_update: new Date().toISOString()
    }
  }

  // 베드 정보 JSON 형식
  static createBedInfo(bedId, farmId, name, cropName, growingMethod, sensorCount, actuatorCount) {
    return {
      bed_id: bedId,
      farm_id: farmId,
      name: name,
      crop_name: cropName,
      growing_method: growingMethod,
      sensor_count: sensorCount,
      actuator_count: actuatorCount,
      last_update: new Date().toISOString()
    }
  }

  // 알림 JSON 형식
  static createAlert(type, level, message, farmId, bedId, deviceId = null) {
    return {
      alert_id: Date.now().toString(),
      type: type, // sensor, control, system
      level: level, // info, warning, error, critical
      message: message,
      farm_id: farmId,
      bed_id: bedId,
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      acknowledged: false
    }
  }

  // 시스템 상태 JSON 형식
  static createSystemStatus(totalFarms, totalBeds, activeSensors, onlineActuators, systemHealth) {
    return {
      total_farms: totalFarms,
      total_beds: totalBeds,
      active_sensors: activeSensors,
      online_actuators: onlineActuators,
      system_health: systemHealth, // good, warning, error
      timestamp: new Date().toISOString()
    }
  }

  // MQTT 토픽 형식
  static getSensorTopic(farmId, bedId, sensorType) {
    return `sensors/${farmId}/${bedId}/${sensorType}`
  }

  static getControlTopic(farmId, bedId, deviceId) {
    return `control/${farmId}/${bedId}/${deviceId}`
  }

  static getControlResultTopic(farmId, bedId, deviceId) {
    return `control/${farmId}/${bedId}/${deviceId}/result`
  }

  static getSystemTopic(topic) {
    return `system/${topic}`
  }

  // JSON 유효성 검사
  static validateSensorReading(data) {
    const required = ['farm_id', 'bed_id', 'sensor_type', 'value', 'unit', 'timestamp']
    return required.every(field => data.hasOwnProperty(field))
  }

  static validateControlCommand(data) {
    const required = ['farm_id', 'bed_id', 'device_id', 'action', 'timestamp']
    return required.every(field => data.hasOwnProperty(field))
  }

  static validateDeviceStatus(data) {
    const required = ['device_id', 'name', 'type', 'status', 'is_online', 'last_update']
    return required.every(field => data.hasOwnProperty(field))
  }

  // JSON 변환 유틸리티
  static toJsonString(data) {
    try {
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('JSON 변환 오류:', error)
      return null
    }
  }

  static fromJsonString(jsonString) {
    try {
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('JSON 파싱 오류:', error)
      return null
    }
  }

  // 데이터 압축 (선택적)
  static compressData(data) {
    // 간단한 압축 예시 (실제로는 더 정교한 압축 사용)
    const compressed = {
      t: data.timestamp,
      v: data.value,
      u: data.unit
    }
    
    if (data.farm_id) compressed.f = data.farm_id
    if (data.bed_id) compressed.b = data.bed_id
    if (data.sensor_type) compressed.s = data.sensor_type
    
    return compressed
  }

  static decompressData(compressed) {
    return {
      farm_id: compressed.f,
      bed_id: compressed.b,
      sensor_type: compressed.s,
      value: compressed.v,
      unit: compressed.u,
      timestamp: compressed.t
    }
  }
}

// JSON 데이터 형식 예시
export const JsonDataExamples = {
  // 센서 데이터 예시
  sensorReading: {
    farm_id: "farm_001",
    bed_id: "bed_001",
    sensor_type: "temperature",
    value: 25.5,
    unit: "°C",
    timestamp: "2025-01-15T10:30:00Z",
    quality: "good"
  },

  // 제어 명령 예시
  controlCommand: {
    farm_id: "farm_001",
    bed_id: "bed_001",
    device_id: "lamp1",
    action: "turn_on",
    parameters: {
      brightness: 80,
      duration: 3600
    },
    timestamp: "2025-01-15T10:30:00Z",
    command_id: "1642248600000"
  },

  // 디바이스 상태 예시
  deviceStatus: {
    device_id: "lamp1",
    name: "램프1",
    type: "light",
    status: "on",
    brightness: 80,
    is_online: true,
    last_update: "2025-01-15T10:30:00Z"
  }
}
