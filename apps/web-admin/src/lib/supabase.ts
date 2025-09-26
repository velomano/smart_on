// Supabase 클라이언트 설정
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Supabase 클라이언트 생성 함수 (mockAuth.ts에서 사용)
export const createClient = () => {
  return createClient(supabaseUrl, supabaseKey);
};

// 타입 정의
export interface Farm {
  id: string;
  tenant_id: string;
  name: string;
  location?: string;
  created_at: string;
}

export interface Device {
  id: string;
  farm_id: string;
  type: string;
  status?: {
    online: boolean;
  };
  meta?: Record<string, unknown>;
  created_at: string;
}

export interface Sensor {
  id: string;
  device_id: string;
  type: string;
  unit: string;
  created_at: string;
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  value: number;
  unit: string;
  ts: string;
  metadata?: Record<string, unknown>;
}

// API 함수들
export const getFarms = async (): Promise<Farm[]> => {
  // 개발 환경에서는 Mock 데이터 사용
  console.log('Using mock data for farms');
  return [
    {
      id: 'team-001',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      name: '1농장',
      location: '서울시 강남구',
      created_at: new Date().toISOString()
    },
    {
      id: 'team-002',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      name: '2농장',
      location: '서울시 서초구',
      created_at: new Date().toISOString()
    },
    {
      id: 'team-003',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      name: '3농장',
      location: '서울시 송파구',
      created_at: new Date().toISOString()
    }
  ];
};

export const getDevices = async (): Promise<Device[]> => {
  // Mock 데이터 반환
  return [];
};

export const getSensors = async (): Promise<Sensor[]> => {
  // Mock 데이터 반환
  return [];
};

export const getSensorReadings = async (): Promise<SensorReading[]> => {
  // Mock 데이터 반환
  return [];
};

export const getLatestSensorReadings = async (): Promise<SensorReading[]> => {
  // Mock 데이터 반환
  return [];
};