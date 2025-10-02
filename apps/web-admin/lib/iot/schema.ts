import { z } from "zod";

export const DeviceModelSchema = z.object({
  id: z.string().min(1),
  protocol: z.enum(["mqtt","modbus-tcp","opcua","http"]).default("mqtt"),
  topics: z.object({
    telemetry: z.string(),
    commands: z.string(),
    status: z.string()
  }),
  properties: z.array(z.object({
    key: z.string(),
    unit: z.string().optional(),
    type: z.enum(["number","string","boolean"]).default("number"),
    min: z.number().optional(),
    max: z.number().optional(),
    pollMs: z.number().optional()
  })).default([]),
  rules: z.array(z.object({
    expr: z.string(),
    action: z.enum(["warn","shutdown","notify"]).default("warn"),
    message: z.string().optional()
  })).default([])
});

export type DeviceModel = z.infer<typeof DeviceModelSchema>;

export const ProvisionSchema = z.object({
  deviceId: z.string().min(1),
  tenantId: z.string().min(1),
  mqttUrl: z.string().url().or(z.string().startsWith("mqtt://")),
  intervalMs: z.number().int().positive().default(5000),
});

export type ProvisionInput = z.infer<typeof ProvisionSchema>;
