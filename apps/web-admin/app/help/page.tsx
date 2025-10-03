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
      title: '시작하기',
      description: '스마트팜 플랫폼 첫 걸음 - 기본 개념과 주요 기능',
      icon: '🚀',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-2xl font-bold text-green-900 mb-4">🌱 스마트팜 플랫폼이란?</h3>
            <p className="text-green-800 text-lg mb-4">
              스마트팜을 쉽고 간편하게 관리할 수 있는 올인원 플랫폼입니다. 
              복잡한 IoT 기술을 몰라도 누구나 스마트팜을 운영할 수 있어요!
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-green-100 text-center">
                <div className="text-3xl mb-2">📱</div>
                <h4 className="font-semibold text-green-900 mb-2">간편한 관리</h4>
                <p className="text-sm text-green-800">웹 브라우저에서 모든 것을 관리하세요</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-100 text-center">
                <div className="text-3xl mb-2">🔧</div>
                <h4 className="font-semibold text-green-900 mb-2">자동화된 제어</h4>
                <p className="text-sm text-green-800">센서 데이터에 따라 자동으로 작동</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-100 text-center">
                <div className="text-3xl mb-2">📊</div>
                <h4 className="font-semibold text-green-900 mb-2">실시간 모니터링</h4>
                <p className="text-sm text-green-800">언제 어디서나 농장 상태 확인</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-xl font-semibold text-gray-800 mb-4">🎯 주요 기능</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📊</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">실시간 농장 모니터링</h5>
                    <p className="text-sm text-gray-600">온도, 습도, 조도 등 모든 센서 데이터를 한눈에</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">🔧</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">자동 디바이스 제어</h5>
                    <p className="text-sm text-gray-600">조건에 따라 자동으로 팬, 펌프, 조명 제어</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">⚡</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">유니버셜 브릿지 연결</h5>
                    <p className="text-sm text-gray-600">IoT 디바이스를 쉽게 연결하고 관리</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm">🧪</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">배양액 조제 가이드</h5>
                    <p className="text-sm text-gray-600">작물별 맞춤형 배양액 레시피 제공</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-xl font-semibold text-gray-800 mb-4">👥 사용자 역할</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <h5 className="font-semibold text-red-800">시스템 관리자</h5>
                    <p className="text-sm text-red-600">전체 시스템 관리 및 사용자 관리</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">super_admin</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <h5 className="font-semibold text-blue-800">팀 리더</h5>
                    <p className="text-sm text-blue-600">농장 관리 및 팀원 관리</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">team_leader</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <h5 className="font-semibold text-green-800">팀 멤버</h5>
                    <p className="text-sm text-green-600">농장 조회 및 기본 기능 사용</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">team_member</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: '대시보드 둘러보기',
      description: '로그인 후 첫 화면에서 농장 현황을 확인하는 방법',
      icon: '🏠',
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
            <h4 className="text-lg font-semibold text-gray-600 mb-3">🎯 주요 기능</h4>
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
      id: 'bridge',
      title: '유니버셜 브릿지 연결',
      description: 'IoT 디바이스를 쉽게 연결하고 관리하는 방법',
      icon: '⚡',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-2xl font-bold text-purple-900 mb-4">⚡ 유니버셜 브릿지란?</h3>
            <p className="text-purple-800 text-lg mb-4">
              복잡한 IoT 디바이스 연결을 간단하게 만들어주는 혁신적인 기능입니다. 
              센서와 액추에이터를 쉽게 설정하고 자동으로 코드를 생성해줍니다!
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-purple-100 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-semibold text-purple-900 mb-2">3단계 간편 설정</h4>
                <p className="text-sm text-purple-800">디자인 → 코드생성 → 연결</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-100 text-center">
                <div className="text-3xl mb-2">🔧</div>
                <h4 className="font-semibold text-purple-900 mb-2">자동 핀 할당</h4>
                <p className="text-sm text-purple-800">충돌 없는 스마트한 핀 배치</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-100 text-center">
                <div className="text-3xl mb-2">💻</div>
                <h4 className="font-semibold text-purple-900 mb-2">완성된 코드 생성</h4>
                <p className="text-sm text-purple-800">즉시 사용 가능한 펌웨어 코드</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">🚀 시작하는 방법</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">1</div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-800 mb-2">농장 관리 페이지로 이동</h5>
                  <p className="text-gray-600 mb-2">관리하고 싶은 농장을 선택하고 "유니버셜 브릿지 연결" 버튼을 클릭하세요.</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      💡 <strong>팁:</strong> 팀 리더 이상의 권한이 필요합니다. 권한이 없다면 관리자에게 문의하세요.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">2</div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-800 mb-2">디바이스와 센서 선택</h5>
                  <p className="text-gray-600 mb-2">ESP32, Arduino, 라즈베리파이 등 원하는 디바이스를 선택하고, 필요한 센서와 액추에이터를 추가하세요.</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      ✅ <strong>지원 디바이스:</strong> ESP32, ESP8266, Arduino Uno/R4, 라즈베리파이 3/4/5
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg">3</div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-800 mb-2">핀 할당 및 코드 생성</h5>
                  <p className="text-gray-600 mb-2">자동으로 할당된 핀을 확인하고, 필요시 수정한 후 완성된 펌웨어 코드를 다운로드하세요.</p>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-sm text-purple-800">
                      🎯 <strong>자동 기능:</strong> 핀 충돌 방지, 전원 계산, WiFi 설정 포함
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg">4</div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-800 mb-2">디바이스에 업로드</h5>
                  <p className="text-gray-600 mb-2">생성된 코드를 Arduino IDE나 PlatformIO에서 열고, WiFi 정보를 수정한 후 디바이스에 업로드하세요.</p>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-800">
                      ⚠️ <strong>주의:</strong> WiFi SSID와 비밀번호를 반드시 수정해야 합니다!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">📱 네이티브 앱 연결 (QR 코드)</h4>
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
              <p className="text-cyan-800 mb-3">
                모바일 앱을 사용하여 디바이스를 더 쉽게 연결할 수 있습니다.
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm bg-cyan-100 text-cyan-800 px-2 py-1 rounded">QR 코드 생성</span>
                <span className="text-gray-400">→</span>
                <span className="text-sm bg-cyan-100 text-cyan-800 px-2 py-1 rounded">모바일 앱 스캔</span>
                <span className="text-gray-400">→</span>
                <span className="text-sm bg-cyan-100 text-cyan-800 px-2 py-1 rounded">자동 연결</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'farms',
      title: '농장 관리하기',
      description: '농장을 생성하고 설정하는 방법',
      icon: '🏢',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-2xl font-bold text-green-900 mb-4">🏢 농장 관리하기</h3>
            <p className="text-green-800 text-lg mb-4">
              여러 농장을 체계적으로 관리하고, 각 농장별로 IoT 디바이스와 센서를 설정할 수 있습니다.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <h4 className="font-semibold text-green-900 mb-2">🏭 농장 추가</h4>
                <p className="text-sm text-green-800">새로운 농장을 생성하고 기본 정보를 설정합니다.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <h4 className="font-semibold text-green-900 mb-2">⚡ 디바이스 연결</h4>
                <p className="text-sm text-green-800">유니버셜 브릿지를 통해 IoT 디바이스를 연결합니다.</p>
              </div>
            </div>
          </div>
            
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
            <h4 className="text-lg font-semibold text-gray-600 mb-3">🔧 농장 설정</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                <div>
                  <h5 className="font-medium text-gray-600">기본 정보</h5>
                  <p className="text-sm text-gray-600">농장명, 위치, 연락처 등 기본 정보 입력</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
                <div>
                  <h5 className="font-medium text-gray-600">MQTT 브로커 설정</h5>
                  <p className="text-sm text-gray-600">브로커 URL, 포트, 인증 정보 설정</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">3</div>
                <div>
                  <h5 className="font-medium text-gray-600">디바이스 등록</h5>
                  <p className="text-sm text-gray-600">센서, 액추에이터 등 디바이스 등록</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">4</div>
                <div>
                  <h5 className="font-medium text-gray-600">연결 테스트</h5>
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
            <h4 className="text-lg font-semibold text-gray-600 mb-3">📊 센서 상태 표시</h4>
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
            <h4 className="text-lg font-semibold text-gray-600 mb-3">🎯 주요 기능</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                <div>
                  <h5 className="font-medium text-gray-600">레시피 검색</h5>
                  <p className="text-sm text-gray-600">작물명, 생육 단계, 출처별로 배양액 레시피 검색</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
                <div>
                  <h5 className="font-medium text-gray-600">상세 정보 확인</h5>
                  <p className="text-sm text-gray-600">EC, pH, 영양소 함량 등 상세 정보 확인</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">3</div>
                <div>
                  <h5 className="font-medium text-gray-600">조제 가이드</h5>
                  <p className="text-sm text-gray-600">단계별 조제 방법과 주의사항 안내</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">4</div>
                <div>
                  <h5 className="font-medium text-gray-600">최신 업데이트</h5>
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
                <span className="text-gray-600 font-bold">→</span>
                <div className="bg-blue-100 px-2 py-1 rounded text-xs font-semibold text-blue-800">MQTT 브로커</div>
                <span className="text-gray-600 font-bold">→</span>
                <div className="bg-purple-100 px-2 py-1 rounded text-xs font-semibold text-purple-800">스마트팜 브리지</div>
                <span className="text-gray-600 font-bold">→</span>
                <div className="bg-orange-100 px-2 py-1 rounded text-xs font-semibold text-orange-800">웹 대시보드</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-600 mb-3">🔧 브로커 설정</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">1</div>
                  <div>
                    <h5 className="font-medium text-gray-600">브로커 선택</h5>
                    <p className="text-sm text-gray-600">Mosquitto, EMQX, AWS IoT Core</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">2</div>
                  <div>
                    <h5 className="font-medium text-gray-600">설정 적용</h5>
                    <p className="text-sm text-gray-600">보안, 토픽, 권한 설정</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">3</div>
                  <div>
                    <h5 className="font-medium text-gray-600">연결 테스트</h5>
                    <p className="text-sm text-gray-600">MQTT 클라이언트로 테스트</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-600 mb-3">💻 디바이스 연동</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">1</div>
                  <div>
                    <h5 className="font-medium text-gray-600">템플릿 다운로드</h5>
                    <p className="text-sm text-gray-600">Arduino, Python, Node.js</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">2</div>
                  <div>
                    <h5 className="font-medium text-gray-600">설정 수정</h5>
                    <p className="text-sm text-gray-600">브로커 정보 입력</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">3</div>
                  <div>
                    <h5 className="font-medium text-gray-600">실행 및 테스트</h5>
                    <p className="text-sm text-gray-600">디바이스 실행 후 연동 확인</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-600 mb-3">📋 토픽 구조</h4>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <div className="text-gray-600 mb-2">표준 토픽 패턴:</div>
              <div className="text-blue-600">farms/{'{farm_id}'}/devices/{'{device_id}'}/{'{message_type}'}</div>
              
              <div className="mt-4 text-gray-600">메시지 타입:</div>
              <ul className="mt-2 space-y-1 text-gray-600">
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
            <h4 className="text-lg font-semibold text-gray-600 mb-3">🔐 권한 체계</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-600 mb-2">사용자 역할</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-600">super_admin</span>
                    <span className="text-xs text-gray-600 font-medium">시스템 전체 관리</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-600">system_admin</span>
                    <span className="text-xs text-gray-600 font-medium">시스템 모니터링</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-600">team_leader</span>
                    <span className="text-xs text-gray-600 font-medium">팀 및 농장 관리</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-600">team_member</span>
                    <span className="text-xs text-gray-600 font-medium">농장 조회</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-600 mb-2">접근 권한</h5>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-600">관리자 페이지</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-600">농장 관리</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-600">시스템 모니터링</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-600">사용자 관리</span>
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
      id: 'troubleshooting',
      title: '문제 해결하기',
      description: '자주 발생하는 문제와 해결 방법',
      icon: '🔧',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
            <h3 className="text-2xl font-bold text-red-900 mb-4">🔧 문제 해결 가이드</h3>
            <p className="text-red-800 text-lg mb-4">
              스마트팜 운영 중 자주 발생하는 문제들과 해결 방법을 알려드립니다.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-xl font-semibold text-gray-800 mb-4">⚡ 유니버셜 브릿지 연결 문제</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h5 className="font-semibold text-gray-800">디바이스가 연결되지 않아요</h5>
                  <ul className="text-gray-600 text-sm mt-2 space-y-1">
                    <li>• WiFi SSID와 비밀번호가 정확한지 확인하세요</li>
                    <li>• 디바이스와 라우터가 같은 네트워크에 있는지 확인하세요</li>
                    <li>• Universal Bridge가 실행 중인지 확인하세요</li>
                  </ul>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h5 className="font-semibold text-gray-800">센서 데이터가 안 보여요</h5>
                  <ul className="text-gray-600 text-sm mt-2 space-y-1">
                    <li>• 센서와 디바이스 간 핀 연결을 확인하세요</li>
                    <li>• 센서에 전원이 공급되고 있는지 확인하세요</li>
                    <li>• 코드에서 센서 초기화가 제대로 되어있는지 확인하세요</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h5 className="font-semibold text-gray-800">액추에이터가 작동하지 않아요</h5>
                  <ul className="text-gray-600 text-sm mt-2 space-y-1">
                    <li>• 액추에이터와 디바이스 간 핀 연결을 확인하세요</li>
                    <li>• 액추에이터에 충분한 전원이 공급되는지 확인하세요</li>
                    <li>• 릴레이나 모터 드라이버가 정상인지 확인하세요</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-xl font-semibold text-gray-800 mb-4">🌐 네트워크 연결 문제</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-orange-500 pl-4">
                  <h5 className="font-semibold text-gray-800">WiFi 연결이 불안정해요</h5>
                  <ul className="text-gray-600 text-sm mt-2 space-y-1">
                    <li>• 라우터와 디바이스 간 거리를 확인하세요</li>
                    <li>• WiFi 신호 강도를 확인하세요</li>
                    <li>• 다른 전자기기 간섭이 없는지 확인하세요</li>
                  </ul>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <h5 className="font-semibold text-gray-800">Universal Bridge에 연결할 수 없어요</h5>
                  <ul className="text-gray-600 text-sm mt-2 space-y-1">
                    <li>• Bridge 서버가 실행 중인지 확인하세요</li>
                    <li>• 방화벽 설정을 확인하세요</li>
                    <li>• 네트워크 포트가 차단되지 않았는지 확인하세요</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-xl font-semibold text-gray-800 mb-4">💻 코드 업로드 문제</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h5 className="font-semibold text-gray-800">코드가 업로드되지 않아요</h5>
                  <ul className="text-gray-600 text-sm mt-2 space-y-1">
                    <li>• USB 케이블이 정상인지 확인하세요</li>
                    <li>• 올바른 포트를 선택했는지 확인하세요</li>
                    <li>• 디바이스 드라이버가 설치되어 있는지 확인하세요</li>
                  </ul>
                </div>
                <div className="border-l-4 border-pink-500 pl-4">
                  <h5 className="font-semibold text-gray-800">컴파일 에러가 발생해요</h5>
                  <ul className="text-gray-600 text-sm mt-2 space-y-1">
                    <li>• 필요한 라이브러리가 설치되어 있는지 확인하세요</li>
                    <li>• Arduino IDE나 PlatformIO 버전을 확인하세요</li>
                    <li>• 생성된 코드의 문법을 확인하세요</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
              <h4 className="text-xl font-semibold text-yellow-800 mb-3">📞 추가 도움이 필요하신가요?</h4>
              <p className="text-yellow-800 mb-4">
                위의 해결 방법으로도 문제가 해결되지 않는다면, 관리자에게 문의하세요.
              </p>
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-gray-600">
                  <strong>문의 시 포함해주세요:</strong><br/>
                  • 발생한 문제의 상세 설명<br/>
                  • 사용 중인 디바이스 종류<br/>
                  • 에러 메시지 (있다면)<br/>
                  • 문제 발생 시점과 상황
                </p>
              </div>
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
            <h3 className="text-xl font-bold text-gray-600 mb-4">📊 시스템 모니터링</h3>
            <p className="text-gray-600 mb-4">시스템 상태, 성능 메트릭, 로그 등을 실시간으로 모니터링할 수 있습니다.</p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h4 className="font-semibold text-gray-600 mb-2">🏥 헬스 체크</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 데이터베이스 연결</li>
                  <li>• 서비스 상태</li>
                  <li>• 응답 시간</li>
                  <li>• 가동 시간</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h4 className="font-semibold text-gray-600 mb-2">📈 메트릭</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 사용자 수</li>
                  <li>• 농장/디바이스 수</li>
                  <li>• 센서 데이터 수</li>
                  <li>• 성능 지표</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h4 className="font-semibold text-gray-600 mb-2">⚡ 성능</h4>
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
            <h4 className="text-lg font-semibold text-gray-600 mb-3">🔍 모니터링 기능</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">1</div>
                <div>
                  <h5 className="font-medium text-gray-600">실시간 상태 확인</h5>
                  <p className="text-sm text-gray-600">시스템 헬스 체크와 서비스 상태를 실시간으로 확인</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">2</div>
                <div>
                  <h5 className="font-medium text-gray-600">성능 메트릭</h5>
                  <p className="text-sm text-gray-600">시스템 리소스 사용률과 성능 지표 모니터링</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">3</div>
                <div>
                  <h5 className="font-medium text-gray-600">자동 새로고침</h5>
                  <p className="text-sm text-gray-600">30초마다 데이터 자동 업데이트</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">4</div>
                <div>
                  <h5 className="font-medium text-gray-600">에러 처리</h5>
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
        <div className="grid lg:grid-cols-4 gap-2 sm:gap-3">
          {/* 사이드바 네비게이션 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-600 mb-4">📚 목차</h2>
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
                        <div className="text-xs text-gray-600 font-medium">{section.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3">
              {currentSection && (
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <span className="text-3xl">{currentSection.icon}</span>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-600">{currentSection.title}</h1>
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
