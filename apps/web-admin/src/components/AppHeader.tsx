'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '../lib/auth';

interface AppHeaderProps {
  user?: AuthUser;
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
  const menuRef = useRef<HTMLDivElement>(null);
  
  // user가 없을 때 기본값 사용
  const safeUser = user || {
    id: '',
    email: '',
    name: '게스트',
    role: 'team_member' as const,
    is_approved: false,
    is_active: false
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // 사용자 역할에 따른 권한 확인
  // 모든 사용자가 사용자 관리 페이지에 접근 가능 (내용만 다름)
  const canAccessUserManagement = true; // 모든 계정이 접근 가능
  const canManageUsers = safeUser.role === 'super_admin' || safeUser.role === 'system_admin' || safeUser.email === 'sky3rain7@gmail.com';
  const canManageFarms = safeUser.role === 'super_admin' || safeUser.role === 'system_admin' || safeUser.role === 'team_leader' || safeUser.role === 'team_member' || safeUser.email === 'sky3rain7@gmail.com';
  

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.push('/');
    }
  };

  const handleHomeClick = () => {
    // 홈 아이콘 클릭 시 대시보드로 이동
    router.push('/');
  };

  const handleTitleClick = () => {
    // 타이틀 클릭 시 페이지 새로고침
    if (isDashboard && onDashboardRefresh) {
      onDashboardRefresh();
    } else if (!isDashboard) {
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('../lib/auth');
      await signOut();
      // 로그아웃 후 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 오류가 발생해도 로그인 페이지로 이동
      window.location.href = '/login';
    }
  };

  // 햄버거 메뉴용 메뉴 아이템들 (모든 계정이 사용자 관리 포함)
  const menuItems = [
    {
      label: '알림설정',
      path: '/notifications',
      color: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
    },
    // 모든 계정이 사용자 관리 포함 (통일성)
    ...(canAccessUserManagement ? [{
      label: '사용자 관리',
      path: '/team',
      color: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    }] : []),
    // 관리자만 관리자 페이지 표시
    ...(canManageUsers ? [{
      label: '관리자 페이지',
      path: '/admin',
      color: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
    }] : []),
    ...(canManageFarms ? [{
      label: safeUser.role === 'team_member' ? '농장 보기' : '농장 관리',
      path: '/beds',
      color: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    }] : []),
    {
      label: '양액계산',
      path: '/nutrients/plan',
      color: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    },
    {
      label: '시세정보',
      path: '/market',
      color: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
    },
    {
      label: '마이페이지',
      path: '/my-page',
      color: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700'
    }
  ];


  return (
    <>
      <header ref={menuRef} className="bg-white/80 backdrop-blur-md shadow-xl border-b border-white/20 sticky top-0 z-[50] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:opacity-80 transition-opacity duration-200"
                onClick={handleHomeClick}
                title="홈으로"
              >
                <span className="text-2xl">🏠</span>
              </div>
              <div 
                className="flex items-center space-x-4 cursor-pointer hover:opacity-90 transition-all duration-300"
                onClick={handleTitleClick}
              >
                <div>
                  {isDashboard ? (
                    <>
                      <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                        {title}
                      </h1>
                      <p className="text-xs text-gray-600 font-semibold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent">
                        {subtitle}
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {title}
                      </h1>
                      <p className="text-sm text-gray-500 font-medium">
                        {subtitle}
                      </p>
                    </>
                  )}
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
                <div className="flex items-center space-x-3">
                  <span className="text-gray-600 font-semibold">
                    {safeUser.name} ({safeUser.email === 'sky3rain7@gmail.com' ? '최종 관리자' : 
                     safeUser.role === 'system_admin' ? '시스템 관리자' : 
                     safeUser.role === 'team_leader' ? '농장장' : '팀원'})
                  </span>
                  {safeUser.team_name && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {safeUser.team_name}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    safeUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {safeUser.is_active ? '활성' : '비활성'}
                  </span>
                </div>
              </div>

                  {/* 주요 메뉴 버튼들 - 모든 계정이 사용자 관리, 관리자는 추가로 관리자 페이지 */}
                  {canAccessUserManagement && (
                    <button
                      onClick={() => router.push('/team')}
                      className="hidden md:flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg text-base font-bold transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      사용자 관리
                    </button>
                  )}
                  {canManageUsers && (
                    <button
                      onClick={() => router.push('/admin')}
                      className="hidden md:flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-base font-bold transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      관리자 페이지
                    </button>
                  )}
              {canManageFarms && (
                <button
                  onClick={() => router.push('/beds')}
                  className="hidden md:flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-base font-bold transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                >
                  {safeUser.role === 'team_member' ? '농장 보기' : '농장 관리'}
                </button>
              )}

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

        {/* 햄버거 드롭다운 메뉴 */}
        {isMenuOpen && (
          <div className="absolute top-full right-4 w-80 bg-white shadow-2xl border border-gray-200 rounded-b-2xl z-[60] overflow-hidden">
            <div className="p-4">
              {/* 메뉴 헤더 */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-sm">🌱</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">메뉴</h3>
                    <p className="text-xs text-gray-500">
                      {safeUser.email === 'sky3rain7@gmail.com' ? '최종 관리자' : 
                       safeUser.role === 'system_admin' ? '시스템 관리자' : 
                       safeUser.role === 'team_leader' ? '농장장' : '팀원'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 메뉴 아이템들 */}
              <div className="space-y-2 mb-4">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      router.push(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg bg-gradient-to-r ${item.color} text-white text-sm font-bold transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 text-sm font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                로그아웃
              </button>

              {/* 시스템 상태 */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span>시스템 정상 운영 중</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
