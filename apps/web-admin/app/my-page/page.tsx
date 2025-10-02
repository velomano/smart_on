'use client';
import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { getCurrentUser, updateUserWeatherRegion } from '@/lib/auth';
import { AuthUser } from '@/lib/auth';
import { UserService, UserProfile, UserSettings } from '@/lib/userService';
import { User } from '@supabase/supabase-js';
import { loadNotificationSettings, saveNotificationSettings, NotificationSettings } from '@/lib/notificationService';

export default function MyPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState({
    telegramChatId: '',
    notificationEnabled: true,
    emailNotification: true,
    weatherRegion: '서울'
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Supabase 사용자 데이터 상태
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [userRoleInfo, setUserRoleInfo] = useState<{ role?: string; tenant_id?: string } | null>(null);

  // 인증 확인 및 Supabase 데이터 로드
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          window.location.href = '/login';
          return;
        }
        setUser(currentUser);

        // Supabase 연결 시도 (Graceful Handling)
        try {
          const supabaseAuth = await UserService.getCurrentSupabaseUser();
          if (supabaseAuth?.id) {
            try {
              setSupabaseUser(supabaseAuth as any);
              
              // 실제 Supabase 데이터 로드
              const pageData = await UserService.getMyPageData(supabaseAuth.id);
              if (pageData.profile) {
                setUserProfile(pageData.profile);
                setProfileForm({
                  name: pageData.profile.name || '',
                  email: pageData.profile.email || '',
                  phone: '' // phone 필드가 user 테이블에 없다면 별도 관리
                });
              }
              if (pageData.settings) {
                setUserSettings(pageData.settings);
                setSettings(prev => ({
                  ...prev,
                  telegramChatId: pageData.settings?.telegram_chat_id || '',
                  notificationEnabled: true // 실제 설정에 따라
                }));
              } else {
                // 새 사용자의 경우 기본 설정 생성
                try {
                  await UserService.createDefaultUserSettings(supabaseAuth.id);
                  setSaveStatus('기본 설정이 생성되었습니다.');
                } catch (createError) {
                  console.warn('기본 설정 생성 실패:', createError);
                }
              }
              if (pageData.roleInfo) {
                setUserRoleInfo(pageData.roleInfo);
              }
            } catch (supabaseDataError) {
              console.warn('Supabase 데이터 로드 실패, MockAuth 전환:', supabaseDataError);
              // Supabase 데이터 로드 실패 시 기존 로직 사용
              setProfileForm({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: ''
              });
            }
          } else {
            console.warn('Supabase 인증 실패 - mockAuth로 전환');
            // Supabase 인증 실패 시 기존 로직 사용
            setProfileForm({
              name: currentUser.name || '',
              email: currentUser.email || '',
              phone: ''
            });
          }
        } catch (error) {
          console.warn('Supabase 전체 연동 실패, MockAuth로 전환:', error);
          // Supabase 전체 오류 시 기존 로직 유지
          setProfileForm({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: ''
          });
        }

        // 로컬 설정 백업 로드
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } else {
          // 사용자의 날씨 지역이 있으면 설정에 반영
          if (currentUser.weather_region) {
            setSettings(prev => ({ ...prev, weatherRegion: currentUser.weather_region || prev.weatherRegion }));
          }
        }
      } catch (err) {
        console.error('인증 확인 실패:', err);
        window.location.href = '/login';
      } finally {
        setAuthLoading(false);
      }
    };
    loadUserData();
  }, []);

  // 설정 저장
  const saveSettings = async () => {
    setLoading(true);
    setSaveStatus('');
    
    try {
      // 텔레그램 ID 유효성 검사
      if (settings.telegramChatId && !isValidTelegramId(settings.telegramChatId)) {
        setSaveStatus('❌ 유효하지 않은 텔레그램 채팅 ID 형식입니다.');
        return;
      }
      
      // 비밀번호 변경 확인
      if (passwordForm.newPassword || passwordForm.confirmPassword) {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          setSaveStatus('❌ 새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
          return;
        }
        if (passwordForm.newPassword.length < 6) {
          setSaveStatus('❌ 새 비밀번호는 최소 6자 이상이어야 합니다.');
          return;
        }
      }

      // Supabase 사용자의 경우 실제 데이터 저장
      if (supabaseUser?.id) {
        let hasErrors = false;

        // 프로필 정보 업데이트
        if (userProfile) {
          const profileUpdated = await UserService.updateUserProfile(supabaseUser.id, {
            name: profileForm.name,
            email: profileForm.email
          });

          if (!profileUpdated) {
            hasErrors = true;
            setSaveStatus('❌ 프로필 업데이트 실패');
          }
        }

        // 사용자 설정 업데이트 (Alarm page에도 연동)
        const settingsUpdated = await UserService.updateUserSetting(supabaseUser.id, 'telegram_chat_id', settings.telegramChatId);
        const notificationsEnabled = await UserService.updateUserSetting(supabaseUser.id, 'notification_preferences', {
          ...userSettings?.notification_preferences,
          telegram_notification: settings.notificationEnabled
        });

        if (!settingsUpdated || !notificationsEnabled) {
          hasErrors = true;
          setSaveStatus(prev => prev + '\n❌ 설정 저장 실패');
        }

        // 비밀번호 변경 (Supabase Auth)
        if (passwordForm.newPassword) {
          const passwordUpdated = await UserService.updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
          
          if (!passwordUpdated) {
            hasErrors = true;
            setSaveStatus(prev => prev + '\n❌ 비밀번호 변경 실패');
          } else {
            setPasswordForm({
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            });
          }
        }

        if (!hasErrors) {
          // Supabase 저장 성공 시에도 로컬 동기화
          const currentNotificationSettings = localStorage.getItem('notificationSettings');
          const notificationSettingsObj = currentNotificationSettings ? JSON.parse(currentNotificationSettings) : {};
          notificationSettingsObj.telegramChatId = settings.telegramChatId;
          notificationSettingsObj.telegramEnabled = settings.notificationEnabled;
          localStorage.setItem('notificationSettings', JSON.stringify(notificationSettingsObj));
          
          // storage 이벤트 발생으로 다른 탭에서 변경사항 감지
          window.dispatchEvent(new Event('storage'));
          
          setSaveStatus('✅ Supabase에 설정이 저장되었습니다!');
        }
      } else {
        // 에뮬 모드: 로컬스토리지에 설정 저장
        localStorage.setItem('userSettings', JSON.stringify(settings));
        
        // 알림 설정 페이지와 동기화를 위해 notificationSettings도 업데이트
        const currentNotificationSettings = localStorage.getItem('notificationSettings');
        const notificationSettingsObj = currentNotificationSettings ? JSON.parse(currentNotificationSettings) : {};
        notificationSettingsObj.telegramChatId = settings.telegramChatId;
        notificationSettingsObj.telegramEnabled = settings.notificationEnabled;
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettingsObj));
        
        // 다른 탭에서 변경사항 감지할 수 있도록 storage 이벤트 발생
        window.dispatchEvent(new Event('storage'));
        
        setSaveStatus('✅ 로컬에 설정이 저장되었습니다!');
        
        // 비밀번호 변경 시뮬레이션
        if (passwordForm.newPassword) {
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setSaveStatus('✅ 비밀번호가 변경되었습니다!');
        }
      }
      
      setIsEditing(false);
    } catch (error) {
      setSaveStatus(`❌ 저장 중 오류가 발생했습니다: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 텔레그램 ID 유효성 검사
  const isValidTelegramId = (id: string) => {
    // 숫자 또는 @username 형식 검증
    return /^-?\d+$/.test(id) || /^@[a-zA-Z0-9_]+$/.test(id);
  };

  // 날씨 지역 업데이트
  const updateWeatherRegion = async (region: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await updateUserWeatherRegion(user.id, region);
      if (result.success) {
        setSettings(prev => ({ ...prev, weatherRegion: region }));
        setSaveStatus('✅ 날씨 지역이 업데이트되었습니다!');
        
        // 로컬스토리지에도 저장
        localStorage.setItem('userSettings', JSON.stringify({
          ...settings,
          weatherRegion: region
        }));
      } else {
        setSaveStatus(`❌ 날씨 지역 업데이트 실패: ${result.error}`);
      }
    } catch (error) {
      setSaveStatus(`❌ 날씨 지역 업데이트 중 오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 텔레그램 테스트 버튼
  const testTelegramNotification = async () => {
    if (!settings.telegramChatId) {
      setSaveStatus('❌ 텔레그램 채팅 ID를 먼저 입력해주세요.');
      return;
    }
    
    if (!isValidTelegramId(settings.telegramChatId)) {
      setSaveStatus('❌ 유효한 텔레그램 채팅 ID를 입력해주세요.');
      return;
    }
    
    try {
      const response = await fetch('/api/notifications/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🧪 마이페이지에서 보내는 테스트 알림입니다.\n\n✅ 텔레그램 알림이 정상적으로 작동합니다!`,
          chatId: settings.telegramChatId
        })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        setSaveStatus('✅ 텔레그램 테스트 알림이 전송되었습니다!');
      } else {
        setSaveStatus(`❌ 테스트 실패: ${result.error}`);
      }
    } catch (error) {
      setSaveStatus(`❌ 테스트 전송 중 오류: ${error}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AppHeader
        user={user}
        title="마이 페이지"
        subtitle="계정 정보 및 설정 관리"
        showBackButton
        backButtonText="대시보드"
      />
      
      <main className="max-w-7xl mx-auto pt-2 sm:pt-4 pb-2 sm:pb-4 lg:pb-8 px-2 sm:px-4 lg:px-8 relative z-10">
        {/* 프로필 정보 섹션 */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-2 sm:mb-4 lg:mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-2 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-6">
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">마이 페이지</h1>
                <p className="text-white/90 text-sm sm:text-base lg:text-lg">계정 정보를 확인하고 설정을 관리하세요</p>
              </div>
            </div>
          </div>
          
          <div className="px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8">
            <div className="max-w-4xl mx-auto">
              {/* 기본 정보 카드 */}
              <div className="bg-white rounded-xl shadow-lg p-2 sm:p-3 lg:p-6 mb-2 sm:mb-3 lg:mb-6">
                <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-600">기본 정보</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    {isEditing ? '취소' : '수정'}
                  </button>
                </div>
                
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">이름</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-600 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">이메일</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-600 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">전화번호</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="010-1234-5678"
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-600 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                  
                  {/* 사용자 권한 정보 (Supabase 기반 또는 MockAuth 백업) */}
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 lg:p-4">
                    <h3 className="font-medium text-gray-600 mb-1 sm:mb-2 text-sm sm:text-base">권한 정보</h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-600">역할:</span>
                        <span className="ml-2 font-semibold text-gray-600">{
                          // Supabase 권한 정보가 있으면 Supabase 기반, 없으면 MockAuth 사용
                          userRoleInfo?.role 
                            ? (userRoleInfo.role === 'owner' ? '소유자' :
                               userRoleInfo.role === 'operator' ? '운영자' :
                               userRoleInfo.role === 'viewer' ? '조회자' :
                               userRoleInfo.role)
                            : (user.role === 'system_admin' ? '시스템 관리자' :
                               user.role === 'team_leader' ? '팀 리더' :
                               user.role === 'team_member' ? '팀 멤버' : user.role)
                        }</span>
                      </div>
                      <div>
                        <span className="text-gray-600">승인 상태:</span>
                        <span className={`ml-2 font-semibold ${
                          userProfile?.is_approved !== undefined 
                            ? (userProfile.is_approved ? 'text-green-700' : 'text-red-700')
                            : (user.is_approved ? 'text-green-700' : 'text-red-700')
                        }`}>
                          {userProfile?.is_approved !== undefined 
                            ? (userProfile.is_approved ? '승인됨' : '대기중')
                            : (user.is_approved ? '승인됨' : '대기중')
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">계정 상태:</span>
                        <span className={`ml-2 font-semibold ${
                          userProfile?.is_active !== undefined 
                            ? (userProfile.is_active ? 'text-green-700' : 'text-red-700')
                            : (user.is_active ? 'text-green-700' : 'text-red-700')
                        }`}>
                          {userProfile?.is_active !== undefined 
                            ? (userProfile.is_active ? '활성' : '비활성')
                            : (user.is_active ? '활성' : '비활성')
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">소속:</span>
                        <span className="ml-2 font-semibold text-gray-600">
                          {userRoleInfo?.tenant_id ? `테넌트 ${userRoleInfo.tenant_id.substring(0, 8)}...` : 
                           user.team_name ? user.team_name : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 비밀번호 변경 */}
              <div className="bg-white rounded-xl shadow-lg p-2 sm:p-3 lg:p-6 mb-2 sm:mb-3 lg:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2 sm:mb-3 lg:mb-4">비밀번호 변경</h2>
                
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">현재 비밀번호</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base text-gray-600 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">새 비밀번호</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base text-gray-600 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">새 비밀번호 확인</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base text-gray-600 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* 텔레그램 설정 */}
              <div className="bg-white rounded-xl shadow-lg p-2 sm:p-3 lg:p-6 mb-2 sm:mb-3 lg:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2 sm:mb-3 lg:mb-4">텔레그램 알림 설정</h2>
                
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">텔레그램 채팅 ID</label>
                    <input
                      type="text"
                      value={settings.telegramChatId}
                      onChange={e => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                      placeholder="텔레그램 채팅 ID를 입력하세요"
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base text-gray-600 bg-white"
                    />
                    
                    {/* 텔레그램 ID 받는 방법 안내 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 lg:p-4 mt-2 sm:mt-3">
                      <p className="text-xs sm:text-sm text-blue-800 font-medium mb-2 sm:mb-3">텔레그램 채팅 ID 확인하는 방법</p>
                      <div className="bg-white rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
                        <ol className="text-xs sm:text-sm text-blue-700 space-y-1 ml-3">
                          <li>1. 텔레그램에서 @userinfobot 검색하여 대화 시작</li>
                          <li>2. 봇에게 아무 메시지나 전송 (/start 또는 hi 등을 전송)</li>
                          <li>3. 봇이 응답으로 보내는 숫자 ID를 복사</li>
                          <li>4. 위의 입력창에 해당 숫자 ID를 입력</li>
                        </ol>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3">
                        <p className="text-xs sm:text-sm text-yellow-800 font-medium mb-1 sm:mb-2">필수 확인 단계:</p>
                        <ol className="text-xs text-yellow-700 ml-3 space-y-1">
                          <li>• 텔레그램에서 <strong>실제 봇과 1:1 대화</strong>를 시작하셨나요?</li>
                          <li>• 그 봇에게 <strong>"hi"</strong> 또는 <strong>"/start"</strong> 메시지를 보냈나요?</li>
                          <li>• 봇이 당신의 메시지를 읽을 수 있는 상태인가요?</li>
                          <li>• 채팅 ID를 올바르게 입력했나요?</li>
                        </ol>
                        <p className="text-xs text-red-600 font-medium mt-1 sm:mt-2">
                          ⚠️ 봇을 처음 만든 것이라면 텔레그램 채팅방에서 직접 그 봇(@userinfobot)을 찾아서 대화를 시작해야 합니다!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-600">텔레그램 알림 활성화</h3>
                      <p className="text-xs sm:text-sm text-gray-500">텔레그램을 통한 실시간 알림을 받으려면 활성화하세요</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notificationEnabled}
                        onChange={async (e) => {
                          const newValue = e.target.checked;
                          setSettings(prev => ({ ...prev, notificationEnabled: newValue }));
                          
                          // 즉시 동기화
                          try {
                            if (supabaseUser?.id) {
                              await UserService.updateUserSetting(supabaseUser.id, 'notification_preferences', {
                                ...userSettings?.notification_preferences,
                                telegram_notification: newValue
                              });
                            }
                            
                            // localStorage도 즉시 업데이트
                            const currentNotificationSettings = loadNotificationSettings();
                            const updatedNotificationSettings: NotificationSettings = {
                              ...currentNotificationSettings,
                              telegramEnabled: newValue
                            };
                            saveNotificationSettings(updatedNotificationSettings);
                            
                            // storage 이벤트 발생시켜 다른 페이지에서 감지할 수 있도록
                            window.dispatchEvent(new Event('storage'));
                            
                            console.log('📱 마이페이지 토글 즉시 동기화:', { telegramEnabled: newValue });
                          } catch (error) {
                            console.error('토글 동기화 실패:', error);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex space-x-1 sm:space-x-2">
                      <button
                        onClick={async () => {
                          setLoading(true);
                          setSaveStatus('');
                          try {
                            // 텔레그램 설정만 저장
                            if (supabaseUser?.id) {
                              const settingsUpdated = await UserService.updateUserSetting(supabaseUser.id, 'telegram_chat_id', settings.telegramChatId);
                              const notificationsEnabled = await UserService.updateUserSetting(supabaseUser.id, 'notification_preferences', {
                                ...userSettings?.notification_preferences,
                                telegram_notification: settings.notificationEnabled
                              });
                              
                              if (settingsUpdated && notificationsEnabled) {
                                setSaveStatus('✅ 텔레그램 설정이 저장되었습니다!');
                              } else {
                                setSaveStatus('❌ 텔레그램 설정 저장에 실패했습니다.');
                              }
                            } else {
                              // 로컬 저장 - 알림 설정과 동기화
                              localStorage.setItem('userSettings', JSON.stringify(settings));
                              
                              // 현재 알림 설정을 로드하고 텔레그램 설정만 업데이트
                              const currentNotificationSettings = loadNotificationSettings();
                              const updatedNotificationSettings: NotificationSettings = {
                                ...currentNotificationSettings,
                                telegramChatId: settings.telegramChatId,
                                telegramEnabled: settings.notificationEnabled
                              };
                              
                              // 알림 설정 저장
                              saveNotificationSettings(updatedNotificationSettings);
                              
                              // 저장 이벤트 발생시켜 다른 페이지에서 감지할 수 있도록
                              window.dispatchEvent(new Event('storage'));
                              setSaveStatus('✅ 텔레그램 설정이 저장되었습니다!');
                            }
                          } catch (error) {
                            setSaveStatus(`❌ 저장 중 오류가 발생했습니다: ${error}`);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                      >
                        {loading ? '저장 중...' : '설정 저장'}
                      </button>
                      
                      <button
                        onClick={testTelegramNotification}
                        disabled={!settings.telegramChatId || !settings.notificationEnabled}
                        className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                      >
                        테스트 알림 전송
                      </button>
                    </div>
                  </div>
                  
                  {/* 텔레그램 설정 저장 상태 메시지 */}
                  {saveStatus && saveStatus.includes('텔레그램') && (
                    <div className="mt-2 sm:mt-3 lg:mt-4 p-2 sm:p-3 bg-gray-100 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600">{saveStatus}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 날씨 지역 설정 */}
              <div className="bg-white rounded-xl shadow-lg p-2 sm:p-3 lg:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2 sm:mb-3 lg:mb-4">날씨 지역 설정</h2>
                
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                      날씨 정보를 제공받을 지역을 선택하세요
                    </label>
                    <select
                      value={settings.weatherRegion}
                      onChange={e => updateWeatherRegion(e.target.value)}
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-600 bg-white"
                    >
                      <option value="서울">서울</option>
                      <option value="부산">부산</option>
                      <option value="대구">대구</option>
                      <option value="인천">인천</option>
                      <option value="광주">광주</option>
                      <option value="대전">대전</option>
                      <option value="울산">울산</option>
                      <option value="세종">세종</option>
                      <option value="수원">수원</option>
                      <option value="성남">성남</option>
                      <option value="의정부">의정부</option>
                      <option value="안양">안양</option>
                      <option value="부천">부천</option>
                      <option value="광명">광명</option>
                      <option value="평택">평택</option>
                      <option value="과천">과천</option>
                      <option value="오산">오산</option>
                      <option value="시흥">시흥</option>
                      <option value="군포">군포</option>
                      <option value="의왕">의왕</option>
                      <option value="하남">하남</option>
                      <option value="용인">용인</option>
                      <option value="파주">파주</option>
                      <option value="이천">이천</option>
                      <option value="안성">안성</option>
                      <option value="김포">김포</option>
                      <option value="화성">화성</option>
                      <option value="광주">광주</option>
                      <option value="여주">여주</option>
                      <option value="양평">양평</option>
                      <option value="고양">고양</option>
                      <option value="동두천">동두천</option>
                      <option value="가평">가평</option>
                      <option value="연천">연천</option>
                      <option value="춘천">춘천</option>
                      <option value="원주">원주</option>
                      <option value="강릉">강릉</option>
                      <option value="동해">동해</option>
                      <option value="태백">태백</option>
                      <option value="속초">속초</option>
                      <option value="삼척">삼척</option>
                      <option value="홍천">홍천</option>
                      <option value="횡성">횡성</option>
                      <option value="영월">영월</option>
                      <option value="평창">평창</option>
                      <option value="정선">정선</option>
                      <option value="철원">철원</option>
                      <option value="화천">화천</option>
                      <option value="양구">양구</option>
                      <option value="인제">인제</option>
                      <option value="고성">고성</option>
                      <option value="양양">양양</option>
                      <option value="청주">청주</option>
                      <option value="충주">충주</option>
                      <option value="제천">제천</option>
                      <option value="보은">보은</option>
                      <option value="옥천">옥천</option>
                      <option value="영동">영동</option>
                      <option value="증평">증평</option>
                      <option value="진천">진천</option>
                      <option value="괴산">괴산</option>
                      <option value="음성">음성</option>
                      <option value="단양">단양</option>
                      <option value="천안">천안</option>
                      <option value="공주">공주</option>
                      <option value="보령">보령</option>
                      <option value="아산">아산</option>
                      <option value="서산">서산</option>
                      <option value="논산">논산</option>
                      <option value="계룡">계룡</option>
                      <option value="당진">당진</option>
                      <option value="금산">금산</option>
                      <option value="부여">부여</option>
                      <option value="서천">서천</option>
                      <option value="청양">청양</option>
                      <option value="홍성">홍성</option>
                      <option value="예산">예산</option>
                      <option value="태안">태안</option>
                      <option value="전주">전주</option>
                      <option value="군산">군산</option>
                      <option value="익산">익산</option>
                      <option value="정읍">정읍</option>
                      <option value="남원">남원</option>
                      <option value="김제">김제</option>
                      <option value="완주">완주</option>
                      <option value="진안">진안</option>
                      <option value="무주">무주</option>
                      <option value="장수">장수</option>
                      <option value="임실">임실</option>
                      <option value="순창">순창</option>
                      <option value="고창">고창</option>
                      <option value="부안">부안</option>
                      <option value="목포">목포</option>
                      <option value="여수">여수</option>
                      <option value="순천">순천</option>
                      <option value="나주">나주</option>
                      <option value="광양">광양</option>
                      <option value="담양">담양</option>
                      <option value="곡성">곡성</option>
                      <option value="구례">구례</option>
                      <option value="고흥">고흥</option>
                      <option value="보성">보성</option>
                      <option value="화순">화순</option>
                      <option value="장흥">장흥</option>
                      <option value="강진">강진</option>
                      <option value="해남">해남</option>
                      <option value="영암">영암</option>
                      <option value="무안">무안</option>
                      <option value="함평">함평</option>
                      <option value="영광">영광</option>
                      <option value="장성">장성</option>
                      <option value="완도">완도</option>
                      <option value="진도">진도</option>
                      <option value="신안">신안</option>
                      <option value="포항">포항</option>
                      <option value="경주">경주</option>
                      <option value="김천">김천</option>
                      <option value="안동">안동</option>
                      <option value="구미">구미</option>
                      <option value="영주">영주</option>
                      <option value="영천">영천</option>
                      <option value="상주">상주</option>
                      <option value="문경">문경</option>
                      <option value="경산">경산</option>
                      <option value="군위">군위</option>
                      <option value="의성">의성</option>
                      <option value="청송">청송</option>
                      <option value="영양">영양</option>
                      <option value="영덕">영덕</option>
                      <option value="청도">청도</option>
                      <option value="고령">고령</option>
                      <option value="성주">성주</option>
                      <option value="칠곡">칠곡</option>
                      <option value="예천">예천</option>
                      <option value="봉화">봉화</option>
                      <option value="울진">울진</option>
                      <option value="울릉">울릉</option>
                      <option value="창원">창원</option>
                      <option value="진주">진주</option>
                      <option value="통영">통영</option>
                      <option value="사천">사천</option>
                      <option value="김해">김해</option>
                      <option value="밀양">밀양</option>
                      <option value="거제">거제</option>
                      <option value="양산">양산</option>
                      <option value="의령">의령</option>
                      <option value="함안">함안</option>
                      <option value="창녕">창녕</option>
                      <option value="고성">고성</option>
                      <option value="남해">남해</option>
                      <option value="하동">하동</option>
                      <option value="산청">산청</option>
                      <option value="함양">함양</option>
                      <option value="거창">거창</option>
                      <option value="합천">합천</option>
                      <option value="제주">제주</option>
                      <option value="서귀포">서귀포</option>
                    </select>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 lg:p-4">
                    <p className="text-xs sm:text-sm text-blue-800 font-medium mb-1 sm:mb-2">날씨 정보 안내</p>
                    <ul className="text-xs sm:text-sm text-blue-700 space-y-1 ml-3">
                      <li>• 선택한 지역의 실시간 날씨 정보를 대시보드에서 확인할 수 있습니다</li>
                      <li>• 기상청 초단기예보 API를 사용하여 정확한 정보를 제공합니다</li>
                      <li>• 온도, 습도, 강수량, 날씨 상태를 확인할 수 있습니다</li>
                      <li>• 지역 변경 시 즉시 반영됩니다</li>
                    </ul>
                  </div>
                </div>
              </div>


              {/* 저장 버튼 및 상태 메시지 */}
              {isEditing && (
                <div className="mt-6 space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={saveSettings}
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {loading ? '저장 중...' : '변경사항 저장'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                    >
                      취소
                    </button>
                  </div>
                  
                  {saveStatus && (
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-600">{saveStatus}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
      </main>
    </div>
  );
}
