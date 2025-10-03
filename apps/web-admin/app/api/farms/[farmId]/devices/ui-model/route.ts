import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params;
    const supabase = createClient();

    // 농장의 디바이스 목록 조회 (Universal Bridge와 MQTT Bridge 모두)
    const { data: universalDevices, error: universalError } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('farm_id', farmId)
      .eq('status', 'active');

    const { data: mqttDevices, error: mqttError } = await supabase
      .from('devices')
      .select('*')
      .eq('farm_id', farmId)
      .eq('is_active', true);

    if (universalError) {
      console.error('Universal Bridge 디바이스 조회 오류:', universalError);
    }

    if (mqttError) {
      console.error('MQTT Bridge 디바이스 조회 오류:', mqttError);
    }

    // 디바이스 UI 모델 생성
    const deviceUIModels = [];

    // Universal Bridge 디바이스 처리
    if (universalDevices) {
      for (const device of universalDevices) {
        deviceUIModels.push({
          deviceId: device.device_id,
          deviceName: device.device_name || `Device ${device.device_id}`,
          deviceType: device.device_type || 'sensor',
          profile: {
            device_type: device.device_type || 'sensor',
            capabilities: device.capabilities || [],
            metadata: device.metadata || {}
          },
          registry: {
            farm_id: device.farm_id,
            tenant_id: device.tenant_id,
            status: device.status,
            last_seen_at: device.last_seen_at,
            created_at: device.created_at
          },
          uiModel: {
            displayName: device.device_name || `Device ${device.device_id}`,
            sensors: device.capabilities || [],
            actuators: [],
            powerConsumption: device.metadata?.power_consumption || 0,
            communication: device.metadata?.communication || 'HTTP'
          },
          source: 'universal-bridge'
        });
      }
    }

    // MQTT Bridge 디바이스 처리 (중복 제거)
    if (mqttDevices) {
      for (const device of mqttDevices) {
        // Universal Bridge에 이미 있는 디바이스는 제외
        const existsInUniversal = deviceUIModels.some(d => d.deviceId === device.id);
        if (existsInUniversal) continue;

        deviceUIModels.push({
          deviceId: device.id,
          deviceName: device.name || `Device ${device.id}`,
          deviceType: device.device_type || 'sensor',
          profile: {
            device_type: device.device_type || 'sensor',
            capabilities: device.sensors || [],
            metadata: device.metadata || {}
          },
          registry: {
            farm_id: device.farm_id,
            tenant_id: device.tenant_id,
            status: device.is_active ? 'active' : 'inactive',
            last_seen_at: device.last_seen_at,
            created_at: device.created_at
          },
          uiModel: {
            displayName: device.name || `Device ${device.id}`,
            sensors: device.sensors || [],
            actuators: device.actuators || [],
            powerConsumption: device.power_consumption || 0,
            communication: device.communication || 'MQTT'
          },
          source: 'mqtt-bridge'
        });
      }
    }

    return NextResponse.json(deviceUIModels);
  } catch (error) {
    console.error('디바이스 UI 모델 조회 오류:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
