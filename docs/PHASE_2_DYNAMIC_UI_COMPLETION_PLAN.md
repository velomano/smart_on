# Phase 2: Dynamic UI 시스템 완성 계획서

**날짜**: 2025-01-15  
**목표**: Dynamic UI 시스템 완성도 85% → 100%  
**예상 시간**: 8-12시간 (1-2일)  

---

## 🎯 **Phase 2 목표**

### **현재 상태**
- ✅ **Device Profile 기반 UI 자동 생성** (100%)
- ✅ **디바이스 연결 및 모니터링** (100%)
- ✅ **제어 명령 전송** (100%)
- ⚠️ **Gauge 실시간 데이터** (0% - "--" 표시)
- ⚠️ **Line Chart** (0% - Placeholder)
- ⚠️ **Event Log** (0% - Placeholder)
- ⚠️ **Unified Data Layer** (60% - MQTT/Tuya 통합 필요)

### **목표 상태**
- 🎯 **모든 UI 컴포넌트에 실제 데이터 표시**
- 🎯 **실시간 업데이트 (5초 이내)**
- 🎯 **모든 센서 타입 지원 (Universal + MQTT + Tuya)**
- 🎯 **사용자 친화적 인터페이스**

---

## 📋 **작업 순서 및 계획**

### **Step 1: Gauge 실시간 데이터 업데이트** (우선순위: 최고)
**예상 시간**: 1-2시간  
**파일**: `apps/web-admin/src/components/farm/FarmAutoDashboard.tsx`

#### **현재 문제점**
```tsx
// Line 226-233
function GaugeCard({ metric, thresholds, deviceId, model, farmId }: any) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">{metric}</h3>
      <div className="text-2xl font-bold text-gray-400">--</div> {/* 문제: 실제 값 표시 안됨 */}
      <p className="text-xs text-gray-500 mt-1">단위: --</p>
    </div>
  );
}
```

#### **해결 방안**
1. **실시간 데이터 조회 함수 추가**
2. **Gauge 값 표시 로직 구현**
3. **임계값 기반 색상 변경**
4. **단위 표시 개선**

#### **구현 계획**
```tsx
// 개선된 GaugeCard 컴포넌트
function GaugeCard({ metric, thresholds, deviceId, model, farmId }: any) {
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [unit, setUnit] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGaugeData = async () => {
      try {
        const data = await getLatestSensorData(farmId, deviceId, metric);
        setCurrentValue(data.value);
        setUnit(data.unit);
      } catch (error) {
        console.error('Gauge data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGaugeData();
    const interval = setInterval(fetchGaugeData, 5000); // 5초마다 업데이트
    return () => clearInterval(interval);
  }, [farmId, deviceId, metric]);

  const getStatusColor = (value: number, thresholds: any) => {
    if (value < thresholds.min || value > thresholds.max) return 'text-red-600';
    if (value < thresholds.warning_min || value > thresholds.warning_max) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">{metric}</h3>
      <div className={`text-2xl font-bold ${isLoading ? 'text-gray-400' : getStatusColor(currentValue || 0, thresholds)}`}>
        {isLoading ? '...' : currentValue !== null ? `${currentValue}${unit}` : '--'}
      </div>
      <p className="text-xs text-gray-500 mt-1">단위: {unit || '--'}</p>
    </div>
  );
}
```

---

### **Step 2: Unified Data Layer 완성** (우선순위: 높음)
**예상 시간**: 3-4시간  
**파일**: `apps/web-admin/src/lib/data/unified-iot-data.ts`

#### **현재 문제점**
```typescript
// Line 130-135
// TODO: 기존 MQTT Bridge 데이터 조회 로직 통합
// const mqttSensors = await getMqttSensors(farmId);
// sensors.push(...mqttSensors);

// TODO: 기존 Tuya 데이터 통합
// const tuyaSensors = await getTuyaSensors(farmId);
// sensors.push(...tuyaSensors);
```

#### **해결 방안**
1. **MQTT Bridge 데이터 조회 함수 구현**
2. **Tuya API 데이터 조회 함수 구현**
3. **데이터 정규화 로직 구현**
4. **우선순위 적용 (universal > mqtt > tuya)**

#### **구현 계획**
```typescript
// 개선된 Unified Data Layer
export async function getUnifiedSensorData(farmId: string): Promise<SensorData[]> {
  const sensors: SensorData[] = [];

  try {
    // 1. Universal Bridge 데이터 (최우선)
    const universalSensors = await getUniversalSensors(farmId);
    sensors.push(...universalSensors);

    // 2. MQTT Bridge 데이터 (기존)
    const mqttSensors = await getMqttBridgeSensors(farmId);
    // 중복 제거: Universal Bridge에 없는 센서만 추가
    const uniqueMqttSensors = mqttSensors.filter(mqtt => 
      !universalSensors.some(uni => uni.sensorType === mqtt.sensorType)
    );
    sensors.push(...uniqueMqttSensors);

    // 3. Tuya 데이터 (기존)
    const tuyaSensors = await getTuyaSensors(farmId);
    const uniqueTuyaSensors = tuyaSensors.filter(tuya => 
      !sensors.some(existing => existing.sensorType === tuya.sensorType)
    );
    sensors.push(...uniqueTuyaSensors);

  } catch (error) {
    console.error('Unified sensor data fetch error:', error);
  }

  return sensors;
}

// MQTT Bridge 센서 데이터 조회
async function getMqttBridgeSensors(farmId: string): Promise<SensorData[]> {
  const supabase = await import('@/lib/supabase').then(m => m.getSupabaseClient());
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('sensor_readings')
    .select('sensors!inner(type, devices!inner(farm_id))')
    .eq('sensors.devices.farm_id', farmId)
    .gte('ts', fiveMinutesAgo);

  if (error) {
    console.warn('MQTT Bridge sensor data fetch failed:', error);
    return [];
  }

  return data?.map(item => ({
    sensorType: (item as any).sensors.type,
    value: 0, // 실제 값은 별도 조회 필요
    unit: '',
    timestamp: new Date().toISOString(),
    source: 'mqtt_bridge'
  })) || [];
}

// Tuya 센서 데이터 조회
async function getTuyaSensors(farmId: string): Promise<SensorData[]> {
  // Tuya API 연동 로직 구현
  // 실제 구현은 Tuya API 문서 참조
  return [];
}
```

---

### **Step 3: Line Chart 구현** (우선순위: 중간)
**예상 시간**: 2-3시간  
**파일**: `apps/web-admin/src/components/farm/FarmAutoDashboard.tsx`

#### **현재 문제점**
```tsx
// Line 326-334
function LineChartCard({ series, deviceId, model, farmId }: any) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">라인 차트</h3>
      <p className="text-sm text-gray-500">시리즈: {series?.join(', ')}</p>
      <p className="text-xs text-gray-400 mt-2">차트 구현 예정</p> {/* 문제: 실제 차트 없음 */}
    </div>
  );
}
```

#### **해결 방안**
1. **Recharts 라이브러리 설치 및 설정**
2. **실시간 데이터 조회 로직 구현**
3. **Time series 차트 컴포넌트 구현**
4. **반응형 디자인 적용**

#### **구현 계획**
```bash
# 1. Recharts 설치
npm install recharts
npm install @types/recharts --save-dev
```

```tsx
// 개선된 LineChartCard 컴포넌트
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function LineChartCard({ series, deviceId, model, farmId }: any) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const data = await getTimeSeriesData(farmId, deviceId, series);
        setChartData(data);
      } catch (error) {
        console.error('Chart data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
    const interval = setInterval(fetchChartData, 10000); // 10초마다 업데이트
    return () => clearInterval(interval);
  }, [farmId, deviceId, series]);

  if (isLoading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold mb-2">라인 차트</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">데이터 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">라인 차트</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />
            {series.map((serie: string, index: number) => (
              <Line
                key={serie}
                type="monotone"
                dataKey={serie}
                stroke={`hsl(${index * 60}, 70%, 50%)`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

### **Step 4: Event Log 구현** (우선순위: 낮음)
**예상 시간**: 2-3시간  
**파일**: `apps/web-admin/src/components/farm/FarmAutoDashboard.tsx`

#### **현재 문제점**
- Event Log 컴포넌트가 Placeholder만 존재

#### **해결 방안**
1. **디바이스 이벤트 로그 조회 API 구현**
2. **실시간 이벤트 표시 UI 구현**
3. **로그 레벨별 색상 구분**
4. **시간순 정렬 및 필터링**

#### **구현 계획**
```tsx
// EventLogCard 컴포넌트 구현
function EventLogCard({ deviceId, farmId }: any) {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getDeviceEvents(farmId, deviceId);
        setEvents(data);
      } catch (error) {
        console.error('Event log fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5000); // 5초마다 업데이트
    return () => clearInterval(interval);
  }, [farmId, deviceId]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">이벤트 로그</h3>
      <div className="h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">이벤트가 없습니다</div>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event, index) => (
              <div key={index} className={`p-2 rounded text-xs ${getLogColor(event.level)}`}>
                <div className="flex justify-between items-start">
                  <span className="font-medium">{event.message}</span>
                  <span className="text-gray-500 ml-2">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {event.details && (
                  <div className="text-gray-600 mt-1">{event.details}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📅 **실행 일정**

### **Day 1 (오늘)**
- **오전**: Step 1 - Gauge 실시간 데이터 업데이트 (1-2시간)
- **오후**: Step 2 - Unified Data Layer 완성 (3-4시간)

### **Day 2 (내일)**
- **오전**: Step 3 - Line Chart 구현 (2-3시간)
- **오후**: Step 4 - Event Log 구현 (2-3시간)

---

## ✅ **완료 체크리스트**

### **Step 1: Gauge 실시간 데이터**
- [ ] `getLatestSensorData` 함수 구현
- [ ] Gauge 값 표시 로직 추가
- [ ] 임계값 기반 색상 변경
- [ ] 5초 간격 실시간 업데이트
- [ ] 단위 표시 개선

### **Step 2: Unified Data Layer**
- [ ] `getMqttBridgeSensors` 함수 구현
- [ ] `getTuyaSensors` 함수 구현
- [ ] 데이터 정규화 로직 구현
- [ ] 중복 제거 로직 구현
- [ ] 우선순위 적용

### **Step 3: Line Chart**
- [ ] Recharts 라이브러리 설치
- [ ] `getTimeSeriesData` 함수 구현
- [ ] LineChart 컴포넌트 구현
- [ ] 반응형 디자인 적용
- [ ] 10초 간격 실시간 업데이트

### **Step 4: Event Log**
- [ ] `getDeviceEvents` 함수 구현
- [ ] EventLogCard 컴포넌트 구현
- [ ] 로그 레벨별 색상 구분
- [ ] 시간순 정렬
- [ ] 5초 간격 실시간 업데이트

---

## 🎯 **성공 기준**

Phase 2 완료 시:
- ✅ **모든 Gauge에 실제 센서 값 표시**
- ✅ **Line Chart에 실시간 데이터 표시**
- ✅ **Event Log에 디바이스 이벤트 표시**
- ✅ **Universal + MQTT + Tuya 데이터 통합**
- ✅ **5초 이내 실시간 UI 업데이트**

---

**Phase 2 완료 후 Dynamic UI 시스템이 100% 완성되어 완전한 IoT 대시보드가 됩니다!** 🚀
