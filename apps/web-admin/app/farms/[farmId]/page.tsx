'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppHeader from '@/components/AppHeader';
import FarmAutoDashboard from '@/components/farm/FarmAutoDashboard';

export default function FarmDetailPage({ params }: { params: Promise<{ farmId: string }> }) {
  const { farmId } = use(params);
  const router = useRouter();

  // 환경 변수로 레거시 대시보드 강제 사용 가능
  const forceLegacyDashboard = process.env.NEXT_PUBLIC_FORCE_LEGACY_DASHBOARD === 'true';

  if (forceLegacyDashboard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">레거시 대시보드 모드</h2>
            <p className="text-yellow-600">기존 농장 관리 페이지를 사용 중입니다.</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <FarmAutoDashboard farmId={farmId} />;
}