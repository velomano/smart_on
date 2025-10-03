import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string; deviceId: string }> }
) {
  try {
    const { farmId, deviceId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = createClient();
    const events: any[] = [];

    // Universal Bridge 이벤트 조회 (최우선)
    const { data: ubEvents } = await supabase
      .from('iot_commands')
      .select(`
        id,
        type,
        status,
        created_at,
        sent_at,
        ack_timestamp,
        ack_payload,
        iot_devices!inner(device_id, farm_id)
      `)
      .eq('iot_devices.farm_id', farmId)
      .eq('iot_devices.device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (ubEvents) {
      events.push(...ubEvents.map(event => ({
        level: event.status === 'failed' ? 'error' : 
               event.status === 'pending' ? 'warn' : 'info',
        message: `명령 ${event.type} - ${event.status}`,
        details: event.status === 'acknowledged' ? 
          `응답: ${JSON.stringify(event.ack_payload)}` : 
          event.status === 'failed' ? '명령 실행 실패' :
          '명령 대기 중',
        timestamp: event.ack_timestamp || event.sent_at || event.created_at,
        metadata: {
          commandId: event.id,
          type: event.type,
          status: event.status
        }
      })));
    }

    // 디바이스 연결 상태 이벤트 생성
    const { data: deviceData } = await supabase
      .from('iot_devices')
      .select('status, last_seen_at, created_at')
      .eq('device_id', deviceId)
      .eq('farm_id', farmId)
      .single();

    if (deviceData) {
      // 연결 상태 이벤트
      const connectionEvent = {
        level: deviceData.status === 'online' ? 'info' : 'warn',
        message: `디바이스 ${deviceData.status === 'online' ? '연결됨' : '연결 끊김'}`,
        details: deviceData.status === 'online' ? 
          `마지막 접속: ${new Date(deviceData.last_seen_at).toLocaleString('ko-KR')}` :
          '디바이스가 응답하지 않습니다',
        timestamp: deviceData.last_seen_at || deviceData.created_at,
        metadata: {
          deviceStatus: deviceData.status,
          lastSeen: deviceData.last_seen_at
        }
      };

      events.push(connectionEvent);

      // 최근 센서 데이터 이벤트
      const { data: sensorData } = await supabase
        .from('iot_readings')
        .select('key, value, unit, ts')
        .eq('iot_devices.device_id', deviceId)
        .eq('iot_devices.farm_id', farmId)
        .order('ts', { ascending: false })
        .limit(1)
        .single();

      if (sensorData) {
        const sensorEvent = {
          level: 'info',
          message: `센서 데이터 수신: ${sensorData.key}`,
          details: `값: ${sensorData.value} ${sensorData.unit || ''}`,
          timestamp: sensorData.ts,
          metadata: {
            sensorType: sensorData.key,
            value: sensorData.value,
            unit: sensorData.unit
          }
        };
        events.push(sensorEvent);
      }
    }

    // 시간순 정렬 (최신순)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      events: events.slice(0, limit)
    });

  } catch (error) {
    console.error('Device events API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch device events' },
      { status: 500 }
    );
  }
}
