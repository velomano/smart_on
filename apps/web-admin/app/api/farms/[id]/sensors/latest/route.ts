/**
 * GET /api/farms/:farmId/sensors/latest
 * 
 * 농장 내 센서 최신값 배치 조회
 * - Query: deviceId, keys (comma-separated)
 * - 응답: { [key]: { value, unit, ts } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestSensorValues } from '@/lib/data/unified-iot-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const farmId = params.id;
    const { searchParams } = new URL(request.url);
    
    const deviceId = searchParams.get('deviceId');
    const keysParam = searchParams.get('keys');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId is required' },
        { status: 400 }
      );
    }

    if (!keysParam) {
      return NextResponse.json(
        { error: 'keys is required (comma-separated)' },
        { status: 400 }
      );
    }

    const keys = keysParam.split(',').map(k => k.trim());

    // 최신값 배치 조회
    const values = await getLatestSensorValues(farmId, deviceId, keys);

    return NextResponse.json(values, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.error('Latest Sensor Values Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

