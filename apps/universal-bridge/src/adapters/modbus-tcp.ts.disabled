/**
 * Modbus TCP Transport Adapter
 * 
 * Modbus TCP 프로토콜을 통한 산업용 네트워크 통신
 */

import { BridgeAdapter, Telemetry, Command, CommandAck, TransportType } from '../types/core';

export interface ModbusTcpAdapterConfig {
  host: string;                 // Modbus TCP 서버 주소
  port: number;                 // 기본 502
  unitId: number;               // Modbus Unit ID
  timeoutMs: number;            // 응답 타임아웃
  tenantId: string;
  farmId?: string;
  deviceId?: string;
  registerMappings?: Record<string, number>; // 센서/제어 → 레지스터 주소 매핑
}

export class ModbusTcpAdapter implements BridgeAdapter {
  name: TransportType = 'modbus-tcp';
  private config: ModbusTcpAdapterConfig;
  private client: any; // modbus-serial.ModbusRTU
  private isConnected = false;
  private commandHandler?: (cmd: Command) => Promise<CommandAck>;
  private pollingInterval?: NodeJS.Timeout;

  constructor(config: ModbusTcpAdapterConfig) {
    this.config = {
      port: 502,
      unitId: 1,
      timeoutMs: 1000,
      registerMappings: {},
      ...config
    };
  }

  async init(): Promise<void> {
    const ModbusRTU = require('modbus-serial');
    
    this.client = new ModbusRTU();
    
    try {
      await this.client.connectTCP(this.config.host, { port: this.config.port });
      this.client.setID(this.config.unitId);
      this.client.setTimeout(this.config.timeoutMs);
      
      console.log(`[Modbus TCP Adapter] Connected to ${this.config.host}:${this.config.port}`);
      this.isConnected = true;

      // 센서 폴링 시작
      this.startSensorPolling();
      
    } catch (error) {
      console.error('[Modbus TCP Adapter] Connection failed:', error);
      throw error;
    }
  }

  async publishTelemetry(payload: Telemetry): Promise<void> {
    // Modbus TCP는 주로 폴링 방식이므로 publishTelemetry는 폴링 결과를 저장하는 용도
    console.log(`[Modbus TCP Adapter] Telemetry data:`, payload);
  }

  async sendCommand(cmd: Command): Promise<CommandAck> {
    if (!this.isConnected) {
      throw new Error('Modbus TCP not connected');
    }

    try {
      const registerAddr = this.getRegisterAddress(cmd.type);
      const value = this.convertCommandToValue(cmd);

      // Modbus TCP 쓰기 명령 실행
      const result = await this.client.writeSingleRegister(registerAddr, value);
      
      console.log(`[Modbus TCP Adapter] Command sent: ${cmd.type} -> Register ${registerAddr} = ${value}`);

      return {
        device_id: cmd.device_id,
        command_id: cmd.ts || new Date().toISOString(),
        ts: new Date().toISOString(),
        status: 'ack',
        result: { register: registerAddr, value }
      };

    } catch (error: any) {
      console.error('[Modbus TCP Adapter] Command failed:', error);
      
      return {
        device_id: cmd.device_id,
        command_id: cmd.ts || new Date().toISOString(),
        ts: new Date().toISOString(),
        status: 'nack',
        error: error.message
      };
    }
  }

  subscribeCommands?(onCmd: (cmd: Command) => Promise<CommandAck>): () => void {
    this.commandHandler = onCmd;
    
    // Modbus TCP는 폴링 방식이므로 명령 구독은 상위 레벨에서 처리
    console.log('[Modbus TCP Adapter] Command subscription enabled (polling mode)');
    
    return () => {
      this.commandHandler = undefined;
    };
  }

  private startSensorPolling(): void {
    // 센서 데이터를 주기적으로 읽어서 텔레메트리로 변환
    this.pollingInterval = setInterval(async () => {
      try {
        const telemetry = await this.readSensorData();
        if (telemetry) {
          await this.publishTelemetry(telemetry);
        }
      } catch (error) {
        console.error('[Modbus TCP Adapter] Sensor polling error:', error);
      }
    }, 5000); // 5초마다 폴링
  }

  private async readSensorData(): Promise<Telemetry | null> {
    if (!this.isConnected) return null;

    try {
      const metrics: Record<string, number> = {};
      
      // 등록된 센서 레지스터들을 읽기
      for (const [sensorType, registerAddr] of Object.entries(this.config.registerMappings || {})) {
        if (sensorType.startsWith('sensor_')) {
          const result = await this.client.readHoldingRegisters(registerAddr, 1);
          const value = result.data[0];
          
          // 센서 타입에 따른 값 변환
          const convertedValue = this.convertSensorValue(sensorType, value);
          metrics[sensorType] = convertedValue;
        }
      }

      if (Object.keys(metrics).length === 0) {
        return null;
      }

      return {
        device_id: this.config.deviceId || 'modbus-tcp-device',
        ts: new Date().toISOString(),
        metrics,
        status: 'ok'
      };

    } catch (error) {
      console.error('[Modbus TCP Adapter] Sensor read error:', error);
      return null;
    }
  }

  private getRegisterAddress(commandType: string): number {
    // 명령 타입에 따른 레지스터 주소 반환
    const mapping = this.config.registerMappings || {};
    
    switch (commandType) {
      case 'relay_control':
        return mapping.relay_control || 0x0001;
      case 'set_pwm':
        return mapping.pwm_control || 0x0002;
      case 'set_servo':
        return mapping.servo_control || 0x0003;
      case 'pump_control':
        return mapping.pump_control || 0x0004;
      default:
        return mapping[commandType] || 0x0000;
    }
  }

  private convertCommandToValue(cmd: Command): number {
    // 명령을 Modbus 레지스터 값으로 변환
    switch (cmd.type) {
      case 'relay_control':
        return cmd.params.enabled ? 1 : 0;
      case 'set_pwm':
        return Math.round(cmd.params.duty * 100); // 0-100%
      case 'set_servo':
        return Math.round(cmd.params.angle); // 0-180도
      case 'pump_control':
        return cmd.params.speed || 0; // 0-100%
      default:
        return cmd.params.value || 0;
    }
  }

  private convertSensorValue(sensorType: string, rawValue: number): number {
    // 센서 타입에 따른 값 변환
    switch (sensorType) {
      case 'sensor_temperature':
        return rawValue / 10; // 0.1도 단위로 저장된 경우
      case 'sensor_humidity':
        return rawValue / 10; // 0.1% 단위로 저장된 경우
      case 'sensor_soil_moisture':
        return rawValue; // 그대로 사용
      case 'sensor_ph':
        return rawValue / 100; // 0.01 단위로 저장된 경우
      default:
        return rawValue;
    }
  }

  /**
   * 레지스터 매핑 설정
   */
  setRegisterMappings(mappings: Record<string, number>): void {
    this.config.registerMappings = { ...this.config.registerMappings, ...mappings };
    console.log('[Modbus TCP Adapter] Register mappings updated:', mappings);
  }

  /**
   * 연결 상태 확인
   */
  async ping(): Promise<boolean> {
    try {
      await this.client.readHoldingRegisters(0, 1);
      return true;
    } catch (error) {
      return false;
    }
  }

  async destroy?(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }

    if (this.client && this.isConnected) {
      this.client.close(() => {
        console.log('[Modbus TCP Adapter] Disconnected');
        this.isConnected = false;
      });
    }
  }
}
