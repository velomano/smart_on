'use client';
import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { notificationTemplates } from '@/lib/notificationTemplates';
import { getCurrentUser } from '@/lib/mockAuth';
import { AuthUser } from '@/lib/mockAuth';

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

  // 알림 설정 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    let loadedSettings = savedSettings ? JSON.parse(savedSettings) : {};

    // test1 계정인 경우 기본 텔레그램 설정 적용
    if (user?.email === 'test1@test.com') {
      const defaultTest1Id = '6827239951';
      loadedSettings = {
        ...loadedSettings,
        telegramEnabled: true,
        telegramChatId: loadedSettings.telegramChatId || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || localStorage.getItem('defaultTelegramChatId') || defaultTest1Id
      };
    }

    setSettings(prev => ({ ...prev, ...loadedSettings }));

    // 기본 알림 설정 (모든 알림 활성화)
    const defaultNotifications = Object.keys(notificationTemplates).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setSettings(prev => ({
      ...prev,
      notifications: { ...defaultNotifications, ...prev.notifications }
    }));
  }, [user]);

  // 설정 저장
  const saveSettings = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    alert('알림 설정이 저장되었습니다!');
  };

  // 테스트 알림 전송
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '🧪 <b>테스트 알림</b>\n\n✅ 텔레그램 알림 시스템이 정상적으로 작동합니다!\n⏰ 시간: ' + new Date().toLocaleString('ko-KR'),
          chatId: settings.telegramChatId
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        setTestResult('✅ 테스트 알림이 성공적으로 전송되었습니다!');
      } else {
        setTestResult(`❌ 테스트 실패: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ 테스트 실패: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  // 센서 알림 테스트 (2농장 2베드 연동 + 대시보드 알림)
  const testSensorAlert = async (sensorType: string, value: number, location: string) => {
    setTesting(true);
    setTestResult('');
    
    try {
      const thresholds = {
        temperature: { min: 15, max: 30 },
        ec: { min: 1.0, max: 3.0 },
        ph: { min: 5.5, max: 6.5 },
        humidity: { min: 40, max: 80 },
        water: { min: 20, max: 90 }
      };

      // 2농장 2베드 베드ID로 설정 (bed_004)
      const testLocation = '2농장-베드2';
      const testDeviceId = 'bed_004';

      // 대시보드 알림도 함께 추가하기 위해 notificationService를 직접 호출
      const { checkSensorDataAndNotify } = await import('@/lib/notificationService');
      const { dashboardAlertManager } = await import('@/lib/dashboardAlerts');
      
      // 샌서 데이터 생성 (2농장 2베드 연동)
      const sensorData = {
        id: `test_${sensorType}_${Date.now()}`,
        type: sensorType as 'temperature' | 'humidity' | 'ec' | 'ph' | 'water',
        value: value,
        location: testLocation,
        timestamp: new Date(),
        thresholds: thresholds[sensorType as keyof typeof thresholds],
        deviceId: testDeviceId
      };

      // 알림 전송 (텔레그램 + 대시보드 모두)
      await checkSensorDataAndNotify(sensorData);

      // 추가적으로 대시보드 경고도 직접 추가
      try {
        dashboardAlertManager.checkSensorDataAndAlert(
          sensorType,
          value,
          testLocation,
          `test_${sensorType}_${Date.now()}`,
          testDeviceId,
          thresholds
        );
      } catch (alertError) {
        console.error('대시보드 알림 추가 실패:', alertError);
      }

      setTestResult(`✅ ${sensorType} 센서 알림 테스트가 성공적으로 전송되었습니다!\n값: ${value}, 위치: ${testLocation}\n📱 텔레그램 알림 + 🚨 대시보드 알림 연동 완료!`);
      
    } catch (error) {
      setTestResult(`❌ 오류 발생: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  // 봇 정보 확인
  const checkBotInfo = async () => {
    setBotInfoLoading(true);
    try {
      const response = await fetch('/api/notifications/telegram');
      const result = await response.json();
      
      if (result.ok) {
        setBotInfo(result.botInfo);
        setShowBotInfoModal(true);
      } else {
        alert(`봇 정보 확인 실패: ${result.error}`);
      }
    } catch (error) {
      alert(`봇 정보 확인 실패: ${error}`);
    } finally {
      setBotInfoLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <AppHeader 
        user={user}
        title="알림 설정"
        subtitle="텔레그램 알림 시스템 관리"
        showBackButton={true}
        backButtonText="대시보드"
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🔔 알림 설정</h1>

          {/* 텔레그램 설정 */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 텔레그램 설정</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="telegramEnabled"
                  checked={settings.telegramEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegramEnabled: e.target.checked }))}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="telegramEnabled" className="text-gray-900 font-medium">
                  텔레그램 알림 활성화
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  텔레그램 채팅 ID
                  {user?.email === 'test1@test.com' && (
                    <span className="text-xs ml-2 text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      (새로 입력하면 교체됨)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={settings.telegramChatId}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                  placeholder={user?.email === 'test1@test.com' ? '새 텔레그램 ID 입력시 교체 (기본값: 6827239951)' : '예: 123456789 또는 @username'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
                <p className="text-sm text-gray-600 mt-1">
                  {user?.email === 'test1@test.com' 
                    ? '💡 기본값: 6827239951. 새 ID 입력시 해당 채팅으로 알림 전송됩니다.' 
                    : '💡 채팅 ID는 @userinfobot에게 메시지를 보내면 확인할 수 있습니다.'}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={checkBotInfo}
                  disabled={botInfoLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {botInfoLoading ? '🤖 확인 중...' : '🤖 봇 정보 확인'}
                </button>
                
                <button
                  onClick={sendTestNotification}
                  disabled={testing || !settings.telegramChatId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {testing ? '🧪 테스트 중...' : '🧪 테스트 알림 전송'}
                </button>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">🌡️ 센서 알림 테스트</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => testSensorAlert('temperature', 12, '조1-베드1')}
                    disabled={testing}
                    className="bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    ❄️ 저온 테스트 (12°C)
                  </button>
                  <button
                    onClick={() => testSensorAlert('temperature', 35, '조1-베드1')}
                    disabled={testing}
                    className="bg-orange-500 text-white py-2 px-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    🌡️ 고온 테스트 (35°C)
                  </button>
                  <button
                    onClick={() => testSensorAlert('ec', 0.5, '조1-베드1')}
                    disabled={testing}
                    className="bg-yellow-500 text-white py-2 px-3 rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    💧 EC 부족 (0.5)
                  </button>
                  <button
                    onClick={() => testSensorAlert('ph', 4.5, '조1-베드1')}
                    disabled={testing}
                    className="bg-purple-500 text-white py-2 px-3 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    ⚗️ pH 이상 (4.5)
                  </button>
                  <button
                    onClick={() => testSensorAlert('water', 15, '조1-베드1')}
                    disabled={testing}
                    className="bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    💧 저수위 (15%)
                  </button>
                  <button
                    onClick={() => testSensorAlert('water', 95, '조1-베드1')}
                    disabled={testing}
                    className="bg-cyan-500 text-white py-2 px-3 rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    🌊 고수위 (95%)
                  </button>
                </div>
              </div>

              {testResult && (
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm">{testResult}</p>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      template.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      template.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
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
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          [key]: e.target.checked
                        }
                      }))}
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

          {/* 설정 저장 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                💾 설정 저장
              </button>
            </div>
          </div>

          {/* 사용방법 안내 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">📱 텔레그램 알림 설정 방법</h2>
            <div className="space-y-4 text-blue-800">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">1️⃣ 봇과 대화 시작</h3>
                <p className="text-sm">텔레그램에서 <span className="font-mono bg-blue-100 px-2 py-1 rounded">@mart_farm_alert_bot</span> 검색 후 대화를 시작하세요.</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">2️⃣ 채팅 ID 확인</h3>
                <p className="text-sm">@userinfobot에게 메시지를 보내면 채팅 ID를 확인할 수 있습니다.</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">3️⃣ 알림 설정</h3>
                <p className="text-sm">위에서 텔레그램 알림을 활성화하고 채팅 ID를 입력한 후 설정을 저장하세요.</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">4️⃣ 테스트</h3>
                <p className="text-sm">테스트 버튼을 눌러서 알림이 정상적으로 오는지 확인하세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 봇 정보 모달 */}
      {showBotInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">봇 정보</h2>
              
              {botInfo && (
                <div className="space-y-3 text-left">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">봇 이름</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{botInfo.first_name}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">사용자명</span>
                    </div>
                    <p className="text-lg font-semibold text-blue-600">@{botInfo.username}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">봇 ID</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{botInfo.id}</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center">
                      <span className="text-green-600 mr-2">✅</span>
                      <span className="text-sm font-medium text-green-800">봇이 정상적으로 작동합니다</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowBotInfoModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    window.open(`https://t.me/${botInfo?.username}`, '_blank');
                    setShowBotInfoModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  봇과 대화하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
