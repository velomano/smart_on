import { createClient } from '@/lib/supabase/server';
import { getLatestSensorValues } from '@/lib/data/unified-iot-data';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const farmId = params.id;
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  const keysParam = searchParams.get('keys');
  const keys = keysParam ? keysParam.split(',') : [];

  if (!farmId || !deviceId || keys.length === 0) {
    return NextResponse.json(
      { error: 'farmId, deviceId, and keys are required' },
      { status: 400 }
    );
  }

  try {
    const latestValues = await getLatestSensorValues(farmId, deviceId, keys);
    return NextResponse.json(latestValues, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching latest sensor values:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest sensor values' },
      { status: 500 }
    );
  }
}