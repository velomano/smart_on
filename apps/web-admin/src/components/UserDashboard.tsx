'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, getTeams, getApprovedUsers, getUserSettings, updateUserSettings } from '../lib/auth';
import { Farm, Device, Sensor, SensorReading } from '../lib/supabase';
// Mock 시스템 제거됨 - 실제 Supabase 데이터 사용
import AppHeader from './AppHeader';
import NotificationButton from './NotificationButton';
import { dashboardAlertManager } from '../lib/dashboardAlerts';
//import { checkSensorDataAndNotify } from '../lib/notificationService';
const ALERTS_DISABLED_MESSAGE = "🔒 ALERTS COMPLETELY DISABLED";

// Hard-coded stub to replace checkSensorDataAndNotify to ensure complete disable of alerts
async function checkSensorDataAndNotify(sensorData: any) {
  console.log(
    '🔒 PERMANENT DISABLED - checkSensorDataAndNotify stub called:',
    sensorData.type,
    sensorData.location
  );
  // Return immediately without any actions whatsoever
  return;
}
import { DashboardAlert } from '../lib/dashboardAlerts';

interface UserDashboardProps {
  user: AuthUser;
  farms: any[];
  devices: any[];
  sensors: any[];
  sensorReadings: any[];
}

export default function UserDashboard({ user, farms, devices, sensors, sensorReadings }: UserDashboardProps) {
  const [recipeStats, setRecipeStats] = useState({ total: 0, today: 0 });
  const [weatherData, setWeatherData] = useState({
    temperature: 0,
    humidity: 0,
    precipitation: 0,
    weatherStatus: '맑음',
    region: '서울'
  });

  // 배양액 레시피 통계 가져오기
  useEffect(() => {
    const fetchRecipeStats = async () => {
      try {
        // 전체 레시피 개수
        const totalResponse = await fetch('/api/nutrients/browse?limit=1');
        const totalResult = await totalResponse.json();
        
        // 오늘 추가된 레시피 개수
        const today = new Date().toISOString().split('T')[0];
        const todayResponse = await fetch(`/api/nutrients/browse?limit=100&created_after=${today}`);
        const todayResult = await todayResponse.json();
        
        setRecipeStats({
          total: totalResult.pagination?.total || 0,
          today: todayResult.recipes?.length || 0
        });
      } catch (error) {
        console.error('레시피 통계 가져오기 실패:', error);
        setRecipeStats({ total: 0, today: 0 });
      }
    };

    fetchRecipeStats();
  }, []);

  // 날씨 데이터 가져오기
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const region = user.weather_region || '서울';
        console.log('날씨 데이터 요청:', region);
        
        const response = await fetch(`/api/weather?region=${encodeURIComponent(region)}`);
        
        if (!response.ok) {
          console.error('날씨 API HTTP 오류:', response.status, response.statusText);
          return;
        }
        
        const result = await response.json();
        console.log('날씨 API 응답:', result);
        
        if (result.ok) {
          setWeatherData(result.data);
        } else {
          console.error('날씨 데이터 가져오기 실패:', {
            error: result.error,
            region: region,
            status: response.status
          });
        }
      } catch (error) {
        console.error('날씨 API 호출 실패:', {
          error: error,
          region: user.weather_region || '서울'
        });
      }
    };

    fetchWeatherData();
    
    // 10분마다 날씨 데이터 업데이트
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user.weather_region]);
  
  // 베드 정렬 함수 (농장관리 페이지와 동일)
  const sortBeds = (beds: Device[]) => {
    return beds.sort((a, b) => {
      // 1. 베드 이름에서 숫자 추출하여 정렬
      const getBedNumber = (device: Device) => {
        const location = String(device.meta?.location || '');
        
        // 베드-1, 베드-2 형태에서 숫자 추출
        const bedMatch = location.match(/베드-?(\d+)/);
        if (bedMatch) {
          return parseInt(bedMatch[1], 10);
        }
        
        // 조1-베드1, 농장1-베드2 형태에서 베드 번호 추출
        const joMatch = location.match(/조\d+-베드(\d+)/);
        if (joMatch) {
          return parseInt(joMatch[1], 10);
        }
        
        const farmMatch = location.match(/농장\d+-베드(\d+)/);
        if (farmMatch) {
          return parseInt(farmMatch[1], 10);
        }
        
        // 숫자가 없으면 생성일로 정렬
        return new Date(device.created_at || '').getTime();
      };
      
      const aNumber = getBedNumber(a);
      const bNumber = getBedNumber(b);
      
      // 숫자로 정렬, 같으면 생성일로 정렬
      if (aNumber !== bNumber) {
        return aNumber - bNumber;
      }
      
      return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
    });
  };
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<AuthUser[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [userSettings, setUserSettings] = useState({
    showOnlyMyFarm: false, // 디폴트는 모든 농장 표시
    showAllBedsInBedManagement: false
  });
  const [bedDashboardSettings, setBedDashboardSettings] = useState<Record<string, boolean>>({});
  // Mock 데이터 변수들 제거됨 - 실제 Supabase 데이터 사용
  const [localActuatorStates, setLocalActuatorStates] = useState<Record<string, boolean>>({});
  const [bedAlerts, setBedAlerts] = useState<Record<string, DashboardAlert[]>>({});

  // 대시보드 알림 구독 및 상태 업데이트
  useEffect(() => {
    const unsubscribeAlerts = dashboardAlertManager.subscribe((alerts) => {
      const alertsByDevice: Record<string, DashboardAlert[]> = {};
      alerts.forEach(alert => {
        if (alert.deviceId) {
          if (!alertsByDevice[alert.deviceId]) {
            alertsByDevice[alert.deviceId] = [];
          }
          alertsByDevice[alert.deviceId].push(alert);
        }
      });
      setBedAlerts(alertsByDevice);
    });

    return () => {
      unsubscribeAlerts();
    };
  }, []);
  
  // 베드별 경고 체크 함수
  const getBedAlerts = (deviceId: string): DashboardAlert[] => {
    const allAlerts = dashboardAlertManager.getAlerts();
    
    // Device ID 매칭을 위한 변환 함수
    const getBedFormattedId = (deviceId: string) => {
      if (deviceId === 'device-1') return 'bed_001';
      else if (deviceId === 'device-2') return 'bed_002';
      else if (deviceId === 'device-3') return 'bed_003';
      else if (deviceId === 'device-4') return 'bed_004';
      else if (deviceId === 'device-5') return 'bed_005';
      else if (deviceId === 'device-6') return 'bed_006';
      return deviceId; // 그대로 사용
    };
    
    const bedFormattedId = getBedFormattedId(deviceId);
    return allAlerts.filter(alert => 
      (alert.deviceId === deviceId || alert.deviceId === bedFormattedId) && !alert.isRead
    );
  };

  const getRecentAlertForBed = (deviceId: string): DashboardAlert | null => {
    const alerts = getBedAlerts(deviceId);
    return alerts.length > 0 ? alerts[0] : null;
  };


  const getBedStatusIcon = (deviceId: string): string => {
    const recentAlert = getRecentAlertForBed(deviceId);
    if (recentAlert) {
      switch (recentAlert.level) {
        case 'critical': return '🛑';
        case 'high': return '⚠️';
        case 'medium': return '🔶';
        case 'low': return '💡';
        default: return '📊';
      }
    }
    return '📊';
  };

  const getBedStatusColor = (deviceId: string): string => {
    const recentAlert = getRecentAlertForBed(deviceId);
    if (recentAlert) {
      switch (recentAlert.level) {
        case 'critical': return 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-300 ring-2 ring-red-400';
        case 'high': return 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-300 ring-2 ring-orange-400';
        case 'medium': return 'bg-yellow-500 text-yellow-900 border-yellow-600 shadow-md shadow-yellow-300 ring-1 ring-yellow-400';
        case 'low': return 'bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-300 ring-1 ring-blue-400';
        default: return 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-300 ring-2 ring-red-400';
      }
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // 농장에 알림이 있는지 확인하는 함수
  const getFarmAlerts = (farmId: string): DashboardAlert[] => {
    const allAlerts = dashboardAlertManager.getAlerts();
    
    console.log('🔍 농장 알림 확인:', {
      farmId,
      allAlerts: allAlerts.length,
      alerts: allAlerts.map(a => ({ id: a.id, deviceId: a.deviceId, isRead: a.isRead }))
    });
    
    // 각 알림에 대해 상세한 매칭 과정 로깅
    allAlerts.forEach((alert, index) => {
      console.log(`🔍 알림 ${index + 1} 분석:`, {
        alertId: alert.id,
        deviceId: alert.deviceId,
        targetFarmId: farmId,
        isDirectMatch: alert.deviceId === farmId,
        isRead: alert.isRead,
        alertType: alert.type,
        message: alert.message
      });
    });
    
    const farmAlerts = allAlerts.filter(alert => {
      // deviceId가 농장 ID와 일치하는지 확인 (테스트 알림용)
      if (alert.deviceId === farmId) {
        console.log('✅ 테스트 알림 매치:', { alertId: alert.id, deviceId: alert.deviceId, farmId });
        return !alert.isRead;
      }
      
      // 기존 로직: deviceId가 해당 농장의 센서 게이트웨이 ID와 일치하는지 확인
      const farmDevices = (devices || []).filter(d => d.farm_id === farmId && d.type === 'sensor_gateway');
      console.log('🔍 센서 게이트웨이 확인:', {
        farmId,
        farmDevices: farmDevices.length,
        sensorGateways: farmDevices.map(d => ({ id: d.id, type: d.type })),
        alertDeviceId: alert.deviceId
      });
      
      const device = farmDevices.find(d => d.id === alert.deviceId);
      if (device) {
        console.log('✅ 센서 알림 매치:', { alertId: alert.id, deviceId: alert.deviceId, farmId });
        return !alert.isRead;
      }
      
      console.log('❌ 알림 매치 실패:', { alertId: alert.id, deviceId: alert.deviceId, farmId });
      return false;
    });
    
    console.log('🔍 농장 알림 결과:', {
      farmId,
      farmAlerts: farmAlerts.length,
      alerts: farmAlerts.map(a => ({ id: a.id, deviceId: a.deviceId }))
    });
    
    return farmAlerts;
  };


  // 농장에 알림이 있는지 확인
  const hasFarmAlerts = (farmId: string): boolean => {
    return getFarmAlerts(farmId).length > 0;
  };
  
  // 센서 데이터 모니터링 기능 추가 - 임시 차단 (MQTT 연결 전)
  useEffect(() => {
    const monitorSensorData = () => {
      console.log('🚫 센서 모니터링이 차단됨 (MQTT 서버 연결 전)');
      return;
      
      sensorReadings.forEach(reading => {
        const sensor = sensors.find(s => s.id === reading.sensor_id);
        if (!sensor) return;
        
        const device = devices.find(d => d.id === sensor.device_id);
        const farm = farms.find(f => f.id === device?.farm_id);
        const location = `${farm?.name || '알 수 없음'}-${String(device?.meta?.location || '베드')}`;
        
        // 센서 타입별 임계값 정의
        const thresholds = {
          temperature: { min: 10, max: 35 },
          humidity: { min: 30, max: 80 },
          ec: { min: 0.8, max: 3.5 },
          ph: { min: 5.5, max: 6.5 },
          water: { min: 20, max: 90 }
        };
        
        // 센서 데이터 검증 및 알림 - MQTT 연동 전까지 차단
        console.log('🔒 센서 데이터 검증 및 알림 차단됨 (MQTT 연동 전까지 알림 비활성화):', sensor.type, location);
        /*
        checkSensorDataAndNotify({
          id: sensor.id,
          type: sensor.type as 'temperature' | 'humidity' | 'ec' | 'ph' | 'water',
          value: reading.value,
          location: location,
          timestamp: new Date(reading.ts),
          thresholds: thresholds[sensor.type as keyof typeof thresholds],
          deviceId: device?.id  // deviceId 추가
        }).catch(error => {
          console.error('센서 데이터 모니터링 에러:', error);
        });
        */
      });
    };

    // 30초마다 센서 데이터 체크 (실시간 모니터링) - 임시 차단
    // const sensorMonitorInterval = setInterval(monitorSensorData, 30000);
    
    // 초기 모니터링 실행 - 임시 차단
    // monitorSensorData();

    return () => {
      // clearInterval(sensorMonitorInterval);
    };
  }, [sensorReadings, sensors, devices, farms]);
  
  // 대시보드 데이터 초기화 - props로 받은 데이터만 사용 (읽기 전용)
  useEffect(() => {
    const initializeDashboard = async () => {
      setTeamsLoading(true);
      try {
        console.log('📊 대시보드 - 농장관리 페이지 데이터 요약 표시');
        console.log('🏠 농장 수:', farms?.length || 0);
        console.log('📡 베드 수:', devices?.filter(d => d.type === 'sensor_gateway').length || 0);

        // props로 받은 farms 데이터를 teams로 설정 (읽기 전용)
        setTeams(farms || []);

        // 사용자 목록은 별도로 로드 (대시보드용)
        const usersResult = await getApprovedUsers();
        setApprovedUsers(usersResult as AuthUser[]);

        // 사용자 설정 로드
        const settings = getUserSettings(user.id);
        setUserSettings(settings);

        // 베드 대시보드 설정 로드
        if (typeof window !== 'undefined') {
          const savedBedSettings = localStorage.getItem('bed_dashboard_settings');
          if (savedBedSettings) {
            const parsedSettings = JSON.parse(savedBedSettings);
            setBedDashboardSettings(parsedSettings);
            console.log('대시보드에서 베드 설정 로드됨:', parsedSettings);
          }
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      } finally {
        setTeamsLoading(false);
      }
    };

    initializeDashboard();

    return () => {
      // 정리 작업 (필요시 추가)
    };
  }, [user.id, farms, devices]); // farms, devices 변경 시 대시보드 업데이트
  
  // 통계 계산
  const totalFarms = farms?.length || 0;
  const totalBeds = devices?.filter(d => d.type === 'sensor_gateway').length || 0; // 실제 센서 게이트웨이(베드) 수
  
  // 베드 활성 상태 확인 로직 개선 - JSONB status 필드 처리
  const activeBeds = devices?.filter(d => {
    if (d.type !== 'sensor_gateway') return false;
    // status가 JSONB이므로 안전하게 접근
    if (typeof d.status === 'object' && d.status !== null) {
      return d.status.online === true;
    }
    // status가 문자열이거나 다른 형태인 경우 기본적으로 활성으로 간주
    return true;
  }).length || 0;
  
  const bedActivationRate = totalBeds > 0 ? Math.round((activeBeds / totalBeds) * 100) : 0;
  
  const activeMembers = approvedUsers?.filter(user => 
    user.is_active && user.is_approved && 
    (user.role === 'team_leader' || user.role === 'team_member')
  ).length || 0; // 실제 활성화된 팀원 수
  const tempReadings = sensorReadings?.filter(r => r.unit === '°C').slice(0, 10) || [];
  const averageTemp = tempReadings.reduce((sum, r) => sum + r.value, 0) / Math.max(tempReadings.length, 1);

        // 사용자 역할에 따른 권한 확인
        const canManageUsers = user.role === 'system_admin' || user.role === 'super_admin' || user.email === 'sky3rain7@gmail.com';
        const canManageTeamMembers = user.role === 'system_admin' || user.role === 'super_admin' || user.role === 'team_leader' || user.role === 'team_member';
        const canManageFarms = user.role === 'system_admin' || user.role === 'super_admin' || user.role === 'team_leader' || user.email === 'sky3rain7@gmail.com';
        const canViewData = true; // 모든 사용자는 데이터 조회 가능


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <AppHeader
        user={user}
        title="Tera Hub"
        subtitle={user.role === 'system_admin' ? 
                    (user.email === 'sky3rain7@gmail.com' ? '인도어 스마트팜 ALL-IN-ONE BOARD' : '시스템 관리자 대시보드') : 
                   user.role === 'team_leader' ? `${user.team_name} 조장 대시보드` : 
                   `${user.team_name} 팀원 대시보드`}
        isDashboard={true}
        onDashboardRefresh={() => window.location.reload()}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto pt-4 pb-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Stats Overview - 데스크톱에서만 상단 표시 */}
        <div className="hidden sm:block mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-gray-200 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-300">
            <div className="p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-lg">🏠</span>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
                    농장 수
                  </dt>
                  <dd className="text-2xl font-black text-gray-900">{totalFarms}</dd>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {teamsLoading ? '...' : activeMembers}
                </div>
                <div className="text-sm text-gray-600 font-medium">활성 팀원</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-gray-200 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:border-green-300">
            <div className="p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-lg">🌱</span>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
                    베드 활성률
                  </dt>
                  <dd className="text-2xl font-black text-gray-900">{bedActivationRate}%</dd>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{activeBeds}/{totalBeds}</div>
                <div className="text-sm text-gray-600 font-medium">활성/전체</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-gray-200 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:border-purple-300">
            <div className="p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-lg">🌱</span>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
                    배양액 레시피
                  </dt>
                  <dd className="text-2xl font-black text-gray-900">
                    {recipeStats.total}
                  </dd>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {recipeStats.today}
                </div>
                <div className="text-sm text-gray-600 font-medium">오늘 추가</div>
              </div>
            </div>
          </div>

            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-gray-200 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-300">
              <div className="p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-lg">🌤️</span>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
                    현재 날씨
                  </dt>
                  <dd className="text-2xl font-black text-gray-900">{weatherData.temperature}°C</dd>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">{weatherData.weatherStatus}</div>
                <div className="text-sm text-gray-600 font-medium">{weatherData.region}</div>
                <div className="text-xs text-gray-500 font-medium">강수확률 {weatherData.precipitation}%</div>
              </div>
            </div>
          </div>
        </div>
        </div>
        
        {/* Farm Overview Section */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-4 sm:mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-3 sm:px-4 py-3 sm:py-4">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-3xl">🌱</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">농장 현황</h1>
                  <p className="text-white/90 text-lg">농장관리에서 대시보드 노출을 허용한 농장만 표시 됩니다.</p>
                </div>
              </div>
                
              {/* Enhanced Toggle Switch */}
              {(user.role === 'team_leader' || user.role === 'team_member') && (
                <div className="flex items-center bg-white/20 rounded-xl px-4 py-2">
                  <label className="text-sm font-medium text-white">
                    자기 농장만 보기
                  </label>
                  <button
                    onClick={() => {
                      const newSettings = { ...userSettings, showOnlyMyFarm: !userSettings.showOnlyMyFarm };
                      setUserSettings(newSettings);
                      updateUserSettings(user.id, newSettings);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ml-3 ${
                      userSettings.showOnlyMyFarm ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        userSettings.showOnlyMyFarm ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="px-2 sm:px-3 py-2 sm:py-3">
            <div className="space-y-2 sm:space-y-3">
              {(() => {
                // 농장 필터링 및 베드 계산
                console.log('🔍 대시보드 필터링 디버그:', {
                  userRole: user.role,
                  userTeamId: user.team_id,
                  showOnlyMyFarm: userSettings.showOnlyMyFarm,
                  totalFarms: (farms || []).length,
                  farms: (farms || []).map(f => ({ id: f.id, name: f.name }))
                });
                
                const filteredFarms = (farms || []).filter(farm => {
                  // 시스템 관리자는 숨김 농장도 볼 수 있음
                  if (user.role === 'system_admin' || user.role === 'super_admin' || user.email === 'sky3rain7@gmail.com') {
                    return true; // 모든 농장 표시 (숨김 농장 포함)
                  }
                  
                  // 숨김 농장은 제외 (시스템 관리자가 아닌 경우)
                  if (farm.is_hidden) {
                    console.log(`농장 ${farm.name} (${farm.id}) 숨김 처리됨`);
                    return false;
                  }
                  
                  // 농장장/팀원인 경우 설정에 따라 필터링
                  if (user.role === 'team_leader' || user.role === 'team_member') {
                    if (userSettings.showOnlyMyFarm) {
                      // 자기 농장만 표시
                      const isMyFarm = farm.id === user.team_id;
                      console.log(`농장 ${farm.name} (${farm.id}) vs 사용자 팀 ID (${user.team_id}): ${isMyFarm ? '포함' : '제외'}`);
                      return isMyFarm;
                    }
                    // 설정이 꺼져있으면 모든 농장 표시
                  }
                  return true;
                }).map(farm => {
                  // 농장의 베드들 중 대시보드에 노출되는 것들만 필터링
                  const farmDevices = (devices || []).filter(d => d.farm_id === farm.id && d.type === 'sensor_gateway');
                  const visibleDevices = farmDevices.filter(device => {
                    // 베드별 대시보드 노출 설정 확인
                    const showOnDashboard = bedDashboardSettings[device.id] !== false; // 기본값은 true
                    
                    // 관리자는 모든 베드 표시, 팀원은 설정에 따라
                    if (user.role === 'system_admin' || user.email === 'sky3rain7@gmail.com') {
                      return showOnDashboard; // 관리자는 베드별 설정에 따라 표시
                    }
                    return showOnDashboard; // 팀원도 베드별 설정에 따라 표시
                  });
                  
                  // 베드 정렬 적용
                  const sortedVisibleDevices = sortBeds([...visibleDevices]);
                  
                  return {
                    ...farm,
                    visibleDevices: sortedVisibleDevices
                  };
                }); // 모든 농장 표시 (베드가 없어도 농장은 표시)

                // 활성화된 베드가 없는 경우 처리
                if (filteredFarms.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🌱</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {filteredFarms.length === 0 
                          ? (userSettings.showOnlyMyFarm ? '자기 농장에 베드가 없습니다' : '표시할 베드가 없습니다')
                          : '활성화된 베드가 없습니다'}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {user.role === 'team_leader' || user.role === 'team_member'
                          ? (userSettings.showOnlyMyFarm 
                              ? '자기 농장에 베드를 추가하거나 "자기 농장만 보기"를 끄면 모든 농장을 볼 수 있습니다'
                              : '농장 관리에서 베드를 활성화하거나 새 베드를 추가해보세요')
                          : '농장 관리에서 베드를 활성화하거나 새 베드를 추가해보세요'}
                      </p>
                    </div>
                  );
                }

                return filteredFarms.map((farm) => {
                  // 모든 사용자가 해당 농장의 알림만 확인
                  const farmHasAlerts = hasFarmAlerts(farm.id);
                  const farmAlerts = getFarmAlerts(farm.id);
                  const criticalAlerts = farmAlerts.filter(alert => alert.level === 'critical').length;
                  const highAlerts = farmAlerts.filter(alert => alert.level === 'high').length;
                  
                  return (
                <div key={farm.id} className={`bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border rounded-2xl p-2 sm:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                  farmHasAlerts 
                    ? 'border-red-400 ring-2 ring-red-300 animate-pulse shadow-red-200' 
                    : 'border-gray-200'
                }`}>
                    {/* 농장 헤더 */}
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                          farmHasAlerts 
                            ? 'bg-gradient-to-br from-red-400 to-red-600 animate-bounce' 
                            : 'bg-gradient-to-br from-green-400 to-blue-500'
                        }`}>
                          <span className="text-3xl">{farmHasAlerts ? '🚨' : '🏠'}</span>
                        </div>
                        <div>
                            <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                            <h4 className="text-2xl font-bold text-gray-900">{farm.name}</h4>
                            <span className="text-gray-600 font-medium text-lg">🏷️ {farm.id}</span>
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="text-sm text-blue-600 font-semibold">
                              📊 총 {farm.visibleDevices.length}개 베드
                            </span>
                            {farmHasAlerts ? (
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 border border-red-300 rounded-full">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-red-700 font-bold">
                                    ⚠️ {farmAlerts.length}개 알림
                                    {criticalAlerts > 0 && ` (긴급 ${criticalAlerts}개)`}
                                    {highAlerts > 0 && ` (높음 ${highAlerts}개)`}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-xs text-gray-500">활성</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* 농장별 관리 버튼들 */}
                      <div className="flex items-center space-x-2">
                        {canManageFarms && (
                          <button
                            onClick={() => {
                              // 클릭된 농장의 ID를 직접 사용 (항상 해당 농장 관리로 이동)
                              router.push(`/beds?farm=${farm.id}`);
                            }}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                          >
                            농장 관리
                          </button>
                        )}
                    </div>
                  </div>

                  {/* 농장에 속한 베드들 - 개별 카드로 변환하고 공간 없이 꽉채우기 */}
                  <div className="space-y-2 sm:space-y-3">
                    <h5 className="text-xl font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                      <span className="text-2xl mr-3">🌱</span>
                      {farm.name}의 베드 현황
                    </h5>

                    {/* 베드 카드들을 개별로 배치 - 공간 없이 꽉채우기 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2">
                      {farm.visibleDevices.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>현재 표시할 베드가 없습니다.</p>
                        </div>
                      ) : (
                        farm.visibleDevices.map((device: Device, deviceIndex: number) => {
                        const deviceSensors = (sensors || []).filter(s => s.device_id === device.id);
                        
                          // 전체 알림 로그와 비교 
                          const allAlerts = dashboardAlertManager.getAlerts();
                          const bedAlerts = getBedAlerts(device.id);
                            
                            

                          return (
                            <div
                              key={device.id}
                              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                              data-device-id={device.id}
                              data-device-index={deviceIndex}
                            >
                              <div className="p-3 sm:p-4">
                              <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                                    <span className="text-xl">📡</span>
                              </div>
                              <div>
                                    <span className="font-bold text-gray-900 text-lg">
                                      {(() => {
                                        const location = String(device.meta?.location ?? '센서 게이트웨이');
                                        
                                        // 조1-베드1 형태인 경우 → 베드-1
                                        const joMatch = location.match(/^조(\d+)-베드(\d+)/);
                                        if (joMatch) {
                                          const [, joNumber, bedNumber] = joMatch;
                                          return `베드-${bedNumber}`;
                                        }
                                        
                                        // 농장1-베드2 형태인 경우 → 베드-2
                                        const farmMatch = location.match(/^농장(\d+)-베드(\d+)/);
                                        if (farmMatch) {
                                          const [, farmNumber, bedNumber] = farmMatch;
                                          return `베드-${bedNumber}`;
                                        }
                                        
                                        // 베드-1, 베드-2 형태인 경우 → 베드-1, 베드-2 (하이픈 포함)
                                        const bedWithDashMatch = location.match(/^베드-(\d+)/);
                                        if (bedWithDashMatch) {
                                          const bedNumber = bedWithDashMatch[1];
                                          return `베드-${bedNumber}`;
                                        }
                                        
                                        // 베드1, 베드2 형태인 경우 → 베드-1, 베드-2 (하이픈 없음)
                                        const bedOnlyMatch = location.match(/^베드(\d+)/);
                                        if (bedOnlyMatch) {
                                          const bedNumber = bedOnlyMatch[1];
                                          return `베드-${bedNumber}`;
                                        }
                                        
                                        // 매칭되지 않는 경우 디바이스 ID의 마지막 4자리 사용
                                        const deviceIdSuffix = device.id.slice(-4);
                                        return `베드-${deviceIdSuffix}`;
                                      })()}
                                    </span>
                                    <div className="text-sm text-gray-500">📊 센서 {deviceSensors.length}개</div>
                                    {/* 작물명과 재배 방식 표시 */}
                                    <div className="mt-2 flex items-center space-x-3">
                                      <span className="text-sm text-green-600 font-medium">
                                        🌱 {(device.meta as any)?.crop_name || '미설정'}
                                      </span>
                                      <span className="text-sm text-blue-600 font-medium">
                                        🔧 {(device.meta as any)?.growing_method || '미설정'}
                                      </span>
                                    </div>
                              </div>
                            </div>
                                <div className="flex items-center space-x-2">
                                  {/* 베드 경고 상태 표시 */}
                                  {(() => {
                                    const hasAlerts = getBedAlerts(device.id).length > 0;
                                    const recentAlert = getRecentAlertForBed(device.id);
                                    if (hasAlerts && recentAlert) {
                                      return (
                                        <div className={`flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-bold ${getBedStatusColor(device.id)} animate-bounce shadow-lg`}>
                                          <span className="animate-pulse">{getBedStatusIcon(device.id)}</span>
                                          <span className="truncate max-w-[100px]">{recentAlert.title}</span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>

                              {/* 제어 상태 - 크기 증대 */}
                              <div className="mb-3 sm:mb-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-sm">
                                  <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2 sm:p-3 ring-1 ring-gray-300">
                                    <span className="text-lg">💡</span>
                                    <span className="text-gray-600 font-medium">램프1</span>
                                    <span className={`font-bold text-right ${localActuatorStates['lamp1'] ? 'text-green-600' : 'text-gray-400'}`}>
                                      {localActuatorStates['lamp1'] ? 'ON' : 'OFF'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2 sm:p-3 ring-1 ring-gray-300">
                                    <span className="text-lg">💡</span>
                                    <span className="text-gray-600 font-medium">램프2</span>
                                    <span className={`font-bold text-right ${localActuatorStates['lamp2'] ? 'text-green-600' : 'text-gray-400'}`}>
                                      {localActuatorStates['lamp2'] ? 'ON' : 'OFF'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2 sm:p-3 ring-1 ring-gray-300">
                                    <span className="text-lg">💧</span>
                                    <span className="text-gray-600 font-medium">펌프</span>
                                    <span className={`font-bold text-right ${localActuatorStates['pump'] ? 'text-green-600' : 'text-gray-400'}`}>
                                      {localActuatorStates['pump'] ? 'ON' : 'OFF'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2 sm:p-3 ring-1 ring-gray-300">
                                    <span className="text-lg">🌀</span>
                                    <span className="text-gray-600 font-medium">팬</span>
                                    <span className={`font-bold text-right ${localActuatorStates['fan'] ? 'text-green-600' : 'text-gray-400'}`}>
                                      {localActuatorStates['fan'] ? 'ON' : 'OFF'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* 센서 데이터 - 대폭 증대 */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-2 sm:mt-3">
                                <div className="flex items-center justify-between bg-red-50 rounded-lg p-3 sm:p-4 shadow-md border border-red-300">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-3xl">🌡️</span>
                                    <span className="text-lg text-gray-700 font-bold">온도</span>
                                  </div>
                                  <span className="text-3xl font-black text-red-600">
                                    {(() => {
                                      // 실제 센서 데이터 사용
                                      const tempSensor = deviceSensors.find(s => s.type === 'temperature');
                                      const reading = tempSensor && sensorReadings.find(r => r.sensor_id === tempSensor.id);
                                      return reading ? `${parseFloat(reading.value).toFixed(2)}°C` : '--°C';
                                    })()}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 sm:p-4 shadow-md border border-blue-300">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-3xl">💧</span>
                                    <span className="text-lg text-gray-700 font-bold">습도</span>
                                  </div>
                                  <span className="text-3xl font-black text-blue-600">
                                    {(() => {
                                      // 실제 센서 데이터 사용
                                      const humiditySensor = deviceSensors.find(s => s.type === 'humidity');
                                      const reading = humiditySensor && sensorReadings.find(r => r.sensor_id === humiditySensor.id);
                                      return reading ? `${parseFloat(reading.value).toFixed(2)}%` : '--%';
                                    })()}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between bg-green-50 rounded-lg p-3 sm:p-4 shadow-md border border-green-300">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-3xl">⚡</span>
                                    <span className="text-lg text-gray-700 font-bold">EC</span>
                                  </div>
                                  <span className="text-3xl font-black text-green-600">
                                    {(() => {
                                      // 실제 센서 데이터 사용
                                      const ecSensor = deviceSensors.find(s => s.type === 'ec');
                                      const reading = ecSensor && sensorReadings.find(r => r.sensor_id === ecSensor.id);
                                      return reading ? `${parseFloat(reading.value).toFixed(2)}` : '--';
                                    })()}
                            </span>
                          </div>

                                <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3 sm:p-4 shadow-md border border-purple-300">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-3xl">🧪</span>
                                    <span className="text-lg text-gray-700 font-bold">pH</span>
                                  </div>
                                  <span className="text-3xl font-black text-purple-600">
                                    {(() => {
                                      // 실제 센서 데이터 사용
                                      const phSensor = deviceSensors.find(s => s.type === 'ph');
                                      const reading = phSensor && sensorReadings.find(r => r.sensor_id === phSensor.id);
                                      return reading ? `${parseFloat(reading.value).toFixed(2)}` : '--';
                                    })()}
                            </span>
                                </div>
                              </div>
                              </div>
                            </div>
                          );
                          })
                        )}
                    </div>
                  </div>

                </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden">
          <div className="px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  📈 최근 활동
                </h3>
                <p className="text-gray-600">실시간 센서 데이터와 시스템 활동을 확인하세요</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 font-medium">실시간</span>
                </div>
                <button className="text-blue-600 hover:text-blue-800 font-semibold">
                  전체보기 →
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {(sensorReadings || []).slice(0, 5).map((reading) => {
                const sensor = (sensors || []).find(s => s.id === reading.sensor_id);
                const device = (devices || []).find(d => d.id === sensor?.device_id);
                const farm = (farms || []).find(f => f.id === device?.farm_id);
                
                return (
                  <div key={reading.id} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-xl">📊</span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {farm?.name} - {String(device?.meta?.location || '')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {sensor?.type} 센서 측정
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-gray-900">
                          {reading.value}{reading.unit}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {new Date(reading.ts).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(sensorReadings || []).length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📊</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">최근 센서 데이터가 없습니다</h3>
                  <p className="text-gray-600 mb-6">센서 데이터가 수집되면 여기에 표시됩니다</p>
                  {canManageFarms && (
                    <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200">
                      센서 설정하기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 모바일용 통계 카드들 - 농장현황 아래 표시 */}
        <div className="block sm:hidden mb-4">
          <div className="grid grid-cols-2 gap-2">
            {/* 농장 수 카드 */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-lg border border-gray-200">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-sm">🏠</span>
                  </div>
                  <div className="ml-2">
                    <dt className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      농장 수
                    </dt>
                    <dd className="text-lg font-black text-gray-900">{totalFarms}</dd>
                  </div>
                </div>
              </div>
            </div>

            {/* 베드 활성률 카드 */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-lg border border-gray-200">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-sm">🌱</span>
                  </div>
                  <div className="ml-2">
                    <dt className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      베드 활성률
                    </dt>
                    <dd className="text-lg font-black text-gray-900">{bedActivationRate}%</dd>
                  </div>
                </div>
              </div>
            </div>

            {/* 배양액 레시피 카드 */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-lg border border-gray-200">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-sm">🌱</span>
                  </div>
                  <div className="ml-2">
                    <dt className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      배양액 레시피
                    </dt>
                    <dd className="text-lg font-black text-gray-900">{recipeStats.total}</dd>
                  </div>
                </div>
              </div>
            </div>

            {/* 현재 날씨 카드 */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-lg border border-gray-200">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-sm">🌤️</span>
                  </div>
                  <div className="ml-2">
                    <dt className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      현재 날씨
                    </dt>
                    <dd className="text-lg font-black text-gray-900">{weatherData.temperature}°C</dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

