'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { getCurrentUser } from '@/lib/auth';
import { AuthUser } from '@/lib/auth';

interface HealthData {
  status: string;
  timestamp: string;
  responseTime: number;
  services: {
    database: {
      status: string;
      responseTime?: number;
      latency_ms?: number;
      error?: string;
    };
  };
  resources?: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: number;
    nodeVersion: string;
    platform: string;
  };
  system?: {
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    uptime: number;
  };
  metrics: {
    activeUsers: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

interface SystemMetrics {
  timestamp: string;
  users: {
    total: number;
    active: number;
    approved: number;
    pending: number;
  };
  farms: {
    total: number;
    active: number;
  };
  devices: {
    total: number;
    online: number;
    offline: number;
    byType: Record<string, number>;
  };
  sensors: {
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
  };
  data: {
    totalReadings: number;
    last24Hours: number;
    averagePerHour: number;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

export default function SystemPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('🔍 시스템 모니터링 페이지 - 사용자 정보:', currentUser);
        if (currentUser) {
          setUser(currentUser);
        } else {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        window.location.href = '/login';
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthResponse, metricsResponse] = await Promise.all([
        fetch('/api/system/simple-health'),
        fetch('/api/system/simple-metrics')
      ]);

      // 각 응답의 상태를 개별적으로 확인
      if (!healthResponse.ok) {
        let healthError;
        try {
          healthError = await healthResponse.json();
        } catch {
          healthError = { error: '응답을 파싱할 수 없습니다.' };
        }
        console.error('헬스 API 에러:', healthError);
        throw new Error(`헬스 체크 실패: ${healthResponse.status} ${healthError.error || 'Unknown error'}`);
      }

      if (!metricsResponse.ok) {
        let metricsError;
        try {
          metricsError = await metricsResponse.json();
        } catch {
          metricsError = { error: '응답을 파싱할 수 없습니다.' };
        }
        console.error('메트릭 API 에러:', metricsError);
        throw new Error(`메트릭 수집 실패: ${metricsResponse.status} ${metricsError.error || 'Unknown error'}`);
      }

      const [health, systemMetrics] = await Promise.all([
        healthResponse.json(),
        metricsResponse.json()
      ]);

      console.log('헬스 응답:', health);
      console.log('메트릭 응답:', systemMetrics);

      // 응답 데이터 구조 확인
      if (health.success && health.data) {
        setHealthData(health.data);
      } else {
        console.error('헬스 데이터 구조 오류:', health);
        throw new Error('헬스 데이터 형식이 올바르지 않습니다.');
      }

      if (systemMetrics.success && systemMetrics.data) {
        setMetrics(systemMetrics.data);
      } else {
        console.error('메트릭 데이터 구조 오류:', systemMetrics);
        throw new Error('메트릭 데이터 형식이 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('시스템 데이터 로드 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}일 ${hours}시간 ${minutes}분`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⚠️';
    }
  };

  // 인증 로딩 중일 때
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader 
          user={user}
          title="🖥️ 시스템 모니터링" 
          subtitle="실시간 시스템 상태 및 성능 메트릭" 
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">시스템 데이터를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader 
          user={user}
          title="🖥️ 시스템 모니터링" 
          subtitle="실시간 시스템 상태 및 성능 메트릭" 
        />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-2xl mb-2">❌</div>
            <h3 className="text-red-800 font-semibold mb-2">데이터 로드 실패</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        user={user}
        title="🖥️ 시스템 모니터링" 
        subtitle="실시간 시스템 상태 및 성능 메트릭" 
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">시스템 모니터링</h1>
            <p className="text-gray-700 font-medium">실시간 시스템 상태 및 성능 메트릭</p>
          </div>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            새로고침
          </button>
        </div>

        {/* 전체 상태 */}
        {healthData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">전체 시스템 상태</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.status)}`}>
                  <span className="mr-2">{getStatusIcon(healthData.status)}</span>
                  {healthData.status === 'healthy' ? '정상' : '오류'}
                </div>
                <p className="text-xs text-gray-700 font-medium mt-1">전체 상태</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{healthData.responseTime}ms</div>
                <p className="text-xs text-gray-700 font-medium">응답 시간</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{formatUptime(healthData.system?.uptime || 0)}</div>
                <p className="text-xs text-gray-700 font-medium">가동 시간</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {healthData.system?.memoryUsage ? Math.round((healthData.system.memoryUsage.heapUsed / healthData.system.memoryUsage.heapTotal) * 100) : 0}%
                </div>
                <p className="text-xs text-gray-700 font-medium">로컬 서버 메모리</p>
              </div>
            </div>
          </div>
        )}

        {/* 서비스 상태 */}
        {healthData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">서비스 상태</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">데이터베이스</h3>
                  <p className="text-sm text-gray-700 font-medium">Supabase 연결 상태</p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.services.database.status)}`}>
                    {getStatusIcon(healthData.services.database.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{healthData.services.database.latency_ms || healthData.services.database.responseTime || 0}ms</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Node.js</h3>
                  <p className="text-sm text-gray-700 font-medium">시스템 정보</p>
                </div>
                <div className="text-right">
                  <div className="text-green-600">✅</div>
                  <p className="text-xs text-gray-700 font-medium mt-1">v{process.version}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 사용자 및 농장 통계 */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">사용자 통계</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{metrics.users.total}</div>
                  <p className="text-sm text-gray-700 font-medium">총 사용자</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{metrics.users.active}</div>
                  <p className="text-sm text-gray-700 font-medium">활성 사용자</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{metrics.users.approved}</div>
                  <p className="text-sm text-gray-700 font-medium">승인된 사용자</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-700">{metrics.users.pending}</div>
                  <p className="text-sm text-gray-700 font-medium">승인 대기</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">농장 통계</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{metrics.farms.total}</div>
                  <p className="text-sm text-gray-700 font-medium">총 농장</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{metrics.farms.active}</div>
                  <p className="text-sm text-gray-700 font-medium">활성 농장</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{metrics.devices.total}</div>
                  <p className="text-sm text-gray-700 font-medium">총 디바이스</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{metrics.devices.online}</div>
                  <p className="text-sm text-gray-700 font-medium">온라인 디바이스</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 센서 및 데이터 통계 */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">센서 통계</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">총 센서</span>
                  <span className="font-bold text-gray-900">{metrics.sensors.total}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">활성 센서</span>
                  <span className="font-bold text-green-700">{metrics.sensors.active}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">비활성 센서</span>
                  <span className="font-bold text-red-700">{metrics.sensors.inactive}개</span>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">센서 타입별</h4>
                  <div className="space-y-1">
                    {Object.entries(metrics.sensors.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 font-medium">{type}</span>
                        <span className="font-semibold text-gray-900">{count}개</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">데이터 통계</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">총 센서 데이터</span>
                  <span className="font-bold text-gray-900">{metrics.data.totalReadings.toLocaleString()}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">최근 24시간</span>
                  <span className="font-bold text-gray-900">{metrics.data.last24Hours.toLocaleString()}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">시간당 평균</span>
                  <span className="font-bold text-gray-900">{metrics.data.averagePerHour.toLocaleString()}개</span>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">성능 메트릭</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 font-medium">평균 응답 시간</span>
                      <span className="font-semibold text-gray-900">{metrics.performance.averageResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 font-medium">에러율</span>
                      <span className="font-semibold text-red-700">{(metrics.performance.errorRate * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 마지막 업데이트 시간 */}
        {healthData && (
          <div className="text-center text-sm text-gray-600 font-medium">
            마지막 업데이트: {new Date(healthData.timestamp).toLocaleString('ko-KR')}
          </div>
        )}
      </div>
    </div>
  );
}
