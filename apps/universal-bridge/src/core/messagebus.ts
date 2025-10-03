/**
 * Universal Message Bus
 * 
 * 프로토콜 독립적 메시지 처리
 * TODO: 실제 핸들러 연결 구현 필요
 */

import type { DeviceMessage } from '../types.js';

export class UniversalMessageBus {
  /**
   * 프로토콜에 관계없이 메시지 처리
   * 
   * @param message - 디바이스 메시지
   * @returns Promise<void>
   * 
   * TODO:
   * - [ ] 메시지 타입별 라우팅 구현
   * - [ ] 에러 처리 및 재시도 로직
   * - [ ] 메트릭 수집
   */
  async process(message: DeviceMessage): Promise<void> {
    console.log('[MessageBus] Processing message:', {
      type: message.messageType,
      protocol: message.protocol,
      deviceId: message.deviceId
    });

    // TODO: 메시지 타입별 처리
    switch (message.messageType) {
      case 'registry':
        await this.handleRegistry(message);
        break;
      case 'state':
        await this.handleState(message);
        break;
      case 'telemetry':
        await this.handleTelemetry(message);
        break;
      case 'command':
        await this.handleCommand(message);
        break;
      case 'ack':
        await this.handleAck(message);
        break;
      default:
        console.warn('[MessageBus] Unknown message type:', message.messageType);
    }
  }

  private async handleRegistry(message: DeviceMessage): Promise<void> {
    console.log('[MessageBus] Processing registry:', message.deviceId);
    
    try {
      const { getDeviceByDeviceId, insertDevice, updateDeviceProfile } = await import('../db/index.js');
      
      // 디바이스 조회 또는 생성
      let device = await getDeviceByDeviceId(message.tenantId, message.deviceId);
      
      if (!device) {
        // 새 디바이스 생성
        device = await insertDevice({
          device_id: message.deviceId,
          tenant_id: message.tenantId,
          farm_id: message.farmId,
          device_type: message.payload.device_type || 'unknown',
          capabilities: message.payload.capabilities || {},
          device_key_hash: '', // Will be set later
          status: 'active'
        });
        console.log('[MessageBus] Created new device:', device.id);
      } else {
        // 기존 디바이스 프로필 업데이트
        await updateDeviceProfile(device.device_id, message.tenantId, {
          device_type: message.payload.device_type || device.device_type,
          capabilities: message.payload.capabilities || device.capabilities,
        });
        console.log('[MessageBus] Updated device profile:', device.id);
      }
    } catch (error) {
      console.error('[MessageBus] Registry error:', error);
    }
  }

  private async handleState(message: DeviceMessage): Promise<void> {
    console.log('[MessageBus] Processing state:', message.deviceId);
    
    try {
      const { getDeviceByDeviceId, updateDeviceState } = await import('../db/index.js');
      
      // 디바이스 조회
      const device = await getDeviceByDeviceId(message.tenantId, message.deviceId);
      if (!device) {
        console.warn('[MessageBus] Device not found for state update:', message.deviceId);
        return;
      }
      
      // 디바이스 상태 업데이트
      await updateDeviceState(device.device_id, message.tenantId, {
        status: message.payload.online !== false ? 'online' : 'offline',
        metadata: message.payload.state || {},
      });
      
      console.log('[MessageBus] Updated device state:', device.id, message.payload);
    } catch (error) {
      console.error('[MessageBus] State error:', error);
    }
  }

  private async handleTelemetry(message: DeviceMessage): Promise<void> {
    console.log('[MessageBus] Processing telemetry:', message.deviceId);
    
    try {
      const { getDeviceByDeviceId, insertReadings, updateDeviceLastSeen } = await import('../db/index.js');
      
      // 디바이스 조회
      const device = await getDeviceByDeviceId(message.tenantId, message.deviceId);
      if (!device) {
        console.warn('[MessageBus] Device not found for telemetry:', message.deviceId);
        return;
      }
      
      // 텔레메트리 데이터 저장
      if (message.payload.readings && message.payload.readings.length > 0) {
        await insertReadings(message.tenantId, device.id, message.payload.readings);
        
        // 마지막 접속 시간 업데이트
        await updateDeviceLastSeen(device.id);
        
        console.log('[MessageBus] Saved telemetry:', device.id, message.payload.readings.length, 'readings');
      }
    } catch (error) {
      console.error('[MessageBus] Telemetry error:', error);
    }
  }

  private async handleCommand(message: DeviceMessage): Promise<void> {
    console.log('[MessageBus] Processing command:', message.deviceId);
    
    try {
      const { getDeviceByDeviceId, insertCommand } = await import('../db/index.js');
      
      // 디바이스 조회
      const device = await getDeviceByDeviceId(message.tenantId, message.deviceId);
      if (!device) {
        console.warn('[MessageBus] Device not found for command:', message.deviceId);
        return;
      }
      
      // 명령 저장
      const command = await insertCommand({
        device_id: device.device_id,
        command_id: message.payload.command_id || `cmd_${Date.now()}`,
        type: message.payload.command || message.payload.type,
        params: message.payload.payload || message.payload,
        status: 'pending',
      });
      
      console.log('[MessageBus] Saved command:', command.id, 'for device:', device.id);
    } catch (error) {
      console.error('[MessageBus] Command error:', error);
    }
  }

  private async handleAck(message: DeviceMessage): Promise<void> {
    console.log('[MessageBus] Processing ACK:', message.deviceId);
    
    try {
      const { updateCommandStatus } = await import('../db/index.js');
      
      const { command_id, status, detail } = message.payload;
      
      if (command_id) {
        // 명령 상태 업데이트
        await updateCommandStatus(command_id, status || 'acked', detail);
        console.log('[MessageBus] Updated command status:', command_id, status || 'acked');
      } else {
        console.warn('[MessageBus] No command_id in ACK message');
      }
    } catch (error) {
      console.error('[MessageBus] ACK error:', error);
    }
  }
}

