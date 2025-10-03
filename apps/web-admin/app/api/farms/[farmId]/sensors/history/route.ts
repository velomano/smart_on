import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params;
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const keys = searchParams.get('keys');
    const startTime = searchParams.get('startTime');

    if (!deviceId || !keys) {
      return NextResponse.json(
        { error: 'deviceId and keys parameters are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const keyArray = keys.split(',');
    const results: any[] = [];

    // Universal Bridge 데이터 조회 (최우선)
    const { data: ubData } = await supabase
      .from('iot_readings')
      .select(`
        ts,
        key,
        value,
        unit,
        iot_devices!inner(device_id, farm_id)
      `)
      .eq('iot_devices.farm_id', farmId)
      .eq('iot_devices.device_id', deviceId)
      .in('key', keyArray)
      .gte('ts', startTime || new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('ts', { ascending: true })
      .limit(100);

    if (ubData && ubData.length > 0) {
      // Universal Bridge 데이터를 시간별로 그룹화
      const groupedData = ubData.reduce((acc: any, reading) => {
        const timestamp = reading.ts;
        if (!acc[timestamp]) {
          acc[timestamp] = { ts: timestamp };
        }
        acc[timestamp][reading.key] = reading.value;
        return acc;
      }, {});

      results.push(...Object.values(groupedData));
    }

    // MQTT Bridge 데이터 조회 (Fallback)
    if (results.length === 0) {
      const { data: mqttData } = await supabase
        .from('sensor_readings')
        .select(`
          timestamp,
          value,
          unit,
          sensors!inner(type, devices!inner(device_id, farm_id))
        `)
        .eq('sensors.devices.farm_id', farmId)
        .eq('sensors.devices.device_id', deviceId)
        .in('sensors.type', keyArray)
        .gte('timestamp', startTime || new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true })
        .limit(100);

      if (mqttData && mqttData.length > 0) {
        // MQTT 데이터를 시간별로 그룹화
        const groupedData = mqttData.reduce((acc: any, reading) => {
          const timestamp = reading.timestamp;
          if (!acc[timestamp]) {
            acc[timestamp] = { ts: timestamp };
          }
          acc[timestamp][(reading as any).sensors.type] = reading.value;
          return acc;
        }, {});

        results.push(...Object.values(groupedData));
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Sensor history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor history' },
      { status: 500 }
    );
  }
}
