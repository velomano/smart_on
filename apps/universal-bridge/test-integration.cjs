/**
 * Universal Bridge 통합 테스트
 * 
 * JWT 토큰 서버 + MQTT 브로커 통합 테스트
 */

const axios = require('axios');
const mqtt = require('mqtt');

const BASE_URL = 'http://localhost:3001';
const MQTT_BROKER_URL = 'mqtt://localhost:1884';

// 테스트 데이터
const testDevice = {
  deviceId: 'test-device-001',
  tenantId: 'test-tenant-001',
  farmId: 'test-farm-001',
  deviceType: 'sensor',
  capabilities: ['telemetry', 'status', 'commands']
};

let deviceToken = null;
let mqttClient = null;

console.log('🧪 Universal Bridge 통합 테스트 시작');
console.log('='.repeat(50));

/**
 * HTTP API 테스트
 */
async function testHTTPAPIs() {
  console.log('\n📡 HTTP API 테스트 시작...');
  
  try {
    // 1. 헬스 체크
    console.log('1️⃣ 헬스 체크 테스트');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 헬스 체크 성공:', healthResponse.data);
    
    // 2. 디바이스 토큰 발급
    console.log('\n2️⃣ 디바이스 토큰 발급 테스트');
    const tokenResponse = await axios.post(`${BASE_URL}/api/auth/token`, testDevice);
    deviceToken = tokenResponse.data.token;
    console.log('✅ 토큰 발급 성공:', {
      deviceId: tokenResponse.data.deviceId,
      tenantId: tokenResponse.data.tenantId,
      expiresIn: tokenResponse.data.expiresIn
    });
    
    // 3. 토큰 검증
    console.log('\n3️⃣ 토큰 검증 테스트');
    const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${deviceToken}` }
    });
    console.log('✅ 토큰 검증 성공:', verifyResponse.data);
    
    // 4. 인증 상태 확인
    console.log('\n4️⃣ 인증 상태 확인 테스트');
    const statusResponse = await axios.get(`${BASE_URL}/api/auth/status`, {
      headers: { Authorization: `Bearer ${deviceToken}` }
    });
    console.log('✅ 인증 상태 확인 성공:', statusResponse.data);
    
    // 5. MQTT 브로커 상태 확인
    console.log('\n5️⃣ MQTT 브로커 상태 확인 테스트');
    const brokerStatusResponse = await axios.get(`${BASE_URL}/api/mqtt/status`);
    console.log('✅ MQTT 브로커 상태:', brokerStatusResponse.data);
    
    return true;
  } catch (error) {
    console.error('❌ HTTP API 테스트 실패:', error.response?.data || error.message);
    return false;
  }
}

/**
 * MQTT 브로커 테스트
 */
async function testMQTTBroker() {
  console.log('\n📡 MQTT 브로커 테스트 시작...');
  
  return new Promise((resolve) => {
    try {
      // MQTT 클라이언트 연결 (JWT 토큰을 비밀번호로 사용)
      mqttClient = mqtt.connect(MQTT_BROKER_URL, {
        clientId: testDevice.deviceId,
        username: testDevice.deviceId,
        password: deviceToken,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        keepalive: 60
      });

      mqttClient.on('connect', () => {
        console.log('✅ MQTT 브로커 연결 성공');
        
        // 허용된 토픽 구독
        const allowedTopic = `tenants/${testDevice.tenantId}/devices/${testDevice.deviceId}/commands`;
        mqttClient.subscribe(allowedTopic, (err) => {
          if (err) {
            console.error('❌ 토픽 구독 실패:', err.message);
            resolve(false);
          } else {
            console.log(`✅ 토픽 구독 성공: ${allowedTopic}`);
          }
        });
        
        // 허용된 토픽에 메시지 발행
        const telemetryTopic = `tenants/${testDevice.tenantId}/devices/${testDevice.deviceId}/telemetry`;
        const telemetryData = {
          deviceId: testDevice.deviceId,
          timestamp: new Date().toISOString(),
          sensorData: {
            temperature: 25.5,
            humidity: 60.2,
            light: 800
          }
        };
        
        mqttClient.publish(telemetryTopic, JSON.stringify(telemetryData), (err) => {
          if (err) {
            console.error('❌ 메시지 발행 실패:', err.message);
            resolve(false);
          } else {
            console.log(`✅ 메시지 발행 성공: ${telemetryTopic}`);
            console.log('📊 발행된 데이터:', telemetryData);
          }
        });
        
        // 5초 후 연결 해제
        setTimeout(() => {
          mqttClient.end();
          console.log('✅ MQTT 클라이언트 연결 해제');
          resolve(true);
        }, 5000);
      });

      mqttClient.on('error', (error) => {
        console.error('❌ MQTT 연결 에러:', error.message);
        resolve(false);
      });

      mqttClient.on('message', (topic, message) => {
        console.log(`📨 수신된 메시지 - 토픽: ${topic}`);
        console.log('📄 메시지 내용:', JSON.parse(message.toString()));
      });

    } catch (error) {
      console.error('❌ MQTT 테스트 실패:', error.message);
      resolve(false);
    }
  });
}

/**
 * ACL (Access Control List) 테스트
 */
async function testACL() {
  console.log('\n🔒 ACL 테스트 시작...');
  
  return new Promise((resolve) => {
    try {
      // 다른 테넌트 토픽에 접근 시도 (실패해야 함)
      const forbiddenTopic = `tenants/other-tenant/devices/${testDevice.deviceId}/telemetry`;
      
      mqttClient = mqtt.connect(MQTT_BROKER_URL, {
        clientId: testDevice.deviceId,
        username: testDevice.deviceId,
        password: deviceToken,
        clean: true
      });

      mqttClient.on('connect', () => {
        console.log('✅ ACL 테스트용 MQTT 연결 성공');
        
        // 금지된 토픽에 메시지 발행 시도
        mqttClient.publish(forbiddenTopic, 'test message', (err) => {
          if (err) {
            console.log('✅ ACL 차단 성공 (예상된 결과):', err.message);
            mqttClient.end();
            resolve(true);
          } else {
            console.error('❌ ACL 차단 실패 - 금지된 토픽에 발행 성공');
            mqttClient.end();
            resolve(false);
          }
        });
      });

      mqttClient.on('error', (error) => {
        console.error('❌ ACL 테스트 연결 에러:', error.message);
        resolve(false);
      });

    } catch (error) {
      console.error('❌ ACL 테스트 실패:', error.message);
      resolve(false);
    }
  });
}

/**
 * 통합 테스트 실행
 */
async function runIntegrationTest() {
  console.log('🚀 Universal Bridge 통합 테스트 시작');
  console.log('테스트 대상:', {
    HTTP: BASE_URL,
    MQTT: MQTT_BROKER_URL,
    Device: testDevice.deviceId,
    Tenant: testDevice.tenantId
  });

  const results = {
    httpAPIs: false,
    mqttBroker: false,
    acl: false
  };

  try {
    // HTTP API 테스트
    results.httpAPIs = await testHTTPAPIs();
    
    if (results.httpAPIs) {
      // MQTT 브로커 테스트
      results.mqttBroker = await testMQTTBroker();
      
      if (results.mqttBroker) {
        // ACL 테스트
        results.acl = await testACL();
      }
    }

    // 결과 출력
    console.log('\n' + '='.repeat(50));
    console.log('🎯 통합 테스트 결과');
    console.log('='.repeat(50));
    console.log('📡 HTTP APIs:', results.httpAPIs ? '✅ 통과' : '❌ 실패');
    console.log('📡 MQTT Broker:', results.mqttBroker ? '✅ 통과' : '❌ 실패');
    console.log('🔒 ACL:', results.acl ? '✅ 통과' : '❌ 실패');
    
    const allPassed = results.httpAPIs && results.mqttBroker && results.acl;
    console.log('\n🏆 전체 결과:', allPassed ? '✅ 모든 테스트 통과!' : '❌ 일부 테스트 실패');
    
    if (allPassed) {
      console.log('\n🎉 Universal Bridge JWT 토큰 서버 + MQTT 브로커 통합 성공!');
    } else {
      console.log('\n⚠️ 일부 테스트가 실패했습니다. 로그를 확인해주세요.');
    }

  } catch (error) {
    console.error('💥 통합 테스트 실행 중 오류:', error.message);
  } finally {
    // 정리
    if (mqttClient) {
      mqttClient.end();
    }
    console.log('\n🧹 테스트 정리 완료');
  }
}

// 테스트 실행
if (require.main === module) {
  runIntegrationTest().catch(console.error);
}

module.exports = { runIntegrationTest, testHTTPAPIs, testMQTTBroker, testACL };
