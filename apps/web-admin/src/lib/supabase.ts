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
      id: '00000000-0000-0000-0000-000000000001',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      name: '1농장',
      location: '서울시 강남구',
      created_at: new Date().toISOString()
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      name: '2농장',
      location: '서울시 서초구',
      created_at: new Date().toISOString()
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      name: '3농장',
      location: '서울시 송파구',
      created_at: new Date().toISOString()
    }
  ];
};

export const getDevices = async (): Promise<Device[]> => {
  // Mock 데이터 반환 - 베드 정보
  return [
    {
      id: 'bed-001',
      name: '1농장 A베드',
      type: 'sensor_gateway',
      status: { online: true, brightness: 80 },
      farm_id: '00000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString()
    },
    {
      id: 'bed-002',
      name: '1농장 B베드',
      type: 'sensor_gateway',
      status: { online: true, brightness: 60 },
      farm_id: '00000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString()
    },
    {
      id: 'bed-003',
      name: '2농장 A베드',
      type: 'sensor_gateway',
      status: { online: false, brightness: 0 },
      farm_id: '00000000-0000-0000-0000-000000000002',
      created_at: new Date().toISOString()
    },
    {
      id: 'bed-004',
      name: '2농장 B베드',
      type: 'sensor_gateway',
      status: { online: true, brightness: 70 },
      farm_id: '00000000-0000-0000-0000-000000000002',
      created_at: new Date().toISOString()
    },
    {
      id: 'bed-005',
      name: '3농장 A베드',
      type: 'sensor_gateway',
      status: { online: true, brightness: 90 },
      farm_id: '00000000-0000-0000-0000-000000000003',
      created_at: new Date().toISOString()
    },
    {
      id: 'bed-006',
      name: '3농장 B베드',
      type: 'sensor_gateway',
      status: { online: true, brightness: 50 },
      farm_id: '00000000-0000-0000-0000-000000000003',
      created_at: new Date().toISOString()
    }
  ];
};

export const getSensors = async (): Promise<Sensor[]> => {
  // Mock 데이터 반환 - 센서 정보
  return [
    {
      id: 'sensor-001',
      name: '온도센서',
      type: 'temperature',
      unit: '°C',
      device_id: 'bed-001',
      value: 24.5,
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 'sensor-002',
      name: '습도센서',
      type: 'humidity',
      unit: '%',
      device_id: 'bed-001',
      value: 65.2,
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 'sensor-003',
      name: 'pH센서',
      type: 'ph',
      unit: 'pH',
      device_id: 'bed-001',
      value: 6.8,
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 'sensor-004',
      name: 'EC센서',
      type: 'ec',
      unit: 'mS/cm',
      device_id: 'bed-001',
      value: 1.8,
      status: 'active',
      created_at: new Date().toISOString()
    }
  ];
};

export const getSensorReadings = async (): Promise<SensorReading[]> => {
  // Mock 데이터 반환 - 센서 읽기 데이터
  return [
    {
      id: 'reading-001',
      sensor_id: 'sensor-001',
      value: 24.5,
      unit: '°C',
      timestamp: new Date().toISOString(),
      metadata: {}
    },
    {
      id: 'reading-002',
      sensor_id: 'sensor-002',
      value: 65.2,
      unit: '%',
      timestamp: new Date().toISOString(),
      metadata: {}
    },
    {
      id: 'reading-003',
      sensor_id: 'sensor-003',
      value: 6.8,
      unit: 'pH',
      timestamp: new Date().toISOString(),
      metadata: {}
    },
    {
      id: 'reading-004',
      sensor_id: 'sensor-004',
      value: 1.8,
      unit: 'mS/cm',
      timestamp: new Date().toISOString(),
      metadata: {}
    }
  ];
};

export const getLatestSensorReadings = async (): Promise<SensorReading[]> => {
  // Mock 데이터 반환 - 최신 센서 읽기 데이터
  return [
    {
      id: 'reading-001',
      sensor_id: 'sensor-001',
      value: 24.5,
      unit: '°C',
      timestamp: new Date().toISOString(),
      metadata: {}
    },
    {
      id: 'reading-002',
      sensor_id: 'sensor-002',
      value: 65.2,
      unit: '%',
      timestamp: new Date().toISOString(),
      metadata: {}
    },
    {
      id: 'reading-003',
      sensor_id: 'sensor-003',
      value: 6.8,
      unit: 'pH',
      timestamp: new Date().toISOString(),
      metadata: {}
    },
    {
      id: 'reading-004',
      sensor_id: 'sensor-004',
      value: 1.8,
      unit: 'mS/cm',
      timestamp: new Date().toISOString(),
      metadata: {}
    }
  ];
};