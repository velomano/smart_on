import { supabase } from './supabase';
// import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'operator' | 'viewer';
  tenant_id?: string;
  is_approved?: boolean;
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

// 회원가입
export const signUp = async (data: SignUpData) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          company: data.company,
          phone: data.phone,
        }
      }
    });

    if (authError) {
      throw authError;
    }

    // 사용자 정보를 users 테이블에 저장 (승인 대기 상태)
    if (authData.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          is_approved: false, // 관리자 승인 필요
          created_at: new Date().toISOString()
        });

      if (userError) {
        console.error('Error creating user profile:', userError);
        throw new Error('사용자 프로필 생성에 실패했습니다.');
      }
    }

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// 로그인
export const signIn = async (data: SignInData) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      throw authError;
    }

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// 로그아웃
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // 사용자 상세 정보 가져오기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, memberships(role, tenant_id)')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      name: userData.name,
      role: userData.memberships?.[0]?.role as 'admin' | 'operator' | 'viewer',
      tenant_id: userData.memberships?.[0]?.tenant_id,
      is_approved: userData.is_approved
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// 승인 대기 중인 사용자 목록 가져오기 (관리자용)
export const getPendingUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { success: true, users: data };
  } catch (error) {
    console.error('Get pending users error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// 사용자 승인 (관리자용)
export const approveUser = async (userId: string, role: 'admin' | 'operator' | 'viewer', tenantId?: string) => {
  try {
    // 사용자 승인 상태 업데이트
    const { error: userError } = await supabase
      .from('users')
      .update({ is_approved: true })
      .eq('id', userId);

    if (userError) {
      throw userError;
    }

    // 테넌트가 제공된 경우 멤버십 생성
    if (tenantId) {
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          role: role
        });

      if (membershipError) {
        throw membershipError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Approve user error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// 사용자 거부 (관리자용)
export const rejectUser = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Reject user error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// 테넌트 목록 가져오기 (관리자용)
export const getTenants = async () => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { success: true, tenants: data };
  } catch (error) {
    console.error('Get tenants error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
