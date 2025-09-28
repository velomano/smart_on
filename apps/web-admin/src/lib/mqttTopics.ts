export const topic = {
  registry: (farmId: string, deviceId: string) => `farms/${farmId}/devices/${deviceId}/registry`,
  state:    (farmId: string, deviceId: string) => `farms/${farmId}/devices/${deviceId}/state`,
  telemetry:(farmId: string, deviceId: string) => `farms/${farmId}/devices/${deviceId}/telemetry`,
  command:  (farmId: string, deviceId: string) => `farms/${farmId}/devices/${deviceId}/command`,
  ack:      (farmId: string, deviceId: string) => `farms/${farmId}/devices/${deviceId}/command/ack`,
};
