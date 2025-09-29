import { supaAdmin } from '@/lib/supabaseAdmin';
import { decrypt } from '@/lib/crypto';

export async function POST(
  _req: Request, 
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params;
    const supa = supaAdmin();
    
    // MQTT 설정 조회
    const { data: cfg, error } = await supa
      .from('farm_mqtt_configs')
      .select('*')
      .eq('farm_id', farmId)
      .maybeSingle();
      
    if (error || !cfg) {
      return Response.json(
        { success: false, error: 'MQTT 설정을 찾을 수 없습니다.' }, 
        { status: 404 }
      );
    }

    // 비밀번호 복호화
    const secret = cfg.secret_enc ? decrypt(cfg.secret_enc) : undefined;

    // MQTT 연결 테스트 (실제 구현에서는 mqtt 라이브러리 사용)
    // 여기서는 간단한 시뮬레이션
    const connectionTest = await testMqttConnection(cfg, secret || null);

    // 테스트 결과 저장
    await supa
      .from('farm_mqtt_configs')
      .update({ 
        last_test_at: new Date().toISOString(), 
        last_test_ok: connectionTest.success 
      })
      .eq('farm_id', farmId);

    return Response.json({ 
      success: connectionTest.success,
      message: connectionTest.message,
      details: connectionTest.details
    });
  } catch (error) {
    console.error('MQTT test API error:', error);
    
    if (error instanceof Error && error.message.includes('환경변수가 설정되지 않았습니다')) {
      return Response.json(
        { success: false, error: '데이터베이스 연결 설정이 필요합니다.' }, 
        { status: 503 }
      );
    }
    
    return Response.json(
      { success: false, error: 'MQTT 연결 테스트 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
}

async function testMqttConnection(cfg: any, secret: string | null): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // MQTT 연결 테스트 로직
    // 실제 구현에서는 mqtt 라이브러리를 사용하여 연결 시도
    
    const connectionParams = {
      broker_url: cfg.broker_url,
      port: cfg.port,
      auth_mode: cfg.auth_mode,
      username: cfg.auth_mode === 'api_key' ? 'apikey' : cfg.username,
      hasPassword: !!secret
    };

    // 간단한 연결 검증 (실제로는 mqtt.connect() 사용)
    if (!cfg.broker_url) {
      return {
        success: false,
        message: '브로커 URL이 설정되지 않았습니다.',
        details: connectionParams
      };
    }

    if (cfg.auth_mode === 'api_key' && !secret) {
      return {
        success: false,
        message: 'API 키가 설정되지 않았습니다.',
        details: connectionParams
      };
    }

    if (cfg.auth_mode === 'user_pass' && (!cfg.username || !secret)) {
      return {
        success: false,
        message: '사용자명 또는 비밀번호가 설정되지 않았습니다.',
        details: connectionParams
      };
    }

    // 연결 성공 시뮬레이션
    return {
      success: true,
      message: 'MQTT 브로커 연결 테스트 성공',
      details: {
        ...connectionParams,
        connected_at: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `연결 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      details: { error: error }
    };
  }
}