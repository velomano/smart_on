'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, getTeams, getApprovedUsers, getUserSettings, updateUserSettings } from '../lib/mockAuth';
import { Farm, Device, Sensor, SensorReading } from '../lib/supabase';
import { mockSystem } from '../lib/mockSystem';
import AppHeader from './AppHeader';
import NotificationButton from './NotificationButton';
import { dashboardAlertManager } from '../lib/dashboardAlerts';
import { checkSensorDataAndNotify } from '../lib/notificationService';
import { DashboardAlert } from '../lib/dashboardAlerts';

interface UserDashboardProps {
  user: AuthUser;
  farms: any[];
  devices: any[];
  sensors: any[];
  sensorReadings: any[];
}

export default function UserDashboard({ user, farms, devices, sensors, sensorReadings }: UserDashboardProps) {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<AuthUser[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [userSettings, setUserSettings] = useState({
    showOnlyMyFarm: false, // 디폴트는 모든 농장 표시
    showAllBedsInBedManagement: false
  });
  const [bedDashboardSettings, setBedDashboardSettings] = useState<Record<string, boolean>>({});
  const [mockSensorData, setMockSensorData] = useState<any[]>([]);
  const [mockActuatorData, setMockActuatorData] = useState<any[]>([]);
  const [mockDataInterval, setMockDataInterval] = useState<NodeJS.Timeout | null>(null);
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
  
  // 센서 데이터 모니터링 기능 추가
  useEffect(() => {
    const monitorSensorData = () => {
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
        
        // 센서 데이터 검증 및 알림
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
      });
    };

    // 30초마다 센서 데이터 체크 (실시간 모니터링)
    const sensorMonitorInterval = setInterval(monitorSensorData, 30000);
    
    // 초기 모니터링 실행
    monitorSensorData();

    return () => {
      clearInterval(sensorMonitorInterval);
    };
  }, [sensorReadings, sensors, devices, farms]);
  
  // 팀 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // Mock 시스템 초기화 및 시작
        mockSystem.initialize();
        mockSystem.start();

        // Mock 데이터 업데이트를 위한 주기적 폴링
        const updateMockData = () => {
          const sensorData = mockSystem.getBedSensorData('bed_001'); // 예시: 첫 번째 베드
          const actuatorData = mockSystem.getBedActuators('bed_001');
          setMockSensorData(sensorData);
          setMockActuatorData(actuatorData);
          
          // 로컬 액추에이터 상태가 없을 때만 Mock 데이터로 초기화
          setLocalActuatorStates(prev => {
            const newStates = { ...prev };
            actuatorData.forEach((actuator: any) => {
              if (prev[actuator.deviceId] === undefined) {
                newStates[actuator.deviceId] = actuator.status === 'on';
              }
            });
            return newStates;
          });
          
          // Mock 센서 데이터 직접 모니터링 (alarm test)
          checkMockSensorData();
        };

        // Mock 센서 데이터 알림 체크 함수 추가 (2농장 1베드만 테스트)
        const checkMockSensorData = async () => {
          console.log('🔔 경고 알림 테스트 시작!');
          
          // test1 계정을 위한 텔레그램 ID 강제 저장
          try {
            const currentUserData = localStorage.getItem('mock_user');
            if (currentUserData) {
              const currentUser = JSON.parse(currentUserData);
              if (currentUser.email === 'test1@test.com') {
                // test1 계정용 텔레그램 ID 확인 및 초기화
                const currentSettings = localStorage.getItem('notificationSettings');
                const userDefinedId = currentSettings ? JSON.parse(currentSettings).telegramChatId : '';
                
                // 사용자가 입력한 ID가 있으면 사용, 없으면 기본값 사용
                if (userDefinedId && userDefinedId.trim() !== '') {
                  localStorage.setItem('test1_telegram_chat_id', userDefinedId);
                  console.log('🔧 test1 계정: 사용자 입력 텔레그램 채팅 ID 사용:', userDefinedId);
                } else {
                  const testChatId = localStorage.getItem('test1_telegram_chat_id');
                  if (!testChatId || testChatId === 'no-telegram-set' || testChatId === '123456789') {
                    const defaultTest1Id = '6827239951'; // test1 계정용 기본 텔레그램 채팅 ID
                    localStorage.setItem('test1_telegram_chat_id', defaultTest1Id);
                    console.log('🔧 test1 계정용 기본 텔레그램 채팅 ID 저장됨:', defaultTest1Id);
                  }
                }
              }
            }
          } catch (error) {
            console.error('텔레그램 ID 저장 실패:', error);
          }
          
          // 2농장 1베드만 체크 (bed_003)
          const testBedId = 'bed_003';
          const bedSensorData = mockSystem.getBedSensorData(testBedId);
          
          console.log('센서 데이터 확인:', bedSensorData);
          
          // 각 센서 데이터에 대해 경고 체크 (습도만 저습도 상태로 모니터링)
          for (const sensor of bedSensorData) {
            // 습도 센서만 체크하고, 테스트 목적으로 값 강제 수정
            if (sensor.type === 'humidity') {
              console.log('💧 습도 센서 데이터:', sensor);
              
              const farmId = 'farm_002';   // 2농장
              
              const farm = farms.find(f => f.id === farmId) || {
                id: farmId,
                name: '2농장',
                location: '테스트 농장 위치'
              };
              
              const location = `${farm.name}-베드1`;
              console.log('📍 경고 위치:', location);
              
              // 습도 임계값 설정
              const humidityThreshold = { min: 30, max: 80 };
              
              // 테스트용으로 습도 값을 낮게 조정 
              const testHumidityValue = Math.random() * 15 + 5;  // 5-20% (임계값 30% 이하)
              console.log('💧 테스트 습도 값:', testHumidityValue);
              
              try {
                await checkSensorDataAndNotify({
                  id: `${testBedId}_${sensor.type}`,
                  type: 'humidity',
                  value: testHumidityValue,
                  location: location,
                  timestamp: new Date(sensor.lastUpdate),
                  thresholds: humidityThreshold,
                  deviceId: testBedId
                });
                console.log('✅ 경고 전송 완료!');
              } catch (error) {
                console.error('Mock 습도 센서 모니터링 에러:', error);
              }
            }
          }
        };

        // 초기 데이터 로드
        updateMockData();
        
        // 즉시 경고 알림 테스트 실행
        setTimeout(() => {
          console.log('🚨 즉시 경고 테스트 실행');
          checkMockSensorData();
        }, 1000);

        // 5초마다 Mock 데이터 업데이트
        const interval = setInterval(updateMockData, 5000);
        setMockDataInterval(interval);

        const [teamsResult, usersResult] = await Promise.all([
          getTeams(),
          getApprovedUsers()
        ]);
        
        if (teamsResult.success) {
          setTeams(teamsResult.teams);
        }
        
        if (usersResult.success) {
          setApprovedUsers(usersResult.users as AuthUser[]);
        }
        
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
        console.error('Error loading data:', error);
      } finally {
        setTeamsLoading(false);
      }
    };
    loadData();

    // 컴포넌트 언마운트 시 Mock 시스템 정리
    return () => {
      mockSystem.stop();
      if (mockDataInterval) {
        clearInterval(mockDataInterval);
      }
    };
  }, [user.id]);
  
  // 통계 계산
  const totalFarms = farms.length;
  const totalBeds = devices.filter(d => d.type === 'sensor_gateway').length; // 실제 센서 게이트웨이(베드) 수
  const activeBeds = devices.filter(d => d.type === 'sensor_gateway' && d.status?.online).length;
  const bedActivationRate = totalBeds > 0 ? Math.round((activeBeds / totalBeds) * 100) : 0;
  
  const activeTeams = teams.length; // 실제 활성화된 조의 수
  const activeMembers = approvedUsers.filter(user => 
    user.is_active && user.is_approved && 
    (user.role === 'team_leader' || user.role === 'team_member')
  ).length; // 실제 활성화된 팀원 수
  
  // 평균 조당 인원 계산
  const averageMembersPerTeam = activeTeams > 0 ? Math.round(activeMembers / activeTeams) : 0;
  const tempReadings = sensorReadings.filter(r => r.unit === '°C').slice(0, 10);
  const averageTemp = tempReadings.reduce((sum, r) => sum + r.value, 0) / Math.max(tempReadings.length, 1);

        // 사용자 역할에 따른 권한 확인
        const canManageUsers = user.role === 'system_admin' || user.email === 'sky3rain7@gmail.com';
        const canManageTeamMembers = user.role === 'team_leader' || user.role === 'team_member';
        const canManageFarms = user.role === 'system_admin' || user.role === 'team_leader' || user.email === 'sky3rain7@gmail.com';
        const canViewData = true; // 모든 사용자는 데이터 조회 가능


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <AppHeader
        user={user}
        title="Smart Farm"
        subtitle={user.role === 'system_admin' ? 
                    (user.email === 'sky3rain7@gmail.com' ? '최종 관리자 대시보드' : '시스템 관리자 대시보드') : 
                   user.role === 'team_leader' ? `${user.team_name} 조장 대시보드` : 
                   `${user.team_name} 팀원 대시보드`}
        isDashboard={true}
        onDashboardRefresh={() => window.location.reload()}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto pt-6 pb-6 sm:px-6 lg:px-8 relative z-10">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🏠</span>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      농장 수
                    </dt>
                    <dd className="text-3xl font-black text-gray-900">{totalFarms}</dd>
                    <div className="text-sm text-gray-500 mt-1">
                      활성화된 조: {teamsLoading ? '...' : activeTeams}개
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-blue-500 font-bold">
                    {teamsLoading ? '...' : activeMembers}
                  </div>
                  <div className="text-xs text-gray-500">총 팀원 수</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🌱</span>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      베드 활성률
                    </dt>
                    <dd className="text-3xl font-black text-gray-900">{bedActivationRate}%</dd>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-green-500 font-bold">{activeBeds}/{totalBeds}</div>
                  <div className="text-xs text-gray-500">활성/전체</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      활성화 팀원 수
                    </dt>
                    <dd className="text-3xl font-black text-gray-900">
                      {teamsLoading ? '...' : activeMembers}
                    </dd>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-purple-500 font-bold">
                    {teamsLoading ? '...' : activeTeams}
                  </div>
                  <div className="text-xs text-gray-500">총 농장 수</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🌡️</span>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      평균 온도
                    </dt>
                    <dd className="text-3xl font-black text-gray-900">{averageTemp.toFixed(1)}°C</dd>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-orange-500 font-bold">적정</div>
                  <div className="text-xs text-gray-500">상태</div>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Farm Overview */}
        <div className="bg-white/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  🏡 농장 현황
                </h3>
                <p className="text-gray-600">전체 농장과 디바이스 상태를 한눈에 확인하세요</p>
              </div>
              <div className="flex items-center space-x-4">
                {/* 농장장/팀원용 설정 토글 */}
                {(user.role === 'team_leader' || user.role === 'team_member') && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      자기 농장만 보기
                    </label>
                    <button
                      onClick={() => {
                        const newSettings = { ...userSettings, showOnlyMyFarm: !userSettings.showOnlyMyFarm };
                        setUserSettings(newSettings);
                        updateUserSettings(user.id, newSettings);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        userSettings.showOnlyMyFarm ? 'bg-blue-600' : 'bg-gray-200'
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
            <div className="space-y-6">
              {(() => {
                // 농장 필터링 및 베드 계산
                const filteredFarms = farms.filter(farm => {
                  // 농장장/팀원인 경우 설정에 따라 필터링
                  if (user.role === 'team_leader' || user.role === 'team_member') {
                    if (userSettings.showOnlyMyFarm) {
                      // 자기 농장만 표시
                      return farm.id === user.team_id;
                    }
                    // 설정이 꺼져있으면 모든 농장 표시
                  }
                  return true;
                }).map(farm => {
                  // 농장의 베드들 중 대시보드에 노출되는 것들만 필터링
                  const farmDevices = devices.filter(d => d.farm_id === farm.id && d.type === 'sensor_gateway');
                  const visibleDevices = farmDevices.filter(device => {
                    // 베드별 대시보드 노출 설정 확인
                    const showOnDashboard = bedDashboardSettings[device.id] !== false; // 기본값은 true
                    
                    // 관리자는 모든 베드 표시, 팀원은 설정에 따라
                    if (user.role === 'system_admin' || user.email === 'sky3rain7@gmail.com') {
                      return showOnDashboard; // 관리자는 베드별 설정에 따라 표시
                    }
                    return showOnDashboard; // 팀원도 베드별 설정에 따라 표시
                  });
                  
                  return {
                    ...farm,
                    visibleDevices
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

                return filteredFarms.map((farm) => (
                <div key={farm.id} className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                    {/* 농장 헤더 */}
                    <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-3xl">🏠</span>
                      </div>
                      <div>
                          <h4 className="text-2xl font-bold text-gray-900">{farm.name}</h4>
                          <p className="text-gray-600 font-medium text-lg">🏷️ 농장 ID: {farm.id}</p>
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-sm text-blue-600 font-semibold">
                              📊 총 {farm.visibleDevices.length}개 베드
                            </span>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-xs text-gray-500">활성</span>
                      </div>
                    </div>
                        </div>
                      </div>
                      
                      {/* 농장별 관리 버튼들 */}
                      <div className="flex items-center space-x-2">
                        {canManageFarms && (
                          <button
                            onClick={() => {
                              // 농장장인 경우 자기 농장으로, 관리자인 경우 해당 농장으로 이동
                              const targetFarmId = user.role === 'team_leader' ? user.team_id : farm.id;
                              router.push(`/beds?farm=${targetFarmId}`);
                            }}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                          >
                            농장 관리
                          </button>
                        )}
                    </div>
                  </div>

                  {/* 농장에 속한 베드들 */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                      <span className="text-xl mr-2">🌱</span>
                      {farm.name}의 베드 현황
                    </h5>

                    {/* 농장별 베드 요약 정보 */}
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">

                      {/* 베드 목록 */}
                      <div className="space-y-6">
                        {farm.visibleDevices.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>현재 표시할 베드가 없습니다.</p>
                          </div>
                        ) : (
                          farm.visibleDevices.map((device: Device, deviceIndex: number) => {
                          const deviceSensors = sensors.filter(s => s.device_id === device.id);
                            
                            // 전체 알림 로그와 비교 
                            const allAlerts = dashboardAlertManager.getAlerts();
                            const bedAlerts = getBedAlerts(device.id);
                            
                            

                          return (
                            <div
                              key={device.id}
                              className={`my-2 bg-gray-50 rounded-lg p-4 border-l-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 ${
                                (() => {
                                  const hasDirectAlerts = getBedAlerts(device.id).length > 0;
                                  
                                  // Device ID 변환: device-X -> bed_00X 형식으로 변환
                                  let bedIdToCheck = '';
                                  if (device.id === 'device-1') bedIdToCheck = 'bed_001';
                                  else if (device.id === 'device-2') bedIdToCheck = 'bed_002';
                                  else if (device.id === 'device-3') bedIdToCheck = 'bed_003';
                                  else if (device.id === 'device-4') bedIdToCheck = 'bed_004';
                                  else if (device.id === 'device-5') bedIdToCheck = 'bed_005';
                                  else if (device.id === 'device-6') bedIdToCheck = 'bed_006';
                                  else bedIdToCheck = device.id;
                                  
                                  const deviceHasMbmsAlert = allAlerts.some(alert => 
                                    (alert.deviceId === device.id || alert.deviceId === bedIdToCheck) && !alert.isRead
                                  );
                                  const shouldBlink = hasDirectAlerts || deviceHasMbmsAlert;
                                  
                                  // 더 엄격한 조건 진단
                                  const alertsForThisBed = allAlerts.filter(a => 
                                    (a.deviceId === device.id || a.deviceId === bedIdToCheck) && !a.isRead
                                  );
                                  
                                  
                                  // 실제 알림이 있는 베드만 정확히 깜빡이기
                                  if (shouldBlink && alertsForThisBed.length > 0) {
                                    const recentAlert = getRecentAlertForBed(device.id) || 
                                                      allAlerts.find(a => (a.deviceId === device.id || a.deviceId === bedIdToCheck) && !a.isRead);
                                    
                                    // 더 눈에 띄는 깜빡임 효과 적용
                                    if (recentAlert) {
                                      switch (recentAlert.level) {
                                        case 'critical': return 'border-l-red-600 animate-bounce shadow-2xl shadow-red-300 ring-4 ring-red-200 bg-red-50';
                                        case 'high': return 'border-l-orange-500 animate-bounce shadow-xl shadow-orange-300 ring-2 ring-orange-200 bg-orange-50';
                                        case 'medium': return 'border-l-yellow-500 animate-bounce shadow-lg shadow-yellow-300 ring-1 ring-yellow-200 bg-yellow-50';
                                        case 'low': return 'border-l-blue-500 animate-pulse shadow-lg shadow-blue-300 ring-1 ring-blue-200 bg-blue-50';
                                        default: return 'border-l-red-600 animate-bounce shadow-2xl shadow-red-300 ring-4 ring-red-200 bg-red-50';
                                      }
                                    }
                                    
                                    // 기본 경고 깜빡이기 (더 강한 효과)
                                    return 'border-l-red-600 animate-bounce shadow-2xl shadow-red-300 ring-4 ring-red-200 bg-red-50';
                                  }
                                  return 'border-l-green-400';
                                })()
                              }`}
                              data-device-id={device.id}
                              data-device-index={deviceIndex}
                            >
                              {/* 베드 헤더 */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                                    <span className="text-sm">📡</span>
                              </div>
                              <div>
                                    <span className="font-bold text-gray-900 text-sm">
                                      {String((device.meta?.location ?? '센서 게이트웨이')).replace(/^농장\d+-/, '')}
                                    </span>
                                    <div className="text-xs text-gray-500">📊 센서 {deviceSensors.length}개</div>
                                    {/* 작물명과 재배 방식 표시 */}
                                    <div className="mt-1 flex items-center space-x-2">
                                      <span className="text-xs text-green-600 font-medium">
                                        🌱 {(device.meta as any)?.crop_name || '미설정'}
                                      </span>
                                      <span className="text-xs text-blue-600 font-medium">
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

                              {/* 제어 상태 - Mock 액추에이터 상태 */}
                              <div className="mb-3">
                                <div className="flex items-center space-x-4 text-xs">
                                  <div className="flex items-center space-x-1">
                                    <span>💡</span>
                                    <span className="text-gray-600">램프1</span>
                                    <span className={`font-bold ${localActuatorStates['lamp1'] ? 'text-green-600' : 'text-gray-400'}`}>
                                      {localActuatorStates['lamp1'] ? 'ON' : 'OFF'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span>💡</span>
                                    <span className="text-gray-600">램프2</span>
                                    <span className={`font-bold ${localActuatorStates['lamp2'] ? 'text-green-600' : 'text-gray-400'}`}>
                                      {localActuatorStates['lamp2'] ? 'ON' : 'OFF'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span>💧</span>
                                    <span className="text-gray-600">펌프</span>
                                    <span className={`font-bold ${localActuatorStates['pump'] ? 'text-green-600' : 'text-gray-400'}`}>
                                      {localActuatorStates['pump'] ? 'ON' : 'OFF'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span>🌀</span>
                                    <span className="text-gray-600">팬</span>
                                    <span className={`font-bold ${localActuatorStates['fan'] ? 'text-green-600' : 'text-gray-400'}`}>
                                      {localActuatorStates['fan'] ? 'ON' : 'OFF'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* 센서 데이터 */}
                              <div className="grid grid-cols-4 gap-2">
                                <div className="flex items-center justify-between bg-red-50 rounded p-2">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-sm">🌡️</span>
                                    <span className="text-xs text-gray-600">온도</span>
                                  </div>
                                  <span className="text-sm font-bold text-red-600">
                                    {(() => {
                                      // Mock 데이터 우선 사용
                                      const mockTemp = mockSensorData.find(s => s.type === 'temperature');
                                      if (mockTemp) {
                                        return `${mockTemp.value}°C`;
                                      }
                                      
                                      // 기존 데이터 폴백
                                      const tempSensor = deviceSensors.find(s => s.type === 'temperature');
                                      const reading = tempSensor && sensorReadings.find(r => r.sensor_id === tempSensor.id);
                                      return reading ? `${reading.value}°C` : '--°C';
                                    })()}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between bg-blue-50 rounded p-2">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-sm">💧</span>
                                    <span className="text-xs text-gray-600">습도</span>
                                  </div>
                                  <span className="text-sm font-bold text-blue-600">
                                    {(() => {
                                      // Mock 데이터 우선 사용
                                      const mockHumidity = mockSensorData.find(s => s.type === 'humidity');
                                      if (mockHumidity) {
                                        return `${mockHumidity.value}%`;
                                      }
                                      
                                      // 기존 데이터 폴백
                                      const humiditySensor = deviceSensors.find(s => s.type === 'humidity');
                                      const reading = humiditySensor && sensorReadings.find(r => r.sensor_id === humiditySensor.id);
                                      return reading ? `${reading.value}%` : '--%';
                                    })()}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between bg-green-50 rounded p-2">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-sm">⚡</span>
                                    <span className="text-xs text-gray-600">EC</span>
                                  </div>
                                  <span className="text-sm font-bold text-green-600">
                                    {(() => {
                                      // Mock 데이터 우선 사용
                                      const mockEC = mockSensorData.find(s => s.type === 'ec');
                                      if (mockEC) {
                                        return `${mockEC.value}`;
                                      }
                                      
                                      // 기존 데이터 폴백
                                      const ecSensor = deviceSensors.find(s => s.type === 'ec');
                                      const reading = ecSensor && sensorReadings.find(r => r.sensor_id === ecSensor.id);
                                      return reading ? `${reading.value}` : '--';
                                    })()}
                            </span>
                          </div>

                                <div className="flex items-center justify-between bg-purple-50 rounded p-2">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-sm">🧪</span>
                                    <span className="text-xs text-gray-600">pH</span>
                                  </div>
                                  <span className="text-sm font-bold text-purple-600">
                                    {(() => {
                                      // Mock 데이터 우선 사용
                                      const mockPH = mockSensorData.find(s => s.type === 'ph');
                                      if (mockPH) {
                                        return `${mockPH.value}`;
                                      }
                                      
                                      // 기존 데이터 폴백
                                      const phSensor = deviceSensors.find(s => s.type === 'ph');
                                      const reading = phSensor && sensorReadings.find(r => r.sensor_id === phSensor.id);
                                      return reading ? `${reading.value}` : '--';
                                    })()}
                            </span>
                                </div>
                          </div>

                        </div>
                          );
                          })
                        )}
                  </div>
                </div>
                  </div>

                </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
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
              {sensorReadings.slice(0, 5).map((reading) => {
                const sensor = sensors.find(s => s.id === reading.sensor_id);
                const device = devices.find(d => d.id === sensor?.device_id);
                const farm = farms.find(f => f.id === device?.farm_id);
                
                return (
                  <div key={reading.id} className="bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
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
              {sensorReadings.length === 0 && (
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
      </main>

    </div>
  );
}

