'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppHeader from '@/components/AppHeader';

interface Farm {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      
      // 환경변수 체크 - 더 안전한 방법
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'https://placeholder.supabase.co' ||
          supabaseUrl.includes('placeholder') ||
          supabaseKey === 'placeholder-key') {
        console.log('Supabase 환경변수가 설정되지 않았습니다. Mock 데이터를 사용합니다.');
        setFarms([
          { id: '1', name: '테스트 농장 1', description: 'Mock 데이터', created_at: new Date().toISOString() },
          { id: '2', name: '테스트 농장 2', description: 'Mock 데이터', created_at: new Date().toISOString() }
        ]);
        return;
      }
      
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFarms(data || []);

    } catch (err: any) {
      console.error('Supabase 연결 오류:', err);
      // Supabase 연결 실패 시 Mock 데이터 사용
      setFarms([
        { id: '1', name: '테스트 농장 1', description: 'Mock 데이터 (연결 실패)', created_at: new Date().toISOString() },
        { id: '2', name: '테스트 농장 2', description: 'Mock 데이터 (연결 실패)', created_at: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">농장 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">농장 관리</h1>
          <button
            onClick={() => router.push('/connect')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            디바이스 연결
          </button>
        </div>

        {farms.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">등록된 농장이 없습니다</h3>
            <p className="text-gray-600 mb-4">새로운 농장을 생성하여 IoT 디바이스를 관리하세요.</p>
            <button
              onClick={() => router.push('/farms/new')}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              농장 생성하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/farms/${farm.id}`)}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{farm.name}</h3>
                  {farm.description && (
                    <p className="text-gray-600 mb-4">{farm.description}</p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>생성일: {new Date(farm.created_at).toLocaleDateString('ko-KR')}</span>
                    <span className="text-blue-600 hover:text-blue-700">자세히 보기 →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}