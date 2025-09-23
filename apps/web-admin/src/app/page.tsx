'use client';

import React, { useState, useEffect } from 'react';
import { getFarms, getDevices, getSensors, getLatestSensorReadings, Farm, Device, Sensor, SensorReading } from '../lib/supabase';

export default function WebAdminDashboard() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  // 통계 계산
  const totalFarms = farms.length;
  const totalBeds = devices.filter(d => d.type === 'sensor_gateway').length; // 센서 게이트웨이 개수
  const totalTeams = Math.ceil(totalBeds / 2); // 베드 2개당 1팀
  const averageTemp = sensorReadings
    .filter(r => r.unit === '°C')
    .slice(0, 10)
    .reduce((sum, r) => sum + r.value, 0) / Math.max(sensorReadings.filter(r => r.unit === '°C').length, 1) || 0;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🌱</span>
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  Smart Farm
                </h1>
                <p className="text-sm text-gray-500 font-medium">관리자 대시보드</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 font-medium">시스템 정상</span>
                </div>
                <div className="text-gray-400">|</div>
                <span className="text-gray-600">관리자</span>
              </div>
              <button className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2.5 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🏠</span>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      총 농장 수
                    </dt>
                    <dd className="text-3xl font-black text-gray-900">{totalFarms}</dd>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-blue-500 font-bold">+{Math.floor(totalFarms * 1.2)}</div>
                  <div className="text-xs text-gray-500">목표</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🌱</span>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      총 베드 수
                    </dt>
                    <dd className="text-3xl font-black text-gray-900">{totalBeds}</dd>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-green-500 font-bold">{Math.round((totalBeds / 100) * 100)}%</div>
                  <div className="text-xs text-gray-500">활성률</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      활성 팀 수
                    </dt>
                    <dd className="text-3xl font-black text-gray-900">{totalTeams}</dd>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-purple-500 font-bold">{totalTeams * 3}</div>
                  <div className="text-xs text-gray-500">총 인원</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-2xl rounded-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🌡️</span>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      평균 온도
                    </dt>
                    <dd className="text-3xl font-black text-gray-900">{averageTemp.toFixed(1)}°C</dd>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-orange-500 font-bold">적정</div>
                  <div className="text-xs text-gray-500">상태</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Farm Overview */}
        <div className="bg-white/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  🏡 농장 현황
                </h3>
                <p className="text-gray-600">전체 농장과 디바이스 상태를 한눈에 확인하세요</p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5">
                  + 새 농장
                </button>
              </div>
            </div>
            <div className="space-y-6">
              {farms.map((farm) => (
                <div key={farm.id} className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">🏠</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{farm.name}</h4>
                        <p className="text-gray-600 font-medium">📍 {farm.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-2xl font-black text-gray-900">
                          {devices.filter(d => d.farm_id === farm.id && d.type === 'sensor_gateway').length}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">디바이스</div>
                      </div>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {devices
                      .filter(d => d.farm_id === farm.id && d.type === 'sensor_gateway')
                      .map((device) => (
                        <div key={device.id} className="bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                                <span className="text-lg">📡</span>
                              </div>
                              <div>
                                <span className="font-bold text-gray-900">{device.meta?.location || '센서 게이트웨이'}</span>
                              </div>
                            </div>
                            <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                              device.status?.online 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              {device.status?.online ? '🟢 온라인' : '🔴 오프라인'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">
                              📊 센서 {sensors.filter(s => s.device_id === device.id).length}개
                            </span>
                            <button className="text-blue-600 hover:text-blue-800 font-semibold">
                              설정 →
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              {farms.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🏡</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">등록된 농장이 없습니다</h3>
                  <p className="text-gray-600 mb-6">첫 번째 농장을 등록해보세요</p>
                  <button className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200">
                    + 농장 등록하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  📈 최근 활동
                </h3>
                <p className="text-gray-600">실시간 센서 데이터와 시스템 활동을 확인하세요</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 font-medium">실시간</span>
                </div>
                <button className="text-blue-600 hover:text-blue-800 font-semibold">
                  전체보기 →
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {sensorReadings.slice(0, 5).map((reading) => {
                const sensor = sensors.find(s => s.id === reading.sensor_id);
                const device = devices.find(d => d.id === sensor?.device_id);
                const farm = farms.find(f => f.id === device?.farm_id);
                
                return (
                  <div key={reading.id} className="bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-xl">📊</span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {farm?.name} - {device?.meta?.location}
                          </div>
                          <div className="text-sm text-gray-600">
                            {sensor?.type} 센서 측정
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-gray-900">
                          {reading.value}{reading.unit}
                        </div>
                                <div className="text-xs text-gray-500 font-medium">
                                  {new Date(reading.ts).toLocaleString('ko-KR')}
                                </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {sensorReadings.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📊</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">최근 센서 데이터가 없습니다</h3>
                  <p className="text-gray-600 mb-6">센서 데이터가 수집되면 여기에 표시됩니다</p>
                  <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200">
                    센서 설정하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}