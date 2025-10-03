'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BedTierShelfVisualization from '@/components/BedTierShelfVisualization';
import ActuatorControlModal from '@/components/ActuatorControlModal';

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
}


export default function FarmAutoDashboard({ farmId }: { farmId: string }) {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [devices, setDevices] = useState<DeviceUIModel[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 액추에이터 제어 관련 상태
  const [showActuatorModal, setShowActuatorModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<{id: string, name: string} | null>(null);
  
  // 베드 관련 상태
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [newBedData, setNewBedData] = useState<NewBedData>({
    name: '',
    bedSystemType: 'multi-tier'
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
          total_tiers: 3
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

      setNewBedData({ name: '', bedSystemType: 'multi-tier' });
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {beds.map((bed) => (
                  <div key={bed.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    {/* 베드 헤더 */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 text-lg">{bed.meta?.location || bed.name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${bed.status?.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-500">{bed.status?.online ? '온라인' : '오프라인'}</span>
                      </div>
                    </div>

                    {/* 베드 정보 */}
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <p><span className="font-medium">시스템:</span> {bed.meta?.bed_system_type || 'N/A'}</p>
                      <p><span className="font-medium">층수:</span> {bed.meta?.total_tiers || 'N/A'}</p>
                    </div>

                    {/* 베드 시각화와 센서 데이터를 반응형으로 배치 */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* 베드 시각화 */}
                      <div className="flex-shrink-0">
                        <BedTierShelfVisualization
                          activeTiers={bed.meta?.total_tiers || 1}
                          tierStatuses={[1, 2, 3].map(tierNumber => ({
                            tierNumber,
                            hasPlants: false, // 실제 작물 데이터가 있다면 여기에 연결
                            cropName: undefined,
                            growingMethod: undefined,
                            plantType: undefined,
                            startDate: undefined,
                            harvestDate: undefined,
                            stageBoundaries: undefined
                          }))}
                          waterLevelStatus="normal"
                          onTierClick={(tierNumber) => {
                            setSelectedBed({ id: bed.id, name: bed.name });
                            setShowActuatorModal(true);
                          }}
                          compact={true}
                        />
                      </div>

                      {/* 센서 데이터 영역 - 다이나믹 UI에서 로드 예정 */}
                      <div className="flex-1 min-w-0">
                        <h6 className="text-base font-bold text-gray-600 mb-3 flex items-center">
                          <span className="text-lg mr-2">📊</span>
                          센서 데이터
                        </h6>
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">🔄</div>
                          <p>센서 데이터는 다이나믹 UI 시스템에서 로드됩니다</p>
                          <p className="text-sm mt-1">연결된 센서가 있으면 자동으로 표시됩니다</p>
                        </div>
                      </div>
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
        {showActuatorModal && selectedBed && (
          <ActuatorControlModal
            isOpen={showActuatorModal}
            onClose={() => {
              setShowActuatorModal(false);
              setSelectedBed(null);
            }}
            actuatorName={selectedBed.name}
            deviceId={selectedBed.id}
            currentStatus={false}
            onStatusChange={(deviceId, status) => {
              console.log('액추에이터 상태 변경:', deviceId, status);
              // 실제 제어 로직은 여기에 구현
            }}
          />
        )}
      </div>
    </div>
  );
}