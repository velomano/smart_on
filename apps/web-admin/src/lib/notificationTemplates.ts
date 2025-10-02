// 알림 템플릿 시스템

export interface NotificationTemplate {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'sensor' | 'control' | 'system' | 'user';
}

export const notificationTemplates: Record<string, NotificationTemplate> = {
  // 센서 관련 알림
  sensor_high_temp: {
    id: 'sensor_high_temp',
    title: '🌡️ 고온 경고',
    message: '<b>고온 경고</b>\n\n📍 위치: {location}\n🌡️ 현재 온도: {current}°C\n⚠️ 임계값: {threshold}°C\n⏰ 시간: {timestamp}',
    priority: 'high',
    category: 'sensor'
  },

  sensor_low_water: {
    id: 'sensor_low_water',
    title: '💧 저수위 경고',
    message: '<b>저수위 경고</b>\n\n📍 위치: {location}\n💧 현재 수위: {current}%\n⚠️ 최소 수위: {threshold}%\n⏰ 시간: {timestamp}',
    priority: 'critical',
    category: 'sensor'
  },

  sensor_high_water: {
    id: 'sensor_high_water',
    title: '🌊 고수위 경고',
    message: '<b>고수위 경고</b>\n\n📍 위치: {location}\n🌊 현재 수위: {current}%\n⚠️ 최대 수위: {threshold}%\n⏰ 시간: {timestamp}',
    priority: 'high',
    category: 'sensor'
  },
  
  sensor_low_temp: {
    id: 'sensor_low_temp',
    title: '❄️ 저온 경고',
    message: '<b>저온 경고</b>\n\n📍 위치: {location}\n🌡️ 현재 온도: {current}°C\n⚠️ 임계값: {threshold}°C\n⏰ 시간: {timestamp}',
    priority: 'high',
    category: 'sensor'
  },

  sensor_high_humidity: {
    id: 'sensor_high_humidity',
    title: '💧 고습도 경고',
    message: '<b>고습도 경고</b>\n\n📍 위치: {location}\n💧 현재 습도: {current}%\n⚠️ 임계값: {threshold}%\n⏰ 시간: {timestamp}',
    priority: 'medium',
    category: 'sensor'
  },

  sensor_low_humidity: {
    id: 'sensor_low_humidity',
    title: '🌵 저습도 경고',
    message: '<b>저습도 경고</b>\n\n📍 위치: {location}\n🌵 현재 습도: {current}%\n⚠️ 임계값: {threshold}%\n⏰ 시간: {timestamp}',
    priority: 'medium',
    category: 'sensor'
  },

  sensor_low_ec: {
    id: 'sensor_low_ec',
    title: '🔋 저EC 경고',
    message: '<b>저EC 경고</b>\n\n📍 위치: {location}\n🔋 현재 EC: {current} mS/cm\n⚠️ 임계값: {threshold} mS/cm\n⏰ 시간: {timestamp}',
    priority: 'high',
    category: 'sensor'
  },

  sensor_ph_abnormal: {
    id: 'sensor_ph_abnormal',
    title: '⚗️ pH 이상',
    message: '<b>pH 이상</b>\n\n📍 위치: {location}\n⚗️ 현재 pH: {current}\n⚠️ 정상 범위: {min} - {max}\n⏰ 시간: {timestamp}',
    priority: 'high',
    category: 'sensor'
  },

  // 제어 시스템 관련 알림
  pump_failure: {
    id: 'pump_failure',
    title: '🔧 펌프 고장',
    message: '<b>펌프 고장</b>\n\n📍 위치: {location}\n🔧 펌프 ID: {pumpId}\n⚠️ 상태: {status}\n⏰ 시간: {timestamp}',
    priority: 'critical',
    category: 'control'
  },

  valve_stuck: {
    id: 'valve_stuck',
    title: '🚰 밸브 고착',
    message: '<b>밸브 고착</b>\n\n📍 위치: {location}\n🚰 밸브 ID: {valveId}\n⚠️ 상태: {status}\n⏰ 시간: {timestamp}',
    priority: 'high',
    category: 'control'
  },

  // 시스템 관련 알림
  system_offline: {
    id: 'system_offline',
    title: '🔌 시스템 오프라인',
    message: '<b>시스템 오프라인</b>\n\n📍 위치: {location}\n🔌 마지막 연결: {lastSeen}\n⏰ 감지 시간: {timestamp}',
    priority: 'critical',
    category: 'system'
  },

  power_failure: {
    id: 'power_failure',
    title: '⚡ 정전',
    message: '<b>정전 발생</b>\n\n📍 위치: {location}\n⚡ 백업 전원: {backupStatus}\n⏰ 시간: {timestamp}',
    priority: 'critical',
    category: 'system'
  },

  system_alert: {
    id: 'system_alert',
    title: '⚠️ 시스템 경고',
    message: '<b>시스템 경고</b>\n\n⚠️ 시스템 이상 상황이 발생했습니다.\n📍 위치: {location}\n⏰ 시간: {timestamp}',
    priority: 'high',
    category: 'system'
  },

  maintenance_reminder: {
    id: 'maintenance_reminder',
    title: '🔧 관리 작업 알림',
    message: '<b>관리 작업 알림</b>\n\n🔧 정기 관리 시기가 되었습니다.\n📅 스케줄을 확인해주세요.\n⏰ 시간: {timestamp}',
    priority: 'medium',
    category: 'user'
  },

  // 사용자 관련 알림
  nutrient_recipe_saved: {
    id: 'nutrient_recipe_saved',
    title: '🧪 레시피 저장 완료',
    message: '<b>배양액 레시피 저장</b>\n\n🌱 작물: {crop}\n📏 용량: {volume}L\n👤 저장자: {user}\n⏰ 시간: {timestamp}',
    priority: 'low',
    category: 'user'
  },

  daily_report: {
    id: 'daily_report',
    title: '📊 일일 리포트',
    message: '<b>일일 시스템 리포트</b>\n\n📅 날짜: {date}\n🌡️ 평균 온도: {avgTemp}°C\n💧 평균 습도: {avgHumidity}%\n🔋 평균 EC: {avgEC} mS/cm\n⏰ 생성 시간: {timestamp}',
    priority: 'low',
    category: 'user'
  }
};

// 템플릿 메시지 생성 함수
export function generateNotificationMessage(
  templateId: string, 
  variables: Record<string, string | number>
): string {
  const template = notificationTemplates[templateId];
  
  if (!template) {
    throw new Error(`알림 템플릿을 찾을 수 없습니다: ${templateId}`);
  }

  let message = template.message;
  
  // 변수 치환
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), String(value));
  });

  // 현재 시간 추가 (timestamp가 없는 경우)
  if (!variables.timestamp) {
    const now = new Date().toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    message = message.replace('{timestamp}', now);
  }

  return `${template.title}\n\n${message}`;
}

// 알림 전송 함수 - 사용자의 실제 채팅 ID 사용
export async function sendNotification(
  templateId: string,
  variables: Record<string, string | number>,
  chatId?: string,
  userId?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const message = generateNotificationMessage(templateId, variables);
    const telegramResponse = await fetch('/api/notifications/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        chatId,
        userId
      }),
    });

    const result = await telegramResponse.json();
    
    if (!result.ok) {
      return {
        ok: false,
        error: result.error || '텔레그램 전송 실패'
      };
    }

    return {
      ok: true
    };
  } catch (error) {
    console.error('sendNotification 에러:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}
