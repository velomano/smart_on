/**
 * MQTT Broker Management API Routes
 * 
 * MQTT 브로커 관리 및 모니터링 API
 */

import type { Request, Response } from 'express';
import { getMQTTBroker } from '../../mqtt/broker.js';
import { logger } from '../../../utils/logger';

/**
 * MQTT 브로커 상태 조회
 * 
 * GET /api/mqtt/status
 */
export async function getBrokerStatus(req: Request, res: Response): Promise<void> {
  try {
    const broker = getMQTTBroker();
    
    if (!broker) {
      res.status(503).json({ 
        error: 'MQTT broker not available' 
      });
      return;
    }

    const stats = broker.getStats();

    res.json({
      success: true,
      status: 'running',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to get broker status', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to get broker status' 
    });
  }
}

/**
 * 연결된 클라이언트 목록 조회
 * 
 * GET /api/mqtt/clients
 */
export async function getClients(req: Request, res: Response): Promise<void> {
  try {
    const broker = getMQTTBroker();
    
    if (!broker) {
      res.status(503).json({ 
        error: 'MQTT broker not available' 
      });
      return;
    }

    const stats = broker.getStats();
    const clients = stats.clients;

    res.json({
      success: true,
      clients,
      totalClients: clients.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to get clients', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to get clients' 
    });
  }
}

/**
 * 특정 클라이언트 연결 해제
 * 
 * DELETE /api/mqtt/clients/:clientId
 */
export async function disconnectClient(req: Request, res: Response): Promise<void> {
  try {
    const { clientId } = req.params;
    
    if (!clientId) {
      res.status(400).json({ 
        error: 'Client ID is required' 
      });
      return;
    }

    const broker = getMQTTBroker();
    
    if (!broker) {
      res.status(503).json({ 
        error: 'MQTT broker not available' 
      });
      return;
    }

    const disconnected = broker.disconnectClient(clientId);

    if (disconnected) {
      logger.info('Client disconnected via API', { clientId });
      res.json({
        success: true,
        message: `Client ${clientId} disconnected successfully`
      });
    } else {
      res.status(404).json({ 
        error: 'Client not found' 
      });
    }
  } catch (error: any) {
    logger.error('Failed to disconnect client', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to disconnect client' 
    });
  }
}

/**
 * 브로커 통계 리셋
 * 
 * POST /api/mqtt/stats/reset
 */
export async function resetStats(req: Request, res: Response): Promise<void> {
  try {
    // TODO: 통계 리셋 기능 구현
    logger.info('Broker stats reset requested');
    
    res.json({
      success: true,
      message: 'Statistics reset (feature not implemented yet)'
    });
  } catch (error: any) {
    logger.error('Failed to reset stats', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to reset stats' 
    });
  }
}

/**
 * 브로커 재시작 (시뮬레이션)
 * 
 * POST /api/mqtt/restart
 */
export async function restartBroker(req: Request, res: Response): Promise<void> {
  try {
    // TODO: 브로커 재시작 기능 구현
    logger.info('Broker restart requested');
    
    res.json({
      success: true,
      message: 'Broker restart requested (feature not implemented yet)'
    });
  } catch (error: any) {
    logger.error('Failed to restart broker', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to restart broker' 
    });
  }
}

/**
 * 브로커 설정 조회
 * 
 * GET /api/mqtt/config
 */
export async function getBrokerConfig(req: Request, res: Response): Promise<void> {
  try {
    const config = {
      port: process.env.BRIDGE_MQTT_PORT || '1883',
      tlsPort: process.env.BRIDGE_MQTT_TLS_PORT,
      tlsEnabled: !!process.env.BRIDGE_MQTT_TLS_CERT,
      maxConnections: process.env.BRIDGE_MQTT_MAX_CONNECTIONS || '1000',
      connectionTimeout: process.env.BRIDGE_MQTT_CONNECTION_TIMEOUT || '30000',
      keepAlive: process.env.BRIDGE_MQTT_KEEP_ALIVE || '60',
    };

    res.json({
      success: true,
      config,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to get broker config', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to get broker config' 
    });
  }
}
