/**
 * Live Log
 * 
 * 실시간 디바이스 연결 로그 표시
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warn';
  message: string;
}

interface LiveLogProps {
  setupToken: string;
  deviceId?: string;
}

export function LiveLog({ setupToken, deviceId }: LiveLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: new Date().toISOString(), level: 'info', message: '🔍 디바이스 연결 대기 중...' }
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // WebSocket 연결
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [setupToken]);

  useEffect(() => {
    // 자동 스크롤
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`ws://localhost:8080/monitor/${setupToken}`);
      
      ws.onopen = () => {
        setIsConnected(true);
        addLog('success', '✅ 실시간 모니터링 시작');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'device_connected') {
          addLog('success', `🎉 디바이스 연결됨: ${data.device_id}`);
        } else if (data.type === 'telemetry') {
          addLog('info', `📊 센서 데이터: ${data.key}=${data.value}${data.unit}`);
        } else if (data.type === 'error') {
          addLog('error', `❌ 오류: ${data.message}`);
        } else {
          addLog('info', `ℹ️ ${data.message || JSON.stringify(data)}`);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        addLog('warn', '⚠️ WebSocket 연결 실패 (폴링 모드로 전환)');
        // Fallback to polling
        startPolling();
      };

      ws.onclose = () => {
        setIsConnected(false);
        addLog('warn', '⚠️ 실시간 모니터링 종료');
      };

      wsRef.current = ws;
    } catch (err) {
      addLog('warn', '⚠️ WebSocket 미지원 (폴링 모드 사용)');
      startPolling();
    }
  };

  const startPolling = () => {
    // 5초마다 폴링
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/provisioning/status/${setupToken}`);
        if (response.ok) {
          const data = await response.json();
          if (data.device_id) {
            addLog('success', `🎉 디바이스 연결됨: ${data.device_id}`);
            clearInterval(interval);
          }
        }
      } catch (err) {
        // 조용히 실패
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const addLog = (level: LogEntry['level'], message: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      level,
      message,
    }]);
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-bold">📡 실시간 로그</h4>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs text-gray-400">
            {isConnected ? 'WebSocket 연결됨' : '폴링 모드'}
          </span>
        </div>
      </div>

      <div className="bg-gray-950 rounded p-3 h-64 overflow-y-auto font-mono text-xs">
        {logs.map((log, index) => (
          <div key={index} className={`mb-1 ${getLevelColor(log.level)}`}>
            <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
