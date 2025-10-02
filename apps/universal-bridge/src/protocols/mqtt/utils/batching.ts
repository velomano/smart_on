// Telemetry batching utilities
export interface TelemetryBatch {
  farmId: string;
  deviceId: string;
  readings: any[];
  batchSeq: number;
  windowMs: number;
  timestamp: Date;
}

export function createTelemetryBatch(
  farmId: string,
  deviceId: string,
  readings: any[],
  batchSeq?: number,
  windowMs?: number
): TelemetryBatch {
  return {
    farmId,
    deviceId,
    readings,
    batchSeq: batchSeq || 0,
    windowMs: windowMs || 5000,
    timestamp: new Date()
  };
}

export function batchTelemetryReadings(readings: any[], batchSize: number = 100): any[][] {
  const batches: any[][] = [];
  
  for (let i = 0; i < readings.length; i += batchSize) {
    batches.push(readings.slice(i, i + batchSize));
  }
  
  return batches;
}

export function validateTelemetryReading(reading: any): boolean {
  return (
    reading &&
    typeof reading.key === 'string' &&
    typeof reading.value !== 'undefined' &&
    typeof reading.unit === 'string' &&
    reading.ts
  );
}
