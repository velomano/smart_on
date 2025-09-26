'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPendingUsers, getApprovedUsers, getTenants, getTeams, approveUser, rejectUser, updateUser, deleteUser, resetMockUsers, AuthUser } from '../../lib/mockAuth';
import AppHeader from '../../components/AppHeader';

interface PendingUser {
  id: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  preferred_team?: string;
  created_at: string;
}

interface ApprovedUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  team_id?: string;
  team_name?: string;
  company?: string;
  phone?: string;
  is_active?: boolean;
  created_at: string;
}

interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  created_at: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState<Record<string, string>>({});
  const [selectedTeam, setSelectedTeam] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'teams'>('pending');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    email: string;
    role: string;
    team_id: string;
    company: string;
    phone: string;
    is_active: boolean;
    editingField: string;
  }>({
    name: '',
    email: '',
    role: 'team_member',
    team_id: '',
    company: '',
    phone: '',
    is_active: true,
    editingField: 'role'
  });
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<{
    role: string;
    team_id: string;
    is_active: string;
  }>({
    role: 'team_member',
    team_id: '',
    is_active: 'true'
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.is_approved || (currentUser.role !== 'system_admin' && currentUser.role !== 'team_leader' && currentUser.email !== 'sky3rain7@gmail.com')) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      loadData();
    };
    checkAuth();
  }, [router]);

  const loadData = async () => {
    try {
      const [pendingResult, approvedResult, tenantsResult, teamsResult] = await Promise.all([
        getPendingUsers(),
        getApprovedUsers(),
        getTenants(),
        getTeams()
      ]);

      if (pendingResult.success) {
        setPendingUsers(pendingResult.users);
      }

      if (approvedResult.success) {
        console.log('로드된 승인된 사용자들:', approvedResult.users);
        setApprovedUsers(approvedResult.users);
      }

      if (tenantsResult.success) {
        setTenants(tenantsResult.tenants);
      }

      if (teamsResult.success) {
        setTeams(teamsResult.teams);
      }
      } catch {
        console.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // 농장 통계 계산
  const getTeamStats = () => {
    console.log('농장 통계 계산 - approvedUsers:', approvedUsers);
    console.log('농장 통계 계산 - teams:', teams);
    console.log('현재 로그인된 사용자:', user);
    
    // 농장장이 로그인한 경우 자기 농장만 필터링
    let filteredTeams = teams;
    let filteredUsers = approvedUsers;
    
    if (user && user.role === 'team_leader' && user.team_id) {
      filteredTeams = teams.filter(team => team.id === user.team_id);
      filteredUsers = approvedUsers.filter(user => user.team_id === user.team_id);
      console.log('농장장 필터링 적용 - 농장:', filteredTeams, '사용자:', filteredUsers);
    }
    
    const teamStats = filteredTeams.map(team => {
      const teamMembers = filteredUsers.filter(user => user.team_id === team.id);
      console.log(`${team.name} (${team.id}) 멤버들:`, teamMembers);
      
      const leaders = teamMembers.filter(user => user.role === 'team_leader');
      const members = teamMembers.filter(user => user.role === 'team_member');
      const activeMembers = teamMembers.filter(user => user.is_active !== false);
      const inactiveMembers = teamMembers.filter(user => user.is_active === false);

      return {
        ...team,
        totalMembers: teamMembers.length,
        leaders: leaders.length,
        members: members.length,
        activeMembers: activeMembers.length,
        inactiveMembers: inactiveMembers.length,
        teamMembers: teamMembers
      };
    });

    const totalUsers = filteredUsers.length;
    const totalTeams = filteredTeams.length;
    const totalLeaders = filteredUsers.filter(user => user.role === 'team_leader').length;
    const totalMembers = filteredUsers.filter(user => user.role === 'team_member').length;
    const unassignedUsers = filteredUsers.filter(user => !user.team_id || user.role === 'system_admin').length;

    return {
      teamStats,
      totalUsers,
      totalTeams,
      totalLeaders,
      totalMembers,
      unassignedUsers
    };
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const tenantId = selectedTenant[userId];
      const role = selectedRole[userId] as 'system_admin' | 'team_leader' | 'team_member';
      const teamId = selectedTeam[userId];

      if (!tenantId || !role) {
        alert('테넌트와 역할을 선택해주세요.');
        return;
      }

      if (role !== 'system_admin' && !teamId) {
        alert('농장을 선택해주세요.');
        return;
      }

      const result = await approveUser(userId, role, tenantId, teamId);
      if (result.success) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        alert('사용자가 승인되었습니다.');
      } else {
        alert('승인에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('정말로 이 사용자를 거부하시겠습니까?')) {
      return;
    }
    setActionLoading(userId);
    try {
      const result = await rejectUser(userId);
      if (result.success) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        alert('사용자가 거부되었습니다.');
      } else {
        alert('거부에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditUser = (user: ApprovedUser) => {
    setEditingUser(user.id);
    setEditFormData({
      name: user.name || '',
      email: user.email,
      role: user.role || 'team_member',
      team_id: user.team_id || '',
      company: user.company || '',
      phone: user.phone || '',
      is_active: user.is_active ?? true,
      editingField: 'role'
    });
  };

  const handleSaveEdit = async (userId: string) => {
    setActionLoading(userId);
    try {
      const updates = {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role || 'team_member',
        team_id: editFormData.team_id || undefined,
        team_name: editFormData.team_id ? teams.find(t => t.id === editFormData.team_id)?.name : undefined,
        company: editFormData.company || undefined,
        phone: editFormData.phone || undefined,
        is_active: editFormData.is_active
      };

      const result = await updateUser(userId, updates as Partial<AuthUser>);
      if (result.success) {
        setApprovedUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, ...updates } : u
        ));
        setEditingUser(null);
        alert('사용자 정보가 업데이트되었습니다.');
      } else {
        alert('업데이트에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({
      name: '',
      email: '',
      role: 'team_member',
      team_id: '',
      company: '',
      phone: '',
      is_active: true,
      editingField: 'role'
    });
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`정말로 "${userName}" 사용자를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    setActionLoading(userId);
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        setApprovedUsers(prev => prev.filter(u => u.id !== userId));
        alert('사용자가 삭제되었습니다.');
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => {
      const newSelected = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      // 선택된 사용자가 0명이면 일괄 편집 모드 비활성화
      if (newSelected.length === 0) {
        setBulkEditMode(false);
        setEditingUser(null);
      }
      
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === approvedUsers.length) {
      setSelectedUsers([]);
      setBulkEditMode(false);
      setEditingUser(null);
    } else {
      setSelectedUsers(approvedUsers.map(u => u.id));
      setBulkEditMode(true);
      setEditingUser(null);
    }
  };

  const handleBulkEdit = () => {
    if (selectedUsers.length === 0) {
      alert('편집할 사용자를 선택해주세요.');
      return;
    }
    if (selectedUsers.length === 1) {
      const user = approvedUsers.find(u => u.id === selectedUsers[0]);
      if (user) {
        handleEditUser(user);
      }
    } else {
      setBulkEditMode(true);
      setBulkEditData({
        role: '',
        team_id: '',
        is_active: 'true'
      });
    }
  };

  const handleBulkSave = async () => {
    if (selectedUsers.length === 0) {
      alert('편집할 사용자를 선택해주세요.');
      return;
    }

    setActionLoading('bulk');
    try {
      const updatePromises = selectedUsers.map(async (userId) => {
        const updates: Record<string, unknown> = {};
        
        if (bulkEditData.role) {
          updates.role = bulkEditData.role;
        }
        if (bulkEditData.team_id !== undefined) {
          updates.team_id = bulkEditData.team_id || undefined;
          updates.team_name = bulkEditData.team_id ? teams.find(t => t.id === bulkEditData.team_id)?.name : undefined;
        }
        if (bulkEditData.is_active !== undefined) {
          updates.is_active = bulkEditData.is_active;
        }

        if (Object.keys(updates).length > 0) {
          return await updateUser(userId, updates);
        }
        return { success: true };
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        // UI 업데이트
        setApprovedUsers(prev => prev.map(user => {
          if (selectedUsers.includes(user.id)) {
            const updates: Record<string, unknown> = {};
            if (bulkEditData.role) updates.role = bulkEditData.role;
            if (bulkEditData.team_id !== undefined) {
              updates.team_id = bulkEditData.team_id || undefined;
              updates.team_name = bulkEditData.team_id ? teams.find(t => t.id === bulkEditData.team_id)?.name : undefined;
            }
            if (bulkEditData.is_active !== undefined) updates.is_active = bulkEditData.is_active;
            return { ...user, ...updates };
          }
          return user;
        }));

        setBulkEditMode(false);
        setSelectedUsers([]);
        alert(`${successCount}명의 사용자가 업데이트되었습니다.${failCount > 0 ? ` (${failCount}명 실패)` : ''}`);
      } else {
        alert('업데이트에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkCancel = () => {
    setBulkEditMode(false);
    setBulkEditData({
      role: 'team_member',
      team_id: '',
      is_active: 'true'
    });
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      alert('삭제할 사용자를 선택해주세요.');
      return;
    }
    
    // 최종 관리자 제외
    const deletableUsers = selectedUsers.filter(id => {
      const user = approvedUsers.find(u => u.id === id);
      return user?.email !== 'sky3rain7@gmail.com';
    });
    
    if (deletableUsers.length === 0) {
      alert('선택된 사용자 중 삭제 가능한 사용자가 없습니다.\n최종 관리자는 삭제할 수 없습니다.');
      return;
    }
    
    if (deletableUsers.length !== selectedUsers.length) {
      alert('최종 관리자는 삭제할 수 없습니다. 다른 사용자만 삭제됩니다.');
    }
    
    const userNames = deletableUsers.map(id => {
      const user = approvedUsers.find(u => u.id === id);
      return user?.name || '알 수 없음';
    }).join(', ');
    
    if (!confirm(`정말로 다음 사용자들을 삭제하시겠습니까?\n${userNames}\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setActionLoading('bulk');
    try {
      const deletePromises = deletableUsers.map(userId => deleteUser(userId));
      const results = await Promise.all(deletePromises);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        setApprovedUsers(prev => prev.filter(u => !deletableUsers.includes(u.id)));
        setSelectedUsers([]);
        alert(`${successCount}명의 사용자가 삭제되었습니다.${failCount > 0 ? ` (${failCount}명 실패)` : ''}`);
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      {user && (
        <AppHeader
          user={user}
          title="관리자 페이지"
          subtitle="사용자 승인 관리"
        />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto pt-4 pb-8 sm:px-6 lg:px-8 relative z-10">
        

        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 px-8 py-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <span className="text-3xl">👑</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">관리자 대시보드</h2>
                <p className="text-white/90">사용자 승인 및 시스템 관리를 수행하세요</p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8">
            {/* 탭 메뉴 */}
            <div className="flex space-x-1 mb-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'pending'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white/50 text-gray-600 hover:bg-white/70'
                }`}
              >
                승인 대기 ({pendingUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'approved'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'bg-white/50 text-gray-600 hover:bg-white/70'
                }`}
              >
                승인된 사용자 ({approvedUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'teams'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/50 text-gray-600 hover:bg-white/70'
                }`}
              >
                농장 현황 ({teams.length})
              </button>
            </div>

            {activeTab === 'pending' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                      👥 승인 대기 사용자
                    </h3>
                    <p className="text-gray-600">새로 가입한 사용자들의 승인을 관리하세요</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-black text-gray-900">{pendingUsers.length}</div>
                      <div className="text-xs text-gray-500 font-medium">대기 중</div>
                    </div>
                    <button
                      onClick={loadData}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      새로고침
                    </button>
                  </div>
                </div>

                {pendingUsers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl">✅</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">승인 대기 중인 사용자가 없습니다</h3>
                    <p className="text-gray-600 mb-6">모든 사용자가 승인되었습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingUsers.map((pendingUser) => (
                      <div key={pendingUser.id} className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-2xl">👤</span>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">{pendingUser.name}</h4>
                              <p className="text-gray-600 font-medium">{pendingUser.email}</p>
                              {pendingUser.company && (
                                <p className="text-sm text-gray-500">🏢 {pendingUser.company}</p>
                              )}
                              {pendingUser.phone && (
                                <p className="text-sm text-gray-500">📞 {pendingUser.phone}</p>
                              )}
                              {pendingUser.preferred_team && (
                                <p className="text-sm text-blue-600 font-medium">🎯 선호 농장: {pendingUser.preferred_team}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500 font-medium">
                              {new Date(pendingUser.created_at || new Date().toISOString()).toLocaleString('ko-KR')}
                            </div>
                            <div className="text-xs text-gray-400">가입일</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              테넌트 선택
                            </label>
                            <select
                              value={selectedTenant[pendingUser.id] || ''}
                              onChange={(e) => setSelectedTenant(prev => ({
                                ...prev,
                                [pendingUser.id]: e.target.value
                              }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="">테넌트를 선택하세요</option>
                              {tenants.map(tenant => (
                                <option key={tenant.id} value={tenant.id}>
                                  {tenant.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              농장 선택
                              {selectedRole[pendingUser.id] === 'system_admin' && (
                                <span className="text-xs text-gray-500 ml-1">(시스템 관리자는 농장 선택 불필요)</span>
                              )}
                            </label>
                            <select
                              value={selectedTeam[pendingUser.id] || ''}
                              onChange={(e) => setSelectedTeam(prev => ({
                                ...prev,
                                [pendingUser.id]: e.target.value
                              }))}
                              disabled={selectedRole[pendingUser.id] === 'system_admin'}
                              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                selectedRole[pendingUser.id] === 'system_admin' ? 'bg-gray-100 cursor-not-allowed' : ''
                              }`}
                            >
                              <option value="">농장을 선택하세요</option>
                              {teams.map(team => (
                                <option key={team.id} value={team.id}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              권한 선택
                            </label>
                            <select
                              value={selectedRole[pendingUser.id] || ''}
                              onChange={(e) => {
                                const newRole = e.target.value;
                                setSelectedRole(prev => ({
                                  ...prev,
                                  [pendingUser.id]: newRole
                                }));
                                
                                if (newRole === 'system_admin') {
                                  setSelectedTeam(prev => ({
                                    ...prev,
                                    [pendingUser.id]: ''
                                  }));
                                }
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="">권한을 선택하세요</option>
                              <option value="system_admin">시스템 관리자</option>
                              <option value="team_leader">농장장</option>
                              <option value="team_member">팀원</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-4">
                          <button
                            onClick={() => handleReject(pendingUser.id)}
                            disabled={actionLoading === pendingUser.id}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {actionLoading === pendingUser.id ? '처리 중...' : '거부'}
                          </button>
                          <button
                            onClick={() => handleApprove(pendingUser.id)}
                            disabled={
                              actionLoading === pendingUser.id || 
                              !selectedTenant[pendingUser.id] || 
                              !selectedRole[pendingUser.id] ||
                              (selectedRole[pendingUser.id] !== 'system_admin' && !selectedTeam[pendingUser.id])
                            }
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {actionLoading === pendingUser.id ? '처리 중...' : '승인'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                      ✅ 승인된 사용자
                    </h3>
                    <p className="text-gray-600">현재 시스템에 등록된 모든 사용자 목록입니다</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-black text-gray-900">{approvedUsers.length}</div>
                      <div className="text-xs text-gray-500 font-medium">총 사용자</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={loadData}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        새로고침
                      </button>
                      {selectedUsers.length > 0 && !bulkEditMode && (
                        <>
                          <button
                            onClick={handleBulkEdit}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                          >
                            {selectedUsers.length === 1 ? '편집' : '일괄 편집'} ({selectedUsers.length})
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            disabled={actionLoading === 'bulk'}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            삭제 ({selectedUsers.length})
                          </button>
                        </>
                      )}
                      {bulkEditMode && (
                        <>
                          <button
                            onClick={handleBulkSave}
                            disabled={actionLoading === 'bulk'}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === 'bulk' ? '저장 중...' : '저장'}
                          </button>
                          <button
                            onClick={handleBulkCancel}
                            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                          >
                            취소
                          </button>
                        </>
                      )}
                      {editingUser && (
                        <button
                          onClick={() => {
                            const user = approvedUsers.find(u => u.id === editingUser);
                            if (user) {
                              handleSaveEdit(user.id);
                            }
                          }}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                          저장
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {approvedUsers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl">👥</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">승인된 사용자가 없습니다</h3>
                    <p className="text-gray-600 mb-6">아직 승인된 사용자가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 전체 선택 헤더 */}
                    <div className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl p-4 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedUsers.length === approvedUsers.length && approvedUsers.length > 0}
                              onChange={handleSelectAll}
                              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-lg font-semibold text-gray-700">
                              전체 선택 ({selectedUsers.length}/{approvedUsers.length})
                            </span>
                          </label>
                        </div>
                        <div className="text-sm text-gray-500">
                          카드 클릭: 개별 편집 모드 | 체크박스 클릭: 일괄 편집 모드 (1명부터 가능)
                        </div>
                      </div>
                    </div>

                    {/* 일괄 편집 패널 */}
                    {bulkEditMode && selectedUsers.length > 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 backdrop-blur-sm border-2 border-purple-200 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {selectedUsers.length === 1 ? '개별 편집' : '일괄 편집'} 모드
                            </h3>
                            <p className="text-gray-600">
                              {selectedUsers.length}명의 사용자가 선택되었습니다. {selectedUsers.length === 1 ? '개별 편집 모드' : '일괄 편집 모드'}입니다.
                            </p>
                          </div>
                          <div className="text-sm text-purple-600 font-medium">
                            편집 중
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* 권한 일괄 편집 */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              권한 변경
                            </label>
                            <div className="space-y-2">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="bulk_role"
                                  value=""
                                  checked={bulkEditData.role === ''}
                                  onChange={(e) => setBulkEditData(prev => ({ ...prev, role: e.target.value }))}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-500">변경하지 않음</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="bulk_role"
                                  value="system_admin"
                                  checked={bulkEditData.role === 'system_admin'}
                                  onChange={(e) => setBulkEditData(prev => ({ ...prev, role: e.target.value }))}
                                  className="mr-2"
                                />
                                <span className="text-sm text-purple-600">시스템 관리자</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="bulk_role"
                                  value="team_leader"
                                  checked={bulkEditData.role === 'team_leader'}
                                  onChange={(e) => setBulkEditData(prev => ({ ...prev, role: e.target.value }))}
                                  className="mr-2"
                                />
                                <span className="text-sm text-blue-600">농장장</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="bulk_role"
                                  value="team_member"
                                  checked={bulkEditData.role === 'team_member'}
                                  onChange={(e) => setBulkEditData(prev => ({ ...prev, role: e.target.value }))}
                                  className="mr-2"
                                />
                                <span className="text-sm text-green-600">팀원</span>
                              </label>
                            </div>
                          </div>

                          {/* 농장 일괄 편집 */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              농장 변경
                            </label>
                            <div className="space-y-2">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="bulk_team"
                                  value=""
                                  checked={bulkEditData.team_id === ''}
                                  onChange={(e) => setBulkEditData(prev => ({ ...prev, team_id: e.target.value }))}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-500">변경하지 않음</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="bulk_team"
                                  value="none"
                                  checked={bulkEditData.team_id === 'none'}
                                  onChange={(e) => setBulkEditData(prev => ({ ...prev, team_id: e.target.value }))}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-600">농장 배정 없음</span>
                              </label>
                              {teams.map(team => (
                                <label key={team.id} className="flex items-center cursor-pointer">
                                  <input
                                    type="radio"
                                    name="bulk_team"
                                    value={team.id}
                                    checked={bulkEditData.team_id === team.id}
                                    onChange={(e) => setBulkEditData(prev => ({ ...prev, team_id: e.target.value }))}
                                    className="mr-2"
                                  />
                                  <span className="text-sm text-blue-600">{team.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* 상태 일괄 편집 */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              상태 변경
                            </label>
                            <div className="space-y-2">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="bulk_status"
                                  value=""
                                  checked={bulkEditData.is_active === ''}
                                  onChange={(e) => setBulkEditData(prev => ({ ...prev, is_active: e.target.value }))}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-500">변경하지 않음</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="bulk_status"
                                  value="true"
                                  checked={bulkEditData.is_active === 'true'}
                                  onChange={(e) => setBulkEditData(prev => ({ ...prev, is_active: e.target.value }))}
                                  className="mr-2"
                                />
                                <span className="text-sm text-green-600">활성</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="bulk_status"
                                  value="false"
                                  checked={bulkEditData.is_active === 'false'}
                                  onChange={(e) => setBulkEditData(prev => ({ ...prev, is_active: e.target.value }))}
                                  className="mr-2"
                                />
                                <span className="text-sm text-red-600">비활성</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

         {approvedUsers.map((approvedUser) => (
           <div 
             key={approvedUser.id} 
             className={`bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${
               editingUser === approvedUser.id ? 'cursor-default' : 'cursor-pointer'
             } ${
               selectedUsers.includes(approvedUser.id) 
                 ? 'border-blue-500 bg-blue-50/50' 
                 : 'border-white/30'
             }`}
             onClick={() => {
               if (editingUser !== approvedUser.id) {
                 // 카드 클릭: 개별 편집 모드
                 setEditingUser(approvedUser.id);
                 setEditFormData({
                   name: approvedUser.name || '',
                   email: approvedUser.email,
                   role: approvedUser.role || 'team_member',
                   team_id: approvedUser.team_id || '',
                   company: approvedUser.company || '',
                   phone: approvedUser.phone || '',
                   is_active: approvedUser.is_active ?? true,
                   editingField: 'role'
                 });
               }
             }}
           >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(approvedUser.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleUserSelect(approvedUser.id);
                                // 체크박스 클릭 시 일괄 편집 모드 활성화
                                if (!selectedUsers.includes(approvedUser.id)) {
                                  setBulkEditMode(true);
                                  setEditingUser(null);
                                }
                              }}
                              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-2xl">
                     {(approvedUser.role || 'team_member') === 'system_admin' ? '👑' : 
                      (approvedUser.role || 'team_member') === 'team_leader' ? '👨‍💼' : '👤'}
                              </span>
                            </div>
                            <div>
                              {editingUser === approvedUser.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editFormData.name || approvedUser.name || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="이름"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <input
                                    type="email"
                                    value={editFormData.email || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="이메일"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              ) : (
                                <div>
                                  <h4 className="text-xl font-bold text-gray-900">{approvedUser.name || '이름 없음'}</h4>
                                  <p className="text-gray-600 font-medium">{approvedUser.email}</p>
                                  {approvedUser.company && (
                                    <p className="text-sm text-gray-500">🏢 {approvedUser.company}</p>
                                  )}
                                  {approvedUser.phone && (
                                    <p className="text-sm text-gray-500">📞 {approvedUser.phone}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-sm text-gray-500 font-medium">
                                {new Date(approvedUser.created_at || new Date().toISOString()).toLocaleString('ko-KR')}
                              </div>
                              <div className="text-xs text-gray-400">가입일</div>
                            </div>
                            {editingUser === approvedUser.id ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelEdit();
                                  }}
                                  className="bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveEdit(approvedUser.id);
                                  }}
                                  disabled={actionLoading === approvedUser.id}
                                  className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                                >
                                  {actionLoading === approvedUser.id ? '저장 중...' : '저장'}
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                {approvedUser.email !== 'sky3rain7@gmail.com' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteUser(approvedUser.id, approvedUser.name || '이름 없음');
                                    }}
                                    disabled={actionLoading === approvedUser.id}
                                    className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                                  >
                                    삭제
                                  </button>
                                )}
                                {approvedUser.email === 'sky3rain7@gmail.com' && (
                                  <div className="px-3 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg">
                                    최종 관리자
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* 권한 카드 */}
                          <div 
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                              editingUser === approvedUser.id && editFormData.editingField === 'role'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (editingUser !== approvedUser.id) {
                                setEditingUser(approvedUser.id);
                 setEditFormData({
                   name: approvedUser.name || '',
                   email: approvedUser.email,
                   role: approvedUser.role || 'team_member',
                   team_id: approvedUser.team_id || '',
                   company: approvedUser.company || '',
                   phone: approvedUser.phone || '',
                   is_active: approvedUser.is_active ?? true,
                   editingField: 'role'
                 });
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-700">권한</span>
                              {editingUser === approvedUser.id && editFormData.editingField === 'role' && (
                                <span className="text-xs text-blue-600 font-medium">편집 중</span>
                              )}
                            </div>
                            {editingUser === approvedUser.id && editFormData.editingField === 'role' ? (
                              <div className="grid grid-cols-1 gap-2">
                                <div 
                                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                       (editFormData.role || 'team_member') === 'system_admin' 
                         ? 'border-purple-500 bg-purple-50' 
                         : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                  onClick={() => setEditFormData(prev => ({ ...prev, role: 'system_admin' }))}
                                >
                                  <div className="flex items-center">
                                    <span className="text-sm font-semibold text-purple-600">시스템 관리자</span>
                                    {(editFormData.role || 'team_member') === 'system_admin' && (
                                      <span className="ml-2 text-xs text-purple-500">✓</span>
                                    )}
                                  </div>
                                </div>
                                <div 
                                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                    (editFormData.role || 'team_member') === 'team_leader' 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                  onClick={() => setEditFormData(prev => ({ ...prev, role: 'team_leader' }))}
                                >
                                  <div className="flex items-center">
                                    <span className="text-sm font-semibold text-blue-600">농장장</span>
                                    {(editFormData.role || 'team_member') === 'team_leader' && (
                                      <span className="ml-2 text-xs text-blue-500">✓</span>
                                    )}
                                  </div>
                                </div>
                                <div 
                                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                    (editFormData.role || 'team_member') === 'team_member' 
                                      ? 'border-green-500 bg-green-50' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                  onClick={() => setEditFormData(prev => ({ ...prev, role: 'team_member' }))}
                                >
                                  <div className="flex items-center">
                                    <span className="text-sm font-semibold text-green-600">팀원</span>
                                    {(editFormData.role || 'team_member') === 'team_member' && (
                                      <span className="ml-2 text-xs text-green-500">✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className={`font-bold text-lg ${
                                  (approvedUser.role || 'team_member') === 'system_admin' ? 'text-purple-600' :
                                  (approvedUser.role || 'team_member') === 'team_leader' ? 'text-blue-600' : 'text-green-600'
                                }`}>
                     {(approvedUser.role || 'team_member') === 'system_admin' ? '시스템 관리자' :
                      (approvedUser.role || 'team_member') === 'team_leader' ? '농장장' : '팀원'}
                                </span>
                                <span className="ml-2 text-gray-400">→</span>
                              </div>
                            )}
                          </div>

                          {/* 배정된 조 카드 */}
                          <div 
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                              editingUser === approvedUser.id && editFormData.editingField === 'team'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (editingUser !== approvedUser.id) {
                                setEditingUser(approvedUser.id);
                                setEditFormData({
                                  name: approvedUser.name || '',
                                  email: approvedUser.email,
                                  role: approvedUser.role || 'team_member',
                                  team_id: approvedUser.team_id || '',
                                  company: approvedUser.company || '',
                                  phone: approvedUser.phone || '',
                                  is_active: approvedUser.is_active ?? true,
                                  editingField: 'team'
                                });
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-700">배정된 농장</span>
                              {editingUser === approvedUser.id && editFormData.editingField === 'team' && (
                                <span className="text-xs text-blue-600 font-medium">편집 중</span>
                              )}
                            </div>
                            {editingUser === approvedUser.id && editFormData.editingField === 'team' ? (
                              <div className="grid grid-cols-1 gap-2">
                                <div 
                                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                    editFormData.team_id === '' 
                                      ? 'border-gray-500 bg-gray-50' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                  onClick={() => setEditFormData(prev => ({ ...prev, team_id: '' }))}
                                >
                                  <div className="flex items-center">
                                    <span className="text-sm font-semibold text-gray-600">농장 배정 없음</span>
                                    {editFormData.team_id === '' && (
                                      <span className="ml-2 text-xs text-gray-500">✓</span>
                                    )}
                                  </div>
                                </div>
                                {teams.map(team => (
                                  <div 
                                    key={team.id}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                      editFormData.team_id === team.id 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                    onClick={() => setEditFormData(prev => ({ ...prev, team_id: team.id }))}
                                  >
                                    <div className="flex items-center">
                                      <span className="text-sm font-semibold text-blue-600">{team.name}</span>
                                      {editFormData.team_id === team.id && (
                                        <span className="ml-2 text-xs text-blue-500">✓</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="font-bold text-lg text-gray-700">
                                  {approvedUser.team_name || '농장 배정 없음'}
                                </span>
                                <span className="ml-2 text-gray-400">→</span>
                              </div>
                            )}
                          </div>

                          {/* 상태 카드 */}
                          <div 
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                              editingUser === approvedUser.id && editFormData.editingField === 'status'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (editingUser !== approvedUser.id) {
                                setEditingUser(approvedUser.id);
                                setEditFormData({
                                  name: approvedUser.name || '',
                                  email: approvedUser.email,
                                  role: approvedUser.role || 'team_member',
                                  team_id: approvedUser.team_id || '',
                                  company: approvedUser.company || '',
                                  phone: approvedUser.phone || '',
                                  is_active: approvedUser.is_active ?? true,
                                  editingField: 'status'
                                });
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-700">상태</span>
                              {editingUser === approvedUser.id && editFormData.editingField === 'status' && (
                                <span className="text-xs text-blue-600 font-medium">편집 중</span>
                              )}
                            </div>
                            {editingUser === approvedUser.id && editFormData.editingField === 'status' ? (
                              <div className="grid grid-cols-1 gap-2">
                                <div 
                                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                    editFormData.is_active === true 
                                      ? 'border-green-500 bg-green-50' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                  onClick={() => setEditFormData(prev => ({ ...prev, is_active: true }))}
                                >
                                  <div className="flex items-center">
                                    <span className="text-sm font-semibold text-green-600">활성</span>
                                    {editFormData.is_active === true && (
                                      <span className="ml-2 text-xs text-green-500">✓</span>
                                    )}
                                  </div>
                                </div>
                                <div 
                                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                    editFormData.is_active === false 
                                      ? 'border-red-500 bg-red-50' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                  onClick={() => setEditFormData(prev => ({ ...prev, is_active: false }))}
                                >
                                  <div className="flex items-center">
                                    <span className="text-sm font-semibold text-red-600">비활성</span>
                                    {editFormData.is_active === false && (
                                      <span className="ml-2 text-xs text-red-500">✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className={`font-bold text-lg flex items-center ${
                                  (approvedUser.is_active ?? true) ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  <div className={`w-3 h-3 rounded-full mr-2 ${
                                    (approvedUser.is_active ?? true) ? 'bg-green-400' : 'bg-red-400'
                                  }`}></div>
                                  {(approvedUser.is_active ?? true) ? '활성' : '비활성'}
                                </span>
                                <span className="ml-2 text-gray-400">→</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {editingUser === approvedUser.id && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm text-blue-700">
                              <strong>편집 모드:</strong> {
                                editFormData.editingField === 'role' ? '권한을' : 
                                editFormData.editingField === 'team' ? '농장을' : 
                                '상태를'
                              } 선택한 후 우측의 "저장" 버튼을 클릭하세요.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'teams' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                      🏠 농장 현황 대시보드
                    </h3>
                    <p className="text-gray-600">전체 농장 현황과 각 농장의 멤버 구성을 한눈에 확인하세요</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={loadData}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      새로고침
                    </button>
                  </div>
                </div>

                {/* 전체 통계 카드 */}
                {(() => {
                  const stats = getTeamStats();
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm font-semibold">총 농장 수</p>
                            <p className="text-3xl font-black">{stats.totalTeams}</p>
                          </div>
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🏠</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm font-semibold">총 사용자</p>
                            <p className="text-3xl font-black">{stats.totalUsers}</p>
                          </div>
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm font-semibold">농장장 수</p>
                            <p className="text-3xl font-black">{stats.totalLeaders}</p>
                          </div>
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">👨‍💼</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-sm font-semibold">팀원 수</p>
                            <p className="text-3xl font-black">{stats.totalMembers}</p>
                          </div>
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 농장별 상세 현황 */}
                <div className="space-y-6">
                  {(() => {
                    const stats = getTeamStats();
                    return stats.teamStats.map((team) => (
                      <div key={team.id} className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-3xl">🏠</span>
                            </div>
                            <div>
                              <h4 className="text-2xl font-black text-gray-900">{team.name}</h4>
                              <p className="text-gray-600 font-medium">농장 ID: {team.id}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-black text-gray-900">{team.totalMembers}</div>
                            <div className="text-sm text-gray-500 font-medium">총 멤버</div>
                          </div>
                        </div>

                        {/* 농장 통계 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="text-2xl font-black text-blue-600">{team.leaders}</div>
                            <div className="text-sm text-blue-600 font-medium">농장장</div>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="text-2xl font-black text-green-600">{team.members}</div>
                            <div className="text-sm text-green-600 font-medium">팀원</div>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="text-2xl font-black text-emerald-600">{team.activeMembers}</div>
                            <div className="text-sm text-emerald-600 font-medium">활성</div>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="text-2xl font-black text-red-600">{team.inactiveMembers}</div>
                            <div className="text-sm text-red-600 font-medium">비활성</div>
                          </div>
                        </div>

                        {/* 농장 멤버 목록 */}
                        {team.teamMembers.length > 0 ? (
                          <div className="space-y-3">
                            <h5 className="text-lg font-bold text-gray-900 mb-3">농장 멤버 목록</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {team.teamMembers.map((member) => (
                                <div key={member.id} className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                                      <span className="text-lg">
                                        {member.role === 'team_leader' ? '👨‍💼' : '👤'}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-bold text-gray-900">{member.name || '이름 없음'}</div>
                                      <div className="text-sm text-gray-600">{member.email}</div>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                          member.role === 'team_leader' 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                          {member.role === 'team_leader' ? '농장장' : '팀원'}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                          member.is_active !== false 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                          {member.is_active !== false ? '활성' : '비활성'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <span className="text-2xl">🏠</span>
                            </div>
                            <h5 className="text-lg font-bold text-gray-900 mb-2">농장 멤버가 없습니다</h5>
                            <p className="text-gray-600">아직 {team.name}에 배정된 멤버가 없습니다.</p>
                          </div>
                        )}
                      </div>
                    ));
                  })()}

                  {/* 미배정 사용자 */}
                  {(() => {
                    const stats = getTeamStats();
                    if (stats.unassignedUsers > 0) {
                      const unassignedUsers = approvedUsers.filter(user => !user.team_id || user.role === 'system_admin');
                      return (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 backdrop-blur-sm border border-yellow-200 rounded-2xl p-6 shadow-xl">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-2xl">⚠️</span>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-gray-900">미배정 사용자</h4>
                                <p className="text-gray-600">농장에 배정되지 않은 사용자들</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-black text-gray-900">{stats.unassignedUsers}</div>
                              <div className="text-sm text-gray-500 font-medium">명</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {unassignedUsers.map((user) => (
                              <div key={user.id} className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                                    <span className="text-lg">
                                      {user.role === 'system_admin' ? '👑' : '👤'}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-bold text-gray-900">{user.name || '이름 없음'}</div>
                                    <div className="text-sm text-gray-600">{user.email}</div>
                                    <div className="text-xs text-gray-500">
                                      {user.role === 'system_admin' ? '시스템 관리자' : '농장 배정 없음'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}