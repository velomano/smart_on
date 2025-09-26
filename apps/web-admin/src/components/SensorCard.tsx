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

  // 데이터 값들 찍고 선으로 연결 (24시간 기준)
  const createSimpleChart = () => {
    if (!chartData || chartData.length === 0) return null;
    
    // 최근 24시간 데이터
    const recentData = chartData.slice(-24);
    const values = recentData.map(d => Number(d[type]) || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    
    // 좌표 계산 (좌우로 늘리고 시간/값 표시)
    const coords = values.map((value, index) => {
      const x = (index / (recentData.length - 1)) * 320 + 40; // 좌우 늘림 (viewBox 400 기준)
      const y = ((maxValue - value) / range) * 70 + 15; // 세로 늘림 
      return { x, y, value, time: index };
    });
    
    // 선으로 연결할 path 생성
    const pathData = coords.map((point, index) => 
      index === 0 ? `M${point.x},${point.y}` : `L${point.x},${point.y}`
    ).join(' ');
    
    // 시간 레이블 (0시~23시)
    const timeLabels = [];
    for (let i = 0; i < 24; i += 6) {
      timeLabels.push({
        x: (i / 23) * 320 + 40, // viewBox 400 기준으로 맞춤
        label: `${i}시`
      });
    }
    
    return (
      <div className="w-full h-full relative bg-gray-50 rounded-lg">
        <svg viewBox="0 0 400 120" className="w-full h-full">
          {/* 24시간 시간축 그리드 + 라벨 */}
          {timeLabels.map(({ x, label }) => (
            <g key={label}>
              <line 
                x1={x} y1="10" x2={x} y2="90" 
                stroke="#d1d5db" strokeWidth="1" 
              />
              <text x={x} y="105" textAnchor="middle" fontSize="10" fill="#6b7280">
                {label}
              </text>
            </g>
          ))}
          
          {/* 세로축 값 표시 */}
          <text x="8" y="15" fontSize="10" fill="#6b7280">{maxValue.toFixed(1)}</text>
          <text x="8" y="60" fontSize="10" fill="#6b7280">{((maxValue + minValue) / 2).toFixed(1)}</text>
          <text x="8" y="105" fontSize="10" fill="#6b7280">{minValue.toFixed(1)}</text>
          
          {/* 데이터 포인트들 + 호버 */}
          {coords.map(({ x, y, value, time }, index) => (
            <g key={index}>
              {/* 호버 영역 (큰 원) */}
              <circle
                cx={x} cy={y} r="8"
                fill="transparent"
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              />
              {/* 데이터 포인트 */}
              <circle cx={x} cy={y} r="3" fill={color} stroke="white" strokeWidth="1" />
            </g>
          ))}
          
          {/* 선으로 연결 */}
          <path d={pathData} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </svg>
        
        {/* 호버 툴팁 */}
        {hoveredPoint !== null && coords[hoveredPoint] && (
          <div 
            className="absolute bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-20 pointer-events-none"
            style={{
              left: `${(coords[hoveredPoint].x / 400) * 100}%`,
              top: '5px',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: '12px'
            }}
          >
            <div className="font-bold">
              {formatValue(coords[hoveredPoint].value)}{unit}
            </div>
            <div className="text-gray-300 text-xs">
              {coords[hoveredPoint].time}시
            </div>
          </div>
        )}
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
