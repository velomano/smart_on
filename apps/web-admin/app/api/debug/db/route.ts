import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../../src/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'farms';
    
    console.log('🔍 디버깅 API - 테이블 조회:', table);
    
    let result;
    switch (table) {
      case 'farms':
        result = await supabase.from('farms').select('*').order('created_at');
        break;
      case 'users':
        result = await supabase.from('users').select('*').order('created_at');
        break;
      case 'teams':
        result = await supabase.from('teams').select('*').order('created_at');
        break;
      case 'memberships':
        result = await supabase.from('memberships').select('*').order('created_at');
        break;
      default:
        return NextResponse.json({ error: 'Unknown table' }, { status: 400 });
    }
    
    console.log('🔍 디버깅 API 결과:', {
      table,
      data: result.data,
      error: result.error,
      count: result.data?.length || 0
    });
    
    return NextResponse.json({
      table,
      data: result.data,
      error: result.error,
      count: result.data?.length || 0
    });
  } catch (error) {
    console.error('🔴 디버깅 API 오류:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
