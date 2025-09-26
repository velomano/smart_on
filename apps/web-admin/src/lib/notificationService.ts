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

// 알림 전송 기록 저장 (중복 방지용)
const sentNotifications = new Map<string, number>();

// 개발자 도구에서 중복 방지 메모리 클리어 (테스트용)
if (typeof window !== 'undefined') {
  (window as any).clearNotificationCooldown = () => {
    sentNotifications.clear();
    console.log('텔레그램 알림 중복 방지 메모리 초기화됨');
  };
}

// 센서 데이터 검증 및 알림 전송
export async function checkSensorDataAndNotify(sensorData: SensorData): Promise<void> {
  const settings = loadNotificationSettings();
  
  console.log('알림 설정 상태:', settings);
  
  if (!settings.telegramEnabled) {
    console.log('텔레그램 알림이 비활성화되어 있습니다.');
    return;
  }

  const { type, value, location, thresholds, timestamp } = sensorData;
  const notificationKey = `${type}_notification`;

  console.log('센서 데이터 확인:', { type, value, thresholds, location });
  console.log('알림 키:', notificationKey);
  console.log('알림 설정 확인:', (settings.notifications as any)?.[notificationKey]);
  
  // 알림이 비활성화된 경우
  const isNotificationEnabled = (settings.notifications as Record<string, any>)?.[notificationKey];
  if (!isNotificationEnabled) {
    console.log(`알림이 비활성화되어 있습니다: ${notificationKey}`);
    return;
  }

  // 현재 사용자의 텔레그램 채팅 ID 가져오기
  const currentUserChatId = await getCurrentUserTelegramChatId();
  console.log('현재 사용자 텔레그램 채팅 ID:', currentUserChatId, '길이:', currentUserChatId?.length);
  
  if (!currentUserChatId) {
    console.log('텔레그램 채팅 ID를 찾을 수 없습니다.');
    // 텔레그램 알림 없이 대시보드 알림만 진행
    console.log('텔레그램 채팅 ID가 없어서 대시보드 알림만 진행합니다.');
    try {
      dashboardAlertManager.checkSensorDataAndAlert(
        type,
        value,
        location,
        sensorData.id,
        sensorData.deviceId
      );
      console.log('대시보드 경고 알림 추가됨 (텔레그램 ID 없음)', { type, value, location, deviceId: sensorData.deviceId });
    } catch (error) {
      console.error('대시보드 알림 추가 실패:', error);
    }
    return;
  }

  // 텔레그램 채팅 ID 유효성 체크 - 실제 유효한 ID인지 확인
  const isValidTelegramId = (chatId: string): boolean => {
    // 더미/테스트 ID들 필터링 (보수적으로 필터링 - 실제 ID를 빼먹으면 안되기 때문)
    const dummyIds = ['test1_default_id', 'test1_chat', 'no-telegram-set'];
    
    if (dummyIds.includes(chatId) || chatId === '123456789') {
      return false;
    }
    
    // 실제 텔레그램 ID 형식 검증 - 조금 더 관대하게 
    const validPattern = /^-?\d+$|^@\w+$/;
    const isValid = validPattern.test(chatId) && chatId.length > 3; // 최소 길이 확인
    
    console.log('텔레그램 ID 유효성 체크:', { chatId, isValid, length: chatId.length });
    return isValid;
  };

  if (!isValidTelegramId(currentUserChatId)) {
    console.log('유효하지 않은 텔레그램 채팅 ID이므로 대시보드 알림만 진행합니다.');
    try {
      dashboardAlertManager.checkSensorDataAndAlert(
        type,
        value,
        location,
        sensorData.id,
        sensorData.deviceId
      );
      console.log('대시보드 경고 알림 추가됨 (유효하지 않은 텔레그램 ID)', { type, value, location, deviceId: sensorData.deviceId });
    } catch (error) {
      console.error('대시보드 알림 추가 실패:', error);
    }
    return;
  }

  let shouldNotify = false;
  let templateId = '';
  let variables: Record<string, string | number> = {
    location,
    current: value,
    timestamp: timestamp.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  };

  // 센서 타입별 임계값 검사
  switch (type) {
    case 'temperature':
      if (thresholds?.max && value > thresholds.max) {
        shouldNotify = true;
        templateId = 'sensor_high_temp';
        variables.threshold = thresholds.max;
      } else if (thresholds?.min && value < thresholds.min) {
        shouldNotify = true;
        templateId = 'sensor_low_temp';
        variables.threshold = thresholds.min;
      }
      break;

    case 'humidity':
      console.log('습도 검사:', { value, 'thresholds.min': thresholds?.min, 'thresholds.max': thresholds?.max });
      if (thresholds?.max && value > thresholds.max) {
        shouldNotify = true;
        templateId = 'sensor_high_humidity';
        variables.threshold = thresholds.max;
        console.log('고습도 알림시에도 발생');
      } else if (thresholds?.min && value < thresholds.min) {
        shouldNotify = true;
        templateId = 'sensor_low_humidity';
        variables.threshold = thresholds.min;
        console.log('저습도 알림시도도 발생!'); 
      }
      break;

    case 'ec':
      if (thresholds?.min && value < thresholds.min) {
        shouldNotify = true;
        templateId = 'sensor_low_ec';
        variables.threshold = thresholds.min;
      }
      break;

    case 'ph':
      if (thresholds?.min && thresholds?.max) {
        if (value < thresholds.min || value > thresholds.max) {
          shouldNotify = true;
          templateId = 'sensor_ph_abnormal';
          variables.min = thresholds.min;
          variables.max = thresholds.max;
        }
      }
      break;

    case 'water':
      if (thresholds?.min && value < thresholds.min) {
        shouldNotify = true;
        templateId = 'sensor_low_water';
        variables.threshold = thresholds.min;
      } else if (thresholds?.max && value > thresholds.max) {
        shouldNotify = true;
        templateId = 'sensor_high_water';
        variables.threshold = thresholds.max;
      }
      break;
  }

  console.log('알림 전송 여부 및 템플릿:', { shouldNotify, templateId });
  
  // 텔레그램 알림 전송 시도 (유효한 채팅 ID일 때만)
  if (shouldNotify && templateId && currentUserChatId) {
    console.log('알림 조건 충족됨, 대시보드 알림 먼저 추가');
    
    // 우선 대시보드 알림 추가
    try {
      dashboardAlertManager.checkSensorDataAndAlert(
        type,
        value,
        location,
        sensorData.id,
        sensorData.deviceId
      );
      console.log('대시보드 경고 알림 추가됨', { type, value, location, deviceId: sensorData.deviceId });
    } catch (error) {
      console.error('대시보드 알림 추가 실패:', error);
    }
    
    // 텔레그램 알림 전송 시도
    try {
      console.log('텔레그램 전송 시도:', { templateId, chatId: currentUserChatId });
      
      // 중복 방지 키 생성 (타입_위치_템플릿명)
      const notificationKey_dup = `${type}_${location}_${templateId}`;
      const currentTime = Date.now();
      const lastSentTime = sentNotifications.get(notificationKey_dup) || 0;
      
      // 이전 전송이 30분 이내면 중복 방지 (테스트를 위해 단축)
      const cooldownMinutes = 5; // 30분에서 5분으로 단축
      if (currentTime - lastSentTime < cooldownMinutes * 60 * 1000) {
        console.log('텔레그램 알림 중복 전송 방지:', notificationKey_dup, `쉬는 시간: ${cooldownMinutes}분`);
      } else {
        const result = await sendNotification(templateId, variables, currentUserChatId);
        if (result.ok) {
          console.log(`텔레그램 알림 전송 성공: ${templateId}`, variables);
          // 전송 성공 시 기록 저장
          sentNotifications.set(notificationKey_dup, currentTime);
        } else {
          console.warn('텔레그램 알림 전송 실패:', result.error);
          console.log('텔레그램 전송 실패했지만 대시보드 알림은 이미 추가됨');
          // 텔레그램 전송이 실패해도 대시보드 알림은 작동하므로 중복 전송 기록은 설정
          sentNotifications.set(notificationKey_dup, currentTime);
        }
      }
    } catch (error) {
      console.error('텔레그램 알림 전송 중 오류:', error);
      console.log('텔레그램 알림 전송 실패했지만 대시보드 알림은 이미 추가됨');
    }
  } else if (shouldNotify && templateId) {
    // 대시보드 알림만 추가 (텔레그램 채팅 ID 없음)
    try {
      dashboardAlertManager.checkSensorDataAndAlert(
        type,
        value,
        location,
        sensorData.id,
        sensorData.deviceId
      );
      console.log('대시보드 경고 알림만 추가됨 (텔레그램 ID 없음)', { type, value, location, deviceId: sensorData.deviceId });
    } catch (error) {
      console.error('대시보드 알림 추가 실패:', error);
    }
  }
}

// 시스템 상태 검증 및 알림 전송
export async function checkSystemStatusAndNotify(systemStatus: SystemStatus): Promise<void> {
  const settings = loadNotificationSettings();
  
  if (!settings.telegramEnabled) {
    return;
  }

  // 시스템 오프라인 알림
  if (!systemStatus.online && (settings.notifications as any)?.system_offline) {
    const variables = {
      location: systemStatus.location,
      lastSeen: systemStatus.lastSeen.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    };

    try {
      await sendNotification('system_offline', variables);
    } catch (error) {
      console.error('시스템 오프라인 알림 전송 실패:', error);
    }
  }
}

// 제어 시스템 오류 알림
export async function notifyControlError(
  deviceType: 'pump' | 'valve',
  deviceId: string,
  location: string,
  error: string
): Promise<void> {
  const settings = loadNotificationSettings();
  
  if (!settings.telegramEnabled) {
    return;
  }

  const templateId = deviceType === 'pump' ? 'pump_failure' : 'valve_stuck';
  
  if (!(settings.notifications as any)?.[templateId]) {
    return;
  }

  const variables = {
    location,
    [`${deviceType}Id`]: deviceId,
    status: error
  };

  try {
    await sendNotification(templateId, variables);
  } catch (error) {
    console.error(`${deviceType} 오류 알림 전송 실패:`, error);
  }
}

// 사용자 액션 알림 (예: 레시피 저장)
export async function notifyUserAction(
  action: 'nutrient_recipe_saved',
  variables: Record<string, string | number>
): Promise<void> {
  const settings = loadNotificationSettings();
  
  if (!settings.telegramEnabled || !(settings.notifications as any)?.[action]) {
    return;
  }

  try {
    await sendNotification(action, variables);
  } catch (error) {
    console.error('사용자 액션 알림 전송 실패:', error);
  }
}

// 일일 리포트 생성 및 전송
export async function sendDailyReport(reportData: {
  date: string;
  avgTemp: number;
  avgHumidity: number;
  avgEC: number;
  location: string;
}): Promise<void> {
  const settings = loadNotificationSettings();
  
  if (!settings.telegramEnabled || !(settings.notifications as any)?.daily_report) {
    return;
  }

  try {
    await sendNotification('daily_report', reportData);
  } catch (error) {
    console.error('일일 리포트 전송 실패:', error);
  }
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

