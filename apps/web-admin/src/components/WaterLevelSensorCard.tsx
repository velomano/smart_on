'use client';

import React, { useState } from 'react';

interface WaterLevelSensorCardProps {
  level: 'high' | 'low' | 'normal' | 'disconnected';
  percentage?: number;
  chartData?: any[];
  title?: string;
}

export default function WaterLevelSensorCard({ 
  level, 
  percentage = 0, 
  chartData = [], 
  title = '수위센서' 
}: WaterLevelSensorCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 수위 상태별 색상과 아이콘
  const getStatusInfo = () => {
    switch (level) {
      case 'high':
        return {
          color: '#EF4444',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '🌊',
          status: '고수위',
          description: '수위가 높습니다'
        };
      case 'low':
        return {
          color: '#F59E0B',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '💧',
          status: '저수위',
          description: '수위가 낮습니다'
        };
      case 'normal':
        return {
          color: '#0EA5E9',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: '💙',
          status: '정상',
          description: '수위가 정상입니다'
        };
      case 'disconnected':
        return {
          color: '#6B7280',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '❌',
          status: '연결 안됨',
          description: '센서 연결을 확인하세요'
        };
      default:
        return {
          color: '#6B7280',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '❓',
          status: '알 수 없음',
          description: '상태를 확인할 수 없습니다'
        };
    }
  };

  const statusInfo = getStatusInfo();

  // 수위 바 생성
  const createWaterLevelBar = () => {
    const height = level === 'disconnected' ? 0 : Math.max(10, percentage);
    
    return (
      <div className="w-full h-20 bg-gray-200 rounded-lg relative overflow-hidden">
        {/* 수위 바 */}
        <div 
          className={`absolute bottom-0 w-full transition-all duration-500 ${
            level === 'high' ? 'bg-gradient-to-t from-red-400 to-red-500' :
            level === 'low' ? 'bg-gradient-to-t from-yellow-400 to-yellow-500' :
            level === 'normal' ? 'bg-gradient-to-t from-blue-400 to-blue-500' :
            'bg-gray-400'
          }`}
          style={{ height: `${height}%` }}
        />
        
        {/* 수위 파도 효과 */}
        {level !== 'disconnected' && (
          <div className="absolute bottom-0 w-full h-2 bg-white/30 animate-pulse" />
        )}
        
        {/* 수위 퍼센트 표시 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white drop-shadow-lg">
            {level === 'disconnected' ? '--' : `${Math.round(percentage)}%`}
          </span>
        </div>
      </div>
    );
  };

  // 확대된 모달 차트
  const createExpandedChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <div>수위 데이터가 없습니다</div>
          </div>
        </div>
      );
    }
    
    const recentData = chartData.slice(-24);
    const values = recentData.map(d => Number(d.water_level) || 0);
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
            fill={statusInfo.color} 
            stroke="white" strokeWidth="2"
            style={{ cursor: 'pointer' }}
          />
        ))}
        
        {/* 선 연결 */}
        <path d={Path} stroke={statusInfo.color} strokeWidth="4" fill="none"/>
        
        {/* 시간 라벨 */}
        <text x="70" y="360" fontSize="16" fill="#666" textAnchor="middle">0시</text>
        <text x="200" y="360" fontSize="16" fill="#666" textAnchor="middle">6시</text>
        <text x="330" y="360" fontSize="16" fill="#666" textAnchor="middle">12시</text>
        <text x="460" y="360" fontSize="16" fill="#666" textAnchor="middle">18시</text>
        <text x="590" y="360" fontSize="16" fill="#666" textAnchor="middle">20시</text>
        <text x="720" y="360" fontSize="16" fill="#666" textAnchor="middle">24시</text>
        
        {/* 값 라벨 */}
        {[maxVal, (maxVal + minVal) / 2, minVal].map((val, i) => (
          <text 
            key={i}
            x="40" 
            y={50 + (maxVal - val) / range * 250 + 5} 
            fontSize="14" 
            fill="#666" 
            textAnchor="end"
          >
            {Math.round(val)}%
          </text>
        ))}
      </svg>
    );
  };

  return (
    <div className={`bg-white rounded-xl p-4 border-2 ${statusInfo.borderColor} shadow-lg hover:shadow-xl transition-all duration-200 h-64 flex flex-col`}>
      {/* 헤더 섹션 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{statusInfo.icon}</span>
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

      {/* 수위 바 표시 */}
      <div className="flex-1 flex flex-col items-center justify-center mb-4">
        {createWaterLevelBar()}
      </div>

      {/* 상태 표시 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: statusInfo.color }}
          />
          <span className="text-sm font-medium text-gray-600">{statusInfo.status}</span>
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
                <span className="text-3xl">{statusInfo.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{title} 상세 그래프</h3>
                  <p className="text-sm text-gray-500">최근 24시간 수위 데이터</p>
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
              </div>

              {/* 현재 상태 정보 */}
              <div className="mt-4 flex items-center justify-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: statusInfo.color }}>
                    {level === 'disconnected' ? '--' : `${Math.round(percentage)}%`}
                  </div>
                  <div className="text-sm text-gray-500">현재 수위</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold" style={{ color: statusInfo.color }}>
                    {statusInfo.status}
                  </div>
                  <div className="text-sm text-gray-500">{statusInfo.description}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
