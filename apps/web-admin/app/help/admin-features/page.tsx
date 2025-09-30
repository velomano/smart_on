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

export default function AdminFeaturesPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('🔍 관리자 기능 페이지 - 사용자 정보:', currentUser);
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
    { id: 'overview', label: '관리자 기능 개요', icon: '👨‍💼' },
    { id: 'user-management', label: '사용자 관리', icon: '👥' },
    { id: 'farm-management', label: '농장 관리', icon: '🏢' },
    { id: 'system-settings', label: '시스템 설정', icon: '⚙️' },
    { id: 'security', label: '보안 관리', icon: '🔒' },
  ];

  const renderOverview = () => (
    <div className="space-y-2 sm:space-y-3">
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-2 sm:p-3 border border-red-200">
        <h2 className="text-2xl font-bold text-red-900 mb-4">👨‍💼 관리자 기능 개요</h2>
        <p className="text-red-800 mb-6">
          시스템 관리자만 접근 가능한 고급 관리 기능들을 통해 전체 시스템을 효율적으로 운영할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-600">사용자 관리</h3>
              <p className="text-sm text-gray-600 font-medium">계정 및 권한 관리</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 font-medium">
            <li>• 사용자 승인/거부</li>
            <li>• 역할 및 권한 설정</li>
            <li>• 팀 관리</li>
            <li>• 사용자 정보 수정</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-600">농장 관리</h3>
              <p className="text-sm text-gray-600 font-medium">농장 생성 및 설정</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 font-medium">
            <li>• 농장 생성/삭제</li>
            <li>• 농장별 사용자 배정</li>
            <li>• MQTT 설정 관리</li>
            <li>• 농장별 통계</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-600">시스템 설정</h3>
              <p className="text-sm text-gray-600 font-medium">전역 설정 관리</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 font-medium">
            <li>• 시스템 환경 설정</li>
            <li>• 알림 설정</li>
            <li>• 백업 및 복원</li>
            <li>• 로그 관리</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-600">보안 관리</h3>
              <p className="text-sm text-gray-600 font-medium">보안 정책 및 모니터링</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 font-medium">
            <li>• 접근 로그 모니터링</li>
            <li>• 보안 정책 설정</li>
            <li>• 이상 행위 탐지</li>
            <li>• 데이터 보호</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-600 mb-4">🔐 권한 체계</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-600 mb-2">사용자 역할</h4>
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
            <h4 className="font-semibold text-gray-600 mb-2">접근 권한</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
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
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">👥 사용자 관리</h2>
        <p className="text-blue-800 mb-6">
          시스템 사용자들을 관리하고 권한을 설정하여 안전하고 효율적인 운영을 보장합니다.
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-600 mb-4">👥 사용자 목록</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">사용자</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">역할</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">상태</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">마지막 접속</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-red-800 font-semibold">김</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">김관리자</div>
                      <div className="text-sm text-gray-600 font-medium">admin@farm.com</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    Super Admin
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    활성
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 font-medium">5분 전</td>
                <td className="py-3 px-4">
                  <button className="text-blue-800 font-semibold hover:text-blue-800 text-sm font-medium">
                    편집
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-600 mb-4">➕ 새 사용자 초대</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">이메일 주소 *</label>
              <input 
                type="email" 
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 placeholder-gray-600"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">역할 선택 *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600">
                <option value="">역할을 선택하세요</option>
                <option value="system_admin">System Admin</option>
                <option value="team_leader">Team Leader</option>
                <option value="team_member">Team Member</option>
              </select>
            </div>
          </div>
          
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
            초대 보내기
          </button>
        </div>
      </div>
    </div>
  );

  const renderFarmManagement = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-4">🏢 농장 관리</h2>
        <p className="text-green-800 mb-6">
          농장 생성, 설정, 사용자 배정 등을 통해 효율적인 농장 운영을 관리합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-600 mb-4">➕ 농장 생성</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">농장명 *</label>
              <input 
                type="text" 
                placeholder="예: 스마트팜 서울농장"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-600"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">농장 위치</label>
              <input 
                type="text" 
                placeholder="예: 서울시 강남구"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-600"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">농장 설명</label>
              <textarea 
                placeholder="농장의 특징, 운영 방식, 주요 작물 등을 설명해주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600 placeholder-gray-600"
                rows={3}
              />
            </div>
            
            <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors">
              농장 생성
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-600 mb-4">👥 사용자 배정</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">농장 선택</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600">
                <option value="">농장을 선택하세요</option>
                <option value="farm1">스마트팜 서울농장</option>
                <option value="farm2">스마트팜 부산농장</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">사용자 선택</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600">
                <option value="">사용자를 선택하세요</option>
                <option value="user1">김농부 (kim@farm.com)</option>
                <option value="user2">이농부 (lee@farm.com)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">역할</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600">
                <option value="team_member">팀 멤버</option>
                <option value="team_leader">팀 리더</option>
              </select>
            </div>
            
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
              사용자 배정
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-600 mb-4">📊 농장 통계</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">12</div>
            <div className="text-sm text-gray-600 font-medium">총 농장 수</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">45</div>
            <div className="text-sm text-gray-600 font-medium">활성 디바이스</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">156</div>
            <div className="text-sm text-gray-600 font-medium">총 센서</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">89</div>
            <div className="text-sm text-gray-600 font-medium">활성 사용자</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">⚙️ 시스템 설정</h2>
        <p className="text-purple-800 mb-6">
          시스템 전역 설정을 통해 플랫폼의 기본 동작과 환경을 구성합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-600 mb-4">🔔 알림 설정</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-semibold">이메일 알림</span>
              <input type="checkbox" className="w-4 h-4 text-purple-600" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-semibold">SMS 알림</span>
              <input type="checkbox" className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-semibold">푸시 알림</span>
              <input type="checkbox" className="w-4 h-4 text-purple-600" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-semibold">텔레그램 알림</span>
              <input type="checkbox" className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-600 mb-4">🌐 시스템 환경</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">기본 시간대</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600">
                <option value="Asia/Seoul">한국 표준시 (KST)</option>
                <option value="UTC">협정 세계시 (UTC)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">데이터 보관 기간</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600">
                <option value="30">30일</option>
                <option value="90">90일</option>
                <option value="365">1년</option>
                <option value="0">무제한</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">자동 백업 주기</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600">
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-600 mb-4">💾 데이터베이스 관리</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">2.3GB</div>
            <div className="text-sm text-gray-600 font-medium">현재 사용량</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">15.7GB</div>
            <div className="text-sm text-gray-600 font-medium">사용 가능</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">87%</div>
            <div className="text-sm text-gray-600 font-medium">여유 공간</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-2 sm:space-y-3">
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-2 sm:p-3 border border-red-200">
        <h2 className="text-2xl font-bold text-red-900 mb-4">🔒 보안 관리</h2>
        <p className="text-red-800 mb-6">
          시스템 보안 정책을 설정하고 접근 로그를 모니터링하여 안전한 운영을 보장합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-600 mb-4">🛡️ 보안 정책</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">비밀번호 정책</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-600">
                <option value="basic">기본 (8자 이상)</option>
                <option value="medium">중간 (8자 이상, 숫자 포함)</option>
                <option value="strong">강력 (8자 이상, 대소문자, 숫자, 특수문자)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-semibold">세션 타임아웃</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-600">
                <option value="30">30분</option>
                <option value="60">1시간</option>
                <option value="120">2시간</option>
                <option value="480">8시간</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-semibold">2단계 인증</span>
              <input type="checkbox" className="w-4 h-4 text-red-600" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-semibold">IP 화이트리스트</span>
              <input type="checkbox" className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-600 mb-4">📊 접근 로그</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-600">admin@farm.com</div>
                <div className="text-sm text-gray-600 font-medium">시스템 관리자</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 font-medium">5분 전</div>
                <div className="text-xs text-green-700 font-semibold">성공</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-600">kim@farm.com</div>
                <div className="text-sm text-gray-600 font-medium">팀 리더</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 font-medium">12분 전</div>
                <div className="text-xs text-green-700 font-semibold">성공</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-600">unknown@hacker.com</div>
                <div className="text-sm text-gray-600 font-medium">외부 접근 시도</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 font-medium">1시간 전</div>
                <div className="text-xs text-red-700 font-semibold">실패</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-600 mb-4">🚨 보안 알림</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">3</div>
            <div className="text-sm text-gray-600 font-medium">실패한 로그인</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">1</div>
            <div className="text-sm text-gray-600 font-medium">의심스러운 활동</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">156</div>
            <div className="text-sm text-gray-600 font-medium">정상 로그인</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'user-management':
        return renderUserManagement();
      case 'farm-management':
        return renderFarmManagement();
      case 'system-settings':
        return renderSystemSettings();
      case 'security':
        return renderSecurity();
      default:
        return renderOverview();
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
        title="관리자 기능" 
        subtitle="시스템 관리 및 운영 완전 가이드" 
        showBackButton
        backButtonText="사용설명서"
        onBackClick={() => router.push('/help')}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BreadcrumbNavigation 
          items={[
            { label: '대시보드', path: '/' },
            { label: '사용설명서', path: '/help' },
            { label: '관리자 기능', isActive: true }
          ]}
          className="mb-6"
        />
        <div className="grid lg:grid-cols-4 gap-2 sm:gap-3">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-600 mb-4">목차</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-red-100 text-red-900 border border-red-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-600'
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
