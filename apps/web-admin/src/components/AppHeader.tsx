'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '../lib/mockAuth';

interface AppHeaderProps {
  user: AuthUser;
  title: string;
  subtitle: string;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
  isDashboard?: boolean;
  onDashboardRefresh?: () => void;
}

export default function AppHeader({ 
  user, 
  title, 
  subtitle, 
  showBackButton = true, 
  backButtonText = '대시보드',
  onBackClick,
  isDashboard = false,
  onDashboardRefresh
}: AppHeaderProps) {
  const router = useRouter();

  // 사용자 역할에 따른 권한 확인
  const canManageUsers = user.role === 'system_admin' || user.email === 'sky3rain7@gmail.com';
  const canManageTeamMembers = user.role === 'system_admin' || user.role === 'team_leader' || user.role === 'team_member';
  const canManageFarms = user.role === 'system_admin' || user.role === 'team_leader' || user.role === 'team_member' || user.email === 'sky3rain7@gmail.com';
  const canManageMyTeamMembers = user.role === 'team_leader'; // 농장장은 자신의 팀원만 관리

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.push('/');
    }
  };

  const handleTitleClick = () => {
    if (isDashboard && onDashboardRefresh) {
      onDashboardRefresh();
    } else if (!isDashboard) {
      handleBackClick();
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-xl border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🌱</span>
            </div>
            <div 
              className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={handleTitleClick}
            >
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  {title}
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-600 font-medium">시스템 정상</span>
              </div>
              <div className="text-gray-400">|</div>
              <span className="text-gray-600">
                {user.name} ({user.email === 'sky3rain7@gmail.com' ? '최종 관리자' : 
                 user.role === 'system_admin' ? '시스템 관리자' : 
                 user.role === 'team_leader' ? '농장장' : '팀원'})
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {canManageUsers && (
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2.5 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  사용자 관리
                </button>
              )}
              {canManageMyTeamMembers && (
                <button
                  onClick={() => router.push('/team-management')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  팀원 관리
                </button>
              )}
              {canManageFarms && (
                <button
                  onClick={() => router.push('/beds')}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {user.role === 'team_member' ? '농장 보기' : '농장 관리'}
                </button>
              )}
              {canManageTeamMembers && !canManageUsers && user.role !== 'team_leader' && (
                <button
                  onClick={() => router.push('/team')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  팀원 보기
                </button>
              )}
              <button
                onClick={() => router.push('/nutrients/plan')}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🌱 양액계산
              </button>
              <button
                onClick={() => router.push('/market')}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                📊 시세정보
              </button>
              <button
                onClick={async () => {
                  const { signOut } = await import('../lib/mockAuth');
                  await signOut();
                }}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2.5 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
