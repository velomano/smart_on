'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import { normalizeBedName, validateBedName } from '@/lib/bedNaming';
import AppHeader from '@/components/AppHeader';
import BedTierShelfVisualization from '@/components/BedTierShelfVisualization';
import BedNoteModal from '@/components/BedNoteModal';
import { getBedNoteStats } from '@/lib/bedNotes';

interface Farm {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface DeviceUIModel {
  deviceId: string;
  deviceName: string;
  profile: any;
  registry: any;
  uiModel: any;
}

interface Bed {
  id: string;
  farm_id: string;
  name: string;
  crop?: string;
  target_temp?: number;
  target_humidity?: number;
  target_ec?: number;
  target_ph?: number;
  created_at: string;
}

interface NewBedData {
  name: string;
  bedSystemType: string;
}


export default function FarmAutoDashboard({ farmId }: { farmId: string }) {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [devices, setDevices] = useState<DeviceUIModel[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [bedCropData, setBedCropData] = useState<{[bedId: string]: any[]}>({});
  // IoT 디바이스 데이터 상태
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [actuatorData, setActuatorData] = useState<any[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<{
    sensors: { active: number; total: number };
    actuators: { active: number; total: number };
    online: boolean;
  }>({ sensors: { active: 0, total: 0 }, actuators: { active: 0, total: 0 }, online: false });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 액추에이터 제어 관련 상태
  const [showActuatorModal, setShowActuatorModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<{id: string, name: string} | null>(null);
  
  // 작물 등록 모달 상태
  const [showCropInputModal, setShowCropInputModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
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
  
  // 베드 관련 상태
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [newBedData, setNewBedData] = useState<NewBedData>({
    name: '',
    bedSystemType: 'multi-tier'
  });
  
  // 생육 노트 관련 상태
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNoteBed, setSelectedNoteBed] = useState<{id: string, name: string} | null>(null);
  
  // 베드 편집 관련 상태
  const [showEditBedModal, setShowEditBedModal] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [editBedData, setEditBedData] = useState<NewBedData>({
    name: '',
    bedSystemType: 'multi-tier'
  });

  // 스케줄러 모달 상태
  const [showSchedulerModal, setShowSchedulerModal] = useState<{actuator: string, type: string} | null>(null);
  
  // 개별 센서 목표값 설정 모달 상태
  const [showSensorTargetModal, setShowSensorTargetModal] = useState<{sensor: string, type: string} | null>(null);
  const [targetValues, setTargetValues] = useState({
    temperature: { min: 22, max: 26 },
    humidity: { min: 60, max: 80 },
    ec: { min: 1.0, max: 2.5 },
    ph: { min: 5.5, max: 7.0 },
    waterLevel: { min: 70, max: 90 }
  });
  
  // 액추에이터 상태 관리
  const [actuatorStates, setActuatorStates] = useState<{[key: string]: {
    status: 'on' | 'off';
    value: number;
    mode: 'manual' | 'auto' | 'schedule';
    schedule?: {
      onTime: string;
      offTime: string;
      dualTime?: {
        period1: { start: string; end: string };
        period2: { start: string; end: string };
      };
    };
  }}>({
    led: { status: 'on', value: 75, mode: 'auto' },
    pump: { status: 'off', value: 0, mode: 'schedule' },
    fan: { status: 'on', value: 60, mode: 'auto' },
    heater: { status: 'off', value: 25, mode: 'schedule' }
  });
  
  // 베드 삭제 관련 상태
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingBed, setDeletingBed] = useState<Bed | null>(null);

  // 액추에이터 제어 함수
  const handleActuatorControl = async (actuatorType: string, action: string, value?: number) => {
    try {
      console.log(`🎛️ 액추에이터 제어: ${actuatorType} - ${action}`, value);
      
      // 로컬 상태 업데이트
      setActuatorStates(prev => ({
        ...prev,
        [actuatorType]: {
          ...prev[actuatorType],
          status: action === 'toggle' 
            ? (prev[actuatorType].status === 'on' ? 'off' : 'on')
            : prev[actuatorType].status,
          value: value !== undefined ? value : prev[actuatorType].value,
          mode: action === 'toggle' ? 'manual' : prev[actuatorType].mode
        }
      }));

      // API 호출
      const response = await fetch(`/api/farms/${farmId}/actuators/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: `device_${actuatorType}_${Date.now()}`, // 임시 디바이스 ID
          actuatorType,
          action: action === 'toggle' 
            ? (actuatorStates[actuatorType].status === 'on' ? 'off' : 'on')
            : action,
          value
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || '액추에이터 제어에 실패했습니다.');
      }

      console.log(`✅ 액추에이터 제어 성공: ${actuatorType} - ${action}`);
    } catch (error: any) {
      console.error('액추에이터 제어 오류:', error);
      alert(`액추에이터 제어에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
      
      // 실패 시 상태 롤백
      setActuatorStates(prev => ({
        ...prev,
        [actuatorType]: {
          ...prev[actuatorType],
          status: action === 'toggle' 
            ? (prev[actuatorType].status === 'on' ? 'off' : 'on')
            : prev[actuatorType].status
        }
      }));
    }
  };
  
  const router = useRouter();
  const supabase = createClient();

  // 센서 설정 함수
  const getSensorConfig = (sensorKey: string) => {
    const configs: Record<string, any> = {
      temperature: { icon: '🌡️', label: '온도', bgColor: 'bg-red-100', textColor: 'text-red-600' },
      humidity: { icon: '💧', label: '습도', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
      ec: { icon: '⚡', label: 'EC', bgColor: 'bg-green-100', textColor: 'text-green-600' },
      ph: { icon: '🧪', label: 'pH', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
      water_level: { icon: '💦', label: '수위', bgColor: 'bg-cyan-100', textColor: 'text-cyan-600' }
    };
    return configs[sensorKey] || { icon: '📊', label: sensorKey, bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
  };

  // 액추에이터 설정 함수
  const getActuatorConfig = (deviceType: string) => {
    const configs: Record<string, any> = {
      led: { icon: '💡', description: 'LED 조명', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
      pump: { icon: '🚰', description: '순환 펌프', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
      fan: { icon: '🌀', description: '환기 팬', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
      heater: { icon: '🔥', description: '히터', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
      cooler: { icon: '❄️', description: '쿨러', bgColor: 'bg-sky-100', textColor: 'text-sky-600' }
    };
    return configs[deviceType] || { icon: '🎛️', description: deviceType, bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
  };

  // 품질 색상 함수
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  // 품질 텍스트 함수
  const getQualityText = (quality: string) => {
    switch (quality) {
      case 'good': return '정상';
      case 'warning': return '주의';
      case 'error': return '오류';
      default: return '알 수 없음';
    }
  };

  useEffect(() => {
    fetchFarmData();
    fetchUserData();
  }, [farmId]);

  // 실시간 데이터 업데이트 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSensorData();
      fetchActuatorData();
    }, 30000);

    return () => clearInterval(interval);
  }, [farmId]);

  const fetchUserData = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  // 베드 편집 모달 열기
  const handleEditBed = (bed: Bed) => {
    console.log('🔄 베드 편집 모달 열기:', bed);
    
    // 기존 상태 초기화 후 새로운 데이터 설정
    const editData = {
      name: bed.name || '',
      bedSystemType: 'multi-tier'
    };
    
    console.log('📝 편집 폼에 설정할 데이터:', editData);
    setEditBedData(editData);
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
      
      // Supabase에 베드 정보 업데이트
      const updateData = {
        name: normalizedBedName
      };

      const { data, error } = await supabase
        .from('beds')
        .update(updateData)
        .eq('id', editingBed.id)
        .select();

      if (error) {
        console.error('베드 업데이트 오류:', error);
        alert(`베드 업데이트에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        return;
      }

      console.log('✅ 베드 업데이트 성공:', data);
      alert('베드 정보가 성공적으로 업데이트되었습니다.');
      
      // 모달 닫기 및 상태 초기화
      setShowEditBedModal(false);
      setEditingBed(null);
      setEditBedData({
        name: '',
        bedSystemType: 'multi-tier'
      });

      // 농장 데이터 다시 로드
      await fetchFarmData();
      
    } catch (error) {
      console.error('베드 업데이트 오류:', error);
      alert('베드 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 베드 삭제 확인 모달 열기
  const handleDeleteBed = (bed: Bed) => {
    setDeletingBed(bed);
    setShowDeleteConfirmModal(true);
  };

  // 베드 실제 삭제
  const confirmDeleteBed = async () => {
    if (!deletingBed) return;

    try {
      console.log('🗑️ 베드 삭제 시작:', deletingBed.id);
      
      // Supabase에서 베드 삭제
      const { data, error } = await supabase
        .from('beds')
        .delete()
        .eq('id', deletingBed.id)
        .select(); // 삭제된 데이터 반환

      console.log('🗑️ Supabase DELETE 응답:', { data, error });

      if (error) {
        console.error('베드 삭제 오류:', error);
        alert(`베드 삭제에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        return;
      }

      if (data && data.length === 0) {
        console.warn('⚠️ 삭제된 데이터가 없습니다.');
        alert('베드를 찾을 수 없거나 이미 삭제되었습니다.');
        setShowDeleteConfirmModal(false);
        setDeletingBed(null);
        return;
      }

      console.log('✅ 베드 삭제 성공:', data);
      alert('베드가 성공적으로 삭제되었습니다.');
      
      // 모달 닫기 및 상태 초기화
      setShowDeleteConfirmModal(false);
      setDeletingBed(null);

      // 농장 데이터 다시 로드
      await fetchFarmData();
      
    } catch (error) {
      console.error('베드 삭제 오류:', error);
      alert('베드 삭제 중 오류가 발생했습니다.');
    }
  };

  // 센서 데이터 가져오기
  const fetchSensorData = async () => {
    try {
      const response = await fetch(`/api/farms/${farmId}/sensors/latest`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSensorData(result.data || []);
        
        // 디바이스 상태 업데이트
        const sensorCount = result.data?.length || 0;
        const onlineSensors = result.data?.filter((s: any) => s.quality === 'good').length || 0;
        
        setDeviceStatus(prev => ({
          ...prev,
          sensors: { active: onlineSensors, total: sensorCount },
          online: sensorCount > 0
        }));
      }
    } catch (error) {
      console.error('센서 데이터 조회 오류:', error);
    }
  };

  // 액추에이터 데이터 가져오기
  const fetchActuatorData = async () => {
    try {
      const response = await fetch(`/api/farms/${farmId}/actuators/control`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setActuatorData(result.data || []);
        
        // 디바이스 상태 업데이트
        const actuatorCount = result.data?.length || 0;
        const onlineActuators = result.data?.filter((a: any) => a.isOnline).length || 0;
        
        setDeviceStatus(prev => ({
          ...prev,
          actuators: { active: onlineActuators, total: actuatorCount }
        }));
      }
    } catch (error) {
      console.error('액추에이터 데이터 조회 오류:', error);
    }
  };

  // 액추에이터 제어
  const controlActuator = async (deviceId: string, actuatorType: string, action: 'on' | 'off' | 'toggle') => {
    try {
      const response = await fetch(`/api/farms/${farmId}/actuators/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          actuatorType,
          action
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // 액추에이터 상태 업데이트
        await fetchActuatorData();
        console.log('액추에이터 제어 성공:', result.message);
      } else {
        console.error('액추에이터 제어 실패:', result.error);
      }
    } catch (error) {
      console.error('액추에이터 제어 오류:', error);
    }
  };

  // 베드별 작물 정보 로드 함수
  const fetchBedCropData = async (bedIds: string[]) => {
    try {
      const cropDataPromises = bedIds.map(async (bedId) => {
        const response = await fetch(`/api/bed-crop-data?deviceId=${bedId}`);
        const result = await response.json();
        return { bedId, data: response.ok && result.success ? result.data : [] };
      });

      const cropDataResults = await Promise.all(cropDataPromises);
      const cropDataMap: {[bedId: string]: any[]} = {};
      
      cropDataResults.forEach(({ bedId, data }) => {
        cropDataMap[bedId] = data;
      });

      setBedCropData(cropDataMap);
    } catch (error) {
      console.error('베드 작물 정보 로드 실패:', error);
    }
  };

  // 작물 정보 저장 함수
  const handleSaveCropData = async () => {
    if (!selectedBed || !selectedTier || !cropInputData.cropName.trim()) {
      alert('작물 이름을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/bed-crop-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: selectedBed.id,
          tierNumber: selectedTier,
          cropData: cropInputData
        })
      });

      const result = await response.json();
      
      console.log('작물 정보 저장 응답:', { response: response.ok, result });

      if (response.ok && result.success) {
        alert(`${selectedTier}단에 "${cropInputData.cropName}" 작물이 등록되었습니다!`);
        
        // 모달 닫기 및 상태 초기화
        setShowCropInputModal(false);
        setSelectedBed(null);
        setSelectedTier(null);
        setCropInputData({
          cropName: '',
          growingMethod: '담액식',
          plantType: 'seed' as 'seed' | 'seedling',
          startDate: '',
          harvestDate: '',
          stageBoundaries: {
            seed: [15, 45, 85],
            seedling: [40, 80]
          }
        });

        // 농장 데이터 다시 로드
        await fetchFarmData();
        
        // 작물 정보 및 센서 데이터 다시 로드
        await Promise.all([
          fetchBedCropData([selectedBed.id]),
          fetchSensorData()
        ]);
      } else {
        console.error('작물 정보 저장 실패:', { response: response.ok, result });
        throw new Error(result.error || result.message || '작물 정보 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('작물 정보 저장 오류:', error);
      alert(`작물 정보 저장에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 베드 추가 함수
  const handleAddBed = async () => {
    try {
      if (!newBedData.name.trim()) {
        alert('베드 이름을 입력해주세요.');
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

      const bedData = {
        farm_id: farmId,
        name: normalizedBedName
      };

      const { data, error } = await supabase
        .from('beds')
        .insert([bedData])
        .select();

      if (error) {
        console.error('베드 생성 오류:', error);
        alert(`베드 생성에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        return;
      }

      setNewBedData({ name: '', bedSystemType: 'multi-tier' });
      setShowAddBedModal(false);
      await fetchFarmData(); // 데이터 다시 로드
      alert(`새 베드 "${normalizedBedName}"가 추가되었습니다!`);
    } catch (error) {
      console.error('베드 생성 오류:', error);
      alert('베드 생성에 실패했습니다.');
    }
  };

  const fetchFarmData = async () => {
    try {
      setLoading(true);
      
      // 농장 정보 가져오기
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('*')
        .eq('id', farmId)
        .single();

      if (farmError) throw farmError;
      setFarm(farmData);

      // 베드 정보 가져오기
      const { data: bedsData, error: bedsError } = await supabase
        .from('beds')
        .select('*')
        .eq('farm_id', farmId);

      if (bedsError) {
        console.error('베드 조회 오류:', bedsError);
        setBeds([]);
      } else {
        setBeds(bedsData || []);
        
        // 베드 작물 정보 및 IoT 데이터 로드
        if (bedsData && bedsData.length > 0) {
          await Promise.all([
            fetchBedCropData(bedsData.map(bed => bed.id)),
            fetchSensorData(),
            fetchActuatorData()
          ]);
        }
      }

      // 디바이스 UI 모델 가져오기
      const response = await fetch(`/api/farms/${farmId}/devices/ui-model`);
      if (response.ok) {
        const deviceData = await response.json();
        setDevices(deviceData.devices || []);
      } else {
        console.error('디바이스 UI 모델 로드 실패:', response.status);
        setDevices([]);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  // Early returns for loading, error, and missing farm states
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={user || undefined} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">농장 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={user || undefined} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={user || undefined} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">농장을 찾을 수 없습니다</h2>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user || undefined} />
      <div className="container mx-auto px-4 py-8">
        {/* 농장 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{farm.name}</h1>
          {farm.description && (
            <p className="text-gray-600">{farm.description}</p>
          )}
        </div>

        {/* 베드 관리 섹션 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">베드 관리</h2>
            {user && user.role !== 'team_member' && (
              <button
                onClick={() => setShowAddBedModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                + 새 베드 추가
              </button>
            )}
          </div>

          {beds.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-400 text-6xl mb-4">🌱</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 베드가 없습니다</h3>
              <p className="text-gray-500 mb-4">첫 번째 베드를 추가하여 농장을 시작해보세요.</p>
              {user && user.role !== 'team_member' && (
                <button
                  onClick={() => setShowAddBedModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  + 첫 번째 베드 추가
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {beds.map((bed) => (
                  <div key={bed.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    {/* 베드 헤더 */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 text-lg">{bed.name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-500">온라인</span>
                      </div>
                    </div>

                    {/* 베드 정보 */}
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      {(() => {
                        const bedCrops = bedCropData[bed.id];
                        if (bedCrops && bedCrops.length > 0) {
                          const cropNames = bedCrops.map(crop => crop.crop_name).join(', ');
                          return (
                            <p><span className="font-medium">🌱 {bedCrops.length}개 작물:</span> {cropNames}</p>
                          );
                        }
                        return (
                          <p><span className="font-medium">🌱 작물:</span> 등록된 작물 없음</p>
                        );
                      })()}
                    </div>

                    {/* 베드 시각화와 센서 데이터를 반응형으로 배치 */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* 베드 시각화 */}
                      <div className="flex-shrink-0">
                        <BedTierShelfVisualization
                          activeTiers={3}
                          tierStatuses={[1, 2, 3].map(tierNumber => {
                            const cropData = bedCropData[bed.id]?.find(crop => crop.tier_number === tierNumber);
                            return {
                            tierNumber,
                              hasPlants: !!cropData,
                              cropName: cropData?.crop_name,
                              growingMethod: cropData?.growing_method,
                              plantType: cropData?.plant_type,
                              startDate: cropData?.start_date,
                              harvestDate: cropData?.harvest_date,
                              stageBoundaries: cropData?.stage_boundaries
                            };
                          })}
                          waterLevelStatus="normal"
                          onTierClick={(tierNumber) => {
                            setSelectedBed({ id: bed.id, name: bed.name });
                            setSelectedTier(tierNumber);
                            setShowCropInputModal(true);
                          }}
                          compact={true}
                        />
                      </div>

                      {/* IoT 디바이스 상태 영역 */}
                      <div className="flex-1 min-w-0">
                        <h6 className="text-base font-bold text-gray-600 mb-3 flex items-center">
                          <span className="text-lg mr-2">🔗</span>
                          IoT 디바이스 상태
                        </h6>
                        
                        {/* 디바이스 상태 카드 - 한 행 */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-gray-700">디바이스 상태</span>
                        </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-600">
                                <span>센서: {deviceStatus.sensors.active}/{deviceStatus.sensors.total}</span>
                                <span>액추에이터: {deviceStatus.actuators.active}/{deviceStatus.actuators.total}</span>
                      </div>
                    </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const qrUrl = `${window.location.origin}/farms/${farmId}/bed/${bed.id}/qr`;
                                  window.open(qrUrl, '_blank');
                                }}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                <span>📱</span>
                                <span>앱 연결</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  const bridgeUrl = `${window.location.origin}/system?tab=bridge&farmId=${farmId}&bedId=${bed.id}`;
                                  window.open(bridgeUrl, '_blank');
                                }}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                              >
                                <span>🔗</span>
                                <span>유니버셜 브릿지</span>
                              </button>
                  </div>
            </div>
        </div>

                        {/* 센서 데이터 및 액추에이터 제어 - 나란히 배치 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* 센서 데이터 그리드 */}
                          <div className="space-y-3">
                            <h6 className="text-sm font-semibold text-gray-600 flex items-center">
                              <span className="mr-2">📊</span>
                              실시간 센서 데이터
                            </h6>
                            
                          <div className="grid grid-cols-2 gap-3">
                            {/* 온도 센서 - 개선된 디자인 */}
                            <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <span className="text-white text-sm">🌡️</span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">온도</div>
                                    <div className="text-xs text-gray-500">Temperature</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-blue-600">24.5°C</div>
                                    <div className="text-xs text-green-600 font-medium">정상</div>
                                  </div>
                                  <button
                                    onClick={() => setShowSensorTargetModal({sensor: 'temperature', type: 'temperature'})}
                                    className="w-6 h-6 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors"
                                    title="목표값 설정"
                                  >
                                    <span className="text-blue-600 text-xs">⚙️</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* 개선된 원형 게이지 */}
                              <div className="flex justify-center">
                                <div className="relative w-16 h-16">
                                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                    {/* 배경 원 */}
                                    <path
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#e2e8f0"
                                      strokeWidth="2.5"
                                    />
                                    {/* 진행 원 */}
                                    <path
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="url(#tempGradient)"
                                      strokeWidth="2.5"
                                      strokeDasharray="75, 100"
                                      strokeLinecap="round"
                                      className="drop-shadow-sm"
                                    />
                                    <defs>
                                      <linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#1d4ed8" />
                                      </linearGradient>
                                    </defs>
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="text-xs font-bold text-gray-700">75%</div>
                                      <div className="text-xs text-gray-500">범위</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 범위 표시 */}
                              <div className="mt-2 text-center">
                                <div className="text-xs text-gray-600">
                                  목표: {targetValues.temperature.min}-{targetValues.temperature.max}°C
                                </div>
                              </div>
                            </div>

                            {/* 습도 센서 - 개선된 디자인 */}
                            <div className="bg-gradient-to-br from-white to-cyan-50 border border-cyan-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <span className="text-white text-sm">💧</span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">습도</div>
                                    <div className="text-xs text-gray-500">Humidity</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-cyan-600">65%</div>
                                    <div className="text-xs text-green-600 font-medium">정상</div>
                                  </div>
                                  <button
                                    onClick={() => setShowSensorTargetModal({sensor: 'humidity', type: 'humidity'})}
                                    className="w-6 h-6 bg-cyan-100 hover:bg-cyan-200 rounded-lg flex items-center justify-center transition-colors"
                                    title="목표값 설정"
                                  >
                                    <span className="text-cyan-600 text-xs">⚙️</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* 개선된 원형 게이지 */}
                              <div className="flex justify-center">
                                <div className="relative w-16 h-16">
                                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                    {/* 배경 원 */}
                                    <path
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#e2e8f0"
                                      strokeWidth="2.5"
                                    />
                                    {/* 진행 원 */}
                                    <path
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="url(#humidityGradient)"
                                      strokeWidth="2.5"
                                      strokeDasharray="65, 100"
                                      strokeLinecap="round"
                                      className="drop-shadow-sm"
                                    />
                                    <defs>
                                      <linearGradient id="humidityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#06b6d4" />
                                        <stop offset="100%" stopColor="#0891b2" />
                                      </linearGradient>
                                    </defs>
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="text-xs font-bold text-gray-700">65%</div>
                                      <div className="text-xs text-gray-500">습도</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 범위 표시 */}
                              <div className="mt-2 text-center">
                                <div className="text-xs text-gray-600">
                                  목표: {targetValues.humidity.min}-{targetValues.humidity.max}%
                                </div>
                              </div>
                            </div>

                            {/* EC 센서 - 수평 바 */}
                            <div className="bg-gradient-to-br from-white to-green-50 border border-green-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <span className="text-white text-sm">⚡</span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">EC</div>
                                    <div className="text-xs text-gray-500">Conductivity</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-green-600">1.8 mS/cm</div>
                                    <div className="text-xs text-green-600 font-medium">정상</div>
                                  </div>
                                  <button
                                    onClick={() => setShowSensorTargetModal({sensor: 'ec', type: 'ec'})}
                                    className="w-6 h-6 bg-green-100 hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors"
                                    title="목표값 설정"
                                  >
                                    <span className="text-green-600 text-xs">⚙️</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* 개선된 수평 바 */}
                              <div className="space-y-2">
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                                  <div 
                                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-700 ease-out shadow-sm" 
                                    style={{ width: '60%' }}
                                  >
                                    <div className="flex justify-end items-center h-full pr-2">
                                      <span className="text-xs font-bold text-white drop-shadow-sm">60%</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>0.0</span>
                                  <span className="font-medium">1.8 / 3.0</span>
                                  <span>3.0 mS/cm</span>
                                </div>
                              </div>
                              
                              {/* 범위 표시 */}
                              <div className="mt-2 text-center">
                                <div className="text-xs text-gray-600">
                                  목표: {targetValues.ec.min}-{targetValues.ec.max} mS/cm
                                </div>
                              </div>
                            </div>

                            {/* pH 센서 - 원형 게이지 */}
                            <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <span className="text-white text-sm">🧪</span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">pH</div>
                                    <div className="text-xs text-gray-500">Acidity</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-purple-600">6.2</div>
                                    <div className="text-xs text-green-600 font-medium">정상</div>
                                  </div>
                                  <button
                                    onClick={() => setShowSensorTargetModal({sensor: 'ph', type: 'ph'})}
                                    className="w-6 h-6 bg-purple-100 hover:bg-purple-200 rounded-lg flex items-center justify-center transition-colors"
                                    title="목표값 설정"
                                  >
                                    <span className="text-purple-600 text-xs">⚙️</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* 개선된 원형 게이지 */}
                              <div className="flex justify-center">
                                <div className="relative w-16 h-16">
                                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                    {/* 배경 원 */}
                                    <path
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#e2e8f0"
                                      strokeWidth="2.5"
                                    />
                                    {/* 진행 원 */}
                                    <path
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="url(#phGradient)"
                                      strokeWidth="2.5"
                                      strokeDasharray="70, 100"
                                      strokeLinecap="round"
                                      className="drop-shadow-sm"
                                    />
                                    <defs>
                                      <linearGradient id="phGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#7c3aed" />
                                      </linearGradient>
                                    </defs>
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="text-xs font-bold text-gray-700">70%</div>
                                      <div className="text-xs text-gray-500">범위</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 범위 표시 */}
                              <div className="mt-2 text-center">
                                <div className="text-xs text-gray-600">
                                  목표: {targetValues.ph.min}-{targetValues.ph.max}
                                </div>
                              </div>
                            </div>

                            {/* 수위 센서 - 개선된 디자인 */}
                            <div className="bg-gradient-to-br from-white to-cyan-50 border border-cyan-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <span className="text-white text-sm">💦</span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">수위</div>
                                    <div className="text-xs text-gray-500">Water Level</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-cyan-600">85%</div>
                                    <div className="text-xs text-green-600 font-medium">정상</div>
                                  </div>
                                  <button
                                    onClick={() => setShowSensorTargetModal({sensor: 'waterLevel', type: 'waterLevel'})}
                                    className="w-6 h-6 bg-cyan-100 hover:bg-cyan-200 rounded-lg flex items-center justify-center transition-colors"
                                    title="목표값 설정"
                                  >
                                    <span className="text-cyan-600 text-xs">⚙️</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* 개선된 수직 바 */}
                              <div className="flex justify-center">
                                <div className="relative w-8 h-16 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                  <div 
                                    className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-cyan-300 rounded-full transition-all duration-700 ease-out shadow-sm" 
                                    style={{ height: '85%' }}
                                  >
                                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                                      <span className="text-xs font-bold text-white drop-shadow-sm">85%</span>
                                    </div>
                                    {/* 물결 효과 */}
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 범위 표시 */}
                              <div className="mt-2 text-center">
                                <div className="text-xs text-gray-600">
                                  목표: {targetValues.waterLevel.min}-{targetValues.waterLevel.max}%
                                </div>
                              </div>
                            </div>
                          </div>
                          </div>

                          {/* 액추에이터 제어 */}
                          <div className="space-y-2">
                            <h6 className="text-xs font-semibold text-gray-600 flex items-center">
                              <span className="mr-1">🎛️</span>
                              액추에이터 제어
                            </h6>
                            
                          <div className="grid grid-cols-1 gap-2">
                            {/* LED 조명 - 밝기 슬라이더 */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <span className="text-yellow-600 text-xs">💡</span>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-700">LED 조명</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <div className="text-xs font-medium text-gray-700">{actuatorStates.led.status.toUpperCase()}</div>
                                  <div className="text-xs text-green-600">{actuatorStates.led.mode === 'auto' ? '자동' : actuatorStates.led.mode === 'manual' ? '수동' : '스케줄'}</div>
                                </div>
                <button
                                    onClick={() => handleActuatorControl('led', 'toggle')}
                                    className={`w-8 h-6 text-white text-xs rounded transition-colors ${
                                      actuatorStates.led.status === 'on' 
                                        ? 'bg-green-600 hover:bg-green-700' 
                                        : 'bg-gray-400 hover:bg-gray-500'
                                    }`}
                                  >
                                    {actuatorStates.led.status === 'on' ? 'ON' : 'OFF'}
                </button>
                                </div>
                              </div>
                              
                              {/* 밝기 슬라이더 */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>밝기</span>
                                  <span className="font-medium">{actuatorStates.led.value}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={actuatorStates.led.value}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                  style={{
                                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${actuatorStates.led.value}%, #e5e7eb ${actuatorStates.led.value}%, #e5e7eb 100%)`
                                  }}
                                  onChange={(e) => handleActuatorControl('led', 'brightness', parseInt(e.target.value))}
                                />
                              </div>

                              {/* 스케줄러 설정 */}
                              <div className="mt-3 pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-600">스케줄</span>
                <button
                                    onClick={() => setShowSchedulerModal({ actuator: 'led', type: 'led' })}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                >
                                    설정
                </button>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {actuatorStates.led.schedule ? `켜기: ${actuatorStates.led.schedule.onTime} | 끄기: ${actuatorStates.led.schedule.offTime}` : '스케줄 미설정'}
                                </div>
                              </div>
                            </div>

                            {/* 순환 펌프 - 속도 슬라이더 */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600 text-xs">🚰</span>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-700">순환 펌프</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-right">
                                    <div className="text-xs font-medium text-gray-700">{actuatorStates.pump.status.toUpperCase()}</div>
                                    <div className="text-xs text-gray-500">{actuatorStates.pump.mode === 'auto' ? '자동' : actuatorStates.pump.mode === 'manual' ? '수동' : '스케줄'}</div>
                                  </div>
                                  <button
                                    onClick={() => handleActuatorControl('pump', 'toggle')}
                                    className={`w-8 h-6 text-white text-xs rounded transition-colors ${
                                      actuatorStates.pump.status === 'on' 
                                        ? 'bg-blue-600 hover:bg-blue-700' 
                                        : 'bg-gray-400 hover:bg-gray-500'
                                    }`}
                                  >
                                    {actuatorStates.pump.status === 'on' ? 'ON' : 'OFF'}
                                  </button>
                                </div>
                              </div>
                              
                              {/* 속도 슬라이더 */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>속도</span>
                                  <span className="font-medium">{actuatorStates.pump.value}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={actuatorStates.pump.value}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                  style={{
                                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${actuatorStates.pump.value}%, #e5e7eb ${actuatorStates.pump.value}%, #e5e7eb 100%)`
                                  }}
                                  onChange={(e) => handleActuatorControl('pump', 'speed', parseInt(e.target.value))}
                                />
                              </div>

                              {/* 듀얼타임 설정 */}
                              <div className="mt-3 pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-600">듀얼타임</span>
                                  <button
                                    onClick={() => setShowSchedulerModal({ actuator: 'pump', type: 'dual-time' })}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    설정
                                  </button>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {actuatorStates.pump.schedule?.dualTime ? 
                                    `작동: 10분 → 휴지: 5분 (08:00-18:00)` : 
                                    '듀얼타임 미설정'
                                  }
                                </div>
                              </div>
                            </div>

                            {/* 환기 팬 - 속도 슬라이더 */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-600 text-xs">🌀</span>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-700">환기 팬</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-right">
                                    <div className="text-xs font-medium text-gray-700">{actuatorStates.fan.status.toUpperCase()}</div>
                                    <div className="text-xs text-blue-600">{actuatorStates.fan.mode === 'auto' ? '자동' : actuatorStates.fan.mode === 'manual' ? '수동' : '스케줄'}</div>
                                  </div>
                                  <button
                                    onClick={() => handleActuatorControl('fan', 'toggle')}
                                    className={`w-8 h-6 text-white text-xs rounded transition-colors ${
                                      actuatorStates.fan.status === 'on' 
                                        ? 'bg-blue-600 hover:bg-blue-700' 
                                        : 'bg-gray-400 hover:bg-gray-500'
                                    }`}
                                  >
                                    {actuatorStates.fan.status === 'on' ? 'ON' : 'OFF'}
                                  </button>
                                </div>
                              </div>
                              
                              {/* 속도 슬라이더 */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>속도</span>
                                  <span className="font-medium">{actuatorStates.fan.value}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={actuatorStates.fan.value}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                  style={{
                                    background: `linear-gradient(to right, #6b7280 0%, #6b7280 ${actuatorStates.fan.value}%, #e5e7eb ${actuatorStates.fan.value}%, #e5e7eb 100%)`
                                  }}
                                  onChange={(e) => handleActuatorControl('fan', 'speed', parseInt(e.target.value))}
                                />
                              </div>

                              {/* 스케줄러 설정 */}
                              <div className="mt-3 pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-600">스케줄</span>
                                  <button
                                    onClick={() => setShowSchedulerModal({ actuator: 'fan', type: 'schedule' })}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    설정
                                  </button>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {actuatorStates.fan.schedule ? `켜기: ${actuatorStates.fan.schedule.onTime} | 끄기: ${actuatorStates.fan.schedule.offTime}` : '스케줄 미설정'}
                                </div>
                              </div>
                            </div>

                            {/* 히터 - 온도 설정 */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <span className="text-orange-600 text-xs">🔥</span>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-700">히터</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-right">
                                    <div className="text-xs font-medium text-gray-700">{actuatorStates.heater.status.toUpperCase()}</div>
                                    <div className="text-xs text-gray-500">{actuatorStates.heater.mode === 'auto' ? '자동' : actuatorStates.heater.mode === 'manual' ? '수동' : '스케줄'}</div>
                                  </div>
                                  <button
                                    onClick={() => handleActuatorControl('heater', 'toggle')}
                                    className={`w-8 h-6 text-white text-xs rounded transition-colors ${
                                      actuatorStates.heater.status === 'on' 
                                        ? 'bg-orange-600 hover:bg-orange-700' 
                                        : 'bg-gray-400 hover:bg-gray-500'
                                    }`}
                                  >
                                    {actuatorStates.heater.status === 'on' ? 'ON' : 'OFF'}
                                  </button>
                                </div>
                              </div>
                              
                              {/* 온도 설정 */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>목표 온도</span>
                                  <span className="font-medium">{actuatorStates.heater.value}°C</span>
                                </div>
                                <input
                                  type="range"
                                  min="15"
                                  max="35"
                                  value={actuatorStates.heater.value}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                  style={{
                                    background: `linear-gradient(to right, #f97316 0%, #f97316 ${((actuatorStates.heater.value - 15) / 20) * 100}%, #e5e7eb ${((actuatorStates.heater.value - 15) / 20) * 100}%, #e5e7eb 100%)`
                                  }}
                                  onChange={(e) => handleActuatorControl('heater', 'temperature', parseInt(e.target.value))}
                                />
                              </div>

                              {/* 듀얼타임 설정 */}
                              <div className="mt-3 pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-600">듀얼타임</span>
                                  <button
                                    onClick={() => setShowSchedulerModal({ actuator: 'heater', type: 'dual-time' })}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    설정
                                  </button>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {actuatorStates.heater.schedule?.dualTime ? 
                                    `작동: 15분 → 휴지: 10분 (18:00-06:00)` : 
                                    '듀얼타임 미설정'
                                  }
                                </div>
                              </div>
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
                            setSelectedNoteBed({
                              id: bed.id,
                              name: bed.name
                            });
                            setShowNoteModal(true);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          보기 →
                        </button>
                      </div>
                      
                      {(() => {
                        const noteStats = getBedNoteStats(bed.id);
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
                                          className={`px-1 py-0.5 rounded-full text-xs ${
                                            tag === '🌱 생장' ? 'bg-green-100 text-green-900' :
                                            tag === '💧 관수' ? 'bg-blue-100 text-blue-900' :
                                            tag === '🌡️ 온도' ? 'bg-red-100 text-red-900' :
                                            tag === '💡 조명' ? 'bg-yellow-100 text-yellow-900' :
                                            tag === '🌿 수확' ? 'bg-purple-100 text-purple-900' :
                                            tag === '🐛 병해' ? 'bg-red-100 text-red-900' :
                                            tag === '🌱 정식' ? 'bg-green-100 text-green-900' :
                                            tag === '✂️ 정지' ? 'bg-orange-100 text-orange-900' :
                                            tag === '📊 측정' ? 'bg-indigo-100 text-indigo-900' :
                                            tag === '🔧 관리' ? 'bg-gray-100 text-gray-900' :
                                            'bg-gray-100 text-gray-900'
                                          }`}
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
                            setSelectedNoteBed({
                              id: bed.id,
                              name: bed.name
                            });
                            setShowNoteModal(true);
                          }}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          📝 생육 노트
                        </button>
              {user && user.role !== 'team_member' && (
                <button
                            onClick={() => handleEditBed(bed)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            ✏️ 편집
                          </button>
                        )}
                        {user && user.role !== 'team_member' && (
                          <button
                            onClick={() => handleDeleteBed(bed)}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            🗑️ 삭제
                </button>
              )}
            </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 새 베드 추가 버튼 */}
        {user && user.role !== 'team_member' && (
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowAddBedModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              + 새 베드 추가
            </button>
          </div>
        )}

        {/* 베드 추가 모달 */}
        {showAddBedModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* 배경 오버레이 */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddBedModal(false)} />
            
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

        {/* 작물 등록 모달 */}
        {showCropInputModal && selectedBed && selectedTier && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* 배경 오버레이 */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
              setShowCropInputModal(false);
              setSelectedBed(null);
              setSelectedTier(null);
            }} />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedTier}단 작물 정보 입력
                </h3>
                <button
                  onClick={() => {
                    setShowCropInputModal(false);
                    setSelectedBed(null);
                    setSelectedTier(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 모달 내용 */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 작물 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      작물 이름 *
                    </label>
                    <input
                      type="text"
                      value={cropInputData.cropName}
                      onChange={(e) => setCropInputData(prev => ({ ...prev, cropName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                      placeholder="예: 토마토"
                    />
                  </div>

                  {/* 재배 방법 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      재배 방법
                    </label>
                    <select
                      value={cropInputData.growingMethod}
                      onChange={(e) => setCropInputData(prev => ({ ...prev, growingMethod: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                    >
                      <option value="담액식">담액식</option>
                      <option value="NFT">NFT</option>
                      <option value="DWC">DWC</option>
                      <option value="토경재배">토경재배</option>
                    </select>
                  </div>

                  {/* 작물 유형 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      작물 유형
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setCropInputData(prev => ({ ...prev, plantType: 'seed' }))}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${
                          cropInputData.plantType === 'seed'
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        파종
                      </button>
                      <button
                        type="button"
                        onClick={() => setCropInputData(prev => ({ ...prev, plantType: 'seedling' }))}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${
                          cropInputData.plantType === 'seedling'
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        육묘
                      </button>
                    </div>
                  </div>

                  {/* 정식 시작일자 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      정식 시작일자
                    </label>
                    <input
                      type="date"
                      value={cropInputData.startDate}
                      onChange={(e) => setCropInputData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600"
                    />
                  </div>

                  {/* 수확 예정일자 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      수확 예정일자
                    </label>
                    <input
                      type="date"
                      value={cropInputData.harvestDate}
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
                      <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-200 rounded-xl p-6 mt-4">
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
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 생장기간 게이지 미리보기 */}
              {cropInputData.startDate && cropInputData.harvestDate && (() => {
                const start = new Date(cropInputData.startDate);
                const end = new Date(cropInputData.harvestDate);
                const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                
                if (totalDays <= 0) return null;
                
                const boundaries = cropInputData.plantType === 'seed' 
                  ? cropInputData.stageBoundaries.seed 
                  : cropInputData.stageBoundaries.seedling;
                
                const stages = cropInputData.plantType === 'seed' 
                  ? [
                      { label: '발아', color: '#FCD34D', width: boundaries[0] },
                      { label: '생식', color: '#60A5FA', width: boundaries[1] - boundaries[0] },
                      { label: '영양', color: '#34D399', width: boundaries[2] - boundaries[1] },
                      { label: '수확', color: '#F87171', width: 100 - boundaries[2] }
                    ]
                  : [
                      { label: '생식', color: '#60A5FA', width: boundaries[0] },
                      { label: '영양', color: '#34D399', width: boundaries[1] - boundaries[0] },
                      { label: '수확', color: '#F87171', width: 100 - boundaries[1] }
                    ];
                
                return (
                  <div className="px-6 pb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">미리보기:</h4>
                    <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden shadow-inner">
                      <div className="h-full flex">
                        {stages.map((stage, index) => (
                          <div
                            key={index}
                            className="h-full flex items-center justify-center"
                            style={{
                              width: `${stage.width}%`,
                              backgroundColor: stage.color
                            }}
                          >
                            <span className="text-xs font-bold text-white drop-shadow-sm">
                              {stage.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 모달 푸터 */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCropInputModal(false);
                    setSelectedBed(null);
                    setSelectedTier(null);
                  }}
                  className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveCropData}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 생육 노트 모달 */}
        {showNoteModal && selectedNoteBed && user && (
          <BedNoteModal
            isOpen={showNoteModal}
            onClose={() => {
              setShowNoteModal(false);
              setSelectedNoteBed(null);
            }}
            bedId={selectedNoteBed.id}
            bedName={selectedNoteBed.name}
            authorId={user.id}
            authorName={user.name || user.email || 'Unknown'}
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
                        베드: <span className="font-medium">{deletingBed.name || '알 수 없음'}</span>
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

        {/* 스케줄러 설정 모달 */}
        {showSchedulerModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* 배경 오버레이 */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            {/* 모달창 */}
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {showSchedulerModal.type === 'dual-time' ? '듀얼타임 설정' : '스케줄러 설정'}
                </h3>
                <button
                  onClick={() => setShowSchedulerModal(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* 요일 선택 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">적용 요일</label>
                  <div className="grid grid-cols-7 gap-2">
                    {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                      <label key={day} className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-600 mb-1">{day}</span>
                        <input
                          type="checkbox"
                          defaultChecked={index < 5} // 월-금 기본 선택
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {showSchedulerModal.type === 'dual-time' ? (
                  // 듀얼타임 설정 (작동/휴지 주기)
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">작동 주기 설정</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-600">작동 시간 (분)</span>
                          <input
                            type="number"
                            min="1"
                            max="1440"
                            defaultValue="10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                            placeholder="10"
                          />
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">휴지 시간 (분)</span>
                          <input
                            type="number"
                            min="1"
                            max="1440"
                            defaultValue="5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                            placeholder="5"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">적용 시간대</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-600">시작 시간</span>
                          <input
                            type="time"
                            defaultValue="08:00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">종료 시간</span>
                          <input
                            type="time"
                            defaultValue="18:00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-500 text-sm">💡</span>
                        <div className="text-xs text-blue-700">
                          <p className="font-medium mb-1">듀얼타임 작동 방식:</p>
                          <p>• 10분 작동 → 5분 휴지 → 10분 작동 → 5분 휴지 (반복)</p>
                          <p>• 설정된 시간대 내에서만 주기적으로 작동합니다</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 일반 스케줄러 설정
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">켜기 시간</label>
                      <input
                        type="time"
                        defaultValue="06:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">끄기 시간</label>
                      <input
                        type="time"
                        defaultValue="22:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                      />
                    </div>
                  </div>
                )}

                {/* 설정 미리보기 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">설정 미리보기</h4>
                  <div className="text-xs text-gray-600">
                    {showSchedulerModal.type === 'dual-time' ? (
                      <div>
                        <div>• 작동: 10분 → 휴지: 5분 (반복)</div>
                        <div>• 적용 시간: 08:00 - 18:00</div>
                        <div>• 적용 요일: 월, 화, 수, 목, 금</div>
                      </div>
                    ) : (
                      <div>
                        <div>• 켜기: 06:00</div>
                        <div>• 끄기: 22:00</div>
                        <div>• 적용: 월, 화, 수, 목, 금</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowSchedulerModal(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                      // TODO: 스케줄러 설정 저장 로직
                      setShowSchedulerModal(null);
                      alert('스케줄러 설정이 저장되었습니다.');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 개별 센서 목표값 설정 모달 */}
        {showSensorTargetModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* 배경 오버레이 */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            {/* 모달창 */}
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {showSensorTargetModal.sensor === 'temperature' && '🌡️ 온도 목표값 설정'}
                  {showSensorTargetModal.sensor === 'humidity' && '💧 습도 목표값 설정'}
                  {showSensorTargetModal.sensor === 'ec' && '⚡ EC 목표값 설정'}
                  {showSensorTargetModal.sensor === 'ph' && '🧪 pH 목표값 설정'}
                  {showSensorTargetModal.sensor === 'waterLevel' && '💦 수위 목표값 설정'}
                </h3>
                <button
                  onClick={() => setShowSensorTargetModal(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* 센서별 설정 */}
                {showSensorTargetModal.sensor === 'temperature' && (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-600">최소 온도 (°C)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={targetValues.temperature.min}
                          onChange={(e) => setTargetValues(prev => ({
                            ...prev,
                            temperature: { ...prev.temperature, min: parseFloat(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">최대 온도 (°C)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={targetValues.temperature.max}
                          onChange={(e) => setTargetValues(prev => ({
                            ...prev,
                            temperature: { ...prev.temperature, max: parseFloat(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                        />
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-blue-700">
                        <strong>현재 설정:</strong> {targetValues.temperature.min}°C ~ {targetValues.temperature.max}°C
                      </div>
                    </div>
                  </div>
                )}

                {showSensorTargetModal.sensor === 'humidity' && (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-600">최소 습도 (%)</span>
                        <input
                          type="number"
                          step="1"
                          value={targetValues.humidity.min}
                          onChange={(e) => setTargetValues(prev => ({
                            ...prev,
                            humidity: { ...prev.humidity, min: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 text-gray-800"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">최대 습도 (%)</span>
                        <input
                          type="number"
                          step="1"
                          value={targetValues.humidity.max}
                          onChange={(e) => setTargetValues(prev => ({
                            ...prev,
                            humidity: { ...prev.humidity, max: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 text-gray-800"
                        />
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <div className="text-sm text-cyan-700">
                        <strong>현재 설정:</strong> {targetValues.humidity.min}% ~ {targetValues.humidity.max}%
                      </div>
                    </div>
                  </div>
                )}

                {showSensorTargetModal.sensor === 'ec' && (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-600">최소 EC (mS/cm)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={targetValues.ec.min}
                          onChange={(e) => setTargetValues(prev => ({
                            ...prev,
                            ec: { ...prev.ec, min: parseFloat(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-800"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">최대 EC (mS/cm)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={targetValues.ec.max}
                          onChange={(e) => setTargetValues(prev => ({
                            ...prev,
                            ec: { ...prev.ec, max: parseFloat(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-800"
                        />
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-700">
                        <strong>현재 설정:</strong> {targetValues.ec.min} ~ {targetValues.ec.max} mS/cm
                      </div>
                    </div>
                  </div>
                )}

                {showSensorTargetModal.sensor === 'ph' && (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-600">최소 pH</span>
                        <input
                          type="number"
                          step="0.1"
                          value={targetValues.ph.min}
                          onChange={(e) => setTargetValues(prev => ({
                            ...prev,
                            ph: { ...prev.ph, min: parseFloat(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-800"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">최대 pH</span>
                        <input
                          type="number"
                          step="0.1"
                          value={targetValues.ph.max}
                          onChange={(e) => setTargetValues(prev => ({
                            ...prev,
                            ph: { ...prev.ph, max: parseFloat(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-800"
                        />
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-sm text-purple-700">
                        <strong>현재 설정:</strong> {targetValues.ph.min} ~ {targetValues.ph.max}
                      </div>
                    </div>
                  </div>
                )}

                {showSensorTargetModal.sensor === 'waterLevel' && (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-600">최소 수위 (%)</span>
                        <input
                          type="number"
                          step="1"
                          value={targetValues.waterLevel.min}
                          onChange={(e) => setTargetValues(prev => ({
                            ...prev,
                            waterLevel: { ...prev.waterLevel, min: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 text-gray-800"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">최대 수위 (%)</span>
                        <input
                          type="number"
                          step="1"
                          value={targetValues.waterLevel.max}
                          onChange={(e) => setTargetValues(prev => ({
                            ...prev,
                            waterLevel: { ...prev.waterLevel, max: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 text-gray-800"
                        />
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <div className="text-sm text-cyan-700">
                        <strong>현재 설정:</strong> {targetValues.waterLevel.min}% ~ {targetValues.waterLevel.max}%
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowSensorTargetModal(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      // TODO: 목표값 저장 로직
                      setShowSensorTargetModal(null);
                      alert('목표값이 저장되었습니다.');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}