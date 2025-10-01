/**
 * Schema Registry
 * 
 * 버전별 스키마 관리
 * TODO: 모든 메시지 타입의 스키마 정의
 */

import { z } from 'zod';

// ==================== Telemetry Schemas ====================

export const TelemetryV1 = z.object({
  deviceId: z.string(),
  readings: z.array(z.object({
    key: z.string(),
    value: z.number(),
    unit: z.enum(['celsius', 'fahrenheit', 'percent', 'ms_cm', 'ph', 'lux']),
    ts: z.string().datetime(),
    tier: z.number().int().min(1).max(3).optional(),
  })),
  schemaVersion: z.literal('telemetry.v1'),
  timestamp: z.string().datetime(),
});

export type TelemetryV1Type = z.infer<typeof TelemetryV1>;

// ==================== Command Schemas ====================

export const CommandV1 = z.object({
  msgId: z.string().uuid(),
  deviceId: z.string(),
  command: z.enum(['on', 'off', 'set_value']),
  payload: z.record(z.unknown()).optional(),
  schemaVersion: z.literal('command.v1'),
  timestamp: z.string().datetime(),
});

export type CommandV1Type = z.infer<typeof CommandV1>;

// ==================== Registry Schemas ====================

export const RegistryV1 = z.object({
  deviceId: z.string(),
  deviceType: z.string(),
  capabilities: z.array(z.string()),
  fwVersion: z.string().optional(),
  schemaVersion: z.literal('registry.v1'),
  timestamp: z.string().datetime(),
});

export type RegistryV1Type = z.infer<typeof RegistryV1>;

// ==================== Schema Registry ====================

/**
 * 스키마 레지스트리
 * 
 * TODO:
 * - [ ] 동적 스키마 로딩
 * - [ ] 스키마 버전 마이그레이션
 * - [ ] 스키마 캐싱
 */
export class SchemaRegistry {
  private schemas = new Map<string, z.ZodType<any>>();

  constructor() {
    // 기본 스키마 등록
    this.schemas.set('telemetry.v1', TelemetryV1);
    this.schemas.set('command.v1', CommandV1);
    this.schemas.set('registry.v1', RegistryV1);
    
    // TODO: 추가 스키마 등록
  }

  /**
   * 스키마 조회
   */
  getSchema(version: string): z.ZodType<any> | undefined {
    return this.schemas.get(version);
  }

  /**
   * 스키마 등록
   */
  registerSchema(version: string, schema: z.ZodType<any>): void {
    this.schemas.set(version, schema);
  }

  /**
   * 스키마 버전 감지
   */
  detectVersion(data: any): string {
    return data.schemaVersion || 'legacy';
  }
}

