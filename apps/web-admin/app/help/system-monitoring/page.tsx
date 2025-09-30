'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../src/components/AppHeader';
import BreadcrumbNavigation from '../../../src/components/BreadcrumbNavigation';
import { getCurrentUser } from '../../../src/lib/auth';
import { AuthUser } from '../../../src/lib/auth';

interface TabType {
  id: string;
  label: string;
  icon: string;
}

export default function SystemMonitoringPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('🔍 시스템 모니터링 페이지 - 사용자 정보:', currentUser);
        if (currentUser) {
          setUser(currentUser);
        } else {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        window.location.href = '/login';
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const tabs: TabType[] = [
    { id: 'overview', label: '시스템 모니터링 개요', icon: '📊' },
    { id: 'health', label: '헬스 체크', icon: '🏥' },
    { id: 'metrics', label: '메트릭', icon: '📈' },
    { id: 'performance', label: '성능 모니터링', icon: '⚡' },
    { id: 'logs', label: '로그 관리', icon: '📋' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 시스템 모니터링 개요</h2>
        <p className="text-gray-700 mb-6">
          시스템 상태, 성능 메트릭, 로그 등을 실시간으로 모니터링하여 안정적인 서비스 운영을 보장합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏥 헬스 체크</h3>
          <ul className="space-y-2 text-sm text-gray-700 font-medium">
            <li>• 데이터베이스 연결 상태</li>
            <li>• 서비스 가동 상태</li>
            <li>• 응답 시간 측정</li>
            <li>• 가동 시간 추적</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 메트릭</h3>
          <ul className="space-y-2 text-sm text-gray-700 font-medium">
            <li>• 사용자 수 통계</li>
            <li>• 농장/디바이스 수</li>
            <li>• 센서 데이터 수</li>
            <li>• 성능 지표</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ 성능</h3>
          <ul className="space-y-2 text-sm text-gray-700 font-medium">
            <li>• 메모리 사용률</li>
            <li>• CPU 사용률</li>
            <li>• 에러율</li>
            <li>• 응답 시간</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 모니터링 기능</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-semibold font-bold">1</div>
            <div>
              <h5 className="font-medium text-gray-900">실시간 상태 확인</h5>
              <p className="text-sm text-gray-700 font-medium">시스템 헬스 체크와 서비스 상태를 실시간으로 확인</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-semibold font-bold">2</div>
            <div>
              <h5 className="font-medium text-gray-900">자동 새로고침</h5>
              <p className="text-sm text-gray-700 font-medium">30초마다 데이터 자동 업데이트</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-800 font-semibold font-bold">3</div>
            <div>
              <h5 className="font-medium text-gray-900">에러 처리</h5>
              <p className="text-sm text-gray-700 font-medium">상세한 에러 메시지와 재시도 기능</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHealth = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-4">🏥 헬스 체크</h2>
        <p className="text-green-800 mb-6">
          시스템의 전반적인 상태를 확인하고 문제를 조기에 발견할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💾 데이터베이스 상태</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">연결 상태</span>
              </div>
              <span className="text-green-800 font-semibold font-medium">정상</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-900">응답 시간</span>
              </div>
              <span className="text-blue-800 font-semibold font-medium">45ms</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="font-medium text-gray-900">활성 연결</span>
              </div>
              <span className="text-purple-800 font-semibold font-medium">12개</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🖥️ 시스템 리소스</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-gray-900">메모리 사용률</span>
              </div>
              <span className="text-yellow-800 font-semibold font-medium">68%</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="font-medium text-gray-900">CPU 사용률</span>
              </div>
              <span className="text-orange-800 font-semibold font-medium">23%</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                <span className="font-medium text-gray-900">디스크 사용률</span>
              </div>
              <span className="text-cyan-800 font-semibold font-medium">42%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ 가동 시간</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-800 font-semibold mb-2">15일</div>
            <div className="text-sm text-blue-800 font-medium">전체 가동 시간</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-800 font-semibold mb-2">99.8%</div>
            <div className="text-sm text-green-800 font-medium">가동률</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-3xl font-bold text-purple-800 font-semibold mb-2">2회</div>
            <div className="text-sm text-purple-800 font-medium">다운타임</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">📈 시스템 메트릭</h2>
        <p className="text-blue-800 mb-6">
          사용자, 농장, 디바이스 등의 통계 정보를 통해 시스템 사용 현황을 파악할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <span className="text-sm text-gray-800 font-semibold">총 사용자</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">156</h3>
          <p className="text-sm text-gray-700 font-medium">활성 사용자</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-green-800 font-semibold">+12</span>
            <span className="text-xs text-gray-700 font-medium ml-1">vs 지난주</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
            <span className="text-sm text-gray-800 font-semibold">총 농장</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">24</h3>
          <p className="text-sm text-gray-700 font-medium">등록된 농장</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-green-800 font-semibold">+3</span>
            <span className="text-xs text-gray-700 font-medium ml-1">vs 지난주</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔧</span>
            </div>
            <span className="text-sm text-gray-800 font-semibold">총 디바이스</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">187</h3>
          <p className="text-sm text-gray-700 font-medium">연결된 디바이스</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-green-800 font-semibold">+8</span>
            <span className="text-xs text-gray-700 font-medium ml-1">vs 지난주</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📡</span>
            </div>
            <span className="text-sm text-gray-800 font-semibold">총 센서</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">342</h3>
          <p className="text-sm text-gray-700 font-medium">활성 센서</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-green-800 font-semibold">+15</span>
            <span className="text-xs text-gray-700 font-medium ml-1">vs 지난주</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 데이터 통계</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">1.2M</div>
            <div className="text-sm text-gray-700 font-medium">총 센서 데이터</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">45K</div>
            <div className="text-sm text-gray-700 font-medium">일일 API 호출</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">2.1GB</div>
            <div className="text-sm text-gray-700 font-medium">데이터베이스 크기</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">⚡ 성능 모니터링</h2>
        <p className="text-purple-800 mb-6">
          시스템의 성능 지표를 모니터링하여 최적의 성능을 유지합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🚀 응답 시간</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-800 font-semibold">API 평균 응답</span>
              <span className="text-green-800 font-semibold font-bold">120ms</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-800 font-semibold">데이터베이스 쿼리</span>
              <span className="text-blue-800 font-semibold font-bold">45ms</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-800 font-semibold">파일 업로드</span>
              <span className="text-purple-800 font-semibold font-bold">850ms</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">❌ 에러율</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-800 font-semibold">전체 에러율</span>
              <span className="text-green-800 font-semibold font-bold">0.02%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-800 font-semibold">4xx 에러</span>
              <span className="text-yellow-800 font-semibold font-bold">0.01%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-800 font-semibold">5xx 에러</span>
              <span className="text-red-800 font-semibold font-bold">0.01%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 성능 트렌드</h3>
        <div className="h-64 bg-gray-50 rounded-lg p-4">
          <div className="h-full relative">
            {/* 차트 제목 */}
            <div className="text-xs text-gray-700 mb-2 font-semibold">응답 시간 (ms)</div>
            
            {/* Y축 라벨 */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-700 font-medium">
              <span>1000</span>
              <span>800</span>
              <span>600</span>
              <span>400</span>
              <span>200</span>
              <span>0</span>
            </div>
            
            {/* 차트 영역 */}
            <div className="ml-8 mr-4 h-full relative">
              {/* 격자선 */}
              <div className="absolute inset-0">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="absolute w-full border-t border-gray-200" style={{top: `${i * 20}%`}}></div>
                ))}
              </div>
              
              {/* 데이터 라인 */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                {/* API 응답 시간 라인 */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  points="0,180 20,160 40,140 60,120 80,100 100,90 120,85 140,80 160,75 180,70 200,65"
                />
                
                {/* 데이터베이스 쿼리 라인 */}
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  points="0,190 20,185 40,180 60,175 80,170 100,165 120,160 140,155 160,150 180,145 200,140"
                />
                
                {/* 파일 업로드 라인 */}
                <polyline
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  points="0,50 20,60 40,70 60,80 80,90 100,100 120,110 140,120 160,130 180,140 200,150"
                />
                
                {/* 데이터 포인트 */}
                <circle cx="0" cy="180" r="3" fill="#10b981" />
                <circle cx="20" cy="160" r="3" fill="#10b981" />
                <circle cx="40" cy="140" r="3" fill="#10b981" />
                <circle cx="60" cy="120" r="3" fill="#10b981" />
                <circle cx="80" cy="100" r="3" fill="#10b981" />
                <circle cx="100" cy="90" r="3" fill="#10b981" />
                <circle cx="120" cy="85" r="3" fill="#10b981" />
                <circle cx="140" cy="80" r="3" fill="#10b981" />
                <circle cx="160" cy="75" r="3" fill="#10b981" />
                <circle cx="180" cy="70" r="3" fill="#10b981" />
                <circle cx="200" cy="65" r="3" fill="#10b981" />
              </svg>
              
              {/* X축 라벨 */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-700 font-medium">
                <span>00:00</span>
                <span>02:00</span>
                <span>04:00</span>
                <span>06:00</span>
                <span>08:00</span>
                <span>10:00</span>
                <span>12:00</span>
              </div>
            </div>
            
            {/* 범례 */}
            <div className="absolute top-2 right-2 flex space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-0.5 bg-green-500"></div>
                <span className="text-gray-700 font-medium">API 응답</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span className="text-gray-700 font-medium">DB 쿼리</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <span className="text-gray-700 font-medium">파일 업로드</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
        <h2 className="text-2xl font-bold text-orange-900 mb-4">📋 로그 관리</h2>
        <p className="text-orange-800 mb-6">
          시스템 로그를 통해 문제를 추적하고 시스템 동작을 분석할 수 있습니다.
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 로그 검색</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm text-gray-800 font-semibold">로그 레벨</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900">
                <option value="">전체</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-800 font-semibold">기간</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900">
                <option value="1h">최근 1시간</option>
                <option value="24h">최근 24시간</option>
                <option value="7d">최근 7일</option>
                <option value="30d">최근 30일</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-800 font-semibold">키워드</label>
              <input 
                type="text" 
                placeholder="검색어 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-600"
              />
            </div>
          </div>
          
          <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
            검색
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 로그 목록</h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                INFO
              </span>
              <span className="text-sm text-gray-700 font-medium">2024-01-15 14:30:25</span>
            </div>
            <p className="text-sm text-gray-700">
              사용자 로그인: user@example.com (IP: 192.168.1.100)
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                WARN
              </span>
              <span className="text-sm text-gray-700 font-medium">2024-01-15 14:28:10</span>
            </div>
            <p className="text-sm text-gray-700">
              센서 데이터 수신 지연: device_001 (5분 지연)
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                ERROR
              </span>
              <span className="text-sm text-gray-700 font-medium">2024-01-15 14:25:33</span>
            </div>
            <p className="text-sm text-gray-700">
              데이터베이스 연결 실패: Connection timeout after 30s
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'health':
        return renderHealth();
      case 'metrics':
        return renderMetrics();
      case 'performance':
        return renderPerformance();
      case 'logs':
        return renderLogs();
      default:
        return renderOverview();
    }
  };

  // 로딩 중일 때
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        user={user}
        title="시스템 모니터링" 
        subtitle="시스템 상태 및 성능 모니터링 완전 가이드" 
        showBackButton
        backButtonText="사용설명서"
        onBackClick={() => router.push('/help')}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BreadcrumbNavigation 
          items={[
            { label: '대시보드', path: '/' },
            { label: '사용설명서', path: '/help' },
            { label: '시스템 모니터링', isActive: true }
          ]}
          className="mb-6"
        />
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
                        ? 'bg-gray-100 text-gray-900 border border-gray-200'
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
