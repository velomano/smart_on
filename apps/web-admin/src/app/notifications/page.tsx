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

    // test1 계정도 일반 사용자와 동일하게 처리 (강제 설정 제거)  
    // 사용자가 원할 때만 알림 활성화 가능
    console.log('🔒 test1 계정 강제 텔레그램 설정 제거됨');
    
    // 모든 사용자는 자신이 원하는 때에만 알림을 활성화할 수 있음

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

  // 센서 알림 테스트 - 알림 설정 페이지에서는 정상 작동
  const testSensorAlert = async (sensorType: string, value: number, location: string) => {
    setTesting(true);
    setTestResult('');
    
    try {
      console.log('🔔 센서 알림 테스트 시작 (알림 설정 페이지 테스트 기능)');
      
      // 알림 설정 페이지에서는 테스트 기능이 작동하도록
      if (!settings.telegramChatId) {
        alert('텔레그램 채팅 ID를 입력해주세요.');
        return;
      }

      const thresholds = {
        temperature: { min: 15, max: 30 },
        ec: { min: 1.0, max: 3.0 },
        ph: { min: 5.5, max: 6.5 },
        humidity: { min: 40, max: 80 },
        water: { min: 20, max: 90 }
      };

      // 1. 대시보드 알림 먼저 추가
      try {
        const { dashboardAlertManager } = await import('@/lib/dashboardAlerts');
        const thresholds = {
          temperature: { min: 15, max: 30 },
          ec: { min: 1.0, max: 3.0 },
          ph: { min: 5.5, max: 6.5 },
          humidity: { min: 40, max: 80 },
          water: { min: 20, max: 90 }
        };
        
        dashboardAlertManager.checkSensorDataAndAlert(
          sensorType,
          value,
          location || '조1-베드1',
          `test_${sensorType}_${Date.now()}`,
          'bed_test_001',
          { [sensorType]: thresholds[sensorType as keyof typeof thresholds] }
        );
        
        console.log(`✅ ${sensorType} 센서 대시보드 알림 추가 완료`);
      } catch (dashboardError) {
        console.error('대시보드 알림 추가 실패:', dashboardError);
      }

      // 2. 텔레그램 알림 전송
      const response = await fetch('/api/notifications/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🧪 <b>${sensorType} 센서 알림 테스트</b>\n\n🎯 ${sensorType} 센서 테스트 값: ${value}\n📍 위치: ${location || '조1-베드1'}\n⏰ 시간: ${new Date().toLocaleString('ko-KR')}`,
          chatId: settings.telegramChatId
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        setTestResult(`✅ ${sensorType} 센서 테스트 알림이 성공적으로 전송되었습니다!\n📱 텔레그램 알림 + 🚨 대시보드 알림\n값: ${value}, 위치: ${location || '조1-베드1'}`);
      } else {
        setTestResult(`❌ 센서 테스트 실패: ${result.error}\n(대시보드 알림은 추가됨)`);
      }
      
    } catch (error) {
      setTestResult(`❌ 오류 발생: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  // 채팅 ID 확인 (userinfobot 연동)
  const checkBotInfo = async () => {
    setBotInfoLoading(true);
    try {
      // 간단하게 모달만 열기 - 실제 ID 탐지 기능 제거
      setBotInfo({
        botName: 'User Info Bot',
        username: '@userinfobot',
        description: '텔레그램에서 @userinfobot과 대화를 시작하면 채팅 ID를 확인할 수 있습니다.'
      });
      setShowBotInfoModal(true);
    } catch (error) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AppHeader 
        user={user}
        title="알림 설정"
        subtitle="텔레그램 알림 시스템 관리"
        showBackButton={true}
        backButtonText="대시보드"
      />
      
      <main className="max-w-7xl mx-auto pt-4 pb-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Overview Section */}
        <div className="mb-8">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">알림 설정</h2>
            <p className="text-lg text-gray-600">텔레그램 알림 시스템을 설정하고 관리하세요</p>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">

          {/* 사용방법 안내 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200 mb-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">📱 텔레그램 알림 설정 방법</h2>
            <div className="space-y-4 text-blue-800">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">1️⃣ 봇과 대화 시작</h3>
                <p className="text-sm">텔레그램에서 <span className="font-mono bg-blue-100 px-2 py-1 rounded">@mart_farm_alert_bot</span> 검색 후 대화를 시작하세요.</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-blue-900">2️⃣ 채팅 ID 확인</h3>
                  <button
                    onClick={checkBotInfo}
                    disabled={botInfoLoading}
                    className="px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {botInfoLoading ? '🤖 확인 중...' : '🤖 채팅 ID 자동 확인'}
                  </button>
                </div>
                <p className="text-sm">@userinfobot에게 메시지를 보내면 채팅 ID를 확인할 수 있습니다.</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">3️⃣ 알림 설정</h3>
                <p className="text-sm">아래에서 텔레그램 알림을 활성화하고 채팅 ID를 입력한 후 설정을 저장하세요.</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">4️⃣ 테스트</h3>
                <p className="text-sm">테스트 버튼을 눌러서 알림이 정상적으로 오는지 확인하세요.</p>
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
                </label>
                <input
                  type="text"
                  value={settings.telegramChatId}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                  placeholder="예: 123456789 또는 @username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
                <p className="text-sm text-gray-600 mt-1">
                  💡 채팅 ID는 @userinfobot에게 메시지를 보내면 확인할 수 있습니다.
                </p>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={sendTestNotification}
                  disabled={testing || !settings.telegramChatId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {testing ? '🧪 테스트 중...' : '🧪 테스트 알림 전송'}
                </button>
                
                <button
                  onClick={saveSettings}
                  className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  💾 설정 저장
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

        </div>
      </main>

      {/* 채팅 ID 확인 모달 */}
      {showBotInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
  );
}
