import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

// Supabase 설정 (app.json extra에서 가져오기)
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

// 디버깅: 환경 변수 확인
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? '설정됨' : '설정되지 않음');

// 환경 변수가 없으면 더미 클라이언트 생성
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

class SupabaseService {
  /**
   * 디바이스 목록 가져오기
   */
  async getDevices(): Promise<Device[]> {
    if (!supabase) {
      console.warn('Supabase not initialized');
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('vendor', 'tuya')  // Tuya 디바이스만 조회
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching devices:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get devices:', error);
      return [];
    }
  }

  /**
   * 디바이스 추가
   */
  async addDevice(device: Omit<Device, 'id' | 'created_at'>): Promise<Device | null> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .insert([device])
        .select()
        .single();

      if (error) {
        console.error('Error adding device:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to add device:', error);
      return null;
    }
  }

  /**
   * 디바이스 상태 업데이트
   */
  async updateDeviceStatus(deviceId: string, status: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ 
          status: status
        })
        .eq('id', deviceId);

      if (error) {
        console.error('Error updating device status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update device status:', error);
      return false;
    }
  }

  /**
   * 디바이스 삭제
   */
  async deleteDevice(deviceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (error) {
        console.error('Error deleting device:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete device:', error);
      return false;
    }
  }

  /**
   * 실시간 디바이스 상태 구독
   */
  subscribeToDeviceUpdates(callback: (device: Device) => void) {
    return supabase
      .channel('device-updates')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'devices' 
        }, 
        (payload) => {
          callback(payload.new as Device);
        }
      )
      .subscribe();
  }
}

export default new SupabaseService();
