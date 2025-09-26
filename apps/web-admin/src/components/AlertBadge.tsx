'use client';

import React, { useState, useEffect } from 'react';
import { dashboardAlertManager, DashboardAlert } from '@/lib/dashboardAlerts';
import { getCurrentUser } from '@/lib/mockAuth';
import { AuthUser } from '@/lib/mockAuth';

interface AlertBadgeProps {
  className?: string;
}

export default function AlertBadge({ className = '' }: AlertBadgeProps) {
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<AuthUser | null>(null);

  // 인증 사용자 상태 확인
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser && currentUser.is_approved && currentUser.is_active) {
        setUser(currentUser);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    // 알림 구독
    const unsubscribe = dashboardAlertManager.subscribe((newAlerts) => {
      setAlerts(newAlerts);
      const unread = newAlerts.filter(alert => !alert.isRead).length;
      setUnreadCount(unread);
    });

    // 초기 알림 로드
    const initialAlerts = dashboardAlertManager.getAlerts();
    setAlerts(initialAlerts);
    const unread = initialAlerts.filter(alert => !alert.isRead).length;
    setUnreadCount(unread);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleMarkAllAsRead = () => {
    dashboardAlertManager.markAllAsRead();
    setShowPopup(false);
  };

  const handleClearAll = () => {
    alerts.forEach(alert => {
      dashboardAlertManager.deleteAlert(alert.id);
    });
    setShowPopup(false);
  };

  const hasAlerts = alerts.length > 0;
  const hasUnreadAlerts = unreadCount > 0;

  // 로그인하지 않은 사용자에게는 알림 배지 표시하지 않음
  if (!user) {
    return null;
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* 알림 배지 */}
      <button
        onClick={() => setShowPopup(!showPopup)}
        className="relative group"
      >
        {/* 메인 알림 버튼 */}
        <div className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white text-xl transition-all duration-300 transform hover:scale-110 ${
          hasUnreadAlerts 
            ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' 
            : hasAlerts 
              ? 'bg-gradient-to-r from-gray-500 to-gray-600' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
        }`}>
          <span>
            🚨
          </span>
        </div>
        
        {/* 경고 수 카운터 */}
        {hasUnreadAlerts && (
          <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}

        {/* 읽지 않은 알림이 있을 때 깜빡이는 효과 */}
        {hasUnreadAlerts && (
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
        )}
      </button>

      {/* 툴팁 */}
      <div className="absolute bottom-16 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          {hasUnreadAlerts 
            ? `${unreadCount}개의 새로운 경고가 있습니다` 
            : hasAlerts
              ? `총 ${alerts.length}개의 경고가 있습니다`
              : '경고 알림이 없습니다'
          }
        </div>
        {/* 화살표 */}
        <div className="absolute top-full right-6 border-4 border-transparent border-t-gray-900"></div>
      </div>

      {/* 클릭시 알림 리스트 팝업 */}
      <div 
        className={`absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-200 ${
          showPopup ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ maxHeight: '180px', overflowY: 'auto', minWidth: '320px', maxWidth: '400px' }}
      >
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              🚨 경고 알림
            </h3>
            <div className="flex space-x-1">
              {hasAlerts && (
                <>
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    모두 읽음
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    모두 삭제
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-2">
          {hasAlerts ? (
            <>
              {alerts.slice(0, 3).map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-2 mb-1 rounded-lg text-xs ${
                    alert.isRead 
                      ? 'bg-gray-50 text-gray-600' 
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  <div className="font-medium truncate">
                    {alert.title} {!alert.isRead && '🔔'}
                  </div>
                  <div className="text-gray-600 truncate">
                    {alert.location}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {new Date(alert.timestamp).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
              {alerts.length > 3 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{alerts.length - 3}개 더...
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              현재 경고가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
