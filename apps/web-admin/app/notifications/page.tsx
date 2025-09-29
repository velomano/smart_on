'use client';
import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { notificationTemplates } from '@/lib/notificationTemplates';
import { getCurrentUser } from '@/lib/auth';
import { AuthUser } from '@/lib/auth';
import { UserService } from '@/lib/userService';
import { getFarms } from '@/lib/supabase';

export default function NotificationsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [settings, setSettings] = useState({
    telegramEnabled: false,
    telegramChatId: '',
    botToken: '',
    notifications: {} as Record<string, boolean>
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [showBotInfoModal, setShowBotInfoModal] = useState(false);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [botInfoLoading, setBotInfoLoading] = useState(false);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          window.location.href = '/login';
          return;
        }
        setUser(currentUser);
      } catch (err) {
        console.error('인증 확인 실패:', err);
        window.location.href = '/login';
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // 농장 목록 로드
  useEffect(() => {
    const loadFarms = async () => {
      try {
        const farmsData = await getFarms();
        setFarms(farmsData);
        if (farmsData.length > 0) {
          setSelectedFarmId(farmsData[0].id);
        }
      } catch (error) {
        console.error('농장 목록 로드 오류:', error);
      }
    };
    loadFarms();
  }, []);

  // 알림 설정 로드 (Supabase 연동)
  useEffect(() => {
    const loadNotificationSettings = async () => {
      let loadedSettings: any = {};

      // Supabase에서 사용자 설정 가져오기 (우선 사용)
      try {
        const supabaseAuth = await UserService.getCurrentSupabaseUser();
        if (supabaseAuth?.id) {
          const userSettingsData = await UserService.getUserSettings(supabaseAuth.id);
          if (userSettingsData) {
            if (userSettingsData.telegram_chat_id) {
              loadedSettings.telegramChatId = userSettingsData.telegram_chat_id;
            }
            if (userSettingsData.notification_preferences?.telegram_notification !== undefined) {
              loadedSettings.telegramEnabled = userSettingsData.notification_preferences.telegram_notification;
            }
            console.log('Supabase에서 알림 설정 로드 완료:', loadedSettings);
          }
        }
      } catch (error) {
        console.warn('Supabase 설정 로드 실패, localStorage 백업 사용:', error);
        // Supabase 실패 시 localStorage 백업
        const userSettings = localStorage.getItem('userSettings');
        if (userSettings) {
          const userSettingsParsed = JSON.parse(userSettings);
          if (userSettingsParsed.telegramChatId) {
            loadedSettings.telegramChatId = userSettingsParsed.telegramChatId;
          }
          if (userSettingsParsed.notificationEnabled !== undefined) {
            loadedSettings.telegramEnabled = userSettingsParsed.notificationEnabled;
          }
        }
      }

      setSettings(prev => ({ ...prev, ...loadedSettings }));

      const defaultNotifications = Object.keys(notificationTemplates).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);

      setSettings(prev => ({
        ...prev,
        notifications: { ...defaultNotifications, ...prev.notifications }
      }));
    };

    loadNotificationSettings();
  }, [user]);

  // 마이페이지에서 텔레그램 ID가 변경될 때 실시간 반영
  useEffect(() => {
    const handleStorageUpdate = () => {
      const userSettings = localStorage.getItem('userSettings');
      if (userSettings) {
        const userSettingsParsed = JSON.parse(userSettings);
        if (userSettingsParsed.telegramChatId && userSettingsParsed.telegramChatId !== settings.telegramChatId) {
          setSettings(prev => ({
            ...prev,
            telegramChatId: userSettingsParsed.telegramChatId,
            telegramEnabled: userSettingsParsed.notificationEnabled !== undefined ? userSettingsParsed.notificationEnabled : prev.telegramEnabled
          }));
        }
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, [settings.telegramChatId]);

  const saveSettings = async () => {
    try {
      // Supabase에 설정 저장
      const supabaseAuth = await UserService.getCurrentSupabaseUser();
      if (supabaseAuth?.id) {
        await UserService.updateUserSetting(supabaseAuth.id, 'telegram_chat_id', settings.telegramChatId);
        await UserService.updateUserSetting(supabaseAuth.id, 'notification_preferences', {
          telegram_notification: settings.telegramEnabled
        });
        console.log('Supabase에 알림 설정 저장 완료');
      }
    } catch (error) {
      console.warn('Supabase 저장 실패, localStorage 백업 사용:', error);
      // Supabase 실패 시 localStorage 백업
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      const userSettings = localStorage.getItem('userSettings');
      const userSettingsObj = userSettings ? JSON.parse(userSettings) : {};
      userSettingsObj.telegramChatId = settings.telegramChatId;
      userSettingsObj.notificationEnabled = settings.telegramEnabled;
      localStorage.setItem('userSettings', JSON.stringify(userSettingsObj));
    }
    
    alert('알림 설정이 저장되었습니다!');
  };

  const sendTestNotification = async () => {
    if (!settings.telegramChatId) {
      alert('텔레그램 채팅 ID를 입력해주세요.');
      return;
    }
    setTesting(true);
    setTestResult('');
    try {
      const response = await fetch('/api/notifications/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:
            '🧪 <b>테스트 알림</b>\n\n✅ 텔레그램 알림 시스템이 정상적으로 작동합니다!\n⏰ 시간: ' +
            new Date().toLocaleString('ko-KR'),
          chatId: settings.telegramChatId
        })
      });
      const result = await response.json();
      setTestResult(result.ok ? '✅ 테스트 알림이 성공적으로 전송되었습니다!' : `❌ 테스트 실패: ${result.error}`);
    } catch (error: any) {
      setTestResult(`❌ 테스트 실패: ${String(error)}`);
    } finally {
      setTesting(false);
    }
  };

  const testSensorAlert = async (sensorType: string, value: number, location: string) => {
    setTesting(true);
    setTestResult('');
    try {
      console.log('🔔 센서 알림 테스트 시작 (알림 설정 페이지 테스트 기능)');
      if (!settings.telegramChatId) {
        alert('텔레그램 채팅 ID를 입력해주세요.');
        return;
      }
      
      if (!selectedFarmId) {
        alert('테스트할 농장을 선택해주세요.');
        return;
      }
      
      const selectedFarm = farms.find(f => f.id === selectedFarmId);
      const farmName = selectedFarm?.name || '선택된 농장';
      
      console.log('🔍 선택된 농장 정보:', {
        selectedFarmId,
        farmName,
        allFarms: farms.map(f => ({ id: f.id, name: f.name }))
      });

      const thresholds = {
        temperature: { min: 15, max: 30 },
        ec: { min: 1.0, max: 3.0 },
        ph: { min: 5.5, max: 6.5 },
        humidity: { min: 40, max: 80 },
        water: { min: 20, max: 90 }
      } as const;

      // 대시보드 알림(try-catch로 방어)
      try {
        const { dashboardAlertManager } = await import('@/lib/dashboardAlerts');
        
        console.log('🔍 알림 생성 파라미터:', {
          sensorType,
          value,
          location: `${farmName} - ${location || '조1-베드1'}`,
          deviceId: selectedFarmId,
          sensorId: `test_${sensorType}_${Date.now()}`,
          thresholds: { [sensorType]: thresholds[sensorType as keyof typeof thresholds] }
        });
        
        const alert = dashboardAlertManager.checkSensorDataAndAlert(
          sensorType,
          value,
          `${farmName} - ${location || '조1-베드1'}`,
          selectedFarmId, // deviceId (농장 ID)
          `test_${sensorType}_${Date.now()}`, // sensorId
          { [sensorType]: thresholds[sensorType as keyof typeof thresholds] }
        );
        
        console.log('🔍 생성된 알림:', alert);
        console.log('🔍 현재 모든 알림:', dashboardAlertManager.getAlerts());
        console.log(`✅ ${sensorType} 센서 대시보드 알림 추가 완료 (농장: ${farmName})`);
      } catch (dashboardError) {
        console.error('대시보드 알림 추가 실패:', dashboardError);
      }

      // 텔레그램 알림
      const response = await fetch('/api/notifications/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🧪 <b>${sensorType} 센서 알림 테스트</b>\n\n🏢 농장: ${farmName}\n🎯 ${sensorType} 센서 테스트 값: ${value}\n📍 위치: ${
            location || '조1-베드1'
          }\n⏰ 시간: ${new Date().toLocaleString('ko-KR')}`,
          chatId: settings.telegramChatId
        })
      });
      const result = await response.json();
      setTestResult(
        result.ok
          ? `✅ ${sensorType} 센서 테스트 알림이 성공적으로 전송되었습니다!\n📱 텔레그램 알림 + 🚨 대시보드 알림\n🏢 농장: ${farmName}\n값: ${value}, 위치: ${
              location || '조1-베드1'
            }`
          : `❌ 센서 테스트 실패: ${result.error}\n(대시보드 알림은 추가됨)`
      );
    } catch (error: any) {
      setTestResult(`❌ 오류 발생: ${String(error)}`);
    } finally {
      setTesting(false);
    }
  };

  const debugEnvironmentVariables = async () => {
    setBotInfoLoading(true);
    setTestResult('');
    try {
      const response = await fetch('/api/notifications/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debug: 'env' })
      });
      const debugInfo = await response.json();
      const deploymentEnv = window.location.hostname.includes('vercel') ? 'Vercel 배포' : '로컬';
      if (debugInfo.hasBotToken) {
        setTestResult(
          `✅ 환경변수 상태 (${deploymentEnv}): 토큰 설정됨 (길이: ${debugInfo.tokenLength}), 채팅 ID${
            debugInfo.hasDefaultChatId ? ' 설정됨' : ' 없음'
          }`
        );
      } else {
        setTestResult(
          `❌ 환경변수 문제 (${deploymentEnv}): TELEGRAM_BOT_TOKEN이 설정되지 않았습니다. ${
            deploymentEnv.includes('Vercel')
              ? 'Vercel 대시보드 → Settings → Environment Variables에서 설정하세요.'
              : '로컬용 .env.local 파일을 확인하세요.'
          }`
        );
      }
    } catch (error: any) {
      setTestResult(`❌ 디버그 확인 실패: ${String(error)}`);
    } finally {
      setBotInfoLoading(false);
    }
  };

  const checkBotInfo = async () => {
    setBotInfoLoading(true);
    try {
      setBotInfo({
        botName: 'User Info Bot',
        username: '@userinfobot',
        description: '텔레그램에서 @userinfobot과 대화를 시작하면 채팅 ID를 확인할 수 있습니다.'
      });
      setShowBotInfoModal(true);
    } finally {
      setBotInfoLoading(false);
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
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AppHeader
          user={user}
          title="알림 설정"
          subtitle="텔레그램 알림 시스템 관리"
          showBackButton
          backButtonText="대시보드"
        />

        <main className="max-w-7xl mx-auto pt-4 pb-8 sm:px-6 lg:px-8 relative z-10">
          {/* Overview Section */}
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-8 py-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-3xl">🔔</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">알림 설정</h1>
                  <p className="text-white/90 text-lg">텔레그램 알림 시스템을 설정하고 관리하세요</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-8">
              <div className="max-w-4xl mx-auto">
                {/* 마이페이지 안내 (텔레그램 설정 위주) */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200 mb-6">
                  <h2 className="text-xl font-semibold text-blue-900 mb-4">📱 텔레그램 알림 설정 안내</h2>
                  <div className="space-y-4 text-blue-800">
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h3 className="font-semibold text-blue-900 mb-2">💙 텔레그램 채팅 ID 설정</h3>
                      <p className="text-sm">텔레그램 채팅 ID는 <strong>마이페이지</strong>에서 설정하는 것이 권장됩니다.</p>
                      <div className="mt-2">
                        <a 
                          href="/my-page" 
                          className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          마이페이지에서 설정하기 →
                        </a>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h3 className="font-semibold text-blue-900 mb-2">📋 마이페이지 설정 방법</h3>
                      <p className="text-sm">마이페이지 → 텔레그램 알림 설정에서 ID 입력하고 백업하면 여기서 자동으로 이용 가능합니다.</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h3 className="font-semibold text-blue-900 mb-2">🔔 여기서는 알림 활성화</h3>
                      <p className="text-sm">마이페이지에서 ID 설정 후 여기서 텔레그램 알림을 최종 활성화하고 테스트해보세요.</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 font-medium">
                        💡 팁: 대부분의 텔레그램 설정은 마이페이지에서 관리하면 편리합니다!
                      </p>
                    </div>
                  </div>
                </div>

                {/* 텔레그램 설정 */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 텔레그램 설정</h2>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="telegramEnabled"
                        checked={settings.telegramEnabled}
                        onChange={e => setSettings(prev => ({ ...prev, telegramEnabled: e.target.checked }))}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <label htmlFor="telegramEnabled" className="text-gray-900 font-medium">
                        텔레그램 알림 활성화
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">텔레그램 채팅 ID</label>
                      <input
                        type="text"
                        value={settings.telegramChatId}
                        onChange={e => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                        placeholder="텔레그램 채팅 ID를 입력하세요"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                      />

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                        <p className="text-sm text-blue-800 font-medium mb-2">💡 마이페이지에서 텔레그램 ID 관리 권장</p>
                        <p className="text-xs text-blue-700 mb-2">
                          텔레그램 채팅 ID는 <a href="/my-page" className="text-blue-700 underline">마이페이지</a>에서 상세한 안내와 함께 설정하세요.
                        </p>
                        <a 
                          href="/my-page" 
                          className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          마이페이지에서 설정하기 →
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-between items-stretch md:items-center space-y-3 md:space-y-0 md:space-x-3">
                      <div className="flex flex-col md:flex-row space-x-0 md:space-x-3 space-y-3 md:space-y-0 pb-2">
                        <button
                          onClick={debugEnvironmentVariables}
                          disabled={testing}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          title="환경변수 상태 확인"
                        >
                          🔧 환경변수 상태
                        </button>
                        <button
                          onClick={sendTestNotification}
                          disabled={testing || !settings.telegramChatId}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          title="텔레그램 알림 테스트"
                        >
                          {testing ? '🧪 테스트 중...' : '🧪 테스트 알림 전송'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">📋 채팅방에서 봇과 먼저 대화를 시작하셨나요?</div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={saveSettings}
                        className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                      >
                        💾 설정 저장
                      </button>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">🌡️ 센서 알림 테스트</h3>
                      
                      {/* 농장 선택 */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🏢 테스트할 농장 선택
                        </label>
                        <select
                          value={selectedFarmId}
                          onChange={(e) => setSelectedFarmId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                        >
                          {farms.map((farm) => (
                            <option key={farm.id} value={farm.id}>
                              {farm.name}
                            </option>
                          ))}
                        </select>
                        {farms.length === 0 && (
                          <p className="text-sm text-gray-500 mt-1">농장이 없습니다. 먼저 농장을 생성해주세요.</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => testSensorAlert('temperature', 12, '조1-베드1')}
                          disabled={testing || !selectedFarmId}
                          className="bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors text-sm"
                        >
                          ❄️ 저온 테스트 (12°C)
                        </button>
                        <button
                          onClick={() => testSensorAlert('temperature', 35, '조1-베드1')}
                          disabled={testing || !selectedFarmId}
                          className="bg-orange-500 text-white py-2 px-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm"
                        >
                          🌡️ 고온 테스트 (35°C)
                        </button>
                        <button
                          onClick={() => testSensorAlert('ec', 0.5, '조1-베드1')}
                          disabled={testing || !selectedFarmId}
                          className="bg-yellow-500 text-white py-2 px-3 rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors text-sm"
                        >
                          💧 EC 부족 (0.5)
                        </button>
                        <button
                          onClick={() => testSensorAlert('ph', 4.5, '조1-베드1')}
                          disabled={testing || !selectedFarmId}
                          className="bg-purple-500 text-white py-2 px-3 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors text-sm"
                        >
                          ⚗️ pH 이상 (4.5)
                        </button>
                        <button
                          onClick={() => testSensorAlert('water', 15, '조1-베드1')}
                          disabled={testing || !selectedFarmId}
                          className="bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
                        >
                          💧 저수위 (15%)
                        </button>
                        <button
                          onClick={() => testSensorAlert('water', 95, '조1-베드1')}
                          disabled={testing || !selectedFarmId}
                          className="bg-cyan-500 text-white py-2 px-3 rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors text-sm"
                        >
                          🌊 고수위 (95%)
                        </button>
                      </div>
                    </div>

                    {testResult && (
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-900 font-medium whitespace-pre-wrap">{testResult}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 알림 유형 설정 */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">🔔 알림 유형 설정</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(notificationTemplates).map(([key, template]) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{template.title}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              template.priority === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : template.priority === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : template.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {template.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {template.message.split('\n')[0].replace(/<[^>]*>/g, '')}
                        </p>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={key}
                            checked={settings.notifications[key] || false}
                            onChange={e =>
                              setSettings(prev => ({
                                ...prev,
                                notifications: { ...prev.notifications, [key]: e.target.checked }
                              }))
                            }
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <label htmlFor={key} className="text-sm text-gray-700">
                            이 알림 받기
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 모달은 같은 최상위 컨테이너(div) 안에 둔다 */}
        {showBotInfoModal && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🆔</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">채팅 ID 확인</h2>
                <p className="text-gray-600 mb-6">텔레그램에서 @userinfobot과 대화하여 본인의 채팅 ID를 확인해주세요.</p>
                
                <div className="space-y-4 text-left mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center mb-2">
                      <span className="text-blue-600 mr-2">💬</span>
                      <span className="text-sm font-medium text-blue-800">Step 1: @userinfobot 찾기</span>
                    </div>
                    <p className="text-sm text-blue-700">텔레그램에서 "@userinfobot"을 검색하여 대화를 시작하세요.</p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center mb-2">
                      <span className="text-blue-600 mr-2">📤</span>
                      <span className="text-sm font-medium text-blue-800">Step 2: 메시지 전송</span>
                    </div>
                    <p className="text-sm text-blue-700">아무 메시지나 보내면 봇이 당신의 채팅 ID를 알려줍니다.</p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center mb-2">
                      <span className="text-blue-600 mr-2">📋</span>
                      <span className="text-sm font-medium text-blue-800">Step 3: ID 복사</span>
                    </div>
                    <p className="text-sm text-blue-700">받은 채팅 ID를 복사하여 위의 입력창에 붙여넣으세요.</p>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setShowBotInfoModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => {
                      window.open(`https://t.me/userinfobot`, '_blank');
                      setShowBotInfoModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    @userinfobot 열기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
