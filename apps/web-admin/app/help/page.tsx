'use client';

import React, { useState, useEffect } from 'react';
import AppHeader from '../../src/components/AppHeader';
import BreadcrumbNavigation from '../../src/components/BreadcrumbNavigation';
import { getCurrentUser } from '../../src/lib/auth';
import { AuthUser } from '../../src/lib/auth';

interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  content: React.ReactNode;
}

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('🔍 사용설명서 페이지 - 사용자 정보:', currentUser);
        if (currentUser) {
          setUser(currentUser);
        } else {
          // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
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

  const sections: HelpSection[] = [
    {
      id: 'overview',
      title: '시스템 개요',
      description: '스마트팜 플랫폼 전체 구조와 주요 기능',
      icon: '🏠',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-xl font-bold text-blue-900 mb-4">🏗️ 전체 아키텍처</h3>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex flex-wrap items-center justify-center space-x-4 space-y-2">
                <div className="bg-green-100 px-3 py-2 rounded-lg text-sm font-semibold text-green-800">디바이스/센서</div>
                <div className="text-gray-700 font-bold text-lg">→</div>
                <div className="bg-blue-100 px-3 py-2 rounded-lg text-sm font-semibold text-blue-800">MQTT 브로커</div>
                <div className="text-gray-700 font-bold text-lg">→</div>
                <div className="bg-purple-100 px-3 py-2 rounded-lg text-sm font-semibold text-purple-800">스마트팜 브리지</div>
                <div className="text-gray-700 font-bold text-lg">→</div>
                <div className="bg-orange-100 px-3 py-2 rounded-lg text-sm font-semibold text-orange-800">웹 대시보드</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">📊 주요 기능</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>실시간 센서 모니터링</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>디바이스 원격 제어</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>농장 관리 시스템</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>배양액 조제 가이드</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>시스템 모니터링</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">👥 사용자 역할</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><strong>super_admin:</strong> 시스템 전체 관리</li>
                <li><strong>system_admin:</strong> 시스템 모니터링 및 관리</li>
                <li><strong>team_leader:</strong> 팀 및 농장 관리</li>
                <li><strong>team_member:</strong> 농장 조회 및 기본 기능</li>
              </ul>
              <div className="mt-4">
                <a href="/help/system-overview#roles" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  상세 가이드 보기 →
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: '대시보드',
      description: '메인 대시보드 사용법 및 기능',
      icon: '📊',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-green-900">🏠 메인 대시보드</h3>
                <p className="text-green-800">로그인 후 첫 화면에서 농장 현황과 센서 데이터를 한눈에 확인할 수 있습니다.</p>
              </div>
              <a href="/help/dashboard" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                상세 가이드 보기 →
              </a>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <h4 className="font-semibold text-green-900 mb-2">📈 농장 현황 카드</h4>
                <ul className="text-sm text-green-800 font-medium space-y-1">
                  <li>• 전체 농장 수</li>
                  <li>• 활성 디바이스 수</li>
                  <li>• 연결된 센서 수</li>
                  <li>• 최근 센서 데이터</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <h4 className="font-semibold text-green-900 mb-2">⚠️ 알림 배지</h4>
                <ul className="text-sm text-green-800 font-medium space-y-1">
                  <li>• 센서 연결 상태</li>
                  <li>• 임계값 초과 알림</li>
                  <li>• 시스템 오류 알림</li>
                  <li>• 농장별 상태 요약</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">🎯 주요 기능</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🔍</div>
                <h5 className="font-medium">농장 선택</h5>
                <p className="text-sm text-gray-600">상단 드롭다운에서 관리할 농장을 선택</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">📱</div>
                <h5 className="font-medium">반응형 디자인</h5>
                <p className="text-sm text-gray-600">모바일과 데스크톱에서 최적화된 화면</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🔄</div>
                <h5 className="font-medium">실시간 업데이트</h5>
                <p className="text-sm text-gray-600">센서 데이터 자동 새로고침</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'farms',
      title: '농장 관리',
      description: '농장 생성, 설정, MQTT 연동 방법',
      icon: '🏢',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-xl font-bold text-purple-900 mb-4">🏢 농장 관리</h3>
            <p className="text-purple-800 mb-4">농장을 생성하고 설정하여 IoT 디바이스들을 관리할 수 있습니다.</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-2">➕ 농장 생성</h4>
                <ol className="text-sm text-purple-800 font-medium space-y-1">
                  <li>1. 관리자 페이지 → 농장 관리</li>
                  <li>2. "새 농장 추가" 버튼 클릭</li>
                  <li>3. 농장명, 위치, 설명 입력</li>
                  <li>4. MQTT 브로커 설정</li>
                </ol>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-2">⚙️ MQTT 설정</h4>
                <ol className="text-sm text-purple-800 font-medium space-y-1">
                  <li>1. 브로커 URL 및 포트 설정</li>
                  <li>2. 인증 정보 입력</li>
                  <li>3. 토픽 구조 확인</li>
                  <li>4. 연결 테스트 실행</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">🔧 농장 설정</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                <div>
                  <h5 className="font-medium text-gray-900">기본 정보</h5>
                  <p className="text-sm text-gray-600">농장명, 위치, 연락처 등 기본 정보 입력</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
                <div>
                  <h5 className="font-medium text-gray-900">MQTT 브로커 설정</h5>
                  <p className="text-sm text-gray-600">브로커 URL, 포트, 인증 정보 설정</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">3</div>
                <div>
                  <h5 className="font-medium text-gray-900">디바이스 등록</h5>
                  <p className="text-sm text-gray-600">센서, 액추에이터 등 디바이스 등록</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">4</div>
                <div>
                  <h5 className="font-medium text-gray-900">연결 테스트</h5>
                  <p className="text-sm text-gray-600">MQTT 브로커와의 연결 상태 확인</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <a href="/help/farm-management" className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                상세 가이드 보기 →
              </a>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'devices',
      title: '디바이스 관리',
      description: '센서, 액추에이터 등 디바이스 관리 방법',
      icon: '🔧',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
            <h3 className="text-xl font-bold text-orange-900 mb-4">🔧 디바이스 관리</h3>
            <p className="text-orange-800 mb-4">농장의 센서와 액추에이터를 관리하고 제어할 수 있습니다.</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-orange-100">
                <h4 className="font-semibold text-orange-900 mb-2">📡 센서 관리</h4>
                <ul className="text-sm text-orange-800 font-medium space-y-1">
                  <li>• 온도/습도 센서</li>
                  <li>• EC/pH 센서</li>
                  <li>• 수위 센서</li>
                  <li>• 조도 센서</li>
                  <li>• 실시간 데이터 모니터링</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-orange-100">
                <h4 className="font-semibold text-orange-900 mb-2">🎛️ 액추에이터 제어</h4>
                <ul className="text-sm text-orange-800 font-medium space-y-1">
                  <li>• 펌프 제어</li>
                  <li>• 밸브 제어</li>
                  <li>• LED 제어</li>
                  <li>• 팬 제어</li>
                  <li>• 원격 제어 명령</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">📊 센서 상태 표시</h4>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl mb-2">🔴</div>
                <h5 className="font-medium text-red-800">연결 끊김</h5>
                <p className="text-xs text-red-600">센서 연결 없음</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl mb-2">🟡</div>
                <h5 className="font-medium text-yellow-800">낮음</h5>
                <p className="text-xs text-yellow-600">임계값 미만</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl mb-2">🟢</div>
                <h5 className="font-medium text-green-800">정상</h5>
                <p className="text-xs text-green-600">정상 범위</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl mb-2">🔴</div>
                <h5 className="font-medium text-red-800">높음</h5>
                <p className="text-xs text-red-600">임계값 초과</p>
              </div>
            </div>
            
            <div className="mt-6">
              <a href="/help/device-management" className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
                상세 가이드 보기 →
              </a>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'nutrients',
      title: '배양액 조제',
      description: '배양액 조제 가이드 및 레시피 관리',
      icon: '🧪',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border border-cyan-200">
            <h3 className="text-xl font-bold text-cyan-900 mb-4">🧪 배양액 조제</h3>
            <p className="text-cyan-800 mb-4">작물별 맞춤형 배양액 레시피를 찾고 조제할 수 있습니다.</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-cyan-100">
                <h4 className="font-semibold text-cyan-900 mb-2">🔍 레시피 검색</h4>
                <ul className="text-sm text-cyan-800 font-medium space-y-1">
                  <li>• 작물명으로 검색</li>
                  <li>• 생육 단계별 필터</li>
                  <li>• 출처별 분류</li>
                  <li>• 상세 정보 확인</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-cyan-100">
                <h4 className="font-semibold text-cyan-900 mb-2">📋 조제 가이드</h4>
                <ul className="text-sm text-cyan-800 font-medium space-y-1">
                  <li>• 단계별 조제 방법</li>
                  <li>• 주의사항 안내</li>
                  <li>• 품질 관리</li>
                  <li>• 저장 방법</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">🎯 주요 기능</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                <div>
                  <h5 className="font-medium text-gray-900">레시피 검색</h5>
                  <p className="text-sm text-gray-600">작물명, 생육 단계, 출처별로 배양액 레시피 검색</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
                <div>
                  <h5 className="font-medium text-gray-900">상세 정보 확인</h5>
                  <p className="text-sm text-gray-600">EC, pH, 영양소 함량 등 상세 정보 확인</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">3</div>
                <div>
                  <h5 className="font-medium text-gray-900">조제 가이드</h5>
                  <p className="text-sm text-gray-600">단계별 조제 방법과 주의사항 안내</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">4</div>
                <div>
                  <h5 className="font-medium text-gray-900">최신 업데이트</h5>
                  <p className="text-sm text-gray-600">최신 레시피 업데이트 정보 확인</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <a href="/help/nutrient-guide" className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors">
                상세 가이드 보기 →
              </a>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'mqtt',
      title: 'MQTT 연동',
      description: 'MQTT 브로커 설정 및 디바이스 연동 가이드',
      icon: '📡',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-indigo-900">📡 MQTT 연동 가이드</h3>
                <p className="text-indigo-800">MQTT 브로커를 설정하고 디바이스를 연동하는 완전한 가이드입니다.</p>
              </div>
              <a href="/help/mqtt" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                상세 가이드 보기 →
              </a>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-indigo-100 mb-4">
              <h4 className="font-semibold text-indigo-900 mb-2">🏗️ 아키텍처</h4>
              <div className="flex flex-wrap items-center justify-center space-x-2 space-y-1">
                <div className="bg-green-100 px-2 py-1 rounded text-xs font-semibold text-green-800">디바이스</div>
                <span className="text-gray-700 font-bold">→</span>
                <div className="bg-blue-100 px-2 py-1 rounded text-xs font-semibold text-blue-800">MQTT 브로커</div>
                <span className="text-gray-700 font-bold">→</span>
                <div className="bg-purple-100 px-2 py-1 rounded text-xs font-semibold text-purple-800">스마트팜 브리지</div>
                <span className="text-gray-700 font-bold">→</span>
                <div className="bg-orange-100 px-2 py-1 rounded text-xs font-semibold text-orange-800">웹 대시보드</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">🔧 브로커 설정</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">1</div>
                  <div>
                    <h5 className="font-medium text-gray-900">브로커 선택</h5>
                    <p className="text-sm text-gray-600">Mosquitto, EMQX, AWS IoT Core</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">2</div>
                  <div>
                    <h5 className="font-medium text-gray-900">설정 적용</h5>
                    <p className="text-sm text-gray-600">보안, 토픽, 권한 설정</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">3</div>
                  <div>
                    <h5 className="font-medium text-gray-900">연결 테스트</h5>
                    <p className="text-sm text-gray-600">MQTT 클라이언트로 테스트</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">💻 디바이스 연동</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">1</div>
                  <div>
                    <h5 className="font-medium text-gray-900">템플릿 다운로드</h5>
                    <p className="text-sm text-gray-600">Arduino, Python, Node.js</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">2</div>
                  <div>
                    <h5 className="font-medium text-gray-900">설정 수정</h5>
                    <p className="text-sm text-gray-600">브로커 정보 입력</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">3</div>
                  <div>
                    <h5 className="font-medium text-gray-900">실행 및 테스트</h5>
                    <p className="text-sm text-gray-600">디바이스 실행 후 연동 확인</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">📋 토픽 구조</h4>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <div className="text-gray-600 mb-2">표준 토픽 패턴:</div>
              <div className="text-blue-600">farms/{'{farm_id}'}/devices/{'{device_id}'}/{'{message_type}'}</div>
              
              <div className="mt-4 text-gray-600">메시지 타입:</div>
              <ul className="mt-2 space-y-1 text-gray-700">
                <li>• <span className="text-green-600">registry</span> - 디바이스 등록 정보</li>
                <li>• <span className="text-blue-600">state</span> - 디바이스 상태</li>
                <li>• <span className="text-purple-600">telemetry</span> - 센서 데이터</li>
                <li>• <span className="text-orange-600">command</span> - 제어 명령</li>
                <li>• <span className="text-red-600">command/ack</span> - 명령 확인 응답</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <h4 className="text-lg font-semibold text-green-900 mb-3">📚 MQTT 상세 가이드</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <a href="/help/mqtt" className="block bg-white rounded-lg p-4 border border-green-100 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">📖</div>
                <h5 className="font-medium text-green-900">MQTT 연동 가이드</h5>
                <p className="text-sm text-green-800 font-medium">전체 MQTT 연동 방법</p>
              </a>
              
              <a href="/help/mqtt?tab=broker-setup" className="block bg-white rounded-lg p-4 border border-green-100 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">🔧</div>
                <h5 className="font-medium text-green-900">브로커 설정</h5>
                <p className="text-sm text-green-800 font-medium">MQTT 브로커 설정 방법</p>
              </a>
              
              <a href="/help/mqtt?tab=device-integration" className="block bg-white rounded-lg p-4 border border-green-100 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">💻</div>
                <h5 className="font-medium text-green-900">디바이스 연동</h5>
                <p className="text-sm text-green-800 font-medium">디바이스 연동 코드</p>
              </a>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'admin',
      title: '관리자 기능',
      description: '사용자 관리, 권한 설정, 시스템 관리',
      icon: '👨‍💼',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
            <h3 className="text-xl font-bold text-red-900 mb-4">👨‍💼 관리자 기능</h3>
            <p className="text-red-800 mb-4">시스템 관리자만 접근 가능한 고급 관리 기능들입니다.</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-red-100">
                <h4 className="font-semibold text-red-900 mb-2">👥 사용자 관리</h4>
                <ul className="text-sm text-red-800 font-medium space-y-1">
                  <li>• 사용자 승인/거부</li>
                  <li>• 역할 및 권한 설정</li>
                  <li>• 팀 관리</li>
                  <li>• 사용자 정보 수정</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-red-100">
                <h4 className="font-semibold text-red-900 mb-2">🏢 농장 관리</h4>
                <ul className="text-sm text-red-800 font-medium space-y-1">
                  <li>• 농장 생성/삭제</li>
                  <li>• 농장별 사용자 배정</li>
                  <li>• MQTT 설정 관리</li>
                  <li>• 농장별 통계</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">🔐 권한 체계</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">사용자 역할</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-800">super_admin</span>
                    <span className="text-xs text-gray-700 font-medium">시스템 전체 관리</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-800">system_admin</span>
                    <span className="text-xs text-gray-700 font-medium">시스템 모니터링</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-800">team_leader</span>
                    <span className="text-xs text-gray-700 font-medium">팀 및 농장 관리</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-800">team_member</span>
                    <span className="text-xs text-gray-700 font-medium">농장 조회</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">접근 권한</h5>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-800">관리자 페이지</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-800">농장 관리</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-800">시스템 모니터링</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-800">사용자 관리</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <a href="/help/admin-features" className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                상세 가이드 보기 →
              </a>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'system',
      title: '시스템 모니터링',
      description: '시스템 상태, 성능 메트릭, 로그 관리',
      icon: '📊',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📊 시스템 모니터링</h3>
            <p className="text-gray-700 mb-4">시스템 상태, 성능 메트릭, 로그 등을 실시간으로 모니터링할 수 있습니다.</p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">🏥 헬스 체크</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 데이터베이스 연결</li>
                  <li>• 서비스 상태</li>
                  <li>• 응답 시간</li>
                  <li>• 가동 시간</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">📈 메트릭</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 사용자 수</li>
                  <li>• 농장/디바이스 수</li>
                  <li>• 센서 데이터 수</li>
                  <li>• 성능 지표</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">⚡ 성능</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 메모리 사용률</li>
                  <li>• CPU 사용률</li>
                  <li>• 에러율</li>
                  <li>• 응답 시간</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">🔍 모니터링 기능</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">1</div>
                <div>
                  <h5 className="font-medium text-gray-900">실시간 상태 확인</h5>
                  <p className="text-sm text-gray-600">시스템 헬스 체크와 서비스 상태를 실시간으로 확인</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">2</div>
                <div>
                  <h5 className="font-medium text-gray-900">성능 메트릭</h5>
                  <p className="text-sm text-gray-600">시스템 리소스 사용률과 성능 지표 모니터링</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">3</div>
                <div>
                  <h5 className="font-medium text-gray-900">자동 새로고침</h5>
                  <p className="text-sm text-gray-600">30초마다 데이터 자동 업데이트</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">4</div>
                <div>
                  <h5 className="font-medium text-gray-900">에러 처리</h5>
                  <p className="text-sm text-gray-600">상세한 에러 메시지와 재시도 기능</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <a href="/help/system-monitoring" className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
                상세 가이드 보기 →
              </a>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentSection = sections.find(s => s.id === activeSection);

  // 로딩 상태
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  // 사용자가 없으면 null 반환 (리다이렉트 처리됨)
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        user={user || undefined}
        title="사용설명서" 
        subtitle="스마트팜 플랫폼 완전 가이드" 
        showBackButton
        backButtonText="대시보드"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BreadcrumbNavigation 
          items={[
            { label: '대시보드', path: '/' },
            { label: '사용설명서', isActive: true }
          ]}
          className="mb-6"
        />
        <div className="grid lg:grid-cols-4 gap-8">
          {/* 사이드바 네비게이션 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 목차</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{section.icon}</span>
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs text-gray-700 font-medium">{section.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {currentSection && (
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <span className="text-3xl">{currentSection.icon}</span>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{currentSection.title}</h1>
                      <p className="text-gray-600">{currentSection.description}</p>
                    </div>
                  </div>
                  
                  <div className="prose prose-gray max-w-none">
                    {currentSection.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
