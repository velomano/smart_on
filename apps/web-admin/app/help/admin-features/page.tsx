'use client';

import React, { useState } from 'react';
import AppHeader from '../../../src/components/AppHeader';

interface TabType {
  id: string;
  label: string;
  icon: string;
}

export default function AdminFeaturesPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabType[] = [
    { id: 'overview', label: '관리자 기능 개요', icon: '👨‍💼' },
    { id: 'user-management', label: '사용자 관리', icon: '👥' },
    { id: 'farm-management', label: '농장 관리', icon: '🏢' },
    { id: 'system-settings', label: '시스템 설정', icon: '⚙️' },
    { id: 'security', label: '보안 관리', icon: '🔒' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
        <h2 className="text-2xl font-bold text-red-900 mb-4">👨‍💼 관리자 기능 개요</h2>
        <p className="text-red-800 mb-6">
          시스템 관리자만 접근 가능한 고급 관리 기능들을 통해 전체 시스템을 효율적으로 운영할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">사용자 관리</h3>
              <p className="text-sm text-gray-600">계정 및 권한 관리</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 사용자 승인/거부</li>
            <li>• 역할 및 권한 설정</li>
            <li>• 팀 관리</li>
            <li>• 사용자 정보 수정</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">농장 관리</h3>
              <p className="text-sm text-gray-600">농장 생성 및 설정</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 농장 생성/삭제</li>
            <li>• 농장별 사용자 배정</li>
            <li>• MQTT 설정 관리</li>
            <li>• 농장별 통계</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">시스템 설정</h3>
              <p className="text-sm text-gray-600">전역 설정 관리</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 시스템 환경 설정</li>
            <li>• 알림 설정</li>
            <li>• 백업 및 복원</li>
            <li>• 로그 관리</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">보안 관리</h3>
              <p className="text-sm text-gray-600">보안 정책 및 모니터링</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 접근 로그 모니터링</li>
            <li>• 보안 정책 설정</li>
            <li>• 이상 행위 탐지</li>
            <li>• 데이터 보호</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 권한 체계</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">사용자 역할</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">super_admin</span>
                <span className="text-xs text-gray-500">시스템 전체 관리</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">system_admin</span>
                <span className="text-xs text-gray-500">시스템 모니터링</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">team_leader</span>
                <span className="text-xs text-gray-500">팀 및 농장 관리</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">team_member</span>
                <span className="text-xs text-gray-500">농장 조회</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">접근 권한</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">관리자 페이지</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">농장 관리</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">시스템 모니터링</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">사용자 관리</span>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 사용자 목록</h3>
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
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-red-600">김</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">김관리자</div>
                      <div className="text-sm text-gray-500">admin@farm.com</div>
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
                <td className="py-3 px-4 text-sm text-gray-600">5분 전</td>
                <td className="py-3 px-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    편집
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">➕ 새 사용자 초대</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">이메일 주소 *</label>
              <input 
                type="email" 
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">역할 선택 *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">역할을 선택하세요</option>
                <option value="system_admin">System Admin</option>
                <option value="team_leader">Team Leader</option>
                <option value="team_member">Team Member</option>
              </select>
            </div>
          </div>
          
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            초대 보내기
          </button>
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
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="관리자 기능" subtitle="시스템 관리 및 운영 완전 가이드" />
      
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
                        ? 'bg-red-100 text-red-900 border border-red-200'
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
