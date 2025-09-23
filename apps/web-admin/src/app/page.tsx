import React from 'react';

export default function WebAdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🌱 스마트팜 관리자 대시보드
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">관리자</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">🏠</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 농장 수
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">3</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">🌱</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 베드 수
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">6</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">👥</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      활성 팀 수
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">3</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📊</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      평균 온도
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">24.5°C</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Farm Overview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              농장 현황
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Team 1 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">팀 1</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>베드 1</span>
                    <span className="text-green-600">정상</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>베드 2</span>
                    <span className="text-green-600">정상</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    토마토, 상추, 오이
                  </div>
                </div>
              </div>

              {/* Team 2 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">팀 2</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>베드 3</span>
                    <span className="text-green-600">정상</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>베드 4</span>
                    <span className="text-yellow-600">주의</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    파프리카, 바질, 케일
                  </div>
                </div>
              </div>

              {/* Team 3 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">팀 3</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>베드 5</span>
                    <span className="text-green-600">정상</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>베드 6</span>
                    <span className="text-green-600">정상</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    딸기, 허브, 미나리
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              최근 활동
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="text-green-500 mr-3">✅</div>
                <span>팀 1 - 베드 1 온도 정상화 (25.2°C)</span>
                <span className="ml-auto text-gray-500">5분 전</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="text-blue-500 mr-3">💡</div>
                <span>팀 2 - 베드 4 조명 자동 켜짐</span>
                <span className="ml-auto text-gray-500">12분 전</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="text-yellow-500 mr-3">⚠️</div>
                <span>팀 2 - 베드 4 습도 임계치 경고 (85%)</span>
                <span className="ml-auto text-gray-500">18분 전</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}