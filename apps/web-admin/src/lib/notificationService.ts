// 알림 서비스 - 센서 데이터와 연동하여 자동 알림 전송

import { sendNotification } from './notificationTemplates';
import { dashboardAlertManager } from './dashboardAlerts';

export interface SensorData {
  id: string;
  type: 'temperature' | 'humidity' | 'ec' | 'ph' | 'water';
  value: number;
  location: string;
  timestamp: Date;
  unit?: string;  // 센서 데이터 단위 추가
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

// 알림 설정 인터페이스
export interface NotificationSettings {
  telegramEnabled: boolean;
  telegramChatId: string;
  notifications: {
    temperature_notification: boolean;
    humidity_notification: boolean;
    ec_notification: boolean;
    ph_notification: boolean;
    water_notification: boolean;
  };
}

// 알림 설정 로드 (서버사이드에서는 기본값 사용)
export function loadNotificationSettings(): NotificationSettings {
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
  
  // test1@test.com은 강제로 텔레그램 알림 활성화 (개발/관리자 계정)
  if (typeof window !== 'undefined') {
    const currentUserData = localStorage.getItem('mock_user');
    if (currentUserData) {
      try {
        const currentUser = JSON.parse(currentUserData);
        if (currentUser.email === 'test1@test.com') {
          return {
            telegramEnabled: true,
            telegramChatId: 'test1_default_id',
            notifications: {
              temperature_notification: true,
              ec_notification: true,
              ph_notification: true,
              humidity_notification: true,
              water_notification: true
            }
          };
        }
      } catch (error) {
        console.error('test1 계정 설정 로드 실패:', error);
      }
    }
  }
  
  return {
    telegramEnabled,
    telegramChatId,
    notifications
  };
}

// 알림 설정 저장
export function saveNotificationSettings(settings: NotificationSettings) {
  if (typeof window === 'undefined') {
    return; // 서버사이드에서는 저장하지 않음
  }
  
  try {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    console.log('알림 설정이 저장되었습니다:', settings);
  } catch (error) {
    console.error('알림 설정 저장 실패:', error);
    throw error;
  }
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
      
      // test1 계정 특별 처리 (하드코딩된 ID 반환)
      if (currentUser.email === 'test1@test.com') {
        console.log('test1 계정 텔레그램 ID 사용됨');
        return 'test1_default_id'; // test1 계정용 특별 ID
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

// 텔레그램 알림 전송 함수
async function sendNotificationToTelegram(
  alertType: string,
  location: string,
  value: any,
  unit: string,
  timestamp: string | Date,
  chatId: string
): Promise<void> {
  try {
    const message = `🚨 ${alertType} 알림
위치: ${location}
값: ${value}${unit}
시간: ${new Date(timestamp).toLocaleString()}`;

    const response = await fetch('/api/notifications/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        chatId
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('텔레그램 알림 전송 실패:', result.error);
    }
  } catch (error) {
    console.error('텔레그램 API 호출 에러:', error);
  }
}

// 센서 데이터 검증 및 알림 전송 - 실제 센서 이상치값 감지 시에만 작동
export async function checkSensorDataAndNotify(sensorData: SensorData): Promise<void> {
  try {
    console.log('🔍 센서 데이터 체크:', {
      type: sensorData.type,
      value: sensorData.value,
      location: sensorData.location,
      thresholds: sensorData.thresholds
    });

    // dashboardAlertManager를 사용하여 센서 데이터 체크 및 알림 생성
    const alert = dashboardAlertManager.checkSensorDataAndAlert(
      sensorData.type,
      sensorData.value,
      sensorData.location,
      sensorData.id,
      sensorData.deviceId,
      sensorData.thresholds ? { [sensorData.type]: sensorData.thresholds } : undefined
    );

    // 알림이 생성되었을 때만 텔레그램으로 전송
    if (alert) {
      console.log('🚨 센서 이상치 감지, 텔레그램 알림 전송:', alert.title);
      
      try {
        const chatId = await getCurrentUserTelegramChatId();
        if (chatId) {
          await sendNotificationToTelegram(
            sensorData.type, 
            sensorData.location, 
            sensorData.value, 
            sensorData.unit || '', 
            sensorData.timestamp, 
            chatId
          );
          console.log('✅ 텔레그램 알림 전송 완료');
        } else {
          console.warn('⚠️ 텔레그램 채팅 ID가 설정되지 않음');
        }
      } catch (error) {
        console.error('❌ 텔레그램 알림 전송 실패:', error);
      }
    } else {
      console.log('✅ 센서 데이터 정상 범위');
    }
  } catch (error) {
    console.error('센서 데이터 알림 처리 실패:', error);
  }
}

// 시스템 상태 검증 및 알림 전송 - 실제 시스템 이상 상황 감지 시에만 작동
export async function checkSystemStatusAndNotify(systemStatus: SystemStatus): Promise<void> {
  try {
    console.log('🔍 시스템 상태 체크:', {
      online: systemStatus.online,
      lastSeen: systemStatus.lastSeen,
      location: systemStatus.location
    });

    // 시스템 오프라인 감지
    if (!systemStatus.online) {
      const alert = dashboardAlertManager.addAlert({
        type: 'system',
        level: 'critical',
        title: '🔌 시스템 오프라인',
        message: `${systemStatus.location}에서 시스템이 오프라인 상태입니다.`,
        location: systemStatus.location,
        sensorValue: 0,
        threshold: 0
      });

      console.log('🚨 시스템 오프라인 감지, 텔레그램 알림 전송:', alert.title);
      
      try {
        const chatId = await getCurrentUserTelegramChatId();
        if (chatId) {
          await sendNotificationToTelegram(
            'system_offline',
            systemStatus.location,
            '오프라인',
            '',
            systemStatus.lastSeen,
            chatId
          );
          console.log('✅ 시스템 오프라인 텔레그램 알림 전송 완료');
        } else {
          console.warn('⚠️ 텔레그램 채팅 ID가 설정되지 않음');
        }
      } catch (error) {
        console.error('❌ 시스템 오프라인 텔레그램 알림 전송 실패:', error);
      }
    } else {
      console.log('✅ 시스템 정상 온라인 상태');
    }
  } catch (error) {
    console.error('시스템 상태 알림 처리 실패:', error);
  }
}

// 제어 시스템 오류 알림 - 실제 제어 장치 오류 감지 시에만 작동
export async function notifyControlError(
  deviceType: 'pump' | 'valve',
  deviceId: string,
  location: string,
  error: string
): Promise<void> {
  try {
    console.log('🔍 제어 시스템 오류 체크:', {
      deviceType,
      deviceId,
      location,
      error
    });

    const alert = dashboardAlertManager.addAlert({
      type: 'control',
      level: 'critical',
      title: deviceType === 'pump' ? '🔧 펌프 고장' : '🚰 밸브 고착',
      message: `${location}에서 ${deviceType === 'pump' ? '펌프' : '밸브'} 오류가 발생했습니다: ${error}`,
      location: location,
      sensorValue: 0,
      threshold: 0,
      deviceId: deviceId
    });

    console.log('🚨 제어 시스템 오류 감지, 텔레그램 알림 전송:', alert.title);
    
    try {
      const chatId = await getCurrentUserTelegramChatId();
      if (chatId) {
        await sendNotificationToTelegram(
          deviceType === 'pump' ? 'pump_failure' : 'valve_stuck',
          location,
          error,
          '',
          new Date(),
          chatId
        );
        console.log('✅ 제어 시스템 오류 텔레그램 알림 전송 완료');
      } else {
        console.warn('⚠️ 텔레그램 채팅 ID가 설정되지 않음');
      }
    } catch (error) {
      console.error('❌ 제어 시스템 오류 텔레그램 알림 전송 실패:', error);
    }
  } catch (error) {
    console.error('제어 시스템 오류 알림 처리 실패:', error);
  }
}

// 사용자 액션 알림 - 완전 차단 (자동 알림으로 인한 봇 차단 방지)
export async function notifyUserAction(
  action: 'nutrient_recipe_saved',
  variables: Record<string, string | number>
): Promise<void> {
  console.log('🚫 자동 사용자 액션 알림 완전 차단됨 (봇 차단 방지)');
  return; // 완전 차단
}

// 일일 리포트 생성 및 전송 - 완전 차단 (자동 알림으로 인한 봇 차단 방지)
export async function sendDailyReport(reportData: {
  date: string;
  avgTemp: number;
  avgHumidity: number;
  avgEC: number;
  location: string;
}): Promise<void> {
  console.log('🚫 자동 일일 리포트 알림 완전 차단됨 (봇 차단 방지)');
  return; // 완전 차단
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

