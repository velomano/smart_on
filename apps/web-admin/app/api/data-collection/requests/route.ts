import { NextRequest, NextResponse } from 'next/server';
import { createSbServer } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { crop, stage, user_id, user_email, notes } = body;

    if (!crop) {
      return NextResponse.json({ 
        ok: false, 
        error: '작물명이 필요합니다.' 
      }, { status: 400 });
    }

    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 연결이 필요합니다.' 
      }, { status: 500 });
    }

    // 데이터 수집 요청 테이블에 저장
    const { data, error } = await sb
      .from('data_collection_requests')
      .insert([{
        crop_name: crop,
        stage: stage || null,
        user_id: user_id || null,
        user_email: user_email || null,
        notes: notes || null,
        status: 'pending',
        priority: 'normal',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('데이터 수집 요청 저장 에러:', error);
      return NextResponse.json({ 
        ok: false, 
        error: '데이터 수집 요청 저장에 실패했습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: '데이터 수집 요청이 등록되었습니다.',
      request_id: data[0]?.id
    });

  } catch (error) {
    console.error('데이터 수집 요청 API 에러:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');

    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 연결이 필요합니다.' 
      }, { status: 500 });
    }

    const { data: requests, error } = await sb
      .from('data_collection_requests')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('데이터 수집 요청 조회 에러:', error);
      return NextResponse.json({ 
        ok: false, 
        error: '데이터 수집 요청 조회에 실패했습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      requests: requests || []
    });

  } catch (error) {
    console.error('데이터 수집 요청 조회 API 에러:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
