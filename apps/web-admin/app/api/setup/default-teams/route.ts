import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '../../../../src/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    
    console.log('🔧 기본 팀 생성 시작');
    
    // 기본 팀들 생성
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .upsert([
        {
          id: '00000000-0000-0000-0000-000000000001',
          tenant_id: '00000000-0000-0000-0000-000000000001',
          name: '1조 농장',
          description: '1번 농장 팀',
          team_code: 'FARM001',
          is_active: true
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          tenant_id: '00000000-0000-0000-0000-000000000001',
          name: '2조 농장',
          description: '2번 농장 팀',
          team_code: 'FARM002',
          is_active: true
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          tenant_id: '00000000-0000-0000-0000-000000000001',
          name: '3조 농장',
          description: '3번 농장 팀',
          team_code: 'FARM003',
          is_active: true
        }
      ], { onConflict: 'id' })
      .select();

    if (teamsError) {
      console.error('❌ 팀 생성 오류:', teamsError);
      return NextResponse.json({ 
        success: false, 
        error: `팀 생성 실패: ${teamsError.message}` 
      }, { status: 500 });
    }

    // 기본 농장들 생성
    const { data: farms, error: farmsError } = await supabase
      .from('farms')
      .upsert([
        {
          id: '00000000-0000-0000-0000-000000000001',
          tenant_id: '00000000-0000-0000-0000-000000000001',
          name: '1조 농장',
          location: '서울시 강남구'
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          tenant_id: '00000000-0000-0000-0000-000000000001',
          name: '2조 농장',
          location: '서울시 서초구'
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          tenant_id: '00000000-0000-0000-0000-000000000001',
          name: '3조 농장',
          location: '서울시 송파구'
        }
      ], { onConflict: 'id' })
      .select();

    if (farmsError) {
      console.error('❌ 농장 생성 오류:', farmsError);
      return NextResponse.json({ 
        success: false, 
        error: `농장 생성 실패: ${farmsError.message}` 
      }, { status: 500 });
    }

    console.log('✅ 기본 팀 및 농장 생성 완료:', {
      teams: teams?.length || 0,
      farms: farms?.length || 0
    });

    return NextResponse.json({ 
      success: true, 
      message: '기본 팀 및 농장이 성공적으로 생성되었습니다.',
      data: {
        teams: teams || [],
        farms: farms || []
      }
    });

  } catch (error: any) {
    console.error('❌ 기본 팀 생성 중 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: `기본 팀 생성 중 오류가 발생했습니다: ${error.message}` 
    }, { status: 500 });
  }
}
