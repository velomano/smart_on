'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FarmMqttSettingsForm from '@/components/FarmMqttSettingsForm';
import BridgeStatusBadge from '@/components/BridgeStatusBadge';
import AppHeader from '@/components/AppHeader';
import MqttDesignGuideModal from '@/components/MqttDesignGuideModal';
import { getCurrentUser, type AuthUser } from '@/lib/auth';

interface MqttConfig {
  farm_id: string;
  broker_url: string;
  port: number;
  auth_mode: 'api_key' | 'user_pass';
  username?: string;
  client_id_prefix: string;
  ws_path?: string;
  qos_default: number;
  last_test_at?: string;
  last_test_ok?: boolean;
  is_active: boolean;
}

export default function FarmMqttSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const farmId = params.farmId as string;
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [config, setConfig] = useState<MqttConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [farmName, setFarmName] = useState<string>('');
  const [showGuideModal, setShowGuideModal] = useState(false);

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.is_approved || !currentUser.is_active) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 농장 정보 로드
        const farmResponse = await fetch(`/api/farms/${farmId}`);
        if (farmResponse.ok) {
          const farmData = await farmResponse.json();
          console.log('농장 정보 응답:', farmData);
          if (farmData.success && farmData.data) {
            setFarmName(farmData.data.name || '알 수 없는 농장');
          } else {
            setFarmName('알 수 없는 농장');
          }
        } else {
          setFarmName('알 수 없는 농장');
        }

        // MQTT 설정 로드
        const configResponse = await fetch(`/api/farms/${farmId}/mqtt-config`);
        if (configResponse.ok) {
          const configData = await configResponse.json();
          console.log('MQTT 설정 응답:', configData);
          if (configData.success && configData.data) {
            setConfig(configData.data);
          } else if (configData.data) {
            // 직접 데이터가 있는 경우
            setConfig(configData.data);
          }
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (farmId) {
      loadData();
    }
  }, [farmId]);

  const handleSave = async (configData: any) => {
    const response = await fetch(`/api/farms/${farmId}/mqtt-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '저장에 실패했습니다.');
    }

    // 설정 업데이트
    const updatedConfig = {
      ...configData,
      farm_id: farmId,
      is_active: true, // 저장 시 활성 상태로 설정
      last_test_at: new Date().toISOString(),
      last_test_ok: true
    };
    setConfig(updatedConfig);
  };

  const handleTest = async (): Promise<boolean> => {
    const response = await fetch(`/api/farms/${farmId}/mqtt-test`, {
      method: 'POST',
    });

    const result = await response.json();
    return result.success;
  };

  // 로그인/권한 체크 완료
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader 
          user={user}
          title="MQTT 설정"
          subtitle="설정을 불러오는 중..."
        />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">설정을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        user={user}
        title="MQTT 설정"
        subtitle={`${farmName} - ${farmId}`}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                MQTT 브로커 설정
              </h1>
              <p className="mt-2 text-gray-600">
                {farmName} - {farmId}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowGuideModal(true)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>설계 가이드</span>
              </button>
              <BridgeStatusBadge farmId={farmId} />
            </div>
          </div>
        </div>

        {/* 설정 폼 */}
        <FarmMqttSettingsForm
          farmId={farmId}
          farmName={farmName}
          initialConfig={config}
          onSave={handleSave}
          onTest={handleTest}
        />

        {/* 현재 설정 상태 */}
        {config && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              현재 설정 상태
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">브로커 URL:</span>
                <span className="ml-2 text-gray-900">{config.broker_url}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">포트:</span>
                <span className="ml-2 text-gray-900">{config.port}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">인증 방식:</span>
                <span className="ml-2 text-gray-900">
                  {config.auth_mode === 'api_key' ? 'API 키' : '사용자명/비밀번호'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">활성 상태:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  config.is_active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {config.is_active ? '활성' : '비활성'}
                </span>
              </div>
              {config.last_test_at && (
                <>
                  <div>
                    <span className="font-medium text-gray-700">마지막 테스트:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(config.last_test_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">테스트 결과:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      config.last_test_ok 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {config.last_test_ok ? '성공' : '실패'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 데이터 흐름 설명 */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔄 MQTT 데이터 흐름
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                📊 센서 데이터 수신
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  농장 센서 → MQTT 브로커
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  MQTT 브릿지 구독
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Supabase DB 저장
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  웹어드민 표시
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                🎛️ 제어 명령 전송
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  웹어드민 명령 생성
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Supabase DB 저장
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  MQTT 브릿지 발송
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  농장 디바이스 제어
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 설정 도움말 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            ⚙️ 설정 도움말
          </h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="bg-white rounded p-3 border border-blue-200">
              <p className="font-semibold text-blue-900 mb-1">브로커 URL</p>
              <p>MQTT 브로커의 주소 (예: mqtts://your-broker.com, wss://your-broker.com/mqtt)</p>
            </div>
            <div className="bg-white rounded p-3 border border-blue-200">
              <p className="font-semibold text-blue-900 mb-1">포트</p>
              <p>일반적으로 1883 (비암호화), 8883 (SSL/TLS), 443 (WSS)</p>
            </div>
            <div className="bg-white rounded p-3 border border-blue-200">
              <p className="font-semibold text-blue-900 mb-1">인증 방식</p>
              <p>API 키 또는 사용자명/비밀번호 중 선택 (브로커 설정에 따라)</p>
            </div>
            <div className="bg-white rounded p-3 border border-blue-200">
              <p className="font-semibold text-blue-900 mb-1">연결 테스트</p>
              <p>설정 저장 후 반드시 연결 테스트를 수행하여 정상 작동 확인</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
              <p className="font-semibold text-yellow-800 mb-1">⚠️ 중요 사항</p>
              <p>프로덕션 환경에서는 SSL/TLS 연결을 권장하며, 설정 후 MQTT 브릿지가 자동으로 재시작됩니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* MQTT 설계 가이드 모달 */}
      <MqttDesignGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        currentFarmId={farmId}
        currentFarmName={farmName}
      />
    </div>
  );
}
