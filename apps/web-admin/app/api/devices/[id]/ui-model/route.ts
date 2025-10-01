/**
 * GET /api/devices/:deviceId/ui-model
 * 
 * Device Profile + Registry를 병합하여 UI 모델 생성
 * - Profile: 기본 템플릿 (esp32-dht22-v1 등)
 * - Registry: 장치가 신고한 실제 능력 (센서 추가 등)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deviceId = params.id;
    const supabase = await createClient();

    // 1. 장치 정보 조회
    const { data: device, error: deviceError } = await supabase
      .from('iot_devices')
      .select('id, device_id, profile_id, tenant_id')
      .eq('id', deviceId)
      .single();

    if (deviceError || !device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // 2. Device Profile 조회
    let profile = null;
    if (device.profile_id) {
      const { data: profileData, error: profileError } = await supabase
        .from('device_profiles')
        .select('*')
        .eq('id', device.profile_id)
        .single();

      if (!profileError && profileData) {
        profile = profileData;
      }
    }

    // 3. Device Registry 조회 (장치가 신고한 실제 능력)
    const { data: registry, error: registryError } = await supabase
      .from('device_registry')
      .select('*')
      .eq('device_uuid', deviceId)
      .order('registered_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 4. 모델 병합 (Registry 우선, Profile은 기본값)
    const model = mergeCapabilities(profile, registry);

    // 5. UI 템플릿 병합
    const template = mergeTemplates(profile, registry);

    return NextResponse.json({
      device_id: device.device_id,
      profile_id: device.profile_id,
      profile: profile ? {
        id: profile.id,
        name: profile.name,
        version: profile.version,
      } : null,
      model,
      template,
      safety_rules: profile?.safety_rules || null,
    });

  } catch (error) {
    console.error('UI Model Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Capabilities 병합 (Registry 우선)
 */
function mergeCapabilities(profile: any, registry: any) {
  const profileCap = profile?.capabilities || { sensors: [], actuators: [] };
  const registryCap = registry?.capabilities || { sensors: [], actuators: [] };

  return {
    sensors: [...profileCap.sensors, ...registryCap.sensors],
    actuators: [...profileCap.actuators, ...registryCap.actuators],
  };
}

/**
 * UI Template 병합 (Profile 기본, Registry로 확장)
 */
function mergeTemplates(profile: any, registry: any) {
  const profileTemplate = profile?.ui_template || {
    version: '1',
    layout: 'grid-2col',
    cards: [],
  };

  const registryTemplate = registry?.ui_overrides || null;

  // Registry에 UI 오버라이드가 있으면 병합
  if (registryTemplate) {
    return {
      ...profileTemplate,
      cards: [...profileTemplate.cards, ...(registryTemplate.cards || [])],
    };
  }

  // Registry에 센서가 추가되었으면 자동 카드 생성
  const registryCap = registry?.capabilities || { sensors: [] };
  const autoCards = registryCap.sensors.map((sensor: any) => ({
    type: 'gauge',
    metric: sensor.canonical_key || sensor.key,
    span: 6,
  }));

  return {
    ...profileTemplate,
    cards: [...profileTemplate.cards, ...autoCards],
  };
}
