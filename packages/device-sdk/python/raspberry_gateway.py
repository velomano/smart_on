#!/usr/bin/env python3
"""
라즈베리파이 게이트웨이
ESP32와 Universal Bridge 사이의 중계 역할
"""

import serial
import requests
import json
import time
import threading
from datetime import datetime

class RaspberryGateway:
    def __init__(self):
        # Universal Bridge 설정
        self.bridge_url = "http://192.168.1.100:3001"
        self.device_id = "raspberry-gateway-001"
        self.device_key = "DK_your_device_key"
        
        # 시리얼 통신 설정 (ESP32와 연결)
        self.serial_port = "/dev/ttyUSB0"  # 또는 "/dev/ttyACM0"
        self.baud_rate = 115200
        self.ser = None
        
        # 연결된 ESP32 디바이스들
        self.connected_devices = {}
        
    def start(self):
        """게이트웨이 시작"""
        print("🌉 라즈베리파이 게이트웨이 시작")
        
        # 시리얼 연결
        self.connect_serial()
        
        # ESP32 데이터 수신 스레드
        self.receive_thread = threading.Thread(target=self.receive_from_esp32)
        self.receive_thread.daemon = True
        self.receive_thread.start()
        
        # Universal Bridge 명령 수신 스레드
        self.command_thread = threading.Thread(target=self.receive_commands)
        self.command_thread.daemon = True
        self.command_thread.start()
        
        print("✅ 게이트웨이 실행 중...")
        
        # 메인 루프
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 게이트웨이 종료")
            self.stop()
    
    def connect_serial(self):
        """ESP32와 시리얼 연결"""
        try:
            self.ser = serial.Serial(self.serial_port, self.baud_rate, timeout=1)
            print(f"✅ ESP32 연결: {self.serial_port}")
        except Exception as e:
            print(f"❌ 시리얼 연결 실패: {e}")
    
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
        """ESP32 데이터 처리 및 Universal Bridge로 전송"""
        try:
            # ESP32 데이터 파싱 (JSON 형식)
            esp32_data = json.loads(data)
            
            # 디바이스 ID 추가
            esp32_data["device_id"] = esp32_data.get("device_id", "esp32-001")
            esp32_data["timestamp"] = datetime.now().isoformat()
            
            # Universal Bridge로 전송
            self.send_to_bridge(esp32_data)
            
        except json.JSONDecodeError:
            print(f"❌ JSON 파싱 오류: {data}")
        except Exception as e:
            print(f"❌ 데이터 처리 오류: {e}")
    
    def send_to_bridge(self, data):
        """Universal Bridge로 데이터 전송"""
        try:
            url = f"{self.bridge_url}/api/bridge/telemetry"
            headers = {
                "Content-Type": "application/json",
                "x-device-id": self.device_id,
                "x-tenant-id": "00000000-0000-0000-0000-000000000001"
            }
            
            response = requests.post(url, json=data, headers=headers)
            if response.status_code == 200:
                print(f"✅ 데이터 전송 성공: {data.get('device_id', 'unknown')}")
            else:
                print(f"❌ 데이터 전송 실패: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Bridge 전송 오류: {e}")
    
    def receive_commands(self):
        """Universal Bridge에서 명령 수신"""
        while True:
            try:
                url = f"{self.bridge_url}/api/bridge/commands/{self.device_id}"
                headers = {
                    "x-device-id": self.device_id,
                    "x-tenant-id": "00000000-0000-0000-0000-000000000001"
                }
                
                response = requests.get(url, headers=headers)
                if response.status_code == 200:
                    commands = response.json().get("commands", [])
                    for cmd in commands:
                        self.process_command(cmd)
                        
            except Exception as e:
                print(f"❌ 명령 수신 오류: {e}")
            
            time.sleep(30)  # 30초마다 명령 확인
    
    def process_command(self, cmd):
        """명령 처리 및 ESP32로 전송"""
        try:
            # 명령을 ESP32로 전송
            command_data = {
                "type": cmd["type"],
                "action": cmd["action"],
                "params": cmd["params"]
            }
            
            if self.ser:
                self.ser.write(json.dumps(command_data).encode('utf-8'))
                self.ser.write(b'\n')
                print(f"📤 명령 전송: {command_data}")
                
        except Exception as e:
            print(f"❌ 명령 처리 오류: {e}")
    
    def stop(self):
        """게이트웨이 종료"""
        if self.ser:
            self.ser.close()

if __name__ == "__main__":
    gateway = RaspberryGateway()
    gateway.start()
