import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, FlatList, StatusBar } from 'react-native';
import TuyaService from './src/services/TuyaService';
import SupabaseService, { Device } from './src/services/SupabaseService';

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);
  const [registeredDevices, setRegisteredDevices] = useState<Device[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 투야 SDK 초기화 (직접 값 사용)
      const appKey = 'we85jqprtfpm5pkmyr53';
      const secretKey = '12277a78753f4aaa8d3c8e3beff43632';
      const region = 'eu';

      if (appKey && secretKey) {
        const success = await TuyaService.initializeSDK(appKey, secretKey, region);
        setIsInitialized(success);
        
        if (success) {
          await loadRegisteredDevices();
        } else {
          Alert.alert('오류', '투야 SDK 초기화에 실패했습니다.');
        }
      } else {
        Alert.alert('경고', '투야 API 키가 설정되지 않았습니다.');
      }
    } catch (error) {
      console.error('App initialization error:', error);
      Alert.alert('오류', '앱 초기화 중 오류가 발생했습니다.');
    }
  };

  const loadRegisteredDevices = async () => {
    try {
      const devices = await SupabaseService.getDevices();
      setRegisteredDevices(devices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const startDeviceScan = async () => {
    if (!isInitialized) {
      Alert.alert('오류', '투야 SDK가 초기화되지 않았습니다.');
      return;
    }

    setIsScanning(true);
    setDiscoveredDevices([]);

    try {
      const success = await TuyaService.startDeviceDiscovery();
      if (success) {
        // 10초 후 검색된 디바이스 가져오기
        setTimeout(async () => {
          const devices = await TuyaService.getDiscoveredDevices();
          setDiscoveredDevices(devices);
          await TuyaService.stopDeviceDiscovery();
          setIsScanning(false);
        }, 10000);
      } else {
        setIsScanning(false);
        Alert.alert('오류', '디바이스 검색을 시작할 수 없습니다.');
      }
    } catch (error) {
      setIsScanning(false);
      console.error('Device scan error:', error);
      Alert.alert('오류', '디바이스 검색 중 오류가 발생했습니다.');
    }
  };

  const addDevice = async (device: any) => {
    Alert.prompt(
      '디바이스 추가',
      'WiFi 비밀번호를 입력하세요:',
      async (password) => {
        if (password) {
          try {
            const success = await TuyaService.addDevice(device.id, 'YOUR_WIFI_SSID', password);
            if (success) {
              // Supabase에 디바이스 정보 저장
              const newDevice = await SupabaseService.addDevice({
                farm_id: '550e8400-e29b-41d4-a716-446655440002', // 메인 팜 ID
                type: device.productId || 'switch',
                vendor: 'tuya',
                tuya_device_id: device.id,
                status: { on: false, online: true },
                meta: { location: `Device ${device.id}` }
              });

              if (newDevice) {
                await loadRegisteredDevices();
                Alert.alert('성공', '디바이스가 성공적으로 추가되었습니다.');
              }
            } else {
              Alert.alert('오류', '디바이스 추가에 실패했습니다.');
            }
          } catch (error) {
            console.error('Add device error:', error);
            Alert.alert('오류', '디바이스 추가 중 오류가 발생했습니다.');
          }
        }
      }
    );
  };

  const toggleDevice = async (device: Device) => {
    try {
      const currentStatus = device.status?.on || false;
      const newStatus = !currentStatus;
      
      const success = await TuyaService.controlDevice(device.tuya_device_id || device.id, {
        switch: newStatus
      });

      if (success) {
        await SupabaseService.updateDeviceStatus(device.id, {
          ...device.status,
          on: newStatus
        });
        await loadRegisteredDevices();
      } else {
        Alert.alert('오류', '디바이스 제어에 실패했습니다.');
      }
    } catch (error) {
      console.error('Toggle device error:', error);
      Alert.alert('오류', '디바이스 제어 중 오류가 발생했습니다.');
    }
  };

  const renderDiscoveredDevice = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.discoveredDeviceItem} onPress={() => addDevice(item)}>
      <View style={styles.deviceIconContainer}>
        <Text style={styles.deviceIcon}>🔌</Text>
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || `Device ${item.id}`}</Text>
        <Text style={styles.deviceId}>ID: {item.id}</Text>
      </View>
      <View style={styles.addButton}>
        <Text style={styles.addButtonText}>+ 추가</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRegisteredDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity 
      style={[styles.registeredDeviceItem, item.status?.on && styles.deviceActive]} 
      onPress={() => toggleDevice(item)}
    >
      <View style={styles.deviceIconContainer}>
        <Text style={styles.deviceIcon}>
          {item.status?.on ? '💡' : '🔌'}
        </Text>
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.meta?.location || item.type}</Text>
        <Text style={styles.deviceLocation}>
          {item.meta?.location ? `위치: ${item.meta.location}` : '위치 미설정'}
        </Text>
      </View>
      <View style={[styles.statusIndicator, { backgroundColor: item.status?.on ? '#4CAF50' : '#9E9E9E' }]}>
        <Text style={styles.statusText}>
          {item.status?.on ? 'ON' : 'OFF'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌱 Smart Farm</Text>
        <Text style={styles.subtitle}>스마트 스위치 등록 및 제어</Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isInitialized ? '#4CAF50' : '#FF9800' }]} />
          <Text style={styles.statusText}>
            {isInitialized ? '시스템 준비됨' : '초기화 중...'}
          </Text>
        </View>
      </View>
      
      {/* Main Action Button */}
      <TouchableOpacity 
        style={[styles.primaryButton, isScanning && styles.buttonDisabled]} 
        onPress={startDeviceScan}
        disabled={isScanning}
      >
        <Text style={styles.primaryButtonIcon}>
          {isScanning ? '🔍' : '📡'}
        </Text>
        <Text style={styles.primaryButtonText}>
          {isScanning ? '검색 중...' : '디바이스 검색'}
        </Text>
      </TouchableOpacity>

      {/* Discovered Devices Section */}
      {discoveredDevices.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🆕 검색된 디바이스</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{discoveredDevices.length}</Text>
            </View>
          </View>
          <FlatList
            data={discoveredDevices}
            renderItem={renderDiscoveredDevice}
            keyExtractor={(item) => item.id}
            style={styles.deviceList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Registered Devices Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏠 등록된 디바이스</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{registeredDevices.length}</Text>
          </View>
        </View>
        <FlatList
          data={registeredDevices}
          renderItem={renderRegisteredDevice}
          keyExtractor={(item) => item.id}
          style={styles.deviceList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📱</Text>
              <Text style={styles.emptyStateText}>등록된 디바이스가 없습니다</Text>
              <Text style={styles.emptyStateSubtext}>디바이스를 검색하여 등록해보세요</Text>
            </View>
          }
        />
      </View>

      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  primaryButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  deviceList: {
    maxHeight: 300,
  },
  discoveredDeviceItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  registeredDeviceItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  deviceActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
    borderWidth: 2,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  deviceIcon: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  deviceLocation: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
