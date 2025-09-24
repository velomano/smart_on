'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFarms, getDevices, getSensors, getLatestSensorReadings, Farm, Device, Sensor, SensorReading } from '../lib/supabase';
import { getCurrentUser, AuthUser } from '../lib/mockAuth';
import UserDashboard from '../components/UserDashboard';

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
        const [farmsData, devicesData, sensorsData, readingsData] = await Promise.all([
          getFarms(),
          getDevices(),
          getSensors(),
          getLatestSensorReadings()
        ]);

        setFarms(farmsData);
        setDevices(devicesData);
        setSensors(sensorsData);
        setSensorReadings(readingsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // 사용자 역할에 따른 대시보드 렌더링
  if (user) {
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

  return null;
}