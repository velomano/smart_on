'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthUser, getTeams, getApprovedUsers, getCurrentUser } from '../../lib/mockAuth';
import { Farm, Device, Sensor, SensorReading } from '../../lib/supabase';
import { mockSystem } from '../../lib/mockSystem';
import AppHeader from '../../components/AppHeader';
import ActuatorControlModal from '../../components/ActuatorControlModal';
import ScheduleModal from '../../components/ScheduleModal';
import DualTimeModal from '../../components/DualTimeModal';
import SensorChart from '../../components/SensorChart';
import SensorCard from '../../components/SensorCard';

function BedsManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmTab, setSelectedFarmTab] = useState<string>('');
  const [mockSensorData, setMockSensorData] = useState<any[]>([]);
  const [mockActuatorData, setMockActuatorData] = useState<any[]>([]);
  const [mockDataInterval, setMockDataInterval] = useState<NodeJS.Timeout | null>(null);
  const [localActuatorStates, setLocalActuatorStates] = useState<Record<string, boolean>>({});
  const [actuatorSchedules, setActuatorSchedules] = useState<Record<string, any>>({});
  const [actuatorDualTimes, setActuatorDualTimes] = useState<Record<string, any>>({});
  const [selectedActuator, setSelectedActuator] = useState<{
    deviceId: string;
    name: string;
    status: boolean;
  } | null>(null);
  const [showActuatorModal, setShowActuatorModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDualTimeModal, setShowDualTimeModal] = useState(false);
  const [sensorChartData, setSensorChartData] = useState<any[]>([]);
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [targetFarm, setTargetFarm] = useState<Farm | null>(null);
  const [newFarmData, setNewFarmData] = useState({
    name: '',
    description: '',
    location: ''
  });
  const [newBedData, setNewBedData] = useState({
    name: '',
    cropName: '',
    growingMethod: '담액식'
  });

  // 데이터 로드
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
          
          // 액추에이터 상태는 초기에만 설정하고 이후에는 덮어쓰지 않음
          setLocalActuatorStates(prev => {
            // 이미 설정된 상태가 있으면 유지
            if (Object.keys(prev).length > 0) {
              return prev;
            }
            
            // 초기 설정만 수행
            const newStates = { ...prev };
            actuatorData.forEach((actuator: any) => {
              newStates[actuator.deviceId] = actuator.status === 'on';
            });
            return newStates;
          });
        };

        // 초기 데이터 로드
        updateMockData();

        // 24시간 차트 데이터 초기화
        const initialChartData = generateChartData();
        console.log('📊 초기 차트 데이터 생성:', initialChartData.length, '개 데이터 포인트');
        setSensorChartData(initialChartData);

        // 5분마다 Mock 데이터 업데이트 (실제 농장 환경에 적합)
        const interval = setInterval(() => {
          updateMockData();
          
          // 차트 데이터도 업데이트 (새로운 데이터 포인트 추가)
          setSensorChartData(prevData => {
            const newData = [...prevData];
            
            // 288개 데이터 포인트 유지 (5분마다 업데이트, 24시간 데이터)
            if (newData.length >= 288) {
              newData.shift(); // 가장 오래된 데이터 제거
            }
            
            // 새로운 현재 시간 데이터 추가
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            const second = now.getSeconds();
            
            // 시간대별 패턴을 고려한 Mock 데이터 생성
            const baseTemp = 20 + Math.sin((hour - 6) * Math.PI / 12) * 8; // 6시 최저, 18시 최고
            const baseHumidity = 60 + Math.sin((hour - 12) * Math.PI / 12) * 20; // 12시 최저
            const baseEC = 1.5 + Math.sin((hour - 6) * Math.PI / 12) * 0.5;
            const basePH = 6.0 + Math.sin((hour - 12) * Math.PI / 12) * 0.8;
            
            // 더 큰 변동 추가 (센서별로 다른 변동폭)
            const getVariation = (sensorType: string) => {
              switch(sensorType) {
                case 'temperature': return () => (Math.random() - 0.5) * 3; // 온도: ±1.5°C 변동
                case 'humidity': return () => (Math.random() - 0.5) * 4; // 습도: ±2% 변동
                case 'ec': return () => (Math.random() - 0.5) * 0.3; // EC: ±0.15 변동
                case 'ph': return () => (Math.random() - 0.5) * 0.4; // pH: ±0.2 변동
                default: return () => (Math.random() - 0.5) * 2;
              }
            };
            
            const timeVariation = (minute * 60 + second) / 3600 * 0.5; // 시간에 따른 변화 증가
            const waveVariation = Math.sin(second * Math.PI / 30) * 1.0; // 30초 주기 파동 증가
            const randomSpike = Math.random() < 0.1 ? (Math.random() - 0.5) * 2 : 0; // 10% 확률로 급격한 변화
            
            // 센서별 변동 적용
            const tempVariation = getVariation('temperature');
            const humidityVariation = getVariation('humidity');
            const ecVariation = getVariation('ec');
            const phVariation = getVariation('ph');
            
            newData.push({
              time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
              fullTime: now.toISOString(),
              temperature: Math.round((baseTemp + tempVariation() + timeVariation + waveVariation + randomSpike) * 10) / 10,
              humidity: Math.round((baseHumidity + humidityVariation() + timeVariation + waveVariation + randomSpike) * 10) / 10,
              ec: Math.round((baseEC + ecVariation() + timeVariation * 0.1 + waveVariation * 0.1 + randomSpike * 0.1) * 10) / 10,
              ph: Math.round((basePH + phVariation() + timeVariation * 0.1 + waveVariation * 0.1 + randomSpike * 0.1) * 10) / 10
            });
            
            return newData;
          });
        }, 300000); // 5분 = 300,000ms
        setMockDataInterval(interval);

        // 먼저 현재 로그인된 사용자 확인
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.is_approved) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const [teamsResult, usersResult] = await Promise.all([
          getTeams(),
          getApprovedUsers()
        ]);

        setFarms(teamsResult.teams as Farm[]);
        
        // 로컬 스토리지에서 베드 데이터 불러오기
        if (typeof window !== 'undefined') {
          const savedDevices = localStorage.getItem('mock_devices');
          if (savedDevices) {
            setDevices(JSON.parse(savedDevices));
          } else {
            // localStorage에 데이터가 없으면 Mock 데이터 사용하고 저장
            const mockDevices = teamsResult.devices as Device[];
            setDevices(mockDevices);
            localStorage.setItem('mock_devices', JSON.stringify(mockDevices));
            console.log('Mock 베드 데이터를 localStorage에 저장:', mockDevices);
          }
        } else {
          setDevices(teamsResult.devices as Device[]);
        }
        
        setSensors(teamsResult.sensors as Sensor[]);
        setSensorReadings(teamsResult.sensorReadings as SensorReading[]);
        
        // 농장장과 팀원인 경우 자기 농장 탭으로 자동 설정 (URL 파라미터가 없을 때만)
        const farmId = searchParams.get('farm');
        if (!farmId && currentUser && (currentUser.role === 'team_leader' || currentUser.role === 'team_member') && currentUser.team_id) {
          setSelectedFarmTab(currentUser.team_id);
        }
        
        console.log('농장관리 페이지 - 현재 사용자:', currentUser);
        console.log('농장관리 페이지 - 농장 목록:', teamsResult.teams);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
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
  }, [router]);

  // 농장 데이터 로드 후 초기 탭 설정
  useEffect(() => {
    if (farms.length > 0 && !selectedFarmTab) {
      if (user && user.role === 'system_admin') {
        setSelectedFarmTab('all');
      } else {
        setSelectedFarmTab(farms[0].id);
      }
    }
  }, [farms, user, selectedFarmTab]);

  // URL 파라미터 처리 (대시보드에서 특정 농장으로 이동)
  useEffect(() => {
    const farmId = searchParams.get('farm');
    if (farmId && farms.length > 0) {
      setSelectedFarmTab(farmId);
    }
  }, [searchParams, farms]);

  // 필터링된 디바이스
  const getFilteredDevices = () => {
    let filteredDevices = devices.filter(device => device.type === 'sensor_gateway');
    
    // 농장장과 팀원이 로그인한 경우 자기 농장의 베드만 보이도록 필터링
    if (user && (user.role === 'team_leader' || user.role === 'team_member') && user.team_id) {
      filteredDevices = filteredDevices.filter(device => device.farm_id === user.team_id);
    }
    
    if (selectedFarmTab === 'all') {
      return filteredDevices;
    }
    return filteredDevices.filter(device => device.farm_id === selectedFarmTab);
  };

  const filteredDevices = getFilteredDevices();

  // 액추에이터 제어 함수
  const toggleActuator = (deviceId: string) => {
    const newState = !localActuatorStates[deviceId];
    
    setLocalActuatorStates(prev => {
      const newStates = {
        ...prev,
        [deviceId]: newState
      };
      
      // localStorage에 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('actuator_states', JSON.stringify(newStates));
        console.log('💾 액추에이터 상태 저장:', newStates);
      }
      
      return newStates;
    });
    
    // Mock 시스템에 제어 명령 전송 (실제로는 MQTT로 전송)
    const command = {
      device_id: deviceId,
      farm_id: 'farm_001',
      bed_id: 'bed_001',
      action: newState ? 'turn_on' : 'turn_off',
      command_id: `cmd_${Date.now()}`
    };
    
    // Mock 시스템에 명령 전달
    try {
      mockSystem.handleControlCommand('control/farm_001/bed_001/' + deviceId, command);
      console.log(`✅ 액추에이터 제어 성공: ${deviceId} -> ${newState ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.error(`❌ 액추에이터 제어 실패: ${deviceId}`, error);
    }
  };

  // 수동 제어 모달 열기
  const openActuatorModal = (deviceId: string, name: string) => {
    setSelectedActuator({
      deviceId,
      name,
      status: localActuatorStates[deviceId] || false
    });
    setShowActuatorModal(true);
  };

  // 스케줄링 모달 열기
  const openScheduleModal = (deviceId: string, name: string) => {
    setSelectedActuator({
      deviceId,
      name,
      status: localActuatorStates[deviceId] || false
    });
    setShowScheduleModal(true);
  };

  // 듀얼타임 모달 열기
  const openDualTimeModal = (deviceId: string, name: string) => {
    setSelectedActuator({
      deviceId,
      name,
      status: localActuatorStates[deviceId] || false
    });
    setShowDualTimeModal(true);
  };

  // 액추에이터 상태 변경
  const handleActuatorStatusChange = (deviceId: string, status: boolean) => {
    setLocalActuatorStates(prev => ({
      ...prev,
      [deviceId]: status
    }));
    
    // Mock 시스템에 제어 명령 전송
    const command = {
      device_id: deviceId,
      farm_id: 'farm_001',
      bed_id: 'bed_001',
      action: status ? 'turn_on' : 'turn_off',
      command_id: `cmd_${Date.now()}`
    };
    
    try {
      mockSystem.handleControlCommand('control/farm_001/bed_001/' + deviceId, command);
      console.log(`✅ 액추에이터 상태 변경: ${deviceId} -> ${status ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.error(`❌ 액추에이터 상태 변경 실패: ${deviceId}`, error);
    }
  };

  // 스케줄링 설정 저장
  const handleScheduleChange = (deviceId: string, schedule: any) => {
    setActuatorSchedules(prev => ({
      ...prev,
      [deviceId]: schedule
    }));
    console.log(`📅 스케줄링 설정 저장: ${deviceId}`, schedule);
  };

  // 듀얼타임 설정 저장
  const handleDualTimeChange = (deviceId: string, dualTime: any) => {
    setActuatorDualTimes(prev => ({
      ...prev,
      [deviceId]: dualTime
    }));
    console.log(`🔄 듀얼타임 설정 저장: ${deviceId}`, dualTime);
  };

  // 288개 데이터 포인트 생성 (24시간, 5분 간격)
  const generateChartData = () => {
    const now = new Date();
    const data = [];
    
    for (let i = 287; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5분 간격
      const hour = time.getHours();
      const minute = time.getMinutes();
      const second = time.getSeconds();
      
      // 시간대별 패턴을 고려한 Mock 데이터 생성
      const baseTemp = 20 + Math.sin((hour - 6) * Math.PI / 12) * 8; // 6시 최저, 18시 최고
      const baseHumidity = 60 + Math.sin((hour - 12) * Math.PI / 12) * 20; // 12시 최저
      const baseEC = 1.5 + Math.sin((hour - 6) * Math.PI / 12) * 0.5;
      const basePH = 6.0 + Math.sin((hour - 12) * Math.PI / 12) * 0.8;
      
      // 센서별 변동 추가
      const getVariation = (sensorType: string) => {
        switch(sensorType) {
          case 'temperature': return () => (Math.random() - 0.5) * 3; // 온도: ±1.5°C 변동
          case 'humidity': return () => (Math.random() - 0.5) * 4; // 습도: ±2% 변동
          case 'ec': return () => (Math.random() - 0.5) * 0.3; // EC: ±0.15 변동
          case 'ph': return () => (Math.random() - 0.5) * 0.4; // pH: ±0.2 변동
          default: return () => (Math.random() - 0.5) * 2;
        }
      };
      
      const timeVariation = (minute * 60 + second) / 3600 * 0.5;
      const waveVariation = Math.sin(second * Math.PI / 30) * 1.0;
      const randomSpike = Math.random() < 0.1 ? (Math.random() - 0.5) * 2 : 0;
      
      const tempVariation = getVariation('temperature');
      const humidityVariation = getVariation('humidity');
      const ecVariation = getVariation('ec');
      const phVariation = getVariation('ph');
      
      data.push({
        time: time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        fullTime: time.toISOString(),
        temperature: Math.round((baseTemp + tempVariation() + timeVariation + waveVariation + randomSpike) * 10) / 10,
        humidity: Math.round((baseHumidity + humidityVariation() + timeVariation + waveVariation + randomSpike) * 10) / 10,
        ec: Math.round((baseEC + ecVariation() + timeVariation * 0.1 + waveVariation * 0.1 + randomSpike * 0.1) * 10) / 10,
        ph: Math.round((basePH + phVariation() + timeVariation * 0.1 + waveVariation * 0.1 + randomSpike * 0.1) * 10) / 10
      });
    }
    
    return data;
  };

  // 새 농장 추가
  const handleAddFarm = () => {
    if (!newFarmData.name.trim()) {
      alert('농장 이름을 입력해주세요.');
      return;
    }

    const newFarm: Farm = {
      id: `farm-${Date.now()}`,
      name: newFarmData.name,
      location: newFarmData.location,
      tenant_id: user?.tenant_id || '00000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString()
    };

    setFarms(prev => [...prev, newFarm]);
    setSelectedFarmTab(newFarm.id);
    setNewFarmData({ name: '', description: '', location: '' });
    setShowAddFarmModal(false);
    alert(`새 농장 "${newFarm.name}"이 추가되었습니다!`);
  };

  // 새 베드 추가
  const handleAddBed = () => {
    if (!newBedData.name.trim() || !newBedData.cropName.trim()) {
      alert('베드 이름과 작물 이름을 입력해주세요.');
      return;
    }

    if (!targetFarm) {
      alert('농장을 선택해주세요.');
      return;
    }

    const newBed: Device = {
      id: `bed-${Date.now()}`,
      farm_id: targetFarm.id,
      type: 'sensor_gateway',
      status: { online: true },
      meta: {
        location: `${targetFarm?.name || '농장'}-${newBedData.name}`,
        crop_name: newBedData.cropName,
        growing_method: newBedData.growingMethod
      },
      created_at: new Date().toISOString()
    };

    setDevices(prev => [...prev, newBed]);
    
    // 로컬 스토리지에 저장
    if (typeof window !== 'undefined') {
      const updatedDevices = [...devices, newBed];
      localStorage.setItem('mock_devices', JSON.stringify(updatedDevices));
    }
    
    setNewBedData({ name: '', cropName: '', growingMethod: '담액식' });
    setShowAddBedModal(false);
    alert(`새 베드가 ${targetFarm?.name || '농장'}에 추가되었습니다!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {user && <AppHeader user={user} title="농장 관리" subtitle="농장과 베드를 관리하고 모니터링하세요" />}
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">농장 관리</h1>
            <p className="text-gray-600 text-lg">농장과 베드를 관리하고 모니터링하세요</p>
          </div>

          {/* 농장별 탭 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-700">농장별 보기</h4>
              {user && (user.role === 'system_admin' || user.email === 'sky3rain7@gmail.com') && (
                <button
                  onClick={() => setShowAddFarmModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>새 농장 추가</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {/* 시스템 관리자인 경우에만 전체 농장 탭 표시 */}
              {user && user.role === 'system_admin' && (
                <button
                  onClick={() => setSelectedFarmTab('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    selectedFarmTab === 'all'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white/80 text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  전체 농장 ({farms.length}개)
                </button>
              )}
              {/* 농장장과 팀원인 경우 자기 농장만, 관리자인 경우 모든 농장 표시 */}
              {(() => {
                const farmId = searchParams.get('farm');
                const farmsToShow = user && (user.role === 'team_leader' || user.role === 'team_member') && user.team_id && !farmId
                  ? farms.filter(farm => farm.id === user.team_id)
                  : farmId 
                    ? farms.filter(farm => farm.id === farmId)
                    : farms;
                
                return farmsToShow.map(farm => (
                  <button
                    key={farm.id}
                    onClick={() => setSelectedFarmTab(farm.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      selectedFarmTab === farm.id
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-white/80 text-gray-700 hover:bg-green-50'
                    }`}
                  >
                    {farm.name} ({devices.filter(d => d.farm_id === farm.id && d.type === 'sensor_gateway').length}개 베드)
                  </button>
                ));
              })()}
            </div>
          </div>

          {/* 농장별 베드 목록 */}
          <div className="space-y-6">
            {(() => {
              // 선택된 탭에 따라 농장 필터링
              let farmsToShow = farms;
              
              if (selectedFarmTab === 'all') {
                // 전체 농장 표시
                farmsToShow = farms;
              } else if (selectedFarmTab) {
                // 특정 농장만 표시
                farmsToShow = farms.filter(farm => farm.id === selectedFarmTab);
              } else {
                // 기본값: 농장장과 팀원인 경우 자기 농장만, 관리자인 경우 모든 농장 표시
                const farmId = searchParams.get('farm');
                farmsToShow = user && (user.role === 'team_leader' || user.role === 'team_member') && user.team_id && !farmId
                  ? farms.filter(farm => farm.id === user.team_id)
                  : farmId 
                    ? farms.filter(farm => farm.id === farmId)
                    : farms;
              }
              
              const farmGroups = farmsToShow.map(farm => {
                const farmDevices = filteredDevices.filter(device => device.farm_id === farm.id);
                return { farm, devices: farmDevices };
              });

              if (farmGroups.length === 0) {
                return (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl">🌱</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedFarmTab !== 'all' ? 
                        `${farms.find(f => f.id === selectedFarmTab)?.name || '선택된 농장'}에 등록된 베드가 없습니다` :
                        '등록된 농장이 없습니다'
                      }
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {selectedFarmTab !== 'all' ? 
                        '이 농장에 새로운 베드를 추가해보세요.' :
                        '새로운 농장을 추가해보세요.'
                      }
                    </p>
                    {selectedFarmTab !== 'all' && user && user.role !== 'team_member' && (
                      <button 
                        onClick={() => setShowAddBedModal(true)}
                        className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        + 새 베드 추가
                      </button>
                    )}
                  </div>
                );
              }

              return farmGroups.map(({ farm, devices }) => (
                <div key={farm.id} className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                  {/* 농장 헤더 */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-3xl">🏠</span>
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900">{farm.name}</h4>
                        <p className="text-gray-600 font-medium text-lg">📍 {farm.location || '위치 정보 없음'}</p>
                        <div className="mt-2 flex items-center space-x-4">
                          <span className="text-sm text-blue-600 font-semibold">
                            📊 총 {devices.length}개 베드
                          </span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-500">활성</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold border border-green-200">
                      🟢 온라인
                    </span>
                  </div>

                  {/* 농장에 속한 베드들 */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                      <span className="text-xl mr-2">🌱</span>
                      {farm.name}의 베드 목록
                    </h5>

                    <div className="space-y-3">
                      {devices.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">🌱</span>
                          </div>
                          <p className="text-gray-500 font-medium">이 농장에 등록된 베드가 없습니다</p>
                          <p className="text-sm text-gray-400 mt-1">새 베드를 추가해보세요</p>
                        </div>
                      ) : (
                        devices.map((device) => {
                        const deviceSensors = sensors.filter(s => s.device_id === device.id);
          
                        return (
                          <div key={device.id} className="bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                            {/* 베드 헤더 */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                                  <span className="text-lg">📡</span>
                                </div>
                                <div>
                                  <span className="font-bold text-gray-900 text-lg">
                                    {String(device.meta?.location || '센서 게이트웨이').replace(/^농장\d+-/, '')}
                                  </span>
                                  <div className="text-sm text-gray-500">📊 센서 {deviceSensors.length}개</div>
                                  {/* 작물명과 재배 방식 표시 */}
                                  <div className="mt-1 flex items-center space-x-3">
                                    <span className="text-sm text-green-600 font-medium">
                                      🌱 {(device.meta as any)?.crop_name || '미설정'}
                                    </span>
                                    <span className="text-sm text-blue-600 font-medium">
                                      🔧 {(device.meta as any)?.growing_method || '미설정'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`text-sm px-3 py-1 rounded-full font-bold ${
                                  device.status?.online
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {device.status?.online ? '🟢 온라인' : '🔴 오프라인'}
                              </span>
                            </div>

                            {/* 센서 데이터 */}
                            <div className="mb-6">
                              <h6 className="text-sm font-semibold text-gray-700 mb-4">📊 센서 데이터</h6>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <SensorCard
                                  type="temperature"
                                  value={(() => {
                                    const mockTemp = mockSensorData.find(s => s.type === 'temperature');
                                    if (mockTemp) return mockTemp.value;
                                    const tempSensor = deviceSensors.find(s => s.type === 'temperature');
                                    const reading = tempSensor && sensorReadings.find(r => r.sensor_id === tempSensor.id);
                                    return reading ? reading.value : 0;
                                  })()}
                                  unit="°C"
                                  icon="🌡️"
                                  color="#ef4444"
                                  chartData={sensorChartData}
                                  title="온도"
                                />
                                
                                <SensorCard
                                  type="humidity"
                                  value={(() => {
                                    const mockHumidity = mockSensorData.find(s => s.type === 'humidity');
                                    if (mockHumidity) return mockHumidity.value;
                                    const humiditySensor = deviceSensors.find(s => s.type === 'humidity');
                                    const reading = humiditySensor && sensorReadings.find(r => r.sensor_id === humiditySensor.id);
                                    return reading ? reading.value : 0;
                                  })()}
                                  unit="%"
                                  icon="💧"
                                  color="#3b82f6"
                                  chartData={sensorChartData}
                                  title="습도"
                                />
                                
                                <SensorCard
                                  type="ec"
                                  value={(() => {
                                    const mockEC = mockSensorData.find(s => s.type === 'ec');
                                    if (mockEC) return mockEC.value;
                                    const ecSensor = deviceSensors.find(s => s.type === 'ec');
                                    const reading = ecSensor && sensorReadings.find(r => r.sensor_id === ecSensor.id);
                                    return reading ? reading.value : 0;
                                  })()}
                                  unit="mS/cm"
                                  icon="⚡"
                                  color="#10b981"
                                  chartData={sensorChartData}
                                  title="EC"
                                />
                                
                                <SensorCard
                                  type="ph"
                                  value={(() => {
                                    const mockPH = mockSensorData.find(s => s.type === 'ph');
                                    if (mockPH) return mockPH.value;
                                    const phSensor = deviceSensors.find(s => s.type === 'ph');
                                    const reading = phSensor && sensorReadings.find(r => r.sensor_id === phSensor.id);
                                    return reading ? reading.value : 0;
                                  })()}
                                  unit="pH"
                                  icon="🧪"
                                  color="#8b5cf6"
                                  chartData={sensorChartData}
                                  title="pH"
                                />
                              </div>
                            </div>

                            {/* 제어 상태 - Tuya 스마트 스위치 제어 */}
                            <div className="mb-4">
                              <h6 className="text-sm font-semibold text-gray-700 mb-3">🔌 Tuya 스마트 스위치 제어</h6>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">💡</span>
                                      <span className="text-sm font-medium text-gray-700">램프1</span>
                                    </div>
                                    <button 
                                      onClick={() => toggleActuator('lamp1')}
                                      className={`text-sm px-3 py-1 rounded-lg font-bold transition-all duration-200 ${
                                        localActuatorStates['lamp1'] 
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                      }`}
                                    >
                                      {localActuatorStates['lamp1'] ? 'ON' : 'OFF'}
                                    </button>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => openScheduleModal('lamp1', '램프1')}
                                      className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                    >
                                      📅 스케줄링 설정
                                    </button>
                                    <button
                                      onClick={() => openDualTimeModal('lamp1', '램프1')}
                                      className="flex-1 bg-purple-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-purple-600 transition-colors font-medium"
                                    >
                                      🔄 듀얼타임 설정
                                    </button>
                                  </div>
                                </div>

                                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">💡</span>
                                      <span className="text-sm font-medium text-gray-700">램프2</span>
                                    </div>
                                    <button 
                                      onClick={() => toggleActuator('lamp2')}
                                      className={`text-sm px-3 py-1 rounded-lg font-bold transition-all duration-200 ${
                                        localActuatorStates['lamp2'] 
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                      }`}
                                    >
                                      {localActuatorStates['lamp2'] ? 'ON' : 'OFF'}
                                    </button>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => openScheduleModal('lamp2', '램프2')}
                                      className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                    >
                                      📅 스케줄링 설정
                                    </button>
                                    <button
                                      onClick={() => openDualTimeModal('lamp2', '램프2')}
                                      className="flex-1 bg-purple-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-purple-600 transition-colors font-medium"
                                    >
                                      🔄 듀얼타임 설정
                                    </button>
                                  </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">💧</span>
                                      <span className="text-sm font-medium text-gray-700">펌프</span>
                                    </div>
                                    <button 
                                      onClick={() => toggleActuator('pump')}
                                      className={`text-sm px-3 py-1 rounded-lg font-bold transition-all duration-200 ${
                                        localActuatorStates['pump'] 
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                      }`}
                                    >
                                      {localActuatorStates['pump'] ? 'ON' : 'OFF'}
                                    </button>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => openScheduleModal('pump', '펌프')}
                                      className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                    >
                                      📅 스케줄링 설정
                                    </button>
                                    <button
                                      onClick={() => openDualTimeModal('pump', '펌프')}
                                      className="flex-1 bg-purple-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-purple-600 transition-colors font-medium"
                                    >
                                      🔄 듀얼타임 설정
                                    </button>
                                  </div>
                                </div>

                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">🌀</span>
                                      <span className="text-sm font-medium text-gray-700">팬</span>
                                    </div>
                                    <button 
                                      onClick={() => toggleActuator('fan')}
                                      className={`text-sm px-3 py-1 rounded-lg font-bold transition-all duration-200 ${
                                        localActuatorStates['fan'] 
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                      }`}
                                    >
                                      {localActuatorStates['fan'] ? 'ON' : 'OFF'}
                                    </button>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => openScheduleModal('fan', '팬')}
                                      className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                    >
                                      📅 스케줄링 설정
                                    </button>
                                    <button
                                      onClick={() => openDualTimeModal('fan', '팬')}
                                      className="flex-1 bg-purple-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-purple-600 transition-colors font-medium"
                                    >
                                      🔄 듀얼타임 설정
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 액션 버튼들 */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                              <div className="text-xs text-gray-500">
                                마지막 업데이트: {new Date().toLocaleTimeString()}
                              </div>
                              {/* 관리자와 농장장만 편집 버튼 표시 */}
                              {user && user.role !== 'team_member' && (
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => {
                                      // 편집 기능 구현
                                      alert('베드 편집 기능은 추후 구현 예정입니다.');
                                    }}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                  >
                                    편집
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                        })
                      )}
                    </div>
                  </div>

                  {/* 새 베드 추가 버튼 - 관리자와 농장장만 표시 */}
                  {user && user.role !== 'team_member' && (
                    <div className="flex justify-center mt-6">
                      <button 
                        onClick={() => {
                          setTargetFarm(farm);
                          setShowAddBedModal(true);
                        }}
                        className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        + 새 베드 추가
                      </button>
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>
      </main>

      {/* 새 농장 추가 모달 */}
      {showAddFarmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">새 농장 추가</h3>
              <button
                onClick={() => setShowAddFarmModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  농장 이름 *
                </label>
                <input
                  type="text"
                  value={newFarmData.name}
                  onChange={(e) => setNewFarmData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="예: 스마트팜 A, 토마토 농장"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  농장 설명
                </label>
                <textarea
                  value={newFarmData.description}
                  onChange={(e) => setNewFarmData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="농장에 대한 간단한 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  농장 위치
                </label>
                <input
                  type="text"
                  value={newFarmData.location}
                  onChange={(e) => setNewFarmData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="예: 경기도 수원시, 서울시 강남구"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowAddFarmModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAddFarm}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold"
                >
                  농장 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 새 베드 추가 모달 */}
      {showAddBedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">새 베드 추가</h3>
              <button
                onClick={() => setShowAddBedModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  베드 이름 *
                </label>
                <input
                  type="text"
                  value={newBedData.name}
                  onChange={(e) => setNewBedData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="예: 베드1, A구역"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  작물 이름 *
                </label>
                <input
                  type="text"
                  value={newBedData.cropName}
                  onChange={(e) => setNewBedData(prev => ({ ...prev, cropName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="예: 토마토, 상추, 딸기"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  재배 방식
                </label>
                <select
                  value={newBedData.growingMethod}
                  onChange={(e) => setNewBedData(prev => ({ ...prev, growingMethod: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="담액식" className="text-gray-900">담액식</option>
                  <option value="NFT식" className="text-gray-900">NFT식</option>
                  <option value="분무식" className="text-gray-900">분무식</option>
                  <option value="점적식" className="text-gray-900">점적식</option>
                  <option value="기타" className="text-gray-900">기타</option>
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowAddBedModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  취소
                </button>
                <button
                  onClick={handleAddBed}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 font-semibold"
                >
                  베드 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 액추에이터 제어 모달 */}
      {/* 수동 제어 모달 */}
      {selectedActuator && (
        <ActuatorControlModal
          isOpen={showActuatorModal}
          onClose={() => {
            setShowActuatorModal(false);
            setSelectedActuator(null);
          }}
          actuatorName={selectedActuator.name}
          deviceId={selectedActuator.deviceId}
          currentStatus={selectedActuator.status}
          onStatusChange={handleActuatorStatusChange}
        />
      )}

      {/* 스케줄링 모달 */}
      {selectedActuator && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedActuator(null);
          }}
          actuatorName={selectedActuator.name}
          deviceId={selectedActuator.deviceId}
          currentSchedule={actuatorSchedules[selectedActuator.deviceId]}
          onScheduleChange={handleScheduleChange}
        />
      )}

      {/* 듀얼타임 모달 */}
      {selectedActuator && (
        <DualTimeModal
          isOpen={showDualTimeModal}
          onClose={() => {
            setShowDualTimeModal(false);
            setSelectedActuator(null);
          }}
          actuatorName={selectedActuator.name}
          deviceId={selectedActuator.deviceId}
          currentDualTime={actuatorDualTimes[selectedActuator.deviceId]}
          onDualTimeChange={handleDualTimeChange}
        />
      )}
    </div>
  );
}

export default function BedsManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BedsManagementContent />
    </Suspense>
  );
}
