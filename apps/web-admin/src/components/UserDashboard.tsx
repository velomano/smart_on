'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, getApprovedUsers, getUserSettings, updateUserSettings } from '../lib/auth';
import { Device, Sensor, SensorReading } from '../lib/supabase';
import AppHeader from './AppHeader';
import NotificationButton from './NotificationButton';
import { dashboardAlertManager, DashboardAlert } from '../lib/dashboardAlerts';

const ALERTS_DISABLED_MESSAGE = '🔒 ALERTS COMPLETELY DISABLED';

// 완전 비활성용 더미
async function checkSensorDataAndNotify(sensorData: any) {
  console.log(
    '🔒 PERMANENT DISABLED - checkSensorDataAndNotify stub called:',
    sensorData.type,
    sensorData.location
  );
  return;
}

interface UserDashboardProps {
  user: AuthUser;
  farms: any[];
  devices: any[];
  sensors: any[];
  sensorReadings: any[];
}

export default function UserDashboard({
  user,
  farms,
  devices,
  sensors,
  sensorReadings,
}: UserDashboardProps) {
  const router = useRouter();

  // 색상/그라데이션 유틸
  const getFarmColor = (farmId: string) => {
    const colors = [
      'text-blue-600',
      'text-green-600',
      'text-purple-600',
      'text-red-600',
      'text-orange-600',
      'text-indigo-600',
      'text-pink-600',
      'text-teal-600',
      'text-cyan-600',
      'text-emerald-600',
      'text-violet-600',
      'text-rose-600',
    ];
    const hash = farmId.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getFarmGradient = (farmId: string) => {
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-red-500 to-red-600',
      'from-orange-500 to-orange-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600',
      'from-emerald-500 to-emerald-600',
      'from-violet-500 to-violet-600',
      'from-rose-500 to-rose-600',
    ];
    const hash = farmId.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return gradients[Math.abs(hash) % gradients.length];
  };

  // 상단 카드용 상태
  const [recipeStats, setRecipeStats] = useState({ total: 0, today: 0 });
  const [weatherData, setWeatherData] = useState({
    temperature: 0,
    humidity: 0,
    precipitation: 0,
    weatherStatus: '맑음',
    region: '서울',
  });

  // 베드 작물 정보 저장 (deviceId -> tier -> cropInfo)
  const [bedCropData, setBedCropData] = useState<Record<string, Record<number, any>>>({});

  // 베드 작물 정보 로드
  const loadCropData = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/bed-crop-data?deviceId=${deviceId}`);
      const result = await response.json();
      if (result.ok && result.data) {
        const map: Record<number, any> = {};
        result.data.forEach((item: any) => {
          map[item.tier_number] = {
            cropName: item.crop_name,
            growingMethod: item.growing_method,
            plantType: item.plant_type,
            startDate: item.start_date,
            savedAt: item.created_at,
          };
        });
        setBedCropData((prev) => ({ ...prev, [deviceId]: map }));
      }
    } catch (e) {
      console.error('작물 정보 로드 오류:', e);
    }
  };

  // 통계
  useEffect(() => {
    const fetchRecipeStats = async () => {
      try {
        // 전체 레시피 수 조회
        const totalResponse = await fetch('/api/nutrients/browse?limit=1');
        const totalResult = await totalResponse.json();
        
        // 모든 레시피를 가져와서 클라이언트에서 오늘 날짜 필터링
        const allResponse = await fetch('/api/nutrients/browse?limit=1000');
        const allResult = await allResponse.json();
        
        // 오늘 날짜 계산
        const today = new Date().toISOString().split('T')[0];
        
        // 오늘 생성된 레시피 개수 계산
        const todayCount = allResult.recipes?.filter((recipe: any) => {
          if (!recipe.created_at) return false;
          const recipeDate = new Date(recipe.created_at).toISOString().split('T')[0];
          return recipeDate === today;
        }).length || 0;
        
        setRecipeStats({
          total: totalResult.pagination?.total || 0,
          today: todayCount,
        });
      } catch (e) {
        console.error('레시피 통계 가져오기 실패:', e);
        setRecipeStats({ total: 0, today: 0 });
      }
    };
    fetchRecipeStats();
  }, []);

  // 날씨
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const region = user.weather_region || '서울';
        const response = await fetch(`/api/weather?region=${encodeURIComponent(region)}`);
        if (!response.ok) return;
        const result = await response.json();
        if (result.ok) setWeatherData(result.data);
      } catch (e) {
        console.error('날씨 API 호출 실패:', e);
      }
    };
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user.weather_region]);

  // 베드 작물 정보 로드
  useEffect(() => {
    if (devices && devices.length > 0) {
      devices.forEach((d: any) => loadCropData(d.id));
    }
  }, [devices]);

  // 베드 정렬
  const sortBeds = (beds: Device[]) => {
    return beds.sort((a, b) => {
      const getBedNumber = (device: Device) => {
        const location = String(device.meta?.location || '');
        const bedMatch = location.match(/베드-?(\d+)/);
        if (bedMatch) return parseInt(bedMatch[1], 10);
        const joMatch = location.match(/조\d+-베드(\d+)/);
        if (joMatch) return parseInt(joMatch[1], 10);
        const farmMatch = location.match(/농장\d+-베드(\d+)/);
        if (farmMatch) return parseInt(farmMatch[1], 10);
        return new Date(device.created_at || '').getTime();
      };
      const aNum = getBedNumber(a);
      const bNum = getBedNumber(b);
      if (aNum !== bNum) return aNum - bNum;
      return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
    });
  };

  // 사용자/팀/설정
  const [teams, setTeams] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<AuthUser[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [userSettings, setUserSettings] = useState({
    showOnlyMyFarm: false,
    showAllBedsInBedManagement: false,
  });
  const [bedDashboardSettings, setBedDashboardSettings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialize = async () => {
      setTeamsLoading(true);
      try {
        setTeams(farms || []);
        const usersResult = await getApprovedUsers();
        setApprovedUsers(usersResult as AuthUser[]);
        const settings = getUserSettings(user.id);
        setUserSettings(settings);
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('bed_dashboard_settings');
          if (saved) setBedDashboardSettings(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error initializing dashboard:', e);
      } finally {
        setTeamsLoading(false);
      }
    };
    initialize();
  }, [user.id, farms, devices]);

  // 액추에이터/알림
  const [localActuatorStates, setLocalActuatorStates] = useState<Record<string, boolean>>({});
  const [bedAlerts, setBedAlerts] = useState<Record<string, DashboardAlert[]>>({});

  useEffect(() => {
    const unsubscribe = dashboardAlertManager.subscribe((alerts) => {
      const byDevice: Record<string, DashboardAlert[]> = {};
      alerts.forEach((a) => {
        if (!a.deviceId) return;
        if (!byDevice[a.deviceId]) byDevice[a.deviceId] = [];
        byDevice[a.deviceId].push(a);
      });
      setBedAlerts(byDevice);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const getBedAlertsFn = (deviceId: string): DashboardAlert[] => {
    const all = dashboardAlertManager.getAlerts();
    const alias = (id: string) => {
      if (id === 'device-1') return 'bed_001';
      if (id === 'device-2') return 'bed_002';
      if (id === 'device-3') return 'bed_003';
      if (id === 'device-4') return 'bed_004';
      if (id === 'device-5') return 'bed_005';
      if (id === 'device-6') return 'bed_006';
      return id;
    };
    const f = alias(deviceId);
    return all.filter((a) => (a.deviceId === deviceId || a.deviceId === f) && !a.isRead);
  };

  const getRecentAlertForBed = (deviceId: string): DashboardAlert | null => {
    const alerts = getBedAlertsFn(deviceId);
    return alerts.length > 0 ? alerts[0] : null;
  };

  const getBedStatusIcon = (deviceId: string) => {
    const a = getRecentAlertForBed(deviceId);
    if (!a) return '📊';
    switch (a.level) {
      case 'critical':
        return '🛑';
      case 'high':
        return '⚠️';
      case 'medium':
        return '🔶';
      case 'low':
        return '💡';
      default:
        return '📊';
    }
  };

  const getBedStatusColor = (deviceId: string) => {
    const a = getRecentAlertForBed(deviceId);
    if (!a) return 'bg-gray-100 text-gray-600 border-gray-300';
    switch (a.level) {
      case 'critical':
        return 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-300 ring-2 ring-red-400';
      case 'high':
        return 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-300 ring-2 ring-orange-400';
      case 'medium':
        return 'bg-yellow-500 text-yellow-900 border-yellow-600 shadow-md shadow-yellow-300 ring-1 ring-yellow-400';
      case 'low':
        return 'bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-300 ring-1 ring-blue-400';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getFarmAlerts = (farmId: string): DashboardAlert[] => {
    const all = dashboardAlertManager.getAlerts();
    const farmDevices = (devices || []).filter((d) => d.farm_id === farmId && d.type === 'sensor_gateway');
    return all.filter((a) => {
      if (a.deviceId === farmId) return !a.isRead; // 테스트 알림 허용
      return farmDevices.some((d) => d.id === a.deviceId) && !a.isRead;
    });
  };

  const hasFarmAlerts = (farmId: string) => getFarmAlerts(farmId).length > 0;

  // 상단 지표
  const totalFarms = farms?.length || 0;
  const totalBeds = devices?.filter((d) => d.type === 'sensor_gateway').length || 0;
  const activeBeds =
    devices?.filter((d) => {
      if (d.type !== 'sensor_gateway') return false;
      if (typeof d.status === 'object' && d.status !== null) return d.status.online === true;
      return true;
    }).length || 0;
  const bedActivationRate = totalBeds > 0 ? Math.round((activeBeds / totalBeds) * 100) : 0;

  const activeMembers =
    approvedUsers?.filter(
      (u) =>
        u.is_active && u.is_approved && (u.role === 'team_leader' || u.role === 'team_member')
    ).length || 0;

  // 권한
  const canManageUsers =
    user.role === 'system_admin' || user.role === 'super_admin' || user.email === 'sky3rain7@gmail.com';
  const canManageTeamMembers =
    user.role === 'system_admin' ||
    user.role === 'super_admin' ||
    user.role === 'team_leader' ||
    user.role === 'team_member';
  const canManageFarms =
    user.role === 'system_admin' ||
    user.role === 'super_admin' ||
    user.role === 'team_leader' ||
    user.email === 'sky3rain7@gmail.com';

  // ⬇️ 문제되던 즉시실행 JSX 블록을 함수로 분리
  const renderFarmOverview = (): React.ReactNode => {
    const filteredFarms = (farms || [])
      .filter((farm) => {
        if (
          user.role === 'system_admin' ||
          user.role === 'super_admin' ||
          user.email === 'sky3rain7@gmail.com'
        ) {
          return true;
        }
        if (farm.is_hidden) return false;
        if (user.role === 'team_leader' || user.role === 'team_member') {
          if (userSettings.showOnlyMyFarm) return farm.id === user.team_id;
        }
        return true;
      })
      .map((farm) => {
        const farmDevices = (devices || []).filter(
          (d) => d.farm_id === farm.id && d.type === 'sensor_gateway'
        );
        const visible = farmDevices.filter((device) => bedDashboardSettings[device.id] !== false);
        const sortedVisibleDevices = sortBeds([...visible]);
        return { ...farm, visibleDevices: sortedVisibleDevices };
      });

    if (filteredFarms.length === 0) {
      return (
        <div className="text-center py-16">
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            {userSettings.showOnlyMyFarm ? '자기 농장에 베드가 없습니다' : '표시할 베드가 없습니다'}
          </h3>
          <p className="text-gray-600 mb-6">
            {user.role === 'team_leader' || user.role === 'team_member'
              ? userSettings.showOnlyMyFarm
                ? '자기 농장에 베드를 추가하거나 "자기 농장만 보기"를 끄면 모든 농장을 볼 수 있습니다'
                : '농장 관리에서 베드를 활성화하거나 새 베드를 추가해보세요'
              : '농장 관리에서 베드를 활성화하거나 새 베드를 추가해보세요'}
          </p>
        </div>
      );
    }

    return (
      <>
        {filteredFarms.map((farm) => {
          const farmHasAlerts = hasFarmAlerts(farm.id);
          const farmAlerts = getFarmAlerts(farm.id);
          const criticalAlerts = farmAlerts.filter((a) => a.level === 'critical').length;
          const highAlerts = farmAlerts.filter((a) => a.level === 'high').length;

          return (
            <div
              key={farm.id}
              className={`bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border rounded-2xl p-2 sm:p-3 lg:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                farmHasAlerts
                  ? 'border-red-400 ring-2 ring-red-300 animate-pulse shadow-red-200'
                  : 'border-gray-200'
              }`}
            >
              {/* 농장 헤더 */}
              <div className={`bg-gradient-to-r ${getFarmGradient(farm.id)} rounded-xl p-4 mb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-6">
                      <h4 className="text-2xl lg:text-3xl font-bold text-white whitespace-nowrap">
                        {farm.name}
                      </h4>
                      <div className="flex items-center space-x-4">
                        <p className="text-white/90 font-medium text-sm">
                          📍 {farm.location || '위치 정보 없음'}
                        </p>
                        <span className="text-sm text-white/90 font-semibold">
                          📊 총 {farm.visibleDevices.length}개 베드
                        </span>
                        {farmHasAlerts ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1 px-2 py-1 bg-red-500/30 border border-red-300 rounded-full backdrop-blur-sm">
                              <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                              <span className="text-xs text-white font-bold">
                                ⚠️ {farmAlerts.length}개 알림
                                {criticalAlerts > 0 && ` (긴급 ${criticalAlerts}개)`}
                                {highAlerts > 0 && ` (높음 ${highAlerts}개)`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-white/80">활성</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 농장 관리 버튼 */}
                    <div className="flex items-center space-x-2">
                      {canManageFarms && (
                        <button
                          onClick={() => router.push(`/beds?farm=${farm.id}`)}
                          className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition-all duration-200 whitespace-nowrap border border-white/30"
                        >
                          농장 관리
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 베드 카드들 */}
              <div className="space-y-2 sm:space-y-3">
                <h5 className="text-xl lg:text-2xl font-semibold text-gray-600 mb-2 sm:mb-3 lg:mb-4 flex items-center">
                  {farm.name}의 베드 현황
                </h5>

                <div className="grid grid-cols-1 gap-1 sm:gap-2 lg:gap-3">
                  {farm.visibleDevices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>현재 표시할 베드가 없습니다.</p>
                    </div>
                  ) : (
                    farm.visibleDevices.map((device: Device, deviceIndex: number) => {
                      const deviceSensors = (sensors || []).filter((s) => s.device_id === device.id);

                      const label = (() => {
                        const location = String(device.meta?.location ?? '센서 게이트웨이');
                        const jo = location.match(/^조(\d+)-베드(\d+)/);
                        if (jo) return `베드-${jo[2]}`;
                        const fm = location.match(/^농장(\d+)-베드(\d+)/);
                        if (fm) return `베드-${fm[2]}`;
                        const bedDash = location.match(/^베드-(\d+)/);
                        if (bedDash) return `베드-${bedDash[1]}`;
                        const bedOnly = location.match(/^베드(\d+)/);
                        if (bedOnly) return `베드-${bedOnly[1]}`;
                        return `베드-${device.id.slice(-4)}`;
                      })();

                      const recentAlert = getRecentAlertForBed(device.id);
                      const tempSensor = deviceSensors.find((s) => s.type === 'temperature');
                      const humSensor = deviceSensors.find((s) => s.type === 'humidity');
                      const ecSensor = deviceSensors.find((s) => s.type === 'ec');
                      const phSensor = deviceSensors.find((s) => s.type === 'ph');

                      const tempReading =
                        tempSensor && sensorReadings.find((r) => r.sensor_id === tempSensor.id);
                      const humReading =
                        humSensor && sensorReadings.find((r) => r.sensor_id === humSensor.id);
                      const ecReading =
                        ecSensor && sensorReadings.find((r) => r.sensor_id === ecSensor.id);
                      const phReading =
                        phSensor && sensorReadings.find((r) => r.sensor_id === phSensor.id);

                      const cropData = bedCropData[device.id];
                      const firstTier =
                        cropData && Object.keys(cropData).sort((a, b) => +a - +b)[0];
                      const cropName = firstTier ? cropData[+firstTier]?.cropName : '미설정';
                      const growingMethod = firstTier
                        ? cropData[+firstTier]?.growingMethod
                        : '미설정';

                      return (
                        <div
                          key={device.id}
                          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                          data-device-id={device.id}
                          data-device-index={deviceIndex}
                        >
                          <div className="p-3 sm:p-4 lg:p-6">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <span className="font-bold text-gray-600 text-lg lg:text-xl">
                                    {label}
                                  </span>
                                  <div className="text-sm text-gray-500">📊 센서 {deviceSensors.length}개</div>
                                  <div className="mt-2 flex items-center space-x-3">
                                    <span className="text-sm text-green-600 font-medium">🌱 {cropName}</span>
                                    <span className="text-sm text-blue-600 font-medium">🔧 {growingMethod}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                {recentAlert && (
                                  <div
                                    className={`flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-bold ${getBedStatusColor(
                                      device.id
                                    )} animate-bounce shadow-lg`}
                                  >
                                    <span className="animate-pulse">{getBedStatusIcon(device.id)}</span>
                                    <span className="truncate max-w-[120px]">{recentAlert.title}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 제어 상태 */}
                            <div className="mb-3 sm:mb-4">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-sm">
                                <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2 sm:p-3 ring-1 ring-gray-300">
                                  <span className="text-lg">💡</span>
                                  <span className="text-gray-600 font-medium">램프1</span>
                                  <span
                                    className={`font-bold text-right ${
                                      localActuatorStates['lamp1'] ? 'text-green-600' : 'text-gray-400'
                                    }`}
                                  >
                                    {localActuatorStates['lamp1'] ? 'ON' : 'OFF'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2 sm:p-3 ring-1 ring-gray-300">
                                  <span className="text-lg">💡</span>
                                  <span className="text-gray-600 font-medium">램프2</span>
                                  <span
                                    className={`font-bold text-right ${
                                      localActuatorStates['lamp2'] ? 'text-green-600' : 'text-gray-400'
                                    }`}
                                  >
                                    {localActuatorStates['lamp2'] ? 'ON' : 'OFF'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2 sm:p-3 ring-1 ring-gray-300">
                                  <span className="text-lg">💧</span>
                                  <span className="text-gray-600 font-medium">펌프</span>
                                  <span
                                    className={`font-bold text-right ${
                                      localActuatorStates['pump'] ? 'text-green-600' : 'text-gray-400'
                                    }`}
                                  >
                                    {localActuatorStates['pump'] ? 'ON' : 'OFF'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2 sm:p-3 ring-1 ring-gray-300">
                                  <span className="text-lg">🌀</span>
                                  <span className="text-gray-600 font-medium">팬</span>
                                  <span
                                    className={`font-bold text-right ${
                                      localActuatorStates['fan'] ? 'text-green-600' : 'text-gray-400'
                                    }`}
                                  >
                                    {localActuatorStates['fan'] ? 'ON' : 'OFF'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 센서 데이터 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mt-2 sm:mt-3 lg:mt-4">
                              <div className="flex items-center justify-between bg-red-50 rounded-lg p-3 sm:p-4 lg:p-5 shadow-md border border-red-300">
                                <div className="flex items-center space-x-3">
                                  <span className="text-3xl">🌡️</span>
                                  <span className="text-lg lg:text-xl text-gray-600 font-bold">온도</span>
                                </div>
                                <span className="text-3xl lg:text-4xl font-black text-red-600">
                                  {tempReading ? `${parseFloat(tempReading.value).toFixed(2)}°C` : '--°C'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 sm:p-4 lg:p-5 shadow-md border border-blue-300">
                                <div className="flex items-center space-x-3">
                                  <span className="text-3xl">💧</span>
                                  <span className="text-lg lg:text-xl text-gray-600 font-bold">습도</span>
                                </div>
                                <span className="text-3xl lg:text-4xl font-black text-blue-600">
                                  {humReading ? `${parseFloat(humReading.value).toFixed(2)}%` : '--%'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between bg-green-50 rounded-lg p-3 sm:p-4 lg:p-5 shadow-md border border-green-300">
                                <div className="flex items-center space-x-3">
                                  <span className="text-3xl">⚡</span>
                                  <span className="text-lg lg:text-xl text-gray-600 font-bold">EC</span>
                                </div>
                                <span className="text-3xl lg:text-4xl font-black text-green-600">
                                  {ecReading ? `${parseFloat(ecReading.value).toFixed(2)}` : '--'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3 sm:p-4 shadow-md border border-purple-300">
                                <div className="flex items-center space-x-3">
                                  <span className="text-3xl">🧪</span>
                                  <span className="text-lg text-gray-600 font-bold">pH</span>
                                </div>
                                <span className="text-3xl font-black text-purple-600">
                                  {phReading ? `${parseFloat(phReading.value).toFixed(2)}` : '--'}
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
        })}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <AppHeader
        user={user}
        title="Tera Hub"
        subtitle={
          user.role === 'system_admin'
            ? user.email === 'sky3rain7@gmail.com'
              ? '인도어 스마트팜 ALL-IN-ONE BOARD'
              : '시스템 관리자 대시보드'
            : user.role === 'team_leader'
            ? `${user.team_name} 조장 대시보드`
            : `${user.team_name} 팀원 대시보드`
        }
        isDashboard={true}
        onDashboardRefresh={() => window.location.reload()}
      />

      {/* Main */}
      <main className="max-w-7xl mx-auto pt-4 pb-8 sm:px-6 lg:px-8 relative z-10">
        {/* Stats */}
        <div className="mb-4 sm:mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-gray-200 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-300">
              <div className="p-2 sm:p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-lg">🏠</span>
                  </div>
                  <div className="ml-4">
                    <dt className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      농장 수
                    </dt>
                    <dd className="text-lg sm:text-2xl font-black text-gray-600">{totalFarms}</dd>
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
              <div className="p-2 sm:p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="ml-4">
                    <dt className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      베드 활성률
                    </dt>
                    <dd className="text-lg sm:text-2xl font-black text-gray-600">{bedActivationRate}%</dd>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {activeBeds}/{totalBeds}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">활성/전체</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-gray-200 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:border-purple-300">
              <div className="p-2 sm:p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="ml-4">
                    <dt className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      배양액 레시피
                    </dt>
                    <dd className="text-lg sm:text-2xl font-black text-gray-600">{recipeStats.total}</dd>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">{recipeStats.today}</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">오늘 추가</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-gray-200 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-300">
              <div className="p-2 sm:p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-lg">🌤️</span>
                  </div>
                  <div className="ml-4">
                    <dt className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      현재 날씨
                    </dt>
                    <dd className="text-lg sm:text-2xl font-black text-gray-600">
                      {weatherData.temperature}°C
                    </dd>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm sm:text-lg font-bold text-blue-600">{weatherData.weatherStatus}</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">{weatherData.region}</div>
                  <div className="text-xs text-gray-500 font-medium">강수확률 {weatherData.precipitation}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Farm Overview Section */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-4 sm:mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 lg:mb-3">
                    농장 현황
                  </h1>
                  <p className="text-white/90 text-sm sm:text-base lg:text-lg">
                    농장관리에서 대시보드 노출을 허용한 농장만 표시 됩니다.
                  </p>
                </div>
              </div>

              {(user.role === 'team_leader' || user.role === 'team_member') && (
                <div className="flex items-center bg-white/20 rounded-xl px-4 py-2">
                  <label className="text-sm font-medium text-white">자기 농장만 보기</label>
                  <button
                    onClick={() => {
                      const next = { ...userSettings, showOnlyMyFarm: !userSettings.showOnlyMyFarm };
                      setUserSettings(next);
                      updateUserSettings(user.id, next);
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
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">{renderFarmOverview()}</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden">
          <div className="px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-600 mb-2">📈 최근 활동</h3>
                <p className="text-gray-600">실시간 센서 데이터와 시스템 활동을 확인하세요</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 font-medium">실시간</span>
                </div>
                <button className="text-blue-600 hover:text-blue-800 font-semibold">전체보기 →</button>
              </div>
            </div>

            <div className="space-y-4">
              {(sensorReadings || []).slice(0, 5).map((reading) => {
                const sensor = (sensors || []).find((s) => s.id === reading.sensor_id);
                const device = (devices || []).find((d) => d.id === sensor?.device_id);
                const farm = (farms || []).find((f) => f.id === device?.farm_id);

                return (
                  <div
                    key={reading.id}
                    className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-xl">📊</span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-600">
                            {farm?.name} - {String(device?.meta?.location || '')}
                          </div>
                          <div className="text-sm text-gray-600">{sensor?.type} 센서 측정</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-gray-600">
                          {reading.value}
                          {reading.unit}
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
                  <h3 className="text-xl font-bold text-gray-600 mb-2">최근 센서 데이터가 없습니다</h3>
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
      </main>
    </div>
  );
}
