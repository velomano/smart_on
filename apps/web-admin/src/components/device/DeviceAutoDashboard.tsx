/**
 * Device Auto Dashboard
 * 
 * Device Profile + Registry 기반 자동 UI 생성
 */

'use client';

import { useEffect, useState } from 'react';

interface DeviceAutoDashboardProps {
  deviceId: string;
}

export function DeviceAutoDashboard({ deviceId }: DeviceAutoDashboardProps) {
  const [ui, setUi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let etag: string | undefined;
    
    const loadUiModel = async () => {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (etag) {
          headers['If-None-Match'] = etag;
        }

        const res = await fetch(`/api/devices/${deviceId}/ui-model`, { headers });
        
        // 304 Not Modified - 변경사항 없음
        if (res.status === 304) {
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        etag = res.headers.get('ETag') || undefined;
        const data = await res.json();
        setUi(data);
        setLoading(false);
      } catch (err: any) {
        console.error('[DeviceAutoDashboard] Error:', err);
        setError(err.message || 'Failed to load UI model');
        setLoading(false);
      }
    };

    loadUiModel();
    
    // 10초마다 폴링 (나중에 WebSocket으로 교체)
    const interval = setInterval(loadUiModel, 10000);
    
    return () => clearInterval(interval);
  }, [deviceId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">UI 모델 로딩 중...</p>
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

  if (!ui) {
    return null;
  }

  const { template, model, warnings } = ui;

  return (
    <div className="space-y-4">
      {/* Warnings */}
      {warnings?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="font-bold text-yellow-900 mb-2">⚠️ 알림</p>
          <ul className="text-sm text-yellow-800 space-y-1">
            {warnings.map((w: any, i: number) => (
              <li key={i}>• {w.detail}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Template Renderer */}
      <TemplateRenderer 
        template={template} 
        deviceId={deviceId} 
        model={model} 
      />
    </div>
  );
}

// ==================== Template Renderer ====================

interface TemplateRendererProps {
  template: any;
  deviceId: string;
  model: any;
}

function TemplateRenderer({ template, deviceId, model }: TemplateRendererProps) {
  if (!template.cards || template.cards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
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
            {renderCard(card, deviceId, model)}
          </div>
        );
      })}
    </div>
  );
}

function renderCard(card: any, deviceId: string, model: any) {
  switch (card.type) {
    case 'line-chart':
      return <LineChartCard series={card.series} deviceId={deviceId} model={model} />;
    
    case 'gauge':
      return <GaugeCard metric={card.metric} thresholds={card.thresholds} deviceId={deviceId} model={model} />;
    
    case 'card':
      return <SensorCard metric={card.metric} deviceId={deviceId} model={model} />;
    
    case 'actuator':
      return <ActuatorPanel spec={card} deviceId={deviceId} model={model} />;
    
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
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-4">📊 실시간 차트</h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-500">차트 구현 예정</p>
        <p className="text-xs text-gray-400 ml-2">Series: {series.join(', ')}</p>
      </div>
    </div>
  );
}

function GaugeCard({ metric, thresholds, deviceId, model }: any) {
  const sensor = model.sensors.find((s: any) => s.canonical_key === metric || s.key === metric);
  
  if (!sensor) {
    return null;
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">{sensor.label}</h3>
      <div className="text-3xl font-bold text-blue-600 mb-1">--</div>
      <div className="text-sm text-gray-600">{sensor.display_unit || sensor.unit}</div>
      <div className="text-xs text-gray-400 mt-2">
        {thresholds?.warn && `⚠️ ${thresholds.warn}${sensor.unit}`}
        {thresholds?.danger && ` / 🚨 ${thresholds.danger}${sensor.unit}`}
      </div>
    </div>
  );
}

function SensorCard({ metric, deviceId, model }: any) {
  const sensor = model.sensors.find((s: any) => s.canonical_key === metric || s.key === metric);
  
  if (!sensor) {
    return null;
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{sensor.label}</div>
      <div className="text-2xl font-bold">--</div>
      <div className="text-xs text-gray-500">{sensor.display_unit || sensor.unit}</div>
    </div>
  );
}

function ActuatorPanel({ spec, deviceId, model }: any) {
  const actuator = model.actuators.find((a: any) => a.type === spec.actuatorType);
  
  if (!actuator) {
    return null;
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
        console.log('✅ Command sent:', command.id);
      }
    } catch (err) {
      console.error('❌ Command failed:', err);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-4">{actuator.label}</h3>
      
      {Array.from({ length: actuator.channels || 1 }).map((_, ch) => (
        <div key={ch} className="mb-4">
          <p className="text-sm text-gray-600 mb-2">채널 {ch + 1}</p>
          <div className="flex gap-2">
            {actuator.commands?.map((cmd: any) => (
              <button
                key={cmd.id}
                onClick={() => handleCommand(cmd, ch + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

