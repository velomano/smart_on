'use client';

import React, { useState } from 'react';
import AppHeader from '../../../src/components/AppHeader';

interface TabType {
  id: string;
  label: string;
  icon: string;
}

export default function FarmManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabType[] = [
    { id: 'overview', label: '농장 관리 개요', icon: '🏢' },
    { id: 'creation', label: '농장 생성', icon: '➕' },
    { id: 'mqtt-setup', label: 'MQTT 설정', icon: '📡' },
    { id: 'user-management', label: '사용자 관리', icon: '👥' },
    { id: 'monitoring', label: '농장 모니터링', icon: '📊' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">🏢 농장 관리 개요</h2>
        <p className="text-purple-800 mb-6">
          농장을 생성하고 설정하여 IoT 디바이스들을 효율적으로 관리할 수 있습니다.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h3 className="font-semibold text-purple-900 mb-2">📋 주요 기능</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• 농장 생성 및 기본 정보 설정</li>
              <li>• MQTT 브로커 연결 설정</li>
              <li>• 사용자별 권한 관리</li>
              <li>• 디바이스 등록 및 관리</li>
              <li>• 실시간 모니터링</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h3 className="font-semibold text-purple-900 mb-2">🎯 목표</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• 안정적인 IoT 디바이스 연결</li>
              <li>• 효율적인 데이터 수집</li>
              <li>• 보안성 있는 접근 제어</li>
              <li>• 실시간 농장 상태 파악</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏗️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">농장 설정</h3>
              <p className="text-sm text-gray-600">기본 정보 및 구조 설정</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 농장명, 위치, 설명</li>
            <li>• 농장 구조 설계</li>
            <li>• 베드 및 구역 설정</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📡</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">MQTT 연동</h3>
              <p className="text-sm text-gray-600">디바이스 통신 설정</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 브로커 URL 및 포트</li>
            <li>• 인증 정보 설정</li>
            <li>• 연결 테스트</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">사용자 관리</h3>
              <p className="text-sm text-gray-600">권한 및 접근 제어</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 사용자 초대</li>
            <li>• 역할별 권한 설정</li>
            <li>• 접근 로그 관리</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderCreation = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-4">➕ 농장 생성 가이드</h2>
        <p className="text-green-800 mb-6">
          새로운 농장을 생성하고 기본 설정을 완료하는 단계별 가이드입니다.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 1단계: 기본 정보 입력</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">농장명 *</label>
                <input 
                  type="text" 
                  placeholder="예: 스마트팜 서울농장"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500">고유하고 식별하기 쉬운 이름을 입력하세요.</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">농장 위치</label>
                <input 
                  type="text" 
                  placeholder="예: 서울시 강남구"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">농장 설명</label>
              <textarea 
                placeholder="농장의 특징, 운영 방식, 주요 작물 등을 설명해주세요."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏗️ 2단계: 농장 구조 설정</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">베드 수</label>
                <input 
                  type="number" 
                  placeholder="예: 8"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">베드당 층수</label>
                <input 
                  type="number" 
                  placeholder="예: 3"
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">💡 팁</h4>
              <p className="text-sm text-blue-700">
                베드 구조는 나중에 수정할 수 있지만, 초기 설정을 정확히 하면 디바이스 배치가 더 용이합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ 3단계: 생성 완료</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-medium text-green-900">농장 생성 완료</h4>
                <p className="text-sm text-green-700">기본 정보가 설정되었습니다.</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">다음 단계</h4>
                <p className="text-sm text-blue-700">MQTT 브로커 설정을 진행하세요.</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">설정 변경</h4>
                <p className="text-sm text-purple-700">언제든지 농장 정보를 수정할 수 있습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMqttSetup = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">📡 MQTT 브로커 설정</h2>
        <p className="text-blue-800 mb-6">
          농장의 IoT 디바이스들과 통신하기 위한 MQTT 브로커 설정 가이드입니다.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 브로커 연결 설정</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">브로커 URL *</label>
                <input 
                  type="text" 
                  placeholder="예: mqtt://your-broker.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500">mqtt://, mqtts://, ws://, wss:// 프로토콜 지원</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">포트</label>
                <input 
                  type="number" 
                  placeholder="1883"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">사용자명</label>
                <input 
                  type="text" 
                  placeholder="MQTT 브로커 사용자명"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">비밀번호</label>
                <input 
                  type="password" 
                  placeholder="MQTT 브로커 비밀번호"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 보안 설정</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="useTLS"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="useTLS" className="text-sm font-medium text-gray-700">
                TLS/SSL 사용 (권장)
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="keepAlive"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                defaultChecked
              />
              <label htmlFor="keepAlive" className="text-sm font-medium text-gray-700">
                Keep-Alive 연결 유지
              </label>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ 보안 주의사항</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 프로덕션 환경에서는 반드시 TLS/SSL을 사용하세요.</li>
                <li>• 강력한 비밀번호를 설정하세요.</li>
                <li>• 브로커 접근 권한을 최소화하세요.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 연결 테스트</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                연결 테스트
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <span className="text-sm text-gray-600">연결 상태 확인 중...</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">테스트 결과</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>브로커 연결:</span>
                  <span className="text-green-600">✓ 성공</span>
                </div>
                <div className="flex justify-between">
                  <span>인증:</span>
                  <span className="text-green-600">✓ 성공</span>
                </div>
                <div className="flex justify-between">
                  <span>응답 시간:</span>
                  <span className="text-blue-600">45ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
        <h2 className="text-2xl font-bold text-orange-900 mb-4">👥 사용자 관리</h2>
        <p className="text-orange-800 mb-6">
          농장에 접근할 수 있는 사용자들을 관리하고 권한을 설정할 수 있습니다.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">➕ 사용자 초대</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">이메일 주소 *</label>
                <input 
                  type="email" 
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">역할 선택 *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="">역할을 선택하세요</option>
                  <option value="team_leader">팀 리더</option>
                  <option value="team_member">팀 멤버</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">초대 메시지</label>
              <textarea 
                placeholder="초대 메시지를 작성하세요 (선택사항)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
              초대 보내기
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 현재 사용자 목록</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">사용자</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">역할</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">상태</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">마지막 접속</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">액션</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">김</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">김농장</div>
                        <div className="text-sm text-gray-500">kim@farm.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      팀 리더
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      활성
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">2시간 전</td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      편집
                    </button>
                  </td>
                </tr>
                
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">이</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">이스마트</div>
                        <div className="text-sm text-gray-500">lee@farm.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      팀 멤버
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      대기중
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">-</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        승인
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        거부
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 권한 관리</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">팀 리더 권한</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>농장 설정 변경</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>사용자 관리</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>디바이스 설정</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>모든 데이터 조회</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">팀 멤버 권한</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>농장 데이터 조회</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>센서 데이터 모니터링</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>기본 디바이스 제어</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>배양액 레시피 조회</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoring = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <h2 className="text-2xl font-bold text-indigo-900 mb-4">📊 농장 모니터링</h2>
        <p className="text-indigo-800 mb-6">
          농장의 전반적인 상태를 실시간으로 모니터링하고 분석할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌡️</span>
            </div>
            <span className="text-sm text-gray-500">평균</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">23.5°C</h3>
          <p className="text-sm text-gray-600">온도</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-green-600">+0.3°C</span>
            <span className="text-xs text-gray-500 ml-1">vs 어제</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💧</span>
            </div>
            <span className="text-sm text-gray-500">평균</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">65%</h3>
          <p className="text-sm text-gray-600">습도</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-red-600">-2%</span>
            <span className="text-xs text-gray-500 ml-1">vs 어제</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <span className="text-sm text-gray-500">평균</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">1.8</h3>
          <p className="text-sm text-gray-600">EC</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-green-600">+0.1</span>
            <span className="text-xs text-gray-500 ml-1">vs 어제</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔌</span>
            </div>
            <span className="text-sm text-gray-500">연결</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">12/15</h3>
          <p className="text-sm text-gray-600">디바이스</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-yellow-600">3개 오프라인</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 최근 24시간 트렌드</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">차트 영역</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 알림 현황</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">온도 임계값 초과</p>
                <p className="text-xs text-red-700">베드 3 - 30분 전</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">센서 연결 끊김</p>
                <p className="text-xs text-yellow-700">센서 ID: 12345 - 1시간 전</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">배양액 교체 권장</p>
                <p className="text-xs text-blue-700">베드 1, 2 - 2시간 전</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 농장 통계</h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">8</div>
            <div className="text-sm text-gray-600">총 베드 수</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">24</div>
            <div className="text-sm text-gray-600">총 층 수</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">15</div>
            <div className="text-sm text-gray-600">연결된 디바이스</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">99.2%</div>
            <div className="text-sm text-gray-600">가동률</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'creation':
        return renderCreation();
      case 'mqtt-setup':
        return renderMqttSetup();
      case 'user-management':
        return renderUserManagement();
      case 'monitoring':
        return renderMonitoring();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="농장 관리" subtitle="농장 생성, 설정 및 관리 완전 가이드" />
      
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
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
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
