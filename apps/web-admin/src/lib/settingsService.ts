// 🔧 사용자 설정 데이터베이스 저장 서비스
// localStorage에서 Supabase DB로 전환하는 서비스

import { createSbServer } from './db';

export interface NotificationPreferences {
  telegramEnabled?: boolean;
  telegramChatId?: string;
  telegramBotToken?: string;
  temperature_notification?: boolean;
  ec_notification?: boolean;
  ph_notification?: boolean;
  humidity_notification?: boolean;
  water_notification?: boolean;
  [key: string]: boolean | string | undefined;
}

export interface UIPreferences {
  language?: string;
  theme?: string;
  sidebar?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface DashboardPreferences {
  showTeamBedsOnDashboard?: boolean;
  showAllBedsInBedManagement?: boolean;
  [key: string]: boolean | undefined;
}

export interface UserSettings {
  notification_preferences?: NotificationPreferences;
  telegram_chat_id?: string;
  telegram_bot_token?: string;
  ui_preferences?: UIPreferences;
  dashboard_preferences?: DashboardPreferences;
}

export class SettingsService {
  private supabase: ReturnType<typeof createSbServer> | null = createSbServer();

  constructor() {
    if (!this.supabase) {
      console.warn('Supabase 연결이 필요합니다. 기능이 제한됩니다.');
    }
  }

  // 📖 설정 읽기
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      if (!this.supabase) return this.getDefaultSettings();

      const { data, error } = await this.supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('사용자 설정 조회 실패:', error);
        return this.getDefaultSettings();
      }

      return data ? {
        notification_preferences: data.notification_preferences,
        ui_preferences: data.ui_preferences,
        dashboard_preferences: data.dashboard_preferences,
        telegram_chat_id: data.telegram_chat_id,
        telegram_bot_token: data.telegram_bot_token
      } : this.getDefaultSettings();

    } catch (error: any) {
      console.error('사용자 설정 조회 API 에러:', error);
      return this.getDefaultSettings();
    }
  }

  // 💾 설정 저장
  async saveUserSettings(userId: string, settings: UserSettings): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) return { success: false, error: 'Supabase 연결이 필요합니다.' };

      const { notification_preferences, ui_preferences, dashboard_preferences, telegram_chat_id, telegram_bot_token } = settings;
      
      const { error: insertError } = await this.supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          notification_preferences: notification_preferences || {},
          ui_preferences: ui_preferences || {},
          dashboard_preferences: dashboard_preferences || {},
          telegram_chat_id: telegram_chat_id,
          telegram_bot_token: telegram_bot_token
        }, {
          onConflict: 'user_id'
        });

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      return { success: true };

    } catch (error: any) {
      console.error('설정 저장 API 에러:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔔 알림 설정 전용 저장
  async saveNotificationSettings(userId: string, notificationPrefs: NotificationPreferences): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) return { success: false, error: 'Supabase 연결이 필요합니다.' };

      const { error } = await this.supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          notification_preferences: notificationPrefs
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error: any) {
      console.error('알림 설정 저장 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // ⚙️ UI 설정 전용 저장
  async saveUISettings(userId: string, uiPrefs: UIPreferences): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) return { success: false, error: 'Supabase 연결이 필요합니다.' };

      const { error } = await this.supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ui_preferences: uiPrefs
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error: any) {
      console.error('UI 설정 저장 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // 📊 대시보드 설정 전용 저장
  async saveDashboardSettings(userId: string, dashboardPrefs: DashboardPreferences): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) return { success: false, error: 'Supabase 연결이 필요합니다.' };

      const { error } = await this.supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          dashboard_preferences: dashboardPrefs
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error: any) {
      console.error('대시보드 설정 저장 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // 📋 localStorage에서 기존 설정을 DB로 마이그레이션
  async migrateFromLocalStorage(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      // 브라우저 환경이 아니면 건너뛰기
      if (typeof window === 'undefined') {
        return { success: true, message: '서버사이드에서는 localStorage 마이그레이션 건너뜀' };
      }

      const existingSettings = localStorage.getItem('notificationSettings');
      const userSettings = localStorage.getItem(`user_settings_${userId}`);
      
      let hasMigrated = false;
      let savedCount = 0;

      // 알림 설정 마이그레이션
      if (existingSettings) {
        const oldSettings = JSON.parse(existingSettings);
        const result = await this.saveNotificationSettings(userId, {
          telegramEnabled: oldSettings.telegramEnabled,
          telegramChatId: oldSettings.telegramChatId,
          telegramBotToken: oldSettings.botToken,
          ...oldSettings.notifications
        });
        
        if (result.success) {
          savedCount++;
          hasMigrated = true;
          // 성공한 후 기존 데이터 삭제 (선택사항)
          localStorage.removeItem('notificationSettings');
        }
      }

      // 사용자 설정 마이그레이션
      if (userSettings) {
        const oldUserSettings = JSON.parse(userSettings);
        const result = await this.saveDashboardSettings(userId, oldUserSettings);
        
        if (result.success) {
          savedCount++;
          hasMigrated = true;
          // 성공한 후 기존 데이터 삭제 (선택사항)
          localStorage.removeItem(`user_settings_${userId}`);
        }
      }

      return { 
        success: true, 
        message: hasMigrated ? 
          `${savedCount}개의 설정이 DB로 마이그레이션되었습니다.` : 
          '마이그레이션할 기존 설정이 없습니다.' 
      };

    } catch (error: any) {
      console.error('localStorage 마이그레이션 실패:', error);
      return { success: false, message: error.message };
    }
  }

  // 📖 localStorage에서 fallback을 위한 설정 불러오기
  private getDefaultSettings(): UserSettings {
    return {
      notification_preferences: {
        telegramEnabled: false,
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
  }

  // 🔄 settings 검증 및 정리
  private validateSettings(settings: UserSettings): UserSettings {
    // 필수 필드 확인 및 기본값 보충
    return {
      notification_preferences: {
        telegramEnabled: false,
        temperature_notification: true,
        ec_notification: true,
        ph_notification: true,
        humidity_notification: true,
        water_notification: true,
        ...settings.notification_preferences
      },
      ui_preferences: {
        language: 'ko',
        theme: 'light',
        ...settings.ui_preferences
      },
      dashboard_preferences: {
        showTeamBedsOnDashboard: true,
        showAllBedsInBedManagement: false,
        ...settings.dashboard_preferences
      }
    };
  }
}

// 🌐 전역 서비스 인스턴스
export const settingsService = new SettingsService();
export default settingsService;
