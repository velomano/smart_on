// Mock 액추에이터 제어 시뮬레이션
export class MockActuator {
  constructor(deviceId, name, type, bedId, farmId) {
    this.deviceId = deviceId
    this.name = name
    this.type = type
    this.bedId = bedId
    this.farmId = farmId
    this.status = 'off'
    this.brightness = 0
    this.lastUpdate = new Date()
    this.isOnline = true
  }

  handleCommand(command) {
    if (!this.isOnline) {
      throw new Error(`디바이스 ${this.deviceId}가 오프라인 상태입니다.`)
    }

    switch (command.action) {
      case 'turn_on':
        this.status = 'on'
        this.brightness = command.parameters?.brightness || 100
        break
      case 'turn_off':
        this.status = 'off'
        this.brightness = 0
        break
      case 'set_brightness':
        if (this.status === 'on') {
          this.brightness = Math.max(0, Math.min(100, command.parameters?.brightness || 0))
        }
        break
      case 'toggle':
        this.status = this.status === 'on' ? 'off' : 'on'
        if (this.status === 'off') {
          this.brightness = 0
        }
        break
      default:
        throw new Error(`지원하지 않는 명령: ${command.action}`)
    }

    this.lastUpdate = new Date()
    
    // 콘솔에 로그 출력 (개발용)
    console.log(`🔌 Mock 액추에이터 제어: ${this.name} (${this.deviceId}) - ${this.status} (${this.brightness}%)`)
  }

  getStatus() {
    return {
      deviceId: this.deviceId,
      name: this.name,
      type: this.type,
      bedId: this.bedId,
      farmId: this.farmId,
      status: this.status,
      brightness: this.brightness,
      isOnline: this.isOnline,
      lastUpdate: this.lastUpdate.toISOString()
    }
  }

  setOnline(online) {
    this.isOnline = online
    this.lastUpdate = new Date()
  }
}

// Mock 액추에이터 팩토리
export class MockActuatorFactory {
  static createActuators(bedId, farmId) {
    return [
      new MockActuator('lamp1', '램프1', 'light', bedId, farmId),
      new MockActuator('lamp2', '램프2', 'light', bedId, farmId),
      new MockActuator('pump', '펌프', 'pump', bedId, farmId),
      new MockActuator('fan', '팬', 'fan', bedId, farmId)
    ]
  }
}

// Mock 액추에이터 관리자
export class MockActuatorManager {
  constructor() {
    this.actuators = new Map()
    this.commandHistory = []
  }

  addBedActuators(bedId, farmId) {
    const bedActuators = MockActuatorFactory.createActuators(bedId, farmId)
    this.actuators.set(bedId, bedActuators)
  }

  removeBedActuators(bedId) {
    this.actuators.delete(bedId)
  }

  getActuator(deviceId) {
    for (const [bedId, bedActuators] of this.actuators) {
      const actuator = bedActuators.find(a => a.deviceId === deviceId)
      if (actuator) return actuator
    }
    return null
  }

  handleCommand(deviceId, command) {
    const actuator = this.getActuator(deviceId)
    if (!actuator) {
      throw new Error(`디바이스 ${deviceId}를 찾을 수 없습니다.`)
    }

    try {
      actuator.handleCommand(command)
      
      // 명령 히스토리에 추가
      this.commandHistory.push({
        deviceId,
        command,
        timestamp: new Date().toISOString(),
        success: true
      })

      return actuator.getStatus()
    } catch (error) {
      // 실패한 명령도 히스토리에 추가
      this.commandHistory.push({
        deviceId,
        command,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      })
      throw error
    }
  }

  getBedActuators(bedId) {
    const bedActuators = this.actuators.get(bedId)
    return bedActuators ? bedActuators.map(actuator => actuator.getStatus()) : []
  }

  getAllActuators() {
    const allActuators = []
    for (const [bedId, bedActuators] of this.actuators) {
      for (const actuator of bedActuators) {
        allActuators.push(actuator.getStatus())
      }
    }
    return allActuators
  }

  getCommandHistory(limit = 50) {
    return this.commandHistory.slice(-limit)
  }

  setActuatorOnline(deviceId, online) {
    const actuator = this.getActuator(deviceId)
    if (actuator) {
      actuator.setOnline(online)
    }
  }
}

// 전역 액추에이터 관리자 인스턴스
export const mockActuatorManager = new MockActuatorManager()
