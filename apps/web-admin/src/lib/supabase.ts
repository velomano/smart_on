// Supabase 클라이언트 설정
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 싱글톤 클라이언트 인스턴스들
let supabaseClient: ReturnType<typeof createClient> | null = null;
let serviceClient: ReturnType<typeof createClient> | null = null;

// 일반 클라이언트 (싱글톤)
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
};

// 서비스 클라이언트 (싱글톤)
export const getServiceClient = () => {
  if (!serviceClient && serviceKey) {
    serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return serviceClient;
};

// 기존 호환성을 위한 export
export const supabase = getSupabaseClient();

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