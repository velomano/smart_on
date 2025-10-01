/**
 * HTTP 방식 제어 명령 테스트
 */

const http = require('http');

// HTTP 명령 조회 테스트
function testHttpCommands() {
  console.log('🔌 HTTP 방식 제어 명령 테스트');
  console.log('=====================================');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/bridge/commands/esp32-001',
    method: 'GET',
    headers: {
      'x-device-id': 'esp32-001',
      'x-tenant-id': '00000000-0000-0000-0000-000000000001'
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ HTTP 명령 조회 성공:');
        console.log('📄 응답:', JSON.stringify(result, null, 2));
        
        if (result.commands && result.commands.length > 0) {
          console.log('🎯 대기 중인 명령:');
          result.commands.forEach(cmd => {
            console.log(`   - ${cmd.type}: ${cmd.action}`);
            console.log(`     파라미터: ${JSON.stringify(cmd.params)}`);
          });
        } else {
          console.log('📭 대기 중인 명령 없음');
        }
      } catch (error) {
        console.log('❌ 응답 파싱 오류:', error.message);
        console.log('📄 원본 응답:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ HTTP 요청 오류:', error.message);
  });
  
  req.end();
}

// 테스트 실행
testHttpCommands();
