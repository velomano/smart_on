'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '../../components/AppHeader';
import { AuthUser, getCurrentUser, getApprovedUsers, updateUserSettings } from '../../lib/auth';

export default function TeamManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [teamMembers, setTeamMembers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'team_member' as 'team_member' | 'team_leader',
    is_active: true
  });

  // 인증 확인
  const checkAuth = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.is_approved || 
        (currentUser.role !== 'team_leader' && currentUser.role !== 'super_admin' && currentUser.role !== 'system_admin')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  };

  // 팀원 데이터 로드
  const loadTeamMembers = async () => {
    try {
      const usersResult = await getApprovedUsers();
      const allUsers = usersResult.users || [];
      
      let myTeamMembers: AuthUser[] = [];
      
      if (user?.role === 'super_admin' || user?.role === 'system_admin') {
        // 최고관리자와 시스템 관리자는 모든 사용자 볼 수 있음
        myTeamMembers = allUsers.filter(member => 
          member.role !== 'super_admin' && member.role !== 'system_admin'
        );
      } else if (user?.team_id) {
        // 농장장은 자신의 농장에 속한 모든 멤버들 필터링 (농장장 자신 포함)
        myTeamMembers = allUsers.filter(member => 
          member.team_id === user.team_id &&
          member.role !== 'super_admin' && member.role !== 'system_admin'
        );
      } else {
        // team_id가 없는 경우 빈 배열 반환 (보안상 안전)
        console.log('⚠️ 팀원 관리 - team_id가 설정되지 않았습니다:', {
          email: user?.email,
          role: user?.role
        });
        myTeamMembers = [];
        console.log('🔒 team_id가 없어서 팀원을 표시하지 않습니다');
      }
      
      setTeamMembers(myTeamMembers as AuthUser[]);
      console.log('팀원 관리 - 현재 사용자:', user);
      console.log('팀원 관리 - 팀원 목록:', myTeamMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await checkAuth();
    };
    initialize();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadTeamMembers();
      setLoading(false);
    }
  }, [user]);

  // 편집 시작
  const handleEdit = (member: AuthUser) => {
    setEditingUser(member.id);
    setEditForm({
      name: member.name || '',
      email: member.email,
      role: member.role as 'team_member' | 'team_leader',
      is_active: member.is_active ?? true
    });
  };

  // 편집 저장
  const handleSave = async () => {
    if (!editingUser) return;

    try {
      // 실제로는 API 호출이지만 여기서는 로컬 상태만 업데이트
      setTeamMembers(prev => prev.map(member => 
        member.id === editingUser 
          ? { ...member, ...editForm }
          : member
      ));
      
      setEditingUser(null);
      setEditForm({ name: '', email: '', role: 'team_member', is_active: true });
    } catch (error) {
      console.error('Error updating team member:', error);
    }
  };

  // 편집 취소
  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({ name: '', email: '', role: 'team_member', is_active: true });
  };

  // 팀원 활성화/비활성화
  const toggleMemberStatus = async (memberId: string) => {
    try {
      setTeamMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, is_active: !member.is_active }
          : member
      ));
    } catch (error) {
      console.error('Error toggling member status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <AppHeader 
        user={user}
        title="팀원 관리"
        subtitle="자신의 농장 팀원들을 관리하세요"
        isDashboard={false}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 농장 정보 */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">👥</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.team_name} 팀원 관리</h2>
                <p className="text-gray-600">총 {teamMembers.length}명의 팀원</p>
              </div>
            </div>
          </div>

          {/* 팀원 목록 */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">팀원 목록</h3>
              <div className="text-sm text-gray-500">
                활성: {teamMembers.filter(m => m.is_active).length}명 / 
                비활성: {teamMembers.filter(m => !m.is_active).length}명
              </div>
            </div>

            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">👥</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">팀원이 없습니다</h3>
                <p className="text-gray-600">아직 등록된 팀원이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                  >
                    {editingUser === member.id ? (
                      // 편집 모드
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              이름
                            </label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              이메일
                            </label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              역할
                            </label>
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as 'team_member' | 'team_leader' }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                              <option value="team_member">팀원</option>
                              <option value="team_leader">농장장</option>
                            </select>
                          </div>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={editForm.is_active}
                                onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                              />
                              <span className="text-sm font-medium text-gray-700">활성 상태</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={handleSave}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                          >
                            저장
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 보기 모드
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-xl">👤</span>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{member.name}</h4>
                            <p className="text-gray-600">{member.email}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                member.role === 'team_leader' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {member.role === 'team_leader' ? '농장장' : '팀원'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                member.is_active 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {member.is_active ? '활성' : '비활성'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleMemberStatus(member.id)}
                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-200 ${
                              member.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {member.is_active ? '비활성화' : '활성화'}
                          </button>
                          <button
                            onClick={() => handleEdit(member)}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                          >
                            편집
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
