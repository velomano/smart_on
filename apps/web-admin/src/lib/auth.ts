import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseClient: any = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

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
  role: 'super_admin' | 'system_admin' | 'team_leader' | 'team_member';
  tenant_id: string;
  team_id?: string | null;
  team_name?: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  company?: string;
  phone?: string;
}

export interface Farm {
  id: string;
  name: string;
  location?: string | null;
  tenant_id: string;
  created_at?: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  company?: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Supabase 에러 메시지를 한글로 변환
const translateAuthError = (errorMessage: string): string => {
  const errorMap: { [key: string]: string } = {
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Email not confirmed': '이메일 인증이 완료되지 않았습니다.',
    'User not found': '사용자를 찾을 수 없습니다.',
    'Invalid email': '올바르지 않은 이메일 형식입니다.',
    'Password should be at least 6 characters': '비밀번호는 6자 이상이어야 합니다.',
    'User already registered': '이미 등록된 사용자입니다.',
    'Too many requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    'Network error': '네트워크 오류가 발생했습니다.',
    'Server error': '서버 오류가 발생했습니다.',
    'Invalid refresh token': '인증 토큰이 만료되었습니다. 다시 로그인해주세요.'
  };

  // 정확한 매칭 시도
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage];
  }

  // 부분 매칭 시도
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // 기본 메시지
  return `로그인 중 오류가 발생했습니다: ${errorMessage}`;
};

// Supabase 로그인
export const signIn = async (data: SignInData) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (authError) {
      return { success: false, error: translateAuthError(authError.message) };
    }

    if (authData.user) {
      // Supabase users 테이블에서 사용자 정보 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single() as { data: DatabaseUser | null; error: any };

      if (userError) {
        return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
      }

      if (!userData) {
        return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
      }

      // 계정 상태 확인
      if (!userData.is_active) {
        return { success: false, error: '비활성화된 계정입니다. 관리자에게 문의하세요.' };
      }

      if (!userData.is_approved) {
        return { success: false, error: '승인 대기 중인 계정입니다. 승인 후 로그인할 수 있습니다.' };
      }

      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: (userData.role as 'system_admin' | 'team_leader' | 'team_member') || 'team_member',
        tenant_id: userData.tenant_id,
        is_approved: userData.is_approved,
        is_active: userData.is_active,
        created_at: userData.created_at
      };

      return { success: true, user };
    }

    return { success: false, error: '로그인에 실패했습니다.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Supabase 회원가입
export const signUp = async (data: SignUpData) => {
  try {
    const supabase = getSupabaseClient();
    
    // Supabase Auth로 사용자 등록
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          company: data.company,
          phone: data.phone
        }
      }
    });

    if (authError) {
      return { success: false, error: translateAuthError(authError.message) };
    }

    if (authData.user) {
      // users 테이블에 사용자 정보 저장
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          company: data.company,
          phone: data.phone,
          role: 'team_member', // 기본 역할
          tenant_id: '00000000-0000-0000-0000-000000000001', // 기본 테넌트
          is_approved: false, // 승인 대기 상태
          is_active: true
        });

      if (userError) {
        return { success: false, error: '사용자 정보 저장에 실패했습니다.' };
      }

      return { success: true, message: '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.' };
    }

    return { success: false, error: '회원가입에 실패했습니다.' };
  } catch (error: any) {
    console.error('회원가입 중 오류:', error);
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
  }
};

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
      
      // memberships 테이블의 role을 우선 사용 (더 정확함)
      if (membershipData.role) {
        role = membershipData.role === 'owner' ? 'system_admin' :
               membershipData.role === 'operator' ? 'team_leader' :
               membershipData.role === 'viewer' ? 'team_member' : userData.role;
      }
    } else {
      console.log('🔍 getCurrentUser membershipData가 null입니다');
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: (role as 'system_admin' | 'team_leader' | 'team_member') || 'team_member',
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
    console.log('🚀 getApprovedUsers 함수 시작');
    const supabase = getSupabaseClient();
    
    const { data: approvedUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) as { data: DatabaseUser[] | null; error: any };

    console.log('🚀 getApprovedUsers Supabase 쿼리 결과:', {
      data: approvedUsers?.length || 0,
      error: error
    });

    if (error) {
      console.log('🚀 getApprovedUsers 오류 발생:', error);
      return [];
    }

    if (!approvedUsers) {
      console.log('🚀 getApprovedUsers 데이터 없음');
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

        console.log(`🔍 getApprovedUsers - ${user.email}:`, {
          membershipData,
          membershipError,
          userId: user.id
        });

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
          role: (role as 'system_admin' | 'team_leader' | 'team_member') || 'team_member',
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

    console.log('🚀 getApprovedUsers 최종 결과:', usersWithTeamInfo.length, '명');
    console.log('🚀 getApprovedUsers 팀별 분포:', usersWithTeamInfo.map(u => ({
      email: u.email,
      team_id: u.team_id,
      team_name: u.team_name
    })));
    console.log('🚀 getApprovedUsers 반환값:', usersWithTeamInfo);
    return usersWithTeamInfo;
  } catch (error) {
    console.error('승인된 사용자 조회 오류:', error);
    return [];
  }
};

// 농장 목록 조회 (farms 기반)
export const getFarms = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // farms 테이블에서 직접 조회
    const { data: farms, error } = await supabase
      .from('farms')
      .select('id, name, location, tenant_id, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ getFarms 오류:', error);
      return { success: false, error: error.message, farms: [] };
    }

    console.log('🔍 getFarms 결과:', {
      farmsCount: farms?.length || 0,
      farms: (farms || []).map((f: Farm) => ({ id: f.id, name: f.name }))
    });

    return { success: true, farms: farms || [] };
  } catch (error: any) {
    console.error('❌ getFarms 오류:', error);
    return { success: false, error: error.message, farms: [] };
  }
};

// 기존 getTeams 호환성을 위한 래퍼 함수
export const getTeams = async () => {
  const result = await getFarms();
  return {
    success: result.success,
    error: result.error,
    teams: result.farms // farms를 teams로 매핑
  };
};

// 사용자를 농장에 배정 (farm_memberships 사용)
export const assignUserToFarm = async (userId: string, farmId: string, tenantId: string, role: 'owner' | 'operator' | 'viewer' = 'operator') => {
  try {
    const supabase = getSupabaseClient();
    
    console.log('🔍 assignUserToFarm 호출:', { userId, farmId, tenantId, role });

    const { error } = await supabase
      .from('farm_memberships')
      .upsert([{ 
        tenant_id: tenantId, 
        user_id: userId, 
        farm_id: farmId, 
        role: role 
      }], { 
        onConflict: 'tenant_id, farm_id, user_id' 
      });

    if (error) {
      console.error('❌ assignUserToFarm 오류:', error);
      return { 
        success: false, 
        error: `사용자 농장 배정에 실패했습니다: ${error.message}` 
      };
    }

    console.log('✅ assignUserToFarm 성공');
    return { success: true };
  } catch (error: any) {
    console.error('❌ assignUserToFarm 예외:', error);
    return { 
      success: false, 
      error: `사용자 농장 배정 중 오류가 발생했습니다: ${error.message}` 
    };
  }
};

// 사용자의 농장 배정 조회
export const getUserFarmMemberships = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('farm_memberships')
      .select(`
        id,
        farm_id,
        role,
        farms!inner(id, name, location)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ getUserFarmMemberships 오류:', error);
      return { success: false, error: error.message, memberships: [] };
    }

    return { success: true, memberships: data || [] };
  } catch (error: any) {
    console.error('❌ getUserFarmMemberships 예외:', error);
    return { success: false, error: error.message, memberships: [] };
  }
};

// 사용자 정보 업데이트
export const updateUser = async (userId: string, data: Partial<AuthUser>) => {
  try {
    const supabase = getSupabaseClient();
    
    console.log('🔍 updateUser 호출:', { userId, data });
    
    // team_id가 변경되는 경우 farm_memberships 테이블을 통해 처리
    let farmIdToAssign = null;
    if (data.team_id && data.team_id !== '') {
      console.log('🔍 농장 존재 여부 확인:', data.team_id);
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('id, name')
        .eq('id', data.team_id)
        .maybeSingle();

      if (farmError) {
        console.error('❌ 농장 조회 오류:', farmError);
        return {
          success: false,
          error: `농장 조회에 실패했습니다: ${farmError.message}`,
          details: farmError
        };
      }

      if (!farmData) {
        console.error('❌ 농장이 존재하지 않음:', data.team_id);
        return {
          success: false,
          error: `선택한 농장이 존재하지 않습니다. 농장 ID: ${data.team_id}`,
          details: { farm_id: data.team_id }
        };
      }

      console.log('✅ 농장 확인 완료:', farmData);
      farmIdToAssign = data.team_id;
    }
    
    // team_id는 users 테이블에서 제거되었으므로 제거
    delete data.team_id;
    
    const { error, data: result } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ updateUser 오류:', error);
      console.error('❌ 오류 타입:', typeof error);
      console.error('❌ 오류 객체 키들:', Object.keys(error || {}));
      
      // 오류 객체의 속성들을 안전하게 접근
      const errorCode = error?.code || 'UNKNOWN';
      const errorMessage = error?.message || '알 수 없는 오류';
      const errorDetails = error?.details || null;
      const errorHint = error?.hint || null;
      
      console.error('❌ 오류 코드:', errorCode);
      console.error('❌ 오류 메시지:', errorMessage);
      console.error('❌ 오류 세부사항:', errorDetails);
      console.error('❌ 오류 힌트:', errorHint);
      
      // 409 Conflict 오류의 경우 더 구체적인 메시지 제공
      if (errorCode === '409') {
        if (errorMessage.includes('duplicate key')) {
          return { 
            success: false, 
            error: '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.',
            details: error
          };
        } else if (errorMessage.includes('foreign key')) {
          return { 
            success: false, 
            error: '선택한 농장이 존재하지 않습니다. 올바른 농장을 선택해주세요.',
            details: error
          };
        }
      }

      return {
        success: false,
        error: `사용자 정보 업데이트에 실패했습니다: ${errorMessage}`,
        details: error
      };
    }

    console.log('✅ updateUser 성공:', result);
    
    // farm_memberships 처리
    if (farmIdToAssign !== null) {
      console.log('🔍 farm_memberships 처리:', { userId, farmId: farmIdToAssign });
      
      // 기존 farm_memberships 삭제
      await supabase
        .from('farm_memberships')
        .delete()
        .eq('user_id', userId);
      
      // 새로운 farm_memberships 추가
      const { error: fmError } = await supabase
        .from('farm_memberships')
        .insert([{
          user_id: userId,
          farm_id: farmIdToAssign,
          tenant_id: result?.[0]?.tenant_id || '00000000-0000-0000-0000-000000000001',
          role: 'operator'
        }]);
      
      if (fmError) {
        console.error('❌ farm_memberships 처리 오류:', fmError);
        // farm_memberships 오류는 경고만 출력하고 사용자 업데이트는 성공으로 처리
      } else {
        console.log('✅ farm_memberships 처리 성공');
      }
    }
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('❌ updateUser 예외:', error);
    return { 
      success: false, 
      error: `사용자 정보 업데이트 중 오류가 발생했습니다: ${error.message}`,
      details: error
    };
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

// 승인 대기 사용자 조회
export const getPendingUsers = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: pendingUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', false)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) as { data: DatabaseUser[] | null; error: any };

    if (error) {
      return [];
    }

    return pendingUsers || [];
  } catch (error) {
    console.error('승인 대기 사용자 조회 오류:', error);
    return [];
  }
};

// 사용자 승인
export const approveUser = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('users')
      .update({ 
        is_approved: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: '사용자 승인에 실패했습니다.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: '사용자 승인 중 오류가 발생했습니다.' };
  }
};

// 사용자 거부
export const rejectUser = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('users')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: '사용자 거부에 실패했습니다.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: '사용자 거부 중 오류가 발생했습니다.' };
  }
};

// 테넌트 목록 조회
export const getTenants = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .order('name');

    if (error) {
      return [];
    }

    return tenants || [];
  } catch (error) {
    console.error('테넌트 조회 오류:', error);
    return [];
  }
};

// 사용자 삭제 (비활성화)
export const deleteUser = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId);

    if (error) {
      return { success: false, error: '사용자 삭제에 실패했습니다.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: '사용자 삭제 중 오류가 발생했습니다.' };
  }
};

// Mock 사용자 리셋 (개발용)
export const resetMockUsers = async () => {
  // Supabase에서는 mock 데이터 리셋이 필요 없음
  console.log('Mock 사용자 리셋은 Supabase 환경에서는 지원되지 않습니다.');
  return { success: true };
};
