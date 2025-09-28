'use client';

import React, { useEffect, useState } from 'react';
import AppHeader from '../../components/AppHeader';
import {
  getCurrentUser,
  getApprovedUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  updateUser,
  getTeams,
  type AuthUser,
} from '../../lib/auth';

type ApprovedUserRow = AuthUser;

type TabType = 'pending' | 'approved' | 'farms';

export default function AdminPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [pendingUsers, setPendingUsers] = useState<AuthUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  
  // 검색 및 편집 관련 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredApprovedUsers, setFilteredApprovedUsers] = useState<AuthUser[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    company?: string;
    phone?: string;
    team_id?: string;
  }>({
    name: '',
    email: '',
    role: 'team_member',
    is_active: true,
    company: '',
    phone: '',
    team_id: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  // 승인 모달 관련 상태
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingUser, setApprovingUser] = useState<AuthUser | null>(null);
  const [approveFormData, setApproveFormData] = useState<{
    role: string;
    team_id: string;
  }>({
    role: 'team_member',
    team_id: ''
  });
  const [approveLoading, setApproveLoading] = useState(false);

  // ✅ checkAuth → loadData 체인
  useEffect(() => {
    let alive = true;

    const checkAuth = async () => {
      console.log('🔍 admin 페이지 - checkAuth 시작');
      const user = await getCurrentUser();
      console.log('🔍 admin 페이지 - currentUser:', user);

      if (!alive) return;

      if (!user) {
        console.warn('🔒 admin 페이지 - 비인증 사용자. /login으로 이동');
        if (typeof window !== 'undefined') window.location.href = '/login';
        return;
      }

      setAuthUser(user);
      setAuthChecked(true);
      console.log('🔍 admin 페이지 - 인증 성공, loadData 호출');
      await loadData(user);
    };

    const loadData = async (user: AuthUser) => {
      try {
        console.log('🔍 admin 페이지 - 데이터 로드 시작');
        
        const canView =
          user.role === 'system_admin' ||
          user.role === 'team_leader' ||
          user.email === 'sky3rain7@gmail.com';

        if (!canView) {
          console.warn('🚫 admin 페이지 - 권한 없음. 대체 UI 노출.');
          setPendingUsers([]);
          setApprovedUsers([]);
      setLoading(false);
          return;
        }

        // 승인 대기 사용자, 승인된 사용자, 팀 목록을 동시에 로드
        const [pendingResult, approvedResult, teamsResult] = await Promise.all([
        getPendingUsers(),
        getApprovedUsers(),
        getTeams()
      ]);

        console.log('🔍 admin 페이지 - 데이터 로드 결과:', {
          pending: Array.isArray(pendingResult) ? pendingResult.length : pendingResult,
          approved: Array.isArray(approvedResult) ? approvedResult.length : approvedResult
        });

        if (!alive) return;
        setPendingUsers(Array.isArray(pendingResult) ? pendingResult : []);
        setApprovedUsers(Array.isArray(approvedResult) ? approvedResult : []);
        setTeams(teamsResult.success ? teamsResult.teams : []);
      } catch (e) {
        console.error('admin 페이지 - loadData 에러:', e);
        setPendingUsers([]);
        setApprovedUsers([]);
        setTeams([]);
    } finally {
        if (alive) setLoading(false);
      }
    };

    checkAuth();

    return () => {
      alive = false;
    };
  }, []);

  // 검색 기능
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredApprovedUsers(approvedUsers);
      } else {
      const filtered = approvedUsers.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApprovedUsers(filtered);
    }
  }, [searchTerm, approvedUsers]);

  // 사용자 편집 모달 열기
  const handleEditUser = (user: AuthUser) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email,
      role: user.role || 'team_member',
      is_active: user.is_active ?? true,
      company: user.company || '',
      phone: user.phone || '',
      team_id: user.team_id || ''
    });
    setIsEditModalOpen(true);
  };

  // 사용자 편집 모달 닫기
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditFormData({
      name: '',
      email: '',
      role: 'team_member',
      is_active: true,
      company: '',
      phone: '',
      team_id: ''
    });
  };

  // 사용자 정보 저장
  const handleSaveUser = async () => {
    if (!editingUser) return;

    setEditLoading(true);
    try {
      const result = await updateUser(editingUser.id, editFormData);
      if (result.success) {
        alert('사용자 정보가 업데이트되었습니다.');
        // 데이터 다시 로드
        if (authUser) {
          const [pendingResult, approvedResult] = await Promise.all([
            getPendingUsers(),
            getApprovedUsers()
          ]);
          setPendingUsers(Array.isArray(pendingResult) ? pendingResult : []);
          setApprovedUsers(Array.isArray(approvedResult) ? approvedResult : []);
        }
        handleCloseEditModal();
      } else {
        alert('업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 업데이트 오류:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setEditLoading(false);
    }
  };

  // 사용자 승인 모달 열기
  const handleApproveUser = (user: AuthUser) => {
    setApprovingUser(user);
    setApproveFormData({
      role: 'team_member',
      team_id: ''
    });
    setIsApproveModalOpen(true);
  };

  // 사용자 승인 모달 닫기
  const handleCloseApproveModal = () => {
    setIsApproveModalOpen(false);
    setApprovingUser(null);
    setApproveFormData({
      role: 'team_member',
      team_id: ''
    });
  };

  // 사용자 승인 처리
  const handleConfirmApprove = async () => {
    if (!approvingUser) return;

    setApproveLoading(true);
    try {
      // 사용자 승인
      const approveResult = await approveUser(approvingUser.id);
      if (!approveResult.success) {
        alert('승인 처리에 실패했습니다.');
        return;
      }

      // 사용자 정보 업데이트 (역할, 팀 배정)
      const updateResult = await updateUser(approvingUser.id, {
        role: approveFormData.role,
        team_id: approveFormData.team_id || null
      });

      if (updateResult.success) {
        alert('사용자가 승인되었고 농장에 배정되었습니다.');
        // 데이터 다시 로드
        if (authUser) {
          const [pendingResult, approvedResult] = await Promise.all([
            getPendingUsers(),
            getApprovedUsers()
          ]);
          setPendingUsers(Array.isArray(pendingResult) ? pendingResult : []);
          setApprovedUsers(Array.isArray(approvedResult) ? approvedResult : []);
        }
        handleCloseApproveModal();
      } else {
        alert('승인은 되었지만 농장 배정에 실패했습니다.');
      }
    } catch (error) {
      console.error('승인 처리 오류:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setApproveLoading(false);
    }
  };

  // 사용자 거부 처리
  const handleRejectUser = async (userId: string) => {
    if (!confirm('정말로 이 사용자를 거부하시겠습니까?')) {
      return;
    }

    try {
      const result = await rejectUser(userId);
      if (result.success) {
        alert('사용자가 거부되었습니다.');
        // 데이터 다시 로드
        if (authUser) {
          const [pendingResult, approvedResult] = await Promise.all([
            getPendingUsers(),
            getApprovedUsers()
          ]);
          setPendingUsers(Array.isArray(pendingResult) ? pendingResult : []);
          setApprovedUsers(Array.isArray(approvedResult) ? approvedResult : []);
        }
      } else {
        alert('거부 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('거부 처리 오류:', error);
      alert('오류가 발생했습니다.');
    }
  };

  // 농장별로 사용자 그룹화
  const getUsersByFarm = () => {
    const farmGroups: { [key: string]: AuthUser[] } = {};
    
    approvedUsers.forEach(user => {
      const farmKey = user.team_name || user.team_id || '팀 미배정';
      if (!farmGroups[farmKey]) {
        farmGroups[farmKey] = [];
      }
      farmGroups[farmKey].push(user);
    });
    
    return farmGroups;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      {authUser && (
        <AppHeader
          user={authUser}
          title="사용자 관리"
          subtitle="승인된 사용자 목록"
          isDashboard={false}
        />
      )}


      {/* Main Content */}
      <main className="max-w-7xl mx-auto pt-4 pb-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Overview Section */}
        <div className="mb-8">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">사용자 관리</h2>
            <p className="text-lg text-gray-600">사용자 승인 및 권한을 관리합니다</p>
              </div>
          
          {/* 탭 네비게이션 */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
              <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('pending')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'pending'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                  ⏳ 승인 대기 ({pendingUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'approved'
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                  ✅ 승인된 사용자 ({approvedUsers.length})
              </button>
              <button
                  onClick={() => setActiveTab('farms')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
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
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">로딩 중...</p>
                    </div>
          </div>
        ) : !authUser ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-300 overflow-hidden mb-8">
            <div className="px-8 py-16 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">로그인 필요</h3>
              <p className="text-gray-600">사용자 관리 페이지에 접근하려면 로그인이 필요합니다.</p>
            </div>
                  </div>
                ) : (
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-8">
            {/* 탭 헤더 */}
            <div className={`px-8 py-6 ${
              activeTab === 'pending' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
              activeTab === 'approved' ? 'bg-gradient-to-r from-green-500 to-blue-500' :
              'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}>
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-3xl">
                    {activeTab === 'pending' ? '⏳' :
                     activeTab === 'approved' ? '✅' : '🏢'}
                  </span>
                            </div>
                            <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {activeTab === 'pending' ? '승인 대기 사용자' :
                     activeTab === 'approved' ? '승인된 사용자' : '농장별 사용자 보기'}
                  </h1>
                  <p className="text-white/90 text-lg">
                    {activeTab === 'pending' ? '승인을 기다리는 사용자들을 관리합니다' :
                     activeTab === 'approved' ? '시스템에 등록된 모든 승인된 사용자를 관리합니다' :
                     '농장별로 분류된 사용자 목록을 확인합니다'}
                  </p>
                            </div>
                          </div>
                        </div>

            {/* 탭 내용 */}
            <div className="px-8 py-8">
              {/* 승인 대기 탭 */}
              {activeTab === 'pending' && (
                          <div>
                  <div className="flex items-center justify-between mb-8">
                          <div>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">
                        ⏳ 승인 대기 사용자 목록
                      </h3>
                      <p className="text-gray-600">
                        승인을 기다리는 사용자들을 검토하고 승인 또는 거부할 수 있습니다
                      </p>
                          </div>
                    <div className="text-sm text-gray-500">
                      총 {pendingUsers.length}명
                          </div>
                        </div>

                  <div className="space-y-6">
                    {pendingUsers.map((u) => (
                      <div 
                        key={u.id} 
                        className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-2xl">⏳</span>
                        </div>
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">{u.name || '이름 없음'}</h4>
                              <p className="text-gray-600 font-medium">{u.email}</p>
                              <div className="flex items-center space-x-3 mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  승인 대기
                                </span>
                                {u.company && (
                                  <span className="text-xs text-gray-500">🏢 {u.company}</span>
                )}
              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                가입일: {new Date(u.created_at).toLocaleDateString('ko-KR')}
                  </div>
                      </div>
                    </div>
                          <div className="flex space-x-3">
                      <button
                              onClick={() => handleRejectUser(u.id)}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                      >
                              거부
                      </button>
                            <button
                              onClick={() => handleApproveUser(u)}
                              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
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
                        <h3 className="text-xl font-bold text-gray-900 mb-2">승인 대기 사용자가 없습니다</h3>
                        <p className="text-gray-600">현재 승인을 기다리는 사용자가 없습니다.</p>
                  </div>
                    )}
                        </div>
                        </div>
              )}

              {/* 승인된 사용자 탭 */}
              {activeTab === 'approved' && (
                <div>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">
                        ✅ 승인된 사용자 목록
                            </h3>
                            <p className="text-gray-600">
                        시스템에 등록된 모든 승인된 사용자를 관리합니다
                            </p>
                          </div>
                    <div className="text-sm text-gray-500">
                      총 {approvedUsers.length}명 (검색결과: {filteredApprovedUsers.length}명)
                          </div>
                        </div>

                  {/* 검색 기능 */}
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
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                            </div>
                          </div>

                  <div className="space-y-6">
                    {filteredApprovedUsers.map((u) => (
                      <div 
                        key={u.id} 
                        className="bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-5 flex-1">
                            {/* 역할별 아이콘 색상 구분 */}
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                              u.role === 'system_admin' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                              u.role === 'team_leader' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                              'bg-gradient-to-br from-green-400 to-emerald-500'
                            }`}>
                              <span className="text-3xl">
                                {u.role === 'system_admin' ? '👑' : 
                                 u.role === 'team_leader' ? '👨‍💼' : '👤'}
                              </span>
                            </div>
                            <div className="flex-1">
                              {/* 첫 번째 행: 이름, 상태, 이메일, 전화번호, 가입일 */}
                              <div className="flex items-center space-x-4 mb-4">
                                <h4 className="text-2xl font-bold text-gray-900">{u.name || '이름 없음'}</h4>
                                <div className={`text-sm px-3 py-1.5 rounded-full font-semibold ${
                                  u.is_active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                  {u.is_active ? '활성' : '비활성'}
                                </div>
                                <p className="text-gray-600 font-medium text-lg">{u.email}</p>
                                {u.phone && (
                                  <span className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                                    <span className="mr-1.5">📞</span>
                                    {u.phone}
                                  </span>
                                )}
                                <span className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                                  <span className="mr-1.5">📅</span>
                                  가입: {new Date(u.created_at).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                              
                              {/* 두 번째 행: 소속, 농장, 등급, 최근 접속일 */}
                              <div className="flex items-center space-x-4 mb-2">
                                {u.company && (
                                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
                                    🏢 {u.company}
                                  </span>
                                )}
                                {u.team_name && (
                                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                                    🏡 {u.team_name}
                                  </span>
                                )}
                                <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${
                                  u.role === 'system_admin' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                  u.role === 'team_leader' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                  'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {u.role === 'system_admin' ? '👑 시스템 관리자' :
                                   u.role === 'team_leader' ? '👨‍💼 농장장' : '👤 팀원'}
                                </span>
                                {u.updated_at && (
                                  <span className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                                    <span className="mr-1.5">🕒</span>
                                    최근 접속: {new Date(u.updated_at).toLocaleDateString('ko-KR')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                                <button
                              onClick={() => handleEditUser(u)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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
                        <h3 className="text-xl font-bold text-gray-900 mb-2">승인된 사용자가 없습니다</h3>
                        <p className="text-gray-600">아직 승인된 사용자가 없습니다.</p>
                                  </div>
                                    )}
                                  </div>
                                </div>
                            )}

              {/* 농장별 정리 탭 */}
              {activeTab === 'farms' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                        🏢 농장별 사용자 보기
                    </h3>
                      <p className="text-gray-600">
                        농장별로 분류된 사용자 목록을 확인할 수 있습니다
                      </p>
                                  </div>
                    <div className="text-sm text-gray-500">
                      {Object.keys(getUsersByFarm()).length}개 농장
                                </div>
                              </div>

                  <div className="space-y-8">
                    {Object.entries(getUsersByFarm()).map(([farmName, users]) => (
                      <div key={farmName} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center mb-6">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg mr-4">
                            <span className="text-2xl">🏢</span>
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-gray-900">{farmName}</h4>
                            <p className="text-gray-600">{users.length}명의 사용자</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {users.map((user) => (
                            <div 
                              key={user.id}
                              className="bg-white/80 backdrop-blur-sm border rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
                                    user.role === 'system_admin' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                    user.role === 'team_leader' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                                    'bg-gradient-to-br from-green-400 to-emerald-500'
                                  }`}>
                                    <span className="text-lg">
                                      {user.role === 'system_admin' ? '👑' : 
                                       user.role === 'team_leader' ? '👨‍💼' : '👤'}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-semibold text-gray-900 truncate">{user.name || '이름 없음'}</h5>
                                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        user.role === 'system_admin' ? 'bg-yellow-100 text-yellow-800' :
                                        user.role === 'team_leader' ? 'bg-blue-100 text-blue-800' :
                                        'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {user.role === 'system_admin' ? '관리자' :
                                         user.role === 'team_leader' ? '농장장' : '팀원'}
                                      </span>
                                      <div className={`w-2 h-2 rounded-full ${
                                        user.is_active ? 'bg-green-400' : 'bg-red-400'
                                      }`}></div>
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

                    {Object.keys(getUsersByFarm()).length === 0 && (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <span className="text-4xl">🏢</span>
                            </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">농장 정보가 없습니다</h3>
                        <p className="text-gray-600">아직 농장별로 정리된 사용자 정보가 없습니다.</p>
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
                  <button
                    onClick={handleCloseApproveModal}
                    className="text-white/80 hover:text-white text-2xl"
                  >
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
                      <h3 className="text-xl font-bold text-gray-900">{approvingUser.name || '이름 없음'}</h3>
                      <p className="text-gray-600">{approvingUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 역할 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      역할 *
                    </label>
                    <select
                      value={approveFormData.role}
                      onChange={(e) => setApproveFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="team_member">팀원</option>
                      <option value="team_leader">농장장</option>
                      <option value="system_admin">시스템 관리자</option>
                    </select>
                  </div>

                  {/* 농장 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      농장 배정 *
                    </label>
                    <select
                      value={approveFormData.team_id}
                      onChange={(e) => setApproveFormData(prev => ({ ...prev, team_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
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

                {/* 버튼 */}
                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    onClick={handleCloseApproveModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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

        {/* 편집 모달 */}
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
              <div>
                    <h2 className="text-2xl font-bold text-white">사용자 정보 편집</h2>
                    <p className="text-white/90">사용자의 정보를 수정할 수 있습니다</p>
                  </div>
                    <button
                    onClick={handleCloseEditModal}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder="사용자 이름"
                    />
                      </div>

                  {/* 이메일 */}
                          <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder="user@example.com"
                    />
                      </div>

                  {/* 역할 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      역할 *
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="team_member">팀원</option>
                      <option value="team_leader">농장장</option>
                      <option value="system_admin">시스템 관리자</option>
                    </select>
                  </div>

                  {/* 농장 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      농장
                    </label>
                    <select
                      value={editFormData.team_id}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, team_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="">농장 미배정</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 소속 */}
                          <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      소속
                    </label>
                    <input
                      type="text"
                      value={editFormData.company}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder="소속명"
                    />
                          </div>

                  {/* 전화번호 */}
                            <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder="010-1234-5678"
                    />
                        </div>

                  {/* 활성 상태 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      계정 상태
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center text-gray-900 font-medium">
                        <input
                          type="radio"
                          name="is_active"
                          checked={editFormData.is_active === true}
                          onChange={() => setEditFormData(prev => ({ ...prev, is_active: true }))}
                          className="mr-2"
                        />
                        활성
                      </label>
                      <label className="flex items-center text-gray-900 font-medium">
                        <input
                          type="radio"
                          name="is_active"
                          checked={editFormData.is_active === false}
                          onChange={() => setEditFormData(prev => ({ ...prev, is_active: false }))}
                          className="mr-2"
                        />
                        비활성
                      </label>
                          </div>
                          </div>
                        </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    onClick={handleCloseEditModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={editLoading}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveUser}
                    disabled={editLoading}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {editLoading ? '저장 중...' : '저장'}
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
