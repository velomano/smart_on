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
  try {
    const supabase = getSupabaseClient();
    const { data: farms, error } = await supabase
      .from('farms')
      .select('id, name, location, tenant_id, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getFarms 오류:', error);
      return [];
    }

    console.log('✅ getFarms 성공:', farms?.length || 0, '개 농장');
    return farms || [];
  } catch (error) {
    console.error('getFarms 예외:', error);
    return [];
  }
};

export const getDevices = async (): Promise<Device[]> => {
  // Supabase에서 실제 데이터 조회
  try {
    const supabase = getSupabaseClient();
    const { data: devices, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('devices 테이블 조회 실패:', error);
      return [];
    }

    console.log('✅ Supabase devices 데이터 조회 성공:', devices?.length || 0, '개');
    return devices || [];
  } catch (error) {
    console.error('getDevices 오류:', error);
    return [];
  }
};

export const getSensors = async (): Promise<Sensor[]> => {
  // Supabase에서 실제 데이터 조회
  try {
    const supabase = getSupabaseClient();
    const { data: sensors, error } = await supabase
      .from('sensors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('sensors 테이블 조회 실패:', error);
      return [];
    }

    console.log('✅ Supabase sensors 데이터 조회 성공:', sensors?.length || 0, '개');
    return sensors || [];
  } catch (error) {
    console.error('getSensors 오류:', error);
    return [];
  }
};

export const getSensorReadings = async (): Promise<SensorReading[]> => {
  // Supabase에서 실제 데이터 조회
  try {
    const supabase = getSupabaseClient();
    const { data: readings, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('ts', { ascending: false })
      .limit(1000); // 최근 1000개만

    if (error) {
      console.error('sensor_readings 테이블 조회 실패:', error);
      return [];
    }

    console.log('✅ Supabase sensor_readings 데이터 조회 성공:', readings?.length || 0, '개');
    return readings || [];
  } catch (error) {
    console.error('getSensorReadings 오류:', error);
    return [];
  }
};

export const getLatestSensorReadings = async (): Promise<SensorReading[]> => {
  // Supabase에서 최신 센서 읽기 데이터 조회
  try {
    const supabase = getSupabaseClient();
    const { data: readings, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('ts', { ascending: false })
      .limit(100); // 최신 100개만

    if (error) {
      console.error('sensor_readings 최신 데이터 조회 실패:', error);
      return [];
    }

    console.log('✅ Supabase 최신 sensor_readings 데이터 조회 성공:', readings?.length || 0, '개');
    return readings || [];
  } catch (error) {
    console.error('getLatestSensorReadings 오류:', error);
    return [];
  }
};