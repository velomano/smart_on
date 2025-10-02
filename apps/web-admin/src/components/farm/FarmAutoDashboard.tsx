'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppHeader from '@/components/AppHeader';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchFarmData();
  }, [farmId]);

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
        <AppHeader />
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
        <AppHeader />
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
        <AppHeader />
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
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        {/* 농장 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{farm.name}</h1>
          {farm.description && (
            <p className="text-gray-600">{farm.description}</p>
          )}
        </div>

        {/* IoT Designer 버튼 */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">⚡ 빠른 IoT 빌더</h2>
              <p className="text-gray-600">센서와 액추에이터를 선택하고 코드를 자동 생성하여 디바이스를 연결하세요.</p>
            </div>
            <button
              onClick={() => router.push(`/iot-designer?farmId=${farmId}`)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <span>🚀</span>
              <span>IoT 디바이스 생성</span>
            </button>
          </div>
        </div>

        {/* 디바이스 섹션 */}
        {devices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">연결된 디바이스가 없습니다</h3>
            <p className="text-gray-600 mb-4">IoT 디바이스를 연결하여 농장을 모니터링하세요.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/connect')}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🔧 IoT 간편설정
              </button>
              <button
                onClick={() => router.push(`/iot-designer?farmId=${farmId}`)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                ⚡ IoT 연결
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

// 게이지 카드 컴포넌트
function GaugeCard({ metric, thresholds, deviceId, model, farmId }: any) {
  const [sensorValue, setSensorValue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sensor = model?.sensors?.find((s: any) =>
    s.canonical_key === metric || s.key === metric
  );

  useEffect(() => {
    if (!sensor || !farmId) return;

    const fetchValue = async () => {
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

    fetchValue();

    // 5초마다 갱신
    const interval = setInterval(fetchValue, 5000);

    return () => clearInterval(interval);
  }, [sensor, deviceId, metric, farmId]);

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
      <h3 className="font-bold mb-2">{sensor.label || sensor.key}</h3>

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

// 라인 차트 카드 컴포넌트 (플레이스홀더)
function LineChartCard({ series, deviceId, model, farmId }: any) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">라인 차트</h3>
      <p className="text-sm text-gray-500">시리즈: {series?.join(', ')}</p>
      <p className="text-xs text-gray-400 mt-2">차트 구현 예정</p>
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

// 이벤트 로그 카드 컴포넌트 (플레이스홀더)
function EventLogCard({ metric, deviceId, model, farmId }: any) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">이벤트 로그</h3>
      <p className="text-sm text-gray-500">메트릭: {metric}</p>
      <p className="text-xs text-gray-400 mt-2">로그 구현 예정</p>
    </div>
  );
}