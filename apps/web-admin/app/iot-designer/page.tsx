// IoT Designer 메인 페이지
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { allocatePins } from '@/components/iot-designer/PinAllocator';
import { calculatePowerRequirements, suggestPowerSupplies } from '@/components/iot-designer/PowerEstimator';
import SchematicSVG from '@/components/iot-designer/SchematicSVG';
import CodePreview from '@/components/iot-designer/CodePreview';
// QR 코드는 네이티브 앱 전용으로 분리됨
import { LiveLog } from '@/components/connect/LiveLog';
import toast, { Toaster } from 'react-hot-toast';
import LoRaWanForm from '@/components/iot-designer/LoRaWanForm';
import AppHeader from '@/components/AppHeader';
import { getCurrentUser, type AuthUser } from '@/lib/auth';
import { PinPicker, I2CPinDisplay } from './components/PinPicker';
import SelfTestPanel from './components/SelfTestPanel';

interface SystemSpec {
  device: string;
  protocol: 'mqtt' | 'serial' | 'ble' | 'rs485' | 'modbus-tcp' | 'lorawan';
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  wifi: {
    ssid: string;
    password: string;
  };
  modbusConfig?: {
    host: string;
    port: number;
    unitId: number;
    plcVendor?: string;
    pollMs?: number;
    timeout?: number;
    retries?: number;
    registerMappings: Record<string, number>;
    dataTypes: Record<string, 'U16' | 'S16' | 'U32' | 'S32' | 'float' | 'FLOAT_ABCD' | 'FLOAT_BADC'>;
    scaleFactors: Record<string, number>;
    deadbands: Record<string, number>;
    units: Record<string, string>;
    controlMappings: Record<string, number>;
    controlOnValues: Record<string, number>;
    controlOffValues: Record<string, number>;
    maxRunTimes: Record<string, number>;
    safeLimits: Record<string, { min: number; max: number }>;
  };
  lorawanConfig?: {
    mode: 'mqtt' | 'webhook';
    lns: 'the-things-stack' | 'chirpstack' | 'carrier';
    region: string;
    deviceMap?: Record<string, string>;
    codec?: { type: 'js'; script?: string; scriptRef?: string };
    mqtt?: {
      host: string;
      port: number;
      username: string;
      password: string;
      uplinkTopic: string;
      downlinkTopicTpl: string;
      tls?: boolean;
    };
    webhook?: { secret: string; path: string; };
    api?: { baseUrl: string; token: string; };
  };
}

const steps = [
  { id: 'design', title: '디자인', description: '시스템 설계' },
  { id: 'connect', title: '연결', description: '디바이스 연결' },
  { id: 'monitor', title: '모니터링', description: '실시간 모니터링' }
];

// IoT Designer 메인 컴포넌트 (useSearchParams 사용)
function IoTDesignerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const farmId = searchParams.get('farmId');
  const step = searchParams.get('step');
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [farmName, setFarmName] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'design' | 'connect' | 'monitor'>('design');
  const [spec, setSpec] = useState<SystemSpec>({
    device: 'esp32',
    protocol: 'mqtt',
    sensors: [],
    controls: [],
    wifi: { ssid: '', password: '' },
    modbusConfig: {
      host: '',
      port: 502,
      unitId: 1,
      registerMappings: {},
      dataTypes: {},
      scaleFactors: {},
      deadbands: {},
      units: {},
      controlMappings: {},
      controlOnValues: {},
      controlOffValues: {},
      maxRunTimes: {},
      safeLimits: {}
    }
  });
  
  const [generatedCode, setGeneratedCode] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.is_approved || !currentUser.is_active) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
    };
    checkAuth();
  }, [router]);

  // step 파라미터에 따라 currentStep 설정
  useEffect(() => {
    if (step === 'monitor') {
      setCurrentStep('monitor');
    } else if (step === 'connect') {
      setCurrentStep('connect');
    } else {
      setCurrentStep('design');
    }
  }, [step]);

  // 농장 정보 로드
  useEffect(() => {
    const loadFarmInfo = async () => {
      if (!farmId) return;
      
      try {
        const response = await fetch(`/api/farms/${farmId}`);
        if (response.ok) {
          const farmData = await response.json();
          if (farmData.success && farmData.data) {
            setFarmName(farmData.data.name || '알 수 없는 농장');
          }
        }
      } catch (error) {
        console.error('농장 정보 로드 실패:', error);
      }
    };
    
    loadFarmInfo();
  }, [farmId]);

  // 전원 계산 함수들 (메모이제이션으로 즉시 반응)
  const getSensorPower = useMemo(() => {
    return (sensorType: string): number => {
    const powerMap: Record<string, number> = {
      // 환경 센서
      'BME280': 3.6, // 온습압 센서 (I2C)
      'ADS1115': 0.15, // ADC 모듈 (I2C)
      'BMP280': 2.7, // 기압센서 (I2C)
      'DHT22': 2.5, // 온습도센서 (디지털)
      'DS18B20': 1.5, // 온도센서 (방수 프로브)
      'SHT30': 1.4, // 온습도센서 (I2C)
      'ENS160': 4.7, // 공기질센서 (I2C)
      'Generic_Analog': 0.1, // 토양수분센서 (아날로그)
      'HC-SR04': 15, // 초음파 거리센서
      'INA219': 0.7, // 전류/전압 센서 (I2C)
      'PMS5003': 100, // 미세먼지센서 (UART)
      'MQ135': 150, // 공기질센서 (아날로그)
      'MQ7': 150, // CO 센서 (아날로그)
      'MQ2': 800, // 가스센서 (아날로그)
      'MQ9': 800, // 가스센서 (아날로그)
      'MQ4': 800, // 가스센서 (아날로그)
      'MQ5': 800, // 가스센서 (아날로그)
      'MQ6': 800, // 가스센서 (아날로그)
      'MQ8': 800, // 가스센서 (아날로그)
      'MQ131': 800, // 가스센서 (아날로그)
      'MQ136': 800, // 가스센서 (아날로그)
      'MQ137': 800, // 가스센서 (아날로그)
      'MQ138': 800, // 가스센서 (아날로그)
      'MQ303A': 800, // 가스센서 (아날로그)
      'MQ309A': 800, // 가스센서 (아날로그)
      'MQ311': 800, // 가스센서 (아날로그)
      'MQ306A': 800, // 가스센서 (아날로그)
      'MQ307A': 800, // 가스센서 (아날로그)
      'MQ308A': 800, // 가스센서 (아날로그)
      // 기본값
      'temperature': 5,
      'humidity': 5,
      'pressure': 10,
      'light': 3,
      'motion': 8,
      'soil-moisture': 5,
      'ph': 15,
      'co2': 20
    };
    return powerMap[sensorType] || 5;
    };
  }, [spec.sensors]); // 센서 변경 시에만 재계산

  const getActuatorPower = useMemo(() => {
    return (actuatorType: string): number => {
    const powerMap: Record<string, number> = {
      // 조명
      'AC_Relay_Lamp': 200, // AC 램프 (릴레이 제어)
      'PWM_12V_LED': 60, // 12V LED (MOSFET PWM)
      'WS2812B_NeoPixel': 60, // NeoPixel Strip (60mA per LED)
      'AC_Dimmer_TRIAC': 5, // AC 디머 (TRIAC + ZCD)
      
      // 모터
      'TB6612_DC_Motor': 1000, // DC 모터 (TB6612FNG 드라이버)
      'L298N_DC_Motor': 1200, // DC 모터 (L298N 드라이버)
      'SG90_Servo': 500, // 서보모터 (PWM)
      'A4988_Stepper': 800, // 스테퍼모터 (A4988 드라이버)
      
      // 밸브/펌프
      'Solenoid_Valve': 200, // 솔레노이드 밸브 (릴레이 제어)
      'Peristaltic_Pump': 300, // 페리스탈틱 펌프 (DC 모터)
      'PWM_DC_Fan': 120, // DC 팬 (PWM 제어)
      
      // 릴레이
      'Solid_State_Relay': 5, // SSR (거의 전력 소모 없음)
      
      // 기본값
      'relay': 50,
      'servo': 100,
      'motor': 200,
      'pump': 150,
      'fan': 80,
      'heater': 300,
      'led': 20
    };
    return powerMap[actuatorType] || 50;
    };
  }, [spec.controls]); // 액추에이터 변경 시에만 재계산

  // 디바이스별 핀 정보 가져오기 (메모이제이션으로 즉시 반응)
  const getDevicePins = useMemo(() => {
    return (device: string, type: 'digital' | 'pwm' | 'analog' | 'i2c' | 'spi' | 'uart'): string[] => {
    const pinMaps: Record<string, Record<string, string[]>> = {
      esp32: {
        digital: ['GPIO2', 'GPIO4', 'GPIO5', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO21', 'GPIO22', 'GPIO23', 'GPIO25', 'GPIO26', 'GPIO27', 'GPIO32', 'GPIO33'],
        pwm: ['GPIO2', 'GPIO4', 'GPIO5', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO21', 'GPIO22', 'GPIO23', 'GPIO25', 'GPIO26', 'GPIO27', 'GPIO32', 'GPIO33'], // ESP32는 대부분 디지털 핀이 PWM 가능
        analog: ['GPIO32', 'GPIO33', 'GPIO34', 'GPIO35', 'GPIO36', 'GPIO39'],
        i2c: ['GPIO21', 'GPIO22'],
        spi: ['GPIO18', 'GPIO19', 'GPIO23', 'GPIO5'],
        uart: ['GPIO1', 'GPIO3', 'GPIO16', 'GPIO17']
      },
      esp8266: {
        digital: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
        pwm: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
        analog: ['A0'],
        i2c: ['D2', 'D1'],
        spi: ['D5', 'D6', 'D7', 'D8'],
        uart: ['D0', 'D1']
      },
      arduino: {
        digital: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
        pwm: ['3', '5', '6', '9', '10', '11'],
        analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
        i2c: ['A4', 'A5'],
        spi: ['10', '11', '12', '13'],
        uart: ['0', '1']
      },
      arduino_r4: {
        digital: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
        pwm: ['3', '5', '6', '9', '10', '11'],
        analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
        i2c: ['A4', 'A5'],
        spi: ['10', '11', '12', '13'],
        uart: ['0', '1']
      },
      raspberry_pi: {
        digital: ['GPIO2', 'GPIO3', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO20', 'GPIO21', 'GPIO22', 'GPIO23', 'GPIO24', 'GPIO25', 'GPIO26', 'GPIO27'],
        pwm: ['GPIO12', 'GPIO13', 'GPIO18', 'GPIO19'],
        analog: ['GPIO26', 'GPIO27'],
        i2c: ['GPIO2', 'GPIO3'],
        spi: ['GPIO10', 'GPIO11', 'GPIO8', 'GPIO9'],
        uart: ['GPIO14', 'GPIO15']
      },
      raspberry_pi4: {
        digital: ['GPIO2', 'GPIO3', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO20', 'GPIO21', 'GPIO22', 'GPIO23', 'GPIO24', 'GPIO25', 'GPIO26', 'GPIO27'],
        pwm: ['GPIO12', 'GPIO13', 'GPIO18', 'GPIO19'],
        analog: ['GPIO26', 'GPIO27'],
        i2c: ['GPIO2', 'GPIO3'],
        spi: ['GPIO10', 'GPIO11', 'GPIO8', 'GPIO9'],
        uart: ['GPIO14', 'GPIO15']
      },
      raspberry_pi3: {
        digital: ['GPIO2', 'GPIO3', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO20', 'GPIO21', 'GPIO22', 'GPIO23', 'GPIO24', 'GPIO25', 'GPIO26', 'GPIO27'],
        pwm: ['GPIO12', 'GPIO13', 'GPIO18', 'GPIO19'],
        analog: ['GPIO26', 'GPIO27'],
        i2c: ['GPIO2', 'GPIO3'],
        spi: ['GPIO10', 'GPIO11', 'GPIO8', 'GPIO9'],
        uart: ['GPIO14', 'GPIO15']
      }
    };
    
    return pinMaps[device]?.[type] || [];
    };
  }, [spec.device]); // 디바이스 변경 시에만 재계산

  // 핀이 사용 중인지 확인
  const isPinUsed = (pin: string, type: string): boolean => {
    return Object.values(pinAssignments).includes(pin);
  };

  // 핀에 할당된 컴포넌트 색상 가져오기
  const getPinColor = (pin: string) => {
    const assignedComponent = Object.entries(pinAssignments).find(([_, assignedPin]) => assignedPin === pin);
    if (assignedComponent) {
      return componentColors[assignedComponent[0]] || 'bg-gray-500';
    }
    return null;
  };

  // 핀 할당 상태 관리
  const [pinAssignments, setPinAssignments] = useState<Record<string, string>>({});
  const [componentColors, setComponentColors] = useState<Record<string, string>>({});
  const [showPinSelector, setShowPinSelector] = useState<string | null>(null);
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialPinAssignments, setInitialPinAssignments] = useState<Record<string, string>>({});

  // 색상 팔레트
  const colorPalette = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-red-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
  ];

  // 모든 컴포넌트 인스턴스 목록 생성 (고유한 키로)
  const getAllComponents = () => {
    const components = [
      ...spec.sensors.flatMap((sensor, sensorIdx) => 
        Array.from({ length: sensor.count }, (_, instanceIdx) => 
          `sensor_${sensorIdx}_${instanceIdx}_${sensor.type}`
        )
      ),
      ...spec.controls.flatMap((control, controlIdx) => 
        Array.from({ length: control.count }, (_, instanceIdx) => 
          `control_${controlIdx}_${instanceIdx}_${control.type}`
        )
      )
    ];
    return components;
  };

  // 컴포넌트별 색상 할당 (초기화 시 자동 배정)
  const getComponentColor = (componentKey: string) => {
    if (!componentColors[componentKey]) {
      const allComponents = getAllComponents();
      const componentIndex = allComponents.indexOf(componentKey);
      const colorIndex = componentIndex % colorPalette.length;
      setComponentColors(prev => ({
        ...prev,
        [componentKey]: colorPalette[colorIndex]
      }));
      return colorPalette[colorIndex];
    }
    return componentColors[componentKey];
  };

  // 초기 핀 자동 배정
  const initializePinAssignments = () => {
    const allComponents = getAllComponents();
    const allPins = [
      ...getDevicePins(spec.device, 'digital'),
      ...getDevicePins(spec.device, 'pwm'),
      ...getDevicePins(spec.device, 'analog')
    ];
    
    // 중복 제거
    const uniquePins = [...new Set(allPins)];
    
    const assignments: Record<string, string> = {};
    allComponents.forEach((component, index) => {
      if (index < uniquePins.length) {
        assignments[component] = uniquePins[index];
      }
    });
    
    console.log('🔧 초기 핀 할당:', {
      allComponents,
      uniquePins,
      assignments
    });
    
    setPinAssignments(assignments);
    setHasUnsavedChanges(false); // 초기화 시 변경사항 없음
  };

  // 페이지 로드 시에만 핀 할당 상태 초기화
  React.useEffect(() => {
    // 1. 세션 스토리지에서 현재 설정 불러오기 (페이지 이동 시 유지)
    const sessionData = sessionStorage.getItem('iotDesignerState');
    let initialPins: Record<string, string> = {};
    
    if (sessionData) {
      try {
        const sessionState = JSON.parse(sessionData);
        if (sessionState.pinAssignments) {
          initialPins = sessionState.pinAssignments;
          setPinAssignments(initialPins);
          setInitialPinAssignments(initialPins);
          setHasUnsavedChanges(false);
          return; // 세션 데이터가 있으면 그대로 사용
        }
      } catch (error) {
        console.warn('세션 데이터 파싱 실패:', error);
      }
    }
    
    // 2. 세션 데이터가 없으면 localStorage에서 불러오기
    const savedSensorPins = localStorage.getItem('sensorPinAssignments');
    const savedActuatorPins = localStorage.getItem('actuatorPinAssignments');
    
    if (savedSensorPins || savedActuatorPins) {
      initialPins = {
        ...JSON.parse(savedSensorPins || '{}'),
        ...JSON.parse(savedActuatorPins || '{}')
      };
      setPinAssignments(initialPins);
    } else {
      // 3. 둘 다 없으면 초기 핀 할당 생성
      const allComponents = getAllComponents();
      const allPins = [
        ...getDevicePins(spec.device, 'digital'),
        ...getDevicePins(spec.device, 'pwm'),
        ...getDevicePins(spec.device, 'analog')
      ];
      
      const uniquePins = [...new Set(allPins)];
      
      allComponents.forEach((component, index) => {
        if (index < uniquePins.length) {
          initialPins[component] = uniquePins[index];
        }
      });
      
      setPinAssignments(initialPins);
    }
    
    // 초기 상태 저장 (변경사항 비교용)
    setInitialPinAssignments(initialPins);
    setHasUnsavedChanges(false); // 초기화 시에는 변경사항 없음
  }, []); // 빈 의존성 배열로 페이지 로드 시에만 실행

  // 센서/액추에이터 변경 시 새로운 컴포넌트에 대한 핀 할당 추가
  React.useEffect(() => {
    const allComponents = getAllComponents();
    const currentPinAssignments = { ...pinAssignments };
    let hasNewComponents = false;

    // 새로운 컴포넌트가 추가된 경우에만 핀 할당
    allComponents.forEach(component => {
      if (!currentPinAssignments[component]) {
        hasNewComponents = true;
      }
    });

    if (hasNewComponents) {
      const allPins = [
        ...getDevicePins(spec.device, 'digital'),
        ...getDevicePins(spec.device, 'pwm'),
        ...getDevicePins(spec.device, 'analog')
      ];
      
      const uniquePins = [...new Set(allPins)];
      const availablePins = uniquePins.filter(pin => 
        !Object.values(currentPinAssignments).includes(pin)
      );

      allComponents.forEach((component, index) => {
        if (!currentPinAssignments[component] && index < availablePins.length) {
          currentPinAssignments[component] = availablePins[index];
        }
      });

      setPinAssignments(currentPinAssignments);
      checkForChanges(currentPinAssignments);
    }
  }, [spec.sensors, spec.controls, spec.device]);

  // 핀 할당 변경사항 체크 함수
  const checkForChanges = (currentAssignments: Record<string, string>) => {
    const hasChanges = Object.keys(currentAssignments).some(key => 
      currentAssignments[key] !== initialPinAssignments[key]
    );
    setHasUnsavedChanges(hasChanges);
  };

  // 저장 함수 (페이지 이동 시에만 호출)
  const savePinAssignments = (assignments: Record<string, string>) => {
    // localStorage에 저장
    localStorage.setItem('sensorPinAssignments', JSON.stringify(assignments));
    localStorage.setItem('actuatorPinAssignments', JSON.stringify(assignments));
    
    // 세션 스토리지에도 저장
    const sessionState = {
      pinAssignments: assignments,
      timestamp: Date.now()
    };
    sessionStorage.setItem('iotDesignerState', JSON.stringify(sessionState));
    
    // 초기 상태 업데이트 (변경사항 추적용)
    setInitialPinAssignments(assignments);
    setHasUnsavedChanges(false);
    
    console.log('✅ 핀 할당 저장 완료');
  };

  // 핀 할당 함수 (즉시 반응, 자동저장 제거)
  const assignPin = (pin: string, component: string) => {
    const newAssignments = {
      ...pinAssignments,
      [component]: pin
    };
    setPinAssignments(newAssignments);
    checkForChanges(newAssignments); // 변경사항 체크만
    
    setShowPinSelector(null);
  };

  // 사용 가능한 핀 목록 가져오기
  const getAvailablePins = (currentComponent: string) => {
    const allPins = [
      ...getDevicePins(spec.device, 'digital'),
      ...getDevicePins(spec.device, 'pwm'),
      ...getDevicePins(spec.device, 'analog')
    ];
    
    return allPins.filter(pin => {
      const assignedComponent = Object.entries(pinAssignments).find(([_, assignedPin]) => assignedPin === pin);
      return !assignedComponent || assignedComponent[0] === currentComponent;
    });
  };

  // 센서/액추에이터 한글 이름 매핑
  const getComponentKoreanName = (type: string) => {
    const nameMap: Record<string, string> = {
      'temperature': '온도센서',
      'humidity': '습도센서',
      'pressure': '압력센서',
      'light': '조도센서',
      'motion': '동작센서',
      'sound': '소음센서',
      'gas': '가스센서',
      'soil': '토양센서',
      'water': '수위센서',
      'relay': '릴레이',
      'servo': '서보모터',
      'stepper': '스테퍼모터',
      'pump': '펌프',
      'fan': '팬',
      'led': 'LED',
      'buzzer': '부저'
    };
    return nameMap[type] || type;
  };

  // 센서별 핀 정보 가져오기
  const getSensorPinInfo = (sensorType: string, instance: number) => {
    const getPinForDevice = (basePin: number, instance: number, device: string): string => {
      if (device === 'esp32') {
        return `GPIO${basePin + instance}`;
      } else if (device === 'esp8266') {
        return `D${basePin + instance}`;
      } else if (device.startsWith('arduino')) {
        // Arduino는 디지털 핀 2부터 시작
        const arduinoPins = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        const pinIndex = (basePin - 2 + instance) % arduinoPins.length;
        return `${arduinoPins[pinIndex]}`;
      } else if (device.startsWith('raspberry_pi')) {
        return `GPIO${basePin + instance}`;
      }
      return `${basePin + instance}`;
    };

    const pinMaps: Record<string, any> = {
      temperature: {
        power: 5,
        dataPin: spec.device.startsWith('arduino') ? `A${instance}` : getPinForDevice(32, instance, spec.device),
        powerPin: '3.3V',
        connection: 'VCC → 3.3V, GND → GND, DATA → GPIO'
      },
      humidity: {
        power: 5,
        dataPin: spec.device.startsWith('arduino') ? `A${instance + 1}` : getPinForDevice(34, instance, spec.device),
        powerPin: '3.3V',
        connection: 'VCC → 3.3V, GND → GND, DATA → GPIO'
      },
      pressure: {
        power: 10,
        dataPin: spec.device.startsWith('arduino') ? 'A4, A5' : getPinForDevice(21, instance, spec.device),
        powerPin: '3.3V',
        connection: 'I2C 연결 (SDA, SCL)'
      },
      light: {
        power: 3,
        dataPin: spec.device.startsWith('arduino') ? `A${instance + 2}` : getPinForDevice(36, instance, spec.device),
        powerPin: '3.3V',
        connection: 'VCC → 3.3V, GND → GND, OUT → GPIO'
      },
      motion: {
        power: 8,
        dataPin: getPinForDevice(25, instance, spec.device),
        powerPin: '3.3V',
        connection: 'VCC → 3.3V, GND → GND, OUT → GPIO'
      },
      'soil-moisture': {
        power: 5,
        dataPin: spec.device.startsWith('arduino') ? `A${instance + 3}` : getPinForDevice(26, instance, spec.device),
        powerPin: '3.3V',
        connection: 'VCC → 3.3V, GND → GND, SIG → GPIO'
      },
      ph: {
        power: 15,
        dataPin: spec.device.startsWith('arduino') ? `A${instance + 4}` : getPinForDevice(27, instance, spec.device),
        powerPin: '5V',
        connection: 'VCC → 5V, GND → GND, PO → GPIO'
      },
      co2: {
        power: 20,
        dataPin: getPinForDevice(14, instance, spec.device),
        powerPin: '5V',
        connection: 'VCC → 5V, GND → GND, TX → GPIO'
      }
    };
    
    return pinMaps[sensorType] || {
      power: 5,
      dataPin: getPinForDevice(32, instance, spec.device),
      powerPin: '3.3V',
      connection: 'VCC → 3.3V, GND → GND, DATA → GPIO'
    };
  };

  // 액추에이터별 핀 정보 가져오기
  const getActuatorPinInfo = (actuatorType: string, instance: number) => {
    const getPinForDevice = (basePin: number, instance: number, device: string): string => {
      if (device === 'esp32') {
        return `GPIO${basePin + instance}`;
      } else if (device === 'esp8266') {
        return `D${basePin + instance}`;
      } else if (device.startsWith('arduino')) {
        // Arduino는 디지털 핀 2부터 시작
        const arduinoPins = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        const pinIndex = (basePin - 2 + instance) % arduinoPins.length;
        return `${arduinoPins[pinIndex]}`;
      } else if (device.startsWith('raspberry_pi')) {
        return `GPIO${basePin + instance}`;
      }
      return `${basePin + instance}`;
    };

    const pinMaps: Record<string, any> = {
      relay: {
        power: 50,
        controlPin: getPinForDevice(2, instance, spec.device),
        powerPin: '5V',
        controlType: '디지털 출력 (HIGH/LOW)'
      },
      servo: {
        power: 100,
        controlPin: getPinForDevice(4, instance, spec.device),
        powerPin: '5V',
        controlType: 'PWM 신호 (0-180도)'
      },
      motor: {
        power: 200,
        controlPin: getPinForDevice(5, instance, spec.device),
        powerPin: '12V',
        controlType: 'PWM 속도 제어'
      },
      pump: {
        power: 150,
        controlPin: getPinForDevice(12, instance, spec.device),
        powerPin: '5V',
        controlType: '디지털 출력 (ON/OFF)'
      },
      fan: {
        power: 80,
        controlPin: getPinForDevice(13, instance, spec.device),
        powerPin: '5V',
        controlType: 'PWM 속도 제어'
      },
      heater: {
        power: 300,
        controlPin: getPinForDevice(14, instance, spec.device),
        powerPin: '12V',
        controlType: '디지털 출력 (ON/OFF)'
      },
      led: {
        power: 20,
        controlPin: getPinForDevice(15, instance, spec.device),
        powerPin: '3.3V',
        controlType: 'PWM 밝기 제어'
      }
    };
    
    return pinMaps[actuatorType] || {
      power: 50,
      controlPin: getPinForDevice(2, instance, spec.device),
      powerPin: '5V',
      controlType: '디지털 출력'
    };
  };
  
  // 핀 할당 및 전원 계산 (동적으로 업데이트)
  const allocation = useMemo(() => {
    console.log('🔄 핀 할당 재계산:', spec);
    return allocatePins({
      device: spec.device,
      sensors: spec.sensors,
      controls: spec.controls
    });
  }, [spec.device, spec.sensors, spec.controls]);
  
  const powerRequirements = useMemo(() => {
    console.log('⚡ 전원 요구사항 재계산:', spec);
    return calculatePowerRequirements(spec);
  }, [spec.sensors, spec.controls]);
  
  const powerSuggestions = useMemo(() => {
    return suggestPowerSupplies(powerRequirements);
  }, [powerRequirements]);
  
  // 코드 생성 함수 제거됨 - 연결 페이지에서만 다운로드 가능

  // 토큰 생성 함수 (2단계에서 사용)
  const generateToken = async () => {
    try {
      console.log('🔑 토큰 생성 시작');
      
      const tokenResponse = await fetch('http://localhost:3001/api/provisioning/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: '00000000-0000-0000-0000-000000000001',
          farm_id: null,
          ttl: 3600,
          device_type: `${spec.device}-${spec.protocol}`,
          capabilities: [...spec.sensors.map(s => s.type), ...spec.controls.map(c => c.type)]
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`토큰 발급 실패: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      setSetupToken(tokenData.setup_token);
      setDeviceKey(tokenData.setup_token);
      
      toast.success('✅ 연결 토큰이 생성되었습니다!');
      
    } catch (error: any) {
      console.error('❌ 토큰 생성 오류:', error);
      toast.error(`토큰 생성 오류: ${error.message}`);
    }
  };

  // downloadCode 함수 제거됨 - 연결 페이지에서만 다운로드 가능

  const nextStep = () => {
    if (currentStep === 'design') {
      setCurrentStep('connect');
    } else if (currentStep === 'connect') {
      setCurrentStep('monitor');
    }
  };

  const prevStep = () => {
    if (currentStep === 'connect') {
      setCurrentStep('design');
    } else if (currentStep === 'monitor') {
      setCurrentStep('connect');
    }
  };
  
  // 로그인/권한 체크 완료
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        user={user}
        title="⚡ 빠른 IoT 빌더"
        subtitle={farmName ? `${farmName} - ${farmId}` : 'IoT 디바이스 생성'}
      />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Toast Container */}
        <Toaster position="top-center" />
        
        {/* 농장 정보 표시 */}
        {farmId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-blue-900">농장: {farmName}</h2>
                <p className="text-sm text-blue-700">농장 ID: {farmId}</p>
              </div>
              <button
                onClick={() => router.push('/beds')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                농장으로 돌아가기
              </button>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">⚡ 빠른 IoT 빌더</h1>
          <p className="text-gray-700 font-medium">빠르고 간편하게 IoT 시스템을 설계하고 자동으로 연결하세요</p>
          
          {/* 단계 표시기 - 클릭 가능 */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentStep('design')}
                className={`flex items-center ${currentStep === 'design' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'} transition-colors`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'design' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}>
                  1
                </div>
                <span className="ml-2 font-medium">디자인</span>
              </button>
              <div className="flex-1 h-1 bg-gray-200 mx-4" />
              <button 
                onClick={() => setCurrentStep('connect')}
                className={`flex items-center ${currentStep === 'connect' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'} transition-colors`}
                disabled={!generatedCode && currentStep !== 'connect'}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'connect' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}>
                  2
                </div>
                <span className="ml-2 font-medium">연결</span>
              </button>
              <div className="flex-1 h-1 bg-gray-200 mx-4" />
              <button 
                onClick={() => setCurrentStep('monitor')}
                className={`flex items-center ${currentStep === 'monitor' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'} transition-colors`}
                disabled={!generatedCode && currentStep !== 'monitor'}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'monitor' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}>
                  3
                </div>
                <span className="ml-2 font-medium">모니터링</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* 디자인 단계 */}
        {currentStep === 'design' && (
          <div className="space-y-6">

            {/* 2. 디바이스 및 프로토콜 선택 */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">🔧 디바이스 및 프로토콜 선택</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-800">디바이스 타입</label>
              <select
                value={spec.device}
                onChange={(e) => setSpec(prev => ({ ...prev, device: e.target.value }))}
                className="w-full p-2 border rounded-lg text-gray-800"
              >
                <option value="esp32">ESP32</option>
                <option value="esp8266">ESP8266</option>
                <option value="arduino_uno">Arduino Uno</option>
                <option value="arduino_r4">Arduino R4</option>
                <option value="raspberry_pi5">Raspberry Pi 5</option>
                    <option value="raspberry_pi4">Raspberry Pi 4</option>
                    <option value="raspberry_pi3">Raspberry Pi 3</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">통신 프로토콜</label>
              <select
                value={spec.protocol}
                    onChange={(e) => setSpec(prev => ({ ...prev, protocol: e.target.value as 'mqtt' | 'serial' | 'ble' | 'rs485' | 'modbus-tcp' | 'lorawan' }))}
                className="w-full p-2 border rounded-lg text-gray-800"
              >
                <option value="mqtt">MQTT (권장) ✅</option>
                <option value="serial">Serial (USB) 🔄 향후 지원</option>
                <option value="ble">Bluetooth LE 🔄 향후 지원</option>
                <option value="rs485">RS-485 (Modbus RTU) 🔄 향후 지원</option>
                <option value="modbus-tcp">Modbus TCP 🔄 향후 지원</option>
                <option value="lorawan">LoRaWAN 🔄 향후 지원</option>
              </select>
            </div>
          </div>
        </div>
        
            {/* 3. 센서 및 액추에이터 설정 */}
        <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">📊 센서 및 액추에이터 설정</h3>
              
              {/* 센서 설정 */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-gray-800">센서</h4>
                <div className="space-y-3">
                  {spec.sensors.map((sensor, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <select
                        value={sensor.type}
                onChange={(e) => setSpec(prev => ({ 
                  ...prev, 
                          sensors: prev.sensors.map((s, i) => 
                            i === idx ? { ...s, type: e.target.value } : s
                          )
                        }))}
                        className="flex-1 p-2 border rounded-lg text-gray-800"
                      >
                        <optgroup label="🌡️ 환경 센서">
                          <option 
                            value="BME280" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'BME280')}
                          >
                            BME280 온습압 센서 (I2C)
                          </option>
                          <option 
                            value="ADS1115" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'ADS1115')}
                          >
                            ADS1115 ADC 모듈 (I2C)
                          </option>
                          <option 
                            value="BMP280" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'BMP280')}
                          >
                            BMP280 기압센서 (I2C)
                          </option>
                          <option 
                            value="DHT22" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'DHT22')}
                          >
                            DHT22 온습도센서 (디지털)
                          </option>
                        </optgroup>
                        <optgroup label="🌡️ 온도 센서">
                          <option 
                            value="DS18B20" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'DS18B20')}
                          >
                            DS18B20 온도센서 (방수 프로브)
                          </option>
                        </optgroup>
                        <optgroup label="💡 조도 센서">
                          <option 
                            value="BH1750" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'BH1750')}
                          >
                            BH1750 조도센서 (I2C)
                          </option>
                        </optgroup>
                        <optgroup label="🌬️ 공기질 센서">
                          <option 
                            value="SCD30" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'SCD30')}
                          >
                            SCD30 CO₂ 센서 (I2C)
                          </option>
                          <option 
                            value="SCD41" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'SCD41')}
                          >
                            SCD41 CO₂ 센서 (저전력)
                          </option>
                          <option 
                            value="ENS160" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'ENS160')}
                          >
                            ENS160 VOC/가스센서 (I2C)
                          </option>
                        </optgroup>
                        <optgroup label="🌱 토양 센서">
                          <option 
                            value="Generic_Analog" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'Generic_Analog')}
                          >
                            토양수분센서 (아날로그)
                          </option>
                        </optgroup>
                        <optgroup label="💧 수위 센서">
                          <option 
                            value="HC-SR04" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'HC-SR04')}
                          >
                            HC-SR04 초음파 거리센서
                          </option>
                        </optgroup>
                        <optgroup label="⚡ 전력 센서">
                          <option 
                            value="INA219" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'INA219')}
                          >
                            INA219 전류/전압 센서 (I2C)
                          </option>
                        </optgroup>
                        <optgroup label="📊 확장 센서">
                          <option 
                            value="MPU6050" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'MPU6050')}
                          >
                            MPU6050 IMU 센서 (자세/진동)
                          </option>
                          <option 
                            value="Generic_Analog_pH" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'Generic_Analog_pH')}
                          >
                            pH 센서 (아날로그 보드)
                          </option>
                          <option 
                            value="Generic_Analog_EC" 
                            disabled={spec.sensors.filter((_, i) => i !== idx).some(s => s.type === 'Generic_Analog_EC')}
                          >
                            EC 센서 (전기전도도)
                          </option>
                        </optgroup>
                      </select>
              <input
                        type="number"
                        value={sensor.count}
                onChange={(e) => setSpec(prev => ({ 
                  ...prev, 
                          sensors: prev.sensors.map((s, i) => 
                            i === idx ? { ...s, count: parseInt(e.target.value) || 1 } : s
                          )
                        }))}
                        min="1"
                        max="10"
                        className="w-20 p-2 border rounded-lg text-gray-800"
                      />
                      <button
                        onClick={() => setSpec(prev => ({
                          ...prev,
                          sensors: prev.sensors.filter((_, i) => i !== idx)
                        }))}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        삭제
                      </button>
            </div>
                  ))}
                  <button
                    onClick={() => {
                      const availableSensors = [
                        'BME280', 'ADS1115', 'BMP280', 'DHT22', 'DS18B20', 'BH1750',
                        'SCD30', 'SCD41', 'ENS160', 'Generic_Analog', 'HC-SR04', 
                        'INA219', 'MPU6050', 'Generic_Analog_pH', 'Generic_Analog_EC'
                      ];
                      const usedSensors = spec.sensors.map(s => s.type);
                      const firstAvailable = availableSensors.find(s => !usedSensors.includes(s));
                      
                      if (firstAvailable) {
                        setSpec(prev => ({
                          ...prev,
                          sensors: [...prev.sensors, { type: firstAvailable, count: 1 }]
                        }));
                      }
                    }}
                    disabled={spec.sensors.length >= 14} // 최대 14개 센서
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    센서 추가
                  </button>
          </div>
        </div>

              {/* 액추에이터 설정 */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-800">액추에이터</h4>
                <div className="space-y-3">
                  {spec.controls.map((control, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                <select
                        value={control.type}
                  onChange={(e) => setSpec(prev => ({ 
                    ...prev, 
                          controls: prev.controls.map((c, i) => 
                            i === idx ? { ...c, type: e.target.value } : c
                          )
                        }))}
                        className="flex-1 p-2 border rounded-lg text-gray-800"
                      >
                        <optgroup label="💡 조명">
                          <option 
                            value="AC_Relay_Lamp" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'AC_Relay_Lamp')}
                          >
                            AC_Relay_Lamp (AC 램프)
                          </option>
                          <option 
                            value="PWM_12V_LED" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'PWM_12V_LED')}
                          >
                            12V LED (MOSFET PWM)
                          </option>
                          <option 
                            value="WS2812B_NeoPixel" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'WS2812B_NeoPixel')}
                          >
                            WS2812B / NeoPixel Strip
                          </option>
                          <option 
                            value="AC_Dimmer_TRIAC" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'AC_Dimmer_TRIAC')}
                          >
                            AC 디머 (TRIAC + ZCD)
                          </option>
                        </optgroup>
                        <optgroup label="🔧 모터">
                          <option 
                            value="TB6612_DC_Motor" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'TB6612_DC_Motor')}
                          >
                            DC 모터 (TB6612FNG 드라이버)
                          </option>
                          <option 
                            value="L298N_DC_Motor" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'L298N_DC_Motor')}
                          >
                            DC 모터 (L298N 드라이버)
                          </option>
                          <option 
                            value="SG90_Servo" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'SG90_Servo')}
                          >
                            SG90 서보모터 (PWM)
                          </option>
                          <option 
                            value="A4988_Stepper" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'A4988_Stepper')}
                          >
                            스테퍼모터 (A4988 드라이버)
                          </option>
                        </optgroup>
                        <optgroup label="🚰 밸브/펌프">
                          <option 
                            value="Solenoid_Valve" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'Solenoid_Valve')}
                          >
                            솔레노이드 밸브 (릴레이 제어)
                          </option>
                          <option 
                            value="Peristaltic_Pump" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'Peristaltic_Pump')}
                          >
                            퍼리스탈틱 펌프 (DC 드라이버)
                          </option>
                        </optgroup>
                        <optgroup label="🌪️ 팬/환기">
                          <option 
                            value="PWM_DC_Fan" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'PWM_DC_Fan')}
                          >
                            DC 팬 (PWM 제어)
                          </option>
                        </optgroup>
                        <optgroup label="🔌 릴레이">
                          <option 
                            value="Solid_State_Relay" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'Solid_State_Relay')}
                          >
                            Solid_State_Relay (SSR)
                          </option>
                        </optgroup>
                        <optgroup label="💡 표시/알람">
                          <option 
                            value="Generic_LED" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'Generic_LED')}
                          >
                            일반 LED (PWM/GPIO)
                          </option>
                          <option 
                            value="PWM_Buzzer" 
                            disabled={spec.controls.filter((_, i) => i !== idx).some(c => c.type === 'PWM_Buzzer')}
                          >
                            PWM_Buzzer (부저)
                          </option>
                        </optgroup>
                </select>
                <input
                        type="number"
                        value={control.count}
                  onChange={(e) => setSpec(prev => ({ 
                    ...prev, 
                          controls: prev.controls.map((c, i) => 
                            i === idx ? { ...c, count: parseInt(e.target.value) || 1 } : c
                          )
                        }))}
                        min="1"
                        max="10"
                        className="w-20 p-2 border rounded-lg text-gray-800"
                      />
                      <button
                        onClick={() => setSpec(prev => ({
                    ...prev, 
                          controls: prev.controls.filter((_, i) => i !== idx)
                        }))}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        삭제
                      </button>
              </div>
                  ))}
                  <button
                    onClick={() => {
                      const availableActuators = [
                        'AC_Relay_Lamp', 'PWM_12V_LED', 'WS2812B_NeoPixel', 'AC_Dimmer_TRIAC',
                        'TB6612_DC_Motor', 'L298N_DC_Motor', 'SG90_Servo', 'A4988_Stepper',
                        'Solenoid_Valve', 'Peristaltic_Pump', 'PWM_DC_Fan', 'Solid_State_Relay',
                        'Generic_LED', 'PWM_Buzzer'
                      ];
                      const usedActuators = spec.controls.map(c => c.type);
                      const firstAvailable = availableActuators.find(a => !usedActuators.includes(a));
                      
                      if (firstAvailable) {
                        setSpec(prev => ({
                          ...prev,
                          controls: [...prev.controls, { type: firstAvailable, count: 1 }]
                        }));
                      }
                    }}
                    disabled={spec.controls.length >= 14} // 최대 14개 액추에이터
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    액추에이터 추가
                  </button>
                </div>
              </div>
            </div>


            {/* 4. 전원 계산 */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">⚡ 전원 계산</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-800">센서 전력 소비</h4>
                  <div className="space-y-2">
                    {spec.sensors.map((sensor, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-800">{sensor.type} × {sensor.count}</span>
                        <span className="text-blue-700 font-medium">{getSensorPower(sensor.type) * sensor.count}mA</span>
                    </div>
                    ))}
                    <div className="border-t pt-2 font-semibold">
                      <div className="flex justify-between">
                        <span className="text-gray-800">센서 총합</span>
                        <span className="text-blue-700 font-bold">{spec.sensors.reduce((sum, s) => sum + getSensorPower(s.type) * s.count, 0)}mA</span>
                      </div>
                      </div>
                      </div>
                      </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-800">액추에이터 전력 소비</h4>
                  <div className="space-y-2">
                    {spec.controls.map((control, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-800">{control.type} × {control.count}</span>
                        <span className="text-green-700 font-medium">{getActuatorPower(control.type) * control.count}mA</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 font-semibold">
                      <div className="flex justify-between">
                        <span className="text-gray-800">액추에이터 총합</span>
                        <span className="text-green-700 font-bold">{spec.controls.reduce((sum, c) => sum + getActuatorPower(c.type) * c.count, 0)}mA</span>
                    </div>
                  </div>
                  </div>
              </div>
            </div>

              <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900">총 전력 소비</span>
                  <span className="text-xl font-bold text-blue-800">
                    {spec.sensors.reduce((sum, s) => sum + getSensorPower(s.type) * s.count, 0) + 
                     spec.controls.reduce((sum, c) => sum + getActuatorPower(c.type) * c.count, 0)}mA
                  </span>
                    </div>
                <p className="text-sm text-blue-800 mt-2">
                  💡 {spec.device.toUpperCase()}는 최대 {
                    spec.device === 'esp32' ? '500' : 
                    spec.device === 'arduino' ? '200' : 
                    spec.device === 'raspberry_pi' ? '2500' : '500'
                  }mA까지 공급 가능합니다. 전력 소비가 높으면 외부 전원 공급을 고려하세요.
                </p>
                      </div>
                      </div>

            {/* 5. 디바이스 핀맵 및 연결 다이어그램 */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">🔌 핀 연결 다이어그램</h3>
              
              {/* 디바이스별 핀맵 표시 */}
            <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">📋 {spec.device.toUpperCase()} 핀맵</h4>
                    </div>
                
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>사용법:</strong> 각 센서/액추에이터는 고유한 색상으로 자동 배정됩니다. 핀맵에서 색상으로 매칭을 확인하고, "변경" 버튼으로 핀을 재할당할 수 있습니다!<br/>
            <strong>참고:</strong> 일부 핀은 디지털과 PWM 기능을 모두 지원합니다 (예: Arduino Uno 핀 3, 5, 6, 9, 10, 11)
          </p>
        </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">디지털 핀</h5>
                    <div className="flex flex-wrap gap-1">
                      {getDevicePins(spec.device, 'digital').map((pin, idx) => {
                        const pwmPins = getDevicePins(spec.device, 'pwm');
                        const isPwmCapable = pwmPins.includes(pin);
                        return (
                          <div
                            key={idx}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              getPinColor(pin)
                                ? `${getPinColor(pin)} text-white`
                                : 'bg-blue-100 text-blue-800'
                            }`}
                            title={isPwmCapable ? `${pin} (PWM 가능)` : pin}
                          >
                            {pin}
                            {isPwmCapable && <span className="text-green-600 ml-1">*</span>}
                      </div>
                        );
                      })}
                      </div>
                    <p className="text-xs text-gray-700 mt-2">* PWM 가능</p>
                      </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2">PWM 핀</h5>
                    <div className="flex flex-wrap gap-1">
                      {getDevicePins(spec.device, 'pwm').map((pin, idx) => {
                        const digitalPins = getDevicePins(spec.device, 'digital');
                        const isAlsoDigital = digitalPins.includes(pin);
                        return (
                          <div
                            key={idx}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              getPinColor(pin)
                                ? `${getPinColor(pin)} text-white`
                                : 'bg-green-100 text-green-800'
                            }`}
                            title={isAlsoDigital ? `${pin} (디지털 핀이기도 함)` : pin}
                          >
                            {pin}
                            {isAlsoDigital && <span className="text-blue-600 ml-1">*</span>}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-700 mt-2">* 디지털 핀과 겹침</p>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h5 className="font-medium text-purple-800 mb-2">아날로그 핀</h5>
                    <div className="flex flex-wrap gap-1">
                      {getDevicePins(spec.device, 'analog').map((pin, idx) => (
                        <div
                          key={idx}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            getPinColor(pin)
                              ? `${getPinColor(pin)} text-white`
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {pin}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-lg">
                    <h5 className="font-medium text-orange-800 mb-2">통신 핀</h5>
                    <div className="space-y-3">
                      <I2CPinDisplay device={spec.device} />
                      <div className="space-y-1">
                        <div className="text-xs text-gray-800">
                          <span className="font-medium">SPI:</span> {getDevicePins(spec.device, 'spi').join(', ')}
                        </div>
                        <div className="text-xs text-gray-800">
                          <span className="font-medium">UART:</span> {getDevicePins(spec.device, 'uart').join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 상세 핀 할당 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-800">📡 센서 핀 할당</h4>
            <button
              onClick={() => {
                savePinAssignments(pinAssignments);
                toast.success('✅ 센서 핀 할당이 저장되었습니다!');
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              💾 저장
            </button>
          </div>
          <div className="space-y-3">
                    {spec.sensors.map((sensor, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-800">{getComponentKoreanName(sensor.type)}</span>
                  <span className="text-sm text-gray-700 bg-gray-200 px-2 py-1 rounded">{sensor.count}개</span>
              </div>
              
                        {/* 센서별 상세 정보 */}
              <div className="space-y-2">
                          {Array.from({ length: sensor.count }, (_, i) => {
                            const pinInfo = getSensorPinInfo(sensor.type, i);
                            return (
                      <div key={i} className="bg-white p-3 rounded border-l-4 border-blue-500">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-800">{getComponentKoreanName(sensor.type)} {i + 1}번</span>
                          <span className="text-xs text-gray-600 font-medium">{pinInfo.power}mA</span>
                        </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-800 font-medium">데이터 핀:</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-white text-xs ${getComponentColor(`sensor_${idx}_${i}_${sensor.type}`)}`}>
                                {pinAssignments[`sensor_${idx}_${i}_${sensor.type}`] || pinInfo.dataPin}
                              </span>
                    <button
                                onClick={() => setShowPinSelector(`sensor_${idx}_${i}_${sensor.type}`)}
                                className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                              >
                                변경
                    </button>
                  </div>
                                  </div>
                                  {pinInfo.powerPin && (
                                    <div>
                                      <span className="text-gray-800 font-medium">전원 핀:</span>
                                      <span className="ml-1 px-2 py-1 bg-red-100 text-red-800 rounded font-medium">{pinInfo.powerPin}</span>
                  </div>
                )}
                                </div>
                                <div className="mt-2 text-xs text-gray-800">
                                  연결: {pinInfo.connection}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
              </div>
            </div>
            
            <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-800">🎛️ 액추에이터 핀 할당</h4>
            <button
              onClick={() => {
                savePinAssignments(pinAssignments);
                toast.success('✅ 액추에이터 핀 할당이 저장되었습니다!');
              }}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              💾 저장
            </button>
          </div>
          <div className="space-y-3">
                    {spec.controls.map((control, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-800">{getComponentKoreanName(control.type)}</span>
                  <span className="text-sm text-gray-700 bg-gray-200 px-2 py-1 rounded">{control.count}개</span>
              </div>
              
                        {/* 액추에이터별 상세 정보 */}
              <div className="space-y-2">
                          {Array.from({ length: control.count }, (_, i) => {
                            const pinInfo = getActuatorPinInfo(control.type, i);
                            return (
                      <div key={i} className="bg-white p-3 rounded border-l-4 border-green-500">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-800">{getComponentKoreanName(control.type)} {i + 1}번</span>
                          <span className="text-xs text-gray-600 font-medium">{pinInfo.power}mA</span>
                    </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-800 font-medium">제어 핀:</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-white text-xs ${getComponentColor(`control_${idx}_${i}_${control.type}`)}`}>
                                {pinAssignments[`control_${idx}_${i}_${control.type}`] || pinInfo.controlPin}
                              </span>
                    <button
                                onClick={() => setShowPinSelector(`control_${idx}_${i}_${control.type}`)}
                                className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                              >
                                변경
                    </button>
                  </div>
                                  </div>
                                  {pinInfo.powerPin && (
                                    <div>
                                      <span className="text-gray-800 font-medium">전원 핀:</span>
                                      <span className="ml-1 px-2 py-1 bg-red-100 text-red-800 rounded font-medium">{pinInfo.powerPin}</span>
                  </div>
                )}
              </div>
                                <div className="mt-2 text-xs text-gray-800">
                                  제어 방식: {pinInfo.controlType}
            </div>
          </div>
                            );
                          })}
        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 핀 충돌 및 주의사항 */}
              <div className="mt-6 space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 핀 충돌 주의사항</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {spec.device === 'esp32' && (
                      <>
                        <li>• GPIO 0, 1은 시리얼 통신용으로 사용하지 마세요</li>
                        <li>• GPIO 21, 22는 I2C 통신용으로 예약되어 있습니다</li>
                        <li>• GPIO 6-11은 SPI 통신용으로 사용하지 마세요</li>
                      </>
                    )}
                    {spec.device === 'arduino' && (
                      <>
                        <li>• 핀 0, 1은 시리얼 통신용으로 사용하지 마세요</li>
                        <li>• 핀 A4, A5는 I2C 통신용으로 예약되어 있습니다</li>
                        <li>• 핀 10-13은 SPI 통신용으로 사용하지 마세요</li>
                      </>
                    )}
                    {spec.device === 'raspberry_pi' && (
                      <>
                        <li>• GPIO 2, 3은 I2C 통신용으로 예약되어 있습니다</li>
                        <li>• GPIO 8-11은 SPI 통신용으로 사용하지 마세요</li>
                        <li>• GPIO 14, 15는 UART 통신용으로 사용하지 마세요</li>
                      </>
                    )}
                    <li>• 실제 하드웨어 연결 시 데이터시트를 확인하세요</li>
              </ul>
            </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 연결 팁</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 센서는 적절한 풀업/풀다운 저항을 사용하세요</li>
                    <li>• 고전력 액추에이터는 외부 전원 공급을 고려하세요</li>
                    <li>• 긴 케이블 사용 시 노이즈 필터링을 추가하세요</li>
                    <li>• 디버깅을 위해 각 핀에 라벨을 붙이세요</li>
                  </ul>
                    </div>
              </div>
            </div>
            
            {/* 6. LoRaWAN 설정 */}
            {spec.protocol === 'lorawan' && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-800">📡 LoRaWAN 설정</h3>
                
                <LoRaWanForm 
                  value={spec.lorawanConfig} 
                  onChange={(config) => setSpec(prev => ({ 
                    ...prev, 
                    lorawanConfig: config 
                  }))} 
                />
                
                {spec.lorawanConfig && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-2">📡</span>
                      <span className="text-sm text-blue-800">
                        LoRaWAN 설정 완료: <strong>{spec.lorawanConfig.lns}</strong> ({spec.lorawanConfig.mode})
                  </span>
              </div>
            </div>
                )}
          </div>
            )}

            {/* 5. 연결 페이지로 이동 버튼 */}
            <div className="bg-white border rounded-lg p-6 mb-8">
              <button
                onClick={() => {
                  // 연결 페이지로 이동 시 저장
                  savePinAssignments(pinAssignments);
                  
                  // 연결 페이지로 이동 (코드 데이터 전달)
                  const codeData = {
                    device: spec.device,
                    protocol: spec.protocol,
                    sensors: spec.sensors,
                    controls: spec.controls,
                    pinAssignments: pinAssignments,
                    powerRequirements: powerRequirements,
                    generatedCode: generatedCode,
                    setupToken: setupToken,
                    farmId: farmId
                  };
                  
                  // sessionStorage에 코드 데이터 저장
                  sessionStorage.setItem('iotCodeData', JSON.stringify(codeData));
                  
                  // 연결 페이지로 이동
                  router.push(`/iot-designer/connect?farmId=${farmId}`);
                }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🔗 연결 페이지로 이동
              </button>
        </div>
          </div>
        )}
        
        {/* 연결 단계 */}
        {currentStep === 'connect' && generatedCode && (
          <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🔗 디바이스 연결</h2>
              <p className="text-gray-700 mb-6">생성된 코드를 다운로드하고 디바이스에 업로드하세요.</p>
          
              {/* 토큰 생성 버튼 */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
            <div>
                    <h3 className="font-semibold text-blue-800 mb-1">🔑 연결 토큰 생성</h3>
                    <p className="text-sm text-blue-700">
                      디바이스와 Universal Bridge 간의 안전한 연결을 위한 토큰을 생성하세요.
                    </p>
                    </div>
                  <button
                    onClick={generateToken}
                    disabled={!!setupToken}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      setupToken 
                        ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {setupToken ? '✅ 토큰 생성됨' : '🔑 토큰 생성'}
                  </button>
                  </div>
              </div>

              {/* Self-Test 패널 */}
              <div className="mb-6">
                <SelfTestPanel />
              </div>
              
              {/* 연결 페이지로 이동 */}
              <div className="bg-white border rounded-lg p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔗</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">디바이스 연결 준비 완료</h3>
                  <p className="text-gray-600 mb-6">
                    생성된 펌웨어 코드를 검토하고 다운로드하여 디바이스에 업로드하세요.
                  </p>
                  <button
                    onClick={() => {
                      // 페이지 이동 시 저장
                      savePinAssignments(pinAssignments);
                      
                      // 연결 페이지로 이동 (코드 데이터 전달)
                      const codeData = {
                        device: spec.device,
                        protocol: spec.protocol,
                        sensors: spec.sensors,
                        controls: spec.controls,
                        pinAssignments: pinAssignments,
                        powerRequirements: powerRequirements,
                        generatedCode: generatedCode,
                        setupToken: setupToken,
                        farmId: farmId
                      };
                      
                      // sessionStorage에 코드 데이터 저장
                      sessionStorage.setItem('iotCodeData', JSON.stringify(codeData));
                      
                      // 연결 페이지로 이동
                      router.push(`/iot-designer/connect?farmId=${farmId}`);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-lg"
                  >
                    🔗 연결 페이지로 이동
                  </button>
                </div>
              </div>
              
              {/* 네비게이션 버튼 */}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep('design')}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← 이전 단계
                </button>
                <button
                  onClick={() => setCurrentStep('monitor')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  연결 단계 →
                </button>
            </div>
          </div>
        </div>
        )}

        {/* 모니터링 단계 */}
        {currentStep === 'monitor' && (
          <div className="space-y-6">
            {/* 단계 표시기 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => router.push(`/iot-designer?farmId=${farmId}`)}
                    className="flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors">1</div>
                    <span className="ml-2 font-medium">디자인</span>
                  </button>
                  <div className="flex-1 h-1 bg-gray-200 mx-4" />
                <button 
                  onClick={() => router.push(`/iot-designer/connect?farmId=${farmId}`)}
                  className="flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors">2</div>
                  <span className="ml-2 font-medium">코드생성</span>
                </button>
                  <div className="flex-1 h-1 bg-blue-200 mx-4" />
                  <div className="flex items-center text-blue-600">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white transition-colors">3</div>
                    <span className="ml-2 font-medium">연결</span>
                  </div>
                </div>
              </div>
            </div>

        <div className="bg-white border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🔗 디바이스 연결</h2>
              <p className="text-gray-700 mb-6">디바이스 연결 상태와 데이터를 실시간으로 확인하세요.</p>
              
              <LiveLog 
                setupToken={setupToken}
              />
              
              {/* 네비게이션 버튼 */}
              <div className="mt-6 flex justify-between">
            <button
                  onClick={() => setCurrentStep('connect')}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← 이전 단계
                </button>
                <button
                  onClick={() => {
                    // 농장 관리 페이지로 이동
                    router.push(`/farms/${farmId}`);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  완료
            </button>
          </div>
        </div>
          </div>
        )}
          </div>
          
      {/* 핀 선택 모달 */}
      {showPinSelector && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">핀 선택</h3>
            <p className="text-sm text-gray-700 mb-4">
              {showPinSelector ? (() => {
                const parts = showPinSelector.split('_');
                const type = parts[parts.length - 1];
                const instance = parts[parts.length - 2];
                return `${getComponentKoreanName(type)} ${parseInt(instance) + 1}번에 할당할 핀을 선택하세요`;
              })() : '핀을 선택하세요'}
            </p>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              {getAvailablePins(showPinSelector).map((pin, idx) => (
                <button
                  key={idx}
                  onClick={() => assignPin(pin, showPinSelector)}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    pinAssignments[showPinSelector] === pin
                      ? `${getComponentColor(showPinSelector)} text-white`
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {pin}
                </button>
              ))}
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPinSelector(null)}
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 저장 경고 모달 */}
      {showSaveWarning && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">😤</div>
              <h3 className="text-xl font-bold mb-4 text-red-600">잠깐! 저장 안하고 가려고?</h3>
              <p className="text-gray-700 mb-6">
                핀 할당을 변경했는데 저장하지 않았어요!<br/>
                <strong className="text-red-600">저장 버튼을 먼저 눌러주세요!</strong>
              </p>
              
              <div className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>팁:</strong> 센서 핀 할당과 액추에이터 핀 할당 카드에 있는 💾 저장 버튼을 눌러주세요!
                  </p>
        </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // 저장 후 페이지 이동
                      savePinAssignments(pinAssignments);
                      setShowSaveWarning(false);
                      
                      toast.success('✅ 저장 완료! 연결 페이지로 이동합니다.');
                      
                      // 연결 페이지로 이동
                      setTimeout(() => {
                        const codeData = {
                          device: spec.device,
                          protocol: spec.protocol,
                          sensors: spec.sensors,
                          controls: spec.controls,
                          pinAssignments: pinAssignments,
                          powerRequirements: powerRequirements,
                          generatedCode: generatedCode,
                          setupToken: setupToken,
                          farmId: farmId
                        };
                        sessionStorage.setItem('iotCodeData', JSON.stringify(codeData));
                        router.push(`/iot-designer/connect?farmId=${farmId}`);
                      }, 100);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    💾 저장하고 계속
                  </button>
                  
                  <button
                    onClick={() => setShowSaveWarning(false)}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    😅 알겠습니다
                  </button>
      </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Suspense로 감싼 메인 컴포넌트
export default function IoTDesignerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">로딩 중...</p>
        </div>
      </div>
    }>
      <IoTDesignerContent />
    </Suspense>
  );
}