/**
 * 농장 상세 페이지 - IoT 디바이스 모니터링
 * 
 * Dynamic UI 시스템 사용
 * - Device Profile + Registry 기반 자동 UI 생성
 * - 롤백 스위치 지원 (환경 변수)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppHeader from '@/components/AppHeader';
import { FarmAutoDashboard } from '@/components/farm/FarmAutoDashboard';

interface Farm {
  id: string;
  name: string;
}

export default function FarmDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 롤백 스위치 (환경 변수)
  const forceLegacy = process.env.NEXT_PUBLIC_FORCE_LEGACY_DASHBOARD === '1';

  useEffect(() => {
    loadFarm();
  }, [params.id]);

  const loadFarm = async () => {
    try {
      const supabase = createClient();
      
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('id, name')
        .eq('id', params.id)
        .single();

      if (farmError) {
        throw farmError;
      }

      setFarm(farmData);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading farm:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">농장 정보 로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            ❌ {error}
          </div>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-600">농장을 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  // 롤백 모드 (레거시 대시보드)
  if (forceLegacy) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-yellow-900 mb-2">
              ⚠️ 레거시 모드
            </h2>
            <p className="text-yellow-800">
              NEXT_PUBLIC_FORCE_LEGACY_DASHBOARD=1로 설정되어 있습니다.
            </p>
            <p className="text-yellow-800 mt-2">
              레거시 대시보드 컴포넌트를 여기에 렌더링하세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dynamic UI 모드 (기본)
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/farms')}
              className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-1 text-sm"
            >
              ← 농장 목록
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {farm.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/connect')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              + 디바이스 연결
            </button>
          </div>
        </div>

        {/* Dynamic UI Dashboard */}
        <FarmAutoDashboard farmId={params.id} />
      </div>
    </div>
  );
}

