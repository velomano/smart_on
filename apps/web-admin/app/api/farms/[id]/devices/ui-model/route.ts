/**
 * GET /api/farms/:farmId/devices/ui-model
 * 
 * 농장 내 모든 디바이스의 UI Model 배치 조회
 * - 각 디바이스의 ui-model을 조회하여 배열로 반환
 * - 프로파일 누락/에러 시 warnings 포함
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const farmId = params.id;
    const supabase = await createClient();

    // 1. 농장 내 모든 디바이스 조회
    const { data: devices, error: devicesError } = await supabase
      .from('iot_devices')
      .select('id, device_id, profile_id, tenant_id, last_seen_at')
      .eq('farm_id', farmId);

    if (devicesError) {
      return NextResponse.json(
        { error: 'Failed to fetch devices', details: devicesError.message },
        { status: 500 }
      );
    }

    if (!devices || devices.length === 0) {
      return NextResponse.json({
        farm_id: farmId,
        devices: [],
        warnings: ['No devices found for this farm'],
      });
    }

    // 2. 각 디바이스의 UI Model 조회
    const uiModels = [];
    const warnings = [];

    for (const device of devices) {
      try {
        const model = await getDeviceUIModel(device.id, device);
        uiModels.push(model);
      } catch (error: any) {
        warnings.push(`Device ${device.device_id}: ${error.message}`);
        
        // Fallback: Generic UI Model
        uiModels.push({
          device_id: device.device_id,
          device_uuid: device.id,
          profile_id: device.profile_id,
          profile: null,
          model: { sensors: [], actuators: [] },
          template: getFallbackTemplate(),
          safety_rules: null,
          online: isDeviceOnline(device.last_seen_at),
          warnings: [error.message],
        });
      }
    }

    return NextResponse.json({
      farm_id: farmId,
      device_count: devices.length,
      devices: uiModels,
      warnings: warnings.length > 0 ? warnings : undefined,
    });

  } catch (error: any) {
    console.error('Farm UI Model Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * 단일 디바이스 UI Model 조회
 */
async function getDeviceUIModel(deviceUuid: string, device: any) {
  const supabase = await createClient();

  // 1. Device Profile 조회
  let profile = null;
  if (device.profile_id) {
    const { data: profileData } = await supabase
      .from('device_profiles')
      .select('*')
      .eq('id', device.profile_id)
      .single();

    if (profileData) {
      profile = profileData;
    }
  }

  // 2. Device Registry 조회
  const { data: registry } = await supabase
    .from('device_registry')
    .select('*')
    .eq('device_uuid', deviceUuid)
    .order('registered_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Capabilities 병합 (Registry 우선)
  const model = mergeCapabilities(profile, registry);

  // 4. UI Template 병합
  const template = mergeTemplates(profile, registry);

  // 5. Online 상태
  const online = isDeviceOnline(device.last_seen_at);

  return {
    device_id: device.device_id,
    device_uuid: deviceUuid,
    profile_id: device.profile_id,
    profile: profile ? {
      id: profile.id,
      name: profile.name,
      version: profile.version,
    } : null,
    model,
    template,
    safety_rules: profile?.safety_rules || null,
    online,
    last_seen_at: device.last_seen_at,
  };
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
 * UI Template 병합 (Profile 기본 + Registry 확장)
 */
function mergeTemplates(profile: any, registry: any) {
  const profileTemplate = profile?.ui_template || getFallbackTemplate();
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

/**
 * Fallback Template (프로파일 없을 때)
 */
function getFallbackTemplate() {
  return {
    version: '1',
    layout: 'grid-2col',
    cards: [
      { type: 'status', span: 12 },
      { type: 'raw-data', span: 12 },
    ],
  };
}

/**
 * 디바이스 온라인 상태 (5분 이내 활동)
 */
function isDeviceOnline(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  const lastSeen = new Date(lastSeenAt);
  const now = new Date();
  return (now.getTime() - lastSeen.getTime()) < 5 * 60 * 1000; // 5분
}

