'use client';

import React, { useState } from 'react';

interface SensorCardProps {
  type: 'temperature' | 'humidity' | 'ec' | 'ph';
  value: number | string;
  unit: string;
  icon: string;
  color: string;
  chartData: any[];
  title: string;
}

export default function SensorCard({ type, value, unit, icon, color, chartData, title }: SensorCardProps) {
  // 툴팁 상태 관리
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  // 디버깅용 로그
  console.log(`📊 ${title} 센서 카드 - 데이터:`, { value, chartDataLength: chartData?.length });
  
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (type === 'ph') {
      return val.toFixed(1);
    }
    return val.toFixed(1);
  };

  // 데이터 값들 찍고 선으로 연결
  const createSimpleChart = () => {
    if (!chartData || chartData.length === 0) return null;
    
    // 최근 10개 데이터
    const recentData = chartData.slice(-10);
    const values = recentData.map(d => Number(d[type]) || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    
    // 좌표 계산
    const coords = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = ((maxValue - value) / range) * 30 + 10; // 위아래 여유공간
      return { x, y, value };
    });
    
    // 선으로 연결할 path 생성
    const pathData = coords.map((point, index) => 
      index === 0 ? `M${point.x},${point.y}` : `L${point.x},${point.y}`
    ).join(' ');
    
    return (
      <div className="w-full h-full">
        <svg viewBox="0 0 100 40" className="w-full h-full">
          {/* 데이터 포인트들 */}
          {coords.map(({ x, y }, index) => (
            <circle key={index} cx={x} cy={y} r="1.5" fill={color} />
          ))}
          {/* 선으로 연결 */}
          <path d={pathData} fill="none" stroke={color} strokeWidth="2" />
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 border-2 border-gray-400 shadow-lg hover:shadow-xl transition-all duration-200 h-64 flex flex-col">
      {/* 헤더 섹션 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{icon}</span>
          <span className="text-sm font-bold text-gray-800">{title}</span>
        </div>
      </div>

      {/* 대형 센서 값 표시 */}
      <div className="flex-1 flex flex-col items-center justify-center mb-4">
        <div 
          className="text-6xl font-bold mb-2"
          style={{ color: color }}
        >
          {formatValue(value)}
        </div>
        <div 
          className="text-2xl font-semibold"
          style={{ color: color }}
        >
          {unit}
        </div>
      </div>

      {/* 심플한 선 그래프 (시간-값 축) */}
      <div className="h-12 bg-gray-50 rounded-lg p-1 mb-3">
        {createSimpleChart()}
      </div>

      {/* 상태 표시 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: color }}
          ></div>
          <span className="text-sm font-medium text-gray-600">활성</span>
        </div>
        <span className="text-sm text-gray-500">
          {chartData.length > 0 ? `${chartData.length}개 데이터` : '데이터 없음'}
        </span>
      </div>
    </div>
  );
}
