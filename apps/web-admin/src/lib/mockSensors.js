// Mock 센서 데이터 시뮬레이션
export class MockSensor {
  constructor(type, min, max, unit) {
    this.type = type
    this.min = min
    this.max = max
    this.unit = unit
    this.currentValue = this.generateValue()
    this.lastUpdate = new Date()
  }

  generateValue() {
    // 실제 센서처럼 약간의 변동성을 가진 값 생성
    const baseValue = Math.random() * (this.max - this.min) + this.min
    const variation = (Math.random() - 0.5) * 0.1 * (this.max - this.min)
    return Math.round((baseValue + variation) * 10) / 10
  }

  update() {
    this.currentValue = this.generateValue()
    
    this.lastUpdate = new Date()
    return {
      type: this.type,
      value: this.currentValue,
      unit: this.unit,
      timestamp: this.lastUpdate.toISOString()
    }
  }

  getStatus() {
    return {
      type: this.type,
      value: this.currentValue,
      unit: this.unit,
      lastUpdate: this.lastUpdate.toISOString()
    }
  }
}

// Mock 센서 팩토리
export class MockSensorFactory {
  static createSensors() {
    return [
      new MockSensor('temperature', 35, 45, '°C'), // 경고를 위해 온도 범위를 높임 (임계값: max 35°C)
      new MockSensor('humidity', 82, 95, '%'), // 습도도 경고를 위해 높임 (임계값: max 80%)
      new MockSensor('ec', 1.0, 2.5, 'mS/cm'),
      new MockSensor('ph', 5.5, 7.0, 'pH'),
      new MockSensor('light', 0, 1000, 'lux'),
      new MockSensor('water_temp', 18, 25, '°C')
    ]
  }

  static createBedSensors(bedId) {
    const sensors = this.createSensors()
    return sensors.map(sensor => {
      // 센서 객체에 bedId와 farmId 추가하되 메서드는 유지
      sensor.bedId = bedId
      sensor.farmId = bedId.split('_')[0] // bed_001 -> farm_001
      return sensor
    })
  }
}

// Mock 센서 데이터 수집기
export class MockSensorCollector {
  constructor() {
    this.sensors = new Map()
    this.isRunning = false
    this.intervalId = null
  }

  addBedSensors(bedId) {
    const bedSensors = MockSensorFactory.createBedSensors(bedId)
    this.sensors.set(bedId, bedSensors)
  }

  removeBedSensors(bedId) {
    this.sensors.delete(bedId)
  }

  startCollection(intervalMs = 5000) {
    if (this.isRunning) return

    this.isRunning = true
    this.intervalId = setInterval(() => {
      this.collectAllSensors()
    }, intervalMs)
  }

  stopCollection() {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  collectAllSensors() {
    const allReadings = []
    
    for (const [bedId, bedSensors] of this.sensors) {
      for (const sensor of bedSensors) {
        const reading = sensor.update()
        allReadings.push({
          ...reading,
          bedId: bedId,
          farmId: sensor.farmId
        })
      }
    }

    // 콘솔에 로그 출력 (개발용)
    console.log('📊 Mock 센서 데이터 수집:', allReadings.length, '개')

    return allReadings
  }

  getLatestReadings(bedId = null) {
    if (bedId) {
      const bedSensors = this.sensors.get(bedId)
      return bedSensors ? bedSensors.map(sensor => sensor.getStatus()) : []
    }

    const allReadings = []
    for (const [currentBedId, bedSensors] of this.sensors) {
      for (const sensor of bedSensors) {
        allReadings.push({
          ...sensor.getStatus(),
          bedId: currentBedId,
          farmId: sensor.farmId
        })
      }
    }
    return allReadings
  }
}

// 전역 센서 수집기 인스턴스
export const mockSensorCollector = new MockSensorCollector()
