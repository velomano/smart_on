'use client';

import React from 'react';

interface ActuatorControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  actuatorName: string;
  deviceId: string;
  currentStatus: boolean;
  onStatusChange: (deviceId: string, status: boolean) => void;
}

export default function ActuatorControlModal({ 
  isOpen, 
  onClose, 
  actuatorName, 
  deviceId, 
  currentStatus, 
  onStatusChange
}: ActuatorControlModalProps) {
  const handleStatusChange = (status: boolean) => {
    onStatusChange(deviceId, status);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            🔧 {actuatorName} 수동 제어
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* 현재 상태 */}
          <div className="text-center">
            <div className="text-4xl mb-2">
              {currentStatus ? '🟢' : '🔴'}
            </div>
            <p className="text-lg font-medium text-gray-700">
              현재 상태: {currentStatus ? '켜짐' : '꺼짐'}
            </p>
          </div>

          {/* 제어 버튼 */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleStatusChange(true)}
              className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                currentStatus 
                  ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                  : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              켜기
            </button>
            <button
              onClick={() => handleStatusChange(false)}
              className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                !currentStatus 
                  ? 'bg-red-100 text-red-700 border-2 border-red-300' 
                  : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              끄기
            </button>
          </div>

          {/* 상태 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">제어 정보</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 수동 제어 모드</p>
              <p>• 즉시 반영됩니다</p>
              <p>• 스케줄링이나 듀얼타임 설정은 별도 모달에서 가능합니다</p>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}