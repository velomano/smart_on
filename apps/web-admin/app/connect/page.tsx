/**
 * Connect Wizard Page
 * 
 * 통합된 디바이스 연결 마법사
 * - Web Serial, Web Bluetooth, MQTT-WS 빠른 테스트
 * - 성공 시 자동 프로비저닝
 */

'use client';

import { useState } from 'react';
import { ConnectWizard } from '@/components/connect/ConnectWizard';
import AppHeader from '@/components/AppHeader';

export default function ConnectPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🌉 디바이스 연결 마법사
            </h1>
            <p className="text-lg text-gray-600">
              IoT 디바이스를 쉽고 빠르게 연결하세요
            </p>
          </div>

          <ConnectWizard />
        </div>
      </div>
    </div>
  );
}

