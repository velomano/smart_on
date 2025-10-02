/**
 * USB Serial
 * 
 * USB Serial 통신 구현
 */

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

interface SerialConnection {
  port: SerialPort;
  parser: ReadlineParser;
  deviceId?: string;
  lastActivity: Date;
}

/**
 * USB Serial 핸들러
 */
export class USBSerialHandler {
  private connections = new Map<string, SerialConnection>();
  private messageBus: any;

  constructor(messageBus?: any) {
    this.messageBus = messageBus;
  }

  /**
   * 사용 가능한 시리얼 포트 목록 조회
   */
  async list(): Promise<string[]> {
    try {
      const ports = await SerialPort.list();
      return ports.map(port => port.path);
    } catch (error) {
      console.error('[USB Serial] Error listing ports:', error);
      return [];
    }
  }

  /**
   * 시리얼 포트 열기
   */
  async open(portPath: string, deviceId?: string): Promise<boolean> {
    try {
      if (this.connections.has(portPath)) {
        console.log('[USB Serial] Port already open:', portPath);
        return true;
      }

      const port = new SerialPort({
        path: portPath,
        baudRate: 9600,
        autoOpen: false,
      });

      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

      // 연결 설정
      const connection: SerialConnection = {
        port,
        parser,
        deviceId,
        lastActivity: new Date(),
      };

      // 포트 열기
      await new Promise<void>((resolve, reject) => {
        port.open((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      // 데이터 수신 처리
      parser.on('data', (data: string) => {
        this.handleData(portPath, data);
        connection.lastActivity = new Date();
      });

      // 에러 처리
      port.on('error', (error) => {
        console.error('[USB Serial] Port error:', portPath, error);
        this.close(portPath);
      });

      // 연결 종료 처리
      port.on('close', () => {
        console.log('[USB Serial] Port closed:', portPath);
        this.connections.delete(portPath);
      });

      this.connections.set(portPath, connection);
      console.log('[USB Serial] Port opened:', portPath, 'Device:', deviceId);
      return true;

    } catch (error) {
      console.error('[USB Serial] Error opening port:', portPath, error);
      return false;
    }
  }

  /**
   * 시리얼 포트에 데이터 쓰기
   */
  async write(portPath: string, data: string): Promise<boolean> {
    try {
      const connection = this.connections.get(portPath);
      if (!connection) {
        console.warn('[USB Serial] Port not open:', portPath);
        return false;
      }

      await new Promise<void>((resolve, reject) => {
        connection.port.write(data + '\n', (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      connection.lastActivity = new Date();
      console.log('[USB Serial] Data sent to', portPath, ':', data);
      return true;

    } catch (error) {
      console.error('[USB Serial] Error writing to port:', portPath, error);
      return false;
    }
  }

  /**
   * 시리얼 포트 닫기
   */
  async close(portPath: string): Promise<void> {
    try {
      const connection = this.connections.get(portPath);
      if (!connection) {
        return;
      }

      await new Promise<void>((resolve) => {
        connection.port.close(() => {
          resolve();
        });
      });

      this.connections.delete(portPath);
      console.log('[USB Serial] Port closed:', portPath);

    } catch (error) {
      console.error('[USB Serial] Error closing port:', portPath, error);
    }
  }

  /**
   * 수신된 데이터 처리
   */
  private handleData(portPath: string, data: string): void {
    try {
      const connection = this.connections.get(portPath);
      if (!connection) {
        return;
      }

      console.log('[USB Serial] Data received from', portPath, ':', data);

      // JSON 파싱 시도
      let message;
      try {
        message = JSON.parse(data);
      } catch {
        // JSON이 아닌 경우 텍스트로 처리
        message = { type: 'text', data: data.trim() };
      }

      // Message Bus로 전달
      if (this.messageBus && connection.deviceId) {
        this.messageBus.process({
          messageType: message.type || 'data',
          protocol: 'serial',
          deviceId: connection.deviceId,
          tenantId: 'default',
          farmId: 'default',
          payload: message,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error) {
      console.error('[USB Serial] Error handling data:', error);
    }
  }

  /**
   * 연결 상태 조회
   */
  getConnections(): Array<{ port: string; deviceId?: string; lastActivity: Date }> {
    return Array.from(this.connections.entries()).map(([port, conn]) => ({
      port,
      deviceId: conn.deviceId,
      lastActivity: conn.lastActivity,
    }));
  }

  /**
   * 비활성 연결 정리
   */
  cleanupInactiveConnections(maxInactiveMinutes: number = 30): void {
    const now = new Date();
    const inactiveThreshold = maxInactiveMinutes * 60 * 1000;

    for (const [portPath, connection] of this.connections.entries()) {
      const inactiveTime = now.getTime() - connection.lastActivity.getTime();
      
      if (inactiveTime > inactiveThreshold) {
        console.log('[USB Serial] Cleaning up inactive connection:', portPath);
        this.close(portPath);
      }
    }
  }
}

