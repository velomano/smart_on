/**
 * 농장 목록 페이지
 * 
 * 사용자가 접근 가능한 농장 목록 표시
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppHeader from '@/components/AppHeader';

interface Farm {
  id: string;
  name: string;
  created_at: string;
  device_count?: number;
  online_count?: number;
}

export default function FarmsPage() {
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const supabase = createClient();
      
      // 1. 현재 사용자 조회
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // 2. 농장 목록 조회
      const { data: farmsData, error: farmsError } = await supabase
        .from('farms')
        .select('id, name, created_at')
        .order('name');

      if (farmsError) {
        throw farmsError;
      }

      // 3. 각 농장의 디바이스 수 조회
      const farmsWithDevices = await Promise.all(
        (farmsData || []).map(async (farm) => {
          const { count: deviceCount } = await supabase
            .from('iot_devices')
            .select('*', { count: 'exact', head: true })
            .eq('farm_id', farm.id);

          const { count: onlineCount } = await supabase
            .from('iot_devices')
            .select('*', { count: 'exact', head: true })
            .eq('farm_id', farm.id)
            .gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

          return {
            ...farm,
            device_count: deviceCount || 0,
            online_count: onlineCount || 0,
          };
        })
      );

      setFarms(farmsWithDevices);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading farms:', err);
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
            <p className="text-gray-600">농장 목록 로딩 중...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏭 농장 관리
          </h1>
          <p className="text-gray-600">
            IoT 디바이스 모니터링 및 제어
          </p>
        </div>

        {/* 농장 목록 */}
        {farms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <div className="text-6xl mb-4">🏭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              농장이 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              관리자에게 농장 접근 권한을 요청하세요.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm) => (
              <div
                key={farm.id}
                onClick={() => router.push(`/farms/${farm.id}`)}
                className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* 농장 아이콘 */}
                <div className="text-4xl mb-4">🏭</div>

                {/* 농장 이름 */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {farm.name}
                </h3>

                {/* 디바이스 정보 */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-semibold">{farm.device_count}</span> 디바이스
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      (farm.online_count || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`}></span>
                    <span className="font-semibold">{farm.online_count}</span> 온라인
                  </div>
                </div>

                {/* 생성일 */}
                <div className="text-xs text-gray-400">
                  생성: {new Date(farm.created_at).toLocaleDateString('ko-KR')}
                </div>

                {/* 화살표 */}
                <div className="mt-4 text-blue-600 font-semibold flex items-center">
                  상세보기 →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

