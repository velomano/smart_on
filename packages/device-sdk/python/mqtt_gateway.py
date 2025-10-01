#!/usr/bin/env python3
"""
MQTT 게이트웨이
라즈베리파이에서 ESP32 데이터를 MQTT로 전송
Universal Bridge의 MQTT 브로커와 연결
"""

import paho.mqtt.client as mqtt
import serial
import json
import time
import threading
from datetime import datetime

class MQTTGateway:
    def __init__(self):
        # MQTT 설정 (Universal Bridge의 MQTT 브로커)
        self.mqtt_broker = "192.168.1.100"  # Universal Bridge 주소
        self.mqtt_port = 1883
        self.mqtt_username = "your_username"
        self.mqtt_password = "your_password"
        
        # 시리얼 설정 (ESP32와 연결)
        self.serial_port = "/dev/ttyUSB0"
        self.baud_rate = 115200
        self.ser = None
        
        # MQTT 클라이언트
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.username_pw_set(self.mqtt_username, self.mqtt_password)
        
        # MQTT 콜백 설정
        self.mqtt_client.on_connect = self.on_mqtt_connect
        self.mqtt_client.on_message = self.on_mqtt_message
        
        # 토픽 설정
        self.base_topic = "farm/001"
        self.telemetry_topic = f"{self.base_topic}/telemetry"
        self.command_topic = f"{self.base_topic}/commands"
        
    def start(self):
        """MQTT 게이트웨이 시작"""
        print("🌉 MQTT 게이트웨이 시작")
        
        # 시리얼 연결
        self.connect_serial()
        
        # MQTT 연결
        self.connect_mqtt()
        
        # ESP32 데이터 수신 스레드
        self.receive_thread = threading.Thread(target=self.receive_from_esp32)
        self.receive_thread.daemon = True
        self.receive_thread.start()
        
        print("✅ MQTT 게이트웨이 실행 중...")
        
        # 메인 루프
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 MQTT 게이트웨이 종료")
            self.stop()
    
    def connect_serial(self):
        """ESP32와 시리얼 연결"""
        try:
            self.ser = serial.Serial(self.serial_port, self.baud_rate, timeout=1)
            print(f"✅ ESP32 연결: {self.serial_port}")
        except Exception as e:
            print(f"❌ 시리얼 연결 실패: {e}")
    
    def connect_mqtt(self):
        """MQTT 브로커 연결"""
        try:
            self.mqtt_client.connect(self.mqtt_broker, self.mqtt_port, 60)
            self.mqtt_client.loop_start()
            print(f"✅ MQTT 브로커 연결: {self.mqtt_broker}")
        except Exception as e:
            print(f"❌ MQTT 연결 실패: {e}")
    
    def on_mqtt_connect(self, client, userdata, flags, rc):
        """MQTT 연결 콜백"""
        if rc == 0:
            print("✅ MQTT 연결 성공")
            # 명령 토픽 구독
            client.subscribe(self.command_topic)
            print(f"📡 명령 토픽 구독: {self.command_topic}")
        else:
            print(f"❌ MQTT 연결 실패: {rc}")
    
    def on_mqtt_message(self, client, userdata, msg):
        """MQTT 메시지 수신 콜백"""
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8')
            
            if topic == self.command_topic:
                self.process_command(payload)
                
        except Exception as e:
            print(f"❌ MQTT 메시지 처리 오류: {e}")
    
    def receive_from_esp32(self):
        """ESP32에서 데이터 수신"""
        while True:
            try:
                if self.ser and self.ser.in_waiting > 0:
                    line = self.ser.readline().decode('utf-8').strip()
                    if line:
                        self.process_esp32_data(line)
            except Exception as e:
                print(f"❌ ESP32 데이터 수신 오류: {e}")
            time.sleep(0.1)
    
    def process_esp32_data(self, data):
        """ESP32 데이터 처리 및 MQTT로 전송"""
        try:
            # ESP32 데이터 파싱
            esp32_data = json.loads(data)
            
            # 디바이스 ID 추가
            device_id = esp32_data.get("device_id", "esp32-001")
            esp32_data["device_id"] = device_id
            esp32_data["timestamp"] = datetime.now().isoformat()
            
            # MQTT로 전송
            self.send_to_mqtt(esp32_data)
            
        except json.JSONDecodeError:
            print(f"❌ JSON 파싱 오류: {data}")
        except Exception as e:
            print(f"❌ 데이터 처리 오류: {e}")
    
    def send_to_mqtt(self, data):
        """MQTT로 데이터 전송"""
        try:
            device_id = data["device_id"]
            topic = f"{self.telemetry_topic}/{device_id}"
            
            payload = json.dumps(data)
            self.mqtt_client.publish(topic, payload, qos=1)
            
            print(f"📤 MQTT 전송: {topic} - {data.get('temp', 'N/A')}°C")
            
        except Exception as e:
            print(f"❌ MQTT 전송 오류: {e}")
    
    def process_command(self, payload):
        """명령 처리 및 ESP32로 전송"""
        try:
            command = json.loads(payload)
            
            # 명령을 ESP32로 전송
            if self.ser:
                self.ser.write(payload.encode('utf-8'))
                self.ser.write(b'\n')
                print(f"📤 명령 전송: {command}")
                
        except Exception as e:
            print(f"❌ 명령 처리 오류: {e}")
    
    def stop(self):
        """게이트웨이 종료"""
        if self.ser:
            self.ser.close()
        self.mqtt_client.loop_stop()
        self.mqtt_client.disconnect()

if __name__ == "__main__":
    gateway = MQTTGateway()
    gateway.start()
