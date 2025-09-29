import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../../src/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'check';
    
    console.log('🔍 농장 멤버십 관리 API - 액션:', action);
    
    if (action === 'check') {
      // 현재 farm_memberships 데이터 확인
      const { data: farmMemberships, error: farmMembershipsError } = await supabase
        .from('farm_memberships')
        .select('*')
        .order('created_at');
      
      // 현재 사용자 데이터 확인
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .order('created_at');
      
      // 현재 농장 데이터 확인
      const { data: farms, error: farmsError } = await supabase
        .from('farms')
        .select('id, name')
        .order('created_at');
      
      return NextResponse.json({
        farmMemberships: farmMemberships || [],
        users: users || [],
        farms: farms || [],
        errors: {
          farmMembershipsError,
          usersError,
          farmsError
        }
      });
    } else if (action === 'create') {
      // 테스트 사용자들을 농장에 배정
      const testUsers = [
        { email: 'test1@test.com', farmName: '1조', role: 'owner' },
        { email: 'test2@test.com', farmName: '1조', role: 'operator' },
        { email: 'test3@test.com', farmName: '2조', role: 'owner' },
        { email: 'test4@test.com', farmName: '2조', role: 'operator' },
        { email: 'test5@test.com', farmName: '3조', role: 'owner' },
        { email: 'test6@test.com', farmName: '3조', role: 'operator' }
      ];
      
      const results = [];
      
      for (const testUser of testUsers) {
        // 사용자 ID 조회
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', testUser.email)
          .single();
        
        if (!userData) {
          results.push({ email: testUser.email, error: '사용자를 찾을 수 없습니다' });
          continue;
        }
        
        // 농장 ID 조회
        const { data: farmData } = await supabase
          .from('farms')
          .select('id')
          .eq('name', testUser.farmName)
          .single();
        
        if (!farmData) {
          results.push({ email: testUser.email, error: `농장 '${testUser.farmName}'을 찾을 수 없습니다` });
          continue;
        }
        
        // farm_memberships에 데이터 삽입
        const { data: membershipData, error: membershipError } = await supabase
          .from('farm_memberships')
          .insert({
            tenant_id: '00000000-0000-0000-0000-000000000001', // 기본 테넌트
            farm_id: farmData.id,
            user_id: userData.id,
            role: testUser.role
          })
          .select();
        
        if (membershipError) {
          results.push({ 
            email: testUser.email, 
            error: membershipError.message,
            details: membershipError
          });
        } else {
          results.push({ 
            email: testUser.email, 
            success: true,
            farmId: farmData.id,
            farmName: testUser.farmName,
            role: testUser.role,
            membershipId: membershipData[0]?.id
          });
        }
      }
      
      return NextResponse.json({
        action: 'create',
        results: results
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('🔴 농장 멤버십 관리 API 오류:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
