'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, AuthUser } from '../../src/lib/auth';
import AppHeader from '../../src/components/AppHeader';

// KAMIS API 타입 정의
interface KamisPriceData {
  product_cls_code: string;
  product_cls_name: string;
  category_code: string;
  category_name: string;
  productno: string;
  lastest_date: string;
  productName: string;
  item_name: string;
  unit: string;
  day1: string;
  dpr1: string;
  day2: string;
  dpr2: string;
  day3: string;
  dpr3: string;
  day4: string;
  dpr4: string;
  direction: string;
  value: string;
  result_code: string;
}


export default function MarketPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 시세 데이터 상태
  const [priceData, setPriceData] = useState<KamisPriceData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // KAMIS API 설정
  const KAMIS_API_KEY = '7915f44b-74c4-4f20-91cb-b30bc1f5aed2';
  const KAMIS_API_ID = 'smartfarm';
  
  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.is_approved || !currentUser.is_active) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
    };
    checkAuth();
  }, [router]);

  // 시세 데이터 로드
  const loadPriceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('KAMIS API 호출 시도 (Next.js API Routes 사용)');
      
      // Next.js API Routes 호출
      const response = await fetch('/api/market-prices?action=dailySalesList', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'KAMIS API 호출 실패');
      }
      
      // KAMIS API 응답 데이터 처리
      const kamisData = data.data;
      console.log('KAMIS API 응답 구조:', kamisData);
      
      // KAMIS API 응답 구조 확인
      if (kamisData && kamisData.error_code === '000') {
        // KAMIS API 성공 응답 - price 배열에 데이터가 있음
        const priceData = kamisData.price || [];
        setPriceData(priceData);
        setError(null);
        console.log('KAMIS API 호출 성공:', priceData.length, '개 품목');
        
        // 품목명 확인을 위한 로깅
        console.log('전체 품목 목록:', priceData.map((item: any) => item.productName || item.item_name).slice(0, 20));
        
        // 양상추 검색
        const lettuceItems = priceData.filter((item: any) => 
          (item.productName && item.productName.includes('양상추')) ||
          (item.item_name && item.item_name.includes('양상추')) ||
          (item.productName && item.productName.includes('상추')) ||
          (item.item_name && item.item_name.includes('상추'))
        );
        console.log('양상추/상추 관련 품목:', lettuceItems);
        
      } else if (kamisData && kamisData.error_code) {
        // KAMIS API에서 에러 응답
        console.error('KAMIS API 에러:', kamisData);
        throw new Error(kamisData.message || `KAMIS API 에러 (코드: ${kamisData.error_code})`);
      } else {
        // 응답 구조가 예상과 다름
        console.error('예상과 다른 응답 구조:', kamisData);
        throw new Error('KAMIS API 응답 구조가 예상과 다릅니다');
      }
      
    } catch (err: any) {
      console.error('시세 데이터 로드 오류:', err);
      setError(`시세 데이터를 불러올 수 없습니다: ${err.message}`);
      
      // 에러 발생 시 Mock 데이터로 대체
      const mockData = [
        {
          product_cls_code: '01',
          product_cls_name: '소매',
          category_code: '100',
          category_name: '채소',
          productno: '101',
          lastest_date: '2024-01-15',
          productName: '토마토',
          item_name: '토마토',
          unit: 'kg',
          day1: '2024-01-15',
          dpr1: '8500',
          day2: '2024-01-14',
          dpr2: '8200',
          day3: '2024-01-01',
          dpr3: '7800',
          day4: '2023-01-15',
          dpr4: '7200',
          direction: '1',
          value: '3.7',
          result_code: '000'
        },
        {
          product_cls_code: '01',
          product_cls_name: '소매',
          category_code: '100',
          category_name: '채소',
          productno: '102',
          lastest_date: '2024-01-15',
          productName: '오이',
          item_name: '오이',
          unit: 'kg',
          day1: '2024-01-15',
          dpr1: '3200',
          day2: '2024-01-14',
          dpr2: '3100',
          day3: '2024-01-01',
          dpr3: '2900',
          day4: '2023-01-15',
          dpr4: '2800',
          direction: '1',
          value: '3.2',
          result_code: '000'
        },
        {
          product_cls_code: '01',
          product_cls_name: '소매',
          category_code: '200',
          category_name: '과일',
          productno: '201',
          lastest_date: '2024-01-15',
          productName: '사과',
          item_name: '사과',
          unit: 'kg',
          day1: '2024-01-15',
          dpr1: '4500',
          day2: '2024-01-14',
          dpr2: '4400',
          day3: '2024-01-01',
          dpr3: '4200',
          day4: '2023-01-15',
          dpr4: '4000',
          direction: '1',
          value: '2.3',
          result_code: '000'
        }
      ];
      
      setPriceData(mockData);
      setError(`API 호출 실패로 Mock 데이터를 표시합니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };



  // 초기 데이터 로드
  useEffect(() => {
    if (user) {
      loadPriceData();
    }
  }, [user]);


  // 필터링된 데이터
  const filteredData = priceData.filter(item => {
    const searchTermLower = searchTerm.toLowerCase();
    const productName = (item.productName || '').toLowerCase();
    const itemName = (item.item_name || '').toLowerCase();
    
    // 다양한 검색어 매칭
    const matchesSearch = productName.includes(searchTermLower) ||
                         itemName.includes(searchTermLower) ||
                         // 버터헤드 관련 검색어들
                         (searchTermLower.includes('버터') && (productName.includes('상추') || itemName.includes('상추'))) ||
                         (searchTermLower.includes('헤드') && (productName.includes('상추') || itemName.includes('상추'))) ||
                         (searchTermLower.includes('양상추') && (productName.includes('상추') || itemName.includes('상추'))) ||
                         (searchTermLower.includes('적상추') && (productName.includes('적') || itemName.includes('적'))) ||
                         (searchTermLower.includes('청상추') && (productName.includes('청') || itemName.includes('청')));
    
    const matchesCategory = selectedCategory === 'all' || item.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 카테고리 목록
  const categories = ['all', ...Array.from(new Set(priceData.map(item => item.category_name)))];

  // 가격 변화 방향 아이콘
  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case '0': return '📉'; // 하락
      case '1': return '📈'; // 상승
      case '2': return '➡️'; // 등락없음
      default: return '❓';
    }
  };

  // 가격 변화 색상
  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case '0': return 'text-red-600';
      case '1': return 'text-green-600';
      case '2': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <AppHeader
        user={user}
        title="시세정보"
        subtitle="농산물 시세 정보와 가격 추이를 확인하세요"
        showBackButton={true}
        backButtonText="대시보드"
        onBackClick={() => router.push('/')}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto pt-4 pb-8 sm:px-6 lg:px-8 relative z-10">
        {/* Overview Section */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-300 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <span className="text-3xl">📊</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">시세 정보</h1>
                <p className="text-white/90 text-lg">농산물 시세 정보와 가격 추이를 확인하세요</p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8">
            {/* 검색 및 필터 */}
            <div className="bg-white/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="농산물명을 검색하세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg text-gray-900"
              >
                <option value="all">전체 카테고리</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <button
              onClick={loadPriceData}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로딩중...' : '새로고침'}
            </button>
          </div>
        </div>

        {/* 정보 메시지 */}
        {error && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <span className="text-blue-500 text-xl mr-2">ℹ️</span>
              <span className="text-blue-700">{error}</span>
            </div>
          </div>
        )}

        {/* 시세 데이터 테이블 */}
        <div className="bg-white/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">📊 실시간 시세 정보</h3>
            <p className="text-gray-600 mt-1">주요 농산물의 최신 가격 정보</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">품목</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">카테고리</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">단위</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">최근가격</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">1일전</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">1개월전</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">1년전</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">등락</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {item.category_name === '채소' ? '🥬' : 
                           item.category_name === '과일' ? '🍎' : 
                           item.category_name === '곡물' ? '🌾' : '🌱'}
                        </span>
                        <div>
                          <div className="font-semibold text-gray-900">{item.productName}</div>
                          <div className="text-sm text-gray-500">{item.item_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.category_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.unit}</td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-gray-900">
                        {(parseInt(item.dpr1) * 1000).toLocaleString()}원
                        <span className="text-sm text-gray-500 ml-1">/{item.unit}</span>
                      </div>
                      <div className="text-xs text-gray-500">{item.day1}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(parseInt(item.dpr2) * 1000).toLocaleString()}원
                      <span className="text-xs text-gray-500">/{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(parseInt(item.dpr3) * 1000).toLocaleString()}원
                      <span className="text-xs text-gray-500">/{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(parseInt(item.dpr4) * 1000).toLocaleString()}원
                      <span className="text-xs text-gray-500">/{item.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{getDirectionIcon(item.direction)}</span>
                        <span className={`font-semibold ${getDirectionColor(item.direction)}`}>
                          {item.direction === '0' ? '-' : item.direction === '1' ? '+' : ''}{item.value}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}
