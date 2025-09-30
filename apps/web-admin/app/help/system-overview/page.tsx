'use client';

import React, { useState } from 'react';
import AppHeader from '../../../src/components/AppHeader';

interface TabType {
  id: string;
  label: string;
  icon: string;
}

export default function SystemOverviewPage() {
  const [activeTab, setActiveTab] = useState('architecture');

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
                  <p className="text-sm text-green-700">라즈베리파이, Arduino, ESP32 등</p>
                </div>
              </div>
              <div className="text-green-600">→</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">MQTT 브로커</h3>
                  <p className="text-sm text-blue-700">Mosquitto, EMQX, AWS IoT Core</p>
                </div>
              </div>
              <div className="text-blue-600">→</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🌉</span>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">스마트팜 브리지</h3>
                  <p className="text-sm text-purple-700">MQTT ↔ Supabase 연동</p>
                </div>
              </div>
              <div className="text-purple-600">→</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💾</span>
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Supabase</h3>
                  <p className="text-sm text-orange-700">PostgreSQL 데이터베이스</p>
                </div>
              </div>
              <div className="text-orange-600">→</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💻</span>
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">웹 대시보드</h3>
                  <p className="text-sm text-red-700">Next.js 기반 관리 시스템</p>
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
              <span className="font-medium">프론트엔드</span>
              <span className="text-sm text-gray-600">Next.js, React, TypeScript</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">백엔드</span>
              <span className="text-sm text-gray-600">Next.js API Routes</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">데이터베이스</span>
              <span className="text-sm text-gray-600">Supabase (PostgreSQL)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">MQTT</span>
              <span className="text-sm text-gray-600">MQTT.js, Node.js</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">스타일링</span>
              <span className="text-sm text-gray-600">Tailwind CSS</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 배포 환경</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">웹 호스팅</span>
              <span className="text-sm text-gray-600">Vercel</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">데이터베이스</span>
              <span className="text-sm text-gray-600">Supabase Cloud</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">MQTT 브리지</span>
              <span className="text-sm text-gray-600">독립 서버</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">CI/CD</span>
              <span className="text-sm text-gray-600">GitHub Actions</span>
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
    <div className="space-y-6">
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
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>모든 시스템 기능 접근</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>사용자 관리 및 권한 설정</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>시스템 설정 변경</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>데이터베이스 관리</li>
          </ul>
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
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>시스템 모니터링</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>성능 메트릭 조회</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>로그 관리</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>시스템 상태 확인</li>
          </ul>
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
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>농장 생성 및 관리</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>팀원 관리</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>디바이스 설정</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>농장별 통계 조회</li>
          </ul>
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
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>농장 데이터 조회</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>센서 데이터 모니터링</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>배양액 레시피 조회</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>기본 디바이스 제어</li>
          </ul>
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
                <p className="text-sm text-gray-600">MQTT 브리지가 메시지를 수신하고 Supabase에 저장</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎛️ 제어 명령 흐름</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">웹 대시보드에서 명령 입력</h4>
                <p className="text-sm text-gray-600">사용자가 펌프, 밸브 등을 제어</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Supabase에 명령 저장</h4>
                <p className="text-sm text-gray-600">제어 명령을 데이터베이스에 저장</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">브리지가 명령 전송</h4>
                <p className="text-sm text-gray-600">MQTT 브리지가 명령을 MQTT 브로커로 전송</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">디바이스 실행</h4>
                <p className="text-sm text-gray-600">IoT 디바이스가 명령을 수신하고 실행</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">5</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">실행 결과 확인</h4>
                <p className="text-sm text-gray-600">명령 실행 결과를 ACK 메시지로 전송</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="시스템 개요" subtitle="스마트팜 플랫폼 아키텍처 및 구조" />
      
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
