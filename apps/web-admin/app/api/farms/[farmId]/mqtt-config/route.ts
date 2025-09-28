import { supaAdmin } from '@/lib/supabaseAdmin';
import { encrypt, decrypt } from '@/lib/crypto';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params;
    const supa = supaAdmin();
    
    // MQTT 설정 조회
    const { data: config, error } = await supa
      .from('farm_mqtt_configs')
      .select('*')
      .eq('farm_id', farmId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 설정이 없는 경우
        return Response.json({ success: true, data: null });
      }
      console.error('MQTT config fetch error:', error);
      return Response.json(
        { success: false, error: 'MQTT 설정을 조회할 수 없습니다.' }, 
        { status: 500 }
      );
    }

    // 민감한 정보는 복호화하지 않고 그대로 반환 (보안상 이유)
    // 실제 사용 시에는 필요에 따라 복호화된 값도 제공할 수 있음
    const safeConfig = {
      farm_id: config.farm_id,
      broker_url: config.broker_url,
      port: config.port,
      auth_mode: config.auth_mode,
      username: config.username,
      client_id_prefix: config.client_id_prefix,
      ws_path: config.ws_path,
      qos_default: config.qos_default,
      is_active: config.is_active,
      last_test_at: config.last_test_at,
      last_test_ok: config.last_test_ok,
      created_at: config.created_at,
      updated_at: config.updated_at
      // secret_enc는 보안상 제외
    };

    return Response.json({ success: true, data: safeConfig });
  } catch (error) {
    console.error('MQTT config API error:', error);
    
    // 환경변수 에러인 경우 구체적인 메시지 제공
    if (error instanceof Error && error.message.includes('환경변수가 설정되지 않았습니다')) {
      return Response.json(
        { success: false, error: '데이터베이스 연결 설정이 필요합니다.' }, 
        { status: 503 }
      );
    }
    
    return Response.json(
      { success: false, error: '서버 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ farmId: string }>}) {
  try {
    const { farmId } = await params;
    const b = await req.json();
    const supa = supaAdmin();
    const secret_enc = b.auth_mode === 'api_key' ? encrypt(b.api_key) :
                       b.auth_mode === 'user_pass' ? encrypt(b.password) : null;

    const { error } = await supa.from('farm_mqtt_configs').upsert({
      farm_id: farmId,
      broker_url: b.broker_url,
      port: b.port ?? 8883,
      auth_mode: b.auth_mode,
      username: b.username ?? null,
      secret_enc,
      client_id_prefix: b.client_id_prefix ?? 'terahub-bridge',
      ws_path: b.ws_path ?? null,
      qos_default: b.qos_default ?? 1,
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    if (error) return Response.json({ success:false, error }, { status: 400 });
    return Response.json({ success:true });
  } catch (error) {
    console.error('MQTT config PUT API error:', error);
    
    // 환경변수 에러인 경우 구체적인 메시지 제공
    if (error instanceof Error && error.message.includes('환경변수가 설정되지 않았습니다')) {
      return Response.json(
        { success: false, error: '데이터베이스 연결 설정이 필요합니다.' }, 
        { status: 503 }
      );
    }
    
    return Response.json(
      { success: false, error: '서버 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
}
