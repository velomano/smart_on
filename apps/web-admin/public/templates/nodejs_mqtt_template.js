#!/usr/bin/env node
/**
 * 🚀 Node.js MQTT 디바이스 템플릿
 * 스마트팜 플랫폼 연동용
 */

const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

class SmartFarmDevice {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.connected = false;
        this.batchSeq = 0;
        this.pumpState = false;
        this.ledState = false;
        this.valvePosition = 0;
        
        // 센서 시뮬레이션 데이터
        this.sensorData = {
            temperature: 23.5,
            humidity: 65.2,
            ec: 1.8,
            ph: 6.2,
            waterLevel: 85.0,
            light: 1200
        };
        
        // 로그 파일 설정
        this.logFile = path.join(__dirname, 'device.log');
        this.setupLogging();
        
        this.setupMQTT();
    }
    
    setupLogging() {
        // 로그 파일 초기화
        fs.writeFileSync(this.logFile, `[${this.getCurrentTimestamp()}] Device started\n`);
    }
    
    log(level, message, data = null) {
        const timestamp = this.getCurrentTimestamp();
        const logEntry = {
            timestamp,
            level,
            message,
            device_id: this.config.device_id,
            ...(data && { data })
        };
        
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
        
        // 파일 로그
        fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    }
    
    setupMQTT() {
        const clientId = `device-${this.config.device_id}-${Date.now()}`;
        
        const options = {
            clientId,
            username: this.config.username,
            password: this.config.password,
            keepalive: 60,
            reconnectPeriod: 5000,
            connectTimeout: 30000,
            clean: false, // persistent session
            ...(this.config.broker_port === 8883 && {
                rejectUnauthorized: false // 개발용, 프로덕션에서는 인증서 검증 필요
            })
        };
        
        this.client = mqtt.connect(`mqtt://${this.config.broker_url}:${this.config.broker_port}`, options);
        
        // 이벤트 리스너 설정
        this.client.on('connect', () => this.onConnect());
        this.client.on('message', (topic, message) => this.onMessage(topic, message));
        this.client.on('disconnect', () => this.onDisconnect());
        this.client.on('error', (error) => this.onError(error));
        this.client.on('reconnect', () => this.onReconnect());
    }
    
    onConnect() {
        this.log('info', 'MQTT 연결 성공', { broker_url: this.config.broker_url });
        this.connected = true;
        
        // 명령 토픽 구독
        const commandTopic = this.getCommandTopic();
        this.client.subscribe(commandTopic, { qos: 1 });
        this.log('info', '명령 토픽 구독', { topic: commandTopic });
        
        // 디바이스 등록
        this.sendRegistry();
        
        // 주기적 작업 시작
        this.startPeriodicTasks();
    }
    
    onMessage(topic, message) {
        try {
            const payload = JSON.parse(message.toString());
            this.log('info', '메시지 수신', { topic, payload });
            
            const { command, command_id, payload: commandPayload } = payload;
            
            // 명령 처리
            switch (command) {
                case 'pump_on':
                    this.handlePumpOn(command_id, commandPayload);
                    break;
                case 'pump_off':
                    this.handlePumpOff(command_id, commandPayload);
                    break;
                case 'valve_open':
                    this.handleValveOpen(command_id, commandPayload);
                    break;
                case 'valve_close':
                    this.handleValveClose(command_id, commandPayload);
                    break;
                case 'led_on':
                    this.handleLedOn(command_id, commandPayload);
                    break;
                case 'led_off':
                    this.handleLedOff(command_id, commandPayload);
                    break;
                case 'update_config':
                    this.handleConfigUpdate(command_id, commandPayload);
                    break;
                default:
                    this.log('warn', '알 수 없는 명령', { command });
                    this.sendCommandAck(command_id, 'error', `Unknown command: ${command}`);
            }
        } catch (error) {
            this.log('error', '메시지 처리 오류', { error: error.message });
        }
    }
    
    onDisconnect() {
        this.log('info', 'MQTT 연결 해제');
        this.connected = false;
    }
    
    onError(error) {
        this.log('error', 'MQTT 오류', { error: error.message });
    }
    
    onReconnect() {
        this.log('info', 'MQTT 재연결 시도');
    }
    
    getCurrentTimestamp() {
        return new Date().toISOString();
    }
    
    getRegistryTopic() {
        return `farms/${this.config.farm_id}/devices/${this.config.device_id}/registry`;
    }
    
    getStateTopic() {
        return `farms/${this.config.farm_id}/devices/${this.config.device_id}/state`;
    }
    
    getTelemetryTopic() {
        return `farms/${this.config.farm_id}/devices/${this.config.device_id}/telemetry`;
    }
    
    getCommandTopic() {
        return `farms/${this.config.farm_id}/devices/${this.config.device_id}/command`;
    }
    
    getAckTopic() {
        return `farms/${this.config.farm_id}/devices/${this.config.device_id}/command/ack`;
    }
    
    publishMessage(topic, data) {
        if (this.connected) {
            const message = JSON.stringify(data);
            this.client.publish(topic, message, { qos: 1 }, (error) => {
                if (error) {
                    this.log('error', '메시지 발행 실패', { topic, error: error.message });
                } else {
                    this.log('info', '메시지 발행 성공', { topic });
                }
            });
        } else {
            this.log('warn', 'MQTT 연결되지 않음, 메시지 발행 실패', { topic });
        }
    }
    
    sendRegistry() {
        const registryData = {
            device_id: this.config.device_id,
            device_type: this.config.device_type,
            firmware_version: this.config.firmware_version,
            hardware_version: 'v2.1',
            capabilities: {
                sensors: ['temperature', 'humidity', 'ec', 'ph', 'water_level', 'light'],
                actuators: ['pump', 'valve', 'led'],
                communication: ['wifi', 'mqtt', 'ethernet']
            },
            location: {
                farm_id: this.config.farm_id,
                bed_id: 'bed_a1',
                tier: 1
            },
            timestamp: this.getCurrentTimestamp()
        };
        
        this.publishMessage(this.getRegistryTopic(), registryData);
        this.log('info', '디바이스 등록 전송');
    }
    
    sendState() {
        const stateData = {
            device_id: this.config.device_id,
            status: {
                online: true,
                battery_level: Math.floor(Math.random() * 21) + 80, // 80-100%
                signal_strength: Math.floor(Math.random() * 41) - 70, // -70 to -30 dBm
                uptime: Math.floor(process.uptime()),
                last_restart: this.getCurrentTimestamp(),
                memory_usage: process.memoryUsage(),
                cpu_usage: process.cpuUsage()
            },
            sensors: {
                temperature: { connected: true, calibrated: true },
                humidity: { connected: true, calibrated: true },
                ec: { connected: true, calibrated: false },
                ph: { connected: true, calibrated: false },
                water_level: { connected: true, calibrated: true },
                light: { connected: true, calibrated: false }
            },
            actuators: {
                pump_1: {
                    status: this.pumpState ? 'on' : 'off',
                    last_command: this.getCurrentTimestamp()
                },
                valve_1: {
                    status: this.valvePosition > 0 ? 'open' : 'closed',
                    position: this.valvePosition
                },
                led_1: {
                    status: this.ledState ? 'on' : 'off',
                    brightness: this.ledState ? 100 : 0
                }
            },
            timestamp: this.getCurrentTimestamp()
        };
        
        this.publishMessage(this.getStateTopic(), stateData);
        this.log('info', '디바이스 상태 전송');
    }
    
    sendTelemetry() {
        // 센서 데이터 시뮬레이션
        this.simulateSensorData();
        
        const telemetryData = {
            device_id: this.config.device_id,
            batch_seq: this.batchSeq++,
            window_ms: 30000,
            readings: [
                {
                    key: 'temperature',
                    tier: 1,
                    unit: 'celsius',
                    value: this.sensorData.temperature,
                    ts: this.getCurrentTimestamp(),
                    quality: 'good'
                },
                {
                    key: 'humidity',
                    tier: 1,
                    unit: 'percent',
                    value: this.sensorData.humidity,
                    ts: this.getCurrentTimestamp(),
                    quality: 'good'
                },
                {
                    key: 'ec',
                    tier: 1,
                    unit: 'ms_cm',
                    value: this.sensorData.ec,
                    ts: this.getCurrentTimestamp(),
                    quality: 'good'
                },
                {
                    key: 'ph',
                    tier: 1,
                    unit: 'ph',
                    value: this.sensorData.ph,
                    ts: this.getCurrentTimestamp(),
                    quality: 'good'
                },
                {
                    key: 'water_level',
                    tier: 1,
                    unit: 'percent',
                    value: this.sensorData.waterLevel,
                    ts: this.getCurrentTimestamp(),
                    quality: 'good'
                },
                {
                    key: 'light',
                    tier: 1,
                    unit: 'lux',
                    value: this.sensorData.light,
                    ts: this.getCurrentTimestamp(),
                    quality: 'good'
                }
            ],
            timestamp: this.getCurrentTimestamp()
        };
        
        this.publishMessage(this.getTelemetryTopic(), telemetryData);
        this.log('info', '센서 데이터 전송', { readings_count: telemetryData.readings.length });
    }
    
    sendCommandAck(commandId, status, detail) {
        const ackData = {
            command_id: commandId,
            status,
            detail,
            state: {
                pump_1: {
                    status: this.pumpState ? 'on' : 'off',
                    flow_rate: this.pumpState ? 2.5 : 0.0
                },
                valve_1: {
                    status: this.valvePosition > 0 ? 'open' : 'closed',
                    position: this.valvePosition
                },
                led_1: {
                    status: this.ledState ? 'on' : 'off',
                    brightness: this.ledState ? 100 : 0
                }
            },
            timestamp: this.getCurrentTimestamp()
        };
        
        this.publishMessage(this.getAckTopic(), ackData);
        this.log('info', '명령 ACK 전송', { command_id: commandId, status, detail });
    }
    
    simulateSensorData() {
        // 실제로는 하드웨어 센서에서 읽기
        this.sensorData.temperature += (Math.random() - 0.5) * 0.5;
        this.sensorData.humidity += (Math.random() - 0.5) * 2.0;
        this.sensorData.ec += (Math.random() - 0.5) * 0.1;
        this.sensorData.ph += (Math.random() - 0.5) * 0.1;
        this.sensorData.waterLevel += (Math.random() - 0.5) * 1.0;
        this.sensorData.light += (Math.random() - 0.5) * 50;
        
        // 범위 제한
        this.sensorData.temperature = Math.max(15.0, Math.min(35.0, this.sensorData.temperature));
        this.sensorData.humidity = Math.max(30.0, Math.min(90.0, this.sensorData.humidity));
        this.sensorData.ec = Math.max(0.5, Math.min(3.0, this.sensorData.ec));
        this.sensorData.ph = Math.max(5.0, Math.min(8.0, this.sensorData.ph));
        this.sensorData.waterLevel = Math.max(0.0, Math.min(100.0, this.sensorData.waterLevel));
        this.sensorData.light = Math.max(0, Math.min(50000, this.sensorData.light));
    }
    
    // 명령 처리 함수들
    handlePumpOn(commandId, payload) {
        const duration = payload.duration || 300;
        const flowRate = payload.flow_rate || 2.5;
        
        this.pumpState = true;
        const detail = `Pump turned on for ${duration} seconds, flow rate: ${flowRate} L/min`;
        
        this.log('info', '펌프 켜짐', { duration, flow_rate: flowRate });
        this.sendCommandAck(commandId, 'success', detail);
        
        // 타이머 설정 (실제로는 하드웨어 제어)
        if (duration > 0) {
            setTimeout(() => {
                this.pumpState = false;
                this.log('info', '펌프 자동 꺼짐', { duration });
            }, duration * 1000);
        }
    }
    
    handlePumpOff(commandId, payload) {
        this.pumpState = false;
        this.log('info', '펌프 꺼짐');
        this.sendCommandAck(commandId, 'success', 'Pump turned off');
    }
    
    handleValveOpen(commandId, payload) {
        const position = payload.position || 100;
        this.valvePosition = position;
        
        this.log('info', '밸브 열림', { position });
        this.sendCommandAck(commandId, 'success', `Valve opened to ${position}%`);
    }
    
    handleValveClose(commandId, payload) {
        this.valvePosition = 0;
        this.log('info', '밸브 닫힘');
        this.sendCommandAck(commandId, 'success', 'Valve closed');
    }
    
    handleLedOn(commandId, payload) {
        const brightness = payload.brightness || 100;
        const color = payload.color || 'white';
        
        this.ledState = true;
        this.log('info', 'LED 켜짐', { brightness, color });
        this.sendCommandAck(commandId, 'success', `LED turned on, brightness: ${brightness}%, color: ${color}`);
    }
    
    handleLedOff(commandId, payload) {
        this.ledState = false;
        this.log('info', 'LED 꺼짐');
        this.sendCommandAck(commandId, 'success', 'LED turned off');
    }
    
    handleConfigUpdate(commandId, payload) {
        const samplingInterval = payload.sampling_interval || 30;
        const calibrationOffset = payload.calibration_offset || {};
        
        this.log('info', '설정 업데이트', { sampling_interval: samplingInterval, calibration_offset: calibrationOffset });
        this.sendCommandAck(commandId, 'success', `Configuration updated, sampling interval: ${samplingInterval}s`);
    }
    
    startPeriodicTasks() {
        // 30초마다 센서 데이터 전송
        setInterval(() => {
            if (this.connected) {
                this.sendTelemetry();
            }
        }, 30000);
        
        // 5분마다 상태 전송
        setInterval(() => {
            if (this.connected) {
                this.sendState();
            }
        }, 300000);
        
        // 1시간마다 재등록
        setInterval(() => {
            if (this.connected) {
                this.sendRegistry();
            }
        }, 3600000);
        
        this.log('info', '주기적 작업 시작됨');
    }
    
    disconnect() {
        if (this.connected) {
            this.client.end();
            this.log('info', 'MQTT 연결 해제됨');
        }
    }
}

// 설정 파일 로드
function loadConfig() {
    const configPath = path.join(__dirname, 'config.json');
    
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
        // 기본 설정
        const defaultConfig = {
            farm_id: 'farm_001',
            device_id: 'device_001',
            broker_url: 'localhost',
            broker_port: 1883,
            username: 'your-username',
            password: 'your-password',
            device_type: 'sensor_gateway',
            firmware_version: '1.0.0'
        };
        
        // 설정 파일 생성
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log('설정 파일이 생성되었습니다: config.json');
        console.log('설정을 수정한 후 다시 실행하세요.');
        process.exit(0);
    }
}

// 메인 함수
function main() {
    console.log('🚀 스마트팜 디바이스 시작');
    
    const config = loadConfig();
    const device = new SmartFarmDevice(config);
    
    // 종료 처리
    process.on('SIGINT', () => {
        console.log('\n🛑 디바이스 종료 중...');
        device.disconnect();
        console.log('✅ 정상 종료됨');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 디바이스 종료 중...');
        device.disconnect();
        console.log('✅ 정상 종료됨');
        process.exit(0);
    });
    
    process.on('uncaughtException', (error) => {
        console.error('❌ 예상치 못한 오류:', error);
        device.disconnect();
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ 처리되지 않은 Promise 거부:', reason);
        device.disconnect();
        process.exit(1);
    });
}

if (require.main === module) {
    main();
}

module.exports = SmartFarmDevice;
