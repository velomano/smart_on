'use client';

import React, { useState, useEffect } from 'react';
import { sendNotification } from '@/lib/notificationTemplates';
import { dashboardAlertManager } from '@/lib/dashboardAlerts';

interface NotificationButtonProps {
  className?: string;
}

export default function NotificationButton({ className = '' }: NotificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState('');

  // 알림 템플릿 목록
  const notificationTemplates = [
    {
      id: 'manual_notification_custom',
      title: '📝 사용자 지정 알림',
      message: ''
    },
    {
      id: 'sensor_high_temp',
      title: '🌡️ 고온 경고 알림',
      message: '<b>고온 경고</b>\n\n📍 위치: 조1-베드1\n🌡️ 현재 온도: 35°C\n⚠️ 임계값: 30°C'
    },
    {
      id: 'sensor_low_temp',
      title: '❄️ 저온 경고 알림',
      message: '<b>저온 경고</b>\n\n📍 위치: 조1-베드1\n🌡️ 현재 온도: 10°C\n⚠️ 임계값: 15°C'
    },
    {
      id: 'sensor_high_humidity',
      title: '💧 고습도 경고 알림',
      message: '<b>고습도 경고</b>\n\n📍 위치: 조1-베드1\n💧 현재 습도: 85%\n⚠️ 임계값: 80%'
    },
    {
      id: 'sensor_low_ec',
      title: '🔋 저EC 경고 알림',
      message: '<b>저EC 경고</b>\n\n📍 위치: 조1-베드1\n🔋 현재 EC: 0.5 mS/cm\n⚠️ 임계값: 0.8 mS/cm'
    },
    {
      id: 'sensor_ph_abnormal',
      title: '🧪 pH 이상 경고 알림',
      message: '<b>pH 이상 경고</b>\n\n📍 위치: 조1-베드1\n🧪 현재 pH: 7.5\n⚠️ 정상 범위: 5.5-6.5'
    },
    {
      id: 'sensor_low_water',
      title: '💧 저수위 경고 알림',
      message: '<b>저수위 경고</b>\n\n📍 위치: 조1-베드1\n💧 현재 수위: 15%\n⚠️ 최소 수위: 20%'
    },
    {
      id: 'system_alert',
      title: '⚠️ 시스템 경고 알림',
      message: '<b>시스템 경고</b>\n\n⚠️ 시스템 이상 상황이 발생했습니다.\n📍 위치: 전체 농장'
    },
    {
      id: 'maintenance_reminder',
      title: '🔧 관리 작업 알림',
      message: '<b>관리 작업 알림</b>\n\n🔧 정기 관리 시기가 되었습니다.\n📅 스케줄을 확인해주세요.'
    }
  ];

  const handleSendNotification = async () => {
    if (isSending) return;

    setIsSending(true);
    setSendResult('');

    try {
      const template = notificationTemplates.find(t => t.id === selectedTemplate);
      
      if (!template && !customMessage.trim()) {
        setSendResult('❌ 알림 템플릿을 선택하거나 메시지를 입력해주세요.');
        setIsSending(false);
        return;
      }

      const message = template?.message || customMessage;
      
      if (!message.trim()) {
        setSendResult('❌ 메시지가 비어있습니다.');
        setIsSending(false);
        return;
      }

      let result;

      if (template?.id === 'manual_notification_custom' || !template) {
        // 사용자 지정 메시지 직접 전송
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/notifications/telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        result = await response.json();
      } else {
        // 템플릿 기반 알림 전송
        result = await sendNotification(
          template.id,
          {
            location: '조1-베드1',
            current: '35',
            threshold: '30',
            timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
          }
        );
      }

      if (result.ok) {
        setSendResult('✅ 알림이 성공적으로 전송되었습니다!');
        setCustomMessage('');
        setSelectedTemplate('');
      
        // 텔레그램 전송 성공 시 대시보드 알림에도 추가
        const alertTitle = template?.title || '📝 사용자 지정 알림';
        const alertMessage = template?.message || customMessage;
        
        dashboardAlertManager.addAlert({
          type: 'system',
          level: 'medium',
          title: alertTitle,
          message: alertMessage,
          location: '시스템',
          sensorValue: 0,
          threshold: 0
        });
      
        // 성공 후 2초 뒤 모달 닫기
        setTimeout(() => {
          setIsOpen(false);
          setSendResult('');
        }, 2000);
      } else {
        setSendResult(`❌ 알림 전송 실패: ${result.error || '알 수 없는 오류'}`);
      }

    } catch (error: any) {
      setSendResult(`❌ 알림 전송 중 오류: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsSending(false);
    }
  };

  const selectedTemplateObject = notificationTemplates.find(t => t.id === selectedTemplate);

  return (
    <>
      {/* 알림 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${className}`}
      >
        📢 즉시 알림 보내기
      </button>

      {/* 알림 모달 */}
      {isOpen && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">📢 텔레그램 알림 전송</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            {/* 알림 템플릿 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                알림 템플릿 선택
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {notificationTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setCustomMessage('');
                    }}
                    className={`p-3 text-left rounded-lg border-2 transition-all duration-200 ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {template.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 사용자 지정 메시지 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                또는 직접 메시지 작성
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => {
                  setCustomMessage(e.target.value);
                  setSelectedTemplate('');
                }}
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="여기에 알림 메시지를 입력하세요..."
              />
            </div>

            {/* 미리보기 */}
            {(selectedTemplateObject || customMessage) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  전송 예정 메시지 미리보기
                </label>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {selectedTemplateObject ? 
                      selectedTemplateObject.message : 
                      customMessage || '메시지를 입력하거나 템플릿을 선택하세요.'
                    }
                  </pre>
                </div>
              </div>
            )}

            {/* 결과 메시지 */}
            {sendResult && (
              <div className={`mb-4 p-4 rounded-lg ${
                sendResult.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {sendResult}
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                disabled={isSending}
              >
                취소
              </button>
              <button
                onClick={handleSendNotification}
                disabled={isSending || (!selectedTemplateObject && !customMessage.trim())}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    전송 중...
                  </>
                ) : (
                  '📢 알림 보내기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
