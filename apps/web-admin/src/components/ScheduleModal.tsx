'use client';

import React, { useState, useEffect } from 'react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  actuatorName: string;
  deviceId: string;
  currentSchedule: any;
  onScheduleChange: (deviceId: string, schedule: any) => void;
}

export default function ScheduleModal({ 
  isOpen, 
  onClose, 
  actuatorName, 
  deviceId, 
  currentSchedule, 
  onScheduleChange 
}: ScheduleModalProps) {
  const [schedule, setSchedule] = useState({
    enabled: false,
    days: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    onTime: '08:00',
    offTime: '18:00'
  });

  useEffect(() => {
    if (currentSchedule) {
      setSchedule(currentSchedule);
    }
  }, [currentSchedule]);

  const handleDayChange = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: !prev.days[day as keyof typeof prev.days]
      }
    }));
  };

  const handleSave = () => {
    onScheduleChange(deviceId, schedule);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            📅 {actuatorName} 스케줄링 설정
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* 스케줄 활성화 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">스케줄링 활성화</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(e) => setSchedule(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 요일 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              작동 요일
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(schedule.days).map(([day, checked]) => (
                <label key={day} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleDayChange(day)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {day === 'monday' ? '월' :
                     day === 'tuesday' ? '화' :
                     day === 'wednesday' ? '수' :
                     day === 'thursday' ? '목' :
                     day === 'friday' ? '금' :
                     day === 'saturday' ? '토' : '일'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 시간 설정 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                켜기 시간
              </label>
              <input
                type="time"
                value={schedule.onTime}
                onChange={(e) => setSchedule(prev => ({ ...prev, onTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                끄기 시간
              </label>
              <input
                type="time"
                value={schedule.offTime}
                onChange={(e) => setSchedule(prev => ({ ...prev, offTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
              />
            </div>
          </div>

          {/* 미리보기 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">설정 미리보기</h4>
            <div className="text-sm text-gray-600">
              <p>• {schedule.enabled ? '활성화됨' : '비활성화됨'}</p>
              {schedule.enabled && (
                <>
                  <p>• 작동 요일: {Object.entries(schedule.days)
                    .filter(([_, checked]) => checked)
                    .map(([day, _]) => 
                      day === 'monday' ? '월' :
                      day === 'tuesday' ? '화' :
                      day === 'wednesday' ? '수' :
                      day === 'thursday' ? '목' :
                      day === 'friday' ? '금' :
                      day === 'saturday' ? '토' : '일'
                    ).join(', ') || '없음'}</p>
                  <p>• 작동 시간: {schedule.onTime} ~ {schedule.offTime}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
