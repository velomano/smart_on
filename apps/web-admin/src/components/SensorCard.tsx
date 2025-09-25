'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

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
  // 디버깅용 로그
  console.log(`📊 ${title} 센서 카드 - 데이터:`, { value, chartDataLength: chartData?.length });
  
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (type === 'ph') {
      return val.toFixed(1);
    }
    return val.toFixed(1);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-lg text-xs">
          <p className="font-medium text-gray-700">{`${label}`}</p>
          <p className="font-bold" style={{ color: color }}>
            {`${title}: ${formatValue(payload[0].value)}${unit}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 h-56 flex flex-col">
      {/* 헤더 - 아이콘과 제목 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{icon}</span>
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <div className="text-xs text-gray-500">실시간</div>
      </div>

      {/* 디지털 표시 영역 - 컴팩트하게 */}
      <div className="mb-2">
        <div className="text-center">
          <div 
            className="text-3xl font-bold mb-0.5"
            style={{ color: color }}
          >
            {formatValue(value)}
          </div>
          <div 
            className="text-sm font-medium"
            style={{ color: color }}
          >
            {unit}
          </div>
        </div>
      </div>

      {/* 미니 실시간 그래프 - 최대한 크게 */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 7, fill: '#666' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 7, fill: '#666' }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tickFormatter={(value) => {
                if (type === 'ph') return value.toFixed(1);
                if (type === 'ec') return value.toFixed(1);
                return Math.round(value).toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={type}
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 3, stroke: color, strokeWidth: 2, fill: 'white' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 상태 표시 - 컴팩트하게 */}
      <div className="flex items-center justify-between mt-1 text-xs">
        <div className="flex items-center space-x-1">
          <div 
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: color }}
          ></div>
          <span className="text-gray-500">활성</span>
        </div>
        <span className="text-gray-400">
          {chartData.length > 0 ? `${chartData.length}개` : '없음'}
        </span>
      </div>
    </div>
  );
}
