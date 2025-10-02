#!/usr/bin/env python3
"""
Raspberry Pi Gateway
Modbus/Serial 장치를 폴링하여 MQTT/HTTP로 업링크하는 게이트웨이
"""

import json
import time
import logging
import paho.mqtt.client as mqtt
import requests
from pymodbus.client.sync import ModbusTcpClient
import serial
from datetime import datetime

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Gateway:
    def __init__(self, config_file='config.json'):
        self.config = self.load_config(config_file)
        self.device_id = self.config.get('device_id', 'rpi-gateway-001')
        self.mqtt_client = None
        self.modbus_client = None
        self.serial_conn = None
        
    def load_config(self, config_file):
        """설정 파일 로드"""
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error(f"설정 파일을 찾을 수 없습니다: {config_file}")
            return {}
    
    def init_mqtt(self):
        """MQTT 클라이언트 초기화"""
        mqtt_config = self.config.get('mqtt', {})
        if not mqtt_config:
            return
            
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.on_connect = self.on_mqtt_connect
        self.mqtt_client.on_message = self.on_mqtt_message
        
        try:
            self.mqtt_client.connect(
                mqtt_config.get('host', 'localhost'),
                mqtt_config.get('port', 1883),
                60
            )
            self.mqtt_client.loop_start()
            logger.info("MQTT 연결됨")
        except Exception as e:
            logger.error(f"MQTT 연결 실패: {e}")
    
    def init_modbus(self):
        """Modbus 클라이언트 초기화"""
        modbus_config = self.config.get('modbus', {})
        if not modbus_config:
            return
            
        try:
            self.modbus_client = ModbusTcpClient(
                modbus_config.get('host', 'localhost'),
                modbus_config.get('port', 502)
            )
            self.modbus_client.connect()
            logger.info("Modbus 연결됨")
        except Exception as e:
            logger.error(f"Modbus 연결 실패: {e}")
    
    def init_serial(self):
        """시리얼 연결 초기화"""
        serial_config = self.config.get('serial', {})
        if not serial_config:
            return
            
        try:
            self.serial_conn = serial.Serial(
                port=serial_config.get('port', '/dev/ttyUSB0'),
                baudrate=serial_config.get('baudrate', 9600),
                timeout=serial_config.get('timeout', 1)
            )
            logger.info("시리얼 연결됨")
        except Exception as e:
            logger.error(f"시리얼 연결 실패: {e}")
    
    def on_mqtt_connect(self, client, userdata, flags, rc):
        """MQTT 연결 콜백"""
        if rc == 0:
            logger.info("MQTT 연결 성공")
            # 명령 토픽 구독
            command_topic = self.config.get('mqtt', {}).get('command_topic', 'device/command')
            client.subscribe(command_topic)
        else:
            logger.error(f"MQTT 연결 실패: {rc}")
    
    def on_mqtt_message(self, client, userdata, msg):
        """MQTT 메시지 수신 콜백"""
        try:
            command = json.loads(msg.payload.decode())
            logger.info(f"명령 수신: {command}")
            self.process_command(command)
        except Exception as e:
            logger.error(f"명령 처리 실패: {e}")
    
    def process_command(self, command):
        """명령 처리"""
        command_type = command.get('type')
        params = command.get('params', {})
        
        if command_type == 'modbus_write':
            self.write_modbus_register(
                params.get('address', 0),
                params.get('value', 0),
                params.get('unit_id', 1)
            )
        elif command_type == 'serial_write':
            self.write_serial(params.get('data', ''))
    
    def read_modbus_registers(self):
        """Modbus 레지스터 읽기"""
        if not self.modbus_client:
            return {}
            
        sensors = self.config.get('sensors', {})
        data = {}
        
        for sensor_name, sensor_config in sensors.items():
            if sensor_config.get('type') == 'modbus':
                try:
                    address = sensor_config.get('address', 0)
                    count = sensor_config.get('count', 1)
                    unit_id = sensor_config.get('unit_id', 1)
                    
                    result = self.modbus_client.read_holding_registers(
                        address, count, unit=unit_id
                    )
                    
                    if result.isError():
                        logger.error(f"Modbus 읽기 실패: {sensor_name}")
                        continue
                    
                    value = result.registers[0]
                    scale = sensor_config.get('scale', 1.0)
                    offset = sensor_config.get('offset', 0.0)
                    
                    data[sensor_name] = (value * scale) + offset
                    
                except Exception as e:
                    logger.error(f"센서 읽기 실패 {sensor_name}: {e}")
        
        return data
    
    def read_serial_data(self):
        """시리얼 데이터 읽기"""
        if not self.serial_conn:
            return {}
            
        data = {}
        
        try:
            if self.serial_conn.in_waiting > 0:
                line = self.serial_conn.readline().decode().strip()
                if line:
                    # 시리얼 데이터 파싱 (예: "TEMP:25.5,HUM:60.2")
                    for pair in line.split(','):
                        if ':' in pair:
                            key, value = pair.split(':', 1)
                            data[key.lower()] = float(value)
        except Exception as e:
            logger.error(f"시리얼 읽기 실패: {e}")
        
        return data
    
    def write_modbus_register(self, address, value, unit_id):
        """Modbus 레지스터 쓰기"""
        if not self.modbus_client:
            return False
            
        try:
            result = self.modbus_client.write_register(address, value, unit=unit_id)
            return not result.isError()
        except Exception as e:
            logger.error(f"Modbus 쓰기 실패: {e}")
            return False
    
    def write_serial(self, data):
        """시리얼 데이터 쓰기"""
        if not self.serial_conn:
            return False
            
        try:
            self.serial_conn.write(data.encode())
            return True
        except Exception as e:
            logger.error(f"시리얼 쓰기 실패: {e}")
            return False
    
    def send_telemetry(self, data):
        """텔레메트리 전송"""
        telemetry = {
            'device_id': self.device_id,
            'ts': datetime.now().isoformat(),
            'metrics': data,
            'status': 'ok'
        }
        
        # MQTT 전송
        if self.mqtt_client:
            topic = self.config.get('mqtt', {}).get('telemetry_topic', 'device/telemetry')
            payload = json.dumps(telemetry)
            self.mqtt_client.publish(topic, payload)
            logger.info(f"MQTT 텔레메트리 전송: {payload}")
        
        # HTTP 전송
        http_config = self.config.get('http', {})
        if http_config:
            try:
                url = http_config.get('url', 'http://localhost:3000/api/telemetry')
                response = requests.post(url, json=telemetry, timeout=5)
                if response.status_code == 200:
                    logger.info("HTTP 텔레메트리 전송 성공")
                else:
                    logger.error(f"HTTP 텔레메트리 전송 실패: {response.status_code}")
            except Exception as e:
                logger.error(f"HTTP 전송 실패: {e}")
    
    def run(self):
        """메인 루프"""
        logger.info("게이트웨이 시작")
        
        # 연결 초기화
        self.init_mqtt()
        self.init_modbus()
        self.init_serial()
        
        interval = self.config.get('poll_interval', 30)
        
        while True:
            try:
                # 센서 데이터 수집
                data = {}
                data.update(self.read_modbus_registers())
                data.update(self.read_serial_data())
                
                if data:
                    self.send_telemetry(data)
                
                time.sleep(interval)
                
            except KeyboardInterrupt:
                logger.info("게이트웨이 종료")
                break
            except Exception as e:
                logger.error(f"메인 루프 오류: {e}")
                time.sleep(5)

if __name__ == '__main__':
    gateway = Gateway()
    gateway.run()
