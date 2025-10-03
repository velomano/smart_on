/**
 * MQTT Broker Server
 * 
 * 내장 MQTT 브로커 서버 구현
 * JWT 토큰 기반 인증 및 ACL 지원
 */

import aedes from 'aedes';
import { createServer } from 'net';
import { createServer as createTlsServer } from 'tls';
import { tokenServer } from '../../security/jwt.js';
import { logger } from '../../utils/logger.js';
import type { DeviceTokenPayload } from '../../security/jwt.js';

// Aedes 타입 정의 (임시)
interface AedesClient {
  id: string;
  conn?: { remoteAddress?: string };
  disconnected?: boolean;
  close(): void;
  on(event: string, callback: (...args: any[]) => void): void;
  publish(topic: string, message: string | Buffer, options?: any, callback?: () => void): void;
}

interface AedesSubscription {
  topic: string;
  qos: number;
}

interface AedesPublishPacket {
  topic: string;
  qos: number;
  retain: boolean;
  payload?: Buffer;
}

interface Aedes {
  id: string;
  clients: Map<string, AedesClient>;
  handle: (socket: any) => void;
  close(): void;
  on(event: string, callback: (...args: any[]) => void): void;
  authenticate: (client: AedesClient, username: string | undefined, password: Buffer | undefined, callback: (error: Error | null, success: boolean) => void) => void;
  authorizePublish: (client: AedesClient, packet: AedesPublishPacket, callback: (error: Error | null, success: boolean) => void) => void;
  authorizeSubscribe: (client: AedesClient, subscription: AedesSubscription, callback: (error: Error | null, success: boolean) => void) => void;
}

export interface MQTTBrokerConfig {
  port: number;
  tlsPort?: number;
  tlsCert?: string;
  tlsKey?: string;
  maxConnections?: number;
  connectionTimeout?: number;
  keepAlive?: number;
}

export interface MQTTClient {
  id: string;
  deviceInfo?: DeviceTokenPayload;
  tenantId?: string;
  farmId?: string;
  connectedAt: Date;
  lastSeen: Date;
  subscriptions: Set<string>;
}

export class MQTTBrokerServer {
  private broker: aedes.Aedes;
  private server: any;
  private tlsServer?: any;
  private config: MQTTBrokerConfig;
  private clients: Map<string, MQTTClient> = new Map();
  private stats = {
    totalConnections: 0,
    activeConnections: 0,
    totalMessages: 0,
    totalSubscriptions: 0,
  };

  constructor(config: MQTTBrokerConfig) {
    this.config = {
      maxConnections: 1000,
      connectionTimeout: 30000,
      keepAlive: 60,
      ...config,
    };

    // Aedes 브로커 생성
    this.broker = new (aedes as any)({
      id: 'universal-bridge-mqtt-broker',
      concurrency: 100,
      heartbeatInterval: 60000,
      connectTimeout: this.config.connectionTimeout,
      queueLimit: 42,
      maxClientsIdLength: 23,
      persistence: {
        // 메모리 기반 persistence (나중에 Redis로 변경 가능)
        createRetainedStream: () => new Map(),
        createWillStream: () => new Map(),
        createSubscriptionStream: () => new Map(),
        createOutgoingStream: () => new Map(),
      },
    });

    this.setupEventHandlers();
  }

  /**
   * 브로커 이벤트 핸들러 설정
   */
  private setupEventHandlers(): void {
    // 클라이언트 연결
    this.broker.on('client', (client: AedesClient) => {
      logger.info('MQTT client connecting', { 
        clientId: client.id,
        ip: client.conn?.remoteAddress 
      });

      this.stats.totalConnections++;
      this.stats.activeConnections++;
    });

    // 클라이언트 연결 완료
    this.broker.on('clientReady', (client: AedesClient) => {
      logger.info('MQTT client connected', { 
        clientId: client.id,
        ip: client.conn?.remoteAddress 
      });

      // 클라이언트 정보 저장
      const mqttClient: MQTTClient = {
        id: client.id,
        connectedAt: new Date(),
        lastSeen: new Date(),
        subscriptions: new Set(),
      };

      this.clients.set(client.id, mqttClient);

      // 클라이언트 연결 상태 업데이트
      client.on('pingreq', () => {
        const mqttClient = this.clients.get(client.id);
        if (mqttClient) {
          mqttClient.lastSeen = new Date();
        }
      });
    });

    // 클라이언트 연결 해제
    this.broker.on('clientDisconnect', (client: AedesClient) => {
      logger.info('MQTT client disconnected', { 
        clientId: client.id,
        reason: client.disconnected 
      });

      this.stats.activeConnections--;
      this.clients.delete(client.id);
    });

    // 클라이언트 연결 에러
    this.broker.on('clientError', (client: AedesClient, error: Error) => {
      logger.error('MQTT client error', { 
        clientId: client.id,
        error: error.message 
      });

      this.stats.activeConnections--;
      this.clients.delete(client.id);
    });

    // 구독 요청
    this.broker.on('subscribe', (subscriptions: AedesSubscription[], client: AedesClient) => {
      logger.info('MQTT subscription request', { 
        clientId: client.id,
        subscriptions: subscriptions.map(s => s.topic) 
      });

      const mqttClient = this.clients.get(client.id);
      if (mqttClient) {
        subscriptions.forEach(sub => {
          mqttClient.subscriptions.add(sub.topic);
          this.stats.totalSubscriptions++;
        });
      }
    });

    // 구독 해제
    this.broker.on('unsubscribe', (unsubscriptions: string[], client: AedesClient) => {
      logger.info('MQTT unsubscription request', { 
        clientId: client.id,
        topics: unsubscriptions 
      });

      const mqttClient = this.clients.get(client.id);
      if (mqttClient) {
        unsubscriptions.forEach(topic => {
          mqttClient.subscriptions.delete(topic);
        });
      }
    });

    // 메시지 발행
    this.broker.on('publish', (packet: AedesPublishPacket, client: AedesClient | null) => {
      const clientId = client?.id || 'system';
      
      logger.debug('MQTT message published', { 
        clientId,
        topic: packet.topic,
        qos: packet.qos,
        retain: packet.retain,
        payloadLength: packet.payload?.length || 0
      });

      this.stats.totalMessages++;
    });

    // 에러 처리
    this.broker.on('error', (error: Error) => {
      logger.error('MQTT broker error', { error: error.message });
    });

    // 경고 처리
    this.broker.on('warning', (warning: any) => {
      logger.warn('MQTT broker warning', { warning });
    });
  }

  /**
   * 인증 미들웨어 설정
   */
  private setupAuthentication(): void {
    // 클라이언트 인증
    this.broker.authenticate = async (client: AedesClient, username: string | undefined, password: Buffer | undefined, callback: (error: Error | null, success: boolean) => void) => {
      try {
        if (!username || !password) {
          logger.warn('MQTT authentication failed: missing credentials', { 
            clientId: client.id,
            ip: client.conn?.remoteAddress 
          });
          return callback(null, false);
        }

        // JWT 토큰을 비밀번호로 사용
        const token = password.toString();
        const deviceInfo = tokenServer.verifyDeviceToken(token);

        // 클라이언트 정보 업데이트
        const mqttClient = this.clients.get(client.id);
        if (mqttClient) {
          mqttClient.deviceInfo = deviceInfo;
          mqttClient.tenantId = deviceInfo.tenantId;
          mqttClient.farmId = deviceInfo.farmId;
        }

        logger.info('MQTT client authenticated', { 
          clientId: client.id,
          deviceId: deviceInfo.deviceId,
          tenantId: deviceInfo.tenantId,
          farmId: deviceInfo.farmId 
        });

        callback(null, true);
      } catch (error: any) {
        logger.warn('MQTT authentication failed', { 
          clientId: client.id,
          error: error.message,
          ip: client.conn?.remoteAddress 
        });
        callback(error, false);
      }
    };

    // 권한 확인 (ACL)
    this.broker.authorizePublish = (client: AedesClient, packet: AedesPublishPacket, callback: (error: Error | null, success: boolean) => void) => {
      try {
        const mqttClient = this.clients.get(client.id);
        if (!mqttClient || !mqttClient.deviceInfo) {
          logger.warn('MQTT publish unauthorized: client not authenticated', { 
            clientId: client.id,
            topic: packet.topic 
          });
          return callback(null, false);
        }

        // ACL 검사
        const allowed = this.checkPublishPermission(mqttClient.deviceInfo, packet.topic);
        
        if (!allowed) {
          logger.warn('MQTT publish unauthorized: ACL denied', { 
            clientId: client.id,
            deviceId: mqttClient.deviceInfo.deviceId,
            topic: packet.topic 
          });
        }

        callback(null, allowed);
      } catch (error: any) {
        logger.error('MQTT authorization error', { 
          clientId: client.id,
          error: error.message 
        });
        callback(error, false);
      }
    };

    this.broker.authorizeSubscribe = (client: AedesClient, sub: AedesSubscription, callback: (error: Error | null, success: boolean) => void) => {
      try {
        const mqttClient = this.clients.get(client.id);
        if (!mqttClient || !mqttClient.deviceInfo) {
          logger.warn('MQTT subscribe unauthorized: client not authenticated', { 
            clientId: client.id,
            topic: sub.topic 
          });
          return callback(null, false);
        }

        // ACL 검사
        const allowed = this.checkSubscribePermission(mqttClient.deviceInfo, sub.topic);
        
        if (!allowed) {
          logger.warn('MQTT subscribe unauthorized: ACL denied', { 
            clientId: client.id,
            deviceId: mqttClient.deviceInfo.deviceId,
            topic: sub.topic 
          });
        }

        callback(null, allowed);
      } catch (error: any) {
        logger.error('MQTT authorization error', { 
          clientId: client.id,
          error: error.message 
        });
        callback(error, false);
      }
    };
  }

  /**
   * 발행 권한 확인
   */
  private checkPublishPermission(deviceInfo: DeviceTokenPayload, topic: string): boolean {
    // 테넌트별 토픽 제한
    const tenantPrefix = `tenants/${deviceInfo.tenantId}`;
    if (!topic.startsWith(tenantPrefix)) {
      return false;
    }

    // 디바이스별 토픽 제한
    const devicePrefix = `${tenantPrefix}/devices/${deviceInfo.deviceId}`;
    
    // 디바이스 자신의 토픽만 발행 가능
    if (topic.startsWith(`${devicePrefix}/telemetry`) ||
        topic.startsWith(`${devicePrefix}/status`) ||
        topic.startsWith(`${devicePrefix}/response`)) {
      return true;
    }

    // 농장 내 다른 디바이스 토픽은 제한
    return false;
  }

  /**
   * 구독 권한 확인
   */
  private checkSubscribePermission(deviceInfo: DeviceTokenPayload, topic: string): boolean {
    // 테넌트별 토픽 제한
    const tenantPrefix = `tenants/${deviceInfo.tenantId}`;
    if (!topic.startsWith(tenantPrefix)) {
      return false;
    }

    // 디바이스별 토픽 제한
    const devicePrefix = `${tenantPrefix}/devices/${deviceInfo.deviceId}`;
    
    // 디바이스 자신의 명령 토픽 구독 가능
    if (topic.startsWith(`${devicePrefix}/commands`)) {
      return true;
    }

    // 농장 내 다른 디바이스 상태 토픽 구독 가능
    if (topic.startsWith(`${tenantPrefix}/farms/${deviceInfo.farmId}/devices/+/status`)) {
      return true;
    }

    // 농장 전체 알림 토픽 구독 가능
    if (topic.startsWith(`${tenantPrefix}/farms/${deviceInfo.farmId}/notifications`)) {
      return true;
    }

    return false;
  }

  /**
   * MQTT 브로커 서버 시작
   */
  async start(): Promise<void> {
    try {
      // 인증 설정
      this.setupAuthentication();

      // TCP 서버 생성
      this.server = createServer(this.broker.handle);
      
      this.server.listen(this.config.port, () => {
        logger.info('MQTT broker server started', { 
          port: this.config.port,
          maxConnections: this.config.maxConnections 
        });
      });

      // TLS 서버 (선택사항)
      if (this.config.tlsPort && this.config.tlsCert && this.config.tlsKey) {
        this.tlsServer = createTlsServer({
          cert: this.config.tlsCert,
          key: this.config.tlsKey,
        }, this.broker.handle);

        this.tlsServer.listen(this.config.tlsPort, () => {
          logger.info('MQTT broker TLS server started', { 
            tlsPort: this.config.tlsPort 
          });
        });
      }

      // 에러 처리
      this.server.on('error', (error: Error) => {
        logger.error('MQTT broker server error', { error: error.message });
      });

      // 통계 로깅 (주기적)
      setInterval(() => {
        this.logStats();
      }, 60000); // 1분마다

    } catch (error: any) {
      logger.error('Failed to start MQTT broker server', { error: error.message });
      throw error;
    }
  }

  /**
   * MQTT 브로커 서버 중지
   */
  async stop(): Promise<void> {
    try {
      logger.info('Stopping MQTT broker server...');

      // 모든 클라이언트 연결 해제
      for (const client of this.clients.values()) {
        const aedesClient = this.broker.clients.get(client.id);
        if (aedesClient) {
          aedesClient.close();
        }
      }

      // 서버 종료
      if (this.server) {
        this.server.close();
      }

      if (this.tlsServer) {
        this.tlsServer.close();
      }

      // 브로커 종료
      this.broker.close();

      logger.info('MQTT broker server stopped');
    } catch (error: any) {
      logger.error('Error stopping MQTT broker server', { error: error.message });
      throw error;
    }
  }

  /**
   * 통계 로깅
   */
  private logStats(): void {
    logger.info('MQTT broker statistics', {
      ...this.stats,
      activeClients: this.clients.size,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 브로커 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      activeClients: this.clients.size,
      clients: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        deviceId: client.deviceInfo?.deviceId,
        tenantId: client.tenantId,
        farmId: client.farmId,
        connectedAt: client.connectedAt,
        lastSeen: client.lastSeen,
        subscriptionCount: client.subscriptions.size,
      }))
    };
  }

  /**
   * 특정 클라이언트 연결 해제
   */
  disconnectClient(clientId: string): boolean {
    const client = this.broker.clients.get(clientId);
    if (client) {
      client.close();
      this.clients.delete(clientId);
      logger.info('Client disconnected by admin', { clientId });
      return true;
    }
    return false;
  }

  /**
   * 브로커 인스턴스 반환
   */
  getBroker(): Aedes {
    return this.broker;
  }
}

// 싱글톤 인스턴스
let brokerInstance: MQTTBrokerServer | null = null;

export function createMQTTBroker(config: MQTTBrokerConfig): MQTTBrokerServer {
  if (!brokerInstance) {
    brokerInstance = new MQTTBrokerServer(config);
  }
  return brokerInstance;
}

export function getMQTTBroker(): MQTTBrokerServer | null {
  return brokerInstance;
}
