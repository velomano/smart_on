/**
 * Farm Auto Dashboard
 * 
 * 농장 내 모든 디바이스를 Dynamic UI로 렌더링
 * - Device Profile + Registry 기반 자동 UI 생성
 * - 여러 디바이스 통합 표시
 */

'use client';

import { useEffect, useState } from 'react';

interface FarmAutoDashboardProps {
  farmId: string;
}

export function FarmAutoDashboard({ farmId }: FarmAutoDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFarmDevices = async () => {
      try {
        const res = await fetch(`/api/farms/${farmId}/devices/ui-model`);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const result = await res.json();
        setData(result);
        setLoading(false);
      } catch (err: any) {
        console.error('[FarmAutoDashboard] Error:', err);
        setError(err.message || 'Failed to load farm devices');
        setLoading(false);
      }
    };

    loadFarmDevices();
    
    // 30초마다 폴링
    const interval = setInterval(loadFarmDevices, 30000);
    
    return () => clearInterval(interval);
  }, [farmId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">농장 데이터 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        ❌ {error}
      </div>
    );
  }

  if (!data || !data.devices || data.devices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏭</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">디바이스가 없습니다</h3>
        <p className="text-gray-500 mb-4">
          이 농장에 연결된 IoT 디바이스가 없습니다.
        </p>
        <a 
          href="/connect" 
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          디바이스 연결하기
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 농장 개요 */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">IoT 디바이스</h2>
            <p className="text-gray-600">
              총 {data.device_count}개의 디바이스 연결됨
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {data.devices.filter((d: any) => d.online).length}
            </div>
            <div className="text-sm text-gray-500">온라인</div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {data.warnings && data.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="font-bold text-yellow-900 mb-2">⚠️ 알림</p>
          <ul className="text-sm text-yellow-800 space-y-1">
            {data.warnings.map((w: string, i: number) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 디바이스별 섹션 */}
      {data.devices.map((device: any) => (
        <DeviceSection key={device.device_uuid} device={device} farmId={farmId} />
      ))}
    </div>
  );
}

// ==================== Device Section ====================

interface DeviceSectionProps {
  device: any;
  farmId: string;
}

function DeviceSection({ device, farmId }: DeviceSectionProps) {
  const { device_id, profile, template, model, online, last_seen_at, warnings } = device;

  return (
    <div className="bg-white border rounded-lg p-6">
      {/* 디바이스 헤더 */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{profile?.name || device_id}</h3>
            <span className={`px-2 py-1 text-xs font-bold rounded ${
              online 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {online ? '🟢 온라인' : '⚫ 오프라인'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {device_id}
            {profile && ` • v${profile.version}`}
          </p>
          {last_seen_at && (
            <p className="text-xs text-gray-400 mt-1">
              최근 활동: {new Date(last_seen_at).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
      </div>

      {/* 디바이스별 Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <ul className="text-sm text-yellow-800 space-y-1">
            {warnings.map((w: string, i: number) => (
              <li key={i}>⚠️ {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* UI 템플릿 렌더링 */}
      <TemplateRenderer 
        template={template} 
        deviceId={device_id} 
        model={model}
        farmId={farmId}
      />
    </div>
  );
}

// ==================== Template Renderer ====================

interface TemplateRendererProps {
  template: any;
  deviceId: string;
  model: any;
  farmId: string;
}

function TemplateRenderer({ template, deviceId, model, farmId }: TemplateRendererProps) {
  if (!template?.cards || template.cards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        UI 템플릿이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-12 gap-4">
      {template.cards.map((card: any, index: number) => {
        const span = card.span || 12;
        const colSpanClass = `md:col-span-${span}`;

        return (
          <div key={index} className={colSpanClass}>
            {renderCard(card, deviceId, model, farmId)}
          </div>
        );
      })}
    </div>
  );
}

function renderCard(card: any, deviceId: string, model: any, farmId: string) {
  switch (card.type) {
    case 'line-chart':
      return <LineChartCard series={card.series} deviceId={deviceId} model={model} farmId={farmId} />;
    
    case 'gauge':
      return <GaugeCard metric={card.metric} thresholds={card.thresholds} deviceId={deviceId} model={model} farmId={farmId} />;
    
    case 'actuator':
      return <ActuatorPanel spec={card} deviceId={deviceId} model={model} />;
    
    case 'event-log':
      return <EventLogCard deviceId={deviceId} />;
    
    case 'status':
      return <StatusCard deviceId={deviceId} model={model} />;
    
    case 'raw-data':
      return <RawDataCard deviceId={deviceId} model={model} />;
    
    default:
      return (
        <div className="bg-gray-100 p-4 rounded text-gray-500 text-sm">
          Unknown card type: {card.type}
        </div>
      );
  }
}

// ==================== Card Components ====================

function LineChartCard({ series, deviceId, model }: any) {
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <h3 className="font-bold mb-4">📊 실시간 차트</h3>
      <div className="h-64 flex items-center justify-center bg-white rounded">
        <div className="text-center">
          <p className="text-gray-500">차트 구현 예정</p>
          <p className="text-xs text-gray-400 mt-2">Series: {series?.join(', ')}</p>
        </div>
      </div>
    </div>
  );
}

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

function ActuatorPanel({ spec, deviceId, model }: any) {
  const actuator = model?.actuators?.find((a: any) => 
    a.type === spec.actuatorType || a.canonical_key === spec.actuatorType
  );
  
  if (!actuator) {
    return (
      <div className="bg-gray-50 border rounded-lg p-4">
        <p className="text-sm text-gray-500">액추에이터 정보 없음</p>
      </div>
    );
  }

  const handleCommand = async (command: any, channel?: number) => {
    try {
      const response = await fetch('/api/bridge/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          type: `${actuator.type}.${command.id}`,
          payload: {
            ...command.payload,
            channel,
          },
        }),
      });

      if (response.ok) {
        alert(`✅ ${command.label} 명령 전송됨`);
      } else {
        alert(`❌ 명령 실패`);
      }
    } catch (err) {
      console.error('❌ Command failed:', err);
      alert(`❌ 명령 실패: ${err}`);
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      <h3 className="font-bold mb-4">{actuator.label || actuator.type}</h3>
      
      {Array.from({ length: spec.channels || actuator.channels || 1 }).map((_, ch) => (
        <div key={ch} className="mb-4 last:mb-0">
          <p className="text-sm text-gray-600 mb-2">채널 {ch + 1}</p>
          <div className="flex gap-2 flex-wrap">
            {actuator.commands?.map((cmd: any) => (
              <button
                key={cmd.id}
                onClick={() => handleCommand(cmd, ch + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                {cmd.label || cmd.id}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventLogCard({ deviceId }: any) {
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <h3 className="font-bold mb-4">📋 이벤트 로그</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <span className="text-xs">2025-10-01 21:30:00</span>
          <span>•</span>
          <span>이벤트 로그 구현 예정</span>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ deviceId, model }: any) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="font-bold mb-2">🟢 상태</h3>
      <p className="text-sm text-gray-600">
        센서: {model?.sensors?.length || 0}개 /
        액추에이터: {model?.actuators?.length || 0}개
      </p>
    </div>
  );
}

function RawDataCard({ deviceId, model }: any) {
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <h3 className="font-bold mb-4">🔍 원시 데이터</h3>
      <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-64">
        {JSON.stringify(model, null, 2)}
      </pre>
    </div>
  );
}

