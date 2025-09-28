import React, { useState, useEffect } from 'react';
import { 
  BedTierSystem, 
  TierSensor, 
  ControlSwitch,
  initializeBedSystem,
  addSensorToTier,
  addControlSwitch
} from '../lib/bedSystemArchitecture';
import { 
  SensorDataMessage,
  ControlCommandMessage,
  StatusResponseMessage,
  createSensorDataTopic,
  createControlCommandTopic,
  createStatusResponseTopic,
  createControlCommandPayload
} from '../lib/webAppMqttProtocol';
import BedTierSystemCard from './BedTierSystemCard';
import SensorSwitchManagementModal from './SensorSwitchManagementModal';

interface IntegratedBedSystemProps {
  farmId: string;
  farmName: string;
  bedId: string;
  bedName: string;
  totalTiers: number;
  mqttClient: any; // 실제 MQTT 클라이언트
  onBedUpdate?: (bedSystem: BedTierSystem) => void;
}

export default function IntegratedBedSystem({
  farmId,
  farmName,
  bedId,
  bedName,
  totalTiers,
  mqttClient,
  onBedUpdate
}: IntegratedBedSystemProps) {
  const [bedSystem, setBedSystem] = useState<BedTierSystem>(
    initializeBedSystem(bedId, bedName, totalTiers, farmId)
  );
  const [showSensorModal, setShowSensorModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [mqttConnected, setMqttConnected] = useState(false);

  // MQTT 연결 상태 모니터링
  useEffect(() => {
    if (mqttClient) {
      const handleConnect = () => {
        setMqttConnected(true);
        console.log('✅ MQTT 연결됨 - 베드 시스템 초기화');
        subscribeToAllTopics();
      };

      const handleDisconnect = () => {
        setMqttConnected(false);
        console.log('❌ MQTT 연결 끊어짐');
      };

      mqttClient.on('connect', handleConnect);
      mqttClient.on('disconnect', handleDisconnect);

      return () => {
        mqttClient.off('connect', handleConnect);
        mqttClient.off('disconnect', handleDisconnect);
      };
    }
  }, [mqttClient]);

  // 모든 토픽 구독
  const subscribeToAllTopics = () => {
    if (!mqttClient || !mqttConnected) return;

    // 센서 데이터 구독
    Object.values(bedSystem.tiers).forEach(tier => {
      tier.sensors.forEach(sensor => {
        const topic = createSensorDataTopic(farmId, bedId, tier.tierNumber, sensor.sensorType);
        mqttClient.subscribe(topic, (message: string) => {
          try {
            const data: SensorDataMessage = JSON.parse(message);
            updateSensorData(tier.tierNumber, sensor.sensorType, data.payload.value, data.payload.timestamp);
          } catch (error) {
            console.error('❌ 센서 데이터 파싱 오류:', error);
          }
        });
        console.log('📡 센서 데이터 구독:', topic);
      });
    });

    // 스위치 상태 구독
    bedSystem.controlSwitches.forEach(switchItem => {
      const topic = createStatusResponseTopic(farmId, bedId, switchItem.switchId);
      mqttClient.subscribe(topic, (message: string) => {
        try {
          const status: StatusResponseMessage = JSON.parse(message);
          updateSwitchStatus(switchItem.switchId, status.payload.current_state);
        } catch (error) {
          console.error('❌ 스위치 상태 파싱 오류:', error);
        }
      });
      console.log('📡 스위치 상태 구독:', topic);
    });
  };

  // 센서 데이터 업데이트
  const updateSensorData = (tierNumber: number, sensorType: string, value: number, timestamp: string) => {
    setBedSystem(prev => {
      const updatedTiers = { ...prev.tiers };
      const tier = updatedTiers[tierNumber];
      if (tier) {
        const updatedSensors = tier.sensors.map(sensor => 
          sensor.sensorType === sensorType 
            ? {
                ...sensor,
                lastReading: {
                  value,
                  unit: getSensorUnit(sensorType),
                  timestamp: new Date(timestamp)
                }
              }
            : sensor
        );
        updatedTiers[tierNumber] = { ...tier, sensors: updatedSensors };
      }
      
      const updatedSystem = { ...prev, tiers: updatedTiers };
      onBedUpdate?.(updatedSystem);
      return updatedSystem;
    });
  };

  // 스위치 상태 업데이트
  const updateSwitchStatus = (switchId: string, currentState: 'on' | 'off') => {
    setBedSystem(prev => {
      const updatedSwitches = prev.controlSwitches.map(switchItem =>
        switchItem.switchId === switchId
          ? {
              ...switchItem,
              currentState,
              lastCommand: {
                state: currentState,
                timestamp: new Date()
              }
            }
          : switchItem
      );
      
      const updatedSystem = { ...prev, controlSwitches: updatedSwitches };
      onBedUpdate?.(updatedSystem);
      return updatedSystem;
    });
  };

  // 센서 추가
  const handleAddSensor = (sensorData: Omit<TierSensor, 'lastReading'>) => {
    const updatedSystem = addSensorToTier(bedSystem, sensorData.tierNumber, sensorData.sensorType, sensorData.sensorId);
    setBedSystem(updatedSystem);
    
    // MQTT 구독 추가
    if (mqttClient && mqttConnected) {
      const topic = createSensorDataTopic(farmId, bedId, sensorData.tierNumber, sensorData.sensorType);
      mqttClient.subscribe(topic, (message: string) => {
        try {
          const data: SensorDataMessage = JSON.parse(message);
          updateSensorData(sensorData.tierNumber, sensorData.sensorType, data.payload.value, data.payload.timestamp);
        } catch (error) {
          console.error('❌ 새 센서 데이터 파싱 오류:', error);
        }
      });
      console.log('📡 새 센서 구독:', topic);
    }
    
    onBedUpdate?.(updatedSystem);
  };

  // 스위치 추가
  const handleAddSwitch = (switchData: Omit<ControlSwitch, 'lastCommand'>) => {
    const updatedSystem = addControlSwitch(bedSystem, switchData.switchId, switchData.switchName, switchData.switchType);
    setBedSystem(updatedSystem);
    
    // MQTT 구독 추가
    if (mqttClient && mqttConnected) {
      const topic = createStatusResponseTopic(farmId, bedId, switchData.switchId);
      mqttClient.subscribe(topic, (message: string) => {
        try {
          const status: StatusResponseMessage = JSON.parse(message);
          updateSwitchStatus(switchData.switchId, status.payload.current_state);
        } catch (error) {
          console.error('❌ 새 스위치 상태 파싱 오류:', error);
        }
      });
      console.log('📡 새 스위치 상태 구독:', topic);
    }
    
    onBedUpdate?.(updatedSystem);
  };

  // 스위치 토글
  const handleSwitchToggle = async (switchItem: ControlSwitch) => {
    if (!mqttClient || !mqttConnected) {
      alert('MQTT 연결이 필요합니다.');
      return;
    }

    const newState = switchItem.currentState === 'on' ? 'off' : 'on';
    const topic = createControlCommandTopic(farmId, bedId, switchItem.switchId);
    const payload = createControlCommandPayload(farmId, bedId, switchItem.switchId, newState);

    try {
      mqttClient.publish(topic, JSON.stringify(payload));
      console.log('📤 제어 명령 발송:', { topic, payload });
      
      // 로컬 상태 즉시 업데이트 (낙관적 업데이트)
      updateSwitchStatus(switchItem.switchId, newState);
    } catch (error) {
      console.error('❌ 제어 명령 발송 실패:', error);
      alert('제어 명령 발송에 실패했습니다.');
    }
  };

  // 센서 클릭 처리
  const handleSensorClick = (tierNumber: number, sensor: TierSensor) => {
    console.log('센서 클릭:', { tierNumber, sensor });
    // 센서 상세 정보 모달 또는 차트 표시 로직
  };

  // 센서 단위 반환
  const getSensorUnit = (sensorType: string): string => {
    const units = {
      temperature: '°C',
      humidity: '%',
      ec: 'mS/cm',
      ph: 'pH',
      lux: 'lux',
      water_temp: '°C'
    };
    return units[sensorType as keyof typeof units] || '';
  };

  return (
    <div className="space-y-4">
      {/* 연결 상태 표시 */}
      <div className={`p-3 rounded-lg ${
        mqttConnected 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            mqttConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className={`text-sm font-medium ${
            mqttConnected ? 'text-green-700' : 'text-red-700'
          }`}>
            {mqttConnected ? 'MQTT 연결됨' : 'MQTT 연결 끊어짐'}
          </span>
          <span className="text-xs text-gray-600">
            ({farmId} - {bedName})
          </span>
        </div>
      </div>

      {/* 베드 시스템 카드 */}
      <BedTierSystemCard
        bedSystem={bedSystem}
        onSensorClick={handleSensorClick}
        onSwitchToggle={handleSwitchToggle}
        onAddSensor={() => {
          setSelectedTier(1);
          setShowSensorModal(true);
        }}
        onAddSwitch={() => setShowSwitchModal(true)}
        onEditBed={() => console.log('베드 편집')}
      />

      {/* 센서 추가 모달 */}
      <SensorSwitchManagementModal
        isOpen={showSensorModal}
        onClose={() => setShowSensorModal(false)}
        mode="sensor"
        tierNumber={selectedTier}
        onAddSensor={handleAddSensor}
      />

      {/* 스위치 추가 모달 */}
      <SensorSwitchManagementModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        mode="switch"
        onAddSwitch={handleAddSwitch}
      />
    </div>
  );
}
