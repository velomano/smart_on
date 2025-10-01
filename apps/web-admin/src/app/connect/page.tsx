/**
 * Connect Wizard Page
 * 
 * 디바이스 연결 마법사
 * TODO: 완전한 마법사 플로우 구현
 */

'use client';

import { useState } from 'react';
import { ConnectWizard } from '@/components/connect/ConnectWizard';

export default function ConnectPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">
        🌉 디바이스 연결
      </h1>

      <ConnectWizard />
    </div>
  );
}

