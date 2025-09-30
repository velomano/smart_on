'use client';

import React, { useState } from 'react';
import AppHeader from '../../../src/components/AppHeader';

interface TabType {
  id: string;
  label: string;
  icon: string;
}

export default function NutrientGuidePage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabType[] = [
    { id: 'overview', label: '배양액 조제 개요', icon: '🧪' },
    { id: 'search', label: '레시피 검색', icon: '🔍' },
    { id: 'formulation', label: '조제 방법', icon: '⚗️' },
    { id: 'monitoring', label: '모니터링', icon: '📊' },
    { id: 'management', label: '관리 팁', icon: '💡' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border border-cyan-200">
        <h2 className="text-2xl font-bold text-cyan-900 mb-4">🧪 배양액 조제 개요</h2>
        <p className="text-cyan-800 mb-6">
          작물별 맞춤형 배양액 레시피를 찾고, 올바르게 조제하여 최적의 작물 성장을 도모합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌱</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">작물별 레시피</h3>
              <p className="text-sm text-gray-600">40+ 작물 지원</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 상추, 토마토, 딸기</li>
            <li>• 고추, 오이, 가지</li>
            <li>• 바질, 로즈마리</li>
            <li>• 기타 허브류</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">신뢰할 수 있는 출처</h3>
              <p className="text-sm text-gray-600">과학적 근거</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Cornell University</li>
            <li>• USDA 농업연구소</li>
            <li>• 국내 연구기관</li>
            <li>• 검증된 농업 전문가</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">실시간 모니터링</h3>
              <p className="text-sm text-gray-600">EC/pH 추적</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• EC 값 실시간 측정</li>
            <li>• pH 값 모니터링</li>
            <li>• 임계값 알림</li>
            <li>• 자동 조정 제안</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 주요 영양소 지표</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl mb-2">⚡</div>
            <h5 className="font-medium text-green-800">EC (전기전도도)</h5>
            <p className="text-sm text-green-600">0.5-2.5 mS/cm</p>
            <p className="text-xs text-green-500">영양소 농도</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl mb-2">🧪</div>
            <h5 className="font-medium text-blue-800">pH</h5>
            <p className="text-sm text-blue-600">5.5-6.5</p>
            <p className="text-xs text-blue-500">산도</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl mb-2">🌡️</div>
            <h5 className="font-medium text-purple-800">온도</h5>
            <p className="text-sm text-purple-600">18-25°C</p>
            <p className="text-xs text-purple-500">배양액 온도</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl mb-2">💧</div>
            <h5 className="font-medium text-orange-800">DO (용존산소)</h5>
            <p className="text-sm text-orange-600">5-8 mg/L</p>
            <p className="text-xs text-orange-500">산소 농도</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-4">🔍 레시피 검색</h2>
        <p className="text-green-800 mb-6">
          작물명, 생육 단계, 출처별로 배양액 레시피를 쉽게 찾을 수 있습니다.
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 검색 옵션</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">작물명</label>
              <input 
                type="text" 
                placeholder="예: 상추, 토마토"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">생육 단계</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="">전체</option>
                <option value="seedling">발아기</option>
                <option value="vegetative">영양생장기</option>
                <option value="flowering">개화기</option>
                <option value="fruiting">결실기</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">출처</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="">전체</option>
                <option value="cornell">Cornell University</option>
                <option value="usda">USDA</option>
                <option value="korean">국내 연구기관</option>
              </select>
            </div>
          </div>
          
          <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
            검색
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 검색 결과</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">상추 - 영양생장기</h4>
                <p className="text-sm text-gray-600">Cornell University • 2023</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                EC: 1.2-1.8 mS/cm
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">EC 목표값:</span>
                <span className="ml-2 text-gray-600">1.5 mS/cm</span>
              </div>
              <div>
                <span className="font-medium">pH 목표값:</span>
                <span className="ml-2 text-gray-600">6.0</span>
              </div>
              <div>
                <span className="font-medium">온도:</span>
                <span className="ml-2 text-gray-600">20-22°C</span>
              </div>
            </div>
            <div className="mt-3">
              <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors">
                상세 보기
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">토마토 - 결실기</h4>
                <p className="text-sm text-gray-600">USDA 농업연구소 • 2022</p>
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                EC: 2.0-2.5 mS/cm
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">EC 목표값:</span>
                <span className="ml-2 text-gray-600">2.2 mS/cm</span>
              </div>
              <div>
                <span className="font-medium">pH 목표값:</span>
                <span className="ml-2 text-gray-600">6.2</span>
              </div>
              <div>
                <span className="font-medium">온도:</span>
                <span className="ml-2 text-gray-600">22-24°C</span>
              </div>
            </div>
            <div className="mt-3">
              <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors">
                상세 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFormulation = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">⚗️ 배양액 조제 방법</h2>
        <p className="text-blue-800 mb-6">
          선택한 레시피를 바탕으로 안전하고 정확하게 배양액을 조제하는 단계별 가이드입니다.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 1단계: 재료 준비</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">필수 재료</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 질산칼슘 (Ca(NO₃)₂)</li>
                  <li>• 질산칼륨 (KNO₃)</li>
                  <li>• 인산이수소칼륨 (KH₂PO₄)</li>
                  <li>• 황산마그네슘 (MgSO₄)</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">추가 재료</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 철 킬레이트 (Fe-EDTA)</li>
                  <li>• 붕산 (H₃BO₃)</li>
                  <li>• 황산망간 (MnSO₄)</li>
                  <li>• 황산아연 (ZnSO₄)</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ 주의사항</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 모든 재료는 농업용 등급을 사용하세요</li>
                <li>• 저장 시 밀폐 용기에 보관하세요</li>
                <li>• 직사광선을 피해 서늘한 곳에 보관하세요</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚖️ 2단계: 계량 및 혼합</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">A액 (칼슘계)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">질산칼슘</span>
                    <span className="font-mono text-sm">236g</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">질산칼륨</span>
                    <span className="font-mono text-sm">101g</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">물</span>
                    <span className="font-mono text-sm">10L</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">B액 (인산계)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">인산이수소칼륨</span>
                    <span className="font-mono text-sm">136g</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">황산마그네슘</span>
                    <span className="font-mono text-sm">123g</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">물</span>
                    <span className="font-mono text-sm">10L</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">💡 혼합 순서</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. 물을 절반 정도 채운 후 재료를 하나씩 넣어주세요</li>
                <li>2. 각 재료가 완전히 녹은 후 다음 재료를 넣어주세요</li>
                <li>3. A액과 B액은 따로 보관하고 사용 직전에 혼합하세요</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 3단계: 최종 조제</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">희석 비율</h4>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">1:100</div>
                  <p className="text-sm text-purple-600">농축액:물</p>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">최종 EC</h4>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">1.5</div>
                  <p className="text-sm text-green-600">mS/cm</p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">최종 pH</h4>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">6.0</div>
                  <p className="text-sm text-blue-600">pH</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">✅ 조제 완료 체크리스트</h4>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4 text-green-600" />
                  <span>EC 값 확인 (목표값 ±0.1)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4 text-green-600" />
                  <span>pH 값 확인 (목표값 ±0.1)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4 text-green-600" />
                  <span>온도 확인 (18-25°C)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4 text-green-600" />
                  <span>용존산소 확인 (5mg/L 이상)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoring = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">📊 배양액 모니터링</h2>
        <p className="text-purple-800 mb-6">
          배양액의 상태를 실시간으로 모니터링하고 적절한 조치를 취할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <span className="text-sm text-gray-500">현재</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">1.52</h3>
          <p className="text-sm text-gray-600">EC (mS/cm)</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-green-600">정상 범위</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧪</span>
            </div>
            <span className="text-sm text-gray-500">현재</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">6.1</h3>
          <p className="text-sm text-gray-600">pH</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-green-600">정상 범위</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌡️</span>
            </div>
            <span className="text-sm text-gray-500">현재</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">21.5°C</h3>
          <p className="text-sm text-gray-600">온도</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-green-600">적정 온도</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💧</span>
            </div>
            <span className="text-sm text-gray-500">현재</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">6.2</h3>
          <p className="text-sm text-gray-600">DO (mg/L)</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-green-600">충분</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 24시간 트렌드</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">EC/pH 변화 차트</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 알림 현황</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">EC 값 정상</p>
                <p className="text-xs text-green-700">목표값 1.5 ± 0.1 범위 내</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">pH 조정 권장</p>
                <p className="text-xs text-yellow-700">6.1 → 6.0으로 조정 필요</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">배양액 교체 예정</p>
                <p className="text-xs text-blue-700">3일 후 교체 권장</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 자동 조정 설정</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">EC 자동 조정</h4>
              <div className="flex items-center space-x-3">
                <input type="checkbox" className="w-4 h-4 text-purple-600" defaultChecked />
                <label className="text-sm text-gray-700">EC 값이 목표값에서 벗어나면 자동 조정</label>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">허용 오차</label>
                <input type="number" step="0.1" defaultValue="0.1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">pH 자동 조정</h4>
              <div className="flex items-center space-x-3">
                <input type="checkbox" className="w-4 h-4 text-purple-600" defaultChecked />
                <label className="text-sm text-gray-700">pH 값이 목표값에서 벗어나면 자동 조정</label>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">허용 오차</label>
                <input type="number" step="0.1" defaultValue="0.1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderManagement = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
        <h2 className="text-2xl font-bold text-orange-900 mb-4">💡 배양액 관리 팁</h2>
        <p className="text-orange-800 mb-6">
          배양액을 효율적으로 관리하고 작물 성장을 최적화하는 전문적인 팁들입니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 교체 주기</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">일반적인 교체 주기</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 상추류: 7-10일</li>
                <li>• 토마토: 10-14일</li>
                <li>• 고추: 7-10일</li>
                <li>• 허브류: 10-14일</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">교체 신호</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• EC 값이 급격히 상승</li>
                <li>• pH 값이 불안정</li>
                <li>• 용존산소 감소</li>
                <li>• 작물 생장 저하</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🧹 청소 및 관리</h3>
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-2">정기 청소</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• 배양액 탱크 주 1회 청소</li>
                <li>• 파이프라인 월 1회 세척</li>
                <li>• 센서 주 1회 점검</li>
                <li>• 필터 월 1회 교체</li>
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">청소 방법</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 식초 또는 구연산 사용</li>
                <li>• 강한 화학물질 금지</li>
                <li>• 충분한 헹굼</li>
                <li>• 건조 후 재사용</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 문제 해결 가이드</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">EC 값이 높음</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 물을 추가하여 희석</li>
                <li>• 배양액 교체</li>
                <li>• 배수 확인</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">pH 값이 낮음</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 칼륨 수산화물 사용</li>
                <li>• 탄산칼슘 추가</li>
                <li>• 물질 변화 확인</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">용존산소 부족</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 에어레이션 증가</li>
                <li>• 순환 펌프 점검</li>
                <li>• 온도 조절</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 성능 최적화</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">모니터링 최적화</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 실시간 센서 데이터 수집</li>
                <li>• 자동 알림 시스템 구축</li>
                <li>• 데이터 로깅 및 분석</li>
                <li>• 예측 유지보수</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">자동화 시스템</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 자동 EC/pH 조정</li>
                <li>• 스케줄 기반 교체</li>
                <li>• 원격 모니터링</li>
                <li>• 알림 시스템</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'search':
        return renderSearch();
      case 'formulation':
        return renderFormulation();
      case 'monitoring':
        return renderMonitoring();
      case 'management':
        return renderManagement();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="배양액 조제" subtitle="배양액 레시피 및 조제 완전 가이드" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">목차</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
