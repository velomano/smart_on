'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import UniversalBridgeManager from '@/components/UniversalBridgeManager';
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

interface Device {
  id: string;
  name: string;
  device_type: string;
  farm_id: string;
  location?: string;
  description?: string;
  mqtt_topic: string;
  status: string;
  created_at: string;
  updated_at: string;
  farm?: {
    name: string;
  };
  sensors?: any[];
  latest_data?: {
    temperature?: number;
    humidity?: number;
    ec_value?: number;
    ph_value?: number;
    timestamp: string;
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
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [activeTab, setActiveTab] = useState<'system' | 'bridge'>('system');
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    device_type: 'sensor',
    farm_id: '',
    location: '',
    description: '',
    mqtt_topic: ''
  });
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

      const [healthResponse, metricsResponse, devicesResponse] = await Promise.allSettled([
        fetch('/api/system/simple-health'),
        fetch('/api/system/simple-metrics'),
        fetch('/api/devices')
      ]);

      // 각 응답의 상태를 개별적으로 확인
      let health, systemMetrics, devicesData;

      // 헬스 응답 처리
      if (healthResponse.status === 'fulfilled' && healthResponse.value.ok) {
        health = await healthResponse.value.json();
      } else {
        const healthError = healthResponse.status === 'rejected' 
          ? healthResponse.reason 
          : await healthResponse.value.json().catch(() => ({ error: '응답을 파싱할 수 없습니다.' }));
        console.error('헬스 API 에러:', healthError);
        throw new Error(`헬스 체크 실패: ${healthResponse.status === 'rejected' ? 'Network error' : healthResponse.value.status} ${healthError.error || 'Unknown error'}`);
      }

      // 메트릭 응답 처리
      if (metricsResponse.status === 'fulfilled' && metricsResponse.value.ok) {
        systemMetrics = await metricsResponse.value.json();
      } else {
        const metricsError = metricsResponse.status === 'rejected' 
          ? metricsResponse.reason 
          : await metricsResponse.value.json().catch(() => ({ error: '응답을 파싱할 수 없습니다.' }));
        console.error('메트릭 API 에러:', metricsError);
        throw new Error(`메트릭 수집 실패: ${metricsResponse.status === 'rejected' ? 'Network error' : metricsResponse.value.status} ${metricsError.error || 'Unknown error'}`);
      }

      // 디바이스 응답 처리 (선택적)
      if (devicesResponse.status === 'fulfilled' && devicesResponse.value.ok) {
        devicesData = await devicesResponse.value.json();
      } else {
        console.warn('디바이스 API 호출 실패:', devicesResponse.status === 'rejected' ? devicesResponse.reason : 'HTTP error');
        devicesData = { ok: false, data: [] };
      }

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

      // 디바이스 데이터 처리 (선택적)
      if (devicesData && typeof devicesData === 'object') {
        if (devicesData.ok && Array.isArray(devicesData.data)) {
          setDevices(devicesData.data);
        } else if (devicesData.ok && devicesData.data === null) {
          // 빈 디바이스 목록
          setDevices([]);
        } else {
          console.warn('디바이스 데이터 구조가 예상과 다름:', devicesData);
          setDevices([]);
        }
      } else {
        console.warn('디바이스 API 응답이 비어있음:', devicesData);
        setDevices([]);
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

  const handleDeviceEdit = (device: Device) => {
    setEditingDevice(device);
    setDeviceForm({
      name: device.name,
      device_type: device.device_type,
      farm_id: device.farm_id,
      location: device.location || '',
      description: device.description || '',
      mqtt_topic: device.mqtt_topic
    });
    setIsDeviceModalOpen(true);
  };

  const handleDeviceSave = async () => {
    try {
      const url = editingDevice ? `/api/devices?id=${editingDevice.id}` : '/api/devices';
      const method = editingDevice ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceForm)
      });

      const result = await response.json();

      if (result.ok) {
        alert(editingDevice ? '디바이스가 수정되었습니다.' : '디바이스가 생성되었습니다.');
        setIsDeviceModalOpen(false);
        setEditingDevice(null);
        setDeviceForm({
          name: '',
          device_type: 'sensor',
          farm_id: '',
          location: '',
          description: '',
          mqtt_topic: ''
        });
        fetchData(); // 데이터 새로고침
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('디바이스 저장 오류:', error);
      alert('디바이스 저장 중 오류가 발생했습니다.');
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
          title="시스템 모니터링" 
          subtitle="실시간 시스템 상태 및 성능 메트릭" 
        />
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 lg:py-8">
          <div className="flex items-center justify-center h-32 sm:h-48 lg:h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-blue-600 mx-auto mb-2 sm:mb-3 lg:mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base">시스템 데이터를 불러오는 중...</p>
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
          title="시스템 모니터링" 
          subtitle="실시간 시스템 상태 및 성능 메트릭" 
        />
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 lg:py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 lg:p-6 text-center">
            <div className="text-red-600 text-lg sm:text-xl lg:text-2xl mb-1 sm:mb-2">❌</div>
            <h3 className="text-red-800 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">데이터 로드 실패</h3>
            <p className="text-red-600 mb-2 sm:mb-3 lg:mb-4 text-xs sm:text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="bg-red-600 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
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
        title="시스템 모니터링" 
        subtitle="실시간 시스템 상태 및 성능 메트릭" 
      />
      
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 lg:py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-6">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600">시스템 관리</h1>
            <p className="text-gray-600 font-medium text-sm sm:text-base">시스템 모니터링 및 Universal Bridge 관리</p>
          </div>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
          >
            새로고침
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('system')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'system'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                시스템 모니터링
              </button>
              <button
                onClick={() => setActiveTab('bridge')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bridge'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Universal Bridge
              </button>
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'system' && (
          <>
            {/* 전체 상태 */}
            {healthData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 lg:p-6 mb-2 sm:mb-3 lg:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-600 mb-2 sm:mb-3 lg:mb-4">전체 시스템 상태</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <div className="text-center">
                <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(healthData.status)}`}>
                  <span className="mr-1 sm:mr-2">{getStatusIcon(healthData.status)}</span>
                  {healthData.status === 'healthy' ? '정상' : '오류'}
                </div>
                <p className="text-xs text-gray-600 font-medium mt-1">전체 상태</p>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700">{healthData.responseTime}ms</div>
                <p className="text-xs text-gray-600 font-medium">응답 시간</p>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700">{formatUptime(healthData.system?.uptime || 0)}</div>
                <p className="text-xs text-gray-600 font-medium">가동 시간</p>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-700">
                  {healthData.system?.memoryUsage ? Math.round((healthData.system.memoryUsage.heapUsed / healthData.system.memoryUsage.heapTotal) * 100) : 0}%
                </div>
                <p className="text-xs text-gray-600 font-medium">로컬 서버 메모리</p>
              </div>
            </div>
          </div>
        )}

        {/* 서비스 상태 */}
        {healthData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 lg:p-6 mb-2 sm:mb-3 lg:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-600 mb-2 sm:mb-3 lg:mb-4">서비스 상태</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
              <div className="flex items-center justify-between p-2 sm:p-3 lg:p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-600 text-sm sm:text-base">데이터베이스</h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Supabase 연결 상태</p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.services.database.status)}`}>
                    {getStatusIcon(healthData.services.database.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{healthData.services.database.latency_ms || healthData.services.database.responseTime || 0}ms</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 lg:p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-600 text-sm sm:text-base">Node.js</h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">시스템 정보</p>
                </div>
                <div className="text-right">
                  <div className="text-green-600">✅</div>
                  <p className="text-xs text-gray-600 font-medium mt-1">v{process.version}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 사용자 및 농장 통계 */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 lg:gap-6 mb-2 sm:mb-3 lg:mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 lg:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-600 mb-2 sm:mb-3 lg:mb-4">사용자 통계</h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700">{metrics.users.total}</div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">총 사용자</p>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700">{metrics.users.active}</div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">활성 사용자</p>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-700">{metrics.users.approved}</div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">승인된 사용자</p>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-700">{metrics.users.pending}</div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">승인 대기</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 lg:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-600 mb-2 sm:mb-3 lg:mb-4">농장 통계</h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700">{metrics.farms.total}</div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">총 농장</p>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700">{metrics.farms.active}</div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">활성 농장</p>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-700">{metrics.devices.total}</div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">총 디바이스</p>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700">{metrics.devices.online}</div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">온라인 디바이스</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 센서 및 데이터 통계 */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 lg:gap-6 mb-2 sm:mb-3 lg:mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 lg:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-600 mb-2 sm:mb-3 lg:mb-4">센서 통계</h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">총 센서</span>
                  <span className="font-bold text-gray-600 text-sm sm:text-base">{metrics.sensors.total}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">활성 센서</span>
                  <span className="font-bold text-green-700 text-sm sm:text-base">{metrics.sensors.active}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">비활성 센서</span>
                  <span className="font-bold text-red-700 text-sm sm:text-base">{metrics.sensors.inactive}개</span>
                </div>
                <div className="mt-2 sm:mt-3 lg:mt-4">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">센서 타입별</h4>
                  <div className="space-y-1">
                    {Object.entries(metrics.sensors.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-gray-600 font-medium">{type}</span>
                        <span className="font-semibold text-gray-600">{count}개</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 lg:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-600 mb-2 sm:mb-3 lg:mb-4">데이터 통계</h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">총 센서 데이터</span>
                  <span className="font-bold text-gray-600 text-sm sm:text-base">{metrics.data.totalReadings.toLocaleString()}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">최근 24시간</span>
                  <span className="font-bold text-gray-600 text-sm sm:text-base">{metrics.data.last24Hours.toLocaleString()}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">시간당 평균</span>
                  <span className="font-bold text-gray-600 text-sm sm:text-base">{metrics.data.averagePerHour.toLocaleString()}개</span>
                </div>
                <div className="mt-2 sm:mt-3 lg:mt-4">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">성능 메트릭</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-600 font-medium">평균 응답 시간</span>
                      <span className="font-semibold text-gray-600">{metrics.performance.averageResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-600 font-medium">에러율</span>
                      <span className="font-semibold text-red-700">{(metrics.performance.errorRate * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 디바이스 관리 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 lg:p-6 mb-2 sm:mb-3 lg:mb-6">
          <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-600">디바이스 관리</h2>
            <button
              onClick={() => {
                setEditingDevice(null);
                setDeviceForm({
                  name: '',
                  device_type: 'sensor',
                  farm_id: '',
                  location: '',
                  description: '',
                  mqtt_topic: ''
                });
                setIsDeviceModalOpen(true);
              }}
              className="bg-blue-600 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
            >
              새 디바이스 추가
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="text-center py-4 sm:py-6 lg:py-8 text-gray-500">
              <div className="text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2">📱</div>
              <p className="text-sm sm:text-base">등록된 디바이스가 없습니다.</p>
              <p className="text-xs sm:text-sm">새 디바이스를 추가해보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {devices.map((device) => (
                <div key={device.id} className="border border-gray-200 rounded-lg p-2 sm:p-3 lg:p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-600 text-sm sm:text-base">{device.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{device.farm?.name || '농장 미지정'}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      device.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {device.status === 'active' ? '활성' : '비활성'}
                    </div>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3 lg:mb-4">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">타입:</span>
                      <span className="font-medium text-gray-600">{device.device_type}</span>
                    </div>
                    {device.location && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">위치:</span>
                        <span className="font-medium text-gray-600">{device.location}</span>
                      </div>
                    )}
                    {device.latest_data && (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">최신 데이터:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {device.latest_data.temperature && (
                            <div className="bg-blue-50 p-2 rounded">
                              <div className="text-blue-800 font-medium">온도</div>
                              <div className="text-blue-900">{device.latest_data.temperature}°C</div>
                            </div>
                          )}
                          {device.latest_data.humidity && (
                            <div className="bg-green-50 p-2 rounded">
                              <div className="text-green-800 font-medium">습도</div>
                              <div className="text-green-900">{device.latest_data.humidity}%</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeviceEdit(device)}
                      className="flex-1 bg-gray-100 text-gray-600 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-gray-200 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('이 디바이스를 삭제하시겠습니까?')) {
                          fetch(`/api/devices?id=${device.id}`, { method: 'DELETE' })
                            .then(() => fetchData())
                            .catch(error => console.error('삭제 오류:', error));
                        }
                      }}
                      className="flex-1 bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-red-200 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 마지막 업데이트 시간 */}
        {healthData && (
          <div className="text-center text-sm text-gray-600 font-medium">
            마지막 업데이트: {new Date(healthData.timestamp).toLocaleString('ko-KR')}
          </div>
        )}
          </>
        )}

        {/* Universal Bridge 탭 */}
        {activeTab === 'bridge' && (
          <UniversalBridgeManager />
        )}
      </div>

      {/* 디바이스 편집 모달 */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingDevice ? '디바이스 수정' : '새 디바이스 추가'}
                </h2>
                <button
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    디바이스명 *
                  </label>
                  <input
                    type="text"
                    value={deviceForm.name}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600"
                    placeholder="디바이스 이름을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    디바이스 타입 *
                  </label>
                  <select
                    value={deviceForm.device_type}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, device_type: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600"
                  >
                    <option value="sensor">센서</option>
                    <option value="actuator">액추에이터</option>
                    <option value="controller">컨트롤러</option>
                    <option value="gateway">게이트웨이</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    농장 ID *
                  </label>
                  <input
                    type="text"
                    value={deviceForm.farm_id}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, farm_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600"
                    placeholder="농장 ID를 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    위치
                  </label>
                  <input
                    type="text"
                    value={deviceForm.location}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600"
                    placeholder="디바이스 위치 (예: 베드-1, 온실-A)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    설명
                  </label>
                  <textarea
                    value={deviceForm.description}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600 resize-none"
                    placeholder="디바이스 설명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    MQTT 토픽
                  </label>
                  <input
                    type="text"
                    value={deviceForm.mqtt_topic}
                    onChange={(e) => setDeviceForm(prev => ({ ...prev, mqtt_topic: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-600"
                    placeholder="device/sensor_1"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleDeviceSave}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  {editingDevice ? '수정' : '추가'}
                </button>
                <button
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Universal Bridge 탭 */}
        {activeTab === 'bridge' && (
          <UniversalBridgeManager />
        )}
      </div>
    </div>
  );
}
