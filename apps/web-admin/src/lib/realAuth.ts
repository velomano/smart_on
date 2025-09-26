// 🌐 실제 인증 시스템 (Supabase Auth + Database 연동)
// Mock에서 실제 매뉴얼로 마이그레이션

import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { AuthUser } from './mockAuth';

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
  contact?: string;
  preferred_role?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class RealAuthService {
  private supabase: SupabaseClient;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // 🎯 1. 회원가입 (승인 대기 상태로 생성)
  async signUp(data: SignUpData): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      // Supabase Auth에 사용자 생성
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: '사용자 생성에 실패했습니다.' };
      }

      // users 테이블에 사용자 프로필 생성 (승인 대기)
      const { error: profileError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name || '',
          is_approved: false, // 승인 대기 상태
          created_at: new Date().toISOString()
        });

      if (profileError) {
        // 롤백: Auth 사용자 삭제
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: '사용자 프로필 생성에 실패했습니다.' };
      }

      return { 
        success: true, 
        user: authData.user 
      };

    } catch (error: any) {
      console.error('회원가입 실패:', error);
      return { 
        success: false, 
        error: `회원가입 실패: ${error.message}` 
      };
    }
  }

  // 🔑 2. 로그인 (실제 Supabase 인증)
  async signIn(data: SignInData): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: '로그인 실패: 사용자 정보 없음' };
      }

      // users 테이블에서 추가 정보 조회
      const { data: userProfile, error: profileError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !userProfile) {
        return { success: false, error: '사용자 프로필을 찾을 수 없습니다.' };
      }

      // 승인된 사용자인지 확인
      if (!userProfile.is_approved) {
        await this.supabase.auth.signOut(); // 로그아웃 처리
        return { success: false, error: '아직 승인되지 않은 계정입니다. 관리자에게 문의하세요.' };
      }

      // 권한 정보 조회 (memberships 테이블)
      const { data: memberships, error: membershipError } = await this.supabase
        .from('memberships')
        .select(`
          role,
          tenants (name)
        `)
        .eq('user_id', authData.user.id);

      if (membershipError) {
        console.warn('멤버십 정보 조회 실패:', membershipError);
      }

      const membership = memberships?.[0] as any;
      const tenantName = membership?.tenants?.name;
      
      // AuthUser 형태로 변환
      const authUser: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        name: userProfile.name || '',
        role: this.mapRole(membership?.role),
        tenant_id: tenantName ? 'tenant_id_placeholder' : undefined,
        is_approved: userProfile.is_approved,
        is_active: userProfile.is_active !== false,
        created_at: userProfile.created_at
      };

      return { success: true, user: authUser };

    } catch (error: any) {
      console.error('로그인 실패:', error);
      return { 
        success: false, 
        error: `로그인 실패: ${error.message}` 
      };
    }
  }

  // 👤 3. 현재 사용자 조회 (세션 확인)
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      
      if (sessionError || !session || !session.user) {
        return null;
      }

      // users 테이블에서 프로필 조회
      const { data: userProfile, error: profileError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !userProfile) {
        return null;
      }

      // 권한 정보 조회
      const { data: memberships } = await this.supabase
        .from('memberships')
        .select('role')
        .eq('user_id', session.user.id);

      const membership = memberships?.[0];
      
      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email!,
        name: userProfile.name || '',
        role: this.mapRole(membership?.role),
        is_approved: userProfile.is_approved,
        is_active: userProfile.is_active !== false,
        created_at: userProfile.created_at
      };

      return authUser;

    } catch (error: any) {
      console.error('현재 사용자 조회 실패:', error);
      return null;
    }
  }

  // 🚪 4. 로그아웃
  async signOut(): Promise<{ success: boolean }> {
    try {
      await this.supabase.auth.signOut();
      return { success: true };
    } catch (error: any) {
      console.error('로그아웃 실패:', error);
      return { success: false };
    }
  }

  // 🔄 5. 세션 갱신 토큰 관리를 위한 리스너
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const user = await this.getCurrentUser();
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }

  // 📋 6. 관리자: 대기 사용자 목록 조회
  async getPendingUsers(): Promise<AuthUser[]> {
    if (typeof window === 'undefined') return [];
    
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('대기 사용자 조회 실패:', error);
      return [];
    }

    return data?.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: 'team_member' as const,
      is_approved: false,
      is_active: user.is_active !== false,
      created_at: user.created_at
    })) || [];
  }

  // ✅ 7. 관리자: 사용자 승인
  async approveUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ 
          is_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error: any) {
      console.error('사용자 승인 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // 🗑️ 8. 관리자: 사용자 거절
  async rejectUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // users 테이블에서 삭제
      const { error: deleteError } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      // Auth 사용자도 삭제 (Admin API 필요)
      // TODO: Admin API로 실제 사용자 삭제 구현

      return { success: true };

    } catch (error: any) {
      console.error('사용자 거절 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔧 내부 헬퍼 메서드
  private mapRole(dbRole?: string): AuthUser['role'] {
    switch (dbRole) {
      case 'admin':
      case 'owner':
        return 'system_admin';
      case 'operator':
      case 'team_leader':
        return 'team_leader';
      case 'viewer':
      case 'team_member':
      default:
        return 'team_member';
    }
  }
}

// 🌐 싱글톤 인스턴스 생성
export const realAuthService = new RealAuthService();

// 🎭 하이브리드: 개발/운영 환경에 따라 자동 선택
export const getAuthService = async () => {
  const useRealAuth = process.env.NEXT_PUBLIC_USE_REAL_AUTH === 'true' || 
                     process.env.NODE_ENV === 'production';

  if (useRealAuth) {
    console.log('🔐 실제 인증 시스템 사용');
    return realAuthService;
  } else {
    console.log('🎭 Mock 인증 시스템 사용');
    const mockAuth = await import('./mockAuth');
    // Mock Auth 함수들을 Real Auth와 같은 인터페이스로 래핑
    return {
      signUp: mockAuth.signUp,
      signIn: mockAuth.signIn,
      signOut: mockAuth.signOut,
      getCurrentUser: mockAuth.getCurrentUser,
      getPendingUsers: mockAuth.getPendingUsers,
      approveUser: mockAuth.approveUser,
      rejectUser: mockAuth.rejectUser,
    };
  }
};

export default realAuthService;
