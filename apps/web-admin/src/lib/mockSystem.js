// 통합 Mock 시스템
import { mockSensorCollector } from './mockSensors.js'
import { mockActuatorManager } from './mockActuators.js'
import { mockMqttClient } from './mockMqtt.js'
import { JsonDataFormats } from './jsonDataFormats.js'

export class MockSystem {
  constructor() {
    this.isInitialized = false
    this.isRunning = false
    this.farms = new Map()
    this.beds = new Map()
  }

  // 시스템 초기화
  initialize() {
    if (this.isInitialized) return

    // MQTT 클라이언트에 센서 수집기와 액추에이터 관리자 연결
    mockMqttClient.connect(mockSensorCollector, mockActuatorManager)

    // 기본 농장과 베드 설정
    this.setupDefaultFarms()

    this.isInitialized = true
    console.log('🚀 Mock 시스템 초기화 완료')
  }

  // 기본 농장과 베드 설정
  setupDefaultFarms() {
    const defaultFarms = [
      { id: 'farm_001', name: '1농장' },
      { id: 'farm_002', name: '2농장' },
      { id: 'farm_003', name: '3농장' }
    ]

    const defaultBeds = [
      { id: 'bed_001', farmId: 'farm_001', name: '베드1' },
      { id: 'bed_002', farmId: 'farm_001', name: '베드2' },
      { id: 'bed_003', farmId: 'farm_002', name: '베드1' },
      { id: 'bed_004', farmId: 'farm_002', name: '베드2' },
      { id: 'bed_005', farmId: 'farm_003', name: '베드1' },
      { id: 'bed_006', farmId: 'farm_003', name: '베드2' }
    ]

    // 농장 설정
    for (const farm of defaultFarms) {
      this.farms.set(farm.id, farm)
    }

    // 베드 설정
    for (const bed of defaultBeds) {
      this.beds.set(bed.id, bed)
      
      // 각 베드에 센서와 액추에이터 추가
      mockSensorCollector.addBedSensors(bed.id)
      mockActuatorManager.addBedActuators(bed.id, bed.farmId)
    }
  }

  // 시스템 시작
  start() {
    if (!this.isInitialized) {
      this.initialize()
    }

    if (this.isRunning) return

    // MQTT 구독 설정 (연결 후)
    this.setupMqttSubscriptions()

    // 센서 데이터 수집 시작
    mockMqttClient.startSensorDataCollection(5000)

    this.isRunning = true
    console.log('🚀 Mock 시스템 시작됨')
  }

  // 시스템 중지
  stop() {
    if (!this.isRunning) return

    // 센서 데이터 수집 중지
    mockMqttClient.stopSensorDataCollection()

    // MQTT 연결 해제
    mockMqttClient.disconnect()

    this.isRunning = false
    console.log('🛑 Mock 시스템 중지됨')
  }

  // MQTT 구독 설정
  setupMqttSubscriptions() {
    // 제어 명령 구독
    mockMqttClient.subscribe('control/+/+/+', (topic, message) => {
      this.handleControlCommand(topic, message)
    })

    // 시스템 명령 구독
    mockMqttClient.subscribe('system/+', (topic, message) => {
      this.handleSystemCommand(topic, message)
    })
  }

  // 제어 명령 처리
  handleControlCommand(topic, message) {
    try {
      const command = typeof message === 'string' ? JSON.parse(message) : message
      
      // 액추에이터 관리자에게 명령 전달
      const result = mockActuatorManager.handleCommand(command.device_id, command)
      
      // 결과를 MQTT로 발행
      const resultTopic = `control/${command.farm_id}/${command.bed_id}/${command.device_id}/result`
      mockMqttClient.publish(resultTopic, {
        ...result,
        command_id: command.command_id,
        success: true
      })

      console.log(`✅ 제어 명령 처리 완료: ${command.device_id}`)
    } catch (error) {
      console.error('❌ 제어 명령 처리 오류:', error)
      
      // 오류 결과 발행
      const errorTopic = `control/error`
      mockMqttClient.publish(errorTopic, {
        error: error.message,
        topic,
        message,
        timestamp: new Date().toISOString()
      })
    }
  }

  // 시스템 명령 처리
  handleSystemCommand(topic, message) {
    try {
      const command = typeof message === 'string' ? JSON.parse(message) : message
      
      switch (command.action) {
        case 'get_status':
          this.publishSystemStatus()
          break
        case 'get_farms':
          this.publishFarmsInfo()
          break
        case 'get_beds':
          this.publishBedsInfo(command.farm_id)
          break
        default:
          console.log(`알 수 없는 시스템 명령: ${command.action}`)
      }
    } catch (error) {
      console.error('❌ 시스템 명령 처리 오류:', error)
    }
  }

  // 시스템 상태 발행
  publishSystemStatus() {
    const status = JsonDataFormats.createSystemStatus(
      this.farms.size,
      this.beds.size,
      mockSensorCollector.getLatestReadings().length,
      mockActuatorManager.getAllActuators().filter(a => a.isOnline).length,
      'good'
    )

    mockMqttClient.publish('system/status', status)
  }

  // 농장 정보 발행
  publishFarmsInfo() {
    for (const [farmId, farm] of this.farms) {
      const farmBeds = Array.from(this.beds.values()).filter(bed => bed.farmId === farmId)
      const activeBeds = farmBeds.length
      const totalSensors = farmBeds.length * 6 // 각 베드당 6개 센서

      const farmInfo = JsonDataFormats.createFarmInfo(
        farmId,
        farm.name,
        farmBeds.length,
        activeBeds,
        totalSensors
      )

      mockMqttClient.publish(`system/farms/${farmId}`, farmInfo)
    }
  }

  // 베드 정보 발행
  publishBedsInfo(farmId) {
    const farmBeds = Array.from(this.beds.values()).filter(bed => bed.farmId === farmId)
    
    for (const bed of farmBeds) {
      const bedInfo = JsonDataFormats.createBedInfo(
        bed.id,
        bed.farmId,
        bed.name,
        '토마토', // 기본 작물
        '담액식', // 기본 재배 방식
        6, // 센서 수
        4  // 액추에이터 수
      )

      mockMqttClient.publish(`system/beds/${bed.id}`, bedInfo)
    }
  }

  // 베드 추가
  addBed(bedId, farmId, name, cropName = '토마토', growingMethod = '담액식') {
    const bed = {
      id: bedId,
      farmId: farmId,
      name: name,
      cropName: cropName,
      growingMethod: growingMethod
    }

    this.beds.set(bedId, bed)
    
    // 센서와 액추에이터 추가
    mockSensorCollector.addBedSensors(bedId)
    mockActuatorManager.addBedActuators(bedId, farmId)

    console.log(`✅ 베드 추가됨: ${bedId} (${farmId})`)
  }

  // 베드 제거
  removeBed(bedId) {
    if (this.beds.has(bedId)) {
      this.beds.delete(bedId)
      
      // 센서와 액추에이터 제거
      mockSensorCollector.removeBedSensors(bedId)
      mockActuatorManager.removeBedActuators(bedId)

      console.log(`✅ 베드 제거됨: ${bedId}`)
    }
  }

  // 시스템 상태 조회
  getSystemStatus() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      farms: Array.from(this.farms.values()),
      beds: Array.from(this.beds.values()),
      mqttStatus: mockMqttClient.getConnectionStatus(),
      sensorReadings: mockSensorCollector.getLatestReadings().length,
      actuators: mockActuatorManager.getAllActuators().length
    }
  }

  // 특정 농장의 베드 조회
  getFarmBeds(farmId) {
    return Array.from(this.beds.values()).filter(bed => bed.farmId === farmId)
  }

  // 특정 베드의 센서 데이터 조회
  getBedSensorData(bedId) {
    return mockSensorCollector.getLatestReadings(bedId)
  }

  // 특정 베드의 액추에이터 상태 조회
  getBedActuators(bedId) {
    return mockActuatorManager.getBedActuators(bedId)
  }
}

// 전역 Mock 시스템 인스턴스
export const mockSystem = new MockSystem()
