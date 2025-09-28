'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFarms, getDevices, getSensors, getLatestSensorReadings, Farm, Device, Sensor, SensorReading } from '../src/lib/supabase';
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
        console.log('📊 대시보드 - 농장관리 페이지 데이터 읽기 전용 로드');
        
        // 농장관리 페이지와 동일한 데이터 소스 사용 (읽기 전용)
        const farmsResult = await getTeams();
        
        if (farmsResult.success) {
          setFarms(farmsResult.teams); // getTeams는 teams 필드 반환
          setDevices(farmsResult.devices);
          setSensors(farmsResult.sensors);
          setSensorReadings(farmsResult.sensorReadings);
          
          console.log('✅ 대시보드 - 농장관리 데이터 동기화 완료:');
          console.log('  - 농장:', farmsResult.teams.length, '개');
          console.log('  - 베드:', farmsResult.devices.filter(d => d.type === 'sensor_gateway').length, '개');
          console.log('  - 센서:', farmsResult.sensors.length, '개');
          console.log('  - 센서값:', farmsResult.sensorReadings.length, '개');
        } else {
          console.error('농장 데이터 로드 실패');
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
