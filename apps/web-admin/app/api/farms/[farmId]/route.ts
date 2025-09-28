import { supaAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params;
    const supa = supaAdmin();
    
    // 농장 정보 조회
    const { data: farm, error } = await supa
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .single();

    if (error) {
      console.error('Farm fetch error:', error);
      return Response.json(
        { success: false, error: '농장을 찾을 수 없습니다.' }, 
        { status: 404 }
      );
    }

    if (!farm) {
      return Response.json(
        { success: false, error: '농장을 찾을 수 없습니다.' }, 
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: farm });
  } catch (error) {
    console.error('Farm API error:', error);
    
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params;
    const supa = supaAdmin();
    const body = await request.json();
    
    // 농장 정보 업데이트
    const { data: farm, error } = await supa
      .from('farms')
      .update({
        name: body.name,
        description: body.description,
        location: body.location,
        updated_at: new Date().toISOString()
      })
      .eq('id', farmId)
      .select()
      .single();

    if (error) {
      console.error('Farm update error:', error);
      return Response.json(
        { success: false, error: '농장 정보 업데이트에 실패했습니다.' }, 
        { status: 400 }
      );
    }

    return Response.json({ success: true, data: farm });
  } catch (error) {
    console.error('Farm update API error:', error);
    
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
