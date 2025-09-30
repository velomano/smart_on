#!/usr/bin/env python3
"""
라즈베리파이5 MQTT 디바이스 템플릿
스마트팜 플랫폼과 연동하기 위한 라즈베리파이5 기반 IoT 디바이스 템플릿

주요 기능:
- GPIO 센서/액추에이터 제어
- MQTT 통신
- 실시간 센서 데이터 전송
- 원격 제어 명령 수신
- 자동 재연결
- 로깅 시스템
"""

import json
import time
import logging
import threading
from datetime import datetime
from typing import Dict, Any, Optional

import paho.mqtt.client as mqtt
import RPi.GPIO as GPIO
import board
import busio
import adafruit_dht
from adafruit_seesaw.seesaw import Seesaw

# ==================== 설정 ====================
class Config:
    # MQTT 브로커 설정
    MQTT_BROKER_HOST = "your-mqtt-broker.com"  # 실제 MQTT 브로커 주소로 변경
    MQTT_BROKER_PORT = 1883
    MQTT_USERNAME = "your_username"            # 실제 사용자명으로 변경
    MQTT_PASSWORD = "your_password"            # 실제 비밀번호로 변경
    MQTT_USE_TLS = False                       # TLS 사용 여부
    
    # 디바이스 정보
    FARM_ID = "your_farm_id"                   # 실제 농장 ID로 변경
    DEVICE_ID = "raspberry_pi_001"             # 디바이스 고유 ID
    
    # 센서 설정
    DHT_PIN = board.D4                         # DHT22 온습도 센서 핀
    SOIL_SENSOR_ADDR = 0x36                    # 토양 센서 I2C 주소
    
    # 액추에이터 핀 설정
    PUMP_PIN = 18                              # 펌프 제어 핀
    LED_PIN = 19                               # LED 제어 핀
    FAN_PIN = 20                               # 팬 제어 핀
    
    # 데이터 전송 간격 (초)
    TELEMETRY_INTERVAL = 30
    HEARTBEAT_INTERVAL = 60
    
    # 재연결 설정
    RECONNECT_DELAY = 5
    MAX_RECONNECT_ATTEMPTS = 10

# ==================== 로깅 설정 ====================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/smartfarm_device.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ==================== 하드웨어 초기화 ====================
class HardwareManager:
    def __init__(self):
        self.dht_sensor = None
        self.soil_sensor = None
        self.i2c = None
        
        try:
            # GPIO 설정
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            
            # 출력 핀 설정
            GPIO.setup(Config.PUMP_PIN, GPIO.OUT)
            GPIO.setup(Config.LED_PIN, GPIO.OUT)
            GPIO.setup(Config.FAN_PIN, GPIO.OUT)
            
            # 초기 상태: 모든 액추에이터 OFF
            GPIO.output(Config.PUMP_PIN, GPIO.LOW)
            GPIO.output(Config.LED_PIN, GPIO.LOW)
            GPIO.output(Config.FAN_PIN, GPIO.LOW)
            
            # I2C 초기화
            self.i2c = busio.I2C(board.SCL, board.SDA)
            
            # DHT22 온습도 센서 초기화
            self.dht_sensor = adafruit_dht.DHT22(Config.DHT_PIN)
            
            # 토양 센서 초기화
            self.soil_sensor = Seesaw(self.i2c, addr=Config.SOIL_SENSOR_ADDR)
            
            logger.info("하드웨어 초기화 완료")
            
        except Exception as e:
            logger.error(f"하드웨어 초기화 실패: {e}")
            raise
    
    def read_temperature_humidity(self) -> Dict[str, Any]:
        """온습도 센서 데이터 읽기"""
        try:
            temperature = self.dht_sensor.temperature
            humidity = self.dht_sensor.humidity
            
            return {
                "sensor_type": "temperature_humidity",
                "temperature": round(temperature, 2) if temperature else None,
                "humidity": round(humidity, 2) if humidity else None,
                "unit": {"temperature": "celsius", "humidity": "percent"},
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        except Exception as e:
            logger.error(f"온습도 센서 읽기 실패: {e}")
            return None
    
    def read_soil_moisture(self) -> Dict[str, Any]:
        """토양 수분 센서 데이터 읽기"""
        try:
            moisture = self.soil_sensor.moisture_read()
            temperature = self.soil_sensor.get_temp()
            
            return {
                "sensor_type": "soil_moisture",
                "moisture": moisture,
                "temperature": round(temperature, 2),
                "unit": {"moisture": "raw", "temperature": "celsius"},
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        except Exception as e:
            logger.error(f"토양 센서 읽기 실패: {e}")
            return None
    
    def control_pump(self, state: bool) -> bool:
        """펌프 제어"""
        try:
            GPIO.output(Config.PUMP_PIN, GPIO.HIGH if state else GPIO.LOW)
            logger.info(f"펌프 {'ON' if state else 'OFF'}")
            return True
        except Exception as e:
            logger.error(f"펌프 제어 실패: {e}")
            return False
    
    def control_led(self, state: bool) -> bool:
        """LED 제어"""
        try:
            GPIO.output(Config.LED_PIN, GPIO.HIGH if state else GPIO.LOW)
            logger.info(f"LED {'ON' if state else 'OFF'}")
            return True
        except Exception as e:
            logger.error(f"LED 제어 실패: {e}")
            return False
    
    def control_fan(self, state: bool) -> bool:
        """팬 제어"""
        try:
            GPIO.output(Config.FAN_PIN, GPIO.HIGH if state else GPIO.LOW)
            logger.info(f"팬 {'ON' if state else 'OFF'}")
            return True
        except Exception as e:
            logger.error(f"팬 제어 실패: {e}")
            return False
    
    def cleanup(self):
        """GPIO 정리"""
        try:
            GPIO.cleanup()
            logger.info("GPIO 정리 완료")
        except Exception as e:
            logger.error(f"GPIO 정리 실패: {e}")

# ==================== MQTT 클라이언트 ====================
class MQTTDevice:
    def __init__(self):
        self.client = mqtt.Client()
        self.hardware = HardwareManager()
        self.connected = False
        self.reconnect_count = 0
        
        # MQTT 콜백 설정
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        self.client.on_publish = self.on_publish
        
        # 인증 설정
        if Config.MQTT_USERNAME and Config.MQTT_PASSWORD:
            self.client.username_pw_set(Config.MQTT_USERNAME, Config.MQTT_PASSWORD)
        
        # TLS 설정
        if Config.MQTT_USE_TLS:
            self.client.tls_set()
    
    def on_connect(self, client, userdata, flags, rc):
        """MQTT 연결 콜백"""
        if rc == 0:
            self.connected = True
            self.reconnect_count = 0
            logger.info("MQTT 브로커 연결 성공")
            
            # 토픽 구독
            self.subscribe_topics()
            
            # 디바이스 등록
            self.register_device()
            
        else:
            logger.error(f"MQTT 연결 실패: {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """MQTT 연결 끊김 콜백"""
        self.connected = False
        logger.warning(f"MQTT 연결 끊김: {rc}")
    
    def on_message(self, client, userdata, msg):
        """메시지 수신 콜백"""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            
            logger.info(f"메시지 수신: {topic}")
            logger.debug(f"페이로드: {payload}")
            
            # 명령 처리
            if "/command" in topic:
                self.handle_command(payload)
            elif "/config" in topic:
                self.handle_config(payload)
                
        except Exception as e:
            logger.error(f"메시지 처리 실패: {e}")
    
    def on_publish(self, client, userdata, mid):
        """메시지 발행 콜백"""
        logger.debug(f"메시지 발행 완료: {mid}")
    
    def subscribe_topics(self):
        """토픽 구독"""
        topics = [
            f"farms/{Config.FARM_ID}/devices/{Config.DEVICE_ID}/command",
            f"farms/{Config.FARM_ID}/devices/{Config.DEVICE_ID}/config"
        ]
        
        for topic in topics:
            self.client.subscribe(topic)
            logger.info(f"토픽 구독: {topic}")
    
    def register_device(self):
        """디바이스 등록"""
        registry_data = {
            "device_id": Config.DEVICE_ID,
            "device_type": "raspberry_pi_5",
            "firmware_version": "1.0.0",
            "capabilities": [
                "temperature_sensor",
                "humidity_sensor", 
                "soil_moisture_sensor",
                "pump_control",
                "led_control",
                "fan_control"
            ],
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        topic = f"farms/{Config.FARM_ID}/devices/{Config.DEVICE_ID}/registry"
        self.publish_message(topic, registry_data)
    
    def handle_command(self, command: Dict[str, Any]):
        """명령 처리"""
        try:
            action = command.get("action")
            parameters = command.get("parameters", {})
            command_id = command.get("command_id", "unknown")
            
            success = False
            
            if action == "pump_on":
                success = self.hardware.control_pump(True)
            elif action == "pump_off":
                success = self.hardware.control_pump(False)
            elif action == "led_on":
                success = self.hardware.control_led(True)
            elif action == "led_off":
                success = self.hardware.control_led(False)
            elif action == "fan_on":
                success = self.hardware.control_fan(True)
            elif action == "fan_off":
                success = self.hardware.control_fan(False)
            else:
                logger.warning(f"알 수 없는 명령: {action}")
            
            # 명령 확인 응답
            self.send_command_ack(command_id, success)
            
        except Exception as e:
            logger.error(f"명령 처리 실패: {e}")
            self.send_command_ack(command.get("command_id", "unknown"), False)
    
    def handle_config(self, config: Dict[str, Any]):
        """설정 변경 처리"""
        try:
            logger.info(f"설정 변경: {config}")
            # 설정 변경 로직 구현
        except Exception as e:
            logger.error(f"설정 처리 실패: {e}")
    
    def send_command_ack(self, command_id: str, success: bool):
        """명령 확인 응답 전송"""
        ack_data = {
            "command_id": command_id,
            "success": success,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        topic = f"farms/{Config.FARM_ID}/devices/{Config.DEVICE_ID}/command/ack"
        self.publish_message(topic, ack_data)
    
    def publish_message(self, topic: str, data: Dict[str, Any]):
        """메시지 발행"""
        try:
            payload = json.dumps(data)
            result = self.client.publish(topic, payload, qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.debug(f"메시지 발행 성공: {topic}")
            else:
                logger.error(f"메시지 발행 실패: {topic}, {result.rc}")
                
        except Exception as e:
            logger.error(f"메시지 발행 오류: {e}")
    
    def send_telemetry(self):
        """센서 데이터 전송"""
        try:
            # 온습도 데이터
            temp_humidity = self.hardware.read_temperature_humidity()
            if temp_humidity:
                topic = f"farms/{Config.FARM_ID}/devices/{Config.DEVICE_ID}/telemetry"
                self.publish_message(topic, temp_humidity)
            
            # 토양 수분 데이터
            soil_data = self.hardware.read_soil_moisture()
            if soil_data:
                topic = f"farms/{Config.FARM_ID}/devices/{Config.DEVICE_ID}/telemetry"
                self.publish_message(topic, soil_data)
                
        except Exception as e:
            logger.error(f"텔레메트리 전송 실패: {e}")
    
    def send_heartbeat(self):
        """하트비트 전송"""
        try:
            heartbeat_data = {
                "device_id": Config.DEVICE_ID,
                "status": "online",
                "uptime": time.time() - self.start_time,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
            topic = f"farms/{Config.FARM_ID}/devices/{Config.DEVICE_ID}/state"
            self.publish_message(topic, heartbeat_data)
            
        except Exception as e:
            logger.error(f"하트비트 전송 실패: {e}")
    
    def connect(self):
        """MQTT 브로커 연결"""
        try:
            logger.info(f"MQTT 브로커 연결 시도: {Config.MQTT_BROKER_HOST}:{Config.MQTT_BROKER_PORT}")
            self.client.connect(Config.MQTT_BROKER_HOST, Config.MQTT_BROKER_PORT, 60)
            self.start_time = time.time()
            return True
        except Exception as e:
            logger.error(f"MQTT 연결 실패: {e}")
            return False
    
    def start(self):
        """디바이스 시작"""
        try:
            # MQTT 연결
            if not self.connect():
                return False
            
            # 메인 루프 시작
            self.client.loop_start()
            
            # 데이터 전송 스레드 시작
            telemetry_thread = threading.Thread(target=self.telemetry_loop, daemon=True)
            heartbeat_thread = threading.Thread(target=self.heartbeat_loop, daemon=True)
            
            telemetry_thread.start()
            heartbeat_thread.start()
            
            logger.info("라즈베리파이5 디바이스 시작 완료")
            return True
            
        except Exception as e:
            logger.error(f"디바이스 시작 실패: {e}")
            return False
    
    def telemetry_loop(self):
        """텔레메트리 전송 루프"""
        while True:
            try:
                if self.connected:
                    self.send_telemetry()
                time.sleep(Config.TELEMETRY_INTERVAL)
            except Exception as e:
                logger.error(f"텔레메트리 루프 오류: {e}")
                time.sleep(5)
    
    def heartbeat_loop(self):
        """하트비트 전송 루프"""
        while True:
            try:
                if self.connected:
                    self.send_heartbeat()
                time.sleep(Config.HEARTBEAT_INTERVAL)
            except Exception as e:
                logger.error(f"하트비트 루프 오류: {e}")
                time.sleep(10)
    
    def stop(self):
        """디바이스 중지"""
        try:
            logger.info("디바이스 중지 중...")
            self.client.loop_stop()
            self.client.disconnect()
            self.hardware.cleanup()
            logger.info("디바이스 중지 완료")
        except Exception as e:
            logger.error(f"디바이스 중지 오류: {e}")

# ==================== 메인 실행 ====================
def main():
    """메인 함수"""
    device = None
    
    try:
        logger.info("라즈베리파이5 스마트팜 디바이스 시작")
        
        # 디바이스 생성 및 시작
        device = MQTTDevice()
        if not device.start():
            logger.error("디바이스 시작 실패")
            return
        
        # 메인 루프
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("사용자에 의한 중단")
    except Exception as e:
        logger.error(f"예상치 못한 오류: {e}")
    finally:
        if device:
            device.stop()

if __name__ == "__main__":
    main()
