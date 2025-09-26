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

  // 심플 차트 - 데이터 그냥 잇기
  const createSimpleChart = () => {
    if (!chartData || chartData.length === 0) return null;
    
    // 최근 24개 데이터 포인트
    const recentData = chartData.slice(-24);
    const values = recentData.map(d => Number(d[type]) || 0);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal || 1;
    
    const coords = values.map((value, index) => ({
      x: 20 + (index / 23) * 260,
      y: 0 + ((maxVal - value) / range) * 30,
      value
    }));
    
    const path = coords.map((p, i) => i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`).join('');
    
    return (
      <div className="w-full h-16 bg-gray-50 rounded overflow-hidden p-1">
        <svg viewBox="0 0 300 60" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          {/* 배경 */}
          <rect width="290" height="35" fill="#f8f9fa" x="5" y="5"/>
          
          {/* 데이터 포인트들 */}
          {coords.map(({ x, y, value }, index) => (
            <circle 
              key={index} 
              cx={x} cy={y} r="2" 
              fill={color} 
              onMouseEnter={() => setHoveredPoint(index)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}
          
          {/* 선 연결 */}
          <path d={path} stroke={color} strokeWidth="2.5" fill="none"/>
          
          {/* 시간 라벨 - 완전 안쪽으로 */}
          <text x="10" y="47" fontSize="4" fill="#666">0시</text>
          <text x="70" y="47" fontSize="4" fill="#666">6시</text>
          <text x="130" y="47" fontSize="4" fill="#666">12시</text>
          <text x="190" y="47" fontSize="4" fill="#666">18시</text>
          <text x="250" y="47" fontSize="4" fill="#666">24시</text>
        </svg>
        
        {/* 호버 툴팁 */}
        {hoveredPoint !== null && coords[hoveredPoint] && (
          <div className="absolute bg-gray-800 text-white px-2 py-1 rounded text-xs z-10"
               style={{
                 left: '50%',
                 top: '-25px',
                 transform: 'translateX(-50%)'
               }}>
            {formatValue(coords[hoveredPoint].value)}{unit}
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
