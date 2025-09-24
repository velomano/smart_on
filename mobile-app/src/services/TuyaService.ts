import { Platform, NativeModules } from 'react-native';

// 네이티브 모듈 인터페이스
const { TuyaSDK } = NativeModules;

// Mock 디바이스 데이터
const MOCK_DEVICES = [
  {
    id: 'device_001',
    name: '스마트 온도계',
    productId: 'temp_sensor_001',
    online: true,
    status: { temperature: 25.5, humidity: 60 }
  },
  {
    id: 'device_002', 
    name: '스마트 조명',
    productId: 'smart_light_001',
    online: true,
    status: { power: true, brightness: 80 }
  },
  {
    id: 'device_003',
    name: '스마트 펌프',
    productId: 'water_pump_001', 
    online: false,
    status: { power: false, flowRate: 0 }
  }
];

// Mock 검색된 디바이스
const MOCK_DISCOVERED_DEVICES = [
  {
    id: 'new_device_001',
    name: '새로운 스마트 디바이스',
    productId: 'new_sensor_001'
  },
  {
    id: 'new_device_002',
    name: '스마트 토양 센서',
    productId: 'soil_sensor_001'
  }
];

class TuyaService {
  private isInitialized = false;

  /**
   * 투야 SDK 초기화 (네이티브 모듈 사용)
   */
  async initializeSDK(appKey: string, secretKey: string, region: string): Promise<boolean> {
    try {
      console.log('Tuya SDK 초기화:', { appKey, secretKey, region });
      
      if (TuyaSDK && TuyaSDK.initSDK) {
        const result = await TuyaSDK.initSDK(appKey, secretKey, region);
        this.isInitialized = result;
        console.log('Tuya SDK 초기화 완료:', result);
        return result;
      } else {
        console.warn('TuyaSDK 네이티브 모듈을 찾을 수 없습니다. Mock 모드로 실행합니다.');
        // Mock 지연 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.isInitialized = true;
        console.log('Mock Tuya SDK 초기화 완료');
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize Tuya SDK:', error);
      return false;
    }
  }

  /**
   * 디바이스 검색 시작 (네이티브 모듈 사용)
   */
  async startDeviceDiscovery(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Tuya SDK not initialized');
    }

    try {
      console.log('디바이스 검색 시작');
      
      if (TuyaSDK && TuyaSDK.startDeviceDiscovery) {
        const result = await TuyaSDK.startDeviceDiscovery();
        console.log('디바이스 검색 완료:', result);
        return result;
      } else {
        console.warn('TuyaSDK 네이티브 모듈을 찾을 수 없습니다. Mock 모드로 실행합니다.');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Mock 디바이스 검색 완료');
        return true;
      }
    } catch (error) {
      console.error('Failed to start device discovery:', error);
      return false;
    }
  }

  /**
   * 디바이스 검색 중지 (네이티브 모듈 사용)
   */
  async stopDeviceDiscovery(): Promise<boolean> {
    try {
      console.log('디바이스 검색 중지');
      
      if (TuyaSDK && TuyaSDK.stopDeviceDiscovery) {
        const result = await TuyaSDK.stopDeviceDiscovery();
        return result;
      } else {
        console.warn('TuyaSDK 네이티브 모듈을 찾을 수 없습니다. Mock 모드로 실행합니다.');
        return true;
      }
    } catch (error) {
      console.error('Failed to stop device discovery:', error);
      return false;
    }
  }

  /**
   * 검색된 디바이스 목록 가져오기 (네이티브 모듈 사용)
   */
  async getDiscoveredDevices(): Promise<any[]> {
    try {
      console.log('검색된 디바이스 목록 조회');
      
      if (TuyaSDK && TuyaSDK.getDiscoveredDevices) {
        const devices = await TuyaSDK.getDiscoveredDevices();
        console.log('검색된 디바이스 목록:', devices);
        return devices;
      } else {
        console.warn('TuyaSDK 네이티브 모듈을 찾을 수 없습니다. Mock 모드로 실행합니다.');
        return MOCK_DISCOVERED_DEVICES;
      }
    } catch (error) {
      console.error('Failed to get discovered devices:', error);
      return [];
    }
  }

  /**
   * 디바이스 추가 (WiFi 설정) (네이티브 모듈 사용)
   */
  async addDevice(deviceId: string, ssid: string, password: string): Promise<boolean> {
    try {
      console.log('디바이스 추가:', { deviceId, ssid });
      
      if (TuyaSDK && TuyaSDK.addDevice) {
        const result = await TuyaSDK.addDevice(deviceId, ssid, password);
        console.log('디바이스 추가 완료:', result);
        return result;
      } else {
        console.warn('TuyaSDK 네이티브 모듈을 찾을 수 없습니다. Mock 모드로 실행합니다.');
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('Mock 디바이스 추가 완료');
        return true;
      }
    } catch (error) {
      console.error('Failed to add device:', error);
      return false;
    }
  }

  /**
   * 등록된 디바이스 목록 가져오기 (네이티브 모듈 사용)
   */
  async getDeviceList(): Promise<any[]> {
    try {
      console.log('디바이스 목록 조회');
      
      if (TuyaSDK && TuyaSDK.getDeviceList) {
        const devices = await TuyaSDK.getDeviceList();
        console.log('디바이스 목록:', devices);
        return devices;
      } else {
        console.warn('TuyaSDK 네이티브 모듈을 찾을 수 없습니다. Mock 모드로 실행합니다.');
        return MOCK_DEVICES;
      }
    } catch (error) {
      console.error('Failed to get device list:', error);
      return [];
    }
  }

  /**
   * 디바이스 제어 (네이티브 모듈 사용)
   */
  async controlDevice(deviceId: string, command: any): Promise<boolean> {
    try {
      console.log('디바이스 제어:', { deviceId, command });
      
      if (TuyaSDK && TuyaSDK.controlDevice) {
        const result = await TuyaSDK.controlDevice(deviceId, command);
        console.log('디바이스 제어 완료:', result);
        return result;
      } else {
        console.warn('TuyaSDK 네이티브 모듈을 찾을 수 없습니다. Mock 모드로 실행합니다.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Mock 디바이스 제어 완료');
        return true;
      }
    } catch (error) {
      console.error('Failed to control device:', error);
      return false;
    }
  }

  /**
   * 디바이스 상태 가져오기 (네이티브 모듈 사용)
   */
  async getDeviceStatus(deviceId: string): Promise<any> {
    try {
      console.log('디바이스 상태 조회:', deviceId);
      
      if (TuyaSDK && TuyaSDK.getDeviceStatus) {
        const status = await TuyaSDK.getDeviceStatus(deviceId);
        console.log('디바이스 상태:', status);
        return status;
      } else {
        console.warn('TuyaSDK 네이티브 모듈을 찾을 수 없습니다. Mock 모드로 실행합니다.');
        const device = MOCK_DEVICES.find(d => d.id === deviceId);
        if (device) {
          return {
            online: device.online,
            name: device.name,
            status: device.status
          };
        }
        return null;
      }
    } catch (error) {
      console.error('Failed to get device status:', error);
      return null;
    }
  }
}

export default new TuyaService();
