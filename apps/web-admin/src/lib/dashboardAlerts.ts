// 대시보드 실시간 경고 시스템

export interface DashboardAlert {
  id: string;
  type: 'sensor' | 'system' | 'control';
  level: 'low' | 'medium' | 'high' | 'critical';
  sensorType?: 'temperature' | 'humidity' | 'ec' | 'ph' | 'water';
  title: string;
  message: string;
  location: string;
  sensorValue: number;
  threshold: number;
  timestamp: Date;
  isRead: boolean;
  sensorId?: string;
  deviceId?: string;
}

export interface AlertThresholds {
  temperature: { min: number; max: number };
  humidity: { min: number; max: number };
  ec: { min: number; max: number };
  ph: { min: number; max: number };
  water: { min: number; max: number };
}

// 기본 임계값 설정
export const DEFAULT_THRESHOLDS: AlertThresholds = {
  temperature: { min: 10, max: 35 },
  humidity: { min: 30, max: 80 },
  ec: { min: 0.8, max: 3.5 },
  ph: { min: 5.5, max: 6.5 },
  water: { min: 20, max: 90 }
};

// 로컬 스토리지 키
const ALERTS_STORAGE_KEY = 'dashboard_alerts';

class DashboardAlertManager {
  private alerts: DashboardAlert[] = [];
  private listeners: Set<(alerts: DashboardAlert[]) => void> = new Set();

  constructor() {
    this.loadAlertsFromStorage();
  }

  // 알림 상태 구독
  subscribe(callback: (alerts: DashboardAlert[]) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // 알림 변경사항 전파
  private notify() {
    console.log('🔔 notify() 호출 - 구독자들에게 알림 전파:', {
      totalAlerts: this.alerts.length,
      listeners: this.listeners.size
    });
    
    this.listeners.forEach((callback, index) => {
      console.log(`🔔 구독자 ${index + 1}에게 알림 전파`);
      callback(this.alerts);
    });
    
    this.saveAlertsToStorage();
  }

  // 알림 추가
  addAlert(alert: Omit<DashboardAlert, 'id' | 'timestamp' | 'isRead'>): DashboardAlert {
    console.log('🔔 dashboardAlertManager.addAlert 호출:', alert);
    
    const newAlert: DashboardAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false
    };

    console.log('🔔 새 알림 생성:', newAlert);

    // 중복 경고 체크 (같은 센서 타입/위치/메시지는 2분간 중복 방지 - 테스트 목적으로 단축)
    const isDuplicate = this.alerts.some(existingAlert => 
      existingAlert.type === newAlert.type &&
      existingAlert.sensorType === newAlert.sensorType &&
      existingAlert.location === newAlert.location &&
      new Date().getTime() - existingAlert.timestamp.getTime() < 2 * 60 * 1000 // 2분으로 단축
    );

    if (isDuplicate) {
      console.log('🔔 중복 경고 방지 (2분):', newAlert.title);
      return newAlert;
    }

    this.alerts.unshift(newAlert); // 가장 최근 알림이 맨 위로
    this.alerts = this.alerts.slice(0, 100); // 최대 100개 알림만 유지
    
    console.log('🔔 알림 추가 완료, 총 알림 수:', this.alerts.length);
    console.log('🔔 구독자 수:', this.listeners.size);
    
    this.notify();

    return newAlert;
  }

  // 센서 데이터 체크 및 알림 생성
  checkSensorDataAndAlert(
    sensorType: string,
    value: number,
    location: string,
    sensorId?: string,
    deviceId?: string,
    thresholds?: Partial<Record<string, { min?: number; max?: number }>>
  ): DashboardAlert | null {
    const thresholdsToUse = thresholds || DEFAULT_THRESHOLDS;
    const typeThresholds = thresholdsToUse[sensorType as keyof AlertThresholds];

    if (!typeThresholds) return null;

    let alertLevel: DashboardAlert['level'] = 'low';
    let title = '';
    let message = '';
    let threshold: number = 0;

    // 센서 타입별 임계값 검사
    if (sensorType === 'temperature') {
      if (typeThresholds.max && value > typeThresholds.max) {
        alertLevel = value > 40 ? 'critical' : 'high';
        title = '🌡️ 고온 경고';
        message = `${location}에서 온도가 과도하게 높습니다.`;
        threshold = typeThresholds.max;
      } else if (typeThresholds.min && value < typeThresholds.min) {
        alertLevel = value < 5 ? 'critical' : 'medium';
        title = '❄️ 저온 경고';
        message = `${location}에서 온도가 너무 낮습니다.`;
        threshold = typeThresholds.min;
      }
    } else if (sensorType === 'humidity') {
      if (typeThresholds.max && value > typeThresholds.max) {
        alertLevel = 'medium';
        title = '💧 고습도 경고';
        message = `${location}에서 습도가 너무 높습니다.`;
        threshold = typeThresholds.max;
      }
    } else if (sensorType === 'ec') {
      if (typeThresholds.min && value < typeThresholds.min) {
        alertLevel = 'high';
        title = '🔋 저EC 경고';
        message = `${location}에서 배액 농도가 낮습니다.`;
        threshold = typeThresholds.min;
      }
    } else if (sensorType === 'ph') {
      if ((typeThresholds.min && value < typeThresholds.min) || (typeThresholds.max && value > typeThresholds.max)) {
        alertLevel = 'high';
        title = '🧪 pH 이상 경고';
        message = `${location}에서 pH가 적정 범위를 벗어났습니다.`;
        threshold = (typeThresholds.min && value < typeThresholds.min) ? typeThresholds.min : (typeThresholds.max ? typeThresholds.max : 0);
      }
    } else if (sensorType === 'water') {
      if (typeThresholds.min && value < typeThresholds.min) {
        alertLevel = value < 10 ? 'critical' : 'high';
        title = '💧 저수위 경고';
        message = `${location}에서 수위가 부족합니다.`;
        threshold = typeThresholds.min;
      } else if (typeThresholds.max && value > typeThresholds.max) {
        alertLevel = 'medium';
        title = '🌊 고수위 경고';
        message = `${location}에서 수위가 과도합니다.`;
        threshold = typeThresholds.max;
      }
    }

    if (!title) return null; // 임계값 위반이 없으면 알림 생성 안함

    const alert = this.addAlert({
      type: 'sensor',
      level: alertLevel,
      sensorType: sensorType as DashboardAlert['sensorType'],
      title,
      message,
      location,
      sensorValue: value,
      threshold,
      sensorId,
      deviceId
    });

    return alert;
  }

  // 모든 알림 조회
  getAlerts(): DashboardAlert[] {
    return this.alerts;
  }

  // 읽지 않은 알림 개수
  getUnreadCount(): number {
    return this.alerts.filter(alert => !alert.isRead).length;
  }

  // 알림 읽음 처리
  markAsRead(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      this.notify();
    }
  }

  // 모든 알림 읽음 처리
  markAllAsRead() {
    this.alerts.forEach(alert => alert.isRead = true);
    this.notify();
  }

  // 알림 삭제
  deleteAlert(alertId: string) {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.notify();
  }

  // 오래된 알림 정리 (24시간 이상 지난 읽은 알림들 삭제)
  cleanupOldAlerts() {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    this.alerts = this.alerts.filter(alert => 
      !alert.isRead || alert.timestamp > oneDayAgo
    );
    this.notify();
  }

  // 로컬 스토리지에서 알림 로드
  private loadAlertsFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (stored) {
        this.alerts = JSON.parse(stored).map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp)
        }));
      }
    } catch (error) {
      console.error('알림 데이터 로드 실패:', error);
      this.alerts = [];
    }
  }

  // 로컬 스토리지에 알림 저장
  private saveAlertsToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('알림 데이터 저장 실패:', error);
    }
  }

  // 구독자에게 최신 알림 전송
  forceUpdate() {
    this.notify();
  }
}

// 싱글톤 인스턴스
export const dashboardAlertManager = new DashboardAlertManager();
