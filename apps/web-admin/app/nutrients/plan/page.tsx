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
  source_url?: string;
  license?: string;
  // 상세 정보 추가
  description?: string;
  growing_conditions?: {
    temperature: string;
    humidity: string;
    light_hours: string;
    co2_level?: string;
  };
  nutrients_detail?: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    calcium?: number;
    magnesium?: number;
    trace_elements?: string[];
  };
  usage_notes?: string[];
  warnings?: string[];
  author?: string;
  last_updated?: string;
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

// URL 유효성 검증 함수
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // HTTP/HTTPS 프로토콜만 허용
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
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
  
  // 레시피 브라우징 관련 상태
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  
  // 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  
  // 레시피 상세 보기 관련 상태
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState<'calculate' | 'recipes' | 'saved'>('calculate');
  
  // 레시피 통계 상태
  const [recipeStats, setRecipeStats] = useState({ total: 0, today: 0 });

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

  // 레시피 통계 로드
  useEffect(() => {
    const fetchRecipeStats = async () => {
      try {
        // 전체 레시피 수 조회
        const totalResponse = await fetch('/api/nutrients/browse?limit=1');
        const totalResult = await totalResponse.json();
        
        // 모든 레시피를 가져와서 클라이언트에서 오늘 날짜 필터링
        const allResponse = await fetch('/api/nutrients/browse?limit=1000');
        const allResult = await allResponse.json();
        
        // 오늘 날짜 계산
        const today = new Date().toISOString().split('T')[0];
        
        // 오늘 생성된 레시피 개수 계산
        const todayCount = allResult.recipes?.filter((recipe: any) => {
          if (!recipe.created_at) return false;
          const recipeDate = new Date(recipe.created_at).toISOString().split('T')[0];
          return recipeDate === today;
        }).length || 0;
        
        setRecipeStats({
          total: totalResult.pagination?.total || 0,
          today: todayCount,
        });
      } catch (e) {
        console.error('레시피 통계 가져오기 실패:', e);
        setRecipeStats({ total: 0, today: 0 });
      }
    };
    
    if (user) {
      fetchRecipeStats();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSavedRecipes();
      loadRecipes();
    }
  }, [user]);

  // 필터 변경 시 레시피 다시 로드 (첫 페이지로 리셋)
  useEffect(() => {
    if (user) {
      setCurrentPage(1);
      loadRecipes(1, false);
    }
  }, [searchTerm, selectedCrop, selectedStage, user]);

  // 실제 Supabase에서 레시피 브라우징 데이터 로드
  async function loadRecipes(page = 1, append = false) {
    try {
      setLoadingRecipes(true);
      const params = new URLSearchParams();
      if (selectedCrop) params.append('crop', selectedCrop);
      if (selectedStage) params.append('stage', selectedStage);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', page.toString());
      params.append('limit', '21');
      
      const url = `/api/nutrients/browse?${params.toString()}`;
      console.log('🔍 API 호출:', url);
      
      const r = await fetch(url);
      console.log('📡 응답 상태:', r.status, r.statusText);
      
      const j = await r.json();
      console.log('📋 응답 데이터:', j);
      
      if (j.ok) {
        console.log('✅ 레시피 로드 성공:', j.recipes.length, '개');
        console.log('📊 페이지네이션 정보:', j.pagination);
        
        if (append && page > 1) {
          setRecipes(prev => [...prev, ...j.recipes]);
        } else {
          setRecipes(j.recipes);
        }
        
        // 페이지네이션 정보 업데이트
        setTotalCount(j.pagination.total);
        setTotalPages(j.pagination.totalPages);
        setCurrentPage(j.pagination.page);
      } else {
        console.error('❌ 레시피 로드 실패:', j.error, j.details);
        setRecipes([]);
      }
    } catch (error) {
      console.error('❌ 레시피 로드 네트워크 에러:', error);
      setRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  }

  // 작물 목록 (중복 제거) - 서버에서 받은 데이터 기반
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
        title="🌱 배양액 찾기"
        subtitle="작물별 최적 배양액 제조 및 레시피 관리"
        showBackButton={true}
        backButtonText="대시보드"
      />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 lg:py-8">
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-2 sm:mb-4 lg:mb-8">
          <div className="bg-gradient-to-r from-emerald-500 to-blue-600 px-2 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-white/20 rounded-xl flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
                  <span className="text-lg sm:text-2xl lg:text-3xl">🌱</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">배양액 제조 시스템</h1>
                  <p className="text-white/90 text-sm sm:text-base lg:text-lg">작물별 최적 배양액 제조를 위한 지능형 계산 및 레시피 관리 시스템</p>
                </div>
              </div>
              
              {/* 레시피 통계 */}
              <div className="hidden sm:flex items-center space-x-3 text-white">
                <div className="bg-white/20 rounded-lg px-4 py-2 text-center min-w-[80px]">
                  <div className="text-xs text-white/80 mb-1">오늘 찾은 레시피</div>
                  <div className="text-lg font-bold">{recipeStats.today}</div>
                </div>
                <div className="bg-white/20 rounded-lg px-4 py-2 text-center min-w-[80px]">
                  <div className="text-xs text-white/80 mb-1">총 레시피</div>
                  <div className="text-lg font-bold">{recipeStats.total}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8">
          {/* 탭 메뉴 */}
            <div className="border-b border-gray-200 mb-2 sm:mb-4 lg:mb-8">
            <nav className="-mb-px flex space-x-2 sm:space-x-4 lg:space-x-8">
              <button
                onClick={() => setActiveTab('calculate')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'calculate'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                  🧪 배양액 계산
              </button>
              <button
                onClick={() => setActiveTab('recipes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recipes'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                  📚 레시피 브라우징
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'saved'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'
                  }`}
                >
                  💾 저장된 레시피
              </button>
            </nav>
          </div>

            {/* 배양액 계산 탭 */}
            {activeTab === 'calculate' && (
              <div className="space-y-2 sm:space-y-3 lg:space-y-6">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600 mb-1 sm:mb-2">배양액 계산</h2>
                  <p className="text-gray-600 text-sm sm:text-base">작물과 용량을 입력하면 최적의 양액 조성을 계산해드립니다.</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-2 sm:p-3 lg:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 lg:gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1 sm:mb-2">작물 선택</label>
                      <select
                      value={crop}
                      onChange={(e) => setCrop(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-600 font-medium"
                      >
                        <option value="상추">상추</option>
                        <option value="토마토">토마토</option>
                        <option value="오이">오이</option>
                        <option value="딸기">딸기</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1 sm:mb-2">용량 (L)</label>
                    <input 
                      type="number" 
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-600 font-medium"
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
                    <div className="text-lg font-semibold text-gray-600">📊 계산 결과</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">작물:</span>
                        <span className="ml-2 font-medium text-gray-600">{res.cropKey}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">단계:</span>
                        <span className="ml-2 font-medium text-gray-600">{res.stage}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">용량:</span>
                        <span className="ml-2 font-medium text-gray-600">{res.target.volumeL} L</span>
                      </div>
                      <div>
                        <span className="text-gray-600">추정 EC:</span>
                        <span className="ml-2 font-medium text-gray-600">{res.qc.ec_est ?? '-'} mS/cm</span>
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
                  <h2 className="text-2xl font-bold text-gray-600 mb-2">배양액 레시피 브라우징</h2>
                  <p className="text-gray-600">다양한 작물과 성장 단계별 배양액 레시피를 제공합니다.</p>
                  {totalCount > 0 && (
                    <p className="text-sm text-blue-600 font-medium mt-2">
                      총 <span className="font-bold">{totalCount.toLocaleString()}</span>개의 레시피가 있습니다
                    </p>
                  )}
                </div>

                {/* 검색 및 필터 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">검색</label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 font-medium"
                        placeholder="작물명 또는 단계 검색..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">작물</label>
                      <select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 font-medium"
                      >
                        <option value="">전체</option>
                        {crops.map(crop => (
                          <option key={crop} value={crop}>{crop}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">성장 단계</label>
                      <select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 font-medium"
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
                        className="w-full px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        필터 초기화
                      </button>
                    </div>
                  </div>
                </div>

                {/* 레시피 목록 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recipes.map((recipe) => (
                    <div key={recipe.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-600 mb-1">
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
                          <span className="text-sm font-medium text-gray-600">EC 목표값:</span>
                          <span className="text-sm text-gray-600">{recipe.ec_target} mS/cm</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">pH 목표값:</span>
                          <span className="text-sm text-gray-600">{recipe.ph_target}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">NPK 비율:</span>
                          <span className="text-sm text-gray-600">{recipe.npk_ratio}</span>
                        </div>
                      </div>

                      {recipe.source_title && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">출처:</p>
                          {recipe.source_url && isValidUrl(recipe.source_url) ? (
                            <a 
                              href={recipe.source_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={(e) => {
                                // 링크 클릭 시 새 탭에서 열기 전에 확인
                                if (!window.confirm('외부 링크로 이동합니다. 계속하시겠습니까?')) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              {recipe.source_title}
                              {recipe.source_year && ` (${recipe.source_year})`}
                              <span className="ml-1">🔗</span>
                            </a>
                          ) : (
                            <p className="text-xs text-gray-600">
                              {recipe.source_title}
                              {recipe.source_year && ` (${recipe.source_year})`}
                              {recipe.source_url && !isValidUrl(recipe.source_url) && (
                                <span className="ml-1 text-gray-400" title="링크 접속 불가">⚠️</span>
                              )}
                            </p>
                          )}
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
                        <button 
                          onClick={() => {
                            setSelectedRecipe(recipe);
                            setShowDetailModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                        >
                          상세 보기
                        </button>
              </div>
            </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                      onClick={() => loadRecipes(currentPage - 1, false)}
                      disabled={currentPage === 1 || loadingRecipes}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => loadRecipes(pageNum, false)}
                            disabled={loadingRecipes}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => loadRecipes(currentPage + 1, false)}
                      disabled={currentPage === totalPages || loadingRecipes}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                )}

                {/* 로딩 상태 */}
                {loadingRecipes && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">레시피를 불러오는 중...</p>
                  </div>
                )}

                {recipes.length === 0 && !loadingRecipes && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-gray-400">🔍</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      검색 결과가 없습니다
                    </h3>
                    <p className="text-gray-600 mb-4">
                      요청하신 작물이나 생장 단계에 대한 레시피를 찾을 수 없습니다.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <div className="flex items-start">
                        <span className="text-blue-600 text-lg mr-3">📝</span>
                        <div className="text-left">
                          <h4 className="text-blue-900 font-medium mb-1">데이터 수집 요청</h4>
                          <p className="text-blue-800 text-sm mb-3">
                            해당 작물의 레시피를 데이터 자동 수집 대기목록에 등록하고, 빠른 시간 안에 정보를 업데이트하겠습니다.
                          </p>
                <button
                            onClick={async () => {
                              const cropName = selectedCrop || searchTerm || '요청된 작물';
                              const stageName = selectedStage || '해당 단계';
                              
                              try {
                                const response = await fetch('/api/data-collection/requests', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    crop: cropName,
                                    stage: stageName,
                                    user_id: user?.id,
                                    user_email: user?.email,
                                    notes: `사용자 요청: ${cropName} ${stageName} 레시피`
                                  })
                                });
                                
                                const result = await response.json();
                                
                                if (result.ok) {
                                  alert(`✅ "${cropName} - ${stageName}" 레시피가 데이터 수집 대기목록에 등록되었습니다.\n\n빠른 시일 내에 업데이트해드리겠습니다.`);
                                } else {
                                  alert(`❌ 요청 등록에 실패했습니다: ${result.error}`);
                                }
                              } catch (error) {
                                console.error('데이터 수집 요청 에러:', error);
                                alert('❌ 요청 등록 중 오류가 발생했습니다.');
                              }
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            📋 수집 요청 등록
                </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 결과 통계 */}
                {recipes.length > 0 && (
                  <div className="text-center">
                    <p className="text-gray-600">
                      총 <span className="font-semibold text-gray-600">{recipes.length}</span>개의 레시피를 찾았습니다.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 저장된 레시피 탭 */}
            {activeTab === 'saved' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-600 mb-2">저장된 레시피</h2>
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
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
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
                            <h3 className="text-xl font-semibold text-gray-600 mb-1">
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
                          <span className="text-gray-600">추정 EC:</span>
                          <span className="font-medium text-gray-600">{recipe.ec_est || '-'} mS/cm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">추정 pH:</span>
                          <span className="font-medium text-gray-600">{recipe.ph_est || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">생성일:</span>
                          <span className="text-xs text-gray-600">
                            {new Date(recipe.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-600">
                          <div className="font-medium mb-1 text-gray-600">사용 염류:</div>
                          <div className="space-y-1">
                            {recipe.lines.slice(0, 2).map((line: any, i: number) => (
                              <div key={i} className="flex justify-between">
                                <span className="text-gray-600">{line.salt}:</span>
                                <span className="text-gray-600 font-medium">{line.grams}g</span>
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
              <h3 className="text-lg font-semibold text-gray-600 mb-4">레시피 저장</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    레시피 이름
                  </label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="예: 상추_영양생장기_100L"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-600 placeholder-gray-500"
                  />
                </div>
                
                {res && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="font-medium text-gray-600 mb-2">저장할 레시피:</div>
                    <div className="text-gray-600">
                      <div>{res.cropKey} ({res.stage}) • {res.target.volumeL}L</div>
                      <div>추정 EC: {res.qc.ec_est} mS/cm</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
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

      {/* 레시피 상세 보기 모달 */}
      {showDetailModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-green-500 to-blue-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-2xl">🌱</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedRecipe.crop} - {selectedRecipe.stage}
                    </h2>
                    <p className="text-white/90">
                      {selectedRecipe.volume_l}L • EC: {selectedRecipe.ec_target} mS/cm • pH: {selectedRecipe.ph_target}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-600 mb-3">📋 기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">작물:</span>
                    <span className="ml-2 font-medium text-gray-600">{selectedRecipe.crop}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">성장 단계:</span>
                    <span className="ml-2 font-medium text-gray-600">{selectedRecipe.stage}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">용량:</span>
                    <span className="ml-2 font-medium text-gray-600">{selectedRecipe.volume_l}L</span>
                  </div>
                  <div>
                    <span className="text-gray-600">NPK 비율:</span>
                    <span className="ml-2 font-medium text-gray-600">{selectedRecipe.npk_ratio}</span>
                  </div>
                </div>
              </div>

              {/* 설명 */}
              {selectedRecipe.description && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 레시피 설명</h3>
                  <p className="text-blue-800">{selectedRecipe.description}</p>
                </div>
              )}

              {/* 재배 환경 조건 */}
              {selectedRecipe.growing_conditions && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">🌡️ 재배 환경 조건</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">온도:</span>
                      <span className="ml-2 font-medium text-green-900">{selectedRecipe.growing_conditions.temperature}</span>
                    </div>
                    <div>
                      <span className="text-green-700">습도:</span>
                      <span className="ml-2 font-medium text-green-900">{selectedRecipe.growing_conditions.humidity}</span>
                    </div>
                    <div>
                      <span className="text-green-700">조명 시간:</span>
                      <span className="ml-2 font-medium text-green-900">{selectedRecipe.growing_conditions.light_hours}</span>
                    </div>
                    {selectedRecipe.growing_conditions.co2_level && (
                      <div>
                        <span className="text-green-700">CO₂ 농도:</span>
                        <span className="ml-2 font-medium text-green-900">{selectedRecipe.growing_conditions.co2_level}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 영양소 상세 정보 */}
              {selectedRecipe.nutrients_detail && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">🧪 영양소 상세 정보 (ppm)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-purple-700">질소 (N):</span>
                      <span className="ml-2 font-medium text-purple-900">{selectedRecipe.nutrients_detail.nitrogen}</span>
                    </div>
                    <div>
                      <span className="text-purple-700">인산 (P):</span>
                      <span className="ml-2 font-medium text-purple-900">{selectedRecipe.nutrients_detail.phosphorus}</span>
                    </div>
                    <div>
                      <span className="text-purple-700">칼륨 (K):</span>
                      <span className="ml-2 font-medium text-purple-900">{selectedRecipe.nutrients_detail.potassium}</span>
                    </div>
                    {selectedRecipe.nutrients_detail.calcium && (
                      <div>
                        <span className="text-purple-700">칼슘 (Ca):</span>
                        <span className="ml-2 font-medium text-purple-900">{selectedRecipe.nutrients_detail.calcium}</span>
                      </div>
                    )}
                    {selectedRecipe.nutrients_detail.magnesium && (
                      <div>
                        <span className="text-purple-700">마그네슘 (Mg):</span>
                        <span className="ml-2 font-medium text-purple-900">{selectedRecipe.nutrients_detail.magnesium}</span>
                      </div>
                    )}
                  </div>
                  {selectedRecipe.nutrients_detail.trace_elements && (
                    <div className="mt-3">
                      <span className="text-purple-700 text-sm">미량원소:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedRecipe.nutrients_detail.trace_elements.map((element, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded">
                            {element}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 사용법 및 주의사항 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRecipe.usage_notes && (
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-3">📋 사용법</h3>
                    <ul className="space-y-2 text-sm">
                      {selectedRecipe.usage_notes.map((note, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          <span className="text-yellow-800">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedRecipe.warnings && (
                  <div className="bg-red-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-red-900 mb-3">⚠️ 주의사항</h3>
                    <ul className="space-y-2 text-sm">
                      {selectedRecipe.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-600 mr-2">•</span>
                          <span className="text-red-800">{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 출처 및 메타 정보 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-600 mb-3">📚 출처 및 메타 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {selectedRecipe.source_title && (
                    <div>
                      <span className="text-gray-600">출처:</span>
                      <span className="ml-2 font-medium text-gray-600">
                        {selectedRecipe.source_title}
                        {selectedRecipe.source_year && ` (${selectedRecipe.source_year})`}
                      </span>
                    </div>
                  )}
                  {selectedRecipe.author && (
                    <div>
                      <span className="text-gray-600">작성자:</span>
                      <span className="ml-2 font-medium text-gray-600">{selectedRecipe.author}</span>
                    </div>
                  )}
                  {selectedRecipe.license && (
                    <div>
                      <span className="text-gray-600">라이선스:</span>
                      <span className="ml-2 font-medium text-gray-600">{selectedRecipe.license}</span>
                    </div>
                  )}
                  {selectedRecipe.last_updated && (
                    <div>
                      <span className="text-gray-600">최종 업데이트:</span>
                      <span className="ml-2 font-medium text-gray-600">{selectedRecipe.last_updated}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => {
                  setCrop(selectedRecipe.crop);
                  setVolume(selectedRecipe.volume_l);
                  setActiveTab('calculate');
                  setShowDetailModal(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                계산에 사용
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-600 rounded-lg hover:bg-gray-400 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 레시피 업데이트 푸터 */}
      <RecipeUpdatesFooter 
        onViewAllRecipes={() => setActiveTab('recipes')}
      />

      {/* 법적 고지 */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LegalNotice compact />
        </div>
        </div>
    </div>
  );
}
