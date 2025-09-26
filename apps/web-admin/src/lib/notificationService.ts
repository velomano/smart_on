// 알림 서비스 - 센서 데이터와 연동하여 자동 알림 전송

import { sendNotification } from './notificationTemplates';

export interface SensorData {
  id: string;
  type: 'temperature' | 'humidity' | 'ec' | 'ph';
  value: number;
  location: string;
  timestamp: Date;
  thresholds?: {
    min?: number;
    max?: number;
  };
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
  if (!settings) return { telegramEnabled: false, notifications: {} };
  
  const parsed = JSON.parse(settings);
  return {
    telegramEnabled: parsed.telegramEnabled || false,
    notifications: parsed.notifications || {}
  };
}

// 센서 데이터 검증 및 알림 전송
export async function checkSensorDataAndNotify(sensorData: SensorData): Promise<void> {
  const settings = loadNotificationSettings();
  
  if (!settings.telegramEnabled) {
    console.log('텔레그램 알림이 비활성화되어 있습니다.');
    return;
  }

  const { type, value, location, thresholds, timestamp } = sensorData;
  const notificationKey = `${type}_notification`;
  
  // 알림이 비활성화된 경우
  if (!settings.notifications[notificationKey]) {
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
      if (thresholds?.max && value > thresholds.max) {
        shouldNotify = true;
        templateId = 'sensor_high_humidity';
        variables.threshold = thresholds.max;
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

  // 알림 전송
  if (shouldNotify && templateId) {
    try {
      const result = await sendNotification(templateId, variables);
      if (result.ok) {
        console.log(`알림 전송 성공: ${templateId}`, variables);
      } else {
        console.error('알림 전송 실패:', result.error);
      }
    } catch (error) {
      console.error('알림 전송 중 오류:', error);
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
  if (!systemStatus.online && settings.notifications.system_offline) {
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
  
  if (!settings.notifications[templateId]) {
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
  
  if (!settings.telegramEnabled || !settings.notifications[action]) {
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
  
  if (!settings.telegramEnabled || !settings.notifications.daily_report) {
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
