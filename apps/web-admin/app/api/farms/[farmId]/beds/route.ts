import { NextRequest } from 'next/server';
import { supaAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params;
    const supa = supaAdmin();

    // 농장의 모든 베드(디바이스) 조회
    const { data: beds, error } = await supa
      .from('devices')
      .select('id, name, meta')
      .eq('farm_id', farmId)
      .eq('type', 'sensor_gateway');

    if (error) {
      console.error('베드 조회 오류:', error);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    // 베드 데이터 정리
    const bedData = (beds || []).map(bed => ({
      id: bed.id,
      name: bed.name || `베드-${bed.id.slice(-4)}`,
      farm_id: farmId,
      display_name: bed.name || `베드-${bed.id.slice(-4)}`
    }));

    return Response.json({
      success: true,
      data: bedData
    });

  } catch (error) {
    console.error('베드 조회 API 오류:', error);
    return Response.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
