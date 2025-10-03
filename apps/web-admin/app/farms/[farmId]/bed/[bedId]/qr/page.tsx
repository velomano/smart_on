'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppHeader from '@/components/AppHeader';
import { getCurrentUser, AuthUser } from '@/lib/auth';

interface Bed {
  id: string;
  name: string;
  farm_id: string;
}

interface Farm {
  id: string;
  name: string;
}

export default function BedQRPage() {
  const params = useParams();
  const farmId = params.farmId as string;
  const bedId = params.bedId as string;
  
  const [bed, setBed] = useState<Bed | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string>('');

  const supabase = createClient();

  useEffect(() => {
    fetchData();
    fetchUserData();
  }, [farmId, bedId]);

  const fetchUserData = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // 농장 정보 조회
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('*')
        .eq('id', farmId)
        .single();

      if (farmError) throw farmError;
      setFarm(farmData);

      // 베드 정보 조회
      const { data: bedData, error: bedError } = await supabase
        .from('beds')
        .select('*')
        .eq('id', bedId)
        .eq('farm_id', farmId)
        .single();

      if (bedError) throw bedError;
      setBed(bedData);

      // QR 코드 생성 (베드 연결 정보 포함)
      const connectionData = {
        farmId,
        bedId,
        farmName: farmData.name,
        bedName: bedData.name,
        timestamp: new Date().toISOString(),
        type: 'bed_connection'
      };

      const qrData = JSON.stringify(connectionData);
      setQrCode(qrData);

    } catch (error) {
      console.error('데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyConnectionInfo = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      alert('연결 정보가 클립보드에 복사되었습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={user || undefined} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">QR 코드를 생성하는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bed || !farm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={user || undefined} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">베드를 찾을 수 없습니다</h2>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user || undefined} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">베드 연결 QR 코드</h1>
            <p className="text-gray-600">
              <span className="font-medium">{farm.name}</span> - <span className="font-medium">{bed.name}</span>
            </p>
          </div>

          {/* QR 코드 영역 */}
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-sm text-gray-500">QR 코드</p>
                  <p className="text-xs text-gray-400 mt-1">모바일 앱에서 스캔하여 연결</p>
                </div>
              </div>
            </div>

            {/* 연결 정보 */}
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between">
                <span>농장:</span>
                <span className="font-medium">{farm.name}</span>
              </div>
              <div className="flex justify-between">
                <span>베드:</span>
                <span className="font-medium">{bed.name}</span>
              </div>
              <div className="flex justify-between">
                <span>베드 ID:</span>
                <span className="font-mono text-xs">{bed.id}</span>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              <button
                onClick={copyConnectionInfo}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📋 연결 정보 복사
              </button>
              
              <button
                onClick={() => window.close()}
                className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                닫기
              </button>
            </div>
          </div>

          {/* 사용 안내 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📱 사용 방법</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. 모바일 앱을 실행합니다</li>
              <li>2. QR 코드 스캔 기능을 사용합니다</li>
              <li>3. 이 QR 코드를 스캔하여 베드에 연결합니다</li>
              <li>4. 또는 "연결 정보 복사" 버튼을 눌러 수동으로 입력합니다</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
