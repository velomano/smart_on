'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFarms, getDevices, getSensors, getLatestSensorReadings, Farm, Device, Sensor, SensorReading, getSupabaseClient } from '../src/lib/supabase';
import { getCurrentUser, AuthUser, getTeams } from '../src/lib/auth';
import UserDashboard from '../src/components/UserDashboard';

export default function WebAdminDashboard() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

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

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        console.log('📊 대시보드 - 농장관리 페이지 연동 데이터 로드');
        
        const supabase = getSupabaseClient();
        
        // 농장관리 페이지에서 생성된 농장들만 조회 (is_dashboard_visible = true)
        let farmsQuery = supabase
          .from('farms')
          .select('*')
          .eq('is_dashboard_visible', true);
        
        // 권한별 필터링
        if (user.role === 'system_admin') {
          // 시스템 관리자: 모든 노출된 농장
          // 추가 필터 없음
        } else {
          // 농장장/팀원: 자신의 농장만
          const { data: memberships } = await supabase
            .from('farm_memberships')
            .select('farm_id')
            .eq('user_id', user.id);
          
          if (memberships && memberships.length > 0) {
            const farmIds = memberships.map(m => m.farm_id);
            farmsQuery = farmsQuery.in('id', farmIds);
          } else {
            // 멤버십이 없으면 빈 배열 반환
            setFarms([]);
            setDevices([]);
            setSensors([]);
            setSensorReadings([]);
            setLoading(false);
            return;
          }
        }
        
        const [farmsRes, devicesRes, sensorsRes, readingsRes] = await Promise.all([
          farmsQuery,
          supabase.from('devices').select('*').eq('type', 'sensor_gateway'),
          supabase.from('sensors').select('*'),
          supabase.from('sensor_readings').select('*').order('ts', { ascending: false }).limit(1000)
        ]);
        
        if (farmsRes.data) {
          const asArray = <T,>(v: T[] | null | undefined) => Array.isArray(v) ? v : [];
          const farmsList = asArray(farmsRes.data);
          const devicesList = asArray(devicesRes?.data);
          const sensorsList = asArray(sensorsRes?.data);
          const readingsList = asArray(readingsRes?.data);
          
          setFarms(farmsList as Farm[]);
          setDevices(devicesList as Device[]);
          setSensors(sensorsList as Sensor[]);
          setSensorReadings(readingsList as SensorReading[]);
          
          console.log('✅ 대시보드 - 농장관리 페이지 연동 완료:');
          console.log('  - 노출된 농장:', farmsList.length, '개');
          console.log('  - 베드:', devicesList.filter(d => (d as any)?.type === 'sensor_gateway').length, '개');
          console.log('  - 센서:', sensorsList.length, '개');
          console.log('  - 센서값:', readingsList.length, '개');
        } else {
          console.error('농장 데이터 로드 실패:', farmsRes.error);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // 로그인/권한 체크 완료
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <UserDashboard
      user={user}
      farms={farms}
      devices={devices}
      sensors={sensors}
      sensorReadings={sensorReadings}
    />
  );
}
