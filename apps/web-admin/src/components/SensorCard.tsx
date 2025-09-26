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
    
    // 매끄러운 곡선 그래프 경로 생성
    const createSmoothPath = (points: Array<{x: number, y: number}>) => {
      if (points.length < 2) return '';
      if (points.length === 2) {
        return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
      }
      
      let path = `M${points[0].x},${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        const current = points[i];
        const prev = points[i - 1];
        
        if (i === points.length - 1) {
          // 마지막 점은 직선
          path += ` L${current.x},${current.y}`;
        } else {
          const next = points[i + 1];
          const tension = 0.4; // 곡선 부드러움 조절
          
          // 부드러운 곡선으로 연결하는 베지어 제어점
          const cp1x = prev.x + (current.x - prev.x) * tension;
          const cp1y = prev.y;
          const cp2x = current.x - (next.x - current.x) * tension;
          const cp2y = current.y;
          
          path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${current.x},${current.y}`;
        }
      }
      
      return path;
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
    
    const smoothPath = createSmoothPath(coords);
    
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
          
          {/* 부드러운 곡선 그래프 */}
          <path
            d={smoothPath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* 가로축 그리드 라인 (시간의 흐름) */}
          {coords.map(({ x }, index) => (
            <line 
              key={`grid-${index}`}
              x1={x} 
              y1="0" 
              x2={x} 
              y2="100" 
              stroke="#e5e7eb" 
              strokeWidth="0.5" 
              opacity="0.3"
            />
          ))}
          
          {/* 심플한 데이터 포인트 */}
          {coords.map(({ x, y, value: pointValue }, index) => (
            <g key={index}>
              {/* 호버 영역 */}
              <circle
                cx={x}
                cy={y}
                r="6"
                fill="transparent"
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* 실제 포인트 (심플한 원) */}
              <circle
                cx={x}
                cy={y}
                r={hoveredPoint === index ? "3" : "2"}
                fill={hoveredPoint === index ? "white" : color}
                stroke={color}
                strokeWidth="1"
              />
          </g>
        ))}
          </svg>
          
          {/* 좌우축 레이블 (시간과 값) */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 pt-1">
            <span>과거</span>
            <span className="text-center text-gray-500">시간</span>
            <span>현재</span>
          </div>
          
          {/* 세로축 값 표시 (좌상단) */}
          <div className="absolute left-1 top-1 flex flex-col text-xs text-gray-400">
            <div className="text-center bg-white/80 px-1 rounded">{maxVal}</div>
          </div>
          <div className="absolute left-1 bottom-1 flex flex-col text-xs text-gray-400">
            <div className="text-center bg-white/80 px-1 rounded">{minVal}</div>
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
