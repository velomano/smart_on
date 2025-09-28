import React, { useState, useEffect } from 'react';

interface RecipeUpdate {
  id: string;
  crop: string;
  stage: string;
  volume_l: number;
  created_at: string;
  source_title?: string;
  source_year?: number;
  license?: string;
}

interface RecipeUpdatesLog {
  day: string;
  added_count: number;
  last_update: string;
}

interface RecipeUpdatesData {
  recent_recipes: RecipeUpdate[];
  updates_log: RecipeUpdatesLog[];
}

export default function RecipeUpdatesFooter() {
  const [data, setData] = useState<RecipeUpdatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 실제로는 /api/recipes/recent 엔드포인트를 호출해야 함
        // 현재는 목 데이터로 시뮬레이션
        const mockData: RecipeUpdatesData = {
          recent_recipes: [
            {
              id: '1',
              crop: '토마토',
              stage: '성장기',
              volume_l: 100,
              created_at: '2024-09-28T10:00:00Z',
              source_title: '수경재배 가이드',
              source_year: 2024,
              license: 'CC BY 4.0'
            },
            {
              id: '2',
              crop: '상추',
              stage: '발아기',
              volume_l: 50,
              created_at: '2024-09-28T09:30:00Z',
              source_title: 'LED 조명 재배',
              source_year: 2024,
              license: 'CC BY-SA 4.0'
            }
          ],
          updates_log: [
            {
              day: '2024-09-28',
              added_count: 3,
              last_update: '2024-09-28T12:00:00Z'
            }
          ]
        };
        
        setData(mockData);
        setError(null);
      } catch (err) {
        setError('데이터 로드 실패');
        console.error('Failed to fetch recipe updates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // 60초마다 데이터 업데이트
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center text-gray-600">
          레시피 업데이트 정보 로딩 중...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center text-red-600">
          업데이트 정보를 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  const todayLog = data.updates_log.find(log => 
    log.day === new Date().toISOString().split('T')[0]
  );

  const lastUpdate = data.updates_log[0]?.last_update;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">🌱</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                최신 배양액 레시피 업데이트
              </h3>
              <p className="text-sm text-gray-600">
                {todayLog ? `오늘 추가 ${todayLog.added_count}건` : '오늘 추가 없음'}
                {lastUpdate && (
                  <span className="ml-2">
                    • 마지막 갱신 {new Date(lastUpdate).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-600 font-medium">실시간 업데이트</span>
          </div>
        </div>

        {/* 최근 레시피 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.recent_recipes.slice(0, 6).map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {recipe.crop} - {recipe.stage}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    용량: {recipe.volume_l}L
                  </p>
                  {recipe.source_title && (
                    <p className="text-xs text-gray-500 mb-1">
                      출처: {recipe.source_title}
                      {recipe.source_year && ` (${recipe.source_year})`}
                    </p>
                  )}
                  {recipe.license && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {recipe.license}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 ml-2">
                  {new Date(recipe.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 전체 보기 링크 */}
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            전체 레시피 보기 →
          </button>
        </div>
      </div>
    </div>
  );
}
