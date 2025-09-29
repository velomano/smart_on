import { getSupabaseClient } from './supabase';

// 데이터베이스 사용자 타입
export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  company?: string;
  phone?: string;
}

// 애플리케이션 사용자 타입
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'system_admin' | 'team_leader' | 'team_member';
  tenant_id: string;
  team_id?: string | null;
  team_name?: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  company?: string;
  phone?: string;
}

// 현재 사용자 조회
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return null;
    }

    // 사용자 기본 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single() as { data: DatabaseUser | null; error: any };

    if (userError || !userData) {
      return null;
    }

    // 팀 정보 조회 (memberships 테이블에서)
    console.log('🔍 getCurrentUser authUser.id:', authUser.id);
    const { data: membershipData, error: membershipError } = await supabase
      .from('memberships')
      .select('role, tenant_id, team_id')
      .eq('user_id', authUser.id)
      .maybeSingle();
    
    console.log('🔍 getCurrentUser membershipData:', membershipData);
    console.log('🔍 getCurrentUser membershipError:', membershipError);

    let teamId = null;
    let teamName = null;
    let role = userData.role;

    if (membershipError) {
      console.error('memberships 로드 오류:', membershipError);
      // membership이 없는 경우 기본값 사용
    } else if (membershipData) {
      console.log('🔍 getCurrentUser membershipData:', membershipData);
      teamId = membershipData.team_id;
      console.log('🔍 getCurrentUser teamId 설정:', teamId);
      
      // team_id가 있으면 teams 테이블에서 팀 이름 조회
      if (teamId) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('name')
          .eq('id', teamId)
          .maybeSingle();
        
        if (teamData) {
          teamName = teamData.name;
        }
      }
      
      // users 테이블의 role을 우선 사용 (최고관리자가 수정한 권한이 최종 권한)
      // memberships 테이블의 role은 참고용으로만 사용
      role = userData.role; // users 테이블의 role이 최종 권한
    } else {
      console.log('🔍 getCurrentUser membershipData가 null입니다');
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: (role as 'super_admin' | 'system_admin' | 'team_leader' | 'team_member') || 'team_member',
      tenant_id: userData.tenant_id,
      team_id: teamId,
      team_name: teamName,
      is_approved: userData.is_approved,
      is_active: userData.is_active,
      created_at: userData.created_at
    };
  } catch (error: any) {
    console.error('Supabase 사용자 조회 오류:', error);
    return null;
  }
};

// 승인된 사용자 목록 조회
export const getApprovedUsers = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: approvedUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) as { data: DatabaseUser[] | null; error: any };

    if (error) {
      return [];
    }

    if (!approvedUsers) {
      return [];
    }

    // 각 사용자의 팀 정보 조회
    const usersWithTeamInfo = await Promise.all(
      approvedUsers.map(async (user) => {
        const { data: membershipData, error: membershipError } = await supabase
          .from('memberships')
          .select('role, tenant_id, team_id') // Simplified select
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle for defensive coding

        let teamId = null;
        let teamName = null;
        let role = user.role;

        if (membershipError) {
          console.error(`사용자 ${user.email} memberships 로드 오류:`, membershipError);
          // membership이 없는 경우 기본값 사용
        } else if (membershipData) {
          teamId = membershipData.team_id;
          
          // team_id가 있으면 teams 테이블에서 팀 이름 조회
          if (teamId) {
            const { data: teamData } = await supabase
              .from('teams')
              .select('name')
              .eq('id', teamId)
              .maybeSingle(); // Use maybeSingle for defensive coding
            
            if (teamData) {
              teamName = teamData.name;
            }
          }
          
          // memberships 테이블의 role을 우선 사용
          if (membershipData.role) {
            role = membershipData.role === 'owner' ? 'system_admin' :
                   membershipData.role === 'operator' ? 'team_leader' :
                   membershipData.role === 'viewer' ? 'team_member' : user.role;
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: (role as 'super_admin' | 'system_admin' | 'team_leader' | 'team_member') || 'team_member',
          tenant_id: user.tenant_id,
          team_id: teamId,
          team_name: teamName,
          is_approved: user.is_approved,
          is_active: user.is_active,
          created_at: user.created_at,
          company: user.company,
          phone: user.phone
        } as AuthUser;
      })
    );

    return usersWithTeamInfo;
  } catch (error) {
    console.error('승인된 사용자 조회 오류:', error);
    return [];
  }
};

// 팀 목록 조회 - Supabase 전용
export const getTeams = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // 실제 Supabase에서 모든 데이터 조회
    const [teamsResult, devicesResult, sensorsResult, readingsResult] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('devices').select('*').order('name'),
      supabase.from('sensors').select('*').order('name'),
      supabase.from('sensor_readings').select('*').order('created_at', { ascending: false }).limit(1000)
    ]);

    console.log('🔍 Supabase 데이터 조회 결과:', {
      teams: teamsResult.data?.length || 0,
      devices: devicesResult.data?.length || 0,
      sensors: sensorsResult.data?.length || 0,
      readings: readingsResult.data?.length || 0
    });

    return {
      success: true,
      teams: teamsResult.data || [],
      devices: devicesResult.data || [],
      sensors: sensorsResult.data || [],
      sensorReadings: readingsResult.data || []
    };
  } catch (error) {
    console.error('팀 조회 오류:', error);
    return { 
      success: false, 
      teams: [], 
      devices: [], 
      sensors: [], 
      sensorReadings: [] 
    };
  }
};

// 사용자 정보 업데이트
export const updateUser = async (userId: string, data: Partial<AuthUser>) => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId);

    if (error) {
      return { success: false, error: '사용자 정보 업데이트에 실패했습니다.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: '사용자 정보 업데이트 중 오류가 발생했습니다.' };
  }
};

// 로그아웃
export const signOut = async () => {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('로그아웃 오류:', error);
  }
};

// 사용자 설정 조회
export const getUserSettings = (userId: string) => {
  if (typeof window === 'undefined') return {};
  
  try {
    const settings = localStorage.getItem(`user_settings_${userId}`);
    return settings ? JSON.parse(settings) : {};
  } catch (error) {
    console.error('사용자 설정 조회 오류:', error);
    return {};
  }
};

// 사용자 설정 업데이트
export const updateUserSettings = (userId: string, settings: any) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`user_settings_${userId}`, JSON.stringify(settings));
  } catch (error) {
    console.error('사용자 설정 저장 오류:', error);
  }
};
