'use client';

import React, { useState, useEffect } from 'react';

interface DualTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  actuatorName: string;
  deviceId: string;
  currentDualTime: any;
  onDualTimeChange: (deviceId: string, dualTime: any) => void;
}

export default function DualTimeModal({ 
  isOpen, 
  onClose, 
  actuatorName, 
  deviceId, 
  currentDualTime, 
  onDualTimeChange 
}: DualTimeModalProps) {
  const [dualTime, setDualTime] = useState({
    enabled: false,
    onDuration: 30, // 분
    offDuration: 30, // 분
    startTime: '08:00'
  });

  useEffect(() => {
    if (currentDualTime) {
      setDualTime(currentDualTime);
    }
  }, [currentDualTime]);

  const handleSave = () => {
    onDualTimeChange(deviceId, dualTime);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            🔄 {actuatorName} 듀얼타임 설정
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* 듀얼타임 활성화 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">듀얼타임 활성화</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dualTime.enabled}
                onChange={(e) => setDualTime(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* 시작 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작 시간
            </label>
            <input
              type="time"
              value={dualTime.startTime}
              onChange={(e) => setDualTime(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base text-gray-900"
            />
          </div>

          {/* 켜기/끄기 시간 설정 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                켜기 시간 (분)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={dualTime.onDuration}
                  onChange={(e) => setDualTime(prev => ({ ...prev, onDuration: parseInt(e.target.value) || 1 }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base text-gray-900 font-medium"
                />
                <span className="text-sm text-gray-500 font-medium">분</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                끄기 시간 (분)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={dualTime.offDuration}
                  onChange={(e) => setDualTime(prev => ({ ...prev, offDuration: parseInt(e.target.value) || 1 }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base text-gray-900 font-medium"
                />
                <span className="text-sm text-gray-500 font-medium">분</span>
              </div>
            </div>
          </div>

          {/* 사이클 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">사이클 정보</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 1사이클: {dualTime.onDuration}분 켜기 + {dualTime.offDuration}분 끄기</p>
              <p>• 총 사이클 시간: {dualTime.onDuration + dualTime.offDuration}분</p>
              <p>• 하루 사이클 수: {Math.floor(24 * 60 / (dualTime.onDuration + dualTime.offDuration))}회</p>
            </div>
          </div>

          {/* 미리보기 */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">설정 미리보기</h4>
            <div className="text-sm text-gray-600">
              <p>• {dualTime.enabled ? '활성화됨' : '비활성화됨'}</p>
              {dualTime.enabled && (
                <>
                  <p>• 시작 시간: {dualTime.startTime}</p>
                  <p>• 켜기: {dualTime.onDuration}분, 끄기: {dualTime.offDuration}분</p>
                  <p>• 반복 사이클로 작동</p>
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
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
