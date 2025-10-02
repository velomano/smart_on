'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import NotificationButton from '@/components/NotificationButton';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import { loadNotificationSettings, saveNotificationSettings, NotificationSettings } from '@/lib/notificationService';
import { UserService } from '@/lib/userService';

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => loadNotificationSettings());
  const [saveStatus, setSaveStatus] = useState('');

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          window.location.href = '/login';
          return;
        }
        setUser(currentUser);
        
        // 마이페이지의 Supabase 설정을 우선적으로 읽어오기
        try {
          const userSettings = await UserService.getUserSettings(currentUser.id);
          if (userSettings) {
            // Supabase에서 가져온 설정으로 localStorage 업데이트
            const currentNotificationSettings = loadNotificationSettings();
            const updatedSettings = {
              ...currentNotificationSettings,
              telegramEnabled: userSettings.notification_preferences?.telegram_notification ?? currentNotificationSettings.telegramEnabled,
              telegramChatId: userSettings.telegram_chat_id || currentNotificationSettings.telegramChatId
            };
            
            // localStorage 업데이트
            saveNotificationSettings(updatedSettings);
            setNotificationSettings(updatedSettings);
            
            console.log('📱 알림설정 페이지 - Supabase 설정 동기화:', {
              telegramEnabled: updatedSettings.telegramEnabled,
              telegramChatId: updatedSettings.telegramChatId
            });
          } else {
            // Supabase 설정이 없으면 localStorage에서 로드
            setNotificationSettings(loadNotificationSettings());
          }
        } catch (error) {
          console.warn('Supabase 설정 로드 실패, localStorage 사용:', error);
          setNotificationSettings(loadNotificationSettings());
        }
      } catch (err) {
        console.error('인증 확인 실패:', err);
        window.location.href = '/login';
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();

    // storage 이벤트 리스너 추가 (마이페이지에서 설정 변경 시 동기화)
    const handleStorageChange = () => {
      setNotificationSettings(loadNotificationSettings());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  // 알림 설정 저장
  const handleSaveSettings = async () => {
    try {
      // localStorage에 저장
      saveNotificationSettings(notificationSettings);
      
      // Supabase에도 저장 (사용자가 로그인되어 있는 경우)
      if (user) {
        try {
          await UserService.updateUserSetting(user.id, 'telegram_chat_id', notificationSettings.telegramChatId);
          await UserService.updateUserSetting(user.id, 'notification_preferences', {
            telegram_notification: notificationSettings.telegramEnabled
          });
          
          console.log('📱 알림설정 페이지 - Supabase 저장 완료:', {
            telegramEnabled: notificationSettings.telegramEnabled,
            telegramChatId: notificationSettings.telegramChatId
          });
        } catch (error) {
          console.warn('Supabase 저장 실패, localStorage만 저장됨:', error);
        }
      }
      
      setSaveStatus('✅ 설정이 저장되었습니다!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      setSaveStatus('❌ 설정 저장에 실패했습니다.');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // 설정 변경 핸들러
  const handleSettingChange = (key: string, value: any) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setNotificationSettings(prev => {
        const parentValue = prev[parent as keyof typeof prev];
        return {
          ...prev,
          [parent]: {
            ...(typeof parentValue === 'object' && parentValue !== null ? parentValue : {}),
            [child]: value
          }
        };
      });
      } else {
      setNotificationSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={user || undefined} title="알림설정" subtitle="텔레그램 알림 설정" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user || undefined} title="알림설정" subtitle="텔레그램 알림 설정" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* 중요 안내 배너 */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🚨</span>
                <div>
                <h3 className="text-xl font-bold mb-2">⚠️ 텔레그램 알림 설정 안내</h3>
                <p className="text-red-100 mb-3">
                  텔레그램 알림을 받으려면 <strong>반드시 마이페이지에서 텔레그램 채팅 ID를 등록</strong>해야 합니다!
                </p>
                <button
                  onClick={() => router.push('/my-page')}
                  className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                >
                  👤 마이페이지에서 ID 등록하기
                </button>
                </div>
              </div>
            </div>

          {/* 텔레그램 봇 설정 */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">🤖</span>
              텔레그램 봇 설정
            </h2>
            
            <div className="space-y-6">
              {/* 텔레그램 활성화 */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">텔레그램 알림 활성화</h3>
                  <p className="text-blue-700 text-sm">텔레그램을 통한 실시간 알림을 받으려면 활성화하세요</p>
                          </div>
                <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                    checked={notificationSettings.telegramEnabled}
                    onChange={async (e) => {
                      const newValue = e.target.checked;
                      handleSettingChange('telegramEnabled', newValue);
                      
                      // 즉시 Supabase에 저장
                      try {
                        if (user) {
                          await UserService.updateUserSetting(user.id, 'notification_preferences', {
                            telegram_notification: newValue
                          });
                          console.log('📱 알림설정 페이지 토글 즉시 동기화:', { telegramEnabled: newValue });
                        }
                      } catch (error) {
                        console.error('토글 동기화 실패:', error);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                     {/* 채팅 ID 설정 - 마이페이지에서 관리하므로 제거 */}
                     {notificationSettings.telegramEnabled && (
                       <div className="space-y-4">
                         {/* 테스트 버튼만 표시 */}
                         <div className="flex justify-center">
                           <NotificationButton className="text-lg px-8 py-3" />
                         </div>
                    </div>
                     )}

                     {/* 텔레그램 비활성화 시 안내 */}
                     {!notificationSettings.telegramEnabled && (
                       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                         <h4 className="font-semibold text-yellow-800 mb-3">📋 텔레그램 알림 설정 방법:</h4>
                         <div className="space-y-3">
                           <div className="bg-white rounded-lg p-3 border border-yellow-300">
                             <h5 className="font-semibold text-yellow-900 mb-2">1️⃣ 텔레그램 봇과 대화하기</h5>
                             <ol className="list-decimal list-inside text-yellow-700 space-y-1 text-sm ml-2">
                               <li>텔레그램에서 <code className="bg-yellow-100 px-1 py-0.5 rounded font-mono">@SmartFarm_Bot</code> 검색</li>
                               <li>봇을 시작하고 <code className="bg-yellow-100 px-1 py-0.5 rounded font-mono">/start</code> 명령어 전송</li>
                               <li>봇이 자동으로 채팅 ID를 알려줍니다</li>
                             </ol>
                    </div>

                           <div className="bg-blue-50 rounded-lg p-3 border border-blue-300">
                             <h5 className="font-semibold text-blue-900 mb-2">2️⃣ ⚠️ 중요: 마이페이지에서 ID 등록 필수!</h5>
                             <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                               <p className="text-red-800 text-sm font-semibold">🚨 반드시 마이페이지에서 텔레그램 ID를 등록해야 알림을 받을 수 있습니다!</p>
                             </div>
                             <p className="text-blue-700 text-sm mb-2">봇에서 받은 채팅 ID를 마이페이지의 "텔레그램 채팅 ID" 필드에 입력하고 저장하세요.</p>
                      <button
                               onClick={() => router.push('/my-page')}
                               className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                               👤 마이페이지에서 ID 등록하기
                      </button>
                    </div>

                           <div className="bg-green-50 rounded-lg p-3 border border-green-300">
                             <h5 className="font-semibold text-green-900 mb-2">3️⃣ 설정 완료 후 알림 활성화</h5>
                             <p className="text-green-700 text-sm">마이페이지에서 ID를 등록한 후, 위의 "텔레그램 알림 활성화" 토글을 켜주세요.</p>
                      </div>
                    </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 알림 유형 설정 */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">🔔</span>
              알림 유형 설정
            </h2>
            
            <div className="space-y-4">
              {Object.entries(notificationSettings.notifications).map(([key, enabled]) => {
                const labels: Record<string, { title: string; description: string; icon: string }> = {
                  temperature_notification: { title: '🌡️ 온도 알림', description: '높은/낮은 온도 경고', icon: '🌡️' },
                  humidity_notification: { title: '💧 습도 알림', description: '높은/낮은 습도 경고', icon: '💧' },
                  ec_notification: { title: '🔋 EC 알림', description: '배양액 농도 이상', icon: '🔋' },
                  ph_notification: { title: '⚗️ pH 알림', description: 'pH 값 이상', icon: '⚗️' },
                  water_notification: { title: '💧 수위 알림', description: '저수위/고수위 경고', icon: '💧' }
                };
                
                const label = labels[key];
                
                return (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{label.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{label.title}</h3>
                        <p className="text-gray-600 text-sm">{label.description}</p>
                      </div>
                        </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                        checked={enabled}
                        onChange={(e) => handleSettingChange(`notifications.${key}`, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                );
              })}
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-center">
            <button
              onClick={handleSaveSettings}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              💾 설정 저장
            </button>
                  </div>
                  
          {/* 현재 설정 상태 */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 현재 설정 상태</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">텔레그램 활성화:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  notificationSettings.telegramEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {notificationSettings.telegramEnabled ? '활성화됨' : '비활성화됨'}
                </span>
                    </div>
              <div>
                <span className="font-medium">채팅 ID:</span>
                <span className="ml-2 text-gray-600">
                  {notificationSettings.telegramChatId || '설정되지 않음'}
                </span>
                  </div>
              <div>
                <span className="font-medium">활성 알림:</span>
                <span className="ml-2 text-gray-600">
                  {Object.values(notificationSettings.notifications).filter(Boolean).length}개
                </span>
                    </div>
              <div>
                <span className="font-medium">마지막 업데이트:</span>
                <span className="ml-2 text-gray-600">
                  {new Date().toLocaleString('ko-KR')}
                </span>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
  );
}
