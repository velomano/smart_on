// Modbus TCP 어댑터 - PLC 데이터 수집 및 제어
import { EventEmitter } from 'events';
import { createSocket } from 'net';
import { Logger } from '../core/logger';

export interface ModbusTcpConfig {
  transport: 'modbus-tcp';
  host: string;
  port: number;
  unitId: number;
  pollMs: number;
  timeout?: number;
  retries?: number;
  reads: ModbusReadConfig[];
  writes: ModbusWriteConfig[];
}

export interface ModbusReadConfig {
  name: string;
  fc: number; // Function Code (3=Holding, 4=Input)
  addr: number;
  len: number;
  scale?: number;
  type: 'U16' | 'S16' | 'U32' | 'S32' | 'FLOAT_ABCD' | 'FLOAT_BADC';
}

export interface ModbusWriteConfig {
  type: string;
  fc: number; // Function Code (6=Single Write, 16=Multiple Write)
  addr: number;
  len?: number;
  type_mapping?: Record<string, any>;
}

export interface ModbusTelemetry {
  device_id: string;
  ts: string;
  metrics: Record<string, number | string | boolean>;
  status: 'ok' | 'warn' | 'err';
}

export interface ModbusCommand {
  device_id: string;
  type: string;
  params: Record<string, any>;
  idempotency_key?: string;
  timeout_ms?: number;
}

export class ModbusTcpAdapter extends EventEmitter {
  private config: ModbusTcpConfig;
  private socket: any = null;
  private isConnected = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private logger: Logger;
  private transactionId = 0;
  private pendingCommands = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();

  constructor(config: ModbusTcpConfig, logger: Logger) {
    super();
    this.config = {
      timeout: 5000,
      retries: 3,
      ...config
    };
    this.logger = logger;
  }

  async start(): Promise<void> {
    try {
      await this.connect();
      this.startPolling();
      this.logger.info(`Modbus TCP 어댑터 시작됨: ${this.config.host}:${this.config.port}`);
    } catch (error) {
      this.logger.error(`Modbus TCP 연결 실패: ${error}`);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.stopPolling();
    await this.disconnect();
    this.logger.info('Modbus TCP 어댑터 중지됨');
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = createSocket();
      
      this.socket.setTimeout(this.config.timeout || 5000);
      
      this.socket.on('connect', () => {
        this.isConnected = true;
        this.logger.info(`Modbus TCP 연결됨: ${this.config.host}:${this.config.port}`);
        resolve();
      });

      this.socket.on('error', (error: Error) => {
        this.isConnected = false;
        this.logger.error(`Modbus TCP 연결 오류: ${error.message}`);
        reject(error);
      });

      this.socket.on('timeout', () => {
        this.isConnected = false;
        this.logger.error('Modbus TCP 연결 타임아웃');
        this.socket.destroy();
      });

      this.socket.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Modbus TCP 연결 종료됨');
      });

      this.socket.on('data', (data: Buffer) => {
        this.handleResponse(data);
      });

      this.socket.connect(this.config.port, this.config.host);
    });
  }

  private async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.isConnected = false;
  }

  private startPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }

    this.pollTimer = setInterval(async () => {
      if (this.isConnected) {
        await this.pollData();
      } else {
        await this.reconnect();
      }
    }, this.config.pollMs);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async reconnect(): Promise<void> {
    try {
      this.logger.info('Modbus TCP 재연결 시도...');
      await this.disconnect();
      await this.connect();
    } catch (error) {
      this.logger.error(`Modbus TCP 재연결 실패: ${error}`);
    }
  }

  private async pollData(): Promise<void> {
    try {
      const telemetry: ModbusTelemetry = {
        device_id: `modbus_${this.config.host}_${this.config.unitId}`,
        ts: new Date().toISOString(),
        metrics: {},
        status: 'ok'
      };

      // 모든 읽기 작업 수행
      for (const readConfig of this.config.reads) {
        try {
          const value = await this.readRegister(readConfig);
          telemetry.metrics[readConfig.name] = value;
        } catch (error) {
          this.logger.error(`레지스터 읽기 실패 [${readConfig.name}]: ${error}`);
          telemetry.status = 'err';
        }
      }

      // 텔레메트리 전송
      if (Object.keys(telemetry.metrics).length > 0) {
        this.emit('telemetry', telemetry);
      }
    } catch (error) {
      this.logger.error(`데이터 폴링 오류: ${error}`);
    }
  }

  private async readRegister(config: ModbusReadConfig): Promise<number | string | boolean> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.socket) {
        reject(new Error('Modbus TCP 연결되지 않음'));
        return;
      }

      const transactionId = ++this.transactionId;
      const request = this.buildReadRequest(transactionId, config);
      
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(transactionId.toString());
        reject(new Error('읽기 타임아웃'));
      }, this.config.timeout || 5000);

      this.pendingCommands.set(transactionId.toString(), {
        resolve: (value: any) => {
          clearTimeout(timeout);
          resolve(this.parseValue(value, config));
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timeout
      });

      this.socket.write(request);
    });
  }

  private buildReadRequest(transactionId: number, config: ModbusReadConfig): Buffer {
    const buffer = Buffer.alloc(12);
    
    // Modbus TCP 헤더
    buffer.writeUInt16BE(transactionId, 0);  // Transaction ID
    buffer.writeUInt16BE(0, 2);              // Protocol ID (0 = Modbus)
    buffer.writeUInt16BE(6, 4);              // Length
    
    // Modbus PDU
    buffer.writeUInt8(this.config.unitId, 6); // Unit ID
    buffer.writeUInt8(config.fc, 7);           // Function Code
    buffer.writeUInt16BE(config.addr, 8);      // Starting Address
    buffer.writeUInt16BE(config.len, 10);      // Quantity
    
    return buffer;
  }

  private handleResponse(data: Buffer): void {
    if (data.length < 8) {
      this.logger.error('Modbus 응답 데이터 너무 짧음');
      return;
    }

    const transactionId = data.readUInt16BE(0);
    const unitId = data.readUInt8(6);
    const functionCode = data.readUInt8(7);
    const dataLength = data.readUInt8(8);

    // 트랜잭션 ID로 대기 중인 명령 찾기
    const pending = this.pendingCommands.get(transactionId.toString());
    if (!pending) {
      this.logger.warn(`알 수 없는 트랜잭션 ID: ${transactionId}`);
      return;
    }

    this.pendingCommands.delete(transactionId.toString());

    if (functionCode & 0x80) {
      // 에러 응답
      const errorCode = data.readUInt8(8);
      pending.reject(new Error(`Modbus 에러: ${this.getModbusError(errorCode)}`));
      return;
    }

    // 성공 응답 - 데이터 추출
    const values: number[] = [];
    for (let i = 0; i < dataLength; i += 2) {
      if (i + 1 < dataLength) {
        values.push(data.readUInt16BE(9 + i));
      }
    }

    pending.resolve(values);
  }

  private parseValue(values: number[], config: ModbusReadConfig): number | string | boolean {
    if (!values || values.length === 0) {
      return 0;
    }

    let value: number;

    switch (config.type) {
      case 'U16':
        value = values[0];
        break;
      case 'S16':
        value = values[0] > 32767 ? values[0] - 65536 : values[0];
        break;
      case 'U32':
        value = (values[0] << 16) | values[1];
        break;
      case 'S32':
        value = ((values[0] << 16) | values[1]);
        if (value > 2147483647) value -= 4294967296;
        break;
      case 'FLOAT_ABCD':
        // IEEE 754 Float (ABCD 순서)
        const buffer = Buffer.alloc(4);
        buffer.writeUInt16BE(values[0], 0);
        buffer.writeUInt16BE(values[1], 2);
        value = buffer.readFloatBE(0);
        break;
      case 'FLOAT_BADC':
        // IEEE 754 Float (BADC 순서)
        const buffer2 = Buffer.alloc(4);
        buffer2.writeUInt16BE(values[1], 0);
        buffer2.writeUInt16BE(values[0], 2);
        value = buffer2.readFloatBE(0);
        break;
      default:
        value = values[0];
    }

    // 스케일 적용
    if (config.scale) {
      value *= config.scale;
    }

    return value;
  }

  async writeCommand(command: ModbusCommand): Promise<void> {
    try {
      const writeConfig = this.config.writes.find(w => w.type === command.type);
      if (!writeConfig) {
        throw new Error(`지원하지 않는 명령 타입: ${command.type}`);
      }

      await this.writeRegister(writeConfig, command.params);
      
      this.logger.info(`Modbus 명령 실행됨: ${command.type}`, command.params);
    } catch (error) {
      this.logger.error(`Modbus 명령 실행 실패: ${error}`);
      throw error;
    }
  }

  private async writeRegister(config: ModbusWriteConfig, params: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.socket) {
        reject(new Error('Modbus TCP 연결되지 않음'));
        return;
      }

      const transactionId = ++this.transactionId;
      const value = this.mapCommandValue(config, params);
      const request = this.buildWriteRequest(transactionId, config, value);
      
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(transactionId.toString());
        reject(new Error('쓰기 타임아웃'));
      }, this.config.timeout || 5000);

      this.pendingCommands.set(transactionId.toString(), {
        resolve: () => {
          clearTimeout(timeout);
          resolve();
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timeout
      });

      this.socket.write(request);
    });
  }

  private buildWriteRequest(transactionId: number, config: ModbusWriteConfig, value: number): Buffer {
    const buffer = Buffer.alloc(12);
    
    // Modbus TCP 헤더
    buffer.writeUInt16BE(transactionId, 0);  // Transaction ID
    buffer.writeUInt16BE(0, 2);              // Protocol ID
    buffer.writeUInt16BE(6, 4);              // Length
    
    // Modbus PDU (Single Write)
    buffer.writeUInt8(this.config.unitId, 6); // Unit ID
    buffer.writeUInt8(config.fc, 7);           // Function Code (6 = Write Single Register)
    buffer.writeUInt16BE(config.addr, 8);      // Address
    buffer.writeUInt16BE(value, 10);           // Value
    
    return buffer;
  }

  private mapCommandValue(config: ModbusWriteConfig, params: Record<string, any>): number {
    // 명령 타입별 값 매핑
    if (config.type_mapping) {
      const key = Object.keys(params)[0];
      return config.type_mapping[key] || 0;
    }

    // 기본값 처리
    const value = Object.values(params)[0];
    return typeof value === 'boolean' ? (value ? 1 : 0) : Number(value) || 0;
  }

  private getModbusError(errorCode: number): string {
    const errors: Record<number, string> = {
      0x01: 'Illegal Function',
      0x02: 'Illegal Data Address',
      0x03: 'Illegal Data Value',
      0x04: 'Slave Device Failure',
      0x05: 'Acknowledge',
      0x06: 'Slave Device Busy',
      0x08: 'Memory Parity Error',
      0x0A: 'Gateway Path Unavailable',
      0x0B: 'Gateway Target Device Failed to Respond'
    };
    return errors[errorCode] || `Unknown Error (${errorCode})`;
  }

  // 상태 조회
  getStatus(): { connected: boolean; host: string; port: number; unitId: number } {
    return {
      connected: this.isConnected,
      host: this.config.host,
      port: this.config.port,
      unitId: this.config.unitId
    };
  }
}
