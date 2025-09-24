'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getApprovedUsers, updateUser, AuthUser } from '../../lib/mockAuth';

interface TeamMember extends AuthUser {
  team_name?: string;
  is_active?: boolean;
  role?: 'system_admin' | 'team_leader' | 'team_member';
  company?: string;
  phone?: string;
}

export default function TeamPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [teamMembers, setTeamMembers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    email: string;
    role: string;
    is_active: boolean;
  }>({
    name: '',
    email: '',
    role: 'team_member',
    is_active: true
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.is_approved || !currentUser.is_active) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      loadTeamMembers();
    };
    checkAuth();
  }, [router]);

  const loadTeamMembers = async () => {
    try {
      const result = await getApprovedUsers();
      if (result.success) {
        const allUsers = result.users;
        // 현재 사용자의 조 멤버들만 필터링
        const members = allUsers.filter(member => 
          member.team_id === user?.team_id && member.id !== user?.id
        );
        setTeamMembers(members as TeamMember[]);
      }
    } catch {
      console.error('Error loading team members');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (member: TeamMember) => {
    setEditingUser(member.id);
    setEditFormData({
      name: member.name || '',
      email: member.email,
      role: member.role || 'team_member',
      is_active: member.is_active ?? true
    });
  };

  const handleSaveEdit = async (memberId: string) => {
    setActionLoading(memberId);
    try {
      const updates = {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
        is_active: editFormData.is_active
      };

      const result = await updateUser(memberId, updates as Partial<AuthUser>);
      if (result.success) {
        setTeamMembers(prev =>
          prev.map(member =>
            member.id === memberId ? { ...member, ...updates } as AuthUser : member
          )
        );
        setEditingUser(null);
        alert('조원 정보가 업데이트되었습니다.');
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
      is_active: true
    });
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
      <header className="bg-white/80 backdrop-blur-md shadow-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  {user?.team_name || '조원'} 관리
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  {user?.role === 'team_leader' ? '조장 권한으로 조원을 관리합니다' : '조원 정보를 확인합니다'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                대시보드
              </button>
              <button
                onClick={async () => {
                  const { signOut } = await import('../../lib/mockAuth');
                  await signOut();
                }}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2.5 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  👥 조원 목록
                </h3>
                <p className="text-gray-600">
                  {user?.team_name || '조'}의 멤버들을 관리합니다
                </p>
              </div>
              <div className="text-sm text-gray-500">
                총 {teamMembers.length}명
              </div>
            </div>

            <div className="space-y-6">
              {teamMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">
                          {(member.role || 'team_member') === 'team_leader' ? '👨‍💼' : '👤'}
                        </span>
                      </div>
                      <div>
                        {editingUser === member.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editFormData.name || ''}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="이름"
                            />
                            <input
                              type="email"
                              value={editFormData.email || ''}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="이메일"
                            />
                          </div>
                        ) : (
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">{member.name || '이름 없음'}</h4>
                            <p className="text-gray-600 font-medium">{member.email}</p>
                            {(member as any).company && (
                              <p className="text-sm text-gray-500">🏢 {(member as any).company}</p>
                            )}
                            {(member as any).phone && (
                              <p className="text-sm text-gray-500">📞 {(member as any).phone}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-500 font-medium">
                          {(member.role || 'team_member') === 'team_leader' ? '조장' : '조원'}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          (member.is_active ?? true) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {(member.is_active ?? true) ? '활성' : '비활성'}
                        </div>
                      </div>
                      {user?.role === 'team_leader' && (
                        <div className="flex space-x-2">
                          {editingUser === member.id ? (
                            <>
                              <button
                                onClick={() => handleCancelEdit()}
                                className="bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors"
                              >
                                취소
                              </button>
                              <button
                                onClick={() => handleSaveEdit(member.id)}
                                disabled={actionLoading === member.id}
                                className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === member.id ? '저장 중...' : '저장'}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEditUser(member)}
                              className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                            >
                              편집
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {editingUser === member.id && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            상태
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`status-${member.id}`}
                                checked={editFormData.is_active === true}
                                onChange={() => setEditFormData(prev => ({ ...prev, is_active: true }))}
                                className="mr-2"
                              />
                              활성
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`status-${member.id}`}
                                checked={editFormData.is_active === false}
                                onChange={() => setEditFormData(prev => ({ ...prev, is_active: false }))}
                                className="mr-2"
                              />
                              비활성
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {teamMembers.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">👥</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">조원이 없습니다</h3>
                  <p className="text-gray-600">아직 {user?.team_name || '조'}에 다른 멤버가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
