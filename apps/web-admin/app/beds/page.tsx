'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthUser, getTeams, getApprovedUsers, getCurrentUser } from '../../src/lib/auth';
import { Farm, Device, Sensor, SensorReading, getSupabaseClient, getFarms } from '../../src/lib/supabase';
import { normalizeBedName, validateBedName } from '../../src/lib/bedNaming';
import { BedTierConfig, initializeBedTiers, updateBedTierCount } from '../../src/lib/bedTierStructure';
import BedTierShelfVisualization from '../../src/components/BedTierShelfVisualization';
// Mock 시스템 제거됨 - 실제 Supabase 데이터 사용
import AppHeader from '../../src/components/AppHeader';
import ActuatorControlModal from '../../src/components/ActuatorControlModal';
import ScheduleModal from '../../src/components/ScheduleModal';
import DualTimeModal from '../../src/components/DualTimeModal';
import SensorChart from '../../src/components/SensorChart';
import SensorCard from '../../src/components/SensorCard';
import WaterLevelSensorCard from '../../src/components/WaterLevelSensorCard';
import BedNoteModal from '../../src/components/BedNoteModal';
import { getBedNoteStats, getTagColor } from '../../src/lib/bedNotes';

function BedsManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 농장별 색상 생성 함수 (대시보드와 동일)
  const getFarmColor = (farmId: string) => {
    const colors = [
      'text-blue-600', 'text-green-600', 'text-purple-600', 'text-red-600',
      'text-orange-600', 'text-indigo-600', 'text-pink-600', 'text-teal-600',
      'text-cyan-600', 'text-emerald-600', 'text-violet-600', 'text-rose-600'
    ];
    const hash = farmId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getFarmBgColor = (farmId: string) => {
    const bgColors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
      'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500'
    ];
    const hash = farmId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return bgColors[Math.abs(hash) % bgColors.length];
  };

  const getFarmHoverColor = (farmId: string) => {
    const hoverColors = [
      'hover:bg-blue-50', 'hover:bg-green-50', 'hover:bg-purple-50', 'hover:bg-red-50',
      'hover:bg-orange-50', 'hover:bg-indigo-50', 'hover:bg-pink-50', 'hover:bg-teal-50',
      'hover:bg-cyan-50', 'hover:bg-emerald-50', 'hover:bg-violet-50', 'hover:bg-rose-50'
    ];
    const hash = farmId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return hoverColors[Math.abs(hash) % hoverColors.length];
  };
  const [user, setUser] = useState<AuthUser | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmTab, setSelectedFarmTab] = useState<string>('');
  // Mock 데이터 변수들 제거됨 - 실제 Supabase 데이터 사용
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
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<{id: string, name: string} | null>(null);
  const [sensorChartData, setSensorChartData] = useState<any[]>([]);
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [showEditBedModal, setShowEditBedModal] = useState(false);
  const [showEditFarmModal, setShowEditFarmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteFarmModal, setShowDeleteFarmModal] = useState(false);
  const [targetFarm, setTargetFarm] = useState<Farm | null>(null);
  const [editingBed, setEditingBed] = useState<Device | null>(null);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deletingBed, setDeletingBed] = useState<Device | null>(null);
  const [deletingFarm, setDeletingFarm] = useState<Farm | null>(null);
  const [newFarmData, setNewFarmData] = useState({
    name: '',
    description: '',
    location: ''
  });
  const [newBedData, setNewBedData] = useState({
    name: '',
    bedSystemType: 'multi-tier', // 다단 베드 시스템
    totalTiers: 3 // 다단 베드 시스템은 기본적으로 3단
  });
  const [editBedData, setEditBedData] = useState({
    name: '',
    bedSystemType: 'multi-tier',
    totalTiers: 3
  });
  
  // 작물 입력 모달 상태
  const [showCropInputModal, setShowCropInputModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [cropInputData, setCropInputData] = useState({
    cropName: '',
    growingMethod: '담액식',
    plantType: 'seed' as 'seed' | 'seedling',
    startDate: '',
    harvestDate: '',
    stageBoundaries: {
      seed: [15, 45, 85], // 발아 끝, 생식생장 끝, 영양생장 끝 (%)
      seedling: [40, 80]  // 생식생장 끝, 영양생장 끝 (%)
    }
  });
  
  // 각 베드의 작물 정보 저장 (deviceId -> tier -> cropInfo)
  const [bedCropData, setBedCropData] = useState<Record<string, Record<number, any>>>({});
  
  // 작물 정보 로드 함수
  const loadCropData = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/bed-crop-data?deviceId=${deviceId}`);
      const result = await response.json();
      
      if (result.data) {
        const cropDataMap: Record<number, any> = {};
        result.data.forEach((item: any) => {
          cropDataMap[item.tier_number] = {
            cropName: item.crop_name,
            growingMethod: item.growing_method,
            plantType: item.plant_type,
            startDate: item.start_date,
            harvestDate: item.harvest_date,
            stageBoundaries: item.stage_boundaries || {
              seed: [15, 45, 85],
              seedling: [40, 80]
            },
            savedAt: item.created_at
          };
        });
        
        setBedCropData(prev => ({
          ...prev,
          [deviceId]: cropDataMap
        }));
      }
    } catch (error) {
      console.error('작물 정보 로드 오류:', error);
    }
  };
  const [editFarmData, setEditFarmData] = useState({
    name: '',
    location: '',
    is_hidden: false
  });

  // 데이터 로드 함수
  const loadData = useCallback(async () => {
    try {
      console.log('📊 실제 Supabase 데이터 로드 중...');

      // 먼저 현재 로그인된 사용자 확인
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.is_approved) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const [farmsResult, usersResult, devicesResult, sensorsResult, sensorReadingsResult] = await Promise.all([
        getFarms(),
        getApprovedUsers(),
        getSupabaseClient().from('devices').select('*').eq('type', 'sensor_gateway'),
        getSupabaseClient().from('sensors').select('*'),
        getSupabaseClient().from('sensor_readings').select('*').order('ts', { ascending: false }).limit(1000)
      ]);

      console.log('🔍 loadData Promise.all 결과:');
      console.log('  - farmsResult:', farmsResult);
      console.log('  - devicesResult:', devicesResult);
      console.log('  - sensorsResult:', sensorsResult);
      console.log('  - sensorReadingsResult:', sensorReadingsResult);

      setFarms(farmsResult as Farm[]);
      
      // Supabase에서 실제 베드 데이터 사용 (localStorage 제거)
      console.log('✅ Supabase 베드 데이터 사용:', devicesResult.data?.length || 0, '개');
      setDevices(Array.isArray(devicesResult.data) ? devicesResult.data as Device[] : []);
      
      setSensors(Array.isArray(sensorsResult.data) ? sensorsResult.data as Sensor[] : []);
      setSensorReadings(Array.isArray(sensorReadingsResult.data) ? sensorReadingsResult.data as SensorReading[] : []);
      
      // 각 디바이스의 작물 정보 로드
      if (Array.isArray(devicesResult.data)) {
        devicesResult.data.forEach((device: any) => {
          loadCropData(device.id);
        });
      }
      
      // 농장장과 팀원인 경우 자기 농장 탭으로 자동 설정 (URL 파라미터가 없을 때만)
      const farmId = searchParams.get('farm');
      console.log('URL 파라미터 farm:', farmId);
      if (!farmId && currentUser && (currentUser.role === 'team_leader' || currentUser.role === 'team_member') && currentUser.team_id) {
        setSelectedFarmTab(currentUser.team_id);
      } else if (farmId) {
        // URL 파라미터가 있으면 우선 적용
        console.log('URL 파라미터로 농장 탭 설정:', farmId);
        setSelectedFarmTab(farmId);
      }
      
      console.log('농장관리 페이지 - 현재 사용자:', currentUser);
      console.log('농장관리 페이지 - 농장 목록:', farmsResult);
      console.log('농장관리 페이지 - 디바이스 목록:', devicesResult.data);
      console.log('농장관리 페이지 - 디바이스 개수:', devicesResult.data?.length || 0);
      
      // 디바이스와 농장 ID 매칭 디버깅
      if (devicesResult.data && farmsResult) {
        console.log('🔍 디바이스 farm_id 분석:');
        devicesResult.data.forEach((d: any) => {
          console.log(`  - 디바이스 ${d.id}: farm_id=${d.farm_id}, type=${d.type}`);
        });
        console.log('🔍 농장 ID 분석:');
        farmsResult.forEach((farm: any) => {
          console.log(`  - 농장 ${farm.id}: name=${farm.name}`);
        });
      }

      // 24시간 차트 데이터 초기화
      const initialChartData = generateChartData();
      console.log('📊 초기 차트 데이터 생성:', initialChartData.length, '개 데이터 포인트');
      setSensorChartData(initialChartData);

      // MQTT 연동 전까지 자동 업데이트 비활성화
      console.log('⏸️ 자동 센서 데이터 업데이트 비활성화 중 (MQTT 대기 상태)');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [router, searchParams]);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData]);

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
    console.log('농장 ID 파라미터:', farmId);
    console.log('사용 가능한 농장 수:', farms.length);
    console.log('현재 선택된 농장 탭:', selectedFarmTab);
    if (farmId && farms.length > 0) {
      console.log('농장 탭 설정:', farmId);
      setSelectedFarmTab(farmId);
    } else if (!farmId && !selectedFarmTab && farms.length > 0) {
      // URL 파라미터가 없고 선택된 농장도 없으면 첫 번째 농장 선택
      setSelectedFarmTab(farms[0].id);
      console.log('기본 농장 선택:', farms[0].id);
    }
  }, [searchParams, farms, selectedFarmTab]);

  // 베드 정렬 함수
  const sortBeds = (beds: Device[]) => {
    return beds.sort((a, b) => {
      // 1. 베드 이름에서 숫자 추출하여 정렬
      const getBedNumber = (device: Device) => {
        const location = (device.meta as any)?.location || '';
        
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

  // 안전 배열 헬퍼 (TSX 친화적: 함수 선언식)
  function asArray<T>(v: T[] | null | undefined): T[] {
    return Array.isArray(v) ? v : [];
  }

  // 필터링된 디바이스 (useMemo로 안전하게)
  const filteredDevices = React.useMemo(() => {
    let list = asArray(devices).filter(d => d?.type === 'sensor_gateway');
    console.log('전체 베드 (센서게이트웨이):', list);
    console.log('현재 선택된 농장 탭:', selectedFarmTab);
    
    // 농장장과 팀원이 로그인한 경우 자기 농장의 베드만 보이도록 필터링
    if (user && (user.role === 'team_leader' || user.role === 'team_member') && user.team_id) {
      list = list.filter(d => d?.farm_id === user.team_id);
      console.log('사용자 팀 필터 적용 후 베드:', list);
    }
    
    if (selectedFarmTab === 'all') {
      console.log('전체 농장 선택 - 모든 베드 반환:', list);
      return sortBeds(list);
    }
    
    const selectedFarmDevices = list.filter(d => d?.farm_id === selectedFarmTab);
    console.log(`선택된 농장 ${selectedFarmTab}의 베드:`, selectedFarmDevices);
    return sortBeds(selectedFarmDevices);
  }, [devices, user, selectedFarmTab]);

  // 액추에이터 제어 함수
  const toggleActuator = (deviceId: string) => {
    const newState = !localActuatorStates[deviceId];
    
    setLocalActuatorStates(prev => {
      const newStates = {
        ...prev,
        [deviceId]: newState
      };
      
      // 액추에이터 상태는 로컬 상태로만 관리 (localStorage 제거)
      console.log('💾 액추에이터 상태 업데이트:', newStates);
      
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
      // 실제 MQTT 제어 명령 (향후 구현)
      console.log('🔧 액추에이터 제어:', deviceId, command);
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
      // 실제 MQTT 제어 명령 (향후 구현)
      console.log('🔧 액추에이터 제어:', deviceId, command);
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
  const handleAddFarm = async () => {
    if (!newFarmData.name.trim()) {
      alert('농장 이름을 입력해주세요.');
      return;
    }

    try {
      // Supabase에 새 농장 저장
      const supabase = getSupabaseClient();

      const { data, error } = await (supabase as any)
        .from('farms')
        .insert([
          {
      name: newFarmData.name,
      location: newFarmData.location,
            tenant_id: user?.tenant_id
          }
        ])
        .select();

      if (error) {
        console.error('농장 생성 오류:', error);
        console.error('에러 코드:', error.code);
        console.error('에러 메시지:', error.message);
        console.error('에러 세부사항:', error.details);
        console.error('에러 힌트:', error.hint);
        alert(`농장 생성에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        return;
      }

      const newFarm = data[0];
      console.log('🔄 농장 추가 완료, 데이터 다시 로드 중...');
      await loadData(); // Reload data after adding farm
      setSelectedFarmTab(newFarm.id);
      setNewFarmData({ name: '', description: '', location: '' });
      setShowAddFarmModal(false);
      alert(`새 농장 "${newFarm.name}"이 추가되었습니다!`);
    } catch (error) {
      console.error('농장 생성 오류:', error);
      alert('농장 생성에 실패했습니다.');
    }
  };

  // 새 베드 추가
  const handleAddBed = async () => {
    if (!newBedData.name.trim()) {
      alert('베드 이름을 입력해주세요.');
      return;
    }

    if (!targetFarm) {
      alert('농장을 선택해주세요.');
      return;
    }

    // 베드 이름 검증 및 정규화
    const validation = validateBedName(newBedData.name);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    const normalizedBedName = normalizeBedName(newBedData.name);
    console.log('🔄 베드 이름 정규화:', newBedData.name, '→', normalizedBedName);

    try {
      // Supabase에 새 베드 저장
      const supabase = getSupabaseClient();

      const { data, error } = await (supabase as any)
        .from('devices')
        .insert([
          {
      farm_id: targetFarm.id,
            bed_id: null, // 베드는 bed_id가 null (베드 자체가 디바이스)
      type: 'sensor_gateway',
      status: { online: true },
      meta: {
              location: normalizedBedName, // 정규화된 이름 저장
        bed_system_type: newBedData.bedSystemType,
        total_tiers: newBedData.totalTiers
            }
          }
        ])
        .select();

      if (error) {
        console.error('베드 생성 오류:', error);
        console.error('에러 코드:', error.code);
        console.error('에러 메시지:', error.message);
        alert(`베드 생성에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        return;
      }

      const newBed = data[0];
      console.log('🔄 베드 추가 완료, 데이터 다시 로드 중...');
      await loadData(); // Reload data after adding bed
      setNewBedData({ name: '', bedSystemType: 'multi-tier', totalTiers: 3 });
      setShowAddBedModal(false);
      alert(`새 베드 "${normalizedBedName}"가 ${targetFarm?.name || '농장'}에 추가되었습니다!`);
    } catch (error) {
      console.error('베드 생성 오류:', error);
      alert('베드 생성에 실패했습니다.');
    }
  };

  // 베드 편집 모달 열기
  const handleEditBed = (bed: Device) => {
    console.log('🔄 베드 편집 모달 열기:', bed);
    console.log('📝 베드 메타 정보:', bed.meta);
    
    // 기존 상태 초기화 후 새로운 데이터 설정
    const editData = {
      name: (bed.meta as any)?.location || '',
      bedSystemType: (bed.meta as any)?.bed_system_type || (bed.meta as any)?.growing_method || 'multi-tier',
      totalTiers: (bed.meta as any)?.total_tiers || 3
    };
    
    console.log('📝 편집 폼에 설정할 데이터:', editData);
    console.log('📝 기존 editBedData 상태:', editBedData);
    
    // 즉시 올바른 데이터로 설정
    setEditBedData(editData);
    console.log('📝 최종 설정된 editBedData:', editData);
    
    setEditingBed(bed);
    setShowEditBedModal(true);
  };

  // 베드 정보 업데이트
  const handleUpdateBed = async () => {
    if (!editingBed || !editBedData.name.trim()) {
      alert('베드 이름을 입력해주세요.');
      return;
    }

    // 베드 이름 검증 및 정규화
    const validation = validateBedName(editBedData.name);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    const normalizedBedName = normalizeBedName(editBedData.name);
    console.log('🔄 베드 편집 - 이름 정규화:', editBedData.name, '→', normalizedBedName);

    try {
      console.log('🔄 베드 업데이트 시작:', editingBed.id);
      console.log('📝 업데이트할 데이터:', editBedData);
      
      // Supabase에 베드 정보 업데이트
      const supabase = getSupabaseClient();

      const updateData = {
        meta: {
          location: normalizedBedName, // 정규화된 이름 저장
          bed_system_type: editBedData.bedSystemType,
          total_tiers: editBedData.totalTiers
        }
      };

      console.log('🗄️ Supabase UPDATE 요청:', {
        table: 'devices',
        id: editingBed.id,
        data: updateData
      });

      const { data, error } = await (supabase as any)
        .from('devices')
        .update(updateData)
        .eq('id', editingBed.id)
        .select();

      console.log('🗄️ Supabase UPDATE 응답:', { data, error });

      if (error) {
        console.error('베드 업데이트 오류:', error);
        console.error('에러 코드:', error.code);
        console.error('에러 메시지:', error.message);
        alert(`베드 업데이트에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        return;
      }

      if (data && data.length === 0) {
        console.warn('⚠️ 업데이트된 데이터가 없습니다.');
        alert('베드를 찾을 수 없거나 권한이 없습니다.');
        setShowEditBedModal(false);
        setEditingBed(null);
        return;
      }

      console.log('✅ 베드 업데이트 성공:', data[0]);
      console.log('🔄 베드 업데이트 완료, 데이터 다시 로드 중...');
      await loadData(); // Reload data after updating bed
      setShowEditBedModal(false);
      setEditingBed(null);
      alert('베드 정보가 성공적으로 업데이트되었습니다!');
    } catch (error) {
      console.error('베드 업데이트 오류:', error);
      alert('베드 업데이트에 실패했습니다.');
    }
  };

  // 베드 삭제 확인 모달 열기
  const handleDeleteBed = (bed: Device) => {
    setDeletingBed(bed);
    setShowDeleteConfirmModal(true);
  };

  // 베드 실제 삭제
  const confirmDeleteBed = async () => {
    if (!deletingBed) return;

    try {
      console.log('🗑️ 베드 삭제 시작:', deletingBed.id);
      
      // Supabase에서 베드 삭제
      const supabase = getSupabaseClient();

      console.log('🗑️ Supabase DELETE 요청:', {
        table: 'devices',
        id: deletingBed.id,
        deviceInfo: {
          name: deletingBed.meta?.location,
          type: deletingBed.type,
          farm_id: deletingBed.farm_id
        }
      });

      const { data, error } = await (supabase as any)
        .from('devices')
        .delete()
        .eq('id', deletingBed.id)
        .select(); // 삭제된 데이터 반환

      console.log('🗑️ Supabase DELETE 응답:', { data, error });

      if (error) {
        console.error('베드 삭제 오류:', error);
        console.error('에러 코드:', error.code);
        console.error('에러 메시지:', error.message);
        console.error('에러 세부사항:', error.details);
        console.error('에러 힌트:', error.hint);
        alert(`베드 삭제에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        return;
      }

      if (data && data.length === 0) {
        console.warn('⚠️ 삭제된 데이터가 없습니다. 베드가 이미 삭제되었거나 권한이 없을 수 있습니다.');
        alert('베드를 찾을 수 없거나 이미 삭제되었습니다.');
        setShowDeleteConfirmModal(false);
        setDeletingBed(null);
        return;
      }

      console.log('✅ 베드 삭제 성공:', data);
      console.log('🔄 베드 삭제 완료, 데이터 다시 로드 중...');
      await loadData(); // Reload data after deleting bed
      setShowDeleteConfirmModal(false);
      setDeletingBed(null);
      alert('베드가 성공적으로 삭제되었습니다!');
    } catch (error) {
      console.error('베드 삭제 오류:', error);
      alert('베드 삭제에 실패했습니다.');
    }
  };

  // 농장 편집 모달 열기
  const handleEditFarm = (farm: Farm) => {
    setEditingFarm(farm);
    setEditFarmData({
      name: farm.name || '',
      location: farm.location || '',
      is_hidden: farm.is_hidden || false
    });
    setShowEditFarmModal(true);
  };

  // 농장 정보 업데이트
  const handleUpdateFarm = async () => {
    if (!editingFarm || !editFarmData.name.trim()) {
      alert('농장 이름을 입력해주세요.');
      return;
    }

    try {
      // Supabase에 농장 정보 업데이트
      const supabase = getSupabaseClient();

      const { error } = await (supabase as any)
        .from('farms')
        .update({
          name: editFarmData.name,
          location: editFarmData.location,
          is_hidden: editFarmData.is_hidden
        })
        .eq('id', editingFarm.id);

      if (error) {
        console.error('농장 업데이트 오류:', error);
        alert(`농장 업데이트에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        return;
      }

      // 로컬 상태 업데이트
      console.log('🔄 농장 업데이트 완료, 데이터 다시 로드 중...');
      await loadData(); // Reload data after updating farm
      setShowEditFarmModal(false);
      setEditingFarm(null);
      alert('농장 정보가 성공적으로 업데이트되었습니다!');
    } catch (error) {
      console.error('농장 업데이트 오류:', error);
      alert('농장 업데이트에 실패했습니다.');
    }
  };

  // 농장 삭제 함수
  const handleDeleteFarm = async (farm: Farm) => {
    if (!farm) return;

    try {
      const supabase = getSupabaseClient();
      
      // 1. 해당 농장에 배정된 사용자들의 farm_memberships 삭제
      const { error: fmError } = await supabase
        .from('farm_memberships')
        .delete()
        .eq('farm_id', farm.id);

      if (fmError) {
        console.error('사용자 배정 해제(삭제) 오류:', fmError);
        alert('사용자 배정 해제에 실패했습니다.');
        return;
      }

      // 2. 해당 농장의 모든 디바이스 삭제
      const { error: devicesError } = await supabase
        .from('devices')
        .delete()
        .eq('farm_id', farm.id);

      if (devicesError) {
        console.error('농장 디바이스 삭제 오류:', devicesError);
        alert('농장 디바이스 삭제에 실패했습니다.');
        return;
      }

      // 3. 농장 삭제
      const { error: farmError } = await supabase
        .from('farms')
        .delete()
        .eq('id', farm.id);

      if (farmError) {
        console.error('농장 삭제 오류:', farmError);
        alert('농장 삭제에 실패했습니다.');
        return;
      }

      // 4. 데이터 새로고침
      console.log('🔄 농장 삭제 완료, 데이터 다시 로드 중...');
      await loadData(); // Reload data after deleting farm
      
      // 모달 닫기
      setShowDeleteFarmModal(false);
      setDeletingFarm(null);
      alert('농장이 성공적으로 삭제되었습니다!');
    } catch (error) {
      console.error('농장 삭제 오류:', error);
      alert('농장 삭제에 실패했습니다.');
    }
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
          <h1 className="text-2xl font-bold text-gray-600 mb-4">로그인이 필요합니다</h1>
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
      
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 lg:py-8">
        <div className="max-w-7xl mx-auto">
        {/* Main Card Container */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-2 sm:mb-4 lg:mb-8">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 px-2 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">농장 관리</h1>
                <p className="text-white/90 text-sm sm:text-base lg:text-lg">농장과 베드를 관리하고 모니터링하세요</p>
              </div>
            </div>
          </div>
          <div className="px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8">
            {/* 농장별 탭 */}
            <div className="mb-2 sm:mb-3 lg:mb-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
              <h4 className="text-lg font-semibold text-gray-600">농장별 보기</h4>
              <div className="flex items-center space-x-3">
                {/* MQTT 설정 - 관리자와 농장장 모두 접근 가능 */}
                {user && (user.role === 'system_admin' || user.role === 'team_leader' || user.email === 'sky3rain7@gmail.com') && selectedFarmTab && selectedFarmTab !== 'all' && (
                  <button
                    onClick={() => router.push(`/farms/${selectedFarmTab}/settings/mqtt`)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-1 sm:space-x-2"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>MQTT 설정</span>
                  </button>
                )}
                
                {/* 농장 추가 - 관리자만 가능 */}
                {user && (user.role === 'system_admin' || user.email === 'sky3rain7@gmail.com') && (
                  <button
                    onClick={() => setShowAddFarmModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-1 sm:space-x-2"
                  >
                    <span>+</span>
                    <span>새 농장 추가</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* 시스템 관리자인 경우에만 전체 농장 탭 표시 */}
              {user && user.role === 'system_admin' && (
                <button
                  onClick={() => setSelectedFarmTab('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    selectedFarmTab === 'all'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white/80 text-gray-600 hover:bg-blue-50'
                  }`}
                >
                  전체 농장 ({farms.length}개)
                </button>
              )}
              {/* 농장장과 팀원인 경우 자기 농장만, 관리자인 경우 모든 농장 표시 */}
              {(() => {
                const farmId = searchParams.get('farm');
                let farmsToShow = farms;
                
                // URL 파라미터가 있으면 해당 농장만 표시 (대시보드에서 농장 클릭시)
                if (farmId) {
                  farmsToShow = farms.filter(farm => farm.id === farmId);
                  console.log('URL 파라미터로 탭 표시 필터링:', farmId, farmsToShow);
                } else if (user && (user.role === 'team_leader' || user.role === 'team_member') && user.team_id) {
                  farmsToShow = farms.filter(farm => farm.id === user.team_id);
                } else {
                  farmsToShow = farms;
                }
                
                return farmsToShow.map(farm => (
                  <button
                    key={farm.id}
                    onClick={() => setSelectedFarmTab(farm.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      selectedFarmTab === farm.id
                        ? `${getFarmBgColor(farm.id)} text-white shadow-lg`
                        : `bg-white/80 text-gray-600 ${getFarmHoverColor(farm.id)}`
                    }`}
                  >
                    {farm.name} ({asArray(devices).filter(d => d.farm_id === farm.id && d.type === 'sensor_gateway').length}개 베드)
                  </button>
                ));
              })()}
            </div>
          </div>

          {/* 농장별 베드 목록 */}
          <div className="space-y-2 sm:space-y-3 lg:space-y-6">
            {(() => {
              // 선택된 탭에 따라 농장 필터링 - 대시보드에서 농장 클릭시 해당 농장만 표시
              let farmsToShow = farms;
              
              // URL 파라미터가 있을 경우 우선 처리 (대시보드에서 농장 관리 클릭시)
              const farmId = searchParams.get('farm');
              console.log('현재 URL 파라미터 farmId:', farmId);
              console.log('사용 가능한 farms ID들:', asArray(farms).map(f => f.id));
              console.log('현재 selectedFarmTab:', selectedFarmTab);
              
              if (farmId) {
                console.log('URL 파라미터로 특정 농장 필터링:', farmId);
                farmsToShow = asArray(farms).filter(farm => farm.id === farmId);
                console.log('필터링된 농장들:', farmsToShow);
              } else if (selectedFarmTab === 'all') {
                // 전체 농장 표시
                farmsToShow = asArray(farms);
              } else if (selectedFarmTab) {
                // 특정 농장만 표시
                farmsToShow = asArray(farms).filter(farm => farm.id === selectedFarmTab);
              } else {
                // 기본값: 농장장과 팀원인 경우 자기 농장만, 관리자인 경우 모든 농장 표시
                console.log('🔍 농장 관리 페이지 필터링 디버그:', {
                  userRole: user?.role,
                  userTeamId: user?.team_id,
                  totalFarms: farms.length,
                  farms: farms.map(f => ({ id: f.id, name: f.name }))
                });
                
                if (user && (user.role === 'team_leader' || user.role === 'team_member') && user.team_id) {
                  farmsToShow = farms.filter(farm => {
                    const isMyFarm = farm.id === user.team_id;
                    console.log(`농장 ${farm.name} (${farm.id}) vs 사용자 팀 ID (${user.team_id}): ${isMyFarm ? '포함' : '제외'}`);
                    return isMyFarm;
                  });
                  console.log('농장장/팀원 필터링 결과:', farmsToShow);
                } else {
                  farmsToShow = farms;
                  console.log('관리자 - 모든 농장 표시:', farmsToShow);
                }
              }
              
              const farmGroups = farmsToShow.map(farm => {
                console.log(`처리 중인 농장: ${farm.id} (${farm.name})`);
                console.log(`filteredDevices 전체:`, filteredDevices);
                console.log(`filteredDevices에서 ${farm.id}와 매칭될 베드들:`, 
                  filteredDevices.filter(d => {
                    console.log(`${d.id}: farm_id=${d.farm_id} === target=${farm.id}? ${d.farm_id === farm.id}`);
                    return d.farm_id === farm.id;
                  })
                );
                const farmDevices = filteredDevices.filter(device => device.farm_id === farm.id);
                console.log(`최종 농장 ${farm.id} (${farm.name})의 베드들:`, farmDevices);
                return { farm, devices: sortBeds(farmDevices) };
              });

              if (farmGroups.length === 0) {
                return (
                  <div className="text-center py-16">
                    <h3 className="text-xl font-bold text-gray-600 mb-2">
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

              console.log('렌더링할 농장 그룹들:', farmGroups);
              console.log('각 농장별 베드들:', farmGroups.map(g => ({ farmId: g.farm.id, farmName: g.farm.name, deviceCount: g.devices.length })));

              return farmGroups.map(({ farm, devices }) => (
                <div key={farm.id} className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-2 sm:p-3 lg:p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                  {/* 농장 헤더 */}
                  <div className={`bg-gradient-to-r ${getFarmBgColor(farm.id).replace('bg-', 'from-')} ${getFarmBgColor(farm.id).replace('bg-', 'to-').replace('-500', '-600')} rounded-xl p-4 mb-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-6">
                          <h4 className="text-2xl font-bold text-white">{farm.name}</h4>
                          <div className="flex items-center space-x-4">
                            <p className="text-white/90 font-medium text-sm">📍 {farm.location || '위치 정보 없음'}</p>
                            <span className="text-sm text-white/90 font-semibold">
                              📊 총 {devices.length}개 베드
                            </span>
                            <div className="flex items-center space-x-1">
                              {(() => {
                                // 해당 농장의 디바이스들 중 센서가 연결된 것이 있는지 확인
                                const hasActiveSensors = devices.some(device => {
                                  const deviceSensors = sensors.filter(s => s.device_id === device.id);
                                  return deviceSensors.some(sensor => {
                                    const reading = sensorReadings.find(r => r.sensor_id === sensor.id);
                                    return !!reading;
                                  });
                                });
                                
                                return (
                                  <>
                                    <div 
                                      className={`w-2 h-2 rounded-full ${hasActiveSensors ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}
                                    ></div>
                                    <span className="text-xs text-white/80">
                                      {hasActiveSensors ? '활성' : '비활성'}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        </div>
                        {/* 농장 편집 버튼 */}
                        {user && user.role !== 'team_member' && (
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleEditFarm(farm)}
                              className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg hover:bg-white/30 transition-all duration-200 flex items-center justify-center space-x-2 border border-white/30 whitespace-nowrap"
                            >
                              <span>✏️</span>
                              <span>농장 편집</span>
                            </button>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* 농장에 속한 베드들 */}
                  <div className="space-y-2 sm:space-y-3">
                    <h5 className="text-lg font-semibold text-gray-600 mb-2 sm:mb-3 flex items-center">
                      {farm.name}의 베드 목록
                    </h5>

                    <div className="space-y-2 sm:space-y-3">
                      {devices.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <p className="text-gray-500 font-medium">이 농장에 등록된 베드가 없습니다</p>
                          <p className="text-sm text-gray-400 mt-1">새 베드를 추가해보세요</p>
                        </div>
                      ) : (
                        asArray(devices).map((device) => {
                        const deviceSensors = asArray(sensors).filter(s => s.device_id === device.id);
          
                        return (
                          <div key={device.id} className="bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-2 sm:p-3 lg:p-6 hover:shadow-lg transition-all duration-200">
                            {/* 베드 헤더 */}
                            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <span className="font-bold text-gray-600 text-lg">
                                    {(() => {
                                      const location = String(device.meta?.location || '센서 게이트웨이');
                                      
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
                                </div>
                              </div>
                            </div>

                            {/* 베드 시각화와 센서/제어 데이터를 반응형으로 배치 */}
                            <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 lg:gap-6">
                              {/* 베드 시각화 */}
                              <div className="flex-shrink-0">
                                <BedTierShelfVisualization
                                  activeTiers={(device.meta as any)?.total_tiers || 1}
                                  tierStatuses={[1, 2, 3].map(tierNumber => {
                                    const cropInfo = bedCropData[device.id]?.[tierNumber];
                                    return {
                                      tierNumber,
                                      hasPlants: !!cropInfo?.cropName,
                                      cropName: cropInfo?.cropName,
                                      growingMethod: cropInfo?.growingMethod,
                                      plantType: cropInfo?.plantType,
                                      startDate: cropInfo?.startDate,
                                      harvestDate: cropInfo?.harvestDate,
                                      stageBoundaries: cropInfo?.stageBoundaries
                                    };
                                  })}
                                  waterLevelStatus={(() => {
                                    const waterSensor = deviceSensors.find(s => s.type === 'water_level');
                                    const reading = waterSensor && sensorReadings.find(r => r.sensor_id === waterSensor.id);
                                    if (!waterSensor) return 'disconnected';
                                    if (!reading) return 'disconnected';
                                    const value = reading.value;
                                    if (value < 20) return 'low';
                                    if (value > 80) return 'high';
                                    return 'normal';
                                  })()}
                                  onTierClick={(tierNumber) => {
                                    console.log(`${tierNumber}단 클릭됨`);
                                    setSelectedTier(tierNumber);
                                    setSelectedDevice(device);
                                    
                                    // 기존 작물 정보가 있으면 불러오기
                                    const existingCrop = bedCropData[device.id]?.[tierNumber];
                                    setCropInputData({
                                      cropName: existingCrop?.cropName || '',
                                      growingMethod: existingCrop?.growingMethod || '담액식',
                                      plantType: existingCrop?.plantType || 'seed',
                                      startDate: existingCrop?.startDate || '',
                                      harvestDate: existingCrop?.harvestDate || '',
                                      stageBoundaries: existingCrop?.stageBoundaries || {
                                        seed: [15, 45, 85],
                                        seedling: [40, 80]
                                      }
                                    });
                                    setShowCropInputModal(true);
                                  }}
                                  compact={true}
                                />
                                
                                {/* 수위 상태 표시 - 시각화 아래 */}
                                <div className="flex justify-center mt-4">
                                  <div className="flex space-x-3 items-center">
                                    {/* 고수위 (빨간색) */}
                                    <div className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 text-white">
                                      고수위
                                    </div>
                                    
                                    {/* 정상수위 (파란색) */}
                                    <div className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-500 text-white">
                                      정상
                                    </div>
                                    
                                    {/* 저수위 (노란색) */}
                                    <div className="px-4 py-2 rounded-lg text-sm font-bold bg-yellow-500 text-white">
                                      저수위
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 센서 데이터와 원격 스위치 제어 */}
                              <div className="flex-1 space-y-2 sm:space-y-3 lg:space-y-4">

                                {/* 센서 데이터 */}
                                <div>
                                  <h6 className="text-base font-bold text-gray-600 mb-2 sm:mb-3 flex items-center">
                                    <span className="text-lg mr-2">📊</span>
                                    센서 데이터
                                  </h6>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                <SensorCard
                                  type="temperature"
                                  value={(() => {
                                    const tempSensor = deviceSensors.find(s => s.type === 'temperature');
                                    const reading = tempSensor && sensorReadings.find(r => r.sensor_id === tempSensor.id);
                                    return reading ? reading.value : 0;
                                  })()}
                                  unit="°C"
                                  icon="🌡️"
                                  color="#ef4444"
                                  chartData={sensorChartData}
                                  title="온도"
                                  isConnected={(() => {
                                    const tempSensor = deviceSensors.find(s => s.type === 'temperature');
                                    const reading = tempSensor && sensorReadings.find(r => r.sensor_id === tempSensor.id);
                                    return !!tempSensor && !!reading;
                                  })()}
                                />
                                
                                <SensorCard
                                  type="humidity"
                                  value={(() => {
                                    const humiditySensor = deviceSensors.find(s => s.type === 'humidity');
                                    const reading = humiditySensor && sensorReadings.find(r => r.sensor_id === humiditySensor.id);
                                    return reading ? reading.value : 0;
                                  })()}
                                  unit="%"
                                  icon="💧"
                                  color="#3b82f6"
                                  chartData={sensorChartData}
                                  title="습도"
                                  isConnected={(() => {
                                    const humiditySensor = deviceSensors.find(s => s.type === 'humidity');
                                    const reading = humiditySensor && sensorReadings.find(r => r.sensor_id === humiditySensor.id);
                                    return !!humiditySensor && !!reading;
                                  })()}
                                />
                                
                                <SensorCard
                                  type="ec"
                                  value={(() => {
                                    const ecSensor = deviceSensors.find(s => s.type === 'ec');
                                    const reading = ecSensor && sensorReadings.find(r => r.sensor_id === ecSensor.id);
                                    return reading ? reading.value : 0;
                                  })()}
                                  unit="mS/cm"
                                  icon="⚡"
                                  color="#10b981"
                                  chartData={sensorChartData}
                                  title="EC"
                                  isConnected={(() => {
                                    const ecSensor = deviceSensors.find(s => s.type === 'ec');
                                    const reading = ecSensor && sensorReadings.find(r => r.sensor_id === ecSensor.id);
                                    return !!ecSensor && !!reading;
                                  })()}
                                />
                                
                                <WaterLevelSensorCard
                                  level={(() => {
                                    const waterSensor = deviceSensors.find(s => s.type === 'water_level');
                                    const reading = waterSensor && sensorReadings.find(r => r.sensor_id === waterSensor.id);
                                    if (!waterSensor) return 'disconnected';
                                    if (!reading) return 'disconnected';
                                    const value = reading.value;
                                    if (value < 20) return 'low';
                                    if (value > 80) return 'high';
                                    return 'normal';
                                  })()}
                                  percentage={(() => {
                                    const waterSensor = deviceSensors.find(s => s.type === 'water_level');
                                    const reading = waterSensor && sensorReadings.find(r => r.sensor_id === waterSensor.id);
                                    return reading ? reading.value : 0;
                                  })()}
                                  chartData={sensorChartData}
                                  title="수위센서"
                                />
                                
                                <SensorCard
                                  type="light"
                                  value={(() => {
                                    const lightSensor = deviceSensors.find(s => s.type === 'light');
                                    const reading = lightSensor && sensorReadings.find(r => r.sensor_id === lightSensor.id);
                                    return reading ? reading.value : 0;
                                  })()}
                                  unit="lux"
                                  icon="☀️"
                                  color="#f59e0b"
                                  chartData={sensorChartData}
                                  title="조도"
                                  isConnected={(() => {
                                    const lightSensor = deviceSensors.find(s => s.type === 'light');
                                    const reading = lightSensor && sensorReadings.find(r => r.sensor_id === lightSensor.id);
                                    return !!lightSensor && !!reading;
                                  })()}
                                />
                                
                                <SensorCard
                                  type="ph"
                                  value={(() => {
                                    const phSensor = deviceSensors.find(s => s.type === 'ph');
                                    const reading = phSensor && sensorReadings.find(r => r.sensor_id === phSensor.id);
                                    return reading ? reading.value : 0;
                                  })()}
                                  unit="pH"
                                  icon="🧪"
                                  color="#8b5cf6"
                                  chartData={sensorChartData}
                                  title="pH"
                                  isConnected={(() => {
                                    const phSensor = deviceSensors.find(s => s.type === 'ph');
                                    const reading = phSensor && sensorReadings.find(r => r.sensor_id === phSensor.id);
                                    return !!phSensor && !!reading;
                                  })()}
                                />
                                  </div>
                                </div>

                                {/* 제어 상태 - 원격 스위치 제어 */}
                                <div>
                                  <h6 className="text-base font-bold text-gray-600 mb-3 flex items-center">
                                    <span className="text-lg mr-2">🔌</span>
                                    원격 스위치 제어
                                  </h6>
                                  <div className="grid grid-cols-2 gap-3">
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">💡</span>
                                      <span className="text-sm font-medium text-gray-600">램프1</span>
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
                                      <span className="text-sm font-medium text-gray-600">램프2</span>
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
                                      <span className="text-sm font-medium text-gray-600">펌프</span>
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
                                      <span className="text-sm font-medium text-gray-600">팬</span>
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
                              </div>
                            </div>

                            {/* 생육 노트 섹션 */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between mb-4">
                                <h6 className="text-sm font-medium text-gray-600 flex items-center">
                                  <span className="mr-1">📝</span>
                                  생육 노트
                                </h6>
                                <button
                                  onClick={() => {
                                    setSelectedBed({
                                      id: device.id,
                                      name: (() => {
                                        const location = String(device.meta?.location || '센서 게이트웨이');
                                        
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
                                      })()
                                    });
                                    setNoteModalOpen(true);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  보기 →
                                </button>
                              </div>
                              
                              {(() => {
                                const noteStats = getBedNoteStats(device.id);
                                if (noteStats.totalNotes === 0) {
                                  return (
                                    <div className="text-xs text-gray-500 italic">
                                      아직 노트가 없습니다
                                    </div>
                                  );
                                }
                                
                                // 미리보기 표시 논리 개선
                                const allNotes = noteStats.recentNotes;
                                const announcements = allNotes.filter(note => note.isAnnouncement);
                                const regularNotes = allNotes.filter(note => !note.isAnnouncement);
                                
                                let notesToShow = [];
                                if (announcements.length > 0) {
                                  // 공지사항이 있으면 공지사항 1개 + 일반 노트 2개까지 표시
                                  notesToShow = [...announcements.slice(0, 1), ...regularNotes.slice(0, 2)];
                                } else {
                                  // 공지사항이 없으면 일반 노트 2개만 표시
                                  notesToShow = regularNotes.slice(0, 2);
                                }
                                
                                return (
                                  <div className="space-y-2">
                                    <div className="text-xs text-gray-600">
                                      총 {noteStats.totalNotes}개 노트
                                    </div>
                                    {notesToShow.map((note, index) => (
                                      <div 
                                        key={note.id} 
                                        className={`rounded p-2 border ${
                                          note.isAnnouncement 
                                            ? 'bg-yellow-50 border-yellow-200 border-2' 
                                            : 'bg-white border-gray-100'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div className="text-xs font-medium text-gray-600 truncate">
                                            {note.title}
                                          </div>
                                          {note.isAnnouncement && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                              📢
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                          {note.content}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                          <div className="text-xs text-gray-500">
                                            {note.createdAt.toLocaleDateString('ko-KR')}
                                          </div>
                                          {note.tags && note.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {note.tags.slice(0, 2).map((tag, tagIndex) => (
                                                <span
                                                  key={tagIndex}
                                                  className={`px-1 py-0.5 rounded-full text-xs ${getTagColor(tag)}`}
                                                  style={{ fontSize: '10px' }}
                                                >
                                                  {tag}
                                                </span>
                                              ))}
                                              {note.tags.length > 2 && (
                                                <span className="px-1 text-gray-600">{note.tags.length - 2}+</span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* 액션 버튼들 */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                              <div className="text-xs text-gray-500">
                                마지막 업데이트: {new Date().toLocaleTimeString()}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => {
                                    setSelectedBed({
                                      id: device.id,
                                      name: String((device.meta?.location ?? '센서 게이트웨이')).replace(/^농장\d+-/, '')
                                    });
                                    setNoteModalOpen(true);
                                  }}
                                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                  📝 생육 노트
                                </button>
                                {/* 베드 편집 버튼 */}
                                {user && user.role !== 'team_member' && (
                                  <button 
                                    onClick={() => {
                                      console.log('🖱️ 베드 편집 버튼 클릭됨:', device);
                                      handleEditBed(device);
                                    }}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                  >
                                    ✏️ 편집
                                  </button>
                                )}
                                {/* 베드 삭제 버튼 */}
                                {user && user.role !== 'team_member' && (
                                  <button
                                    onClick={() => handleDeleteBed(device)}
                                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                  >
                                    🗑️ 삭제
                                  </button>
                                )}
                              </div>
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
          </div>
        </div>
      </main>

      {/* 새 농장 추가 모달 */}
      {showAddFarmModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          {/* 모달창 */}
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-600">새 농장 추가</h3>
              <button
                onClick={() => setShowAddFarmModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  농장 이름 *
                </label>
                <input
                  type="text"
                  value={newFarmData.name}
                  onChange={(e) => setNewFarmData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                  placeholder="예: 스마트팜 A, 토마토 농장"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  농장 설명
                </label>
                <textarea
                  value={newFarmData.description}
                  onChange={(e) => setNewFarmData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                  rows={3}
                  placeholder="농장에 대한 간단한 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  농장 위치
                </label>
                <input
                  type="text"
                  value={newFarmData.location}
                  onChange={(e) => setNewFarmData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                  placeholder="예: 경기도 수원시, 서울시 강남구"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowAddFarmModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
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
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          {/* 모달창 */}
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-600">새 베드 추가</h3>
              <button
                onClick={() => setShowAddBedModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  베드 이름 *
                </label>
                <input
                  type="text"
                  value={newBedData.name}
                  onChange={(e) => setNewBedData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-500"
                  placeholder="예: 베드2, 3, A구역"
                />
                {/* 베드 이름 규칙 안내 */}
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 text-sm">💡</span>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-2">베드 이름은 어떻게 정해지나요?</p>
                      <div className="text-xs space-y-2">
                        <div className="bg-white p-2 rounded border-l-4 border-blue-400">
                          <span className="font-medium text-blue-800">입력하시면 자동으로 정리됩니다:</span>
                          <div className="mt-1 text-gray-600 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">베드2</span>
                              <span className="text-gray-400">→</span>
                              <span className="font-medium text-blue-600">베드-2</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">3</span>
                              <span className="text-gray-400">→</span>
                              <span className="font-medium text-blue-600">베드-3</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">A구역</span>
                              <span className="text-gray-400">→</span>
                              <span className="font-medium text-blue-600">베드-A구역</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-blue-600 font-medium text-center">
                          ✨ 어떤 형태로 입력하셔도 깔끔하게 정리됩니다!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  베드 시스템 유형
                </label>
                <select
                  value={newBedData.bedSystemType}
                  onChange={(e) => setNewBedData(prev => ({ ...prev, bedSystemType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 bg-white"
                >
                  <option value="multi-tier" className="text-gray-600">🌱 다단 베드 시스템</option>
                  <option value="vertical" className="text-gray-600" disabled>🏗️ 수직형 베드 시스템 (준비 중)</option>
                </select>
                
                {/* 베드 시스템 유형 안내 */}
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 text-sm">🌱</span>
                    <div className="text-sm text-green-700">
                      <p className="font-medium mb-1">다단 베드 시스템</p>
                      <div className="text-xs text-green-600">
                        <p>• 최대 3단으로 구성된 계단식 베드</p>
                        <p>• 각 단별로 독립적인 작물 재배 가능</p>
                        <p>• 공간 효율적인 수직 농업 시스템</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 향후 확장 안내 */}
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-amber-500 text-sm">🚀</span>
                    <div className="text-sm text-amber-700">
                      <p className="font-medium mb-1">다양한 베드 시스템 추가 예정</p>
                      <div className="text-xs text-amber-600">
                        <p>• 수직형 베드 시스템 (탑워터)</p>
                        <p>• 원형 베드 시스템 (회전형)</p>
                        <p>• 자동화 베드 시스템 (AI 제어)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowAddBedModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
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

      {/* 생육 노트 모달 */}
      {selectedBed && (
        <BedNoteModal
          isOpen={noteModalOpen}
          onClose={() => {
            setNoteModalOpen(false);
            setSelectedBed(null);
          }}
          bedId={selectedBed.id}
          bedName={selectedBed.name}
          authorId={user?.id || 'unknown'}
          authorName={user?.name || 'Unknown User'}
        />
      )}

      {/* 베드 편집 모달 */}
      {showEditBedModal && editingBed && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          {/* 모달창 */}
          <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl max-h-[90vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-600">베드 정보 편집</h3>
              <button
                onClick={() => setShowEditBedModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* 스크롤 가능한 내용 */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    베드 이름 *
                  </label>
                  <input
                    type="text"
                    value={editBedData.name}
                    onChange={(e) => setEditBedData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                    placeholder="예: 베드2, 3, A구역"
                  />
                  {/* 베드 이름 규칙 안내 */}
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-500 text-sm">💡</span>
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-2">베드 이름은 어떻게 정해지나요?</p>
                        <div className="text-xs space-y-2">
                          <div className="bg-white p-2 rounded border-l-4 border-blue-400">
                            <span className="font-medium text-blue-800">입력하시면 자동으로 정리됩니다:</span>
                            <div className="mt-1 text-gray-600 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">베드2</span>
                                <span className="text-gray-400">→</span>
                                <span className="font-medium text-blue-600">베드-2</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">3</span>
                                <span className="text-gray-400">→</span>
                                <span className="font-medium text-blue-600">베드-3</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">A구역</span>
                                <span className="text-gray-400">→</span>
                                <span className="font-medium text-blue-600">베드-A구역</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-blue-600 font-medium text-center">
                            ✨ 어떤 형태로 입력하셔도 깔끔하게 정리됩니다!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  베드 시스템 유형
                </label>
                <select
                  value={editBedData.bedSystemType}
                  onChange={(e) => setEditBedData(prev => ({ ...prev, bedSystemType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                >
                  <option value="multi-tier">🌱 다단 베드 시스템</option>
                  <option value="vertical" disabled>🏗️ 수직형 베드 시스템 (준비 중)</option>
                </select>
                
                {/* 베드 시스템 유형 안내 */}
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 text-sm">🌱</span>
                    <div className="text-sm text-green-700">
                      <p className="font-medium mb-1">다단 베드 시스템</p>
                      <div className="text-xs text-green-600">
                        <p>• 최대 3단으로 구성된 계단식 베드</p>
                        <p>• 각 단별로 독립적인 작물 재배 가능</p>
                        <p>• 공간 효율적인 수직 농업 시스템</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  활성 단 수
                </label>
                <select
                  value={editBedData.totalTiers}
                  onChange={(e) => setEditBedData(prev => ({ ...prev, totalTiers: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                >
                  <option value={1}>1단 (단층)</option>
                  <option value={2}>2단 (이층)</option>
                  <option value={3}>3단 (삼층)</option>
                </select>
                <div className="mt-1 text-xs text-gray-600">
                  활성 단 수에 따라 시각화에서 표시되는 단의 개수가 결정됩니다.
                </div>
              </div>

            </div>

            {/* 모달 푸터 */}
            <div className="p-6 pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEditBedModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateBed}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 베드 삭제 확인 모달 */}
      {showDeleteConfirmModal && deletingBed && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          {/* 모달창 */}
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-red-600">베드 삭제 확인</h3>
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                  <div>
                    <p className="text-red-800 font-semibold">정말로 이 베드를 삭제하시겠습니까?</p>
                    <p className="text-red-600 text-sm mt-1">
                      베드: <span className="font-medium">{(deletingBed.meta as any)?.location || '알 수 없음'}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>주의:</strong> 이 작업은 되돌릴 수 없습니다. 베드와 관련된 모든 데이터가 삭제됩니다.
                </p>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmDeleteBed}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 농장 편집 모달 */}
      {showEditFarmModal && editingFarm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          {/* 모달창 */}
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-600">농장 정보 편집</h3>
              <button
                onClick={() => setShowEditFarmModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  농장 이름 *
                </label>
                <input
                  type="text"
                  value={editFarmData.name}
                  onChange={(e) => setEditFarmData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                  placeholder="예: 메인 팜, 토마토 농장"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  농장 위치
                </label>
                <input
                  type="text"
                  value={editFarmData.location}
                  onChange={(e) => setEditFarmData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                  placeholder="예: 서울시 강남구, 경기도 수원시"
                />
              </div>

              {/* 농장 숨김 토글 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    대시보드에서 숨기기
                  </label>
                  <p className="text-xs text-gray-600">
                    이 농장을 대시보드에서 숨깁니다. 시스템 관리자는 여전히 볼 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditFarmData(prev => ({ ...prev, is_hidden: !prev.is_hidden }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    editFarmData.is_hidden ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editFarmData.is_hidden ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={() => setShowEditFarmModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateFarm}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  저장
                </button>
              </div>

              {/* 농장 삭제 섹션 */}
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-red-500 text-xl">⚠️</div>
                    <div>
                      <h4 className="font-semibold text-red-800">위험 구역</h4>
                      <p className="text-sm text-red-600">이 작업은 되돌릴 수 없습니다</p>
                    </div>
                  </div>
                  <p className="text-sm text-red-700 mb-4">
                    농장을 삭제하면 해당 농장의 모든 베드와 사용자 배정이 함께 삭제됩니다.
                  </p>
                  <div className="space-y-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="text-yellow-600 text-lg">⚠️</div>
                        <span className="font-semibold text-yellow-800">주의사항</span>
                      </div>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• 이 작업은 되돌릴 수 없습니다</li>
                        <li>• 해당 농장의 모든 베드가 삭제됩니다</li>
                        <li>• 사용자 배정이 모두 해제됩니다</li>
                        <li>• 센서 데이터도 함께 삭제됩니다</li>
                      </ul>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowEditFarmModal(false)}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => {
                          setShowEditFarmModal(false);
                          handleDeleteFarm(editingFarm);
                        }}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        🗑️ 삭제 확인
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 작물 입력 모달 */}
      {showCropInputModal && selectedTier && selectedDevice && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCropInputModal(false)} />
          {/* 모달창 */}
          <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 모달 헤더 (고정) */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-600">
                {selectedTier}단 작물 정보 입력
              </h3>
              <button
                onClick={() => setShowCropInputModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* 모달 컨텐츠 (스크롤) */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* 현재 등록된 작물 정보가 있는 경우 삭제 안내 */}
              {(() => {
                const existingCrop = selectedDevice && selectedTier ? bedCropData[selectedDevice.id]?.[selectedTier] : null;
                return existingCrop?.cropName ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-amber-800 mb-1">현재 등록된 작물</h4>
                        <p className="text-sm text-amber-700">
                          {existingCrop.cropName} ({existingCrop.growingMethod})
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('현재 등록된 작물 정보를 삭제하시겠습니까?')) {
                            try {
                              // Supabase에서 작물 정보 삭제
                              const response = await fetch('/api/bed-crop-data', {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  deviceId: selectedDevice.id,
                                  tier: selectedTier
                                })
                              });

                              const result = await response.json();
                              
                              if (result.success) {
                                // 로컬 상태에서도 삭제
                                setBedCropData(prev => {
                                  const newData = { ...prev };
                                  if (newData[selectedDevice.id]) {
                                    const deviceData = { ...newData[selectedDevice.id] };
                                    delete deviceData[selectedTier];
                                    newData[selectedDevice.id] = deviceData;
                                  }
                                  return newData;
                                });
                                
                                // 입력 폼 초기화
                                setCropInputData({
                                  cropName: '',
                                  growingMethod: '담액식',
                                  plantType: 'seed',
                                  startDate: ''
                                });
                                
                                setShowCropInputModal(false);
                                alert(`${selectedTier}단의 작물 정보 및 관련 데이터가 모두 삭제되었습니다!\n\n• 단별 작물 정보\n• 베드 작물 정보\n• 디바이스 메타데이터\n• 베드 노트`);
                              } else {
                                throw new Error(result.error || '삭제 실패');
                              }
                            } catch (error) {
                              console.error('작물 정보 삭제 오류:', error);
                              alert('작물 정보 삭제에 실패했습니다. 다시 시도해주세요.');
                            }
                          }
                        }}
                        className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors font-semibold"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ) : null;
              })()}

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  작물 이름 *
                </label>
                <input
                  type="text"
                  value={cropInputData.cropName}
                  onChange={(e) => setCropInputData(prev => ({ ...prev, cropName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                  placeholder="예: 토마토, 상추"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  재배 방법
                </label>
                <select
                  value={cropInputData.growingMethod}
                  onChange={(e) => setCropInputData(prev => ({ ...prev, growingMethod: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                >
                  <option value="담액식">담액식</option>
                  <option value="NFT식">NFT식</option>
                  <option value="분무식">분무식</option>
                  <option value="점적식">점적식</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  작물 유형
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setCropInputData(prev => ({ ...prev, plantType: 'seed' }))}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      cropInputData.plantType === 'seed'
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    파종
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropInputData(prev => ({ ...prev, plantType: 'seedling' }))}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      cropInputData.plantType === 'seedling'
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    육묘
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  정식 시작일자
                </label>
                <input
                  type="date"
                  value={cropInputData.startDate}
                  onChange={(e) => setCropInputData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  수확 예정일자
                </label>
                <input
                  type="date"
                  value={cropInputData.harvestDate || ''}
                  onChange={(e) => setCropInputData(prev => ({ ...prev, harvestDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                />
              </div>

              {/* 생육 단계 기간 설정 */}
              {cropInputData.startDate && cropInputData.harvestDate && (() => {
                const start = new Date(cropInputData.startDate);
                const end = new Date(cropInputData.harvestDate);
                const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                
                if (totalDays <= 0) return null;
                
                const boundaries = cropInputData.plantType === 'seed' 
                  ? cropInputData.stageBoundaries.seed 
                  : cropInputData.stageBoundaries.seedling;
                
                const calculateDay = (percent: number) => Math.round((totalDays * percent) / 100);
                
                return (
                  <div className="col-span-2 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-200 rounded-xl p-6 mt-4">
                    <h4 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                      <span className="mr-2">🌱</span>
                      생육 단계 기간 설정 <span className="text-sm text-gray-500 ml-2">(총 {totalDays}일)</span>
                    </h4>
                    
                    <div className="space-y-6">
                      {cropInputData.plantType === 'seed' && (
                        <>
                          {/* 발아 기간 */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-semibold text-gray-700">
                                🟨 발아 기간 종료
                              </label>
                              <span className="text-sm font-bold text-purple-600">
                                {calculateDay(boundaries[0])}일 ({boundaries[0]}%)
                              </span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="30"
                              value={boundaries[0]}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value);
                                setCropInputData(prev => ({
                                  ...prev,
                                  stageBoundaries: {
                                    ...prev.stageBoundaries,
                                    seed: [newValue, Math.max(newValue + 10, prev.stageBoundaries.seed[1]), prev.stageBoundaries.seed[2]]
                                  }
                                }));
                              }}
                              className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                          </div>
                          
                          {/* 생식생장 기간 */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-semibold text-gray-700">
                                🔵 생식생장 기간 종료
                              </label>
                              <span className="text-sm font-bold text-purple-600">
                                {calculateDay(boundaries[1])}일 ({boundaries[1]}%)
                              </span>
                            </div>
                            <input
                              type="range"
                              min={boundaries[0] + 10}
                              max="70"
                              value={boundaries[1]}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value);
                                setCropInputData(prev => ({
                                  ...prev,
                                  stageBoundaries: {
                                    ...prev.stageBoundaries,
                                    seed: [prev.stageBoundaries.seed[0], newValue, Math.max(newValue + 10, prev.stageBoundaries.seed[2])]
                                  }
                                }));
                              }}
                              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                          </div>
                          
                          {/* 영양생장 기간 */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-semibold text-gray-700">
                                🟢 영양생장 기간 종료
                              </label>
                              <span className="text-sm font-bold text-purple-600">
                                {calculateDay(boundaries[2])}일 ({boundaries[2]}%)
                              </span>
                            </div>
                            <input
                              type="range"
                              min={boundaries[1] + 10}
                              max="95"
                              value={boundaries[2]}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value);
                                setCropInputData(prev => ({
                                  ...prev,
                                  stageBoundaries: {
                                    ...prev.stageBoundaries,
                                    seed: [prev.stageBoundaries.seed[0], prev.stageBoundaries.seed[1], newValue]
                                  }
                                }));
                              }}
                              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                          </div>
                        </>
                      )}
                      
                      {cropInputData.plantType === 'seedling' && (
                        <>
                          {/* 생식생장 기간 */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-semibold text-gray-700">
                                🔵 생식생장 기간 종료
                              </label>
                              <span className="text-sm font-bold text-purple-600">
                                {calculateDay(boundaries[0])}일 ({boundaries[0]}%)
                              </span>
                            </div>
                            <input
                              type="range"
                              min="20"
                              max="60"
                              value={boundaries[0]}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value);
                                setCropInputData(prev => ({
                                  ...prev,
                                  stageBoundaries: {
                                    ...prev.stageBoundaries,
                                    seedling: [newValue, Math.max(newValue + 10, prev.stageBoundaries.seedling[1])]
                                  }
                                }));
                              }}
                              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                          </div>
                          
                          {/* 영양생장 기간 */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-semibold text-gray-700">
                                🟢 영양생장 기간 종료
                              </label>
                              <span className="text-sm font-bold text-purple-600">
                                {calculateDay(boundaries[1])}일 ({boundaries[1]}%)
                              </span>
                            </div>
                            <input
                              type="range"
                              min={boundaries[0] + 10}
                              max="95"
                              value={boundaries[1]}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value);
                                setCropInputData(prev => ({
                                  ...prev,
                                  stageBoundaries: {
                                    ...prev.stageBoundaries,
                                    seedling: [prev.stageBoundaries.seedling[0], newValue]
                                  }
                                }));
                              }}
                              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                          </div>
                        </>
                      )}
                      
                      {/* 미리보기 게이지 */}
                      <div className="bg-white rounded-lg p-4 mt-4">
                        <div className="text-xs text-gray-600 mb-2 font-semibold">미리보기:</div>
                        <div className="h-8 w-full bg-gray-200 rounded-full overflow-hidden flex">
                          {cropInputData.plantType === 'seed' ? (
                            <>
                              <div style={{ width: `${boundaries[0]}%` }} className="bg-yellow-400 flex items-center justify-center text-xs font-bold text-gray-700">
                                발아
                              </div>
                              <div style={{ width: `${boundaries[1] - boundaries[0]}%` }} className="bg-blue-400 flex items-center justify-center text-xs font-bold text-white">
                                생식
                              </div>
                              <div style={{ width: `${boundaries[2] - boundaries[1]}%` }} className="bg-green-400 flex items-center justify-center text-xs font-bold text-white">
                                영양
                              </div>
                              <div style={{ width: `${100 - boundaries[2]}%` }} className="bg-red-400 flex items-center justify-center text-xs font-bold text-white">
                                수확
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ width: `${boundaries[0]}%` }} className="bg-blue-400 flex items-center justify-center text-xs font-bold text-white">
                                생식
                              </div>
                              <div style={{ width: `${boundaries[1] - boundaries[0]}%` }} className="bg-green-400 flex items-center justify-center text-xs font-bold text-white">
                                영양
                              </div>
                              <div style={{ width: `${100 - boundaries[1]}%` }} className="bg-red-400 flex items-center justify-center text-xs font-bold text-white">
                                수확
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 모달 푸터 (고정) */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCropInputModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    if (!cropInputData.cropName.trim()) {
                      alert('작물 이름을 입력해주세요.');
                      return;
                    }
                    
                    try {
                      // Supabase에 작물 정보 저장
                      const response = await fetch('/api/bed-crop-data', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          deviceId: selectedDevice.id,
                          tierNumber: selectedTier,
                          cropData: cropInputData
                        })
                      });
                      
                      const result = await response.json();
                      
                      if (result.success) {
                        // 로컬 상태도 업데이트
                        setBedCropData(prev => ({
                          ...prev,
                          [selectedDevice.id]: {
                            ...prev[selectedDevice.id],
                            [selectedTier]: {
                              ...cropInputData,
                              savedAt: new Date().toISOString()
                            }
                          }
                        }));
                        
                        console.log('✅ 작물 정보 저장 성공:', {
                          deviceId: selectedDevice.id,
                          tier: selectedTier,
                          cropData: cropInputData
                        });
                        
                        // 서버에서 최신 데이터 다시 로드
                        await loadCropData(selectedDevice.id);
                        
                        setShowCropInputModal(false);
                        alert(`${selectedTier}단에 ${cropInputData.cropName} 작물 정보가 저장되었습니다!`);
                      } else {
                        throw new Error(result.error || '저장 실패');
                      }
                    } catch (error) {
                      console.error('작물 정보 저장 오류:', error);
                      alert('작물 정보 저장에 실패했습니다. 다시 시도해주세요.');
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 font-semibold"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
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
