'use client';

import React, { useState } from 'react';

export interface SensorConfig {
  type: 'temperature' | 'humidity' | 'ec' | 'ph' | 'water_level' | 'lux' | 'co2';
  icon: string;
  color: string;
  unit: string;
  gaugeType: 'circular' | 'linear';
  targetRange: { min: number; max: number };
  displayName: string;
}

export interface SensorData {
  value: number;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical' | 'offline';
}

export interface SensorCardProps {
  config: SensorConfig;
  data: SensorData;
  deviceId: string;
  onTargetChange?: (deviceId: string, sensorType: string, targetRange: { min: number; max: number }) => void;
  onChartClick?: (deviceId: string, sensorType: string) => void;
}

const SENSOR_CONFIGS: Record<string, SensorConfig> = {
  temperature: {
    type: 'temperature',
    icon: '🌡️',
    color: 'red',
    unit: '°C',
    gaugeType: 'circular',
    targetRange: { min: 22, max: 26 },
    displayName: '온도'
  },
  humidity: {
    type: 'humidity',
    icon: '💧',
    color: 'blue',
    unit: '%',
    gaugeType: 'circular',
    targetRange: { min: 60, max: 80 },
    displayName: '습도'
  },
  ec: {
    type: 'ec',
    icon: '⚡',
    color: 'green',
    unit: 'mS/cm',
    gaugeType: 'linear',
    targetRange: { min: 1.0, max: 2.5 },
    displayName: 'EC'
  },
  ph: {
    type: 'ph',
    icon: '🧪',
    color: 'purple',
    unit: 'pH',
    gaugeType: 'circular',
    targetRange: { min: 5.5, max: 7.0 },
    displayName: 'pH'
  },
  water_level: {
    type: 'water_level',
    icon: '🌊',
    color: 'cyan',
    unit: '%',
    gaugeType: 'circular',
    targetRange: { min: 70, max: 90 },
    displayName: '수위'
  },
  lux: {
    type: 'lux',
    icon: '☀️',
    color: 'yellow',
    unit: 'lux',
    gaugeType: 'linear',
    targetRange: { min: 10000, max: 50000 },
    displayName: '조도'
  },
  co2: {
    type: 'co2',
    icon: '🌫️',
    color: 'gray',
    unit: 'ppm',
    gaugeType: 'circular',
    targetRange: { min: 400, max: 1200 },
    displayName: 'CO₂'
  }
};

export default function SensorCard({ config, data, deviceId, onTargetChange, onChartClick }: SensorCardProps) {
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetRange, setTargetRange] = useState(config.targetRange);

  const formatValue = (value: number): string => {
    if (data.status === 'offline') return '--';
    if (config.type === 'ph') return value.toFixed(1);
    if (config.type === 'lux') return Math.round(value).toLocaleString();
    return value.toFixed(1);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      case 'offline': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'normal': return '정상';
      case 'warning': return '주의';
      case 'critical': return '위험';
      case 'offline': return '오프라인';
      default: return '알 수 없음';
    }
  };

  const calculateGaugePercentage = (): number => {
    if (data.status === 'offline') return 0;
    const { min, max } = targetRange;
    const range = max - min;
    const value = Math.max(min, Math.min(max, data.value));
    return ((value - min) / range) * 100;
  };

  const renderCircularGauge = () => {
    const percentage = calculateGaugePercentage();
    const size = 80;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`text-${config.color}-500 transition-all duration-300`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">{Math.round(percentage)}%</span>
        </div>
      </div>
    );
  };

  const renderLinearGauge = () => {
    const percentage = calculateGaugePercentage();
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`bg-${config.color}-500 h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const handleTargetSave = () => {
    onTargetChange?.(deviceId, config.type, targetRange);
    setShowTargetModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className="font-bold text-gray-800">{config.displayName}</h3>
              <p className="text-xs text-gray-500">{config.unit}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${getStatusColor(data.status)}`}>
              {getStatusText(data.status)}
            </div>
            <button
              onClick={() => setShowTargetModal(true)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              목표값 설정
            </button>
          </div>
        </div>

        {/* 메인 값 표시 */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-3xl font-black text-gray-800">
            {formatValue(data.value)}
            <span className="text-lg text-gray-500 ml-1">{config.unit}</span>
          </div>
          {config.gaugeType === 'circular' ? renderCircularGauge() : null}
        </div>

        {/* 게이지 (선형) */}
        {config.gaugeType === 'linear' ? (
          <div className="mb-3">
            {renderLinearGauge()}
            <div className="text-xs text-gray-500 mt-1">
              {targetRange.min}-{targetRange.max} {config.unit}
            </div>
          </div>
        ) : null}

        {/* 목표 범위 표시 */}
        <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
          <div className="flex justify-between">
            <span>목표 범위:</span>
            <span>{targetRange.min}-{targetRange.max} {config.unit}</span>
          </div>
        </div>

        {/* 차트 버튼 */}
        {onChartClick && (
          <button
            onClick={() => onChartClick(deviceId, config.type)}
            className="w-full mt-3 text-xs text-blue-600 hover:text-blue-800 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            📊 상세 차트 보기
          </button>
        )}
      </div>

      {/* 목표값 설정 모달 */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {config.displayName} 목표값 설정
              </h3>
              <button
                onClick={() => setShowTargetModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">최소값 ({config.unit})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetRange.min}
                    onChange={(e) => setTargetRange(prev => ({
                      ...prev,
                      min: parseFloat(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">최대값 ({config.unit})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetRange.max}
                    onChange={(e) => setTargetRange(prev => ({
                      ...prev,
                      max: parseFloat(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 목표 범위를 벗어나면 경고 또는 위험 상태로 표시됩니다.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowTargetModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleTargetSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { SENSOR_CONFIGS };
