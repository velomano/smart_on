/**
 * Universal Bridge 관리 컴포넌트
 * 
 * JWT 토큰 서버와 MQTT 브로커 상태 모니터링 및 관리
 */

'use client';

import React, { useState, useEffect } from 'react';

interface BridgeStatus {
  ok: boolean;
  bridge?: {
    status: string;
    timestamp: string;
    version: string;
    services?: {
      http: string;
      mqtt: string;
    };
  };
  traceId: string;
}

interface MQTTStats {
  success: boolean;
  status: string;
  stats: {
    totalConnections: number;
    activeConnections: number;
    totalMessages: number;
    totalSubscriptions: number;
  };
  timestamp: string;
}

interface MQTTClients {
  success: boolean;
  clients: Array<{
    id: string;
    deviceId?: string;
    tenantId?: string;
    farmId?: string;
    connectedAt: string;
    lastSeen: string;
    subscriptionCount: number;
  }>;
  totalClients: number;
  timestamp: string;
}

export default function UniversalBridgeManager() {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [mqttStats, setMqttStats] = useState<MQTTStats | null>(null);
  const [mqttClients, setMqttClients] = useState<MQTTClients | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 데이터 새로고침
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Bridge 상태 확인
      const bridgeResponse = await fetch('/api/bridge');
      const bridgeData = await bridgeResponse.json();
      setBridgeStatus(bridgeData);

      // MQTT 브로커 상태
      const mqttResponse = await fetch('/api/bridge?endpoint=/api/mqtt/status');
      const mqttData = await mqttResponse.json();
      setMqttStats(mqttData.data);

      // 연결된 클라이언트 목록
      const clientsResponse = await fetch('/api/bridge?endpoint=/api/mqtt/clients');
      const clientsData = await clientsResponse.json();
      setMqttClients(clientsData.data);

    } catch (err: any) {
      console.error('Bridge 데이터 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 자동 새로고침
  useEffect(() => {
    refreshData();

    if (autoRefresh) {
      const interval = setInterval(refreshData, 10000); // 10초마다
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // 클라이언트 연결 해제
  const disconnectClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/bridge?endpoint=/api/mqtt/clients/${clientId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await refreshData(); // 데이터 새로고침
        alert(`클라이언트 ${clientId} 연결이 해제되었습니다.`);
      } else {
        throw new Error('클라이언트 연결 해제 실패');
      }
    } catch (err: any) {
      console.error('클라이언트 연결 해제 실패:', err);
      alert(`연결 해제 실패: ${err.message}`);
    }
  };

  if (loading && !bridgeStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Universal Bridge 상태 확인 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Universal Bridge 관리</h2>
          <p className="text-gray-600">JWT 토큰 서버와 MQTT 브로커 상태 모니터링</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">자동 새로고침 (10초)</span>
          </label>
          <button
            onClick={refreshData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '새로고침 중...' : '새로고침'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">연결 오류</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bridge 상태 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bridge 상태</h3>
        {bridgeStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                bridgeStatus.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {bridgeStatus.ok ? '✅ 연결됨' : '❌ 연결 실패'}
              </div>
            </div>
            {bridgeStatus.bridge && (
              <>
                <div className="text-center">
                  <div className="text-sm text-gray-500">버전</div>
                  <div className="font-medium">{bridgeStatus.bridge.version}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">마지막 업데이트</div>
                  <div className="font-medium">
                    {new Date(bridgeStatus.bridge.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-gray-500">Bridge 상태를 불러올 수 없습니다.</div>
        )}
      </div>

      {/* MQTT 브로커 통계 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">MQTT 브로커 통계</h3>
        {mqttStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{mqttStats.stats.totalConnections}</div>
              <div className="text-sm text-gray-500">총 연결</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{mqttStats.stats.activeConnections}</div>
              <div className="text-sm text-gray-500">활성 연결</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{mqttStats.stats.totalMessages}</div>
              <div className="text-sm text-gray-500">총 메시지</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{mqttStats.stats.totalSubscriptions}</div>
              <div className="text-sm text-gray-500">총 구독</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">MQTT 브로커 통계를 불러올 수 없습니다.</div>
        )}
      </div>

      {/* 연결된 클라이언트 목록 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">연결된 클라이언트</h3>
        {mqttClients ? (
          <div className="space-y-4">
            {mqttClients.clients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        클라이언트 ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        디바이스 ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        테넌트
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        연결 시간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        구독 수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mqttClients.clients.map((client) => (
                      <tr key={client.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.deviceId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.tenantId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.connectedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.subscriptionCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => disconnectClient(client.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            연결 해제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                연결된 클라이언트가 없습니다.
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">클라이언트 목록을 불러올 수 없습니다.</div>
        )}
      </div>
    </div>
  );
}
