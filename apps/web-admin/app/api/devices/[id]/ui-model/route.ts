import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: deviceId } = await params;

  if (!deviceId) {
    return NextResponse.json(
      { error: 'deviceId is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient();

    // 디바이스 정보 가져오기
    const { data: device, error: deviceError } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('id', deviceId)
      .single();

    if (deviceError) {
      throw deviceError;
    }

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // 디바이스 프로파일 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('device_profiles')
      .select('*')
      .eq('id', device.profile_id)
      .single();

    if (profileError) {
      console.warn(`Profile not found for device ${deviceId}:`, profileError);
    }

    // 디바이스 레지스트리 가져오기
    const { data: registry, error: registryError } = await supabase
      .from('device_registry')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (registryError) {
      console.warn(`Registry not found for device ${deviceId}:`, registryError);
    }

    // UI 모델 생성
    const uiModel = {
      device: {
        id: device.id,
        name: device.name,
        type: device.type,
        status: device.status || 'unknown'
      },
      profile: profile || null,
      registry: registry || null,
      sensors: profile?.capabilities?.sensors || [],
      actuators: profile?.capabilities?.actuators || [],
      uiTemplate: profile?.ui_template || null,
      safetyRules: profile?.safety_rules || null
    };

    return NextResponse.json(uiModel);
  } catch (error) {
    console.error('Error fetching device UI model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch device UI model' },
      { status: 500 }
    );
  }
}