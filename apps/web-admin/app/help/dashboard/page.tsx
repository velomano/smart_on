'use client';

import React, { useState } from 'react';
import AppHeader from '../../../src/components/AppHeader';

interface TabType {
  id: string;
  label: string;
  icon: string;
}

export default function DashboardGuidePage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabType[] = [
    { id: 'overview', label: '개요', icon: '🏠' },
    { id: 'navigation', label: '네비게이션', icon: '🧭' },
    { id: 'farm-cards', label: '농장 현황', icon: '📊' },
    { id: 'sensor-data', label: '센서 데이터', icon: '📡' },
    { id: 'alerts', label: '알림 시스템', icon: '⚠️' },
    { id: 'mobile', label: '모바일 사용', icon: '📱' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-4">🏠 메인 대시보드 개요</h2>
        <p className="text-green-800 mb-4">
          메인 대시보드는 스마트팜 플랫폼의 중심 허브로, 모든 농장과 디바이스의 상태를 한눈에 확인할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 주요 기능</h3>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">1</div>
              <div>
                <h4 className="font-medium text-gray-900">농장 선택</h4>
                <p className="text-sm text-gray-600">드롭다운에서 관리할 농장 선택</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">2</div>
              <div>
                <h4 className="font-medium text-gray-900">실시간 모니터링</h4>
                <p className="text-sm text-gray-600">센서 데이터와 디바이스 상태 실시간 확인</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">3</div>
              <div>
                <h4 className="font-medium text-gray-900">알림 관리</h4>
                <p className="text-sm text-gray-600">중요한 이벤트와 경고 알림 확인</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 반응형 디자인</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">데스크톱 최적화</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">태블릿 지원</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">모바일 최적화</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">터치 인터페이스</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 자동 새로고침</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">⏱️</div>
            <h4 className="font-medium">30초 간격</h4>
            <p className="text-sm text-gray-600">센서 데이터 자동 업데이트</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🔔</div>
            <h4 className="font-medium">실시간 알림</h4>
            <p className="text-sm text-gray-600">중요 이벤트 즉시 표시</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🔄</div>
            <h4 className="font-medium">수동 새로고침</h4>
            <p className="text-sm text-gray-600">필요시 즉시 업데이트</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNavigation = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">🧭 네비게이션 가이드</h2>
        <p className="text-blue-800 mb-4">
          웹 어드민의 다양한 기능에 쉽게 접근할 수 있는 네비게이션 시스템입니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏠 상단 헤더</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🏠</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">홈 아이콘</h4>
                <p className="text-sm text-gray-600">대시보드로 이동</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-xl">📚</div>
              <div>
                <h4 className="font-medium text-gray-900">사용설명서</h4>
                <p className="text-sm text-gray-600">도움말 및 가이드</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-xl">☰</div>
              <div>
                <h4 className="font-medium text-gray-900">햄버거 메뉴</h4>
                <p className="text-sm text-gray-600">전체 메뉴 열기</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 햄버거 메뉴</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-cyan-50 rounded">
              <span className="text-sm font-medium text-cyan-900">📚 사용설명서</span>
              <span className="text-xs text-cyan-600">최상단</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
              <span className="text-sm font-medium text-yellow-900">⚙️ 알림설정</span>
              <span className="text-xs text-yellow-600">알림 관리</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-50 rounded">
              <span className="text-sm font-medium text-red-900">👨‍💼 관리자 페이지</span>
              <span className="text-xs text-red-600">관리자만</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
              <span className="text-sm font-medium text-purple-900">👥 사용자 관리</span>
              <span className="text-xs text-purple-600">팀 관리</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-sm font-medium text-green-900">🏢 농장 관리</span>
              <span className="text-xs text-green-600">농장 운영</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 빠른 접근 팁</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">⌨️ 키보드 단축키</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">F5</kbd> - 페이지 새로고침</li>
              <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl + R</kbd> - 강제 새로고침</li>
              <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> - 메뉴 닫기</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">👆 터치 제스처</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• <span className="font-medium">탭</span> - 메뉴 열기/선택</li>
              <li>• <span className="font-medium">스와이프</span> - 메뉴 닫기</li>
              <li>• <span className="font-medium">드래그</span> - 스크롤</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFarmCards = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">📊 농장 현황 카드</h2>
        <p className="text-purple-800 mb-4">
          농장의 전체적인 상태와 주요 지표를 한눈에 확인할 수 있는 정보 카드들입니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 통계 카드</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🏢</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">전체 농장</h4>
                  <p className="text-xs text-gray-600">등록된 농장 수</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">3</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔧</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">활성 디바이스</h4>
                  <p className="text-xs text-gray-600">연결된 디바이스</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">12</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📡</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">센서</h4>
                  <p className="text-xs text-gray-600">활성 센서 수</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-600">24</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 상태 표시</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">시스템 정상 운영 중</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">MQTT 브리지 연결됨</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">데이터베이스 정상</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">자동 새로고침 활성</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 카드 활용법</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">👀</div>
            <h4 className="font-medium">빠른 확인</h4>
            <p className="text-sm text-gray-600">전체 농장 상태 한눈에 파악</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🔍</div>
            <h4 className="font-medium">문제 탐지</h4>
            <p className="text-sm text-gray-600">비정상 상태 즉시 확인</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="font-medium">트렌드 파악</h4>
            <p className="text-sm text-gray-600">시간별 변화 추이 확인</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSensorData = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
        <h2 className="text-2xl font-bold text-orange-900 mb-4">📡 센서 데이터 모니터링</h2>
        <p className="text-orange-800 mb-4">
          실시간 센서 데이터를 모니터링하고 디바이스 상태를 확인할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🌡️ 센서 타입</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🌡️</div>
                <div>
                  <h4 className="font-medium text-gray-900">온도 센서</h4>
                  <p className="text-xs text-gray-600">실내 온도 모니터링</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">25.3°C</div>
                <div className="text-xs text-gray-500">정상</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">💧</div>
                <div>
                  <h4 className="font-medium text-gray-900">습도 센서</h4>
                  <p className="text-xs text-gray-600">공기 습도 측정</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">65%</div>
                <div className="text-xs text-gray-500">정상</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">⚡</div>
                <div>
                  <h4 className="font-medium text-gray-900">EC 센서</h4>
                  <p className="text-xs text-gray-600">배양액 전기전도도</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">1.8 mS/cm</div>
                <div className="text-xs text-gray-500">정상</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎛️ 액추에이터</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">💧</div>
                <div>
                  <h4 className="font-medium text-gray-900">펌프</h4>
                  <p className="text-xs text-gray-600">급수 시스템</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">대기중</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="font-medium text-gray-900">LED</h4>
                  <p className="text-xs text-gray-600">조명 시스템</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-yellow-600">작동중</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🌀</div>
                <div>
                  <h4 className="font-medium text-gray-900">팬</h4>
                  <p className="text-xs text-gray-600">환기 시스템</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-600">정상</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 데이터 해석</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl mb-2">🔴</div>
            <h4 className="font-medium text-red-800">연결 끊김</h4>
            <p className="text-xs text-red-600">센서 연결 없음</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl mb-2">🟡</div>
            <h4 className="font-medium text-yellow-800">낮음</h4>
            <p className="text-xs text-yellow-600">임계값 미만</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl mb-2">🟢</div>
            <h4 className="font-medium text-green-800">정상</h4>
            <p className="text-xs text-green-600">정상 범위</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl mb-2">🔴</div>
            <h4 className="font-medium text-red-800">높음</h4>
            <p className="text-xs text-red-600">임계값 초과</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
        <h2 className="text-2xl font-bold text-red-900 mb-4">⚠️ 알림 시스템</h2>
        <p className="text-red-800 mb-4">
          중요한 이벤트와 경고사항을 실시간으로 알려주는 스마트 알림 시스템입니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 알림 타입</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <div className="text-2xl">🚨</div>
              <div>
                <h4 className="font-medium text-red-900">긴급 알림</h4>
                <p className="text-sm text-red-700">시스템 오류, 연결 끊김 등</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl">⚠️</div>
              <div>
                <h4 className="font-medium text-yellow-900">경고 알림</h4>
                <p className="text-sm text-yellow-700">임계값 초과, 성능 저하 등</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl">ℹ️</div>
              <div>
                <h4 className="font-medium text-blue-900">정보 알림</h4>
                <p className="text-sm text-blue-700">일반적인 상태 변화</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 알림 배지</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <span className="text-sm text-gray-700">농장 A</span>
              </div>
              <span className="text-xs text-red-600">센서 오류</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <span className="text-sm text-gray-700">농장 B</span>
              </div>
              <span className="text-xs text-yellow-600">임계값 초과</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">0</span>
                </div>
                <span className="text-sm text-gray-700">농장 C</span>
              </div>
              <span className="text-xs text-green-600">정상</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 알림 설정</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🔔</div>
            <h4 className="font-medium">알림 수신</h4>
            <p className="text-sm text-gray-600">실시간 알림 받기</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">📧</div>
            <h4 className="font-medium">이메일 알림</h4>
            <p className="text-sm text-gray-600">중요 알림 이메일 전송</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">📱</div>
            <h4 className="font-medium">모바일 푸시</h4>
            <p className="text-sm text-gray-600">모바일 앱 알림</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMobile = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border border-cyan-200">
        <h2 className="text-2xl font-bold text-cyan-900 mb-4">📱 모바일 사용 가이드</h2>
        <p className="text-cyan-800 mb-4">
          모바일 기기에서도 완벽하게 작동하는 반응형 대시보드 사용법입니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 모바일 최적화</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">터치 인터페이스</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">반응형 레이아웃</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">스와이프 제스처</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">빠른 로딩</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👆 터치 제스처</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">👆</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">탭</h4>
                <p className="text-xs text-gray-600">메뉴 열기, 버튼 클릭</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">👆👆</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">더블탭</h4>
                <p className="text-xs text-gray-600">빠른 새로고침</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">👈</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">스와이프</h4>
                <p className="text-xs text-gray-600">메뉴 닫기, 뒤로가기</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 모바일 팁</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔋 배터리 최적화</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• 자동 새로고침 간격 조정</li>
              <li>• 백그라운드 새로고침 제한</li>
              <li>• 푸시 알림 최적화</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">📶 네트워크 최적화</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• 데이터 사용량 최적화</li>
              <li>• 오프라인 캐싱</li>
              <li>• 연결 상태 표시</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'navigation':
        return renderNavigation();
      case 'farm-cards':
        return renderFarmCards();
      case 'sensor-data':
        return renderSensorData();
      case 'alerts':
        return renderAlerts();
      case 'mobile':
        return renderMobile();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="대시보드 가이드" subtitle="메인 대시보드 완전 사용법" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
