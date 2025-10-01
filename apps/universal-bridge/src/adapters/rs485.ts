/**
 * RS-485 (Modbus RTU) Transport Adapter
 * 
 * Modbus RTU 프로토콜을 통한 산업용 센서/제어기 통신
 */

import { BridgeAdapter, Telemetry, Command, CommandAck, TransportType } from '../types/core';

export interface Rs485AdapterConfig {
  port: string;           // '/dev/ttyUSB0' 또는 'COM3'
  baudRate: number;      // 9600, 19200, 38400 등
  parity: 'none' | 'even' | 'odd';
  stopBits: number;      // 1 또는 2
  slaveId: number;       // Modbus 슬레이브 ID
  timeoutMs: number;     // 응답 타임아웃
  tenantId: string;
  farmId?: string;
  deviceId?: string;
  registerMappings?: Record<string, number>; // 센서/제어 → 레지스터 주소 매핑
}

export class Rs485Adapter implements BridgeAdapter {
  name: TransportType = 'rs485';
  private config: Rs485AdapterConfig;
  private serialPort: any; // serialport.SerialPort
  private modbusMaster: any; // modbus-serial.ModbusRTU
  private isConnected = false;
  private commandHandler?: (cmd: Command) => Promise<CommandAck>;
  private pollingInterval?: NodeJS.Timeout;

  constructor(config: Rs485AdapterConfig) {
    this.config = {
      baudRate: 9600,
      parity: 'none',
      stopBits: 1,
      slaveId: 1,
      timeoutMs: 1000,
      registerMappings: {},
      ...config
    };
  }

  async init(): Promise<void> {
    const ModbusRTU = require('modbus-serial');
    
    this.modbusMaster = new ModbusRTU();
    
    const connectionOptions = {
      baudRate: this.config.baudRate,
      parity: this.config.parity,
      stopBits: this.config.stopBits,
      timeout: this.config.timeoutMs
    };

    try {
      await this.modbusMaster.connectRTUBuffered(this.config.port, connectionOptions);
      this.modbusMaster.setID(this.config.slaveId);
      
      console.log(`[RS-485 Adapter] Connected to ${this.config.port} (${this.config.baudRate} baud)`);
      this.isConnected = true;

      // 센서 폴링 시작
      this.startSensorPolling();
      
    } catch (error) {
      console.error('[RS-485 Adapter] Connection failed:', error);
      throw error;
    }
  }

  async publishTelemetry(payload: Telemetry): Promise<void> {
    // RS-485는 주로 폴링 방식이므로 publishTelemetry는 폴링 결과를 저장하는 용도
    console.log(`[RS-485 Adapter] Telemetry data:`, payload);
    
    // 실제 구현에서는 DB에 저장하거나 상위 레벨로 전달
    // 여기서는 로그만 출력
  }

  async sendCommand(cmd: Command): Promise<CommandAck> {
    if (!this.isConnected) {
      throw new Error('RS-485 not connected');
    }

    try {
      const registerAddr = this.getRegisterAddress(cmd.type);
      const value = this.convertCommandToValue(cmd);

      // Modbus 쓰기 명령 실행
      const result = await this.modbusMaster.writeSingleRegister(registerAddr, value);
      
      console.log(`[RS-485 Adapter] Command sent: ${cmd.type} -> Register ${registerAddr} = ${value}`);

      return {
        device_id: cmd.device_id,
        command_id: cmd.ts,
        ts: new Date().toISOString(),
        status: 'ack',
        result: { register: registerAddr, value }
      };

    } catch (error) {
      console.error('[RS-485 Adapter] Command failed:', error);
      
      return {
        device_id: cmd.device_id,
        command_id: cmd.ts,
        ts: new Date().toISOString(),
        status: 'nack',
        error: error.message
      };
    }
  }

  subscribeCommands?(onCmd: (cmd: Command) => Promise<CommandAck>): () => void {
    this.commandHandler = onCmd;
    
    // RS-485는 폴링 방식이므로 명령 구독은 상위 레벨에서 처리
    console.log('[RS-485 Adapter] Command subscription enabled (polling mode)');
    
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
        console.error('[RS-485 Adapter] Sensor polling error:', error);
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
          const result = await this.modbusMaster.readHoldingRegisters(registerAddr, 1);
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
        device_id: this.config.deviceId || 'rs485-device',
        ts: new Date().toISOString(),
        metrics,
        status: 'ok'
      };

    } catch (error) {
      console.error('[RS-485 Adapter] Sensor read error:', error);
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
    console.log('[RS-485 Adapter] Register mappings updated:', mappings);
  }

  /**
   * 다중 슬레이브 스캔
   */
  async scanSlaves(): Promise<number[]> {
    const foundSlaves: number[] = [];
    
    for (let slaveId = 1; slaveId <= 247; slaveId++) {
      try {
        this.modbusMaster.setID(slaveId);
        await this.modbusMaster.readHoldingRegisters(0, 1);
        foundSlaves.push(slaveId);
        console.log(`[RS-485 Adapter] Found slave: ${slaveId}`);
      } catch (error) {
        // 슬레이브가 없으면 에러 발생 (정상)
      }
    }
    
    // 원래 슬레이브 ID로 복원
    this.modbusMaster.setID(this.config.slaveId);
    
    return foundSlaves;
  }

  async destroy?(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }

    if (this.modbusMaster && this.isConnected) {
      this.modbusMaster.close(() => {
        console.log('[RS-485 Adapter] Disconnected');
        this.isConnected = false;
      });
    }
  }
}
