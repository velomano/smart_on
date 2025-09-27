// Supabase 인증 시스템
import { getSupabaseClient } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: 'system_admin' | 'team_leader' | 'team_member';
  tenant_id?: string;
  team_id?: string; // 배정된 조 ID
  team_name?: string; // 배정된 조 이름
  preferred_team?: string; // 선호 조
  is_approved?: boolean;
  is_active?: boolean; // 활성/비활성 상태
  created_at?: string; // 생성일
  company?: string; // 회사명
  phone?: string; // 전화번호
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  company?: string;
  phone?: string;
  preferred_team?: string; // 조 선호도
}

export interface SignInData {
  email: string;
  password: string;
}

// Supabase 로그인
export const signIn = async (data: SignInData) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (authData.user) {
      // Supabase users 테이블에서 사용자 정보 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
      }

      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'team_member',
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

// Supabase 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return null;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !userData) {
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'team_member',
      tenant_id: userData.tenant_id,
      is_approved: userData.is_approved,
      is_active: userData.is_active,
      created_at: userData.created_at
    };
  } catch (error: any) {
    console.error('Supabase 사용자 조회 오류:', error);
    return null;
  }
};

// Supabase 로그아웃
export const signOut = async () => {
  try {
    console.log('Supabase 로그아웃 시작');
    
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase 로그아웃 오류:', error);
      return { success: false, error: error.message };
    }
    
    // 페이지 새로고침을 통해 상태 초기화
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    console.log('Supabase 로그아웃 성공');
    return { success: true };
  } catch (error: any) {
    console.error('Supabase 로그아웃 중 오류:', error);
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
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
          phone: data.phone,
          preferred_team: data.preferred_team
        }
      }
    });

    if (authError) {
      return { success: false, error: authError.message };
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
          preferred_team: data.preferred_team,
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

// 승인 대기 사용자 조회
export const getPendingUsers = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: pendingUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', false)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

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
        approved_at: new Date().toISOString()
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
        is_active: false 
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

// 승인된 사용자 조회
export const getApprovedUsers = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: approvedUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return approvedUsers || [];
  } catch (error) {
    console.error('승인된 사용자 조회 오류:', error);
    return [];
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

// 팀 목록 조회
export const getTeams = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) {
      return [];
    }

    return teams || [];
  } catch (error) {
    console.error('팀 조회 오류:', error);
    return [];
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

// 사용자 삭제
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

// 사용자 설정 관리 함수들
const getUserSettingsInternal = (userId: string) => {
  if (typeof window === 'undefined') return {};
  const settings = localStorage.getItem(`user_settings_${userId}`);
  return settings ? JSON.parse(settings) : {
    showTeamBedsOnDashboard: true,
    showAllBedsInBedManagement: false
  };
};

const saveUserSettings = (userId: string, settings: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`user_settings_${userId}`, JSON.stringify(settings));
};

export const getUserSettings = (userId: string) => {
  return getUserSettingsInternal(userId);
};

export const updateUserSettings = (userId: string, settings: any) => {
  const currentSettings = getUserSettingsInternal(userId);
  const newSettings = { ...currentSettings, ...settings };
  saveUserSettings(userId, newSettings);
  return newSettings;
};