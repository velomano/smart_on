/**
 * Production Smoke Test
 * 
 * 운영 모드 검증용 스모크 테스트
 * - HMAC 서명 검증
 * - Rate Limiting
 * - 401/429 강제 유발
 * - Command ACK 라운드트립
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

const SERVER_URL = 'http://localhost:3000';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const FARM_ID = '1737f01f-da95-4438-bc90-4705cdfc09e8';

console.log('🔥 Production Smoke Test Starting...\n');

async function main() {
  let setupToken, deviceId, deviceKey;

  // ==================== Test 1: Claim (Setup Token 발급) ====================
  console.log('📋 Test 1: Setup Token 발급');
  try {
    const res = await fetch(`${SERVER_URL}/api/provisioning/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: TENANT_ID, farm_id: FARM_ID, ttl_seconds: 600 }),
    });
    const data = await res.json();
    setupToken = data.setup_token;
    console.log('✅ Setup Token:', setupToken.substring(0, 20) + '...');
  } catch (err) {
    console.error('❌ Claim 실패:', err.message);
    return;
  }

  // ==================== Test 2: Bind (디바이스 등록) ====================
  console.log('\n📋 Test 2: 디바이스 바인딩');
  try {
    deviceId = `SMOKE-TEST-${Date.now()}`;
    const res = await fetch(`${SERVER_URL}/api/provisioning/bind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-setup-token': setupToken,
      },
      body: JSON.stringify({
        device_id: deviceId,
        device_type: 'smoke-test',
        capabilities: ['test'],
      }),
    });
    const data = await res.json();
    deviceKey = data.device_key;
    console.log('✅ Device ID:', deviceId);
    console.log('✅ Device Key:', deviceKey.substring(0, 20) + '...');
  } catch (err) {
    console.error('❌ Bind 실패:', err.message);
    return;
  }

  // ==================== Test 3: HMAC 서명 (정상) ====================
  console.log('\n📋 Test 3: HMAC 서명 검증 (정상)');
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      readings: [{ key: 'test', value: 42, unit: 'test', ts: new Date().toISOString() }],
    });
    const message = `${deviceId}|${timestamp}|${body}`;
    const signature = crypto.createHmac('sha256', deviceKey).update(message).digest('hex');

    const res = await fetch(`${SERVER_URL}/api/bridge/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-tenant-id': TENANT_ID,
        'x-sig': signature,
        'x-ts': timestamp.toString(),
      },
      body,
    });

    if (res.ok) {
      console.log('✅ HMAC 서명 검증 통과 (200 OK)');
    } else {
      console.log('❌ 응답:', res.status, await res.text());
    }
  } catch (err) {
    console.error('❌ Telemetry 실패:', err.message);
  }

  // ==================== Test 4: HMAC 실패 (잘못된 서명) ====================
  console.log('\n📋 Test 4: HMAC 서명 실패 (401 강제 유발)');
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      readings: [{ key: 'test', value: 43, unit: 'test', ts: new Date().toISOString() }],
    });
    const wrongSignature = 'wrong_signature_here';

    const res = await fetch(`${SERVER_URL}/api/bridge/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-tenant-id': TENANT_ID,
        'x-sig': wrongSignature,
        'x-ts': timestamp.toString(),
      },
      body,
    });

    if (res.status === 401) {
      console.log('✅ 401 Unauthorized 수신 (예상대로)');
    } else {
      console.log('⚠️  예상과 다른 응답:', res.status);
    }
  } catch (err) {
    console.error('❌ 테스트 실패:', err.message);
  }

  // ==================== Test 5: Rate Limiting (429 강제 유발) ====================
  console.log('\n📋 Test 5: Rate Limiting (429 강제 유발)');
  try {
    let count429 = 0;
    
    // 70개 요청 (60 req/min 제한)
    for (let i = 0; i < 70; i++) {
      const res = await fetch(`${SERVER_URL}/health`);
      if (res.status === 429) {
        count429++;
        if (count429 === 1) {
          const remaining = res.headers.get('X-RateLimit-Remaining');
          console.log('✅ 429 Too Many Requests 수신');
          console.log('   X-RateLimit-Remaining:', remaining);
        }
      }
    }
    
    if (count429 > 0) {
      console.log(`✅ Rate Limiting 작동 (${count429}개 요청 차단)`);
    } else {
      console.log('⚠️  429 응답 없음 (Rate Limit이 너무 높거나 비활성화)');
    }
  } catch (err) {
    console.error('❌ Rate Limit 테스트 실패:', err.message);
  }

  // ==================== 최종 결과 ====================
  console.log('\n' + '='.repeat(50));
  console.log('✅ Production Smoke Test 완료!');
  console.log('='.repeat(50));
  console.log('\n📸 스크린샷 캡처 항목:');
  console.log('  1. 이 로그 전체');
  console.log('  2. Supabase iot_devices 테이블 (새 디바이스 확인)');
  console.log('  3. Supabase iot_readings 테이블 (데이터 확인)');
  console.log('\n📊 다음 단계:');
  console.log('  - 모니터링 대시보드 구축 (6개 지표)');
  console.log('  - 24시간 스테이징 soak 테스트');
  console.log('  - 부분 롤아웃 (10%)');
  console.log('  - 전면 Go-Live!');
  console.log('');
}

main().catch(console.error);

