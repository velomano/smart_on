import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: '인증이 필요합니다.' 
      }, { status: 401 });
    }

    const supabase = createClient();
    
    // 권한별 농장 조회
    let farmsQuery = supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (user.role === 'system_admin') {
      // 시스템 관리자: 모든 농장
      // 추가 필터 없음
    } else {
      // 농장장/팀원: 자신의 농장만
      const { data: memberships } = await supabase
        .from('farm_memberships')
        .select('farm_id')
        .eq('user_id', user.id);
      
      if (memberships && memberships.length > 0) {
        const farmIds = memberships.map(m => m.farm_id);
        farmsQuery = farmsQuery.in('id', farmIds);
      } else {
        // 멤버십이 없으면 빈 배열 반환
        return NextResponse.json({ 
          success: true, 
          farms: [] 
        });
      }
    }
    
    const { data: farms, error } = await farmsQuery;
    
    if (error) {
      console.error('농장 조회 오류:', error);
      return NextResponse.json({ 
        success: false, 
        error: '농장 목록을 불러올 수 없습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      farms: farms || [] 
    });
    
  } catch (error) {
    console.error('농장 API 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
