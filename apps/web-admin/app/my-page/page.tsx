'use client';
import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { getCurrentUser } from '@/lib/auth';
import { AuthUser } from '@/lib/auth';
import { UserService, UserProfile, UserSettings } from '@/lib/userService';
import { User } from '@supabase/supabase-js';

export default function MyPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState({
    telegramChatId: '',
    notificationEnabled: true,
    emailNotification: true
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
      
      <main className="max-w-7xl mx-auto pt-4 pb-8 sm:px-6 lg:px-8 relative z-10">
        {/* 프로필 정보 섹션 */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">마이 페이지</h1>
                <p className="text-white/90 text-lg">계정 정보를 확인하고 설정을 관리하세요</p>
              </div>
            </div>
          </div>
          
          <div className="px-8 py-8">
            <div className="max-w-4xl mx-auto">
              {/* 기본 정보 카드 */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">👤 기본 정보</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isEditing ? '취소' : '수정'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="010-1234-5678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                  
                  {/* 사용자 권한 정보 (Supabase 기반 또는 MockAuth 백업) */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">권한 정보</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">역할:</span>
                        <span className="ml-2 font-medium">{
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
                        <span className={`ml-2 font-medium ${
                          userProfile?.is_approved !== undefined 
                            ? (userProfile.is_approved ? 'text-green-600' : 'text-red-600')
                            : (user.is_approved ? 'text-green-600' : 'text-red-600')
                        }`}>
                          {userProfile?.is_approved !== undefined 
                            ? (userProfile.is_approved ? '승인됨' : '대기중')
                            : (user.is_approved ? '승인됨' : '대기중')
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">계정 상태:</span>
                        <span className={`ml-2 font-medium ${
                          userProfile?.is_active !== undefined 
                            ? (userProfile.is_active ? 'text-green-600' : 'text-red-600')
                            : (user.is_active ? 'text-green-600' : 'text-red-600')
                        }`}>
                          {userProfile?.is_active !== undefined 
                            ? (userProfile.is_active ? '활성' : '비활성')
                            : (user.is_active ? '활성' : '비활성')
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">소속:</span>
                        <span className="ml-2 font-medium">
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
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🔒 비밀번호 변경</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-gray-50 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* 텔레그램 설정 */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 텔레그램 알림 설정</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">텔레그램 채팅 ID</label>
                    <input
                      type="text"
                      value={settings.telegramChatId}
                      onChange={e => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                      placeholder="텔레그램 채팅 ID를 입력하세요"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    />
                    
                    {/* 텔레그램 ID 받는 방법 안내 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                      <p className="text-sm text-blue-800 font-medium mb-3">💡 텔레그램 채팅 ID 확인하는 방법</p>
                      <div className="bg-white rounded-lg p-3 mb-3">
                        <ol className="text-sm text-blue-700 space-y-1 ml-3">
                          <li>1. 텔레그램에서 @userinfobot 검색하여 대화 시작</li>
                          <li>2. 봇에게 아무 메시지나 전송 (/start 또는 hi 등을 전송)</li>
                          <li>3. 봇이 응답으로 보내는 숫자 ID를 복사</li>
                          <li>4. 위의 입력창에 해당 숫자 ID를 입력</li>
                        </ol>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 font-medium mb-2">🔥 필수 확인 단계:</p>
                        <ol className="text-xs text-yellow-700 ml-3 space-y-1">
                          <li>• 텔레그램에서 <strong>실제 봇과 1:1 대화</strong>를 시작하셨나요?</li>
                          <li>• 그 봇에게 <strong>"hi"</strong> 또는 <strong>"/start"</strong> 메시지를 보냈나요?</li>
                          <li>• 봇이 당신의 메시지를 읽을 수 있는 상태인가요?</li>
                          <li>• 채팅 ID를 올바르게 입력했나요?</li>
                        </ol>
                        <p className="text-xs text-red-600 font-medium mt-2">
                          ⚠️ 봇을 처음 만든 것이라면 텔레그램 채팅방에서 직접 그 봇(@userinfobot)을 찾아서 대화를 시작해야 합니다!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="telegramEnabled"
                        checked={settings.notificationEnabled}
                        onChange={e => setSettings(prev => ({ ...prev, notificationEnabled: e.target.checked }))}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <label htmlFor="telegramEnabled" className="text-gray-900 font-medium">
                        텔레그램 알림 활성화
                      </label>
                    </div>
                    
                    <button
                      onClick={testTelegramNotification}
                      disabled={!settings.telegramChatId || !settings.notificationEnabled}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      테스트 알림 전송
                    </button>
                  </div>
                </div>
              </div>

              {/* 공지사항 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📣 공지사항</h2>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-medium text-gray-900">텔레그램 알림 시스템 개선</h3>
                    <p className="text-sm text-gray-600">각자의 텔레그램 채팅 ID를 설정하여 개인 맞춤 알림을 받으실 수 있습니다.</p>
                    <p className="text-xs text-gray-500">2025-09-26</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <h3 className="font-medium text-gray-900">시스템 업데이트</h3>
                    <p className="text-sm text-gray-600">마이페이지 기능이 추가되어 계정 정보를 쉽게 관리할 수 있습니다.</p>
                    <p className="text-xs text-gray-500">2025-09-26</p>
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
                      <p className="text-sm text-gray-900">{saveStatus}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
