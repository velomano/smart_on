'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, getTeams, getApprovedUsers, getCurrentUser } from '../../lib/mockAuth';
import { Farm, Device, Sensor, SensorReading } from '../../lib/supabase';
import AppHeader from '../../components/AppHeader';

export default function BedsManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmTab, setSelectedFarmTab] = useState<string>('all');
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [showAddBedModal, setShowAddBedModal] = useState(false);
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
        setDevices(teamsResult.devices as Device[]);
        setSensors(teamsResult.sensors as Sensor[]);
        setSensorReadings(teamsResult.sensorReadings as SensorReading[]);
        
        // 농장장과 팀원인 경우 자기 농장 탭으로 자동 설정
        if (currentUser && (currentUser.role === 'team_leader' || currentUser.role === 'team_member') && currentUser.team_id) {
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
  }, [router]);

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

    const targetFarmId = selectedFarmTab !== 'all' ? selectedFarmTab : (farms[0]?.id || '1');
    const targetFarm = farms.find(f => f.id === targetFarmId);

    const newBed: Device = {
      id: `bed-${Date.now()}`,
      farm_id: targetFarmId,
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
              {/* 관리자가 아닌 경우에만 전체 농장 탭 표시 */}
              {(!user || user.role === 'system_admin') && (
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
                const farmsToShow = user && (user.role === 'team_leader' || user.role === 'team_member') && user.team_id
                  ? farms.filter(farm => farm.id === user.team_id)
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
              // 농장장과 팀원인 경우 자기 농장만, 관리자인 경우 모든 농장 표시
              const farmsToShow = user && (user.role === 'team_leader' || user.role === 'team_member') && user.team_id
                ? farms.filter(farm => farm.id === user.team_id)
                : farms;
              
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
                          <div key={device.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-l-green-400 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                                  <span className="text-sm">📡</span>
                                </div>
                                <div>
                                  <span className="font-bold text-gray-900 text-sm">
                                    {(device.meta?.location || '센서 게이트웨이').replace(/^농장\d+-/, '')}
                                  </span>
                                  <div className="text-xs text-gray-500">📊 센서 {deviceSensors.length}개</div>
                                </div>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-bold ${
                                  device.status?.online
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {device.status?.online ? '🟢' : '🔴'}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <span className="text-xs text-gray-500">
                                  작물: {(device.meta as any)?.crop_name || '미설정'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  방식: {(device.meta as any)?.growing_method || '미설정'}
                                </span>
                              </div>
                              {/* 관리자와 농장장만 편집 버튼 표시 */}
                              {user && user.role !== 'team_member' && (
                                <div className="flex items-center space-x-2">
                                  <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
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
                  {selectedFarmTab === farm.id && user && user.role !== 'team_member' && (
                    <div className="flex justify-center mt-6">
                      <button 
                        onClick={() => setShowAddBedModal(true)}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  베드 이름 *
                </label>
                <input
                  type="text"
                  value={newBedData.name}
                  onChange={(e) => setNewBedData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="예: 베드1, A구역"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  작물 이름 *
                </label>
                <input
                  type="text"
                  value={newBedData.cropName}
                  onChange={(e) => setNewBedData(prev => ({ ...prev, cropName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="예: 토마토, 상추, 딸기"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  재배 방식
                </label>
                <select
                  value={newBedData.growingMethod}
                  onChange={(e) => setNewBedData(prev => ({ ...prev, growingMethod: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="담액식">담액식</option>
                  <option value="NFT식">NFT식</option>
                  <option value="분무식">분무식</option>
                  <option value="점적식">점적식</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowAddBedModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
  );
}
