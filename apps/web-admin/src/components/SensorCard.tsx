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

  // 심플한 선 그래프 생성 (호버 기능 포함)
  const createSimpleChart = () => {
    if (!chartData || chartData.length === 0) return null;
    
    // 최근 10개 데이터 포인트만 사용
    const recentData = chartData.slice(-10);
    const values = recentData.map(d => Number(d[type]) || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    const padding = range * 0.1; // 10% 여유
    
    // 완전 직선! 그냥 스트레이트 라인
    const createStraightLine = (points: Array<{x: number, y: number}>) => {
      if (points.length < 2) return '';
      
      const first = points[0];
      const last = points[points.length - 1];
      return `M${first.x},${first.y} L${last.x},${last.y}`;
    };
    
    // 좌표 계산 (가로축=시간, 세로축=값)
    const coords = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100; // 시간축 (왼쪽=과거, 오른쪽=현재)
      const normalizedValue = (value - minValue + padding) / (range + padding * 2);
      const y = (1 - normalizedValue) * 100; // 값축 (위쪽=높은값, 아래쪽=낮은값)
      return { x, y, value };
    });
    
    // 최소/최대값 가져오기 (표시용)
    const maxVal = Math.max(...values).toFixed(1);
    const minVal = Math.min(...values).toFixed(1);
    
    const straightLine = createStraightLine(coords);
    
    // 툴팁 상태는 컴포넌트 레벨에서 관리됨
    
    return (
      <div className="w-full h-full flex items-center relative">
        <div className="w-full h-full relative">
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full cursor-pointer"
            preserveAspectRatio="none"
            onMouseLeave={() => setHoveredPoint(null)}
          >
          {/* 그라데이션 배경 영역 */}
          <defs>
            <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
              <stop offset="100%" stopColor={color} stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          
          {/* 완전 직선! */}
          <path
            d={straightLine}
            fill="none"
            stroke={color}
            strokeWidth="3"
          />
          
          {/* 끝! */}
          </svg>
          
          {/* 간단한 시간축 라벨 */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400">
            <span>←</span>
            <span>→</span>
          </div>
        </div>
        
        {/* 호버 툴팁 */}
        {hoveredPoint !== null && coords[hoveredPoint] && (
          <div 
            className="absolute bg-gray-800 text-white text-xs px-2 py-1 rounded-lg shadow-lg z-10 pointer-events-none"
            style={{
              left: `${coords[hoveredPoint].x}%`,
              top: '8px',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap'
            }}
          >
            <div className="font-bold">
              {formatValue(coords[hoveredPoint].value)}{unit}
            </div>
            <div className="text-gray-300">
              포인트 {hoveredPoint + 1}
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
