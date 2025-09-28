import React from 'react';

interface BedTierVisualizationProps {
  totalTiers: number;
  activeTiers: number;
  tierStatuses: Array<{
    tierNumber: number;
    isActive: boolean;
    status: 'active' | 'inactive';
    plantCount: number;
    hasPlants: boolean;
  }>;
  onTierClick?: (tierNumber: number) => void;
  compact?: boolean;
}

export default function BedTierVisualization({
  totalTiers,
  activeTiers,
  tierStatuses,
  onTierClick,
  compact = false
}: BedTierVisualizationProps) {
  
  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <span className="text-xs text-gray-600">🏗️</span>
        <div className="flex space-x-0.5">
          {tierStatuses.slice(0, 5).map((tier) => (
            <div
              key={tier.tierNumber}
              className={`w-2 h-2 rounded-full ${
                tier.isActive 
                  ? tier.hasPlants 
                    ? 'bg-green-500' 
                    : 'bg-blue-400'
                  : 'bg-gray-300'
              }`}
              title={`${tier.tierNumber}단 ${tier.isActive ? '활성' : '비활성'} ${tier.hasPlants ? `(${tier.plantCount}개 식물)` : ''}`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-600">
          {activeTiers}/{totalTiers}단
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-800">단 구조</h4>
        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
          {activeTiers}/{totalTiers}단 활성
        </span>
      </div>
      
      <div className="space-y-1">
        {tierStatuses.map((tier) => (
          <div
            key={tier.tierNumber}
            className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
              tier.isActive 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            } ${onTierClick ? 'cursor-pointer hover:shadow-sm' : ''}`}
            onClick={() => onTierClick?.(tier.tierNumber)}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                tier.isActive 
                  ? tier.hasPlants 
                    ? 'bg-green-500' 
                    : 'bg-blue-400'
                  : 'bg-gray-300'
              }`} />
              <span className={`text-sm font-medium ${
                tier.isActive ? 'text-gray-800' : 'text-gray-500'
              }`}>
                {tier.tierNumber}단
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {tier.isActive && (
                <span className="text-xs text-gray-600">
                  {tier.hasPlants ? `🌱 ${tier.plantCount}` : '🔄 대기'}
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${
                tier.isActive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {tier.isActive ? '활성' : '비활성'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {activeTiers > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>🌱 식물 재배 중</span>
            <span>🔄 대기 중</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              식물 있음
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-1" />
              식물 없음
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
