'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../src/components/AppHeader';

interface InviteData {
  id: string;
  email: string;
  role: string;
  message: string;
  invited_by_name: string;
  expires_at: string;
  status: string;
}

export default function InviteAcceptPage({ params }: { params: { token: string } }) {
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: ''
  });
  const router = useRouter();

  useEffect(() => {
    fetchInviteData();
  }, [params.token]);

  const fetchInviteData = async () => {
    try {
      const response = await fetch(`/api/invite/${params.token}`);
      const result = await response.json();

      if (result.ok) {
        setInviteData(result.data);
        setUserForm(prev => ({
          ...prev,
          name: result.data.email.split('@')[0] // 이메일에서 기본 이름 추출
        }));
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('초대 정보 조회 오류:', error);
      setError('초대 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!userForm.name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    if (!userForm.password.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    if (userForm.password !== userForm.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (userForm.password.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setAccepting(true);
    try {
      const response = await fetch(`/api/invite/${params.token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userForm.name,
          password: userForm.password,
          phone: userForm.phone,
          company: userForm.company
        })
      });

      const result = await response.json();

      if (result.ok) {
        alert('계정이 성공적으로 생성되었습니다! 로그인 페이지로 이동합니다.');
        router.push('/login');
      } else {
        alert(`계정 생성 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('계정 생성 오류:', error);
      alert('계정 생성 중 오류가 발생했습니다.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">초대 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">초대 오류</h1>
          <p className="text-gray-600 mb-6">{error || '유효하지 않은 초대 링크입니다.'}</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(inviteData.expires_at) < new Date();
  const roleText = inviteData.role === 'team_member' ? '팀 멤버' : 
                  inviteData.role === 'team_leader' ? '팀 리더' : 
                  inviteData.role === 'system_admin' ? '시스템 관리자' : '사용자';

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={null} />
      
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="text-green-500 text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">초대 수락</h1>
            <p className="text-gray-600">
              <span className="font-semibold">{inviteData.invited_by_name}</span>님이 
              <span className="font-semibold text-blue-600"> {roleText}</span>로 초대하셨습니다.
            </p>
          </div>

          {inviteData.message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">초대 메시지</h3>
              <p className="text-blue-800">{inviteData.message}</p>
            </div>
          )}

          {isExpired ? (
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⏰</div>
              <h2 className="text-xl font-bold text-red-600 mb-2">초대 만료</h2>
              <p className="text-gray-600 mb-6">이 초대는 만료되었습니다. 관리자에게 새로운 초대를 요청해주세요.</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                로그인 페이지로 이동
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  비밀번호 *
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="6자 이상의 비밀번호"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  비밀번호 확인 *
                </label>
                <input
                  type="password"
                  value={userForm.confirmPassword}
                  onChange={(e) => setUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="비밀번호를 다시 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  회사/농장명
                </label>
                <input
                  type="text"
                  value={userForm.company}
                  onChange={(e) => setUserForm(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="회사 또는 농장명"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleAcceptInvite}
                  disabled={accepting}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  {accepting ? '계정 생성 중...' : '초대 수락 및 계정 생성'}
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => router.push('/login')}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  이미 계정이 있으신가요? 로그인하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
