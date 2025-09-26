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
    
    // 스무스 곡선을 위한 베지어 곡선 생성
    const createSmoothPath = (points: Array<{x: number, y: number}>) => {
      if (points.length < 2) return '';
      
      let path = `M${points[0].x},${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        if (i === points.length - 1) {
          // 마지막 점은 직접 연결
          path += ` L${points[i].x},${points[i].y}`;
        } else {
          // 베지어 곡선으로 부드럽게 연결
          const current = points[i];
          const next = points[i + 1];
          const controlX1 = current.x + (next.x - current.x) * 0.3;
          const controlX2 = next.x - (next.x - current.x) * 0.3;
          
          path += ` C${controlX1},${current.y} ${controlX2},${next.y} ${next.x},${next.y}`;
        }
      }
      return path;
    };
    
    // 좌표 계산 (반응형)
    const coords = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const normalizedValue = (value - minValue + padding) / (range + padding * 2);
      const y = (1 - normalizedValue) * 100;
      return { x, y, value };
    });
    
    const smoothPath = createSmoothPath(coords);
    
    // 툴팁 상태는 컴포넌트 레벨에서 관리됨
    
    return (
      <div className="w-full h-full flex items-center relative">
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
          
          {/* 선 그래프 경로 */}
          <path
            d={smoothPath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* 데이터 포인트 */}
          {coords.map(({ x, y, value: pointValue }, index) => (
            <g key={index}>
              {/* 호버 영역 (보이지 않는 큰 원) */}
              <circle
                cx={x}
                cy={y}
                r="8"
                fill="transparent"
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* 실제 표시 원 */}
              <circle
                cx={x}
                cy={y}
                r={hoveredPoint === index ? "3.5" : "2.5"}
                fill={hoveredPoint === index ? "white" : color}
                stroke={hoveredPoint === index ? color : 'none'}
                strokeWidth={hoveredPoint === index ? "2" : "0"}
              />
            </g>
          ))}
        </svg>
        
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

      {/* 심플한 미니 바 차트 */}
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
