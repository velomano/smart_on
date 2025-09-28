'use client';

import React, { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import RecipeUpdatesFooter from '@/components/RecipeUpdatesFooter';
import LegalNotice from '@/components/LegalNotice';

interface Recipe {
  id: string;
  crop: string;
  stage: string;
  volume_l: number;
  ec_target: number;
  ph_target: number;
  npk_ratio: string;
  created_at: string;
  source_title?: string;
  source_year?: number;
  license?: string;
}

export default function NutrientPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedStage, setSelectedStage] = useState('');

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        // 실제로는 API에서 레시피를 불러와야 함
        // 현재는 목 데이터로 시뮬레이션
        const mockRecipes: Recipe[] = [
          {
            id: '1',
            crop: '토마토',
            stage: '성장기',
            volume_l: 100,
            ec_target: 2.5,
            ph_target: 6.0,
            npk_ratio: '3:1:3',
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
            ec_target: 1.2,
            ph_target: 6.5,
            npk_ratio: '2:1:2',
            created_at: '2024-09-28T09:30:00Z',
            source_title: 'LED 조명 재배',
            source_year: 2024,
            license: 'CC BY-SA 4.0'
          },
          {
            id: '3',
            crop: '오이',
            stage: '개화기',
            volume_l: 150,
            ec_target: 2.0,
            ph_target: 6.2,
            npk_ratio: '2:1:3',
            created_at: '2024-09-28T08:15:00Z',
            source_title: '온실 재배 매뉴얼',
            source_year: 2024,
            license: 'CC BY 4.0'
          }
        ];
        
        setRecipes(mockRecipes);
      } catch (error) {
        console.error('레시피 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  // 필터링된 레시피
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.stage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrop = !selectedCrop || recipe.crop === selectedCrop;
    const matchesStage = !selectedStage || recipe.stage === selectedStage;
    
    return matchesSearch && matchesCrop && matchesStage;
  });

  // 작물 목록 (중복 제거)
  const crops = [...new Set(recipes.map(r => r.crop))];
  const stages = [...new Set(recipes.map(r => r.stage))];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="배양액 제조"
        subtitle="농작물별 맞춤 레시피"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            배양액 제조 레시피
          </h1>
          <p className="text-gray-600">
            다양한 작물과 성장 단계별 배양액 레시피를 제공합니다.
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="작물명 또는 단계 검색..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작물
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                {crops.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성장 단계
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                {stages.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCrop('');
                  setSelectedStage('');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {/* 레시피 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">레시피를 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {recipe.crop}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {recipe.stage} • {recipe.volume_l}L
                    </p>
                  </div>
                  {recipe.license && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {recipe.license}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">EC 목표값:</span>
                    <span className="text-sm text-gray-900">{recipe.ec_target} mS/cm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">pH 목표값:</span>
                    <span className="text-sm text-gray-900">{recipe.ph_target}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">NPK 비율:</span>
                    <span className="text-sm text-gray-900">{recipe.npk_ratio}</span>
                  </div>
                </div>

                {recipe.source_title && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">출처:</p>
                    <p className="text-xs text-gray-600">
                      {recipe.source_title}
                      {recipe.source_year && ` (${recipe.source_year})`}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
                    상세 보기
                  </button>
                  <button className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors">
                    레시피 사용
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredRecipes.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">🔍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600">
              다른 검색어나 필터를 시도해보세요.
            </p>
          </div>
        )}

        {/* 결과 통계 */}
        {!loading && filteredRecipes.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              총 <span className="font-semibold text-gray-900">{filteredRecipes.length}</span>개의 레시피를 찾았습니다.
            </p>
          </div>
        )}
      </div>

      {/* 레시피 업데이트 푸터 */}
      <RecipeUpdatesFooter />

      {/* 법적 고지 */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LegalNotice compact />
        </div>
      </div>
    </div>
  );
}
