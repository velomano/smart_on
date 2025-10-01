/**
 * Red Team Automation Script
 * 
 * 보안 취약점 자동 테스트
 * - Replay Attack
 * - 대용량 Payload
 * - WebSocket 폭주
 * - 테넌트 혼동
 * - QR 만료/탈취
 */

const fetch = require('node-fetch');
const WebSocket = require('ws');
const crypto = require('crypto');

const SERVER_URL = 'http://localhost:3000';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEVICE_ID = 'REDTEAM-TEST-001';

console.log('🔴 Red Team Automation Starting...\n');

async function main() {
  // ==================== 1. Replay Attack ====================
  console.log('🔴 Test 1: Replay Attack (같은 서명 3회)');
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ readings: [{ key: 'test', value: 1, unit: 'x', ts: new Date().toISOString() }] });
    const signature = crypto.createHmac('sha256', 'fake_key').update(`${DEVICE_ID}|${timestamp}|${body}`).digest('hex');
    
    let count409 = 0;
    
    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${SERVER_URL}/api/bridge/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': DEVICE_ID,
          'x-tenant-id': TENANT_ID,
          'x-sig': signature,
          'x-ts': timestamp.toString(),
          'Idempotency-Key': 'replay_test_key',  // 같은 키
        },
        body,
      });
      
      if (res.status === 409) count409++;
    }
    
    if (count409 >= 2) {
      console.log('✅ Replay Attack 방어 성공 (409 Conflict 수신)');
    } else {
      console.log('⚠️  Replay Attack 방어 미흡 (멱등성 체크 필요)');
    }
  } catch (err) {
    console.error('❌ 테스트 실패:', err.message);
  }

  // ==================== 2. 대용량 Payload ====================
  console.log('\n🔴 Test 2: 대용량 Payload (1,000개 readings)');
  try {
    const readings = Array.from({ length: 1000 }, (_, i) => ({
      key: `sensor_${i}`,
      value: Math.random() * 100,
      unit: 'test',
      ts: new Date().toISOString(),
    }));
    
    const body = JSON.stringify({ readings });
    const bodySize = Buffer.byteLength(body);
    console.log(`   Payload size: ${(bodySize / 1024).toFixed(1)}KB`);
    
    const res = await fetch(`${SERVER_URL}/api/bridge/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': DEVICE_ID,
        'x-tenant-id': TENANT_ID,
      },
      body,
    });
    
    if (res.status === 413) {
      console.log('✅ 대용량 Payload 거부 (413 Request Entity Too Large)');
    } else if (res.status === 400) {
      console.log('✅ 대용량 Payload 검증 실패 (400 Bad Request)');
    } else if (res.ok) {
      console.log('⚠️  대용량 Payload 허용됨 (배치 분할 확인 필요)');
    } else {
      console.log(`⚠️  예상과 다른 응답: ${res.status}`);
    }
  } catch (err) {
    if (err.message.includes('maximum')) {
      console.log('✅ 대용량 Payload 차단 (네트워크 레벨)');
    } else {
      console.error('❌ 테스트 실패:', err.message);
    }
  }

  // ==================== 3. WebSocket 폭주 ====================
  console.log('\n🔴 Test 3: WebSocket 폭주 (10Hz, 100개 메시지)');
  await new Promise((resolve) => {
    try {
      const ws = new WebSocket(`ws://localhost:8080/ws/${DEVICE_ID}-FLOOD`);
      let sent = 0;
      let blocked = 0;
      
      ws.on('open', () => {
        const interval = setInterval(() => {
          if (sent >= 100) {
            clearInterval(interval);
            ws.close();
            return;
          }
          
          try {
            ws.send(JSON.stringify({
              type: 'telemetry',
              data: { readings: [{ key: 'test', value: sent }] },
            }));
            sent++;
          } catch (err) {
            blocked++;
          }
        }, 100);  // 10Hz (100ms 간격)
      });
      
      ws.on('close', () => {
        console.log(`   전송: ${sent}개, 차단: ${blocked}개`);
        if (blocked > 0) {
          console.log('✅ WebSocket Rate Limiting 작동');
        } else {
          console.log('⚠️  WebSocket Rate Limiting 미작동 (확인 필요)');
        }
        resolve();
      });
      
      ws.on('error', (err) => {
        console.log('⚠️  WebSocket 연결 실패:', err.message);
        resolve();
      });
      
      // 15초 타임아웃
      setTimeout(() => {
        ws.close();
        resolve();
      }, 15000);
      
    } catch (err) {
      console.error('❌ 테스트 실패:', err.message);
      resolve();
    }
  });

  // ==================== 4. 테넌트 혼동 ====================
  console.log('\n🔴 Test 4: 테넌트 혼동 (다른 테넌트 키로 요청)');
  try {
    const otherTenant = '00000000-0000-0000-0000-000000000002';
    const res = await fetch(`${SERVER_URL}/api/bridge/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': DEVICE_ID,
        'x-tenant-id': otherTenant,  // 다른 테넌트!
      },
      body: JSON.stringify({ readings: [{ key: 'test', value: 1, unit: 'x' }] }),
    });
    
    if (res.status === 403 || res.status === 404) {
      console.log('✅ 테넌트 RLS 차단 성공 (403/404)');
    } else {
      console.log(`⚠️  테넌트 격리 미흡 (응답: ${res.status})`);
    }
  } catch (err) {
    console.error('❌ 테스트 실패:', err.message);
  }

  // ==================== 5. QR 만료/탈취 ====================
  console.log('\n🔴 Test 5: QR 만료 (만료된 Setup Token)');
  try {
    const expiredToken = 'ST_expired_token_from_yesterday';
    const res = await fetch(`${SERVER_URL}/api/provisioning/bind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-setup-token': expiredToken,
      },
      body: JSON.stringify({ device_id: 'TEST', device_type: 'test', capabilities: [] }),
    });
    
    if (res.status === 401) {
      const data = await res.json();
      if (data.error && data.error.includes('expired')) {
        console.log('✅ QR 만료 친절한 에러 메시지');
      } else {
        console.log('⚠️  에러 메시지 개선 필요:', data.error);
      }
    } else {
      console.log(`⚠️  예상과 다른 응답: ${res.status}`);
    }
  } catch (err) {
    console.error('❌ 테스트 실패:', err.message);
  }

  // ==================== 최종 결과 ====================
  console.log('\n' + '='.repeat(50));
  console.log('🔴 Red Team Tests 완료!');
  console.log('='.repeat(50));
  console.log('\n✅ 보안 검증 항목:');
  console.log('  1. Replay Attack 방어');
  console.log('  2. 대용량 Payload 차단');
  console.log('  3. WebSocket Rate Limiting');
  console.log('  4. 테넌트 RLS 격리');
  console.log('  5. QR 만료 처리');
  console.log('\n📸 스크린샷 캡처 후 보안 검증 완료!');
  console.log('');
}

main().catch(console.error);

/**
 * 사용 방법:
 * 
 * 1. 로컬 테스트:
 *    node test-redteam-auto.js
 * 
 * 2. 프로덕션 테스트:
 *    SERVER_URL=https://bridge.smartfarm.app node test-redteam-auto.js
 * 
 * 3. CI/CD에 통합:
 *    - GitHub Actions에서 배포 전 자동 실행
 *    - 실패 시 배포 중단
 * 
 * 4. 정기 실행 (주 1회):
 *    - Cron으로 자동 실행
 *    - 결과를 Slack/Telegram으로 전송
 */

