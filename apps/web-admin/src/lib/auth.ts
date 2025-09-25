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

// Mock 인증 함수들 (순환 참조 방지)
const mockUsers = [
  { id: 'mock-test-001', email: 'test1@test.com', name: '시스템 관리자', role: 'system_admin', team_id: null, team_name: null, is_active: true },
  { id: 'mock-test-002', email: 'test2@test.com', name: '1농장장', role: 'team_leader', team_id: 'team-001', team_name: '1농장', is_active: true },
  { id: 'mock-test-003', email: 'test3@test.com', name: '2농장장', role: 'team_leader', team_id: 'team-002', team_name: '2농장', is_active: true },
  { id: 'mock-test-004', email: 'test4@test.com', name: '3농장장', role: 'team_leader', team_id: 'team-003', team_name: '3농장', is_active: true },
  { id: 'mock-test-005', email: 'test5@test.com', name: '1농장 팀원', role: 'team_member', team_id: 'team-001', team_name: '1농장', is_active: true },
  { id: 'mock-test-006', email: 'test6@test.com', name: '2농장 팀원', role: 'team_member', team_id: 'team-002', team_name: '2농장', is_active: true },
  { id: 'mock-test-007', email: 'test7@test.com', name: '3농장 팀원', role: 'team_member', team_id: 'team-003', team_name: '3농장', is_active: true },
];

const mockPasswords = {
  'test1@test.com': 'password',
  'test2@test.com': 'password',
  'test3@test.com': 'password',
  'test4@test.com': 'password',
  'test5@test.com': 'password',
  'test6@test.com': 'password',
  'test7@test.com': 'password',
};

// 회원가입
export const signUp = async (data: SignUpData) => {
  return { success: false, error: 'Mock 환경에서는 회원가입이 비활성화되어 있습니다.' };
};

// 로그인
export const signIn = async (data: SignInData) => {
  const user = mockUsers.find(u => u.email === data.email);
  const password = mockPasswords[data.email as keyof typeof mockPasswords];
  
  if (!user || password !== data.password) {
    return { success: false, error: 'Invalid login credentials' };
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('mock_current_user', JSON.stringify(user));
  }
  
  return { success: true, user };
};

// 로그아웃
export const signOut = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mock_current_user');
  }
  return { success: true };
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('mock_current_user');
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
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
