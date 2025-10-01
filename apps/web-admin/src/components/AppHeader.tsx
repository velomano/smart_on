'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '../lib/auth';

interface AppHeaderProps {
  user?: AuthUser;
  title?: string;
  subtitle?: string;
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
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [hasNewNotice, setHasNewNotice] = useState(false);
  const [isWritingNotice, setIsWritingNotice] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeType, setNewNoticeType] = useState<'new' | 'update' | 'general'>('general');
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [editNoticeTitle, setEditNoticeTitle] = useState('');
  const [editNoticeContent, setEditNoticeContent] = useState('');
  const [editNoticeType, setEditNoticeType] = useState<'new' | 'update' | 'general'>('general');
  const menuRef = useRef<HTMLDivElement>(null);
  
  // user가 없을 때 기본값 사용 (로딩 중일 때는 null로 처리)
  const safeUser = user || {
    id: '',
    email: '',
    name: '로딩 중...',
    role: 'team_member' as const,
    is_approved: false,
    is_active: false,
    team_name: null
  };

  // 사용자 정보 로그 (디버깅용)
  console.log('🔍 AppHeader - 받은 사용자 정보:', user);
  console.log('🔍 AppHeader - 사용할 사용자 정보:', safeUser);

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

  // 공지사항 가져오기
  const fetchNotices = async () => {
    setIsLoadingNotices(true);
    try {
      const response = await fetch('/api/notices');
      
      // 응답 상태 확인
      if (!response.ok) {
        console.error('공지사항 API 응답 오류:', response.status, response.statusText);
        return;
      }
      
      // Content-Type 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('공지사항 API가 JSON을 반환하지 않음:', contentType);
        return;
      }
      
      const data = await response.json();
      if (data.ok && data.notices) {
        setNotices(data.notices);
        const hasNew = data.notices.some((notice: any) => notice.isNew);
        setHasNewNotice(hasNew);
      }
    } catch (error) {
      console.error('공지사항 가져오기 오류:', error);
    } finally {
      setIsLoadingNotices(false);
    }
  };

  // 공지사항 데이터 가져오기
  useEffect(() => {
    fetchNotices();
    
    // 2분마다 새 공지사항 확인
    const interval = setInterval(fetchNotices, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 컴포넌트 언마운트 시 스크롤 복원
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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

  const handleNoticeClick = () => {
    setIsNoticeOpen(!isNoticeOpen);
    if (!isNoticeOpen) {
      // 공지사항을 확인했으므로 새 공지 표시 해제
      setHasNewNotice(false);
      localStorage.setItem('lastNoticeCheck', new Date().getTime().toString());
    }
  };

  // 공지사항 작성 함수
  const handleWriteNotice = async () => {
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newNoticeTitle,
          content: newNoticeContent,
          type: newNoticeType
        })
      });

      // 응답 상태 확인
      if (!response.ok) {
        console.error('공지사항 작성 API 응답 오류:', response.status, response.statusText);
        alert('공지사항 작성 중 서버 오류가 발생했습니다.');
        return;
      }
      
      // Content-Type 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('공지사항 작성 API가 JSON을 반환하지 않음:', contentType);
        alert('공지사항 작성 중 응답 형식 오류가 발생했습니다.');
        return;
      }

      const result = await response.json();

      if (result.ok) {
        alert('공지사항이 성공적으로 작성되었습니다!');
        // 폼 초기화
        setNewNoticeTitle('');
        setNewNoticeContent('');
        setNewNoticeType('general');
        setIsWritingNotice(false);
        // 공지사항 목록 새로고침
        fetchNotices();
      } else {
        alert('공지사항 작성에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('공지사항 작성 오류:', error);
      alert('공지사항 작성 중 오류가 발생했습니다.');
    }
  };

  // 공지사항 편집 시작
  const handleStartEdit = (notice: any) => {
    setEditingNoticeId(notice.id);
    setEditNoticeTitle(notice.title);
    setEditNoticeContent(notice.content);
    setEditNoticeType(notice.type);
  };

  // 공지사항 편집 취소
  const handleCancelEdit = () => {
    setEditingNoticeId(null);
    setEditNoticeTitle('');
    setEditNoticeContent('');
    setEditNoticeType('general');
  };

  // 공지사항 편집 저장
  const handleSaveEdit = async (noticeId: string) => {
    if (!editNoticeTitle.trim() || !editNoticeContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/notices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: noticeId,
          title: editNoticeTitle,
          content: editNoticeContent,
          type: editNoticeType
        })
      });

      if (!response.ok) {
        console.error('공지사항 수정 API 응답 오류:', response.status, response.statusText);
        alert('공지사항 수정 중 서버 오류가 발생했습니다.');
        return;
      }

      const result = await response.json();

      if (result.ok) {
        alert('공지사항이 성공적으로 수정되었습니다!');
        handleCancelEdit();
        fetchNotices();
      } else {
        alert('공지사항 수정에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('공지사항 수정 오류:', error);
      alert('공지사항 수정 중 오류가 발생했습니다.');
    }
  };

  // 공지사항 삭제
  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/notices', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: noticeId })
      });

      if (!response.ok) {
        console.error('공지사항 삭제 API 응답 오류:', response.status, response.statusText);
        alert('공지사항 삭제 중 서버 오류가 발생했습니다.');
        return;
      }

      const result = await response.json();

      if (result.ok) {
        alert('공지사항이 성공적으로 삭제되었습니다!');
        fetchNotices();
      } else {
        alert('공지사항 삭제에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('공지사항 삭제 오류:', error);
      alert('공지사항 삭제 중 오류가 발생했습니다.');
    }
  };

  // 모달이 열려있을 때 배경 스크롤 방지
  useEffect(() => {
    if (isNoticeOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isNoticeOpen]);

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

  // 햄버거 메뉴용 메뉴 아이템들 (사용설명서를 가장 상단에 배치)
  const menuItems = [
    {
      label: '사용설명서',
      path: '/help',
      color: 'from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
    },
    {
      label: '알림설정',
      path: '/notifications',
      color: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
    },
    // 관리자만 관리자 페이지 표시 (상단과 동일한 순서)
    ...(canManageUsers ? [{
      label: '승인 관리',
      path: '/admin',
      color: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
    }] : []),
    // 모든 계정이 멤버 관리 포함
    ...(canAccessUserManagement ? [{
      label: '멤버 관리',
      path: '/team',
      color: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    }] : []),
    ...(canManageFarms ? [{
      label: safeUser.role === 'team_member' ? '농장 보기' : '농장 관리',
      path: '/beds',
      color: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    }] : []),
    {
      label: '배양액 찾기',
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
    },
    // 시스템 관리자만 시스템 모니터링 표시 (메뉴 가장 하단)
    ...(safeUser.role === 'system_admin' ? [{
      label: '시스템 모니터링',
      path: '/system',
      color: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
    }] : [])
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
                  {(title || subtitle) && (isDashboard ? (
                    <>
                      {title && (
                        <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                          {title}
                        </h1>
                      )}
                      {subtitle && (
                        <p className="text-xs text-gray-600 font-semibold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent">
                          {subtitle}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {title && (
                        <h1 className="text-3xl font-black text-gray-600 tracking-tight">
                          {title}
                        </h1>
                      )}
                      {subtitle && (
                        <p className="text-sm text-gray-500 font-medium">
                          {subtitle}
                        </p>
                      )}
                    </>
                  ))}
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


                  {/* 주요 메뉴 버튼들 - 관리자는 관리자 페이지가 먼저, 모든 계정이 사용자 관리 */}
                  {canManageUsers && (
                    <button
                      onClick={() => router.push('/admin')}
                      className="hidden md:flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-base font-bold transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      승인 관리
                    </button>
                  )}
                  {canAccessUserManagement && (
                    <button
                      onClick={() => router.push('/team')}
                      className="hidden md:flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg text-base font-bold transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      멤버 관리
                    </button>
                  )}
              {canManageFarms && (
                <button
                  onClick={() => router.push('/beds')}
                  className="hidden md:flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-base font-bold transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  {safeUser.role === 'team_member' ? '농장 보기' : '농장 관리'}
                </button>
              )}
              

              {/* 햄버거 메뉴 버튼 */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="relative w-12 h-12 flex flex-col justify-center items-center space-y-1 group p-2 -m-2"
                aria-label="메뉴 열기"
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
          <div className="absolute top-full right-0 sm:right-4 w-full sm:w-80 bg-white shadow-2xl border border-gray-200 rounded-b-2xl z-[60] overflow-hidden">
            <div className="p-4">
              {/* 메뉴 헤더 */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-sm">🌱</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-600">메뉴</h3>
                    <p className="text-xs text-gray-500">
                      {safeUser.email === 'sky3rain7@gmail.com' ? '최종 관리자' : 
                       safeUser.role === 'system_admin' ? '시스템 관리자' : 
                       safeUser.role === 'team_leader' ? '농장장' : '팀원'}
                    </p>
                  </div>
                </div>
                
                {/* 작은 공지사항 아이콘 */}
                <div className="relative">
                  <button
                    onClick={handleNoticeClick}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                      hasNewNotice 
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 animate-pulse' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    title={hasNewNotice ? '새 공지사항이 있습니다!' : '공지사항'}
                  >
                    <span className={`text-sm ${hasNewNotice ? '' : 'grayscale'}`}>
                      📢
                    </span>
                  </button>
                  {hasNewNotice && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                  )}
                </div>
              </div>

              {/* 메뉴 아이템들 */}
              <div className="space-y-1 mb-4">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      router.push(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r ${item.color} text-white text-sm font-bold transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5`}
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

        {/* 공지사항 모달 */}
        {isNoticeOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ paddingTop: '480px' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl sm:w-[700px] max-h-[60vh] overflow-hidden mx-2 sm:mx-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="text-2xl mr-2">📢</span>
                    공지사항
                  </h2>
                  <button
                    onClick={() => setIsNoticeOpen(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
                {/* 시스템 관리자용 공지사항 작성 버튼 */}
                {safeUser.role === 'system_admin' && (
                  <div className="mb-6">
                    <button
                      onClick={() => setIsWritingNotice(!isWritingNotice)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                    >
                      <span className="text-lg mr-2">✏️</span>
                      {isWritingNotice ? '작성 취소' : '새 공지사항 작성'}
                    </button>
                  </div>
                )}

                {/* 공지사항 작성 폼 */}
                {isWritingNotice && safeUser.role === 'system_admin' && (
                  <div className="mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-gray-600 mb-4">새 공지사항 작성</h3>
                    
                    <div className="space-y-4">
                      {/* 제목 입력 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">
                          제목 *
                        </label>
                        <input
                          type="text"
                          value={newNoticeTitle}
                          onChange={(e) => setNewNoticeTitle(e.target.value)}
                          placeholder="공지사항 제목을 입력하세요"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600"
                        />
                      </div>

                      {/* 내용 입력 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">
                          내용 *
                        </label>
                        <textarea
                          value={newNoticeContent}
                          onChange={(e) => setNewNoticeContent(e.target.value)}
                          placeholder="공지사항 내용을 입력하세요"
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600 resize-none"
                        />
                      </div>

                      {/* 타입 선택 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">
                          공지 유형
                        </label>
                        <select
                          value={newNoticeType}
                          onChange={(e) => setNewNoticeType(e.target.value as 'new' | 'update' | 'general')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600"
                        >
                          <option value="general">일반</option>
                          <option value="new">새 기능</option>
                          <option value="update">업데이트</option>
                        </select>
                      </div>

                      {/* 작성 버튼 */}
                      <div className="flex space-x-3">
                        <button
                          onClick={handleWriteNotice}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                          공지사항 작성
                        </button>
                        <button
                          onClick={() => {
                            setIsWritingNotice(false);
                            setNewNoticeTitle('');
                            setNewNoticeContent('');
                            setNewNoticeType('general');
                          }}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {isLoadingNotices ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">공지사항을 불러오는 중...</span>
                    </div>
                  ) : notices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl mb-2 block">📢</span>
                      <p>등록된 공지사항이 없습니다.</p>
                    </div>
                  ) : (
                    notices.map((notice) => {
                      const getTypeColor = (type: string) => {
                        switch (type) {
                          case 'new':
                            return { border: 'border-green-500', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800', text: 'NEW' };
                          case 'update':
                            return { border: 'border-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', text: '업데이트' };
                          default:
                            return { border: 'border-purple-500', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800', text: '일반' };
                        }
                      };
                      
                      const typeColor = getTypeColor(notice.type);
                      
                      // 편집 모드인지 확인
                      const isEditing = editingNoticeId === notice.id;

                      return (
                        <div key={notice.id} className={`border-l-4 ${typeColor.border} pl-4 py-3 ${typeColor.bg} rounded-r-lg`}>
                          {isEditing ? (
                            // 편집 모드
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">
                                  제목 *
                                </label>
                                <input
                                  type="text"
                                  value={editNoticeTitle}
                                  onChange={(e) => setEditNoticeTitle(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">
                                  내용 *
                                </label>
                                <textarea
                                  value={editNoticeContent}
                                  onChange={(e) => setEditNoticeContent(e.target.value)}
                                  rows={4}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600 resize-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">
                                  공지 유형
                                </label>
                                <select
                                  value={editNoticeType}
                                  onChange={(e) => setEditNoticeType(e.target.value as 'new' | 'update' | 'general')}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600"
                                >
                                  <option value="general">일반</option>
                                  <option value="new">새 기능</option>
                                  <option value="update">업데이트</option>
                                </select>
                              </div>

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSaveEdit(notice.id)}
                                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            // 일반 표시 모드
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-600 text-lg">{notice.title}</h3>
                                <div className="flex items-center space-x-2">
                                  {notice.isNew && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      NEW
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColor.badge}`}>
                                    {typeColor.text}
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-600 mb-2 whitespace-pre-wrap">{notice.content}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-sm text-gray-500">
                                  <span className="mr-2">📅</span>
                                  <span>{notice.date}</span>
                                </div>
                                {safeUser.role === 'system_admin' && (
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleStartEdit(notice)}
                                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                                    >
                                      ✏️ 편집
                                    </button>
                                    <button
                                      onClick={() => handleDeleteNotice(notice.id)}
                                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                                    >
                                      🗑️ 삭제
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    💡 더 자세한 정보는 관리자에게 문의하세요
                  </p>
                  <button
                    onClick={() => setIsNoticeOpen(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
