/**
 * 수동 디바이스 등록 테스트
 * 
 * Connect Wizard 없이 직접 디바이스 등록
 */

const http = require('http');

// ========== 설정값 ==========
const CONFIG = {
  bridge: {
    url: "http://localhost:3001",
    tenantId: "00000000-0000-0000-0000-000000000001",
    farmId: "1737f01f-da95-4438-bc90-4705cdfc09e8"
  },
  device: {
    id: "esp32-sim-001",
    name: "ESP32 시뮬레이션",
    profileId: "esp32-dht22-v1"
  }
};

// ========== HTTP 요청 헬퍼 ==========
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// ========== 1단계: Setup Token 발급 ==========
async function generateSetupToken() {
  console.log('🔑 Setup Token 발급 중...');
  
  const postData = JSON.stringify({
    tenant_id: CONFIG.bridge.tenantId,
    farm_id: CONFIG.bridge.farmId,
    ttl_seconds: 600
  });
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/provisioning/claim',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  try {
    const result = await makeRequest(options, postData);
    console.log(`✅ Setup Token 발급: ${result.status}`);
    console.log(`📄 응답:`, result.data);
    
    if (result.status === 200 && result.data.setup_token) {
      return result.data.setup_token;
    } else {
      throw new Error(`Setup Token 발급 실패: ${result.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Setup Token 발급 오류: ${error.message}`);
    throw error;
  }
}

// ========== 2단계: 디바이스 바인딩 ==========
async function bindDevice(setupToken) {
  console.log('🔗 디바이스 바인딩 중...');
  
  const postData = JSON.stringify({
    device_id: CONFIG.device.id,
    device_type: CONFIG.device.profileId,
    capabilities: ['temp', 'hum']  // DHT22 센서 capabilities
  });
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/provisioning/bind',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-setup-token': setupToken  // 헤더에 setup token 추가
    }
  };
  
  try {
    const result = await makeRequest(options, postData);
    console.log(`✅ 디바이스 바인딩: ${result.status}`);
    console.log(`📄 응답:`, result.data);
    
    if (result.status === 200 && result.data.device_key) {
      return result.data.device_key;
    } else {
      throw new Error(`디바이스 바인딩 실패: ${result.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ 디바이스 바인딩 오류: ${error.message}`);
    throw error;
  }
}

// ========== 3단계: 센서 데이터 전송 테스트 ==========
async function testSensorData(deviceKey) {
  console.log('📊 센서 데이터 전송 테스트...');
  
  const sensorData = {
    temp: 25.5,
    hum: 60.2,
    timestamp: new Date().toISOString()
  };
  
  const postData = JSON.stringify(sensorData);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/bridge/telemetry',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-device-id': CONFIG.device.id,
      'x-tenant-id': CONFIG.bridge.tenantId,
      'x-ts': Math.floor(Date.now() / 1000).toString(),
      'x-sig': 'simulation_signature'  // 실제로는 HMAC 서명
    }
  };
  
  try {
    const result = await makeRequest(options, postData);
    console.log(`✅ 센서 데이터 전송: ${result.status}`);
    console.log(`📄 응답:`, result.data);
    
    if (result.status === 200) {
      console.log('🎉 모든 테스트 성공!');
    } else {
      console.log(`❌ 센서 데이터 전송 실패: ${result.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ 센서 데이터 전송 오류: ${error.message}`);
  }
}

// ========== 메인 실행 ==========
async function main() {
  console.log('🌉 Universal Bridge 수동 등록 테스트');
  console.log('=====================================');
  console.log(`📱 디바이스 ID: ${CONFIG.device.id}`);
  console.log(`🌐 Bridge URL: ${CONFIG.bridge.url}`);
  console.log(`🏢 테넌트 ID: ${CONFIG.bridge.tenantId}`);
  console.log(`🚜 농장 ID: ${CONFIG.bridge.farmId}`);
  console.log('=====================================');
  
  try {
    // 1단계: Setup Token 발급
    const setupToken = await generateSetupToken();
    console.log(`🔑 Setup Token: ${setupToken}`);
    
    // 2단계: 디바이스 바인딩
    const deviceKey = await bindDevice(setupToken);
    console.log(`🔑 Device Key: ${deviceKey}`);
    
    // 3단계: 센서 데이터 전송 테스트
    await testSensorData(deviceKey);
    
  } catch (error) {
    console.log(`❌ 테스트 실패: ${error.message}`);
  }
}

// 실행
main();
