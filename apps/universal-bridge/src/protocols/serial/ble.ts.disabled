/**
 * BLE (Bluetooth Low Energy)
 * 
 * BLE 통신 구현
 */

import { BluetoothSerialPort } from 'bluetooth-serial-port';

interface BLEConnection {
  port: BluetoothSerialPort;
  deviceId: string;
  address: string;
  lastActivity: Date;
}

/**
 * BLE 핸들러
 */
export class BLEHandler {
  private connections = new Map<string, BLEConnection>();
  private messageBus: any;

  constructor(messageBus?: any) {
    this.messageBus = messageBus;
  }

  /**
   * BLE 디바이스 스캔
   */
  async scan(): Promise<Array<{ address: string; name: string }>> {
    return new Promise((resolve, reject) => {
      const btSerial = new BluetoothSerialPort();
      
      btSerial.on('found', (address: string, name: string) => {
        console.log('[BLE] Found device:', address, name);
      });

      btSerial.on('finished', () => {
        console.log('[BLE] Scan finished');
        resolve([]); // 실제로는 발견된 디바이스 목록 반환
      });

      btSerial.on('error', (error: Error) => {
        console.error('[BLE] Scan error:', error);
        reject(error);
      });

      // 스캔 시작
      btSerial.inquire();
    });
  }

  /**
   * BLE 디바이스 연결
   */
  async connect(address: string, deviceId: string): Promise<boolean> {
    try {
      if (this.connections.has(address)) {
        console.log('[BLE] Already connected to:', address);
        return true;
      }

      const btSerial = new BluetoothSerialPort();
      
      return new Promise((resolve, reject) => {
        btSerial.connect(address, 1, (error) => {
          if (error) {
            console.error('[BLE] Connection error:', error);
            reject(error);
            return;
          }

          console.log('[BLE] Connected to:', address, 'Device:', deviceId);

          // 연결 정보 저장
          const connection: BLEConnection = {
            port: btSerial,
            deviceId,
            address,
            lastActivity: new Date(),
          };

          this.connections.set(address, connection);

          // 데이터 수신 처리
          btSerial.on('data', (buffer: Buffer) => {
            this.handleData(address, buffer.toString());
            connection.lastActivity = new Date();
          });

          // 연결 종료 처리
          btSerial.on('close', () => {
            console.log('[BLE] Connection closed:', address);
            this.connections.delete(address);
          });

          resolve(true);
        });
      });

    } catch (error) {
      console.error('[BLE] Connect error:', error);
      return false;
    }
  }

  /**
   * BLE 디바이스에 데이터 전송
   */
  async sendData(address: string, data: any): Promise<boolean> {
    try {
      const connection = this.connections.get(address);
      if (!connection) {
        console.warn('[BLE] Not connected to:', address);
        return false;
      }

      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      return new Promise((resolve, reject) => {
        connection.port.write(Buffer.from(dataString), (error) => {
          if (error) {
            console.error('[BLE] Write error:', error);
            reject(error);
            return;
          }

          connection.lastActivity = new Date();
          console.log('[BLE] Data sent to', address, ':', dataString);
          resolve(true);
        });
      });

    } catch (error) {
      console.error('[BLE] Send data error:', error);
      return false;
    }
  }

  /**
   * BLE 연결 해제
   */
  async disconnect(address: string): Promise<void> {
    try {
      const connection = this.connections.get(address);
      if (!connection) {
        return;
      }

      connection.port.close();
      this.connections.delete(address);
      console.log('[BLE] Disconnected from:', address);

    } catch (error) {
      console.error('[BLE] Disconnect error:', error);
    }
  }

  /**
   * 수신된 데이터 처리
   */
  private handleData(address: string, data: string): void {
    try {
      const connection = this.connections.get(address);
      if (!connection) {
        return;
      }

      console.log('[BLE] Data received from', address, ':', data);

      // JSON 파싱 시도
      let message;
      try {
        message = JSON.parse(data);
      } catch {
        // JSON이 아닌 경우 텍스트로 처리
        message = { type: 'text', data: data.trim() };
      }

      // Message Bus로 전달
      if (this.messageBus) {
        this.messageBus.process({
          messageType: message.type || 'data',
          protocol: 'ble',
          deviceId: connection.deviceId,
          tenantId: 'default',
          farmId: 'default',
          payload: message,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error) {
      console.error('[BLE] Error handling data:', error);
    }
  }

  /**
   * 연결 상태 조회
   */
  getConnections(): Array<{ address: string; deviceId: string; lastActivity: Date }> {
    return Array.from(this.connections.values()).map(conn => ({
      address: conn.address,
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

    for (const connection of this.connections.values()) {
      const inactiveTime = now.getTime() - connection.lastActivity.getTime();
      
      if (inactiveTime > inactiveThreshold) {
        console.log('[BLE] Cleaning up inactive connection:', connection.address);
        this.disconnect(connection.address);
      }
    }
  }
}

