// 알림 서비스 - 센서 데이터와 연동하여 자동 알림 전송

import { sendNotification } from './notificationTemplates';
import { dashboardAlertManager } from './dashboardAlerts';

export interface SensorData {
  id: string;
  type: 'temperature' | 'humidity' | 'ec' | 'ph' | 'water';
  value: number;
  location: string;
  timestamp: Date;
  thresholds?: {
    min?: number;
    max?: number;
  };
  deviceId?: string;  // deviceId 추가
}

export interface SystemStatus {
  online: boolean;
  lastSeen: Date;
  location: string;
}

// 알림 설정 로드 (서버사이드에서는 기본값 사용)
function loadNotificationSettings() {
  // 서버사이드에서는 localStorage를 사용할 수 없으므로 기본값 반환
  if (typeof window === 'undefined') {
    return { 
      telegramEnabled: true, // 서버에서는 기본적으로 활성화
      telegramChatId: '', // 서버에서는 기본값
      notifications: {
        temperature_notification: true,
        ec_notification: true,
        ph_notification: true,
        humidity_notification: true,
        water_notification: true
      }
    };
  }
  
  const settings = localStorage.getItem('notificationSettings');
  let telegramEnabled = false;
  let telegramChatId = '';
  let notifications = {};
  
  if (!settings) {
    // 기본 알림 설정을 모두 활성화
    notifications = {
      temperature_notification: true,
      humidity_notification: true,
      ec_notification: true,
      ph_notification: true,
      water_notification: true
    };
  } else {
    const parsed = JSON.parse(settings);
    telegramEnabled = parsed.telegramEnabled || false;
    telegramChatId = parsed.telegramChatId || '';
    notifications = parsed.notifications || {
      temperature_notification: true,
      humidity_notification: true,
      ec_notification: true,
      ph_notification: true,
      water_notification: true
    };
  }
  
  // test1@test.com 계정은 강제로 알림 활성화
  if (typeof window !== 'undefined') {
    const currentUserData = localStorage.getItem('mock_user');
    if (currentUserData) {
      const currentUser = JSON.parse(currentUserData);
      if (currentUser.email === 'test1@test.com') {
        telegramEnabled = true;
        notifications = {
          temperature_notification: true,
          humidity_notification: true,
          ec_notification: true,
          ph_notification: true,
          water_notification: true
        };
      }
    }
  }
  
  return {
    telegramEnabled,
    telegramChatId,
    notifications
  };
}

// 현재 사용자의 텔레그램 채팅 ID 가져오기 (test1은 하드코딩, 다른 사용자는 저장된 값)
async function getCurrentUserTelegramChatId(): Promise<string> {
  if (typeof window === 'undefined') {
    return process.env.TELEGRAM_CHAT_ID || '';
  }
  
  try {
    // 현재 사용자 정보 가져오기
    const currentUserData = localStorage.getItem('mock_user');
    if (currentUserData) {
      const currentUser = JSON.parse(currentUserData);
      
      // test1@test.com 계정 처리
      if (currentUser.email === 'test1@test.com') {
        // 1. 사용자가 설정한 텔레그램 ID가 있는지 확인 (notificationSettings에서)
        const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
        const userDefinedChatId = settings.telegramChatId;
        
        // 사용자가 새로운 ID를 입력했거나 빈 값이 아닌 경우
        if (userDefinedChatId && userDefinedChatId.trim() !== '' && userDefinedChatId.match(/^-?\d+$|^@\w+$/)) {
          console.log('test1 계정: 사용자 입력 텔레그램 ID 사용:', userDefinedChatId);
          // 사용자 설정 ID를 test1 전용 저장에도 백업
          localStorage.setItem('test1_telegram_chat_id', userDefinedChatId);
          return userDefinedChatId;
        }
        
        // 2. 사용자 입력이 없으면 기본값 사용
        let defaultChatId = localStorage.getItem('test1_telegram_chat_id');
        
        // 저장된 ID가 없거나 잘못된 값이면 기본값 사용
        if (!defaultChatId || 
            defaultChatId === 'no-telegram-set' || 
            defaultChatId === 'test1_default_id' || 
            defaultChatId === '123456789') {
          const test1DefaultId = '6827239951';  // test1 계정용 기본 텔레그램 채팅 ID
          localStorage.setItem('test1_telegram_chat_id', test1DefaultId);
          console.log('test1 계정: 기본 텔레그램 ID 사용:', test1DefaultId);
          return test1DefaultId;
        }
        
        console.log('test1 계정 기존 텔레그램 ID 설정:', defaultChatId);
        return defaultChatId;
      }
      
      // 다른 사용자는 설정할 수 있는 텔레그램 채팅 ID 사용
      const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
      const telegramChatId = settings.telegramChatId || '';
      return telegramChatId;
    }
  } catch (error) {
    console.error('사용자 텔레그램 설정 로드 실패:', error);
  }
  
  // 기본값으로 환경변수 텔레그램 ID 사용
  const fallbackChatId = process.env.TELEGRAM_CHAT_ID || 
                         localStorage.getItem('defaultTelegramChatId') || 
                         '';
  console.log('기본값 텔레그램 ID:', fallbackChatId);
  return fallbackChatId;
}

// 알림 전송 기록 저장 (중복 방지용) - 더 강화된 검증
const sentNotifications = new Map<string, number>();
const notificationInProgress = new Set<string>(); // 처리 중인 알림 추적

// 개발자 도구에서 중복 방지 메모리 클리어 (테스트용)
if (typeof window !== 'undefined') {
  (window as any).clearNotificationCooldown = () => {
    sentNotifications.clear();
    notificationInProgress.clear();
    console.log('텔레그램 알림 중복 방지 메모리 초기화됨');
  };
}

// 센서 데이터 검증 및 알림 전송 - 완전 차단 (임시 유지)
export async function checkSensorDataAndNotify(sensorData: SensorData): Promise<void> {
  // COMPLETELY DISABLED: MQTT 서버 통신 중단 및 전역 알림 완전 차단
  console.log('🔒 알림 완전 차단됨 (모든 알림 비활성화):', sensorData.type, sensorData.location);
  return;
}

// 시스템 상태 검증 및 알림 전송
export async function checkSystemStatusAndNotify(systemStatus: SystemStatus): Promise<void> {
  // COMPLETELY DISABLED: 모든 알림 완전 차단
  console.log('🔒 시스템 상태 알림 차단됨 (MQTT 연동 전까지 알림 비활성화):', systemStatus.online);
  return;
}

// 제어 시스템 오류 알림
export async function notifyControlError(
  deviceType: 'pump' | 'valve',
  deviceId: string,
  location: string,
  error: string
): Promise<void> {
  // COMPLETELY DISABLED: 모든 알림 완전 차단
  console.log('🔒 제어 시스템 오류 알림 차단됨 (MQTT 연동 전까지 알림 비활성화):', deviceType, deviceId);
  return;
}

// 사용자 액션 알림 (예: 레시피 저장)
export async function notifyUserAction(
  action: 'nutrient_recipe_saved',
  variables: Record<string, string | number>
): Promise<void> {
  // COMPLETELY DISABLED: 모든 알림 완전 차단
  console.log('🔒 사용자 액션 알림 차단됨 (MQTT 연동 전까지 알림 비활성화):', action);
  return;
}

// 일일 리포트 생성 및 전송
export async function sendDailyReport(reportData: {
  date: string;
  avgTemp: number;
  avgHumidity: number;
  avgEC: number;
  location: string;
}): Promise<void> {
  // COMPLETELY DISABLED: 모든 알림 완전 차단
  console.log('🔒 일일 리포트 알림 차단됨 (MQTT 연동 전까지 알림 비활성화):', reportData.location);
  return;
}

// 알림 서비스 초기화 (센서 데이터 모니터링 시작)
export function initializeNotificationService() {
  console.log('🔔 알림 서비스 초기화됨');
  
  // 실제 센서 데이터와 연동할 때는 여기서 센서 데이터 스트림을 구독
  // 예: MQTT 구독, WebSocket 연결 등
  
  return {
    checkSensorDataAndNotify,
    checkSystemStatusAndNotify,
    notifyControlError,
    notifyUserAction,
    sendDailyReport
  };
}

