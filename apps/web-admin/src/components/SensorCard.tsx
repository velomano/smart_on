'use client';

import React, { useState } from 'react';

interface SensorCardProps {
  type: 'temperature' | 'humidity' | 'ec' | 'ph' | 'light';
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
  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 디버깅용 로그
  console.log(`📊 ${title} 센서 카드 - 데이터:`, { value, chartDataLength: chartData?.length });
  
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (type === 'ph') {
      return val.toFixed(1);
    }
    if (type === 'light') {
      return Math.round(val).toLocaleString();
    }
    return val.toFixed(1);
  };

  // 확대된 모달 차트 - 더 큰 크기와 자세한 정보
  const createExpandedChart = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const recentData = chartData.slice(-24);
    const values = recentData.map(d => Number(d[type]) || 0);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal || 1;
    
    const coords = values.map((value, index) => ({
      x: 60 + (index / 23) * 700,
      y: 50 + ((maxVal - value) / range) * 250,
      value
    }));
    
    const Path = coords.map((p, i) => i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`).join('');
    
    return (
      <svg viewBox="0 0 900 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {/* 배경 */}
        <rect width="880" height="320" fill="#f8f9fa" x="10" y="20" stroke="#e5e7eb" strokeWidth="1"/>
        
        {/* 그리드 라인 */}
        {[1, 2, 3, 4].map(i => (
          <line 
            key={`h-${i}`} 
            x1="70" y1={50 + i * 60} x2="780" y2={50 + i * 60} 
            stroke="#e5e7eb" strokeWidth="0.5"
          />
        ))}
        
        {/* 데이터 포인트들 */}
        {coords.map(({ x, y, value }, index) => (
          <circle 
            key={index} 
            cx={x} cy={y} r="4" 
            fill={color} 
            stroke="white" strokeWidth="2"
            onMouseEnter={() => setHoveredPoint(index)}
            onMouseLeave={() => setHoveredPoint(null)}
            style={{ cursor: 'pointer' }}
          />
        ))}
        
        {/* 선 연결 */}
        <path d={Path} stroke={color} strokeWidth="4" fill="none"/>
        
        {/* 시간 라벨 - 더 큰 폰트로 */}
        <text x="70" y="360" fontSize="16" fill="#666" textAnchor="middle">0시</text>
        <text x="200" y="360" fontSize="16" fill="#666" textAnchor="middle">6시</text>
        <text x="330" y="360" fontSize="16" fill="#666" textAnchor="middle">12시</text>
        <text x="460" y="360" fontSize="16" fill="#666" textAnchor="middle">18시</text>
        <text x="590" y="360" fontSize="16" fill="#666" textAnchor="middle">20시</text>
        <text x="720" y="360" fontSize="16" fill="#666" textAnchor="middle">24시</text>
        
        {/* 값 라벨 - 큰 폰트로 */}
        {[maxVal, (maxVal + minVal) / 2, minVal].map((val, i) => (
          <text 
            key={i}
            x="40" 
            y={50 + (maxVal - val) / range * 250 + 5} 
            fontSize="14" 
            fill="#666" 
            textAnchor="end"
          >
            {formatValue(val)}{unit}
          </text>
        ))}
      </svg>
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
        {/* 그래프 아이콘 버튼 */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="그래프 보기"
        >
          <span className="text-lg">📊</span>
        </button>
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

      {/* 확대 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
             onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] max-w-4xl w-full max-h-[90vh] overflow-hidden"
               onClick={(e) => e.stopPropagation()}>
            
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{title} 상세 그래프</h3>
                  <p className="text-sm text-gray-500">최근 24시간 데이터</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {/* 모달 내용 - 확대된 그래프 */}
            <div className="p-6">
              <div className="h-96 bg-gray-50 rounded-lg p-4 relative" onClick={(e) => e.stopPropagation()}>
                {createExpandedChart()}
                
                {/* 확대 모달 전용 호버 툴팁 */}
                {hoveredPoint !== null && (() => {
                  const recentData = chartData?.slice(-24) || [];
                  const values = recentData.map(d => Number(d[type]) || 0);
                  const maxVal = Math.max(...values);
                  const minVal = Math.min(...values);
                  const range = maxVal - minVal || 1;
                  const coords = values.map((value, index) => ({
                    x: 60 + (index / 23) * 700,
                    y: 50 + ((maxVal - value) / range) * 250,
                    value
                  }));
                  
                  if (coords[hoveredPoint]) {
                    // 시간 계산 (24시간 기준)
                    const hour = (hoveredPoint / 23) * 24;
                    const hourStr = Math.floor(hour).toString().padStart(2, '0');
                    const minuteStr = Math.floor((hour % 1) * 60).toString().padStart(2, '0');
                    
                    // 정보창이 그래프 영역 밖으로 나가지 않도록 위치 조정
                    const tooltipX = coords[hoveredPoint].x + 20;
                    const tooltipY = coords[hoveredPoint].y + 20;
                    const graphWidth = 700;
                    const graphHeight = 250;
                    
                    let adjustedX = tooltipX;
                    let adjustedY = tooltipY;
                    
                    // 우측 경계 확인 및 조정
                    if (tooltipX > graphWidth - 100) {
                      adjustedX = coords[hoveredPoint].x - 120; // 좌측으로 이동
                    }
                    
                    // 하단 경계 확인 및 조정
                    if (tooltipY > graphHeight - 50) {
                      adjustedY = coords[hoveredPoint].y - 60; // 위로 이동
                    }
                    
                    return (
                      <div className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm z-20 pointer-events-none"
                           style={{
                             left: `${adjustedX}px`,
                             top: `${adjustedY}px`
                           }}>
                        <div className="text-center">
                          <div className="font-semibold">{formatValue(coords[hoveredPoint].value)}{unit}</div>
                          <div className="text-xs text-gray-300">{hourStr}:{minuteStr}</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* 현재 값 정보 */}
              <div className="mt-4 flex items-center justify-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: color }}>
                    {formatValue(value)}
                  </div>
                  <div className="text-sm text-gray-500">{unit}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
