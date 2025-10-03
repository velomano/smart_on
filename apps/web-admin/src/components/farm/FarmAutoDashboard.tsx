'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Farm {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface DeviceUIModel {
  deviceId: string;
  deviceName: string;
  profile: any;
  registry: any;
  uiModel: any;
}

export default function FarmAutoDashboard({ farmId }: { farmId: string }) {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [devices, setDevices] = useState<DeviceUIModel[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchFarmData();
    fetchUserData();
  }, [farmId]);

  const fetchUserData = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  const fetchFarmData = async () => {
    try {
      setLoading(true);
      
      // 농장 정보 가져오기
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('*')
        .eq('id', farmId)
        .single();

      if (farmError) throw farmError;
      setFarm(farmData);

      // 디바이스 UI 모델 가져오기
      const response = await fetch(`/api/farms/${farmId}/devices/ui-model`);
      if (response.ok) {
        const deviceModels = await response.json();
        setDevices(deviceModels);
      } else {
        setDevices([]);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">농장 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">농장을 찾을 수 없습니다</h2>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />
      <div className="container mx-auto px-4 py-8">
        {/* 농장 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{farm.name}</h1>
          {farm.description && (
            <p className="text-gray-600">{farm.description}</p>
          )}
        </div>


        {/* 디바이스 섹션 */}
        {devices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">연결된 디바이스가 없습니다</h3>
            <p className="text-gray-600 mb-4">IoT 디바이스를 연결하여 농장을 모니터링하세요.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push(`/iot-designer?farmId=${farmId}`)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
              >
                ⚡ IoT 디바이스 생성 및 연결
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">연결된 디바이스</h2>
            {devices.map((device) => (
              <DeviceSection 
                key={device.deviceId} 
                device={device} 
                farmId={farmId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 디바이스 섹션 컴포넌트
function DeviceSection({ device, farmId }: { device: DeviceUIModel; farmId: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{device.deviceName}</h3>
      
      {device.uiModel?.cards ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {device.uiModel.cards.map((card: any, index: number) => (
            <TemplateRenderer
              key={index}
              card={card}
              deviceId={device.deviceId}
              model={device.uiModel}
              farmId={farmId}
            />
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-center py-8">
          UI 템플릿이 없습니다.
        </div>
      )}
    </div>
  );
}

// 템플릿 렌더러 컴포넌트
function TemplateRenderer({ card, deviceId, model, farmId }: any) {
  switch (card.type) {
    case 'gauge':
      return <GaugeCard metric={card.metric} thresholds={card.thresholds} deviceId={deviceId} model={model} farmId={farmId} />;
    case 'line-chart':
      return <LineChartCard series={card.series} deviceId={deviceId} model={model} farmId={farmId} />;
    case 'actuator':
      return <ActuatorPanel channels={card.channels} actuatorType={card.actuatorType} deviceId={deviceId} model={model} farmId={farmId} />;
    case 'event-log':
      return <EventLogCard metric={card.metric} deviceId={deviceId} model={model} farmId={farmId} />;
    default:
      return (
        <div className="bg-gray-50 border rounded-lg p-4">
          <p className="text-sm text-gray-500">지원하지 않는 카드 타입: {card.type}</p>
        </div>
      );
  }
}

// 게이지 카드 컴포넌트 (WebSocket 실시간 업데이트)
function GaugeCard({ metric, thresholds, deviceId, model, farmId }: any) {
  const [sensorValue, setSensorValue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sensor = model?.sensors?.find((s: any) =>
    s.canonical_key === metric || s.key === metric
  );

  // WebSocket 실시간 데이터 수신
  const { connected } = useWebSocket({
    farmId,
    onTelemetry: (message) => {
      // 해당 디바이스의 텔레메트리 데이터인지 확인
      if (message.deviceId === deviceId && message.data) {
        const metricData = message.data.find((d: any) => d.key === metric);
        if (metricData) {
          setSensorValue({
            value: metricData.value,
            unit: metricData.unit,
            ts: message.timestamp
          });
          setError('');
          setLoading(false);
        }
      }
    }
  });

  useEffect(() => {
    if (!sensor || !farmId) return;

    // 초기 데이터 로드
    const fetchInitialValue = async () => {
      try {
        const res = await fetch(
          `/api/farms/${farmId}/sensors/latest?deviceId=${deviceId}&keys=${metric}`,
          { cache: 'no-store' }
        );

        if (res.ok) {
          const data = await res.json();
          setSensorValue(data[metric]);
          setError('');
        } else {
          setError('데이터 소스 일시 중단');
        }
        setLoading(false);
      } catch (err: any) {
        setError('연결 오류');
        setLoading(false);
      }
    };

    fetchInitialValue();

    // WebSocket 연결이 안된 경우 폴링 백업
    if (!connected) {
      const interval = setInterval(fetchInitialValue, 5000);
      return () => clearInterval(interval);
    }
  }, [sensor, deviceId, metric, farmId, connected]);

  if (!sensor) {
    return (
      <div className="bg-gray-50 border rounded-lg p-4">
        <p className="text-sm text-gray-500">센서 정보 없음: {metric}</p>
      </div>
    );
  }

  // Threshold 색상 결정
  let bgColor = 'from-blue-50 to-blue-100';
  let borderColor = 'border-blue-200';
  let valueColor = 'text-blue-600';

  if (sensorValue && thresholds) {
    const value = sensorValue.value;
    if (thresholds.danger && value >= thresholds.danger) {
      bgColor = 'from-red-50 to-red-100';
      borderColor = 'border-red-300';
      valueColor = 'text-red-600';
    } else if (thresholds.warn && value >= thresholds.warn) {
      bgColor = 'from-yellow-50 to-yellow-100';
      borderColor = 'border-yellow-300';
      valueColor = 'text-yellow-600';
    }
  }

  return (
    <div className={`bg-gradient-to-br ${bgColor} border ${borderColor} rounded-lg p-4`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">{sensor.label || sensor.key}</h3>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-500">
            {connected ? '실시간' : '폴링'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-2xl text-gray-400 mb-1">로딩...</div>
      ) : error ? (
        <div className="text-sm text-red-600 mb-1">⚠️ {error}</div>
      ) : sensorValue ? (
        <>
          <div className={`text-3xl font-bold ${valueColor} mb-1`}>
            {sensorValue.value.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">{sensorValue.unit || sensor.unit}</div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(sensorValue.ts).toLocaleTimeString('ko-KR')}
          </div>
        </>
      ) : (
        <div className="text-2xl text-gray-400 mb-1">--</div>
      )}

      {thresholds && (
        <div className="text-xs text-gray-500 mt-2">
          {thresholds.warn && `⚠️ ${thresholds.warn}${sensor.unit}`}
          {thresholds.danger && ` / 🚨 ${thresholds.danger}${sensor.unit}`}
        </div>
      )}
    </div>
  );
}

// 라인 차트 카드 컴포넌트 (WebSocket 실시간 업데이트)
function LineChartCard({ series, deviceId, model, farmId }: any) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // WebSocket 실시간 데이터 수신
  const { connected } = useWebSocket({
    farmId,
    onTelemetry: (message) => {
      // 해당 디바이스의 텔레메트리 데이터인지 확인
      if (message.deviceId === deviceId && message.data) {
        // 새로운 데이터 포인트 추가
        const newDataPoint = {
          timestamp: new Date(message.timestamp).getTime(),
          time: new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          ...series.reduce((acc: any, key: string) => {
            const metricData = message.data.find((d: any) => d.key === key);
            acc[key] = metricData ? metricData.value : null;
            return acc;
          }, {})
        };
        
        setChartData(prevData => {
          const updatedData = [...prevData, newDataPoint];
          // 최근 50개 데이터 포인트만 유지
          return updatedData.slice(-50);
        });
      }
    }
  });

  useEffect(() => {
    if (!series || !deviceId || !farmId) return;

    const fetchChartData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // 최근 1시간 데이터 조회 (10분 간격)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const response = await fetch(
          `/api/farms/${farmId}/sensors/history?deviceId=${deviceId}&keys=${series.join(',')}&startTime=${oneHourAgo}`,
          { cache: 'no-store' }
        );

        if (response.ok) {
          const data = await response.json();
          
          // 차트 데이터 형식으로 변환
          const formattedData = data.map((item: any) => ({
            timestamp: new Date(item.ts).getTime(),
            time: new Date(item.ts).toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            ...series.reduce((acc: any, key: string) => {
              acc[key] = item[key] || null;
              return acc;
            }, {})
          }));
          
          setChartData(formattedData);
        } else {
          setError('데이터를 불러올 수 없습니다');
        }
      } catch (err: any) {
        setError('연결 오류');
        console.error('Chart data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
    
    // WebSocket 연결이 안된 경우 폴링 백업 (10초마다)
    if (!connected) {
      const interval = setInterval(fetchChartData, 10000);
      return () => clearInterval(interval);
    }
  }, [series, deviceId, farmId, connected]);

  if (isLoading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold mb-2">📊 실시간 차트</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">데이터 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold mb-2">📊 실시간 차트</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-red-500">⚠️ {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">📊 실시간 차트</h3>
      <p className="text-sm text-gray-500 mb-4">시리즈: {series?.join(', ')}</p>
      
      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time"
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
              />
              <Tooltip 
                labelFormatter={(value) => `시간: ${value}`}
                formatter={(value: any, name: string) => [
                  `${value?.toFixed(1) || 'N/A'}`, 
                  name
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              {series.map((serie: string, index: number) => (
                <Line
                  key={serie}
                  type="monotone"
                  dataKey={serie}
                  stroke={`hsl(${index * 60}, 70%, 50%)`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-400">데이터가 없습니다</div>
          </div>
        )}
      </div>
    </div>
  );
}

// 이벤트 로그 카드 컴포넌트 (실제 로그 구현)
function EventLogCard({ deviceId, model, farmId }: any) {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!deviceId || !farmId) return;

    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const response = await fetch(
          `/api/farms/${farmId}/devices/${deviceId}/events?limit=20`,
          { cache: 'no-store' }
        );

        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        } else {
          setError('이벤트를 불러올 수 없습니다');
        }
      } catch (err: any) {
        setError('연결 오류');
        console.error('Event log fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
    
    // 5초마다 이벤트 갱신
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [deviceId, farmId]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warn': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold mb-2">📋 이벤트 로그</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold mb-2">📋 이벤트 로그</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-red-500">⚠️ {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">📋 이벤트 로그</h3>
      <div className="h-64 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">이벤트가 없습니다</div>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border text-sm ${getLogColor(event.level)}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span>{getLogIcon(event.level)}</span>
                    <span className="font-medium">{event.message}</span>
                  </div>
                  <span className="text-xs opacity-75">
                    {new Date(event.timestamp).toLocaleTimeString('ko-KR')}
                  </span>
                </div>
                {event.details && (
                  <div className="text-xs opacity-75 mt-1 pl-6">
                    {event.details}
                  </div>
                )}
                {event.metadata && (
                  <div className="text-xs opacity-50 mt-1 pl-6">
                    {JSON.stringify(event.metadata)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 액추에이터 패널 컴포넌트 (플레이스홀더)
function ActuatorPanel({ channels, actuatorType, deviceId, model, farmId }: any) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">액추에이터 패널</h3>
      <p className="text-sm text-gray-500">채널: {channels}, 타입: {actuatorType}</p>
      <p className="text-xs text-gray-400 mt-2">제어 패널 구현 예정</p>
    </div>
  );
}
