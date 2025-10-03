'use client';

import { getSupabaseClient } from './supabase';
// supaAdmin import 제거 - API 라우트를 통해 서버 사이드에서 처리
import { AuthUser } from './auth';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  is_approved: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  notification_preferences?: {
    // 기존 알림 유형들
    email?: boolean;
    telegram?: boolean;
    dashboard?: boolean;
    ph_alerts?: boolean;
    water_level?: boolean;
    low_humidity?: boolean;
    sensor_alerts?: boolean;
    system_alerts?: boolean;
    high_temperature?: boolean;
    
          // 센서 기반 알림 유형들
          temperature_notification?: boolean;
          humidity_notification?: boolean;
          ec_notification?: boolean;
          ph_notification?: boolean;
          water_notification?: boolean;
          nutrient_temperature_notification?: boolean;
          // 24절기 알림
          season_notification?: boolean;
    
    [key: string]: boolean | undefined;
  };
  telegram_chat_id?: string;
  telegram_bot_token?: string;
  ui_preferences?: {
    language?: string;
    theme?: string;
  };
  dashboard_preferences?: {
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export class UserService {
  /**
   * 사용자 기본 정보 조회 (users 테이블)
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const supabase = getSupabaseClient();
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('사용자 조회 오류:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('사용자 조회 중 오류:', error);
      return null;
    }
  }

  /**
   * 사용자 권한 정보 조회 (users 테이블 우선, memberships 테이블 참고)
   */
  static async getUserRoleInfo(userId: string): Promise<{
    role?: string;
    tenant_id?: string;
    team_id?: string;
    team_name?: string;
  } | null> {
    try {
      const supabase = getSupabaseClient();
      
      // users 테이블에서 기본 정보 조회 (최고관리자가 수정한 권한이 최종 권한)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, team_id, team_name, tenant_id')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.warn('사용자 기본 정보 조회 실패:', userError);
        return null;
      }

      if (!userData) {
        console.warn('사용자 정보가 없습니다:', userId);
        return null;
      }

      // memberships 테이블에서 추가 정보 조회 (참고용)
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('role, tenant_id, team_id')
        .eq('user_id', userId)
        .maybeSingle();

      let teamName = userData.team_name;
      
      // team_id가 있으면 teams 테이블에서 팀 이름 조회
      if (userData.team_id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('name')
          .eq('id', userData.team_id)
          .maybeSingle();
        
        if (teamData) {
          teamName = teamData.name;
        }
      }

      return {
        role: userData.role, // users 테이블의 role이 최종 권한
        tenant_id: userData.tenant_id,
        team_id: userData.team_id,
        team_name: teamName
      };
    } catch (error) {
      console.error('사용자 권한 정보 조회 중 오류:', error);
      return null;
    }
  }

  /**
   * 사용자 설정 조회
   */
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116은 데이터가 없을 때 에러
        console.error('사용자 설정 조회 오류:', error);
        return null;
      }

      // 설정이 없는 경우 기본 설정 생성
      if (!settings) {
        return await this.createDefaultUserSettings(userId);
      }

      return settings;
    } catch (error) {
      console.error('사용자 설정 조회 중 오류:', error);
      return null;
    }
  }

  /**
   * 기본 사용자 설정 생성
   */
  static async createDefaultUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const supabase = getSupabaseClient();
      
      const defaultSettings = {
        user_id: userId,
        notification_preferences: {
          temperature_notification: true,
          ec_notification: true,
          ph_notification: true,
          humidity_notification: true,
          water_notification: true
        },
        ui_preferences: {
          language: 'ko',
          theme: 'light'
        },
        dashboard_preferences: {
          showTeamBedsOnDashboard: true,
          showAllBedsInBedManagement: false
        }
      };

      console.log('🔍 기본 사용자 설정 생성 시도:', {
        userId,
        defaultSettings
      });

      // API 라우트를 통해 서버 사이드에서 처리
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 응답 오류:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`사용자 설정 생성 실패: ${errorData.error || response.statusText}`);
      }

      const responseData = await response.json();
      const { data: settings, error } = responseData;

      console.log('🔍 Supabase 응답:', {
        data: settings,
        error: error,
        errorType: typeof error,
        errorKeys: error ? Object.keys(error) : 'no error'
      });

      if (error) {
        console.error('기본 사용자 설정 생성 오류:', {
          error: error.message || error,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error,
          userId,
          defaultSettings
        });
        return null;
      }

      return settings;
    } catch (error) {
      console.error('기본 사용자 설정 생성 중 오류:', error);
      return null;
    }
  }

  /**
   * 사용자 프로필 업데이트
   */
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('사용자 프로필 업데이트 오류:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('사용자 프로필 업데이트 중 오류:', error);
      return false;
    }
  }

  /**
   * 사용자 설정 업데이트
   */
  static async updateUserSetting(userId: string, settingKey: string, value: any): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: existingSettings, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('기존 설정 조회 오류:', fetchError);
        return false;
      }

      const settingsUpdate = {
        user_id: userId,
        ...existingSettings,
        [settingKey]: value,
        updated_at: new Date().toISOString()
      };

      const { error: insertOrUpdateError } = existingSettings
        ? await supabase
            .from('user_settings')
            .update(settingsUpdate)
            .eq('user_id', userId)
        : await supabase
            .from('user_settings')
            .insert(settingsUpdate);

      if (insertOrUpdateError) {
        console.error('사용자 설정 업데이트 오류:', insertOrUpdateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('사용자 설정 업데이트 중 오류:', error);
      return false;
    }
  }

  /**
   * 전체 사용자 설정 업데이트
   */
  static async updateAllUserSettings(userId: string, settings: Partial<UserSettings>): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: existingSettings, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      const settingsData = {
        user_id: userId,
        ...existingSettings,
        ...settings,
        updated_at: new Date().toISOString()
      };

      const { error: insertOrUpdateError } = existingSettings
        ? await supabase
            .from('user_settings')
            .update(settingsData)
            .eq('user_id', userId)
        : await supabase
            .from('user_settings')
            .insert(settingsData);

      if (insertOrUpdateError) {
        console.error('사용자 설정 업데이트 오류:', insertOrUpdateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('사용자 설정 업데이트 중 오류:', error);
      return false;
    }
  }

  /**
   * Supabase Auth 기반 현재 사용자 정보 가져오기 (Graceful Error Handling)
   */
  static async getCurrentSupabaseUser(): Promise<{ id: string; email?: string; user_metadata?: any } | null> {
    try {
      const supabase = getSupabaseClient();
      
      // 먼저 세션이 존재하는지 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.warn('Supabase 세션 없음 - 로컬 인증으로 전환:', sessionError?.message);
        return null;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.warn('Supabase 사용자 조회 오류 - 로컬 인증으로 전환:', error.message);
        return null;
      }

      if (!user || !user.id) {
        console.warn('Supabase 사용자 정보 없음 - 로컬 인증으로 전환');
        return null;
      }

      return user;
    } catch (error) {
      console.warn('Supabase 인증 체크 중 오류 - 로컬 인증으로 전환:', error);
      return null;
    }
  }

  /**
   * 비밀번호 변경 (Supabase Auth)
   */
  static async updatePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('비밀번호 변경 오류:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('비밀번호 변경 중 오류:', error);
      return false;
    }
  }

  /**
   * 마이페이지용 통합 사용자 정보 조회 (기존 스키마 기반)
   */
  static async getMyPageData(userId: string): Promise<{
    profile: UserProfile | null;
    settings: UserSettings | null;
    roleInfo: { role?: string; tenant_id?: string } | null;
  }> {
    try {
      const [profile, settings, roleInfo] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserSettings(userId),
        this.getUserRoleInfo(userId)
      ]);

      return { profile, settings, roleInfo };
    } catch (error) {
      console.error('마이페이지 데이터 조회 중 오류:', error);
      return { profile: null, settings: null, roleInfo: null };
    }
  }
}
