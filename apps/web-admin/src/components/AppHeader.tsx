'use client';

import React, { useState } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleLogout = async () => {
    const { signOut } = await import('../lib/mockAuth');
    await signOut();
  };

  const menuItems = [
    ...(canManageUsers ? [{
      label: '👥 사용자 관리',
      path: '/admin',
      color: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    }] : []),
    ...(canManageMyTeamMembers ? [{
      label: '👨‍👩‍👧‍👦 팀원 관리',
      path: '/team-management',
      color: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
    }] : []),
    ...(canManageFarms ? [{
      label: user.role === 'team_member' ? '🌾 농장 보기' : '🌾 농장 관리',
      path: '/beds',
      color: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    }] : []),
    ...(canManageTeamMembers && !canManageUsers && user.role !== 'team_leader' ? [{
      label: '👥 팀원 보기',
      path: '/team',
      color: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    }] : []),
    {
      label: '🌱 양액계산',
      path: '/nutrients/plan',
      color: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
    },
    {
      label: '📊 시세정보',
      path: '/market',
      color: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
    },
    {
      label: '🔔 알림설정',
      path: '/notifications',
      color: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
    }
  ];

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md shadow-xl border-b border-white/20 sticky top-0 z-[50]">
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
              {/* 데스크톱 사용자 정보 */}
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

              {/* 햄버거 메뉴 버튼 */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="relative w-10 h-10 flex flex-col justify-center items-center space-y-1 group"
              >
                <span className={`w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 햄버거 메뉴 오버레이 */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[100]"
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[110]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* 메뉴 헤더 */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🌱</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">메뉴</h2>
                    <p className="text-sm text-gray-500">
                      {user.email === 'sky3rain7@gmail.com' ? '최종 관리자' : 
                       user.role === 'system_admin' ? '시스템 관리자' : 
                       user.role === 'team_leader' ? '농장장' : '팀원'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-500 text-xl">×</span>
                </button>
              </div>

              {/* 메뉴 아이템들 */}
              <div className="space-y-3 mb-8">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      router.push(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r ${item.color} text-white font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🚪 로그아웃
              </button>

              {/* 시스템 상태 */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>시스템 정상 운영 중</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
