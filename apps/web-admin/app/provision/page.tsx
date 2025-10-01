/**
 * Mobile Provision Page
 * 
 * QR 코드 스캔 후 모바일에서 디바이스를 연결하는 페이지
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ProvisionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const tenant = searchParams.get('tenant');
  const farm = searchParams.get('farm');

  const [step, setStep] = useState<'welcome' | 'wifi' | 'connecting' | 'success'>('welcome');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">잘못된 QR 코드</h1>
          <p className="text-gray-600">유효한 Setup Token이 필요합니다.</p>
        </div>
      </div>
    );
  }

  const handleConnect = async () => {
    if (!ssid || !password) {
      setError('WiFi 정보를 입력해주세요.');
      return;
    }

    setStep('connecting');
    setError('');

    try {
      // 임시 디바이스 ID 생성
      const tempDeviceId = `MOBILE-${Date.now()}`;
      setDeviceId(tempDeviceId);

      // Bind API 호출
      const response = await fetch('http://192.168.0.204:3000/api/provisioning/bind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-setup-token': token,
        },
        body: JSON.stringify({
          device_id: tempDeviceId,
          device_type: 'mobile-provisioned',
          capabilities: ['temperature', 'humidity'],
        }),
      });

      if (!response.ok) {
        throw new Error('디바이스 등록 실패');
      }

      const data = await response.json();
      console.log('Bind 성공:', data);

      setStep('success');
    } catch (err: any) {
      setError(err.message || '연결 중 오류가 발생했습니다.');
      setStep('wifi');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🌉</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">스마트팜 디바이스 연결</h1>
              <p className="text-gray-600">QR 코드 스캔 완료!</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 font-bold mb-2">Setup Token:</p>
              <code className="text-xs text-blue-700 break-all">{token}</code>
            </div>

            <button
              onClick={() => setStep('wifi')}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              다음 →
            </button>
          </div>
        )}

        {/* WiFi Input Step */}
        {step === 'wifi' && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold mb-6">WiFi 정보 입력</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold mb-2">WiFi 이름 (SSID)</label>
                <input
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="내 WiFi 이름"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">WiFi 비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('welcome')}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-50"
              >
                ← 이전
              </button>
              <button
                onClick={handleConnect}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                연결하기
              </button>
            </div>
          </div>
        )}

        {/* Connecting Step */}
        {step === 'connecting' && (
          <div className="bg-white rounded-lg shadow-xl p-6 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold mb-2">디바이스 등록 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요</p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="bg-white rounded-lg shadow-xl p-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">연결 완료!</h2>
            <p className="text-gray-600 mb-6">디바이스가 성공적으로 등록되었습니다.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">디바이스 ID:</p>
              <code className="text-sm font-mono text-blue-700">{deviceId}</code>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-bold text-blue-900 mb-2">다음 단계:</p>
              <ol className="text-sm text-blue-800 text-left space-y-1">
                <li>1. ESP32/Arduino에 WiFi 정보를 입력하세요</li>
                <li>2. 코드를 업로드하세요</li>
                <li>3. 시리얼 모니터에서 연결을 확인하세요</li>
              </ol>
            </div>

            <a
              href="/"
              className="block w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
            >
              대시보드로 이동
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProvisionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    }>
      <ProvisionContent />
    </Suspense>
  );
}

