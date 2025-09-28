import { supaAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const supa = supaAdmin();
    
    // 브리지 상태 확인 (farm_mqtt_configs의 last_test_ok 기준)
    const { data: configs, error } = await supa
      .from('farm_mqtt_configs')
      .select('farm_id, last_test_at, last_test_ok, is_active')
      .eq('is_active', true);

    if (error) {
      console.error('Supabase error:', error);
      // 에러가 있어도 기본 상태 반환
      const health = {
        total_farms: 0,
        active_farms: 0,
        healthy_farms: 0,
        last_updated: new Date().toISOString()
      };
      return Response.json({ success: true, data: health });
    }

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const health = {
      total_farms: configs?.length || 0,
      active_farms: configs?.filter(c => c.is_active).length || 0,
      healthy_farms: configs?.filter(c => 
        c.is_active && 
        c.last_test_ok && 
        c.last_test_at && 
        new Date(c.last_test_at) > fiveMinutesAgo
      ).length || 0,
      last_updated: now.toISOString()
    };

    return Response.json({ success: true, data: health });
  } catch (error) {
    console.error('Bridge health API error:', error);
    
    // 에러 발생 시 기본 상태 반환
    const health = {
      total_farms: 0,
      active_farms: 0,
      healthy_farms: 0,
      last_updated: new Date().toISOString()
    };
    
    return Response.json({ success: true, data: health });
  }
}
