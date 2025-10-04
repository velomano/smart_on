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
  location?: string;
  is_dashboard_visible: boolean;
  created_at: string;
  updated_at: string;
  beds?: Bed[];
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

interface FarmMembership {
  id: string;
  user_id: string;
  farm_id: string;
  role: 'team_leader' | 'team_member';
  created_at: string;
}

export default function FarmManagementPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [newFarmData, setNewFarmData] = useState({
    name: '',
    description: '',
    location: ''
  });
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          await fetchFarms(currentUser);
          
          // 농장장/팀원은 바로 상세 페이지로 리다이렉트
          if (currentUser.role !== 'system_admin') {
            const { data: memberships } = await supabase
              .from('farm_memberships')
              .select('farm_id')
              .eq('user_id', currentUser.id)
              .limit(1);
            
            if (memberships && memberships.length > 0) {
              router.push(`/farms/${memberships[0].farm_id}`);
              return;
            }
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router, supabase]);

  // 농장 목록 조회 (베드 정보 포함)
  const fetchFarms = async (currentUser: AuthUser) => {
    try {
      if (currentUser.role === 'system_admin') {
        // 시스템 관리자: 모든 농장 조회 (베드 정보 포함)
        const { data, error } = await supabase
          .from('farms')
          .select(`
            *,
            beds (*)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('농장 조회 오류:', error);
          return;
        }

        setFarms(data || []);
      } else {
        // 농장장/팀원: 자신의 농장만 조회 (베드 정보 포함)
        const { data: memberships, error: membershipError } = await supabase
          .from('farm_memberships')
          .select(`
            farm_id,
            farms (
              *,
              beds (*)
            )
          `)
          .eq('user_id', currentUser.id);

        if (membershipError) {
          console.error('멤버십 조회 오류:', membershipError);
          return;
        }

        const userFarms = memberships?.map(m => m.farms).filter(Boolean) || [];
        console.log('🔍 농장장/팀원 농장 데이터:', {
          memberships,
          userFarms,
          userFarmsLength: userFarms.length,
          firstFarm: userFarms[0],
          firstFarmBeds: userFarms[0]?.beds
        });
        setFarms(userFarms);
      }
    } catch (error) {
      console.error('농장 조회 실패:', error);
    }
  };

  // 새 농장 추가
  const handleAddFarm = async () => {
    try {
      if (!newFarmData.name.trim()) {
        alert('농장 이름을 입력해주세요.');
        return;
      }

      if (!user || user.role !== 'system_admin') {
        alert('농장 생성 권한이 없습니다.');
        return;
      }

      // 첫 번째 테넌트 조회
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .limit(1)
        .single();

      if (tenantError || !tenantData) {
        alert('테넌트를 찾을 수 없습니다.');
        return;
      }

      const { data, error } = await supabase
        .from('farms')
        .insert([
          {
            name: newFarmData.name,
            description: newFarmData.description,
            location: newFarmData.location,
            tenant_id: tenantData.id,
            is_dashboard_visible: true // 기본값: 노출
          }
        ])
        .select();

      if (error) {
        console.error('농장 생성 오류:', error);
        alert('농장 생성에 실패했습니다.');
        return;
      }

      // 성공 시 목록 새로고침
      await fetchFarms(user);
      setShowAddFarmModal(false);
      setNewFarmData({ name: '', description: '', location: '' });
      alert('농장이 성공적으로 생성되었습니다.');
    } catch (error) {
      console.error('농장 생성 실패:', error);
      alert('농장 생성에 실패했습니다.');
    }
  };

  // 대시보드 노출 토글
  const toggleDashboardVisibility = async (farmId: string, currentVisibility: boolean) => {
    try {
      if (!user || (user.role !== 'system_admin' && user.role !== 'team_leader')) {
        alert('권한이 없습니다.');
        return;
      }

      const { error } = await supabase
        .from('farms')
        .update({ is_dashboard_visible: !currentVisibility })
        .eq('id', farmId);

      if (error) {
        console.error('노출 설정 변경 오류:', error);
        alert('설정 변경에 실패했습니다.');
        return;
      }

      // 목록 새로고침
      await fetchFarms(user);
    } catch (error) {
      console.error('노출 설정 변경 실패:', error);
      alert('설정 변경에 실패했습니다.');
    }
  };

  // 농장 삭제
  const handleDeleteFarm = async (farmId: string, farmName: string) => {
    if (!confirm(`"${farmName}" 농장을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      if (!user || user.role !== 'system_admin') {
        alert('농장 삭제 권한이 없습니다.');
        return;
      }

      // 관련 데이터 삭제 (베드, 멤버십 등)
      await supabase.from('farm_memberships').delete().eq('farm_id', farmId);
      await supabase.from('beds').delete().eq('farm_id', farmId);

      // 농장 삭제
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farmId);

      if (error) {
        console.error('농장 삭제 오류:', error);
        alert('농장 삭제에 실패했습니다.');
        return;
      }

      // 목록 새로고침
      await fetchFarms(user);
      alert('농장이 삭제되었습니다.');
    } catch (error) {
      console.error('농장 삭제 실패:', error);
      alert('농장 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AppHeader 
        user={user} 
        title="농장 관리"
        subtitle="농장 생성, 관리 및 베드 현황 모니터링"
      />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 lg:py-8">
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-2 sm:mb-4 lg:mb-8">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 px-2 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-white/20 rounded-xl flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
                  <span className="text-lg sm:text-2xl lg:text-3xl">🏭</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">농장 관리 시스템</h1>
                  <p className="text-white/90 text-sm sm:text-base lg:text-lg">농장 생성, 관리 및 베드 현황 모니터링</p>
                </div>
              </div>
              
              {/* 새 농장 추가 버튼 */}
              {user.role === 'system_admin' && (
                <button
                  onClick={() => setShowAddFarmModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span className="hidden sm:inline">새 농장 추가</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="p-4 sm:p-6 lg:p-8">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">농장 현황</h2>
                <p className="text-gray-600 mt-1">등록된 농장 목록 및 관리</p>
              </div>
            </div>

        {/* 탭 네비게이션 (시스템 관리자만) */}
        {user.role === 'system_admin' && farms.length > 0 && (
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedFarmId(null)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedFarmId === null
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                전체농장 보기
              </button>
              {farms.map((farm) => (
                <button
                  key={farm.id}
                  onClick={() => {
                    setSelectedFarmId(farm.id);
                    // 탭 클릭 시 해당 농장 상세 화면으로 바로 이동
                    router.push(`/farms/${farm.id}`);
                  }}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    selectedFarmId === farm.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {farm.name}
                </button>
              ))}
            </div>
          </div>
        )}

            {/* 농장장/팀원: 바로 상세 페이지로 리다이렉트 */}
            {user.role !== 'system_admin' && farms.length > 0 && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">농장 관리 페이지로 이동 중...</p>
              </div>
            )}

        {/* 시스템 관리자: 전체농장 보기 (카드 형태) */}
        {user.role === 'system_admin' && selectedFarmId === null && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm) => (
              <div key={farm.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{farm.name}</h3>
                    {farm.description && (
                      <p className="text-gray-600 mt-1">{farm.description}</p>
                    )}
                    {farm.location && (
                      <p className="text-sm text-gray-500 mt-1">📍 {farm.location}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteFarm(farm.id, farm.name)}
                    className="text-red-500 hover:text-red-700 text-lg"
                    title="농장 삭제"
                  >
                    🗑️
                  </button>
                </div>

                {/* 베드 정보 요약 */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">베드 현황</h4>
                  <div className="space-y-2">
                    {farm.beds && farm.beds.length > 0 ? (
                      farm.beds.slice(0, 3).map((bed) => (
                        <div key={bed.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                          <span className="text-sm text-gray-700">{bed.name}</span>
                          {bed.crop && (
                            <span className="text-xs text-gray-500">🌱 {bed.crop}</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">베드가 없습니다.</p>
                    )}
                    {farm.beds && farm.beds.length > 3 && (
                      <p className="text-xs text-gray-500">+{farm.beds.length - 3}개 더</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* 대시보드 노출 토글 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">대시보드 노출</span>
                    <button
                      onClick={() => toggleDashboardVisibility(farm.id, farm.is_dashboard_visible)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        farm.is_dashboard_visible ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          farm.is_dashboard_visible ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 농장 상세 보기 버튼 */}
                  <button
                    onClick={() => router.push(`/farms/${farm.id}`)}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200"
                  >
                    농장 상세 보기
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>생성일: {new Date(farm.created_at).toLocaleDateString()}</span>
                    <span className={farm.is_dashboard_visible ? 'text-green-600' : 'text-gray-400'}>
                      {farm.is_dashboard_visible ? '노출됨' : '숨김'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

            {/* 농장이 없는 경우 */}
            {farms.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏭</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">농장이 없습니다</h3>
                <p className="text-gray-600 mb-6">
                  {user.role === 'system_admin' 
                    ? '새 농장을 생성하여 시작하세요.' 
                    : '시스템 관리자에게 농장 배정을 요청하세요.'}
                </p>
                {user.role === 'system_admin' && (
                  <button
                    onClick={() => setShowAddFarmModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                  >
                    첫 번째 농장 생성
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 새 농장 추가 모달 */}
      {showAddFarmModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddFarmModal(false)} />
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  농장 이름 *
                </label>
                <input
                  type="text"
                  value={newFarmData.name}
                  onChange={(e) => setNewFarmData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 1농장, 2농장"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  농장 설명
                </label>
                <textarea
                  value={newFarmData.description}
                  onChange={(e) => setNewFarmData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="농장에 대한 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  농장 위치
                </label>
                <input
                  type="text"
                  value={newFarmData.location}
                  onChange={(e) => setNewFarmData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 서울시 강남구"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowAddFarmModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddFarm}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
