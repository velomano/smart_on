/**
 * Web Admin API Routes
 * 
 * 웹어드민에서 호출하는 센서/액추에이터 조회 API
 */

import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/farms/:farmId/sensors/latest
 * 
 * 농장의 최신 센서 데이터 조회
 */
export async function getLatestSensorData(req: Request, res: Response): Promise<void> {
  try {
    const { farmId } = req.params;
    const { deviceId } = req.query;

    logger.debug('센서 데이터 조회 요청', { farmId, deviceId });

    // 디바이스 조회
    let deviceQuery = supabase
      .from('devices')
      .select('*')
      .eq('farm_id', farmId)
      .eq('status->online', true);

    if (deviceId) {
      deviceQuery = deviceQuery.eq('id', deviceId);
    }

    const { data: devices, error: deviceError } = await deviceQuery;

    if (deviceError) {
      logger.error('디바이스 조회 실패', { farmId, error: deviceError });
      return res.status(500).json({ 
        error: '디바이스 조회 실패',
        message: '센서 데이터 조회 중 오류가 발생했습니다.'
      });
    }

    if (!devices || devices.length === 0) {
      logger.info('연결된 디바이스 없음', { farmId });
      return res.json({ 
        data: [],
        message: '연결된 센서가 없습니다.'
      });
    }

    // 각 디바이스의 최신 센서 데이터 조회
    const sensorData = [];

    for (const device of devices) {
      // 센서 목록 조회
      const { data: sensors, error: sensorError } = await supabase
        .from('sensors')
        .select('*')
        .eq('device_id', device.id);

      if (sensorError) {
        logger.warn('센서 목록 조회 실패', { deviceId: device.id, error: sensorError });
        continue;
      }

      if (!sensors || sensors.length === 0) {
        continue;
      }

      // 각 센서의 최신 데이터 조회
      for (const sensor of sensors) {
        const { data: readings, error: readingError } = await supabase
          .from('sensor_readings')
          .select('*')
          .eq('sensor_id', sensor.id)
          .order('timestamp', { ascending: false })
          .limit(1);

        if (readingError) {
          logger.warn('센서 데이터 조회 실패', { sensorId: sensor.id, error: readingError });
          continue;
        }

        if (readings && readings.length > 0) {
          const reading = readings[0];
          sensorData.push({
            deviceId: device.id,
            deviceName: device.name || `${device.type} 디바이스`,
            deviceType: 'sensor',
            sensorKey: sensor.type,
            value: reading.value,
            unit: sensor.unit || reading.unit || '',
            timestamp: reading.timestamp,
            quality: reading.quality || 'good'
          });
        }
      }
    }

    logger.info('센서 데이터 조회 완료', { farmId, sensorCount: sensorData.length });

    res.json({
      data: sensorData,
      message: '센서 데이터 조회 성공'
    });

  } catch (error: unknown) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), '센서 데이터 조회 오류', {
      farmId: req.params.farmId,
      clientIp: req.ip
    });

    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '센서 데이터 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * GET /api/farms/:farmId/actuators/status
 * 
 * 농장의 액추에이터 상태 조회
 */
export async function getActuatorStatus(req: Request, res: Response): Promise<void> {
  try {
    const { farmId } = req.params;
    const { deviceId } = req.query;

    logger.debug('액추에이터 상태 조회 요청', { farmId, deviceId });

    // 디바이스 조회
    let deviceQuery = supabase
      .from('devices')
      .select('*')
      .eq('farm_id', farmId)
      .eq('status->online', true);

    if (deviceId) {
      deviceQuery = deviceQuery.eq('id', deviceId);
    }

    const { data: devices, error: deviceError } = await deviceQuery;

    if (deviceError) {
      logger.error('디바이스 조회 실패', { farmId, error: deviceError });
      return res.status(500).json({ 
        error: '디바이스 조회 실패',
        message: '액추에이터 상태 조회 중 오류가 발생했습니다.'
      });
    }

    if (!devices || devices.length === 0) {
      logger.info('연결된 디바이스 없음', { farmId });
      return res.json({ 
        data: [],
        message: '연결된 액추에이터가 없습니다.'
      });
    }

    // 각 디바이스의 액추에이터 상태 조회
    const actuatorData = [];

    for (const device of devices) {
      const actuators = device.status?.actuators || [];
      
      for (const actuator of actuators) {
        actuatorData.push({
          deviceId: device.id,
          deviceName: device.name || `${device.type} 디바이스`,
          deviceType: actuator.type,
          status: actuator.status || 'off',
          isOnline: device.status?.online || false,
          meta: actuator.meta || {},
          lastSeen: device.status?.last_seen || new Date().toISOString()
        });
      }
    }

    logger.info('액추에이터 상태 조회 완료', { farmId, actuatorCount: actuatorData.length });

    res.json({
      data: actuatorData,
      message: '액추에이터 상태 조회 성공'
    });

  } catch (error: unknown) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), '액추에이터 상태 조회 오류', {
      farmId: req.params.farmId,
      clientIp: req.ip
    });

    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '액추에이터 상태 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * POST /api/farms/:farmId/actuators/control
 * 
 * 액추에이터 제어 명령 전송
 */
export async function controlActuator(req: Request, res: Response): Promise<void> {
  try {
    const { farmId } = req.params;
    const { deviceId, actuatorType, action, value, mode, schedule, dualTime } = req.body;

    logger.debug('액추에이터 제어 요청', { farmId, deviceId, actuatorType, action });

    // 디바이스 존재 확인
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .eq('farm_id', farmId)
      .single();

    if (deviceError || !device) {
      logger.warn('디바이스 없음', { farmId, deviceId, error: deviceError });
      return res.status(404).json({ 
        error: 'Device not found',
        message: '디바이스를 찾을 수 없습니다.'
      });
    }

    // 명령 데이터 생성
    const commandData = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      device_id: deviceId,
      command_type: actuatorType,
      command_data: {
        action,
        value: value || null,
        mode: mode || null,
        schedule: schedule || null,
        dualTime: dualTime || null,
        timestamp: new Date().toISOString()
      },
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // 명령 저장 (실제로는 MQTT로 전송해야 함)
    const { error: commandError } = await supabase
      .from('device_commands')
      .insert([{
        id: commandData.id,
        device_id: deviceId,
        farm_id: farmId,
        command_type: actuatorType,
        command_data: commandData.command_data,
        status: 'pending',
        created_at: commandData.created_at
      }]);

    if (commandError) {
      logger.error('명령 저장 실패', { farmId, deviceId, error: commandError });
      return res.status(500).json({ 
        error: 'Command save failed',
        message: '명령 저장에 실패했습니다.'
      });
    }

    logger.info('액추에이터 제어 명령 처리 완료', { farmId, deviceId, actuatorType, action });

    res.json({
      data: [commandData],
      message: '액추에이터 제어 명령이 전송되었습니다.'
    });

  } catch (error: unknown) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), '액추에이터 제어 오류', {
      farmId: req.params.farmId,
      deviceId: req.body?.deviceId,
      clientIp: req.ip
    });

    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '액추에이터 제어 중 오류가 발생했습니다.'
    });
  }
}
