import React from 'react';

interface BedTierShelfVisualizationProps {
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
  showPlants?: boolean;
}

export default function BedTierShelfVisualization({
  totalTiers,
  activeTiers,
  tierStatuses,
  onTierClick,
  compact = false,
  showPlants = true
}: BedTierShelfVisualizationProps) {
  
  // 선반 SVG 컴포넌트
  const ShelfSVG = ({ tierNumber, isActive, hasPlants, plantCount }: {
    tierNumber: number;
    isActive: boolean;
    hasPlants: boolean;
    plantCount: number;
  }) => {
    const shelfHeight = 60;  // 20 -> 60 (3배 증가)
    const shelfWidth = 180;  // 60 -> 180 (3배 증가)
    const shelfSpacing = 75; // 25 -> 75 (3배 증가)
    const totalHeight = (tierNumber * shelfHeight) + ((tierNumber - 1) * shelfSpacing) + 30;
    
    return (
      <div className="relative inline-block">
        <svg 
          width={shelfWidth + 60} 
          height={totalHeight + 30} 
          viewBox={`0 0 ${shelfWidth + 60} ${totalHeight + 30}`}
          className="drop-shadow-lg"
        >
          {/* 베드 프레임 (좌우 지지대) */}
          <rect 
            x="15" 
            y="15" 
            width="12" 
            height={totalHeight} 
            fill={isActive ? "#8B5CF6" : "#D1D5DB"} 
            rx="6"
          />
          <rect 
            x={shelfWidth + 27} 
            y="15" 
            width="12" 
            height={totalHeight} 
            fill={isActive ? "#8B5CF6" : "#D1D5DB"} 
            rx="6"
          />
          
          {/* 선반들 */}
          {Array.from({ length: tierNumber }, (_, i) => {
            const y = 15 + (i * (shelfHeight + shelfSpacing));
            const isTierActive = i < activeTiers;
            
            return (
              <g key={i}>
                {/* 선반 판 */}
                <rect 
                  x="27" 
                  y={y} 
                  width={shelfWidth} 
                  height={shelfHeight} 
                  fill={isTierActive ? "#F3F4F6" : "#E5E7EB"} 
                  stroke={isTierActive ? "#8B5CF6" : "#9CA3AF"} 
                  strokeWidth="3"
                  rx="6"
                />
                
                {/* 선반 앞쪽 가장자리 */}
                <rect 
                  x="27" 
                  y={y + shelfHeight - 9} 
                  width={shelfWidth} 
                  height="9" 
                  fill={isTierActive ? "#8B5CF6" : "#9CA3AF"} 
                  rx="3"
                />
                
                {/* 식물 표시 */}
                {showPlants && isTierActive && hasPlants && (
                  <g>
                    {/* 식물 아이콘들 */}
                    {Array.from({ length: Math.min(plantCount, 6) }, (_, plantIndex) => {
                      const plantX = 45 + (plantIndex * 24);
                      const plantY = y + 15;
                      
                      return (
                        <g key={plantIndex}>
                          {/* 식물 줄기 */}
                          <rect 
                            x={plantX + 6} 
                            y={plantY} 
                            width="6" 
                            height="24" 
                            fill="#10B981" 
                            rx="3"
                          />
                          {/* 식물 잎 */}
                          <circle 
                            cx={plantX + 9} 
                            cy={plantY + 6} 
                            r="9" 
                            fill="#34D399" 
                          />
                        </g>
                      );
                    })}
                    
                    {/* 식물 개수 표시 (7개 이상일 때) */}
                    {plantCount > 6 && (
                      <text 
                        x={shelfWidth + 15} 
                        y={y + 36} 
                        fontSize="24" 
                        fill="#6B7280" 
                        textAnchor="end"
                        fontWeight="bold"
                      >
                        +{plantCount - 6}
                      </text>
                    )}
                  </g>
                )}
                
                {/* 단 번호 표시 */}
                <text 
                  x="36" 
                  y={y + 42} 
                  fontSize="24" 
                  fill={isTierActive ? "#6B7280" : "#9CA3AF"} 
                  fontWeight="bold"
                >
                  {i + 1}단
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <ShelfSVG 
          tierNumber={totalTiers}
          isActive={activeTiers > 0}
          hasPlants={tierStatuses.some(tier => tier.hasPlants)}
          plantCount={tierStatuses.reduce((sum, tier) => sum + tier.plantCount, 0)}
        />
        <div className="text-xs text-gray-600">
          <span className="font-semibold">{activeTiers}/{totalTiers}단</span>
          {tierStatuses.some(tier => tier.hasPlants) && (
            <span className="ml-1">🌱 {tierStatuses.reduce((sum, tier) => sum + tier.plantCount, 0)}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border-2 border-gray-300 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-800">베드 단 구조</h4>
        <span className="text-sm text-gray-600 bg-purple-100 px-3 py-2 rounded-full font-semibold">
          {activeTiers}/{totalTiers}단 활성
        </span>
      </div>
      
      <div className="flex items-center justify-center mb-6">
        <ShelfSVG 
          tierNumber={totalTiers}
          isActive={activeTiers > 0}
          hasPlants={tierStatuses.some(tier => tier.hasPlants)}
          plantCount={tierStatuses.reduce((sum, tier) => sum + tier.plantCount, 0)}
        />
      </div>
      
      {/* 단별 상세 정보 */}
      <div className="space-y-3">
        {tierStatuses.map((tier) => (
          <div
            key={tier.tierNumber}
            className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
              tier.isActive 
                ? 'bg-green-50 border-2 border-green-200' 
                : 'bg-gray-50 border-2 border-gray-200'
            } ${onTierClick ? 'cursor-pointer hover:shadow-md' : ''}`}
            onClick={() => onTierClick?.(tier.tierNumber)}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${
                tier.isActive 
                  ? tier.hasPlants 
                    ? 'bg-green-500' 
                    : 'bg-blue-400'
                  : 'bg-gray-300'
              }`} />
              <span className={`text-base font-semibold ${
                tier.isActive ? 'text-gray-800' : 'text-gray-500'
              }`}>
                {tier.tierNumber}단
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {tier.isActive && (
                <span className="text-sm text-gray-600 font-medium">
                  {tier.hasPlants ? `🌱 ${tier.plantCount}개` : '🔄 대기'}
                </span>
              )}
              <span className={`text-sm px-3 py-2 rounded-full font-semibold ${
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
      
      {/* 범례 */}
      {activeTiers > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-gray-300">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="font-semibold">식물 있음</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full" />
              <span className="font-semibold">식물 없음</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <span className="font-semibold">비활성</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
