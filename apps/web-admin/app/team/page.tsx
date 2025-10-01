'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getApprovedUsers, updateUser, AuthUser, getTeams } from '../../src/lib/auth';
import AppHeader from '../../src/components/AppHeader';

interface TeamMember extends AuthUser {
  team_name?: string | null;
  company?: string;
  phone?: string;
}

export default function TeamPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [teamMembers, setTeamMembers] = useState<AuthUser[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState<{
    email: string;
    role: string;
    message: string;
  }>({
    email: '',
    role: 'team_member',
    message: ''
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.is_approved || !currentUser.is_active) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      await loadTeamMembers();
      await loadFarms();
      await loadInvites();
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadTeamMembers();
      // 관리자 계정만 농장 목록 로드
      if (user.role === 'system_admin' || user.role === 'super_admin') {
        loadFarms();
      }
    }
  }, [user]);

  const loadFarms = async () => {
    try {
      const farmsResult = await getTeams();
      setFarms(farmsResult?.teams || []);
    } catch (error) {
      console.error('Error loading farms:', error);
    }
  };

  const loadInvites = async () => {
    if (user?.role === 'super_admin' || user?.role === 'system_admin') {
      setInvitesLoading(true);
      try {
        const response = await fetch('/api/invite');
        const result = await response.json();
        
        if (result.ok) {
          setInvites(result.data);
        } else {
          console.error('초대 목록 로드 오류:', result.error);
        }
      } catch (error) {
        console.error('초대 목록 로드 오류:', error);
      } finally {
        setInvitesLoading(false);
      }
    }
  };

  const loadTeamMembers = async () => {
    try {
      const allUsers = await getApprovedUsers();
      
      // 현재 사용자의 농장 멤버들만 필터링
      let members: AuthUser[] = [];
      
      console.log('현재 사용자:', user);
      console.log('전체 사용자:', allUsers);
      
      if (user?.role === 'system_admin') {
        // 시스템 관리자는 모든 사용자 볼 수 있음 (자신 제외)
        members = allUsers.filter(member => member.id !== user?.id) as AuthUser[];
      } else if (user?.team_id) {
        // 농장장/팀원은 자신의 농장 멤버들만 볼 수 있음 (자신 포함)
        members = allUsers.filter(member => 
          member.team_id === user.team_id && 
          member.role !== 'system_admin' // 시스템 관리자는 제외
        ) as AuthUser[];
      }
      
      console.log('필터링된 멤버들:', members);
      
      setTeamMembers(members as TeamMember[]);
    } catch {
      console.error('Error loading team members');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (member: TeamMember) => {
    console.log('🔧 handleEditUser 호출됨:', member.email);
    console.log('🔧 모달 열기 시도');
    setEditingUser(member.id);
    setEditFormData({
      name: member.name || '',
      email: member.email,
      role: member.role || 'team_member',
      is_active: member.is_active ?? true,
      company: (member as any).company || '',
      phone: (member as any).phone || '',
      team_id: member.team_id || ''
    });
    setIsEditModalOpen(true);
    console.log('🔧 모달 상태 설정 완료');
  };

  const handleSaveEdit = async (memberId: string) => {
    setActionLoading(memberId);
    try {
      // 관리자 계정은 역할과 농장 배정 포함, 농장장은 기본 정보만
      if (user?.role === 'system_admin' || user?.role === 'super_admin') {
        // 1) 사용자 속성 업데이트
        const { team_id: selectedFarmId, ...userData } = editFormData;
        const result = await updateUser(memberId, {
          ...userData,
          role: editFormData.role as 'system_admin' | 'team_leader' | 'team_member' | 'super_admin'
        });
        
        if (!result.success) {
          alert(`사용자 정보 업데이트에 실패했습니다: ${result.error}`);
          return;
        }

        // 2) 농장 배정 처리 (관리자 계정만)
        if (selectedFarmId !== undefined) {
          const { getSupabaseClient } = await import('../../src/lib/supabase');
          const supabase = getSupabaseClient();
          const tenantId = '00000000-0000-0000-0000-000000000001';
          
          if (selectedFarmId) {
            // 농장 배정
            const farmRole = editFormData.role === 'team_leader' ? 'owner' : 'operator';
            const { error: fmError } = await supabase
              .from('farm_memberships')
              .upsert([{
                tenant_id: tenantId,
                user_id: memberId,
                farm_id: selectedFarmId,
                role: farmRole
              }], { onConflict: 'tenant_id, farm_id, user_id' });
            
            if (fmError) {
              console.warn('농장 배정 실패:', fmError);
            }
          } else {
            // 배정 해제
            const { error: delErr } = await supabase
              .from('farm_memberships')
              .delete()
              .eq('user_id', memberId);
            if (delErr) {
              console.warn('농장 배정 해제 실패:', delErr);
            }
          }
        }
      } else {
        // 농장장 계정은 기본 정보만 수정 가능
        const { team_id, role, ...userData } = editFormData;
        const result = await updateUser(memberId, {
          ...userData,
          role: editFormData.role as 'system_admin' | 'team_leader' | 'team_member'
        });
        
        if (!result.success) {
          alert(`사용자 정보 업데이트에 실패했습니다: ${result.error}`);
          return;
        }
      }

      alert('팀원 정보가 업데이트되었습니다.');
      
      // 데이터 다시 로드
      if (user) {
        await loadTeamMembers();
      }
      
      setEditingUser(null);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('팀원 정보 업데이트 오류:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
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

  const handleInviteUser = async () => {
    if (!inviteFormData.email.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    setInviteLoading(true);
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteFormData.email,
          role: inviteFormData.role,
          message: inviteFormData.message,
          invited_by: user?.id,
          invited_by_name: user?.name || '관리자'
        })
      });

      const result = await response.json();

      if (result.ok) {
        alert(`초대 이메일이 ${inviteFormData.email}로 발송되었습니다!\n\n초대 링크는 7일 후에 만료됩니다.`);
        
        // 폼 초기화
        setInviteFormData({
          email: '',
          role: 'team_member',
          message: ''
        });
        setIsInviteModalOpen(false);
      } else {
        alert(`초대 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('초대 전송 오류:', error);
      alert('초대 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvite = () => {
    setInviteFormData({
      email: '',
      role: 'team_member',
      message: ''
    });
    setIsInviteModalOpen(false);
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
        <AppHeader user={user} />
      )}

      {/* User Info Card */}
      {user && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-2 sm:p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-lg sm:text-xl lg:text-2xl">
                    {user.role === 'system_admin' ? '👑' : 
                     user.role === 'team_leader' ? '👨‍💼' : '👤'}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600">{user.name}</h2>
                  <p className="text-gray-600 font-medium text-sm sm:text-base">{user.email}</p>
                  <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 mt-1 sm:mt-2">
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                      {user.role === 'system_admin' ? '시스템 관리자' :
                       user.role === 'team_leader' ? '농장장' : '팀원'}
                    </span>
                    {user.team_name && (
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                        {user.team_name}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">마지막 로그인</p>
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-600">
                  {new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto pt-4 pb-8 sm:px-6 lg:px-8 relative z-10">
        

        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-2 sm:mb-4 lg:mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-2 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-6">
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">팀 관리 대시보드</h1>
                <p className="text-white/90 text-sm sm:text-base lg:text-lg">{user?.role === 'system_admin' ? '전체 사용자를 관리합니다' : 
                   user?.team_name ? `${user.team_name}의 멤버들을 관리합니다` : 
                   '농장의 멤버들을 확인합니다'}</p>
              </div>
            </div>
          </div>
          <div className="px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8">
            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-8">
              <div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-600 mb-1 sm:mb-2">
                  {user?.role === 'system_admin' ? '전체 사용자 목록' : '팀원 목록'}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  {user?.role === 'system_admin' ? '모든 사용자를 관리합니다' :
                   user?.team_name ? `${user.team_name}의 멤버들을 관리합니다` : 
                   '농장의 멤버들을 관리합니다'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {(user?.role === 'system_admin' || user?.role === 'team_leader') && (
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="px-2 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                  >
                    <span>➕</span>
                    <span>멤버 초대</span>
                  </button>
                )}
                <div className="text-xs sm:text-sm text-gray-500">
                  총 {teamMembers.length}명
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 lg:space-y-6">
              {teamMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border rounded-2xl p-2 sm:p-3 lg:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 min-h-[80px] sm:min-h-[90px] lg:min-h-[100px]"
                >
                  <div className="flex items-center justify-between h-full">
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-sm sm:text-base lg:text-lg text-white font-bold">
                          {(member.role || 'team_member') === 'team_leader' ? 'L' : 'M'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 lg:space-x-3">
                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base lg:text-lg font-bold text-gray-600 truncate">{member.name || '이름 없음'}</h4>
                            <p className="text-gray-600 font-medium text-xs sm:text-sm truncate">{member.email}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            {(member as any).company && (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-600 font-medium">{(member as any).company}</span>
                              </div>
                            )}
                            {(member as any).phone && (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-600 font-medium">{(member as any).phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm text-gray-500 font-medium">
                          {(member.role || 'team_member') === 'team_leader' ? '농장장' : '팀원'}
                        </div>
                        <div className={`text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                          (member.is_active ?? true) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {(member.is_active ?? true) ? '활성' : '비활성'}
                        </div>
                      </div>
                      {(user?.role === 'team_leader' || user?.role === 'system_admin' || user?.role === 'super_admin') && (
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleEditUser(member)}
                            className="bg-blue-500 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap"
                          >
                            편집
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {teamMembers.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">👥</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-600 mb-2">
                    {user?.role === 'system_admin' ? '사용자가 없습니다' : '팀원이 없습니다'}
                  </h3>
                  <p className="text-gray-600">
                    {user?.role === 'system_admin' ? '아직 등록된 사용자가 없습니다.' :
                     `아직 ${user?.team_name || '농장'}에 다른 멤버가 없습니다.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 편집 모달 */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">팀원 정보 편집</h2>
                  <p className="text-white/90">팀원의 정보를 수정할 수 있습니다</p>
                </div>
                <button
                  onClick={handleCancelEdit}
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
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
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
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 bg-white"
                    placeholder="user@example.com"
                  />
                </div>

                {/* 회사 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    회사
                  </label>
                  <input
                    type="text"
                    value={editFormData.company || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, company: e.target.value }))}
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
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 bg-white"
                    placeholder="010-1234-5678"
                  />
                </div>

                {/* 역할 - 관리자 계정만 표시 */}
                {(user?.role === 'system_admin' || user?.role === 'super_admin') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      역할 *
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 bg-white"
                    >
                      <option value="team_member">팀원</option>
                      <option value="team_leader">농장장</option>
                      <option value="system_admin">시스템 관리자</option>
                      {user?.role === 'super_admin' && (
                        <option value="super_admin">최고관리자</option>
                      )}
                    </select>
                  </div>
                )}

                {/* 농장 배정 - 관리자 계정만 표시 */}
                {(user?.role === 'system_admin' || user?.role === 'super_admin') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      농장
                    </label>
                    <select
                      value={editFormData.team_id}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, team_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 bg-white"
                    >
                      <option value="">농장 미배정</option>
                      {Array.isArray(farms) && farms.map((farm) => (
                        <option key={farm.id} value={farm.id}>
                          {farm.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 활성 상태 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    계정 상태
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center text-gray-600 font-medium">
                      <input
                        type="radio"
                        name="is_active"
                        checked={editFormData.is_active === true}
                        onChange={() => setEditFormData(prev => ({ ...prev, is_active: true }))}
                        className="mr-2"
                      />
                      활성
                    </label>
                    <label className="flex items-center text-gray-600 font-medium">
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

              {/* 버튼들 */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleSaveEdit(editingUser)}
                  disabled={actionLoading === editingUser}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading === editingUser ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 초대 모달 */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">➕ 멤버 초대</h3>
              <p className="text-white/90 text-sm">새로운 멤버를 팀에 초대합니다</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* 이메일 주소 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    이메일 주소 *
                  </label>
                  <input
                    type="email"
                    value={inviteFormData.email}
                    onChange={(e) => setInviteFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-600"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                {/* 역할 선택 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    역할 선택 *
                  </label>
                  <select
                    value={inviteFormData.role}
                    onChange={(e) => setInviteFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600"
                  >
                    <option value="team_member">팀 멤버</option>
                    {user?.role === 'system_admin' && (
                      <option value="team_leader">팀 리더</option>
                    )}
                  </select>
                </div>

                {/* 초대 메시지 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    초대 메시지
                  </label>
                  <textarea
                    value={inviteFormData.message}
                    onChange={(e) => setInviteFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-600"
                    placeholder="초대 메시지를 작성하세요 (선택사항)"
                    rows={3}
                  />
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancelInvite}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleInviteUser}
                  disabled={inviteLoading || !inviteFormData.email}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteLoading ? '처리 중...' : '전송하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
