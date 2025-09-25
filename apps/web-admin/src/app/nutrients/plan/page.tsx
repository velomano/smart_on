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
    }
  }, [user]);

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 입력 폼 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">계산 조건</h2>
              
              <div className="space-y-4">
                <label className="block space-y-2">
                  <div className="text-sm font-medium text-gray-700">작물 이름</div>
                  <input 
                    value={crop} 
                    onChange={e=>setCrop(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-gray-900 placeholder-gray-500" 
                    placeholder="상추, 토마토, 오이, 딸기" 
                  />
                  <p className="text-xs text-gray-500">한글명 또는 영문명으로 입력하세요</p>
                </label>
                
                <label className="block space-y-2">
                  <div className="text-sm font-medium text-gray-700">생육 단계</div>
                  <select 
                    value="vegetative" 
                    onChange={() => {}} // 임시로 빈 핸들러 추가
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-gray-900 bg-white" 
                  >
                    <option value="vegetative" className="text-gray-900">영양생장기 (Vegetative)</option>
                    <option value="flowering" className="text-gray-900">개화기 (Flowering)</option>
                    <option value="fruiting" className="text-gray-900">결실기 (Fruiting)</option>
                    <option value="mature" className="text-gray-900">성숙기 (Mature)</option>
                  </select>
                  <p className="text-xs text-gray-500">작물의 현재 생육 단계를 선택하세요</p>
                </label>
                
                <label className="block space-y-2">
                  <div className="text-sm font-medium text-gray-700">총 용량 (L)</div>
                  <input 
                    type="number" 
                    value={volume} 
                    onChange={e=>setVolume(parseFloat(e.target.value))} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-gray-900 placeholder-gray-500" 
                    min="1"
                    max="10000"
                  />
                  <p className="text-xs text-gray-500">1L ~ 10,000L 범위에서 입력하세요</p>
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
                <h3 className="text-sm font-semibold text-blue-800 mb-2">🌱 현재 지원 작물 (4종)</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>상추:</strong> 영양생장기, 성숙기</p>
                  <p><strong>토마토:</strong> 영양생장기, 개화기, 결실기</p>
                  <p><strong>오이:</strong> 영양생장기, 결실기</p>
                  <p><strong>딸기:</strong> 영양생장기, 결실기</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 <strong>업데이트 예정:</strong> 더 많은 작물과 생육단계별 프로파일이 추가될 예정입니다.
                </p>
              </div>
            </div>

            {/* 결과 미리보기 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">계산 결과</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <span className="text-red-500 text-xl mr-2">⚠️</span>
                    <div className="text-red-700 font-medium">계산 오류</div>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
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
        </div>
      </main>
    </div>
  );
}
