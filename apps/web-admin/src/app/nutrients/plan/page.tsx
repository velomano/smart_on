'use client';
import { useEffect, useMemo, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { getCurrentUser, AuthUser } from '@/lib/mockAuth';

export default function NutrientPlanPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [crop, setCrop] = useState('상추');
  const [volume, setVolume] = useState(100);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [error, setError] = useState<string| null>(null);
  
  // 레시피 저장 관련 상태
  const [saving, setSaving] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculate' | 'recipes'>('calculate');

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

  async function plan() {
    setLoading(true); setError(null);
    try {
      const r = await fetch('/api/nutrients/plan', {
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body: JSON.stringify({ cropNameOrKey: crop, stage:'vegetative', targetVolumeL: volume, waterProfileName:'RO_Default' })
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error||'fail');
      setRes(j.result);
    } catch(e:any) {
      setError(e.message);
      setRes(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ 
    if (user) {
      plan(); // 자동 미리보기 
      loadSavedRecipes(); // 저장된 레시피 로드
    }
  }, [user]);

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

  // 레시피 저장
  async function saveRecipe() {
    console.log('saveRecipe 호출됨:', { res: !!res, recipeName: recipeName.trim() });
    if (!res || !recipeName.trim()) {
      console.log('저장 조건 미충족:', { res: !!res, recipeName: recipeName.trim() });
      return;
    }
    
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
          recipeName: recipeName.trim(),
          recipeLines: res.lines,
          adjustments: res.adjustments,
          qc: res.qc,
          createdBy: user?.id
        })
      });
      
      const j = await r.json();
      if (j.ok) {
        alert('레시피가 저장되었습니다!');
        setShowSaveModal(false);
        setRecipeName('');
        loadSavedRecipes(); // 목록 새로고침
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
        loadSavedRecipes(); // 목록 새로고침
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
        title="🌱 양액계산"
        subtitle="작물별 최적 배양액 제조 계획"
        showBackButton={true}
        backButtonText="대시보드"
      />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">배양액 제조 계획</h1>
          <p className="text-gray-600">작물과 용량을 입력하면 최적의 양액 조성을 계산해드립니다.</p>

          {/* 탭 메뉴 */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('calculate')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'calculate'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🌱 양액 계산
              </button>
              <button
                onClick={() => setActiveTab('recipes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recipes'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📚 저장된 레시피 ({savedRecipes.length})
              </button>
            </nav>
          </div>

          {activeTab === 'calculate' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 입력 폼 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">계산 조건</h2>
              
                <div className="space-y-4">
                  <label className="block space-y-2">
                    <div className="text-sm font-medium text-gray-900">작물 이름</div>
                    <input 
                      type="text" 
                      value={crop}
                      onChange={(e) => setCrop(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                      placeholder="상추, 토마토, 오이, 딸기, 고추, 바질"
                    />
                  </label>
                  
                  <label className="block space-y-2">
                    <div className="text-sm font-medium text-gray-900">용량 (L)</div>
                    <input 
                      type="number" 
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      min="1"
                      max="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                      placeholder="100"
                    />
                  </label>
                </div>

                <button
                  onClick={plan}
                  disabled={loading || !crop.trim()}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? '계산 중...' : '🌱 양액 계산하기'}
                </button>

                {/* 현재 지원 작물 안내 */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">🌱 현재 지원 작물 (6종)</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>상추:</strong> 영양생장기, 성숙기</p>
                    <p><strong>토마토:</strong> 영양생장기, 개화기, 결실기</p>
                    <p><strong>오이:</strong> 영양생장기, 결실기</p>
                    <p><strong>딸기:</strong> 영양생장기, 결실기</p>
                    <p><strong>고추:</strong> 영양생장기, 개화기, 결실기</p>
                    <p><strong>바질:</strong> 영양생장기, 개화기</p>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 <strong>총 9개 프로파일:</strong> 각 작물별 생육단계에 맞는 최적 양액 조성을 제공합니다.
                  </p>
                </div>
              </div>

              {/* 결과 미리보기 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">계산 결과</h2>
                
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
                    <div className="text-lg font-semibold text-gray-800">📊 기본 정보</div>
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
                          {res.qc.warnings.map((w:string,i:number)=>(<li key={i}>• {w}</li>))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="font-semibold text-blue-800 mb-2">🅰️ A 탱크</div>
                        <ul className="space-y-1">
                          {res.lines.filter((l:any)=>l.tank==='A').map((l:any,i:number)=>(
                            <li key={i} className="text-sm text-blue-900">
                              <span className="font-medium">{l.salt}:</span> {l.grams} g
                            </li>
                          ))}
                          {res.lines.filter((l:any)=>l.tank==='A').length === 0 && (
                            <li className="text-sm text-gray-500">A 탱크 사용 없음</li>
                          )}
                        </ul>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="font-semibold text-purple-800 mb-2">🅱️ B 탱크</div>
                        <ul className="space-y-1">
                          {res.lines.filter((l:any)=>l.tank==='B').map((l:any,i:number)=>(
                            <li key={i} className="text-sm text-purple-900">
                              <span className="font-medium">{l.salt}:</span> {l.grams} g
                            </li>
                          ))}
                          {res.lines.filter((l:any)=>l.tank==='B').length === 0 && (
                            <li className="text-sm text-gray-500">B 탱크 사용 없음</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {res.adjustments?.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="font-semibold text-orange-800 mb-2">🧪 pH 보정</div>
                        <ul className="space-y-1">
                          {res.adjustments.map((a:any,i:number)=>(
                            <li key={i} className="text-sm text-orange-700">
                              <span className="font-medium">{a.reagent}:</span> {a.ml} mL
                              {a.rationale && <span className="text-gray-600 ml-2">({a.rationale})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* 레시피 저장 버튼 */}
                    {res && (
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setShowSaveModal(true)}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                        >
                          💾 레시피 저장하기
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!res && !error && !loading && (
                  <div className="bg-gray-100 rounded-xl p-8 text-center">
                    <div className="text-gray-500 text-lg mb-2">🌱</div>
                    <p className="text-gray-600">작물과 용량을 입력하고 계산하기 버튼을 눌러주세요</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 저장된 레시피 탭 */
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">저장된 레시피</h2>
                <button
                  onClick={loadSavedRecipes}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  🔄 새로고침
                </button>
              </div>

              {loadingRecipes ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">레시피를 불러오는 중...</p>
                </div>
              ) : savedRecipes.length === 0 ? (
                <div className="bg-gray-100 rounded-xl p-8 text-center">
                  <div className="text-gray-500 text-lg mb-2">📚</div>
                  <p className="text-gray-600">저장된 레시피가 없습니다.</p>
                  <p className="text-gray-500 text-sm mt-1">양액 계산 후 레시피를 저장해보세요!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedRecipes.map((recipe: any) => (
                    <div key={recipe.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {recipe.crop_profiles.crop_name} ({recipe.crop_profiles.stage})
                          </h3>
                          <p className="text-sm text-gray-800">
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

        {/* 레시피 저장 모달 */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
      </main>
    </div>
  );
}