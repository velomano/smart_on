import React, { useState, useEffect } from 'react';

// URL 유효성 검증 함수
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// 한국시간 변환 함수
function formatKoreanTime(utcTimeString: string): string {
  try {
    const date = new Date(utcTimeString);
    const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreanTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
}

interface RecipeUpdate {
  id: string;
  crop: string;
  stage: string;
  volume_l: number;
  ec_target?: number;
  ph_target?: number;
  npk_ratio?: string;
  created_at: string;
  source_title?: string;
  source_year?: number;
  source_url?: string;
  license?: string;
  description?: string;
  growing_conditions?: any;
  nutrients_detail?: any;
  usage_notes?: string[];
  warnings?: string[];
  author?: string;
  last_updated?: string;
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

interface RecipeUpdatesFooterProps {
  onViewAllRecipes?: () => void;
}

export default function RecipeUpdatesFooter({ onViewAllRecipes }: RecipeUpdatesFooterProps) {
  const [data, setData] = useState<RecipeUpdatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeUpdate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 실제 API에서 최근 레시피 데이터 가져오기 (더 많은 데이터를 가져와서 정확한 계산)
        const response = await fetch('/api/nutrients/browse?limit=100');
        const result = await response.json();
        
        if (result.ok && result.recipes) {
          const recentRecipes = result.recipes.map((recipe: any) => ({
            id: recipe.id,
            crop: recipe.crop,
            stage: recipe.stage,
            volume_l: recipe.volume_l,
            ec_target: recipe.ec_target,
            ph_target: recipe.ph_target,
            npk_ratio: recipe.npk_ratio,
            created_at: recipe.created_at,
            source_title: recipe.source_title,
            source_year: recipe.source_year,
            source_url: recipe.source_url,
            license: recipe.license,
            description: recipe.description,
            growing_conditions: recipe.growing_conditions,
            nutrients_detail: recipe.nutrients_detail,
            usage_notes: recipe.usage_notes,
            warnings: recipe.warnings,
            author: recipe.author,
            last_updated: recipe.last_updated
          }));
          
          // UTC 기준으로 오늘 날짜 계산 (GitHub Actions는 UTC로 실행)
          const today = new Date().toISOString().split('T')[0];
          const todayRecipes = recentRecipes.filter((recipe: any) => 
            recipe.created_at && recipe.created_at.startsWith(today)
          );
          
          const data: RecipeUpdatesData = {
            recent_recipes: recentRecipes,
            updates_log: [
              {
                day: today,
                added_count: todayRecipes.length,
                last_update: recentRecipes[0]?.created_at || new Date().toISOString()
              }
            ]
          };
          
          setData(data);
          setError(null);
        } else {
          throw new Error('API 응답 오류');
        }
      } catch (err) {
        console.error('Failed to fetch recipe updates:', err);
        // API 실패 시 목 데이터 사용
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // 60초마다 데이터 업데이트
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRecipeClick = (recipe: RecipeUpdate) => {
    setSelectedRecipe(recipe);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRecipe(null);
  };

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
                    • 마지막 갱신 {formatKoreanTime(lastUpdate)} (한국시간)
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

        {/* 오늘 추가된 레시피 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const todayRecipes = data.recent_recipes.filter(recipe => 
              recipe.created_at && recipe.created_at.startsWith(today)
            );
            
            return todayRecipes.length > 0 ? todayRecipes.map((recipe) => (
              <div 
                key={recipe.id} 
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 cursor-pointer transition-all duration-200"
                onClick={() => handleRecipeClick(recipe)}
              >
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
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      클릭하여 상세 보기 →
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 ml-2">
                    {new Date(recipe.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                오늘 추가된 레시피가 없습니다.
              </div>
            );
          })()}
        </div>

        {/* 전체 보기 링크 */}
        <div className="mt-4 text-center">
          <button 
            onClick={onViewAllRecipes}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
          >
            전체 레시피 보기 →
          </button>
        </div>
      </div>

      {/* 상세 보기 모달 */}
      {showDetailModal && selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">🌱 레시피 상세 정보</h2>
                <button
                  onClick={closeDetailModal}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* 📋 기본 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 기본 정보</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">작물:</span>
                      <span className="ml-2 text-gray-900">{selectedRecipe.crop}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">성장 단계:</span>
                      <span className="ml-2 text-gray-900">{selectedRecipe.stage}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">용량:</span>
                      <span className="ml-2 text-gray-900">{selectedRecipe.volume_l}L</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">NPK 비율:</span>
                      <span className="ml-2 text-gray-900">{selectedRecipe.npk_ratio}</span>
                    </div>
                  </div>
                </div>

                {/* 📝 레시피 설명 */}
                {selectedRecipe.description && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">📝 레시피 설명</h4>
                    <p className="text-sm text-green-800">{selectedRecipe.description}</p>
                  </div>
                )}

                {/* 🌡️ 재배 환경 조건 */}
                {selectedRecipe.growing_conditions && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">🌡️ 재배 환경 조건</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedRecipe.growing_conditions.temperature && (
                        <div>
                          <span className="font-medium text-blue-700">온도:</span>
                          <span className="ml-2 text-blue-800">{selectedRecipe.growing_conditions.temperature}</span>
                        </div>
                      )}
                      {selectedRecipe.growing_conditions.humidity && (
                        <div>
                          <span className="font-medium text-blue-700">습도:</span>
                          <span className="ml-2 text-blue-800">{selectedRecipe.growing_conditions.humidity}</span>
                        </div>
                      )}
                      {selectedRecipe.growing_conditions.light_hours && (
                        <div>
                          <span className="font-medium text-blue-700">조명 시간:</span>
                          <span className="ml-2 text-blue-800">{selectedRecipe.growing_conditions.light_hours}</span>
                        </div>
                      )}
                      {selectedRecipe.growing_conditions.co2_level && (
                        <div>
                          <span className="font-medium text-blue-700">CO₂ 농도:</span>
                          <span className="ml-2 text-blue-800">{selectedRecipe.growing_conditions.co2_level}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 🧪 영양소 상세 정보 */}
                {selectedRecipe.nutrients_detail && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-3">🧪 영양소 상세 정보 (ppm)</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedRecipe.nutrients_detail.nitrogen && (
                        <div>
                          <span className="font-medium text-purple-700">질소 (N):</span>
                          <span className="ml-2 text-purple-800">{selectedRecipe.nutrients_detail.nitrogen}</span>
                        </div>
                      )}
                      {selectedRecipe.nutrients_detail.phosphorus && (
                        <div>
                          <span className="font-medium text-purple-700">인산 (P):</span>
                          <span className="ml-2 text-purple-800">{selectedRecipe.nutrients_detail.phosphorus}</span>
                        </div>
                      )}
                      {selectedRecipe.nutrients_detail.potassium && (
                        <div>
                          <span className="font-medium text-purple-700">칼륨 (K):</span>
                          <span className="ml-2 text-purple-800">{selectedRecipe.nutrients_detail.potassium}</span>
                        </div>
                      )}
                      {selectedRecipe.nutrients_detail.calcium && (
                        <div>
                          <span className="font-medium text-purple-700">칼슘 (Ca):</span>
                          <span className="ml-2 text-purple-800">{selectedRecipe.nutrients_detail.calcium}</span>
                        </div>
                      )}
                      {selectedRecipe.nutrients_detail.magnesium && (
                        <div>
                          <span className="font-medium text-purple-700">마그네슘 (Mg):</span>
                          <span className="ml-2 text-purple-800">{selectedRecipe.nutrients_detail.magnesium}</span>
                        </div>
                      )}
                    </div>
                    {selectedRecipe.nutrients_detail.trace_elements && (
                      <div className="mt-3">
                        <span className="font-medium text-purple-700 text-sm">미량원소:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedRecipe.nutrients_detail.trace_elements.map((element: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded">
                              {element}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 📋 사용법 */}
                {selectedRecipe.usage_notes && selectedRecipe.usage_notes.length > 0 && (
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="font-medium text-indigo-900 mb-2">📋 사용법</h4>
                    <ul className="space-y-1">
                      {selectedRecipe.usage_notes.map((note, index) => (
                        <li key={index} className="text-sm text-indigo-800 flex items-start">
                          <span className="text-indigo-600 mr-2">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ⚠️ 주의사항 */}
                {selectedRecipe.warnings && selectedRecipe.warnings.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">⚠️ 주의사항</h4>
                    <ul className="space-y-1">
                      {selectedRecipe.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-red-800 flex items-start">
                          <span className="text-red-600 mr-2">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 📚 출처 및 메타 정보 */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-3">📚 출처 및 메타 정보</h4>
                  <div className="space-y-2 text-sm">
                    {selectedRecipe.source_title && (
                      <div>
                        <span className="font-medium text-yellow-700">출처:</span>
                        <span className="ml-2 text-yellow-800">
                          {selectedRecipe.source_title}
                          {selectedRecipe.source_year && ` (${selectedRecipe.source_year})`}
                        </span>
                      </div>
                    )}
                    {selectedRecipe.author && (
                      <div>
                        <span className="font-medium text-yellow-700">작성자:</span>
                        <span className="ml-2 text-yellow-800">{selectedRecipe.author}</span>
                      </div>
                    )}
                    {selectedRecipe.license && (
                      <div>
                        <span className="font-medium text-yellow-700">라이선스:</span>
                        <span className="ml-2 text-yellow-800">{selectedRecipe.license}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-yellow-700">최종 업데이트:</span>
                      <span className="ml-2 text-yellow-800">
                        {selectedRecipe.last_updated || selectedRecipe.created_at}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetailModal}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
