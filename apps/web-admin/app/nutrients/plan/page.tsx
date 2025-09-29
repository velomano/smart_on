'use client';

import React, { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import { getCurrentUser, AuthUser } from '@/lib/auth';
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

interface SavedRecipe {
  id: string;
  crop_profiles: {
    crop_name: string;
    stage: string;
  };
  target_volume_l: number;
  water_profiles: {
    name: string;
  };
  ec_est?: number;
  ph_est?: number;
  created_at: string;
  lines: Array<{
    salt: string;
    grams: number;
  }>;
}

export default function NutrientPlanPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // 계산 기능 관련 상태
  const [crop, setCrop] = useState('상추');
  const [volume, setVolume] = useState(100);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 레시피 저장 관련 상태
  const [saving, setSaving] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  
  // 레시피 브라우징 관련 상태
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState<'calculate' | 'recipes' | 'saved'>('calculate');

  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          window.location.href = '/login';
          return;
        }
        setUser(currentUser);
      } catch (err) {
        console.error('인증 확인 실패:', err);
        window.location.href = '/login';
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadSavedRecipes();
      loadMockRecipes();
    }
  }, [user]);

  // Mock 레시피 로드 (향후 API로 교체)
  async function loadMockRecipes() {
    try {
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
        },
        {
          id: '4',
          crop: '딸기',
          stage: '결실기',
          volume_l: 80,
          ec_target: 1.8,
          ph_target: 6.3,
          npk_ratio: '2:1:2',
          created_at: '2024-09-28T07:45:00Z',
          source_title: '베리류 재배법',
          source_year: 2024,
          license: 'CC BY 4.0'
        }
      ];
      setRecipes(mockRecipes);
    } catch (error) {
      console.error('레시피 로드 실패:', error);
    }
  }

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

  // 저장된 레시피 로드
  async function loadSavedRecipes() {
    setLoadingRecipes(true);
    try {
      const r = await fetch('/api/nutrients/recipes');
      const j = await r.json();
      if (j.ok) {
        setSavedRecipes(j.recipes);
      }
    } catch (e) {
      console.error('레시피 로드 실패:', e);
    } finally {
      setLoadingRecipes(false);
    }
  }

  // 배양액 계산
  async function plan() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/nutrients/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          cropNameOrKey: crop, 
          stage: 'vegetative', 
          targetVolumeL: volume, 
          waterProfileName: 'RO_Default' 
        })
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'fail');
      setRes(j.result);
    } catch (e: any) {
      setError(e.message);
      setRes(null);
    } finally {
      setLoading(false);
    }
  }

  // 레시피 저장
  async function saveRecipe() {
    if (!res || !recipeName.trim()) return;
    
    setSaving(true);
    try {
      const r = await fetch('/api/nutrients/save-recipe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cropKey: res.cropKey,
          stage: res.stage,
          targetVolumeL: res.target.volumeL,
          waterProfileName: 'RO_Default',
          recipeName: recipeName.trim()
        })
      });
      
      const j = await r.json();
      if (j.ok) {
        alert('레시피가 저장되었습니다.');
        setShowSaveModal(false);
        setRecipeName('');
        loadSavedRecipes();
      } else {
        throw new Error(j.error || '저장 실패');
      }
    } catch (e: any) {
      alert('저장 실패: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  // 레시피 삭제
  async function deleteRecipe(recipeId: string) {
    if (!confirm('정말로 이 레시피를 삭제하시겠습니까?')) return;
    
    try {
      const r = await fetch(`/api/nutrients/recipes?id=${recipeId}`, {
        method: 'DELETE'
      });
      
      const j = await r.json();
      if (j.ok) {
        alert('레시피가 삭제되었습니다.');
        loadSavedRecipes();
      } else {
        throw new Error(j.error || '삭제 실패');
      }
    } catch (e: any) {
      alert('삭제 실패: ' + e.message);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <AppHeader 
        user={user}
        title="🌱 배양액 제조"
        subtitle="작물별 최적 배양액 제조 및 레시피 관리"
        showBackButton={true}
        backButtonText="대시보드"
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-500 to-blue-600 px-8 py-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <span className="text-3xl">🌱</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">배양액 제조 시스템</h1>
                <p className="text-white/90 text-lg">작물별 최적 배양액 제조를 위한 지능형 계산 및 레시피 관리 시스템</p>
              </div>
            </div>
          </div>
          
          <div className="px-8 py-8">
            {/* 탭 메뉴 */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('calculate')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'calculate'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🧪 배양액 계산
                </button>
                <button
                  onClick={() => setActiveTab('recipes')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'recipes'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📚 레시피 브라우징
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'saved'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  💾 저장된 레시피
                </button>
              </nav>
            </div>

            {/* 배양액 계산 탭 */}
            {activeTab === 'calculate' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">배양액 계산</h2>
                  <p className="text-gray-600">작물과 용량을 입력하면 최적의 양액 조성을 계산해드립니다.</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">작물 선택</label>
                      <select
                        value={crop}
                        onChange={(e) => setCrop(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="상추">상추</option>
                        <option value="토마토">토마토</option>
                        <option value="오이">오이</option>
                        <option value="딸기">딸기</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">용량 (L)</label>
                      <input
                        type="number"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="1"
                        max="1000"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={plan}
                        disabled={loading}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? '계산 중...' : '계산하기'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 계산 결과 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <span className="text-red-600 text-lg mr-2">❌</span>
                      <div>
                        <div className="text-red-800 font-medium">API 에러</div>
                        <div className="text-red-700 text-sm mt-1">{error}</div>
                      </div>
                    </div>
                  </div>
                )}

                {res && (
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="text-lg font-semibold text-gray-800">📊 계산 결과</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">작물:</span>
                        <span className="ml-2 font-medium text-gray-900">{res.cropKey}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">단계:</span>
                        <span className="ml-2 font-medium text-gray-900">{res.stage}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">용량:</span>
                        <span className="ml-2 font-medium text-gray-900">{res.target.volumeL} L</span>
                      </div>
                      <div>
                        <span className="text-gray-600">추정 EC:</span>
                        <span className="ml-2 font-medium text-gray-900">{res.qc.ec_est ?? '-'} mS/cm</span>
                      </div>
                    </div>

                    {res.qc.warnings?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <span className="text-amber-600 text-lg mr-2">⚠️</span>
                          <div className="text-amber-800 font-medium text-sm">주의사항</div>
                        </div>
                        <ul className="text-amber-700 text-sm space-y-1">
                          {res.qc.warnings.map((w: string, i: number) => (
                            <li key={i}>• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="font-semibold text-blue-800 mb-2">🅰️ A 탱크</div>
                        <ul className="space-y-1">
                          {res.lines.filter((l: any) => l.tank === 'A').map((l: any, i: number) => (
                            <li key={i} className="text-sm text-blue-900">
                              <span className="font-medium">{l.salt}:</span> {l.grams} g
                            </li>
                          ))}
                          {res.lines.filter((l: any) => l.tank === 'A').length === 0 && (
                            <li className="text-sm text-gray-500">A 탱크 사용 없음</li>
                          )}
                        </ul>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="font-semibold text-purple-800 mb-2">🅱️ B 탱크</div>
                        <ul className="space-y-1">
                          {res.lines.filter((l: any) => l.tank === 'B').map((l: any, i: number) => (
                            <li key={i} className="text-sm text-purple-900">
                              <span className="font-medium">{l.salt}:</span> {l.grams} g
                            </li>
                          ))}
                          {res.lines.filter((l: any) => l.tank === 'B').length === 0 && (
                            <li className="text-sm text-gray-500">B 탱크 사용 없음</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {res.adjustments?.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="font-semibold text-orange-800 mb-2">🧪 pH 보정</div>
                        <ul className="space-y-1">
                          {res.adjustments.map((a: any, i: number) => (
                            <li key={i} className="text-sm text-orange-700">
                              <span className="font-medium">{a.reagent}:</span> {a.ml} mL
                              {a.rationale && <span className="text-gray-600 ml-2">({a.rationale})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* 레시피 저장 버튼 */}
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        💾 레시피 저장
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 레시피 브라우징 탭 */}
            {activeTab === 'recipes' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">배양액 레시피 브라우징</h2>
                  <p className="text-gray-600">다양한 작물과 성장 단계별 배양액 레시피를 제공합니다.</p>
                </div>

                {/* 검색 및 필터 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="작물명 또는 단계 검색..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">작물</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">성장 단계</label>
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
                        <button 
                          onClick={() => {
                            setCrop(recipe.crop);
                            setVolume(recipe.volume_l);
                            setActiveTab('calculate');
                          }}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          계산에 사용
                        </button>
                        <button className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors">
                          상세 보기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredRecipes.length === 0 && (
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
                {filteredRecipes.length > 0 && (
                  <div className="text-center">
                    <p className="text-gray-600">
                      총 <span className="font-semibold text-gray-900">{filteredRecipes.length}</span>개의 레시피를 찾았습니다.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 저장된 레시피 탭 */}
            {activeTab === 'saved' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">저장된 레시피</h2>
                  <p className="text-gray-600">내가 저장한 배양액 레시피를 관리할 수 있습니다.</p>
                </div>

                {loadingRecipes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">레시피를 불러오는 중...</p>
                  </div>
                ) : savedRecipes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-gray-400">💾</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      저장된 레시피가 없습니다
                    </h3>
                    <p className="text-gray-600">
                      배양액 계산 후 레시피를 저장해보세요.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedRecipes.map((recipe) => (
                      <div key={recipe.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {recipe.crop_profiles.crop_name} ({recipe.crop_profiles.stage})
                            </h3>
                            <p className="text-sm text-gray-600">
                              {recipe.target_volume_l}L • {recipe.water_profiles.name}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteRecipe(recipe.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-800">추정 EC:</span>
                            <span className="font-medium text-gray-900">{recipe.ec_est || '-'} mS/cm</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-800">추정 pH:</span>
                            <span className="font-medium text-gray-900">{recipe.ph_est || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-800">생성일:</span>
                            <span className="text-xs text-gray-700">
                              {new Date(recipe.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-800">
                            <div className="font-medium mb-1 text-gray-900">사용 염류:</div>
                            <div className="space-y-1">
                              {recipe.lines.slice(0, 2).map((line: any, i: number) => (
                                <div key={i} className="flex justify-between">
                                  <span className="text-gray-800">{line.salt}:</span>
                                  <span className="text-gray-900 font-medium">{line.grams}g</span>
                                </div>
                              ))}
                              {recipe.lines.length > 2 && (
                                <div className="text-gray-600">+{recipe.lines.length - 2}개 더...</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 레시피 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">레시피 저장</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  레시피 이름
                </label>
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="예: 상추_영양생장기_100L"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              
              {res && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="font-medium text-gray-900 mb-2">저장할 레시피:</div>
                  <div className="text-gray-700">
                    <div>{res.cropKey} ({res.stage}) • {res.target.volumeL}L</div>
                    <div>추정 EC: {res.qc.ec_est} mS/cm</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={saveRecipe}
                disabled={saving || !recipeName.trim()}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

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