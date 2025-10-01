'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppHeader from '../../src/components/AppHeader';
import {
  getCurrentUser,
  getApprovedUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  updateUser,
  getTeams,
  type AuthUser,
} from '../../src/lib/auth';
import { getFarms, getSupabaseClient, type Farm } from '../../src/lib/supabase';

// 안전 배열 유틸
const asArray = <T,>(v: T[] | null | undefined) => (Array.isArray(v) ? v : []);

type Role = 'super_admin' | 'system_admin' | 'team_leader' | 'team_member';
type ApprovedUserRow = AuthUser;
type TabType = 'pending' | 'approved' | 'farms';

export default function AdminPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [pendingUsers, setPendingUsers] = useState<AuthUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUserRow[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmMemberships, setFarmMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  // 편집 상태
  const [editingUserInfo, setEditingUserInfo] = useState<AuthUser | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<Role>('team_member');
  const [editingLoading, setEditingLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  // 검색
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredApprovedUsers, setFilteredApprovedUsers] = useState<AuthUser[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // 승인 모달
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingUser, setApprovingUser] = useState<AuthUser | null>(null);
  const [approveFormData, setApproveFormData] = useState<{ role: string; team_id: string }>({
    role: 'team_member',
    team_id: '',
  });
  const [approveLoading, setApproveLoading] = useState(false);

  // ----- 데이터 로드 -----
  const loadData = async (user: AuthUser) => {
    try {
      const canView =
        user.role === 'super_admin' || user.role === 'system_admin' || user.email === 'sky3rain7@gmail.com';

      if (!canView) {
        setPendingUsers([]);
        setApprovedUsers([]);
        setLoading(false);
        return;
      }

      const supabase = getSupabaseClient();
      const [pendingResult, approvedResult, teamsResult, farmsResult, farmMembershipsResult] = await Promise.all([
        getPendingUsers(),
        getApprovedUsers(),
        getTeams(),
        getFarms(),
        (supabase as any).from('farm_memberships').select('*'),
      ]);

      // 농장장(팀)인 경우 자신의 팀원만 필터링
      let filteredPendingUsers = asArray(pendingResult);
      let filteredApprovedUsers = asArray(approvedResult);
      
      if (user.role === 'team_leader' && user.team_id) {
        filteredPendingUsers = filteredPendingUsers.filter(u => u.team_id === user.team_id);
        filteredApprovedUsers = filteredApprovedUsers.filter(u => u.team_id === user.team_id);
        console.log('🔍 농장장 필터링 적용:', {
          userRole: user.role,
          userTeamId: user.team_id,
          originalPending: asArray(pendingResult).length,
          filteredPending: filteredPendingUsers.length,
          originalApproved: asArray(approvedResult).length,
          filteredApproved: filteredApprovedUsers.length
        });
      }
      
      setPendingUsers(
        filteredPendingUsers.map((u) => ({ ...u, role: (u.role as Role) ?? 'team_member' }))
      );
      setApprovedUsers(
        filteredApprovedUsers.map((u) => ({ ...u, role: (u.role as Role) ?? 'team_member' }))
      );
      setTeams(teamsResult.success ? teamsResult.teams : []);
      setFarms(asArray(farmsResult));
      setFarmMemberships(asArray(farmMembershipsResult?.data));
    } catch (e) {
      console.error('admin loadData error:', e);
      setPendingUsers([]);
      setApprovedUsers([]);
      setTeams([]);
      setFarms([]);
      setFarmMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  // 인증 + 초기 데이터
  useEffect(() => {
    let alive = true;

    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!alive) return;

      if (!user) {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return;
      }

      setAuthUser(user);
      await loadData(user);
    };

    checkAuth();
    return () => {
      alive = false;
    };
  }, []);

  // 검색 필터
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredApprovedUsers(approvedUsers);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredApprovedUsers(
        approvedUsers.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role?.toLowerCase().includes(q) ||
            u.team_name?.toLowerCase().includes(q) ||
            u.company?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchTerm, approvedUsers]);

  // ----- 승인/거부/편집 -----
  const handleApproveUser = (user: AuthUser) => {
    setApprovingUser(user);
    setApproveFormData({ role: 'team_member', team_id: '' });
    setIsApproveModalOpen(true);
  };

  const handleCloseApproveModal = () => {
    setIsApproveModalOpen(false);
    setApprovingUser(null);
    setApproveFormData({ role: 'team_member', team_id: '' });
  };

  const handleConfirmApprove = async () => {
    if (!approvingUser || !authUser) return;

    setApproveLoading(true);
    try {
      const approveResult = await approveUser(approvingUser.id);
      if (!approveResult.success) {
        alert('승인 처리에 실패했습니다.');
        return;
      }

      const updateResult = await updateUser(approvingUser.id, {
        role: approveFormData.role as Role,
        team_id: approveFormData.team_id || null,
      });

      if (!updateResult.success) {
        alert('승인은 되었지만 농장 배정에 실패했습니다.');
        return;
      }

      alert('사용자가 승인되었고 농장에 배정되었습니다.');
      await loadData(authUser);
      handleCloseApproveModal();
    } catch (e) {
      console.error('handleConfirmApprove error:', e);
      alert('오류가 발생했습니다.');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!confirm('정말로 이 사용자를 거부하시겠습니까?')) return;
    try {
      const result = await rejectUser(userId);
      if (!result.success) {
        alert('거부 처리에 실패했습니다.');
        return;
      }
      alert('사용자가 거부되었습니다.');
      if (authUser) await loadData(authUser);
    } catch (e) {
      console.error('reject error:', e);
      alert('오류가 발생했습니다.');
    }
  };

  const handleEditUser = (u: AuthUser) => {
    setEditingUserInfo(u);
    const m = farmMemberships.find((fm) => fm.user_id === u.id);
    const currentFarmId = m?.farm_id ?? '';
    const currentRole: Role =
      m?.role === 'owner' ? 'team_leader' : m?.role === 'operator' ? 'team_member' : (u.role as Role) || 'team_member';

    setSelectedFarmId(currentFarmId);
    setSelectedRole(currentRole);
  };

  const handleDeleteUser = async () => {
    if (!editingUserInfo) return;

    setDeletingUser(true);
    try {
      const supabase = getSupabaseClient();

      await (supabase as any).from('farm_memberships').delete().eq('user_id', editingUserInfo.id);

      const { error: updateError } = await (supabase as any)
        .from('users')
        .update({ is_active: false })
        .eq('id', editingUserInfo.id);

      if (updateError) {
        console.error(updateError);
        alert(`사용자 삭제 실패: ${updateError.message}`);
        return;
      }

      alert('사용자가 성공적으로 삭제되었습니다.');
      if (authUser) await loadData(authUser);

      setEditingUserInfo(null);
      setSelectedFarmId('');
      setSelectedRole('team_member');
      setShowDeleteConfirm(false);
    } catch (e) {
      console.error('사용자 삭제 오류:', e);
      alert('사용자 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleUpdateUserInfo = async () => {
    if (!editingUserInfo) {
      alert('사용자 정보를 확인할 수 없습니다.');
      return;
    }

    setEditingLoading(true);
    try {
      // 1) farm_memberships 처리
      const supabase = getSupabaseClient();

      if (selectedFarmId) {
        const tenantId = '00000000-0000-0000-0000-000000000001';
        await (supabase as any).from('farm_memberships').delete().eq('user_id', editingUserInfo.id);

        const farmRole = selectedRole === 'system_admin' || selectedRole === 'team_leader' ? 'owner' : 'operator';
        const { error: fmError } = await (supabase as any)
          .from('farm_memberships')
          .insert([{ tenant_id: tenantId, user_id: editingUserInfo.id, farm_id: selectedFarmId, role: farmRole }]);

        if (fmError) {
          console.error('farm_memberships 업데이트 오류:', fmError);
          alert(`농장 배정 실패: ${fmError.message}`);
          return;
        }
      } else {
        await (supabase as any).from('farm_memberships').delete().eq('user_id', editingUserInfo.id);
      }

      // 2) users 테이블의 모든 정보 업데이트
      const result = await updateUser(editingUserInfo.id, {
        name: editingUserInfo.name,
        email: editingUserInfo.email,
        role: selectedRole,
        company: editingUserInfo.company,
        phone: editingUserInfo.phone,
        is_active: editingUserInfo.is_active
      });
      if (!result.success) {
        alert(`사용자 정보 수정 실패: ${result.error}`);
        return;
      }

      alert('사용자 정보가 성공적으로 수정되었습니다.');
      if (authUser) await loadData(authUser);

      setEditingUserInfo(null);
      setSelectedFarmId('');
      setSelectedRole('team_member');
      setLoading(true);
      setTimeout(() => setLoading(false), 100);
    } catch (e) {
      console.error('사용자 정보 수정 오류:', e);
      alert('사용자 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setEditingLoading(false);
    }
  };

  // ----- 그룹/목록 계산 -----
  const usersByFarm = useMemo(() => {
    const farmGroups: { [name: string]: { farm: Farm; users: AuthUser[] } } = {};
    farms.forEach((f) => {
      farmGroups[f.name] = { farm: f, users: [] };
    });

    farmMemberships.forEach((m) => {
      const farm = farms.find((f) => f.id === m.farm_id);
      const user = approvedUsers.find((u) => u.id === m.user_id);
      if (!farm || !user) return;

      const enriched = { ...user, farm_role: m.role, farm_id: m.farm_id } as AuthUser & {
        farm_role?: string;
        farm_id?: string;
      };
      farmGroups[farm.name] ??= { farm, users: [] };
      farmGroups[farm.name].users.push(enriched);
    });

    // 중복 제거 + 정렬
    Object.keys(farmGroups).forEach((name) => {
      const uniq: AuthUser[] = [];
      const seen = new Set<string>();
      farmGroups[name].users.forEach((u) => {
        if (!seen.has(u.id)) {
          seen.add(u.id);
          uniq.push(u);
        }
      });
      uniq.sort((a, b) => {
        const order: Record<Role, number> = { system_admin: 0, team_leader: 1, team_member: 2, super_admin: -1 };
        const ao = order[(a.role as Role) ?? 'team_member'] ?? 3;
        const bo = order[(b.role as Role) ?? 'team_member'] ?? 3;
        if (ao !== bo) return ao - bo;
        return (a.name || '').localeCompare(b.name || '');
      });
      farmGroups[name].users = uniq;
    });

    return farmGroups;
  }, [farms, farmMemberships, approvedUsers]);

  const unassignedUsers = useMemo(() => {
    const assigned = new Set<string>(farmMemberships.map((m) => m.user_id));
    return approvedUsers.filter((u) => !assigned.has(u.id) && u.role !== 'system_admin');
  }, [farmMemberships, approvedUsers]);

  // ----- UI -----
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {authUser && (
        <AppHeader 
          user={authUser} 
          title="사용자 관리" 
          subtitle="사용자 승인 및 권한 관리" 
          isDashboard={false} 
        />
      )}

      <main className="max-w-7xl mx-auto pt-2 pb-4 sm:pt-4 sm:pb-8 px-2 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-4 sm:mb-8">

          <div className="flex justify-center mb-4 sm:mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1 sm:p-2 shadow-lg border border-white/20">
              <div className="flex space-x-1 sm:space-x-2">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-1 sm:px-4 lg:px-6 py-1.5 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-base ${
                    activeTab === 'pending'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ⏳ 승인 대기 ({pendingUsers.length})
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`px-1 sm:px-4 lg:px-6 py-1.5 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-base ${
                    activeTab === 'approved'
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ✅ 승인된 사용자 ({approvedUsers.length})
                </button>
                <button
                  onClick={() => setActiveTab('farms')}
                  className={`px-1 sm:px-4 lg:px-6 py-1.5 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-base ${
                    activeTab === 'farms'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🏢 농장별 보기
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-300 overflow-hidden mb-8">
            <div className="px-8 py-16 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">로딩 중...</p>
            </div>
          </div>
        ) : !authUser ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-300 overflow-hidden mb-8">
            <div className="px-8 py-16 text-center">
              <h3 className="text-xl font-bold text-gray-600 mb-2">로그인 필요</h3>
              <p className="text-gray-600">사용자 관리 페이지에 접근하려면 로그인이 필요합니다.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-8">
            <div
              className={`px-4 py-4 sm:px-8 sm:py-6 ${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                  : activeTab === 'approved'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-2xl sm:text-3xl">{activeTab === 'pending' ? '⏳' : activeTab === 'approved' ? '✅' : '🏢'}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                      {activeTab === 'pending'
                        ? '승인 대기 사용자 목록'
                        : activeTab === 'approved'
                        ? '승인된 사용자 목록'
                        : '농장별 사용자 보기'}
                    </h1>
                    <div className="text-white/90 text-sm sm:text-base font-semibold">
                      총 {activeTab === 'pending' ? pendingUsers.length : activeTab === 'approved' ? approvedUsers.length : usersByFarm().reduce((total, farm) => total + farm.users.length, 0)}명
                    </div>
                  </div>
                  <p className="text-white/90 text-xs sm:text-sm lg:text-base hidden sm:block">
                    {activeTab === 'pending'
                      ? '승인을 기다리는 사용자들을 검토하고 승인 또는 거부할 수 있습니다'
                      : activeTab === 'approved'
                      ? '시스템에 등록된 모든 승인된 사용자를 관리합니다'
                      : '농장별로 분류된 사용자 목록을 확인합니다'}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-8">
              {/* 대기 */}
              {activeTab === 'pending' && (
                <div>

                  <div className="space-y-2 sm:space-y-3 lg:space-y-6">
                    {pendingUsers.map((u) => (
                      <div
                        key={u.id}
                        className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl sm:rounded-2xl p-3 sm:p-3 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                            <div className="w-10 h-10 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                              <span className="text-lg sm:text-xl lg:text-2xl">⏳</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base sm:text-xl font-bold text-gray-600 truncate">{u.name || '이름 없음'}</h4>
                              <p className="text-gray-600 font-medium text-sm sm:text-base truncate">{u.email}</p>
                              <div className="flex items-center space-x-2 sm:space-x-3 mt-1 sm:mt-2 flex-wrap">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  승인 대기
                                </span>
                                {u.company && <span className="text-xs text-gray-500">🏢 {u.company}</span>}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">가입일: {new Date(u.created_at).toLocaleDateString('ko-KR')}</div>
                            </div>
                          </div>
                          <div className="flex space-x-2 sm:space-x-3 flex-shrink-0">
                            <button
                              onClick={() => handleRejectUser(u.id)}
                              className="bg-red-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-600 transition-colors"
                            >
                              거부
                            </button>
                            <button
                              onClick={() => handleApproveUser(u)}
                              className="bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-green-600 transition-colors"
                            >
                              승인
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {pendingUsers.length === 0 && (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <span className="text-4xl">⏳</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-600 mb-2">승인 대기 사용자가 없습니다</h3>
                        <p className="text-gray-600">현재 승인을 기다리는 사용자가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 승인됨 */}
              {activeTab === 'approved' && (
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-6">
                    <div className="text-xs sm:text-sm text-gray-500">
                      검색결과: {filteredApprovedUsers.length}명
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="relative max-w-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="이름, 이메일, 역할, 팀명, 소속으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3 lg:space-y-6">
                    {filteredApprovedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-2 sm:p-3 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-5 flex-1">
                            <div
                              className={`w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                                u.role === 'system_admin'
                                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                  : u.role === 'team_leader'
                                  ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                                  : 'bg-gradient-to-br from-green-400 to-emerald-500'
                              }`}
                            >
                              <span className="text-lg sm:text-2xl lg:text-3xl">{u.role === 'system_admin' ? '👑' : u.role === 'team_leader' ? '👨‍💼' : '👤'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 lg:space-x-3 mb-2 sm:mb-3 lg:mb-4">
                                <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600 whitespace-nowrap">{u.name || '이름 없음'}</h4>
                                <div
                                  className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold ${
                                    u.is_active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                                  }`}
                                >
                                  {u.is_active ? '활성' : '비활성'}
                                </div>
                                <p className="text-gray-600 font-medium text-sm sm:text-base lg:text-lg truncate">{u.email}</p>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                                {u.phone && (
                                  <span className="flex items-center text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                                    <span className="mr-1 sm:mr-1.5">📞</span>
                                    {u.phone}
                                  </span>
                                )}
                                <span className="flex items-center text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                                  <span className="mr-1 sm:mr-1.5">📅</span>가입: {new Date(u.created_at).toLocaleDateString('ko-KR')}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                {u.company && (
                                  <span className="inline-flex items-center px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
                                    🏢 {u.company}
                                  </span>
                                )}
                                {u.team_name && (
                                  <span className="inline-flex items-center px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                                    🏡 {u.team_name}
                                  </span>
                                )}
                                <span
                                  className={`inline-flex items-center px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm ${
                                    u.role === 'system_admin'
                                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                      : u.role === 'team_leader'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  {u.role === 'system_admin' ? '👑 시스템관리자' : u.role === 'team_leader' ? '👨‍💼 농장장' : '👤 팀원'}
                                </span>
                                {(u as any).updated_at && (
                                  <span className="flex items-center text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                                    <span className="mr-1 sm:mr-1.5">🕒</span>최근 접속:{' '}
                                    {new Date((u as any).updated_at).toLocaleDateString('ko-KR')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end lg:justify-start lg:ml-4">
                            <button
                              onClick={() => handleEditUser(u)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-xl text-xs sm:text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
                            >
                              ✏️ 편집
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredApprovedUsers.length === 0 && (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <span className="text-4xl">👥</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-600 mb-2">승인된 사용자가 없습니다</h3>
                        <p className="text-gray-600">아직 승인된 사용자가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 농장별 */}
              {activeTab === 'farms' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-sm text-gray-500">{Object.keys(usersByFarm()).length}개 농장</div>
                  </div>

                  <div className="space-y-8">
                    {Object.entries(usersByFarm()).map(([farmName, farmData]) => (
                      <div key={farmName} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center mb-6">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg mr-4">
                            <span className="text-2xl">🏢</span>
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-gray-600">{farmName}</h4>
                            <p className="text-gray-600">{farmData.users.length}명의 사용자</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {farmData.users.map((user) => (
                            <div key={user.id} className="bg-white/80 backdrop-blur-sm border rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                  <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
                                      user.role === 'system_admin'
                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                        : user.role === 'team_leader'
                                        ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                                        : 'bg-gradient-to-br from-green-400 to-emerald-500'
                                    }`}
                                  >
                                    <span className="text-lg">
                                      {user.role === 'system_admin' ? '👑' : user.role === 'team_leader' ? '👨‍💼' : '👤'}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-semibold text-gray-600 truncate">{user.name || '이름 없음'}</h5>
                                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          user.role === 'system_admin'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : user.role === 'team_leader'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                      >
                                        {user.role === 'system_admin' ? '관리자' : user.role === 'team_leader' ? '농장장' : '팀원'}
                                      </span>
                                      <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ml-2"
                                >
                                  ✏️ 편집
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {Object.keys(usersByFarm).length === 0 && (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <span className="text-4xl">🏢</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-600 mb-2">농장 정보가 없습니다</h3>
                        <p className="text-gray-600">아직 농장별로 정리된 사용자 정보가 없습니다.</p>
                      </div>
                    )}

                    {unassignedUsers.length > 0 && (
                      <div className="mt-12">
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 shadow-xl">
                          <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg mr-4">
                              <span className="text-2xl">👥</span>
                            </div>
                            <div>
                              <h4 className="text-2xl font-bold text-gray-600">미배정 사용자</h4>
                              <p className="text-gray-600">{unassignedUsers.length}명의 사용자가 농장에 배정되지 않았습니다</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unassignedUsers.map((user) => (
                              <div key={user.id} className="bg-white/80 backdrop-blur-sm border rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-lg">👤</span>
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="font-bold text-gray-600">{user.name || '이름 없음'}</h5>
                                        <p className="text-sm text-gray-600">{user.email}</p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                      <span
                                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
                                          user.role === 'system_admin'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : user.role === 'team_leader'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                      >
                                        {user.role === 'system_admin' ? '👑 시스템관리자' : user.role === 'team_leader' ? '👨‍💼 농장장' : '👤 팀원'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingUserInfo(user);
                                      setSelectedFarmId('');
                                      setSelectedRole((user.role as Role) || 'team_member');
                                    }}
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                                  >
                                    ✏️ 정보 수정
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 승인 모달 */}
        {isApproveModalOpen && approvingUser && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">사용자 승인</h2>
                    <p className="text-white/90">사용자를 승인하고 농장에 배정합니다</p>
                  </div>
                  <button onClick={handleCloseApproveModal} className="text-white/80 hover:text-white text-2xl">
                    ×
                  </button>
                </div>
              </div>

              <div className="px-8 py-8">
                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-600">{approvingUser.name || '이름 없음'}</h3>
                      <p className="text-gray-600">{approvingUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">역할 *</label>
                    <select
                      value={approveFormData.role}
                      onChange={(e) => setApproveFormData((prev) => ({ ...prev, role: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 bg-white"
                    >
                      <option value="team_member">팀원</option>
                      <option value="team_leader">농장장</option>
                      <option value="system_admin">시스템 관리자</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">농장 배정 *</label>
                    <select
                      value={approveFormData.team_id}
                      onChange={(e) => setApproveFormData((prev) => ({ ...prev, team_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 bg-white"
                    >
                      <option value="">농장을 선택하세요</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    onClick={handleCloseApproveModal}
                    className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={approveLoading}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirmApprove}
                    disabled={approveLoading || !approveFormData.team_id}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approveLoading ? '승인 중...' : '승인하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 사용자 정보 수정 모달 */}
        {editingUserInfo && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">사용자 정보 편집</h2>
                    <p className="text-white/90">사용자의 정보를 수정할 수 있습니다</p>

                    <div className="mt-2 p-2 bg-white/20 rounded text-xs">
                      <div>사용자: {editingUserInfo.email}</div>
                      <div>선택된 농장: {selectedFarmId || '(미배정)'}</div>
                      <div>선택된 역할: {selectedRole}</div>
                      <div>현재 역할: {editingUserInfo.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingUserInfo(null);
                      setSelectedFarmId('');
                      setSelectedRole('team_member');
                    }}
                    className="text-white/80 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 이름 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      value={editingUserInfo?.name || ''}
                      onChange={(e) => setEditingUserInfo(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 bg-white"
                      placeholder="사용자 이름"
                    />
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      value={editingUserInfo?.email || ''}
                      onChange={(e) => setEditingUserInfo(prev => prev ? { ...prev, email: e.target.value } : null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 bg-white"
                      placeholder="user@example.com"
                    />
                  </div>

                  {/* 역할 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      역할 *
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 bg-white"
                    >
                      <option value="team_member">팀원</option>
                      <option value="team_leader">팀장</option>
                      <option value="system_admin">시스템 관리자</option>
                    </select>
                  </div>

                  {/* 소속 농장 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      소속 농장
                    </label>
                    <select
                      value={selectedFarmId}
                      onChange={(e) => setSelectedFarmId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 bg-white"
                    >
                      <option value="">농장을 선택하세요 (미배정)</option>
                      {farms.map((farm) => (
                        <option key={farm.id} value={farm.id}>
                          {farm.name} {farm.location && `(${farm.location})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 회사 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      회사
                    </label>
                    <input
                      type="text"
                      value={editingUserInfo?.company || ''}
                      onChange={(e) => setEditingUserInfo(prev => prev ? { ...prev, company: e.target.value } : null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 bg-white"
                      placeholder="회사명"
                    />
                  </div>

                  {/* 전화번호 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={editingUserInfo?.phone || ''}
                      onChange={(e) => setEditingUserInfo(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 bg-white"
                      placeholder="010-1234-5678"
                    />
                  </div>

                  {/* 활성 상태 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-600 mb-4">
                      활성 상태
                    </label>
                    <div className="flex space-x-6">
                      <label className="flex items-center text-gray-600 font-semibold">
                        <input
                          type="radio"
                          name="is_active"
                          checked={editingUserInfo?.is_active === true}
                          onChange={() => setEditingUserInfo(prev => prev ? { ...prev, is_active: true } : null)}
                          className="mr-2"
                        />
                        활성
                      </label>
                      <label className="flex items-center text-gray-600 font-semibold">
                        <input
                          type="radio"
                          name="is_active"
                          checked={editingUserInfo?.is_active === false}
                          onChange={() => setEditingUserInfo(prev => prev ? { ...prev, is_active: false } : null)}
                          className="mr-2"
                        />
                        비활성
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={editingLoading || deletingUser}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🗑️ 계정 삭제
                  </button>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        setEditingUserInfo(null);
                        setSelectedFarmId('');
                        setSelectedRole('team_member');
                        setShowDeleteConfirm(false);
                      }}
                      className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleUpdateUserInfo}
                      disabled={editingLoading || deletingUser}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editingLoading ? '수정 중...' : '✏️ 정보 수정'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && editingUserInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">⚠️ 계정 삭제 확인</h2>
                    <p className="text-white/90">이 작업은 되돌릴 수 없습니다</p>
                  </div>
                  <button onClick={() => setShowDeleteConfirm(false)} className="text-white/80 hover:text-white text-2xl">
                    ×
                  </button>
                </div>
              </div>

              <div className="px-8 py-8">
                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-600">{editingUserInfo.name || '이름 없음'}</h3>
                      <p className="text-gray-600">{editingUserInfo.email}</p>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-semibold mb-2">삭제될 데이터:</p>
                    <ul className="text-red-700 text-sm space-y-1">
                      <li>• 사용자 계정 정보</li>
                      <li>• 농장 배정 정보</li>
                      <li>• 모든 권한 설정</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deletingUser}
                    className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={deletingUser}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingUser ? '삭제 중...' : '🗑️ 영구 삭제'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
