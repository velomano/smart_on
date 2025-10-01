/**
 * Live Log
 * 
 * 실시간 로그 스트림
 * TODO: WebSocket 연결 구현
 */

'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  source: string;
  message: string;
}

export function LiveLog({ deviceId }: { deviceId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // TODO: WebSocket 연결
    // const ws = new WebSocket(`wss://api.smartfarm.app/logs/device/${deviceId}`);
    
    // 임시 데이터
    setLogs([
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        source: 'ingestion',
        message: 'Waiting for device connection...',
      },
    ]);
  }, [deviceId]);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">실시간 로그</h3>
      
      <div className="bg-gray-900 rounded p-4 h-64 overflow-y-auto font-mono text-sm">
        {logs.map((log, idx) => (
          <div key={idx} className="mb-1">
            <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            {' '}
            <span className={`font-bold ${getLevelColor(log.level)}`}>
              [{log.level.toUpperCase()}]
            </span>
            {' '}
            <span className="text-blue-400">{log.source}</span>
            {' '}
            <span className="text-white">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getLevelColor(level: string): string {
  switch (level) {
    case 'info': return 'text-blue-400';
    case 'warn': return 'text-yellow-400';
    case 'error': return 'text-red-400';
    case 'success': return 'text-green-400';
    default: return 'text-white';
  }
}

