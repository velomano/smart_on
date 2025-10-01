import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const farmId = params.id;

  if (!farmId) {
    return NextResponse.json(
      { error: 'farmId is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient();

    // 농장의 모든 디바이스 가져오기
    const { data: devices, error: devicesError } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('farm_id', farmId);

    if (devicesError) {
      throw devicesError;
    }

    if (!devices || devices.length === 0) {
      return NextResponse.json([]);
    }

    // 각 디바이스의 UI 모델 가져오기
    const deviceUIModels = await Promise.all(
      devices.map(async (device) => {
        try {
          const response = await fetch(
            `${request.nextUrl.origin}/api/devices/${device.id}/ui-model`
          );
          
          if (response.ok) {
            const uiModel = await response.json();
            return {
              deviceId: device.id,
              deviceName: device.name,
              profile: uiModel.profile,
              registry: uiModel.registry,
              uiModel: uiModel.uiModel
            };
          }
          
          return {
            deviceId: device.id,
            deviceName: device.name,
            profile: null,
            registry: null,
            uiModel: null
          };
        } catch (error) {
          console.error(`Error fetching UI model for device ${device.id}:`, error);
          return {
            deviceId: device.id,
            deviceName: device.name,
            profile: null,
            registry: null,
            uiModel: null
          };
        }
      })
    );

    return NextResponse.json(deviceUIModels);
  } catch (error) {
    console.error('Error fetching farm device UI models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch farm device UI models' },
      { status: 500 }
    );
  }
}