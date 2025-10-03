'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';

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
  type: string;
  status: any;
  meta: any;
  created_at: string;
}

interface NewBedData {
  name: string;
  bedSystemType: string;
  totalTiers: number;
}

export default function FarmAutoDashboard({ farmId }: { farmId: string }) {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [devices, setDevices] = useState<DeviceUIModel[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 베드 관련 상태
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [newBedData, setNewBedData] = useState<NewBedData>({
    name: '',
    bedSystemType: 'multi-tier',
    totalTiers: 3
  });
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchFarmData();
    fetchUserData();
  }, [farmId]);

  const fetchUserData = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  // 베드 추가 함수
  const handleAddBed = async () => {
    try {
      if (!newBedData.name.trim()) {
        alert('베드 이름을 입력해주세요.');
        return;
      }

      const bedData = {
        farm_id: farmId,
        name: newBedData.name.trim(),
        type: 'sensor_gateway',
        meta: {
          location: newBedData.name.trim(),
          bed_system_type: newBedData.bedSystemType,
          total_tiers: newBedData.totalTiers
        },
        status: {
          online: false,
          last_seen: null
        }
      };

      const { data, error } = await supabase
        .from('devices')
        .insert([bedData])
        .select();

      if (error) {
        console.error('베드 생성 오류:', error);
        alert(`베드 생성에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        return;
      }

      setNewBedData({ name: '', bedSystemType: 'multi-tier', totalTiers: 3 });
      setShowAddBedModal(false);
      await fetchFarmData(); // 데이터 다시 로드
      alert(`새 베드 "${newBedData.name.trim()}"가 추가되었습니다!`);
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
        .from('devices')
        .select('*')
        .eq('farm_id', farmId)
        .eq('type', 'sensor_gateway')
        .is('bed_id', null);

      if (bedsError) {
        console.error('베드 조회 오류:', bedsError);
        setBeds([]);
      } else {
        setBeds(bedsData || []);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {beds.map((bed) => (
                <div key={bed.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{bed.meta?.location || bed.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${bed.status?.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">시스템:</span> {bed.meta?.bed_system_type || 'N/A'}</p>
                    <p><span className="font-medium">층수:</span> {bed.meta?.total_tiers || 'N/A'}</p>
                    <p><span className="font-medium">상태:</span> {bed.status?.online ? '온라인' : '오프라인'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IoT 디바이스 섹션 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">IoT 디바이스</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchFarmData}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                🔄 새로고침
              </button>
              {user && user.role !== 'team_member' && (
                <button
                  onClick={() => router.push(`/iot-designer?farmId=${farmId}`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  + 새 디바이스 연결
                </button>
              )}
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">연결된 디바이스가 없습니다</h3>
              <p className="text-gray-600 mb-4">IoT 디바이스를 연결하여 농장을 모니터링하고 자동화하세요.</p>
              {user && user.role !== 'team_member' && (
                <button
                  onClick={() => router.push(`/iot-designer?farmId=${farmId}`)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  ⚡ IoT 디바이스 생성 및 연결
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {devices.map((device) => (
                <div key={device.deviceId} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{device.deviceName}</h3>
                  <div className="text-gray-500 text-center py-8">
                    디바이스 UI 템플릿이 없습니다.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
                {/* 베드 이름 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    베드 이름 *
                  </label>
                  <input
                    type="text"
                    value={newBedData.name}
                    onChange={(e) => setNewBedData({ ...newBedData, name: e.target.value })}
                    placeholder="예: A구역 1층, 토마토 베드 등"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    한글, 영문, 숫자, 공백, -, _ 만 사용 가능 (2-20자)
                  </p>
                </div>

                {/* 베드 시스템 타입 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    베드 시스템 타입
                  </label>
                  <select
                    value={newBedData.bedSystemType}
                    onChange={(e) => setNewBedData({ ...newBedData, bedSystemType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="multi-tier">다층 베드</option>
                    <option value="single-tier">단층 베드</option>
                    <option value="hydroponic">수경재배</option>
                    <option value="soil">토양재배</option>
                  </select>
                </div>

                {/* 총 층수 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    총 층수
                  </label>
                  <select
                    value={newBedData.totalTiers}
                    onChange={(e) => setNewBedData({ ...newBedData, totalTiers: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1층</option>
                    <option value={2}>2층</option>
                    <option value={3}>3층</option>
                    <option value={4}>4층</option>
                    <option value={5}>5층</option>
                  </select>
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
      </div>
    </div>
  );
}