/**
 * ESP32 디바이스 시뮬레이션
 * 
 * 실제 ESP32 없이도 Universal Bridge 테스트 가능!
 */

const http = require('http');

// ========== 설정값 (Connect Wizard에서 받은 값들) ==========
const CONFIG = {
  // WiFi 설정 (실제 환경에 맞게 수정)
  wifi: {
    ssid: "YOUR_WIFI_SSID",
    password: "YOUR_WIFI_PASSWORD"
  },
  
  // Universal Bridge 설정
  bridge: {
    url: "http://localhost:3001",  // Universal Bridge 서버
    deviceId: "esp32-sim-001",     // 시뮬레이션 디바이스 ID
    deviceKey: "DK_simulation_key" // 시뮬레이션 디바이스 키
  },
  
  // 센서 설정 (시뮬레이션 데이터)
  sensors: {
    temp: { min: 20, max: 30, current: 25.5 },
    hum: { min: 40, max: 80, current: 60.2 }
  },
  
  // 전송 주기
  sendInterval: 10000  // 10초마다 전송
};

// ========== 시뮬레이션 함수들 ==========

/**
 * WiFi 연결 시뮬레이션
 */
function simulateWiFiConnection() {
  console.log(`📶 WiFi 연결 시도: ${CONFIG.wifi.ssid}`);
  
  // WiFi 연결 시뮬레이션 (2초 대기)
  setTimeout(() => {
    console.log(`✅ WiFi 연결 성공!`);
    console.log(`📡 IP 주소: 192.168.1.100`);
    
    // WiFi 연결 후 디바이스 등록 시작
    startDeviceRegistration();
  }, 2000);
}

/**
 * 디바이스 등록 시뮬레이션
 */
function startDeviceRegistration() {
  console.log(`🔧 디바이스 등록 시작...`);
  
  // Setup Token으로 디바이스 바인딩 시뮬레이션
  setTimeout(() => {
    console.log(`✅ 디바이스 등록 완료!`);
    console.log(`🆔 디바이스 ID: ${CONFIG.bridge.deviceId}`);
    console.log(`🔑 디바이스 키: ${CONFIG.bridge.deviceKey}`);
    
    // 등록 완료 후 센서 데이터 전송 시작
    startSensorDataTransmission();
  }, 1500);
}

/**
 * 센서 데이터 전송 시뮬레이션
 */
function startSensorDataTransmission() {
  console.log(`📊 센서 데이터 전송 시작...`);
  console.log(`⏰ 전송 주기: ${CONFIG.sendInterval/1000}초`);
  
  // 즉시 첫 번째 데이터 전송
  sendSensorData();
  
  // 주기적으로 데이터 전송
  setInterval(sendSensorData, CONFIG.sendInterval);
}

/**
 * 센서 데이터 전송
 */
function sendSensorData() {
  // 센서 데이터 시뮬레이션 (약간의 변동 추가)
  const temp = CONFIG.sensors.temp.current + (Math.random() - 0.5) * 2;
  const hum = CONFIG.sensors.hum.current + (Math.random() - 0.5) * 5;
  
  const sensorData = {
    temp: Math.round(temp * 10) / 10,
    hum: Math.round(hum * 10) / 10,
    timestamp: new Date().toISOString()
  };
  
  console.log(`📤 센서 데이터 전송:`, sensorData);
  
  // Universal Bridge에 데이터 전송
  sendToBridge(sensorData);
}

/**
 * Universal Bridge에 데이터 전송
 */
function sendToBridge(data) {
  const postData = JSON.stringify(data);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/bridge/telemetry',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-device-id': CONFIG.bridge.deviceId,
      'x-tenant-id': '00000000-0000-0000-0000-000000000001',
      'x-ts': Math.floor(Date.now() / 1000).toString(),
      'x-sig': 'simulation_signature'  // 실제로는 HMAC 서명
    }
  };
  
  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`✅ 데이터 전송 성공: ${res.statusCode}`);
      } else {
        console.log(`❌ 데이터 전송 실패: ${res.statusCode}`);
        console.log(`📄 응답: ${responseData}`);
      }
    });
  });
  
  req.on('error', (err) => {
    console.log(`❌ 연결 오류: ${err.message}`);
  });
  
  req.write(postData);
  req.end();
}

// ========== 시뮬레이션 시작 ==========

console.log('🌉 ESP32 디바이스 시뮬레이션 시작');
console.log('=====================================');
console.log(`📱 디바이스 ID: ${CONFIG.bridge.deviceId}`);
console.log(`🌐 Bridge URL: ${CONFIG.bridge.url}`);
console.log(`⏰ 전송 주기: ${CONFIG.sendInterval/1000}초`);
console.log('=====================================');

// WiFi 연결 시뮬레이션 시작
simulateWiFiConnection();

// 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 시뮬레이션 종료');
  process.exit(0);
});
