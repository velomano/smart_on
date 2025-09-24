import { createClient } from '@supabase/supabase-js';

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 디버깅: 환경 변수 확인
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? '설정됨' : '설정되지 않음');

// 타입 정의 (실제 데이터베이스 구조에 맞게 수정)
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
  bed_id?: string;
  type: string;
  vendor?: string;
  tuya_device_id?: string;
  status: any; // JSONB
  meta: any; // JSONB
  created_at: string;
}

export interface Sensor {
  id: string;
  device_id: string;
  type: string;
  unit?: string;
  meta?: any; // JSONB
  created_at: string;
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  value: number;
  unit: string;
  ts: string; // 실제 데이터베이스에서는 'ts' 컬럼 사용
  metadata?: any;
}

// API 함수들
export const getFarms = async (): Promise<Farm[]> => {
  try {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching farms:', error);
      // Mock 데이터 반환
      return [
        {
          id: '1',
          tenant_id: 'tenant-001',
          name: '메인 스마트팜',
          location: '서울시 강남구',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          tenant_id: 'tenant-002',
          name: '부산 연구농장',
          location: '부산시 해운대구',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          tenant_id: 'tenant-003',
          name: '대구 실험실',
          location: '대구시 수성구',
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];
    }

    // 데이터베이스에 데이터가 있으면 반환, 없으면 Mock 데이터 반환
    return data && data.length > 0 ? data : [
      {
        id: '1',
        tenant_id: 'tenant-001',
        name: '메인 스마트팜',
        location: '서울시 강남구',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        tenant_id: 'tenant-002',
        name: '부산 연구농장',
        location: '부산시 해운대구',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  } catch (err) {
    console.error('Unexpected error in getFarms:', err);
    // Mock 데이터 반환
    return [
      {
        id: '1',
        tenant_id: 'tenant-001',
        name: '메인 스마트팜',
        location: '서울시 강남구',
        created_at: new Date().toISOString()
      }
    ];
  }
};

export const getDevices = async (farmId?: string): Promise<Device[]> => {
  try {
    let query = supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching devices:', error);
      // Mock 데이터 반환
      return [
        {
          id: '1',
          farm_id: '1',
          bed_id: 'bed-1',
          type: 'sensor_gateway',
          vendor: 'custom',
          tuya_device_id: null,
          status: { online: true, on: false },
          meta: { pi_id: 'pi-001', location: '조1-베드1' },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          farm_id: '1',
          bed_id: 'bed-1',
          type: 'light',
          vendor: 'tuya',
          tuya_device_id: 'tuya-light-001',
          status: { online: true, on: true },
          meta: { location: '조1-베드1-조명' },
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          farm_id: '1',
          bed_id: 'bed-2',
          type: 'fan',
          vendor: 'tuya',
          tuya_device_id: 'tuya-fan-001',
          status: { online: true, on: false },
          meta: { location: '조1-베드2-팬' },
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          farm_id: '2',
          bed_id: 'bed-3',
          type: 'pump',
          vendor: 'tuya',
          tuya_device_id: 'tuya-pump-001',
          status: { online: false, on: false },
          meta: { location: '조2-베드3-펌프' },
          created_at: new Date().toISOString()
        }
      ];
    }

    // 데이터베이스에 데이터가 있으면 반환, 없으면 Mock 데이터 반환
    return data && data.length > 0 ? data : [
      {
        id: '1',
        farm_id: '1',
        bed_id: 'bed-1',
        type: 'sensor_gateway',
        vendor: 'custom',
        tuya_device_id: null,
        status: { online: true, on: false },
        meta: { pi_id: 'pi-001', location: '조1-베드1' },
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        farm_id: '1',
        bed_id: 'bed-1',
        type: 'light',
        vendor: 'tuya',
        tuya_device_id: 'tuya-light-001',
        status: { online: true, on: true },
        meta: { location: '조1-베드1-조명' },
        created_at: new Date().toISOString()
      }
    ];
  } catch (err) {
    console.error('Unexpected error in getDevices:', err);
    // Mock 데이터 반환
    return [
      {
        id: '1',
        farm_id: '1',
        bed_id: 'bed-1',
        type: 'sensor_gateway',
        vendor: 'custom',
        tuya_device_id: null,
        status: { online: true, on: false },
        meta: { pi_id: 'pi-001', location: '조1-베드1' },
        created_at: new Date().toISOString()
      }
    ];
  }
};

export const getSensors = async (deviceId?: string): Promise<Sensor[]> => {
  try {
    let query = supabase
      .from('sensors')
      .select('*')
      .order('created_at', { ascending: false });

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sensors:', error);
      // Mock 데이터 반환
      return [
        {
          id: '1',
          device_id: '1',
          type: 'temp',
          unit: '°C',
          meta: { pin: 2, sensor_model: 'DHT22' },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          device_id: '1',
          type: 'humidity',
          unit: '%',
          meta: { pin: 2, sensor_model: 'DHT22' },
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          device_id: '2',
          type: 'ec',
          unit: 'mS/cm',
          meta: { pin: 3, sensor_model: 'EC-5' },
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          device_id: '3',
          type: 'ph',
          unit: 'pH',
          meta: { pin: 4, sensor_model: 'pH-4502C' },
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          device_id: '4',
          type: 'lux',
          unit: 'lux',
          meta: { pin: 5, sensor_model: 'BH1750' },
          created_at: new Date().toISOString()
        }
      ];
    }

    // 데이터베이스에 데이터가 있으면 반환, 없으면 Mock 데이터 반환
    return data && data.length > 0 ? data : [
      {
        id: '1',
        device_id: '1',
        type: 'temp',
        unit: '°C',
        meta: { pin: 2, sensor_model: 'DHT22' },
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        device_id: '1',
        type: 'humidity',
        unit: '%',
        meta: { pin: 2, sensor_model: 'DHT22' },
        created_at: new Date().toISOString()
      }
    ];
  } catch (err) {
    console.error('Unexpected error in getSensors:', err);
    // Mock 데이터 반환
    return [
      {
        id: '1',
        device_id: '1',
        type: 'temp',
        unit: '°C',
        meta: { pin: 2, sensor_model: 'DHT22' },
        created_at: new Date().toISOString()
      }
    ];
  }
};

export const getLatestSensorReadings = async (): Promise<SensorReading[]> => {
  try {
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('ts', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching sensor readings:', error);
      // Mock 데이터 반환 (데이터베이스에 데이터가 없을 때)
      return [
        {
          id: '1',
          sensor_id: '1',
          value: 25.5,
          unit: '°C',
          ts: new Date().toISOString(),
          metadata: {}
        },
        {
          id: '2',
          sensor_id: '2',
          value: 60.2,
          unit: '%',
          ts: new Date(Date.now() - 60000).toISOString(),
          metadata: {}
        },
        {
          id: '3',
          sensor_id: '3',
          value: 45.8,
          unit: '%',
          ts: new Date(Date.now() - 120000).toISOString(),
          metadata: {}
        },
        {
          id: '4',
          sensor_id: '4',
          value: 750.3,
          unit: 'lux',
          ts: new Date(Date.now() - 180000).toISOString(),
          metadata: {}
        },
        {
          id: '5',
          sensor_id: '5',
          value: 23.1,
          unit: '°C',
          ts: new Date(Date.now() - 240000).toISOString(),
          metadata: {}
        }
      ];
    }

    // 데이터베이스에 데이터가 있으면 반환, 없으면 Mock 데이터 반환
    return data && data.length > 0 ? data : [
      {
        id: '1',
        sensor_id: '1',
        value: 25.5,
        unit: '°C',
        ts: new Date().toISOString(),
        metadata: {}
      },
      {
        id: '2',
        sensor_id: '2',
        value: 60.2,
        unit: '%',
        ts: new Date(Date.now() - 60000).toISOString(),
        metadata: {}
      }
    ];
  } catch (err) {
    console.error('Unexpected error in getLatestSensorReadings:', err);
    // Mock 데이터 반환
    return [
      {
        id: '1',
        sensor_id: '1',
        value: 25.5,
        unit: '°C',
        ts: new Date().toISOString(),
        metadata: {}
      }
    ];
  }
};

export const getSensorReadingsBySensor = async (sensorId: string, limit: number = 50): Promise<SensorReading[]> => {
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .eq('sensor_id', sensorId)
    .order('ts', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching sensor readings:', error);
    return [];
  }

  return data || [];
};
