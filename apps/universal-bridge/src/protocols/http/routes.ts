/**
 * HTTP Routes
 * 
 * REST API 라우트 핸들러
 * TODO: 모든 라우트 구현
 */

import type { Request, Response } from 'express';

/**
 * Provisioning - Claim
 * 
 * POST /api/provisioning/claim
 * 
 * TODO: 구현
 */
export async function handleClaim(req: Request, res: Response) {
  // TODO: Setup Token 발급
  console.log('[HTTP] TODO: handleClaim');
  res.json({ status: 'TODO' });
}

/**
 * Provisioning - Bind
 * 
 * POST /api/provisioning/bind
 * 
 * TODO: 구현
 */
export async function handleBind(req: Request, res: Response) {
  // TODO: 디바이스 바인딩
  console.log('[HTTP] TODO: handleBind');
  res.json({ status: 'TODO' });
}

/**
 * Provisioning - Rotate
 * 
 * POST /api/provisioning/rotate
 * 
 * TODO: 구현
 */
export async function handleRotate(req: Request, res: Response) {
  // TODO: 키 회전
  console.log('[HTTP] TODO: handleRotate');
  res.json({ status: 'TODO' });
}

/**
 * Telemetry
 * 
 * POST /api/bridge/telemetry
 * 
 * TODO: 구현
 */
export async function handleTelemetry(req: Request, res: Response) {
  // TODO: 텔레메트리 처리
  console.log('[HTTP] TODO: handleTelemetry');
  res.json({ status: 'TODO' });
}

/**
 * Commands - Poll
 * 
 * GET /api/bridge/commands/:deviceId
 * 
 * TODO: 구현
 */
export async function handleCommandPoll(req: Request, res: Response) {
  // TODO: 대기 중인 명령 조회
  console.log('[HTTP] TODO: handleCommandPoll');
  res.json({ commands: [] });
}

/**
 * Commands - ACK
 * 
 * POST /api/bridge/commands/:commandId/ack
 * 
 * TODO: 구현
 */
export async function handleCommandAck(req: Request, res: Response) {
  // TODO: 명령 ACK 처리
  console.log('[HTTP] TODO: handleCommandAck');
  res.json({ status: 'TODO' });
}

