import { getSupabaseClient, getFarms } from './supabase';

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
  team_id?: string | null;
  team_name?: string | null;
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
  preferred_team?: string;
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
      const { data: userData, error: userError } = await (supabase as any)
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
        role: (userData.role as 'super_admin' | 'system_admin' | 'team_leader' | 'team_member') || 'team_member',
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
      const { error: userError } = await (supabase as any)
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
    
    const { data: { user: authUser }, error: authError } = await (supabase as any).auth.getUser();
    
    if (authError || !authUser) {
      return null;
    }

    // 사용자 기본 정보 조회
    console.log('🔍 getCurrentUser - 사용자 기본 정보 조회 시작:', authUser.id);
    const { data: userData, error: userError } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single() as { data: DatabaseUser | null; error: any };

    console.log('🔍 getCurrentUser - 사용자 기본 정보 조회 결과:', {
      userData: userData ? {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        team_id: userData.team_id,
        team_name: userData.team_name,
        is_approved: userData.is_approved,
        is_active: userData.is_active
      } : null,
      userError: userError
    });

    if (userError || !userData) {
      console.error('🔴 getCurrentUser - 사용자 정보 조회 실패:', userError);
      return null;
    }

    // 농장 멤버십 정보 조회 (farm_memberships 테이블에서)
    console.log('🔍 getCurrentUser authUser.id:', authUser.id);
    const { data: farmMembershipData, error: farmMembershipError } = await (supabase as any)
      .from('farm_memberships')
      .select('farm_id, role')
      .eq('user_id', authUser.id)
      .maybeSingle();

    console.log('🔍 getCurrentUser farmMembershipData:', farmMembershipData);
    console.log('🔍 getCurrentUser farmMembershipError:', farmMembershipError);

    // 기존 memberships 테이블도 확인 (호환성을 위해)
    const { data: membershipData, error: membershipError } = await (supabase as any)
      .from('memberships')
      .select('role, tenant_id, team_id')
      .eq('user_id', authUser.id)
      .maybeSingle();
    
    console.log('🔍 getCurrentUser membershipData:', membershipData);
    console.log('🔍 getCurrentUser membershipError:', membershipError);

    let teamId = userData.team_id; // users 테이블의 team_id를 기본값으로 사용
    let teamName = userData.team_name; // users 테이블의 team_name을 기본값으로 사용
    let role = userData.role;

    // 슈퍼 관리자와 시스템 관리자는 farm_memberships에 관계없이 최고 권한 유지
    if (userData.role === 'super_admin' || userData.role === 'system_admin') {
      console.log('🔍 getCurrentUser - 관리자 감지:', {
        email: userData.email,
        role: userData.role
      });
      // 관리자는 모든 농장에 접근 가능하므로 team_id는 null로 유지
      teamId = null;
      teamName = null;
      role = userData.role;
    } else {
      // 일반 사용자만 farm_memberships 테이블에서 농장 정보 조회
      if (farmMembershipError) {
        console.error('farm_memberships 로드 오류:', farmMembershipError);
      } else if (farmMembershipData) {
        console.log('🔍 getCurrentUser farmMembershipData:', farmMembershipData);
        
        // farm_memberships에서 farm_id를 team_id로 사용
        if (farmMembershipData.farm_id) {
          teamId = farmMembershipData.farm_id;
          console.log('🔍 getCurrentUser teamId를 farm_memberships에서 설정:', teamId);
          
          // farm_id로 농장 이름 조회
          console.log('🔍 getCurrentUser - 농장 이름 조회 시도:', teamId);
          const { data: farmData } = await (supabase as any)
            .from('farms')
            .select('name')
            .eq('id', teamId)
            .maybeSingle();
          
          console.log('🔍 getCurrentUser - 농장 이름 조회 결과:', farmData);
          if (farmData) {
            teamName = farmData.name;
            console.log('🔍 getCurrentUser - 농장 이름 설정:', teamName);
          }
        }
        
        // farm_memberships의 role을 users 테이블의 role과 매핑
        if (farmMembershipData.role) {
          role = farmMembershipData.role === 'owner' ? 'team_leader' :
                 farmMembershipData.role === 'operator' ? 'team_member' :
                 farmMembershipData.role === 'viewer' ? 'team_member' :
                 userData.role; // 기본값은 users 테이블의 role
          console.log('🔍 getCurrentUser role을 farm_memberships에서 매핑:', {
            farmRole: farmMembershipData.role,
            mappedRole: role
          });
        }
      } else {
        console.log('🔍 getCurrentUser farmMembershipData가 null입니다, 기존 로직 사용');
        
        // 기존 memberships 테이블 로직 (호환성을 위해)
        if (membershipError) {
          console.error('memberships 로드 오류:', membershipError);
        } else if (membershipData) {
          console.log('🔍 getCurrentUser membershipData:', membershipData);
          
          // users 테이블에 team_id가 없으면 memberships에서 가져오기
          if (!teamId && membershipData.team_id) {
            teamId = membershipData.team_id;
            console.log('🔍 getCurrentUser teamId를 memberships에서 설정:', teamId);
          }
          
          // team_id가 있으면 farms 테이블에서 농장 이름 조회 (teamName이 없는 경우만)
          if (teamId && !teamName) {
            console.log('🔍 getCurrentUser - 농장 이름 조회 시도:', teamId);
            const { data: farmData } = await (supabase as any)
              .from('farms')
              .select('name')
              .eq('id', teamId)
              .maybeSingle();
            
            console.log('🔍 getCurrentUser - 농장 이름 조회 결과:', farmData);
            if (farmData) {
              teamName = farmData.name;
              console.log('🔍 getCurrentUser - 농장 이름 설정:', teamName);
            }
          }
        }
      }
    }

    const finalUser = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: (role as 'super_admin' | 'system_admin' | 'team_leader' | 'team_member') || 'team_member',
      tenant_id: userData.tenant_id,
      team_id: teamId,
      team_name: teamName,
      is_approved: userData.is_approved,
      is_active: userData.is_active,
      created_at: userData.created_at,
      company: userData.company,
      phone: userData.phone
    };

    console.log('🔍 getCurrentUser 최종 반환값:', {
      email: finalUser.email,
      role: finalUser.role,
      team_id: finalUser.team_id,
      team_name: finalUser.team_name,
      is_approved: finalUser.is_approved,
      is_active: finalUser.is_active
    });

    // team_id가 없는 경우 경고 로그만 출력
    if (!finalUser.team_id) {
      console.warn('⚠️ 사용자에게 team_id가 설정되지 않았습니다:', {
        email: finalUser.email,
        role: finalUser.role
      });
    }

    return finalUser;
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
    
    const { data: approvedUsers, error } = await (supabase as any)
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

    // 각 사용자의 농장 정보 조회 (farm_memberships 사용)
    const usersWithTeamInfo = await Promise.all(
      approvedUsers.map(async (user) => {
        const { data: membershipData, error: membershipError } = await (supabase as any)
          .from('farm_memberships')
          .select('role, tenant_id, farm_id') // farm_memberships 사용
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle for defensive coding

        console.log(`🔍 getApprovedUsers - ${user.email}:`, {
          membershipData,
          membershipError,
          userId: user.id,
          userRole: user.role
        });

        let teamId = null;
        let teamName = null;
        let role = user.role;

        // system_admin과 super_admin은 farm_memberships에 관계없이 최고 권한 유지
        if (user.role === 'system_admin' || user.role === 'super_admin') {
          console.log(`🔍 관리자 감지: ${user.email}, role: ${user.role}`);
          role = user.role;
          // 관리자는 모든 농장에 접근 가능하므로 teamId는 null로 유지
        } else if (membershipError) {
          console.error(`사용자 ${user.email} farm_memberships 로드 오류:`, membershipError);
          // membership이 없는 경우 기본값 사용
        } else if (membershipData) {
          teamId = membershipData.farm_id; // farm_id를 team_id로 사용
          
          // farm_id가 있으면 farms 테이블에서 농장 이름 조회
          if (teamId) {
            console.log('🔍 getApprovedUsers - 농장 이름 조회 시도:', teamId);
            const { data: farmData } = await (supabase as any)
              .from('farms')
              .select('name')
              .eq('id', teamId)
              .maybeSingle(); // Use maybeSingle for defensive coding
            
            console.log('🔍 getApprovedUsers - 농장 이름 조회 결과:', farmData);
            if (farmData) {
              teamName = farmData.name;
              console.log('🔍 getApprovedUsers - 농장 이름 설정:', teamName);
            }
          }
          
          // farm_memberships 테이블의 role을 users 테이블의 role로 매핑
          if (membershipData.role) {
            role = membershipData.role === 'owner' ? 'team_leader' :
                   membershipData.role === 'operator' ? 'team_member' :
                   membershipData.role === 'viewer' ? 'team_member' : user.role;
          }
        }

        const result = {
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
        
        console.log(`🔍 getApprovedUsers 최종 결과 - ${user.email}:`, {
          email: result.email,
          role: result.role,
          team_id: result.team_id,
          team_name: result.team_name
        });
        
        return result;
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

// getFarms는 supabase.ts에서 import하여 사용

// 기존 getTeams 호환성을 위한 래퍼 함수
export const getTeams = async () => {
  const farms = await getFarms();
  return {
    success: true,
    teams: farms // Farm[]을 teams로 매핑
  };
};

// 사용자를 농장에 배정 (farm_memberships 사용)
export const assignUserToFarm = async (
  userId: string,
  farmId: string,
  tenantId: string,
  role: 'owner' | 'operator' | 'viewer' = 'operator'
) => {
  try {
    const supabase = getSupabaseClient();

    // 1) 농장 유효성 + 테넌트 일치 검증
    const { data: farm, error: farmErr } = await supabase
      .from('farms')
      .select('id, tenant_id')
      .eq('id', farmId)
      .maybeSingle();

    if (farmErr) {
      logPgError('assignUserToFarm: 농장 조회 오류', farmErr);
      return { success: false, error: `농장 조회 실패: ${(farmErr as any).message || '원인 미상'}` };
    }
    if (!farm) return { success: false, error: '선택한 농장이 존재하지 않습니다.' };
    if (farm.tenant_id !== tenantId) {
      return { success: false, error: '선택한 농장은 현재 테넌트와 다릅니다.' };
    }

    // 2) upsert 시 select()를 붙여야 에러/결과가 명확
    const { error } = await (supabase as any)
      .from('farm_memberships')
      .upsert(
        [{ tenant_id: tenantId, farm_id: farmId, user_id: userId, role }],
        { onConflict: 'tenant_id,farm_id,user_id', ignoreDuplicates: false }
      )
      .select('id'); // ★ 중요

    if (error) {
      logPgError('assignUserToFarm upsert 오류', error);
      return { success: false, error: `사용자 농장 배정에 실패했습니다: ${(error as any).message || '원인 미상'}` };
    }

    return { success: true };
  } catch (e: any) {
    logPgError('assignUserToFarm 예외', e);
    return { success: false, error: `배정 중 예외: ${e?.message || e}` };
  }
};

// 사용자의 농장 배정 조회
export const getUserFarmMemberships = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await (supabase as any)
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

// 안전 로거
function logPgError(ctx: string, err: any) {
  // PostgrestError는 속성이 non-enumerable이라 console에 {}처럼 보입니다.
  const safe = err ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : 'null';
  console.error(`❌ ${ctx}:`, safe);
}

// 사용자 정보 업데이트
export const updateUser = async (userId: string, data: Partial<AuthUser>) => {
  try {
    const supabase = getSupabaseClient();

    console.log('🔍 updateUser 호출:', { userId, data });

    // 1) 팀 배정 관련은 farm_memberships로만 처리 (users.team_id는 사용하지 않음)
    const { team_id: maybeFarmId, tenant_id: maybeTenantId, ...rest } = data ?? {};
    
    // tenant_id는 users 테이블에서 제거되었으므로 rest에서도 제거
    delete (rest as any).tenant_id;

    // 팀(=농장) 배정 처리: 주어진 경우 farm_memberships upsert
    if (typeof maybeFarmId !== 'undefined') {
      // 빈 문자열이면 null 처리(배정 해제)
      const farmId = maybeFarmId === '' ? null : maybeFarmId;

      if (farmId) {
        // tenant_id 확보
        const tenantId = maybeTenantId ?? (await (async () => {
          const { data: urow, error: uerr } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', userId)
            .maybeSingle();
          if (uerr) { 
            logPgError('배정을 위한 사용자 tenant 조회 오류', uerr); 
            return null; 
          }
          return urow?.tenant_id ?? null;
        })());

        if (!tenantId) return { success: false, error: '사용자의 tenant_id를 확인할 수 없습니다.' };

        // upsert 시 select()를 붙여야 PostgREST가 에러/결과를 더 분명히 돌려줍니다.
        const { error: fmError } = await supabase
          .from('farm_memberships')
          .upsert([{ tenant_id: tenantId, user_id: userId, farm_id: farmId, role: 'operator' }],
                  { onConflict: 'tenant_id, farm_id, user_id', ignoreDuplicates: false })
          .select(); // <= 중요

        if (fmError) {
          logPgError('farm_memberships upsert 오류', fmError);
          return { success: false, error: `농장 배정 실패: ${(fmError as any).message || '원인 미상'}` };
        }
      } else {
        // 해제
        const { error: delErr } = await supabase
          .from('farm_memberships')
          .delete()
          .eq('user_id', userId);
        if (delErr) {
          logPgError('farm_memberships 해제 오류', delErr);
          return { success: false, error: `농장 배정 해제 실패: ${(delErr as any).message || '원인 미상'}` };
        }
      }
    }

    // 2) users 업데이트: 허용 컬럼만 pick (team_id 제외 - farm_memberships로만 관리)
    const allowed: any = {};
    if (typeof rest.email !== 'undefined') allowed.email = rest.email as string;
    if (typeof rest.name !== 'undefined') allowed.name = rest.name as string;
    if (typeof rest.company !== 'undefined') allowed.company = rest.company as string | undefined;
    if (typeof rest.phone !== 'undefined') allowed.phone = rest.phone as string | undefined;
    if (typeof rest.is_active !== 'undefined') allowed.is_active = rest.is_active as boolean;
    if (typeof rest.is_approved !== 'undefined') allowed.is_approved = rest.is_approved as boolean;
    if (typeof rest.role !== 'undefined') allowed.role = rest.role as 'super_admin' | 'system_admin' | 'team_leader' | 'team_member';

    // 3) farm_memberships의 역할도 함께 업데이트
    if (typeof rest.role !== 'undefined') {
      const farmRole = rest.role === 'system_admin' ? 'owner' : 
                      rest.role === 'team_leader' ? 'owner' : 'operator';
      
      // 사용자의 모든 farm_memberships 업데이트
      const { error: fmUpdateError } = await (supabase as any)
        .from('farm_memberships')
        .update({ role: farmRole })
        .eq('user_id', userId);
      
      if (fmUpdateError) {
        console.error('farm_memberships 역할 업데이트 오류:', fmUpdateError);
        // 오류가 있어도 users 업데이트는 계속 진행
      }
    }

    // 변경할 것이 없다면 바로 성공 리턴
    if (Object.keys(allowed).length === 0) {
      return { success: true, data: [] };
    }

    const { error, data: result } = await supabase
      .from('users')
      .update(allowed)
      .eq('id', userId)
      .select('*')
      .maybeSingle(); // ← 업데이트 후 단일 행만 기대

    if (error) {
      logPgError('updateUser 오류', error);

      // 409, FK 등 메시지 매핑(있으면)
      const msg = (error as any)?.message || '알 수 없는 오류';
      if ((error as any)?.code === '409' && msg.includes('duplicate key')) {
        return { success: false, error: '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.' };
      }
      return { success: false, error: `사용자 정보 업데이트에 실패했습니다: ${msg}` };
    }

    // RLS로 인해 업데이트는 되었으나 row 반환이 안 되는 경우 대비
    if (!result) {
      console.warn('⚠️ updateUser: 업데이트는 되었으나 반환된 행이 없습니다(정책/권한으로 select 제한 가능).');
      return { success: true, data: null };
    }

    console.log('✅ updateUser 성공:', result);
    return { success: true, data: result };
  } catch (err: any) {
    logPgError('updateUser 예외', err);
    return { success: false, error: `사용자 정보 업데이트 중 오류: ${err?.message || err}` };
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
    
    const { error } = await (supabase as any)
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
    
    const { error } = await (supabase as any)
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
    
    const { error } = await (supabase as any)
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
