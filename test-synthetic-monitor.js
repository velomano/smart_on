/**
 * Synthetic Monitoring Script
 * 
 * 5분마다 실행하여 서비스 가용성 확인
 * - Health Check (HTTP)
 * - WebSocket Ping/Pong
 * - 외부 2개 리전에서 실행 권장
 */

const fetch = require('node-fetch');
const WebSocket = require('ws');

const SERVER_URL = process.env.SERVER_URL || 'https://bridge.smartfarm.app';
const WS_URL = process.env.WS_URL || 'wss://bridge.smartfarm.app:8080';
const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK;  // Telegram/Slack

const results = {
  timestamp: new Date().toISOString(),
  region: process.env.REGION || 'local',
  tests: [],
};

async function runSyntheticTests() {
  console.log('🔍 Synthetic Monitoring Starting...');
  console.log(`📍 Region: ${results.region}`);
  console.log(`🌐 Server: ${SERVER_URL}\n`);

  // Test 1: Health Check
  await testHealthCheck();
  
  // Test 2: WebSocket Ping/Pong
  await testWebSocketPingPong();
  
  // Test 3: API Latency
  await testApiLatency();

  // 결과 출력
  printResults();
  
  // 알람 전송 (실패 시)
  const failures = results.tests.filter(t => !t.passed);
  if (failures.length > 0 && ALERT_WEBHOOK) {
    await sendAlert(failures);
  }
}

async function testHealthCheck() {
  const test = { name: 'Health Check', passed: false, latency: 0, error: null };
  
  try {
    const start = Date.now();
    const res = await fetch(`${SERVER_URL}/health`, { timeout: 5000 });
    test.latency = Date.now() - start;
    
    if (res.ok) {
      const data = await res.json();
      test.passed = data.status === 'healthy';
      console.log(`✅ Health Check: ${test.latency}ms`);
    } else {
      test.error = `HTTP ${res.status}`;
      console.log(`❌ Health Check: ${test.error}`);
    }
  } catch (err) {
    test.error = err.message;
    console.log(`❌ Health Check: ${test.error}`);
  }
  
  results.tests.push(test);
}

async function testWebSocketPingPong() {
  const test = { name: 'WebSocket Ping/Pong', passed: false, latency: 0, error: null };
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(`${WS_URL}/monitor/test`);
      const start = Date.now();
      
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      });
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'pong') {
          test.latency = Date.now() - start;
          test.passed = test.latency < 2000;  // 2초 이내
          
          if (test.passed) {
            console.log(`✅ WebSocket Ping/Pong: ${test.latency}ms`);
          } else {
            console.log(`⚠️  WebSocket Ping/Pong: ${test.latency}ms (느림)`);
          }
          
          ws.close();
        }
      });
      
      ws.on('error', (err) => {
        test.error = err.message;
        console.log(`❌ WebSocket: ${test.error}`);
        results.tests.push(test);
        resolve();
      });
      
      ws.on('close', () => {
        results.tests.push(test);
        resolve();
      });
      
      // 5초 타임아웃
      setTimeout(() => {
        if (!test.passed && !test.error) {
          test.error = 'Timeout (>5s)';
          console.log(`❌ WebSocket: ${test.error}`);
          ws.close();
        }
      }, 5000);
      
    } catch (err) {
      test.error = err.message;
      console.log(`❌ WebSocket: ${test.error}`);
      results.tests.push(test);
      resolve();
    }
  });
}

async function testApiLatency() {
  const test = { name: 'API Latency (p95 목표: 500ms)', passed: false, latency: 0, error: null };
  
  try {
    const latencies = [];
    
    // 10회 요청하여 p95 측정
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await fetch(`${SERVER_URL}/health`);
      latencies.push(Date.now() - start);
    }
    
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    
    test.latency = p95;
    test.passed = p95 < 500;
    
    if (test.passed) {
      console.log(`✅ API Latency p95: ${p95}ms`);
    } else {
      console.log(`⚠️  API Latency p95: ${p95}ms (목표 500ms 초과)`);
    }
  } catch (err) {
    test.error = err.message;
    console.log(`❌ API Latency: ${test.error}`);
  }
  
  results.tests.push(test);
}

function printResults() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 Synthetic Monitoring Results');
  console.log('='.repeat(50));
  console.log(`Region: ${results.region}`);
  console.log(`Timestamp: ${results.timestamp}`);
  console.log('');
  
  const passed = results.tests.filter(t => t.passed).length;
  const total = results.tests.length;
  
  console.log(`Tests: ${passed}/${total} passed`);
  console.log('');
  
  results.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.latency}ms${test.error ? ` (${test.error})` : ''}`);
  });
  
  console.log('');
}

async function sendAlert(failures) {
  const message = `🚨 Synthetic Monitoring Alert\n\nRegion: ${results.region}\n\nFailures:\n${failures.map(f => `• ${f.name}: ${f.error || 'Failed'}`).join('\n')}`;
  
  try {
    await fetch(ALERT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
    console.log('📨 Alert sent to webhook');
  } catch (err) {
    console.error('❌ Failed to send alert:', err.message);
  }
}

// 실행
runSyntheticTests().catch(console.error);

/**
 * 사용 방법:
 * 
 * 1. 로컬 테스트:
 *    node test-synthetic-monitor.js
 * 
 * 2. 외부 리전 1 (서울):
 *    REGION=seoul SERVER_URL=https://bridge.smartfarm.app node test-synthetic-monitor.js
 * 
 * 3. 외부 리전 2 (미국):
 *    REGION=us-west SERVER_URL=https://bridge.smartfarm.app node test-synthetic-monitor.js
 * 
 * 4. Cron 설정 (5분마다):
 *    */5 * * * * cd /path/to/project && node test-synthetic-monitor.js >> /var/log/synthetic.log 2>&1
 * 
 * 5. Telegram 알람:
 *    ALERT_WEBHOOK=https://api.telegram.org/bot.../sendMessage node test-synthetic-monitor.js
 */

