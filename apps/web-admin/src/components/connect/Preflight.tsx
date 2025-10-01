/**
 * Preflight Check
 * 
 * 디바이스 연결 전 사전 점검
 */

'use client';

import { useState, useEffect } from 'react';

interface PreflightProps {
  serverUrl: string;
}

interface CheckResult {
  name: string;
  status: 'pending' | 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

export function Preflight({ serverUrl }: PreflightProps) {
  const [checks, setChecks] = useState<CheckResult[]>([
    { name: '서버 접근성', status: 'pending', message: '확인 중...' },
    { name: '시간 동기화', status: 'pending', message: '확인 중...' },
    { name: '네트워크 속도', status: 'pending', message: '확인 중...' },
    { name: '포트 열림', status: 'pending', message: '확인 중...' },
  ]);

  useEffect(() => {
    runPreflightChecks();
  }, [serverUrl]);

  const runPreflightChecks = async () => {
    // 1. 서버 접근성 체크
    await checkServerAccess();
    
    // 2. 시간 동기화 체크
    await checkTimeSync();
    
    // 3. 네트워크 속도 체크
    await checkNetworkSpeed();
    
    // 4. 포트 체크
    await checkPorts();
  };

  const checkServerAccess = async () => {
    try {
      const start = Date.now();
      const response = await fetch(`${serverUrl}/health`, { method: 'GET' });
      const latency = Date.now() - start;
      
      if (response.ok) {
        updateCheck(0, {
          status: 'pass',
          message: `✅ 서버 정상 (${latency}ms)`,
          details: `Latency: ${latency}ms`,
        });
      } else {
        updateCheck(0, {
          status: 'fail',
          message: `❌ 서버 응답 오류 (HTTP ${response.status})`,
        });
      }
    } catch (err: any) {
      updateCheck(0, {
        status: 'fail',
        message: '❌ 서버에 연결할 수 없습니다',
        details: err.message,
      });
    }
  };

  const checkTimeSync = async () => {
    try {
      const localTime = Date.now();
      const response = await fetch(`${serverUrl}/health`);
      const serverDate = response.headers.get('date');
      
      if (serverDate) {
        const serverTime = new Date(serverDate).getTime();
        const diff = Math.abs(localTime - serverTime);
        
        if (diff < 5000) {  // 5초 이내
          updateCheck(1, {
            status: 'pass',
            message: `✅ 시간 동기화 정상 (차이: ${diff}ms)`,
          });
        } else if (diff < 60000) {  // 1분 이내
          updateCheck(1, {
            status: 'warn',
            message: `⚠️ 시간 차이 있음 (${Math.round(diff/1000)}초)`,
            details: 'HMAC 서명 검증에 영향을 줄 수 있습니다.',
          });
        } else {
          updateCheck(1, {
            status: 'fail',
            message: `❌ 시간 차이 큼 (${Math.round(diff/1000)}초)`,
            details: 'NTP 시간 동기화가 필요합니다.',
          });
        }
      }
    } catch (err) {
      updateCheck(1, {
        status: 'warn',
        message: '⚠️ 시간 동기화 확인 실패',
      });
    }
  };

  const checkNetworkSpeed = async () => {
    try {
      const start = Date.now();
      await fetch(`${serverUrl}/health`);
      const latency = Date.now() - start;
      
      if (latency < 100) {
        updateCheck(2, {
          status: 'pass',
          message: `✅ 네트워크 속도 우수 (${latency}ms)`,
        });
      } else if (latency < 500) {
        updateCheck(2, {
          status: 'pass',
          message: `✅ 네트워크 속도 양호 (${latency}ms)`,
        });
      } else {
        updateCheck(2, {
          status: 'warn',
          message: `⚠️ 네트워크 느림 (${latency}ms)`,
        });
      }
    } catch (err) {
      updateCheck(2, {
        status: 'fail',
        message: '❌ 네트워크 테스트 실패',
      });
    }
  };

  const checkPorts = async () => {
    // HTTP 3000, WebSocket 8080 체크
    const httpOk = await testPort(serverUrl, 'http');
    const wsUrl = serverUrl.replace('3000', '8080').replace('http', 'ws');
    const wsOk = await testWebSocket(wsUrl);
    
    if (httpOk && wsOk) {
      updateCheck(3, {
        status: 'pass',
        message: '✅ HTTP/WebSocket 포트 정상',
      });
    } else if (httpOk) {
      updateCheck(3, {
        status: 'warn',
        message: '⚠️ HTTP만 사용 가능 (WebSocket 실패)',
      });
    } else {
      updateCheck(3, {
        status: 'fail',
        message: '❌ 포트 접근 불가',
      });
    }
  };

  const testPort = async (url: string, protocol: string): Promise<boolean> => {
    try {
      const response = await fetch(`${url}/health`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  const testWebSocket = async (wsUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(`${wsUrl}/test`);
        ws.onopen = () => {
          ws.close();
          resolve(true);
        };
        ws.onerror = () => resolve(false);
        setTimeout(() => {
          ws.close();
          resolve(false);
        }, 3000);
      } catch {
        resolve(false);
      }
    });
  };

  const updateCheck = (index: number, update: Partial<CheckResult>) => {
    setChecks(prev => prev.map((check, i) => 
      i === index ? { ...check, ...update } : check
    ));
  };

  const allPassed = checks.every(c => c.status === 'pass' || c.status === 'warn');
  const anyFailed = checks.some(c => c.status === 'fail');

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="font-bold text-lg mb-4">🔍 사전 점검 (Preflight)</h3>
      
      <div className="space-y-3 mb-6">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center">
              {check.status === 'pending' && (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
              {check.status === 'pass' && <span className="text-green-600 text-xl">✅</span>}
              {check.status === 'warn' && <span className="text-yellow-600 text-xl">⚠️</span>}
              {check.status === 'fail' && <span className="text-red-600 text-xl">❌</span>}
            </div>
            
            <div className="flex-1">
              <div className="font-medium">{check.name}</div>
              <div className="text-sm text-gray-600">{check.message}</div>
              {check.details && (
                <div className="text-xs text-gray-500 mt-1">{check.details}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {allPassed && !anyFailed && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          ✅ 모든 점검 통과! 디바이스 연결을 진행할 수 있습니다.
        </div>
      )}

      {anyFailed && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          ❌ 일부 점검 실패. 문제를 해결한 후 다시 시도하세요.
        </div>
      )}
    </div>
  );
}
