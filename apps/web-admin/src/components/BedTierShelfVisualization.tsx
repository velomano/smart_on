import React from 'react';

interface BedTierShelfVisualizationProps {
  activeTiers: number; // 1~3 중 활성화할 단수
  tierStatuses: Array<{
    tierNumber: number; // 1, 2, 3
    hasPlants: boolean;
    cropName?: string;
    growingMethod?: string;
    plantType?: 'seed' | 'seedling'; // 파종/육묘
    startDate?: string; // 생육 시작일자
  }>;
  waterLevelStatus?: 'high' | 'low' | 'normal' | 'disconnected';
  onTierClick?: (tierNumber: number) => void;
  compact?: boolean;
}

export default function BedTierShelfVisualization({
  activeTiers,
  tierStatuses,
  waterLevelStatus = 'normal',
  onTierClick,
  compact = false
}: BedTierShelfVisualizationProps) {
  
  // 고정된 3단 + 저수조 SVG 컴포넌트
  const FixedBedSVG = () => {
    const shelfHeight = 80;  // 모든 선반 높이 (40 -> 80)
    const waterTankHeight = 100;  // 저수조 높이 (60 -> 100)
    const shelfWidth = 300;  // 선반 너비 (180 -> 300)
    const shelfSpacing = 80; // 선반 간격 (60 -> 80)
    const totalHeight = (3 * shelfHeight) + (2 * shelfSpacing) + waterTankHeight + shelfSpacing + 30;
    
    // 저수조 색상 결정
    const getWaterTankColor = () => {
      switch (waterLevelStatus) {
        case 'high': return '#EF4444'; // 빨간색
        case 'low': return '#F59E0B';  // 노란색
        case 'normal': return '#0EA5E9'; // 파란색
        case 'disconnected': return '#6B7280'; // 회색
        default: return '#0EA5E9';
      }
    };
    
    // 단별 색상 결정
    const getTierColor = (tierNumber: number) => {
      const tier = tierStatuses.find(t => t.tierNumber === tierNumber);
      const isActive = tierNumber <= activeTiers;
      
      if (!isActive) return '#D1D5DB'; // 비활성 - 어두운 회색
      if (tier?.hasPlants) return '#86EFAC'; // 작물 있음 - 연한 녹색
      return '#E5E7EB'; // 기본 - 회색
    };
    
    return (
      <div className="relative inline-block">
        <svg 
          width={shelfWidth + 60} 
          height={totalHeight} 
          viewBox={`0 0 ${shelfWidth + 60} ${totalHeight}`}
          className="drop-shadow-lg"
        >
          {/* 베드 프레임 (좌우 지지대) */}
          <rect 
            x="15" 
            y="15" 
            width="12" 
            height={totalHeight - 30} 
            fill="#8B5CF6" 
            rx="6"
          />
          <rect 
            x={shelfWidth + 27} 
            y="15" 
            width="12" 
            height={totalHeight - 30} 
            fill="#8B5CF6" 
            rx="6"
          />
          
          {/* 1단 (맨 위) */}
          <g 
            className={onTierClick ? 'cursor-pointer' : ''}
            onClick={() => onTierClick?.(1)}
          >
            <rect 
              x="27" 
              y="15" 
              width={shelfWidth} 
              height={shelfHeight} 
              fill={getTierColor(1)} 
              stroke="#8B5CF6" 
              strokeWidth="2"
              rx="6"
            />
            
            {/* 1단 앞쪽 가장자리 */}
            <rect 
              x="27" 
              y={15 + shelfHeight - 6} 
              width={shelfWidth} 
              height="6" 
              fill="#8B5CF6" 
              rx="3"
            />
            
            {/* 1단 라벨 */}
            <text 
              x="40" 
              y={15 + shelfHeight - 10} 
              fontSize="16" 
              fill="#6B7280" 
              fontWeight="bold"
            >
              1단
            </text>
            
            {/* 작물 정보 표시 */}
            {(() => {
              const tier = tierStatuses.find(t => t.tierNumber === 1);
              if (tier?.hasPlants && tier.cropName) {
                return (
                  <g>
                    {/* 작물 이름 (중앙) */}
                    <text 
                      x="120" 
                      y={15 + shelfHeight / 2 - 5} 
                      fontSize="16" 
                      fill="#374151" 
                      fontWeight="bold"
                    >
                      {tier.cropName}
                    </text>
                    {/* 재배 방법 (중앙) */}
                    {tier.growingMethod && (
                      <text 
                        x="120" 
                        y={15 + shelfHeight / 2 + 15} 
                        fontSize="12" 
                        fill="#6B7280"
                      >
                        {tier.growingMethod}
                      </text>
                    )}
                    {/* 작물 유형과 시작일자 (오른쪽) */}
                    <text 
                      x={shelfWidth - 20} 
                      y={15 + shelfHeight / 2 - 5} 
                      fontSize="12" 
                      fill="#6B7280"
                      textAnchor="end"
                    >
                      {tier.plantType === 'seed' ? '파종' : '육묘'}
                    </text>
                    {tier.startDate && (
                      <text 
                        x={shelfWidth - 20} 
                        y={15 + shelfHeight / 2 + 15} 
                        fontSize="11" 
                        fill="#9CA3AF"
                        textAnchor="end"
                      >
                        {tier.startDate}
                      </text>
                    )}
                  </g>
                );
              }
              return null;
            })()}
          </g>

          {/* 2단 */}
          <g 
            className={onTierClick ? 'cursor-pointer' : ''}
            onClick={() => onTierClick?.(2)}
          >
            <rect 
              x="27" 
              y={15 + shelfHeight + shelfSpacing} 
              width={shelfWidth} 
              height={shelfHeight} 
              fill={getTierColor(2)} 
              stroke="#8B5CF6" 
              strokeWidth="2"
              rx="6"
            />
            
            {/* 2단 앞쪽 가장자리 */}
            <rect 
              x="27" 
              y={15 + shelfHeight + shelfSpacing + shelfHeight - 6} 
              width={shelfWidth} 
              height="6" 
              fill="#8B5CF6" 
              rx="3"
            />
            
            {/* 2단 라벨 */}
            <text 
              x="40" 
              y={15 + shelfHeight + shelfSpacing + shelfHeight - 10} 
              fontSize="16" 
              fill="#6B7280" 
              fontWeight="bold"
            >
              2단
            </text>
            
            {/* 작물 정보 표시 */}
            {(() => {
              const tier = tierStatuses.find(t => t.tierNumber === 2);
              if (tier?.hasPlants && tier.cropName) {
                return (
                  <g>
                    {/* 작물 이름 (중앙) */}
                    <text 
                      x="120" 
                      y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 - 5} 
                      fontSize="16" 
                      fill="#374151" 
                      fontWeight="bold"
                    >
                      {tier.cropName}
                    </text>
                    {/* 재배 방법 (중앙) */}
                    {tier.growingMethod && (
                      <text 
                        x="120" 
                        y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 + 15} 
                        fontSize="12" 
                        fill="#6B7280"
                      >
                        {tier.growingMethod}
                      </text>
                    )}
                    {/* 작물 유형과 시작일자 (오른쪽) */}
                    <text 
                      x={shelfWidth - 20} 
                      y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 - 5} 
                      fontSize="12" 
                      fill="#6B7280"
                      textAnchor="end"
                    >
                      {tier.plantType === 'seed' ? '파종' : '육묘'}
                    </text>
                    {tier.startDate && (
                      <text 
                        x={shelfWidth - 20} 
                        y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 + 15} 
                        fontSize="11" 
                        fill="#9CA3AF"
                        textAnchor="end"
                      >
                        {tier.startDate}
                      </text>
                    )}
                  </g>
                );
              }
              return null;
            })()}
          </g>

          {/* 3단 */}
          <g 
            className={onTierClick ? 'cursor-pointer' : ''}
            onClick={() => onTierClick?.(3)}
          >
            <rect 
              x="27" 
              y={15 + (2 * shelfHeight) + (2 * shelfSpacing)} 
              width={shelfWidth} 
              height={shelfHeight} 
              fill={getTierColor(3)} 
              stroke="#8B5CF6" 
              strokeWidth="2"
              rx="6"
            />
            
            {/* 3단 앞쪽 가장자리 */}
            <rect 
              x="27" 
              y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight - 6} 
              width={shelfWidth} 
              height="6" 
              fill="#8B5CF6" 
              rx="3"
            />
            
            {/* 3단 라벨 */}
            <text 
              x="40" 
              y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight - 10} 
              fontSize="16" 
              fill="#6B7280" 
              fontWeight="bold"
            >
              3단
            </text>
            
            {/* 작물 정보 표시 */}
            {(() => {
              const tier = tierStatuses.find(t => t.tierNumber === 3);
              if (tier?.hasPlants && tier.cropName) {
                return (
                  <g>
                    {/* 작물 이름 (중앙) */}
                    <text 
                      x="120" 
                      y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 - 5} 
                      fontSize="16" 
                      fill="#374151" 
                      fontWeight="bold"
                    >
                      {tier.cropName}
                    </text>
                    {/* 재배 방법 (중앙) */}
                    {tier.growingMethod && (
                      <text 
                        x="120" 
                        y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 + 15} 
                        fontSize="12" 
                        fill="#6B7280"
                      >
                        {tier.growingMethod}
                      </text>
                    )}
                    {/* 작물 유형과 시작일자 (오른쪽) */}
                    <text 
                      x={shelfWidth - 20} 
                      y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 - 5} 
                      fontSize="12" 
                      fill="#6B7280"
                      textAnchor="end"
                    >
                      {tier.plantType === 'seed' ? '파종' : '육묘'}
                    </text>
                    {tier.startDate && (
                      <text 
                        x={shelfWidth - 20} 
                        y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 + 15} 
                        fontSize="11" 
                        fill="#9CA3AF"
                        textAnchor="end"
                      >
                        {tier.startDate}
                      </text>
                    )}
                  </g>
                );
              }
              return null;
            })()}
          </g>

          {/* 저수조 (맨 아래, 항상 표시) */}
          <g>
            <rect 
              x="27" 
              y={15 + (3 * shelfHeight) + (3 * shelfSpacing)} 
              width={shelfWidth} 
              height={waterTankHeight} 
              fill={getWaterTankColor()} 
              stroke={getWaterTankColor()} 
              strokeWidth="2"
              rx="6"
            />
            
            {/* 물탱크 아이콘 */}
            <text 
              x="40" 
              y={15 + (3 * shelfHeight) + (3 * shelfSpacing) + 35} 
              fontSize="28" 
              fill="white" 
              textAnchor="middle"
              fontWeight="bold"
            >
              💧
            </text>
            
            {/* 물탱크 라벨 */}
            <text 
              x={shelfWidth / 2 + 27} 
              y={15 + (3 * shelfHeight) + (3 * shelfSpacing) + 55} 
              fontSize="16" 
              fill="white" 
              fontWeight="bold"
              textAnchor="middle"
            >
              저수조
            </text>
          </g>
          
        </svg>
      </div>
    );
  };

  if (compact) {
    const activeCropCount = tierStatuses.filter(tier => tier.hasPlants).length;
    return (
      <div className="flex items-center space-x-2">
        <FixedBedSVG />
        <div className="text-xs text-gray-600">
          {activeCropCount > 0 && (
            <span className="font-semibold">🌱 {activeCropCount}개 작물</span>
          )}
        </div>
      </div>
    );
  }

  const activeCropCount = tierStatuses.filter(tier => tier.hasPlants).length;
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-800">베드 단 구조</h4>
        {activeCropCount > 0 && (
          <span className="text-sm text-gray-600 bg-green-100 px-3 py-2 rounded-full font-semibold">
            🌱 {activeCropCount}개 작물 활성
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-center mb-6">
        <FixedBedSVG />
      </div>
      
      {/* 단별 상세 정보 */}
      <div className="space-y-3">
        {[1, 2, 3].map((tierNumber) => {
          const tier = tierStatuses.find(t => t.tierNumber === tierNumber);
          const isActive = tierNumber <= activeTiers;
          
          return (
            <div
              key={tierNumber}
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                isActive 
                  ? tier?.hasPlants 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'bg-blue-50 border-2 border-blue-200'
                  : 'bg-gray-50 border-2 border-gray-200'
              } ${onTierClick ? 'cursor-pointer hover:shadow-md' : ''}`}
              onClick={() => onTierClick?.(tierNumber)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  isActive 
                    ? tier?.hasPlants 
                      ? 'bg-green-500' 
                      : 'bg-blue-400'
                    : 'bg-gray-300'
                }`} />
                <span className={`text-base font-semibold ${
                  isActive ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {tierNumber}단
                </span>
                {tier?.cropName && (
                  <span className="text-sm text-gray-600">({tier.cropName})</span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {isActive && (
                  <span className="text-sm text-gray-600 font-medium">
                    {tier?.hasPlants ? '🌱 작물 있음' : '🔄 대기'}
                  </span>
                )}
                <span className={`text-sm px-3 py-2 rounded-full font-semibold ${
                  isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isActive ? '활성' : '비활성'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}
