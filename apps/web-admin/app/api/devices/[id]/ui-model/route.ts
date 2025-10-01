/**
 * GET /api/devices/:id/ui-model
 * 
 * Device Profile + Registry → UI Model 자동 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deviceId = params.id;
    const supabase = createServerClient();

    // 1. Device 조회
    const { data: device, error: deviceError } = await supabase
      .from('iot_devices')
      .select('id, tenant_id, profile_id, device_id, device_type, status')
      .eq('id', deviceId)
      .single();

    if (deviceError || !device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // 2. Registry 조회 (실제 하드웨어 능력)
    const { data: registry } = await supabase
      .from('device_registry')
      .select('version, capabilities, reported_at')
      .eq('device_id', deviceId)
      .single();

    // 3. Profile 조회 (템플릿)
    const { data: profile } = await supabase
      .from('device_profiles')
      .select('id, version, name, capabilities, ui_template, safety_rules')
      .eq('id', device.profile_id || 'generic-v1')
      .single();

    // 4. User Template 조회 (사용자 커스터마이징)
    const { data: userTemplate } = await supabase
      .from('device_ui_templates')
      .select('template, updated_at')
      .eq('device_id', deviceId)
      .single();

    // 5. Model 빌드 (Registry 우선, Profile 폴백)
    const capabilities = registry?.capabilities || profile?.capabilities || { sensors: [], actuators: [] };
    
    // 6. Normalization (canonical_key 매핑)
    const normalizedSensors = normalizeSensors(
      capabilities.sensors || [],
      profile?.capabilities?.sensors || []
    );
    
    const normalizedActuators = normalizeActuators(
      capabilities.actuators || [],
      profile?.capabilities?.actuators || []
    );

    // 7. Template 결정 (우선순위: User > Profile > Auto)
    let template = userTemplate?.template 
                   || profile?.ui_template 
                   || autoGenerateTemplate(normalizedSensors, normalizedActuators);

    // 8. Warnings 생성
    const warnings = generateWarnings(registry, profile, normalizedSensors);

    // 9. ETag 생성
    const etag = generateETag({
      device: device.id,
      registry: registry?.reported_at,
      profile: profile?.version,
      user: userTemplate?.updated_at,
    });

    // 10. UI Model 반환
    const uiModel = {
      device: {
        id: device.id,
        device_id: device.device_id,
        tenant_id: device.tenant_id,
        type: device.device_type,
        status: device.status,
      },
      profile: profile ? {
        id: profile.id,
        version: profile.version,
        name: profile.name,
      } : null,
      model: {
        sensors: normalizedSensors,
        actuators: normalizedActuators,
      },
      template: {
        source: userTemplate ? 'user' : (profile?.ui_template ? 'profile' : 'auto'),
        ...template,
      },
      safety_rules: profile?.safety_rules || {},
      warnings,
      meta: {
        version: '1',
        etag,
        updated_at: new Date().toISOString(),
      },
    };

    return NextResponse.json(uiModel, {
      headers: {
        'ETag': `W/"${etag}"`,
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    });

  } catch (error: any) {
    console.error('[UI Model] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to build UI model' },
      { status: 500 }
    );
  }
}

// ==================== Helper Functions ====================

function normalizeSensors(registrySensors: any[], profileSensors: any[]) {
  const normalized = [];
  const profileMap = new Map(profileSensors.map(s => [s.canonical_key || s.key, s]));

  for (const sensor of registrySensors) {
    const profileSensor = profileMap.get(sensor.key) || profileMap.get(sensor.canonical_key);
    
    normalized.push({
      key: sensor.key,
      canonical_key: profileSensor?.canonical_key || sensor.key,
      label: profileSensor?.label || sensor.label || sensor.key,
      labels: profileSensor?.labels || {},
      unit: sensor.unit || profileSensor?.unit || '',
      display_unit: profileSensor?.display_unit || sensor.unit,
      kind: profileSensor?.kind || 'custom',
      range: profileSensor?.range,
      source: 'registry',
    });
  }

  // Profile에만 있고 Registry에 없는 센서도 추가
  for (const profileSensor of profileSensors) {
    const key = profileSensor.canonical_key || profileSensor.key;
    if (!normalized.find(s => s.canonical_key === key)) {
      normalized.push({
        ...profileSensor,
        source: 'profile',
      });
    }
  }

  return normalized;
}

function normalizeActuators(registryActuators: any[], profileActuators: any[]) {
  const normalized = [];
  const profileMap = new Map(profileActuators.map(a => [a.canonical_key || a.type, a]));

  for (const actuator of registryActuators) {
    const profileActuator = profileMap.get(actuator.type);
    
    normalized.push({
      type: actuator.type,
      canonical_key: profileActuator?.canonical_key || actuator.type,
      label: profileActuator?.label || actuator.label || actuator.type,
      labels: profileActuator?.labels || {},
      channels: actuator.channels,
      commands: profileActuator?.commands || actuator.commands || [],
      source: 'registry',
    });
  }

  return normalized;
}

function autoGenerateTemplate(sensors: any[], actuators: any[]) {
  const cards = [];

  // 센서가 있으면 차트 + 카드
  if (sensors.length > 0) {
    const sensorKeys = sensors.map(s => s.canonical_key);
    
    // 라인 차트
    cards.push({
      type: 'line-chart',
      series: sensorKeys,
      span: 12,
    });
    
    // 센서별 게이지 카드
    for (const sensor of sensors) {
      cards.push({
        type: 'gauge',
        metric: sensor.canonical_key,
        span: sensors.length > 2 ? 6 : 12 / sensors.length,
      });
    }
  }

  // 액추에이터가 있으면 제어 패널
  if (actuators.length > 0) {
    for (const actuator of actuators) {
      cards.push({
        type: 'actuator',
        actuatorType: actuator.type,
        channels: actuator.channels,
        span: 12,
      });
    }
  }

  return {
    layout: 'grid-2col',
    cards,
  };
}

function generateWarnings(registry: any, profile: any, sensors: any[]) {
  const warnings = [];

  // 단위 불일치 체크
  for (const sensor of sensors) {
    if (sensor.unit && sensor.display_unit && sensor.unit !== sensor.display_unit) {
      warnings.push({
        code: 'unit_mismatch',
        detail: `${sensor.label}: ${sensor.unit} → ${sensor.display_unit} 변환 적용`,
        severity: 'info',
      });
    }
  }

  // Registry 없음
  if (!registry) {
    warnings.push({
      code: 'no_registry',
      detail: '디바이스가 아직 능력을 신고하지 않았습니다. Profile 기본값을 사용합니다.',
      severity: 'warn',
    });
  }

  // Profile 없음
  if (!profile) {
    warnings.push({
      code: 'no_profile',
      detail: 'Device Profile이 없습니다. Generic UI를 사용합니다.',
      severity: 'warn',
    });
  }

  return warnings;
}

function generateETag(data: any): string {
  const crypto = require('crypto');
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
  return hash.substring(0, 8);
}

