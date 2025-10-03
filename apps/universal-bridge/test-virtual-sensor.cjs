/**
 * 가상 센서 데이터 생성기
 * 실제 기기 없이 WebSocket 테스트용
 */

const WebSocket = require('ws');

// 가상 디바이스 설정
const VIRTUAL_DEVICE = {
  deviceId: 'virtual-sensor-001',
  farmId: '977c3778-ded6-4140-a715-17d33f1e4a33',
  sensors: [
    { key: 'temperature', unit: '°C', min: 15, max: 35 },
    { key: 'humidity', unit: '%', min: 30, max: 80 },
    { key: 'soil_moisture', unit: '%', min: 0, max: 100 },
    { key: 'light', unit: 'lux', min: 0, max: 1000 }
  ]
};

// 가상 데이터 생성 함수
function generateVirtualData() {
  const data = [];
  
  VIRTUAL_DEVICE.sensors.forEach(sensor => {
    const value = Math.random() * (sensor.max - sensor.min) + sensor.min;
    data.push({
      key: sensor.key,
      value: Math.round(value * 10) / 10,
      unit: sensor.unit,
      timestamp: new Date().toISOString()
    });
  });
  
  return data;
}

// Universal Bridge에 가상 데이터 전송
async function sendVirtualData() {
  try {
    const virtualReadings = generateVirtualData();
    
    // Universal Bridge API 형식으로 변환
    const metrics = {};
    virtualReadings.forEach(reading => {
      metrics[reading.key] = reading.value;
    });
    
    const response = await fetch('http://localhost:3001/api/bridge/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: VIRTUAL_DEVICE.deviceId,
        tenant_id: '00000000-0000-0000-0000-000000000001',
        farm_id: VIRTUAL_DEVICE.farmId,
        metrics: metrics,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      console.log('✅ 가상 센서 데이터 전송 성공:', new Date().toLocaleTimeString());
    } else {
      console.log('❌ 데이터 전송 실패:', response.status);
    }
  } catch (error) {
    console.log('❌ 연결 오류:', error.message);
  }
}

// Setup Token 생성
async function createSetupToken() {
  try {
    const response = await fetch('http://localhost:3001/api/provisioning/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_id: '00000000-0000-0000-0000-000000000001',
        farm_id: VIRTUAL_DEVICE.farmId,
        ttl: 3600, // 1시간
        device_type: 'sensor',
        capabilities: VIRTUAL_DEVICE.sensors.map(s => s.key)
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Setup Token 생성 성공');
      return data.token;
    } else {
      console.log('❌ Setup Token 생성 실패:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Setup Token 생성 오류:', error.message);
    return null;
  }
}

// 디바이스 등록
async function registerDevice() {
  try {
    // 먼저 setup token 생성
    const setupToken = await createSetupToken();
    if (!setupToken) {
      console.log('❌ Setup Token 생성 실패로 디바이스 등록 불가');
      return;
    }

    const response = await fetch('http://localhost:3001/api/provisioning/bind', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        setup_token: setupToken,
        device_id: VIRTUAL_DEVICE.deviceId,
        device_type: 'sensor',
        capabilities: VIRTUAL_DEVICE.sensors.map(s => s.key),
        device_key: 'virtual-device-key-001'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 가상 디바이스 등록 성공');
      console.log('📋 Device Token:', data.device_token ? '발급됨' : '없음');
    } else {
      console.log('⚠️ 디바이스 등록 실패 (이미 등록되었을 수 있음):', response.status);
    }
  } catch (error) {
    console.log('⚠️ 디바이스 등록 오류:', error.message);
  }
}

// 5초마다 가상 데이터 전송
console.log('🤖 가상 센서 시작...');
console.log('📍 농장 ID:', VIRTUAL_DEVICE.farmId);
console.log('📡 디바이스 ID:', VIRTUAL_DEVICE.deviceId);
console.log('⏰ 5초마다 데이터 전송...');

// 디바이스 등록 후 데이터 전송 시작
registerDevice().then(() => {
  setInterval(sendVirtualData, 5000);
  // 즉시 첫 데이터 전송
  setTimeout(sendVirtualData, 2000);
});
