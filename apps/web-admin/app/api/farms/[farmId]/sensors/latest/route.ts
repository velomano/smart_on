import { NextRequest, NextResponse } from 'next/server';
import { getLatestSensorValue } from '@/lib/data/unified-iot-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params;
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const keys = searchParams.get('keys');

    if (!deviceId || !keys) {
      return NextResponse.json(
        { error: 'deviceId and keys parameters are required' },
        { status: 400 }
      );
    }

    const keyArray = keys.split(',');
    const results: Record<string, any> = {};

    // 각 센서 키에 대해 최신 값 조회
    for (const key of keyArray) {
      try {
        const sensorValue = await getLatestSensorValue(farmId, deviceId, key);
        results[key] = sensorValue;
      } catch (error) {
        console.error(`Error fetching sensor value for ${key}:`, error);
        results[key] = null;
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Latest sensors API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest sensor values' },
      { status: 500 }
    );
  }
}
