import React, { useState, useEffect } from 'react';

interface BridgeHealth {
  total_farms: number;
  active_farms: number;
  healthy_farms: number;
  last_updated: string;
}

interface BridgeStatusBadgeProps {
  farmId?: string;
  className?: string;
}

export default function BridgeStatusBadge({ farmId, className = '' }: BridgeStatusBadgeProps) {
  const [health, setHealth] = useState<BridgeHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/realtime/bridge-health');
        
        // 응답 상태 확인
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Content-Type 확인
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format - expected JSON');
        }
        
        // JSON 파싱
        const text = await response.text();
        if (!text.trim()) {
          throw new Error('Empty response body');
        }
        
        const data = JSON.parse(text);
        
        if (data.success) {
          setHealth(data.data);
          setError(null);
        } else {
          setError('브리지 상태 조회 실패');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '네트워크 오류');
        console.error('Failed to fetch bridge health:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    
    // 30초마다 상태 업데이트 (에러가 있을 때는 더 긴 간격)
    const interval = setInterval(() => {
      if (!error) {
        fetchHealth();
      }
    }, error ? 60000 : 30000);
    
    return () => clearInterval(interval);
  }, [error]);

  if (loading) {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 animate-pulse" />
        <span className="text-gray-600">브리지 상태 확인 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
        <span title={error}>브리지 오류</span>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  // 상태별 색상 및 아이콘 결정
  let statusColor = 'bg-gray-100 text-gray-700';
  let statusIcon = '⚪';
  let statusText = '알 수 없음';

  if (health.total_farms === 0) {
    statusColor = 'bg-gray-100 text-gray-700';
    statusText = '농장 없음';
  } else if (health.healthy_farms === health.total_farms) {
    statusColor = 'bg-green-100 text-green-700';
    statusIcon = '🟢';
    statusText = '모든 농장 정상';
  } else if (health.healthy_farms > 0) {
    statusColor = 'bg-yellow-100 text-yellow-700';
    statusIcon = '🟡';
    statusText = `${health.healthy_farms}/${health.total_farms} 농장 정상`;
  } else {
    statusColor = 'bg-red-100 text-red-700';
    statusIcon = '🔴';
    statusText = '모든 농장 오류';
  }

  // 특정 농장 상태 확인
  if (farmId && health.healthy_farms < health.total_farms) {
    // 실제로는 farmId별 상태를 확인해야 하지만, 
    // 현재는 전체 상태만 반환하므로 간단히 처리
    statusColor = 'bg-yellow-100 text-yellow-700';
    statusIcon = '🟡';
    statusText = '일부 농장 오류';
  }

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${statusColor} ${className}`}>
      <span className="mr-2">{statusIcon}</span>
      <span className="font-medium">{statusText}</span>
      {health.last_updated && (
        <span className="ml-2 text-xs opacity-75">
          ({new Date(health.last_updated).toLocaleTimeString()})
        </span>
      )}
    </div>
  );
}
