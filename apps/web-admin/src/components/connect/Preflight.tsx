/**
 * Preflight Checks
 * 
 * 연결 전 사전 점검
 * TODO: 실제 점검 로직 구현
 */

'use client';

import { useState, useEffect } from 'react';

type CheckStatus = 'pending' | 'checking' | 'passed' | 'failed';

interface Check {
  name: string;
  status: CheckStatus;
  message?: string;
}

export function Preflight({ onComplete }: { onComplete: () => void }) {
  const [checks, setChecks] = useState<Check[]>([
    { name: 'Port reachability', status: 'pending' },
    { name: 'Broker availability', status: 'pending' },
    { name: 'User permissions', status: 'pending' },
    { name: 'Rate limit', status: 'pending' },
    { name: 'Time sync', status: 'pending' },
  ]);

  useEffect(() => {
    // TODO: 실제 점검 실행
    runChecks();
  }, []);

  const runChecks = async () => {
    // TODO: 각 점검 실행
    for (let i = 0; i < checks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setChecks(prev => prev.map((check, idx) => 
        idx === i ? { ...check, status: 'passed' as CheckStatus, message: 'OK' } : check
      ));
    }
  };

  const allPassed = checks.every(check => check.status === 'passed');

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">사전 점검</h3>
      
      <div className="space-y-2 mb-6">
        {checks.map((check, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <StatusIcon status={check.status} />
            <span className="flex-1">{check.name}</span>
            {check.message && (
              <span className="text-sm text-gray-600">{check.message}</span>
            )}
          </div>
        ))}
      </div>

      {allPassed && (
        <button
          onClick={onComplete}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          ✅ 모든 점검 통과! 계속하기
        </button>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case 'pending':
      return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    case 'checking':
      return <div className="w-5 h-5 rounded-full bg-yellow-400 animate-pulse" />;
    case 'passed':
      return <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>;
    case 'failed':
      return <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">✗</div>;
  }
}

