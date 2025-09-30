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

export default function SystemOverviewPage() {
  const [activeTab, setActiveTab] = useState('roles');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('🔍 시스템 개요 페이지 - 사용자 정보:', currentUser);
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
    { id: 'architecture', label: '시스템 아키텍처', icon: '🏗️' },
    { id: 'features', label: '주요 기능', icon: '⚡' },
    { id: 'roles', label: '사용자 역할', icon: '👥' },
    { id: 'workflow', label: '데이터 흐름', icon: '🔄' },
  ];

  const renderArchitecture = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">🏗️ 시스템 아키텍처</h2>
        <p className="text-blue-800 mb-6">
          스마트팜 플랫폼은 IoT 디바이스부터 웹 대시보드까지 통합된 시스템입니다.
        </p>
        
        <div className="bg-white rounded-lg p-6 border border-blue-100">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🌱</span>
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">디바이스/센서</h3>
                  <p className="text-sm text-green-800 font-medium">라즈베리파이, Arduino, ESP32 등</p>
                </div>
              </div>
              <div className="text-green-800 font-bold text-lg">→</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">MQTT 브로커</h3>
                  <p className="text-sm text-blue-800 font-medium">Mosquitto, EMQX, AWS IoT Core</p>
                </div>
              </div>
              <div className="text-blue-800 font-bold text-lg">→</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🌉</span>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">스마트팜 브리지</h3>
                  <p className="text-sm text-purple-800 font-medium">MQTT ↔ Supabase 연동</p>
                </div>
              </div>
              <div className="text-purple-800 font-bold text-lg">→</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💾</span>
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Supabase</h3>
                  <p className="text-sm text-orange-800 font-medium">PostgreSQL 데이터베이스</p>
                </div>
              </div>
              <div className="text-orange-800 font-bold text-lg">→</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💻</span>
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">웹 대시보드</h3>
                  <p className="text-sm text-red-800 font-medium">Next.js 기반 관리 시스템</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 기술 스택</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-800">프론트엔드</span>
              <span className="text-sm text-gray-700 font-medium">Next.js, React, TypeScript</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-800">백엔드</span>
              <span className="text-sm text-gray-700 font-medium">Next.js API Routes</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-800">데이터베이스</span>
              <span className="text-sm text-gray-700 font-medium">Supabase (PostgreSQL)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-800">MQTT</span>
              <span className="text-sm text-gray-700 font-medium">MQTT.js, Node.js</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-800">스타일링</span>
              <span className="text-sm text-gray-700 font-medium">Tailwind CSS</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 배포 환경</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-800">웹 호스팅</span>
              <span className="text-sm text-gray-700 font-medium">Vercel</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-800">데이터베이스</span>
              <span className="text-sm text-gray-700 font-medium">Supabase Cloud</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-800">MQTT 브리지</span>
              <span className="text-sm text-gray-700 font-medium">독립 서버</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-800">CI/CD</span>
              <span className="text-sm text-gray-700 font-medium">GitHub Actions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-4">⚡ 주요 기능</h2>
        <p className="text-green-800 mb-6">
          스마트팜 운영에 필요한 모든 기능을 통합적으로 제공합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 실시간 모니터링</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>센서 데이터 실시간 수집</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>시각적 데이터 표시</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>임계값 기반 알림</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>히스토리 데이터 조회</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎛️ 디바이스 제어</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>원격 펌프/밸브 제어</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>LED 조명 제어</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>팬 제어</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>스케줄 기반 자동화</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 농장 관리</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>다중 농장 지원</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>사용자별 권한 관리</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>MQTT 브로커 설정</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>농장별 통계</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 배양액 관리</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>작물별 레시피 검색</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>EC/pH 목표값 설정</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>영양소 조제 가이드</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>최신 레시피 업데이트</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderRoles = () => (
    <div className="space-y-6" id="roles">
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">👥 사용자 역할</h2>
        <p className="text-purple-800 mb-6">
          역할 기반 접근 제어로 보안과 효율성을 동시에 확보합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👑</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Super Admin</h3>
              <p className="text-sm text-gray-600">최고 관리자</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 mb-4">
            <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>모든 시스템 기능 접근</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>사용자 관리 및 권한 설정</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>시스템 설정 변경</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>데이터베이스 관리</li>
          </ul>
          <button
            onClick={() => window.open('/help/admin-features', '_blank')}
            className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            상세설정 가이드 보기
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">System Admin</h3>
              <p className="text-sm text-gray-600">시스템 관리자</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 mb-4">
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>시스템 모니터링</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>성능 메트릭 조회</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>로그 관리</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>시스템 상태 확인</li>
          </ul>
          <button
            onClick={() => window.open('/system', '_blank')}
            className="w-full px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            상세설정 가이드 보기
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍💼</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Team Leader</h3>
              <p className="text-sm text-gray-600">팀 리더</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 mb-4">
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>농장 생성 및 관리</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>팀원 관리</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>디바이스 설정</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>농장별 통계 조회</li>
          </ul>
          <button
            onClick={() => window.open('/team', '_blank')}
            className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            상세설정 가이드 보기
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Team Member</h3>
              <p className="text-sm text-gray-600">팀 멤버</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 mb-4">
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>농장 데이터 조회</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>센서 데이터 모니터링</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>배양액 레시피 조회</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>기본 디바이스 제어</li>
          </ul>
          <button
            onClick={() => window.open('/', '_blank')}
            className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            상세설정 가이드 보기
          </button>
        </div>
      </div>
    </div>
  );

  const renderWorkflow = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border border-cyan-200">
        <h2 className="text-2xl font-bold text-cyan-900 mb-4">🔄 데이터 흐름</h2>
        <p className="text-cyan-800 mb-6">
          센서 데이터가 수집되어 웹 대시보드까지 전달되는 전체 과정입니다.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 데이터 수집 흐름</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">센서 데이터 측정</h4>
                <p className="text-sm text-gray-600">IoT 디바이스에서 온도, 습도, EC, pH 등 측정</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">MQTT 메시지 발행</h4>
                <p className="text-sm text-gray-600">센서 데이터를 MQTT 브로커로 전송 (JSON 형식)</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">브리지 처리</h4>
                <p className="text-sm text-gray-600">MQTT 브리지가 센서 데이터를 구독하고 Supabase에 저장</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">데이터베이스 저장</h4>
                <p className="text-sm text-gray-600">Supabase PostgreSQL에 센서 데이터 저장</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">5</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">웹 대시보드 표시</h4>
                <p className="text-sm text-gray-600">실시간으로 웹 대시보드에 데이터 표시</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎛️ 명령 제어 흐름</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">웹 대시보드 명령</h4>
                <p className="text-sm text-gray-600">사용자가 웹 대시보드에서 디바이스 제어 명령 입력</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">명령 데이터베이스 저장</h4>
                <p className="text-sm text-gray-600">Supabase commands 테이블에 명령 정보 저장</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">MQTT 브리지 처리</h4>
                <p className="text-sm text-gray-600">MQTT 브리지가 명령을 브로커로 발행하여 디바이스에 전달</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">디바이스 명령 수신</h4>
                <p className="text-sm text-gray-600">IoT 디바이스가 MQTT 브로커에서 명령 구독</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">5</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">디바이스 제어 실행</h4>
                <p className="text-sm text-gray-600">펌프, LED, 팬 등 액추에이터 제어 실행</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">6</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">실행 결과 응답</h4>
                <p className="text-sm text-gray-600">디바이스가 실행 결과를 ACK 메시지로 브리지에 전송</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'architecture':
        return renderArchitecture();
      case 'features':
        return renderFeatures();
      case 'roles':
        return renderRoles();
      case 'workflow':
        return renderWorkflow();
      default:
        return renderArchitecture();
    }
  };

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
        title="시스템 개요" 
        subtitle="스마트팜 플랫폼 아키텍처 및 구조" 
        showBackButton
        backButtonText="사용설명서"
        onBackClick={() => router.push('/help')}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BreadcrumbNavigation 
          items={[
            { label: '대시보드', path: '/' },
            { label: '사용설명서', path: '/help' },
            { label: '시스템 개요', isActive: true }
          ]}
          className="mb-6"
        />
        <div className="grid lg:grid-cols-4 gap-2 sm:gap-3">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">목차</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
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
              <div className="p-2 sm:p-3">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
