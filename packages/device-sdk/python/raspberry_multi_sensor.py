#!/usr/bin/env python3
"""
라즈베리파이 다중 센서 클라이언트
DHT22 + 릴레이 + 카메라 + 기타 센서들
"""

import requests
import json
import time
import threading
from datetime import datetime
import RPi.GPIO as GPIO
import Adafruit_DHT

class RaspberryMultiSensor:
    def __init__(self):
        # Universal Bridge 설정
        self.bridge_url = "http://192.168.1.100:3001"
        self.device_id = "raspberry-multi-001"
        self.device_key = "DK_your_device_key"
        
        # 센서 설정
        self.dht_sensor = Adafruit_DHT.DHT22
        self.dht_pin = 4
        
        # GPIO 설정
        GPIO.setmode(GPIO.BCM)
        self.relay_pins = [5, 6, 7, 8]  # 4개 릴레이
        for pin in self.relay_pins:
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, GPIO.LOW)
        
        # 카메라 설정
        self.camera_enabled = True
        
        # 전송 주기
        self.send_interval = 30  # 30초
        
    def start(self):
        """센서 클라이언트 시작"""
        print("🌉 라즈베리파이 다중 센서 클라이언트 시작")
        
        # 센서 데이터 전송 스레드
        self.sensor_thread = threading.Thread(target=self.send_sensor_data)
        self.sensor_thread.daemon = True
        self.sensor_thread.start()
        
        # 명령 수신 스레드
        self.command_thread = threading.Thread(target=self.receive_commands)
        self.command_thread.daemon = True
        self.command_thread.start()
        
        print("✅ 센서 클라이언트 실행 중...")
        
        # 메인 루프
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 센서 클라이언트 종료")
            self.stop()
    
    def send_sensor_data(self):
        """센서 데이터 전송"""
        while True:
            try:
                # 모든 센서 데이터 수집
                sensor_data = self.collect_all_sensors()
                
                # Universal Bridge로 전송
                self.send_to_bridge(sensor_data)
                
            except Exception as e:
                print(f"❌ 센서 데이터 전송 오류: {e}")
            
            time.sleep(self.send_interval)
    
    def collect_all_sensors(self):
        """모든 센서 데이터 수집"""
        data = {
            "device_id": self.device_id,
            "timestamp": datetime.now().isoformat()
        }
        
        # DHT22 온습도 센서
        humidity, temperature = Adafruit_DHT.read_retry(self.dht_sensor, self.dht_pin)
        if humidity is not None and temperature is not None:
            data["temp"] = round(temperature, 1)
            data["hum"] = round(humidity, 1)
        else:
            data["temp"] = None
            data["hum"] = None
        
        # 릴레이 상태
        for i, pin in enumerate(self.relay_pins):
            data[f"relay_{i+1}_state"] = GPIO.input(pin)
        
        # 시스템 정보
        data["cpu_temp"] = self.get_cpu_temperature()
        data["memory_usage"] = self.get_memory_usage()
        
        # 카메라 정보 (이미지 촬영은 별도 처리)
        if self.camera_enabled:
            data["camera_available"] = True
            data["image_count"] = self.get_image_count()
        
        return data
    
    def get_cpu_temperature(self):
        """CPU 온도 읽기"""
        try:
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                temp = int(f.read()) / 1000.0
                return round(temp, 1)
        except:
            return None
    
    def get_memory_usage(self):
        """메모리 사용률 읽기"""
        try:
            with open('/proc/meminfo', 'r') as f:
                meminfo = f.read()
                for line in meminfo.split('\n'):
                    if 'MemAvailable:' in line:
                        available = int(line.split()[1])
                    elif 'MemTotal:' in line:
                        total = int(line.split()[1])
                usage = ((total - available) / total) * 100
                return round(usage, 1)
        except:
            return None
    
    def get_image_count(self):
        """저장된 이미지 개수"""
        try:
            import os
            image_dir = "/home/pi/images"
            if os.path.exists(image_dir):
                return len([f for f in os.listdir(image_dir) if f.endswith('.jpg')])
            return 0
        except:
            return 0
    
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
                print(f"✅ 센서 데이터 전송 성공: {data['temp']}°C, {data['hum']}%")
            else:
                print(f"❌ 센서 데이터 전송 실패: {response.status_code}")
                
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
        """명령 처리"""
        try:
            cmd_type = cmd["type"]
            action = cmd["action"]
            params = cmd["params"]
            
            if cmd_type == "relay_control":
                relay_num = params["relay"]
                state = params["state"]
                
                if 1 <= relay_num <= len(self.relay_pins):
                    pin = self.relay_pins[relay_num - 1]
                    GPIO.output(pin, GPIO.HIGH if state == "on" else GPIO.LOW)
                    print(f"🔌 릴레이 {relay_num} {'ON' if state == 'on' else 'OFF'}")
            
            elif cmd_type == "camera_control":
                if action == "capture":
                    self.capture_image()
                elif action == "enable":
                    self.camera_enabled = True
                elif action == "disable":
                    self.camera_enabled = False
            
            elif cmd_type == "system_control":
                if action == "reboot":
                    self.reboot_system()
                elif action == "shutdown":
                    self.shutdown_system()
                    
        except Exception as e:
            print(f"❌ 명령 처리 오류: {e}")
    
    def capture_image(self):
        """이미지 촬영"""
        try:
            import subprocess
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"/home/pi/images/capture_{timestamp}.jpg"
            
            subprocess.run([
                "raspistill", 
                "-o", filename,
                "-w", "640", 
                "-h", "480",
                "-q", "80"
            ], check=True)
            
            print(f"📸 이미지 촬영 완료: {filename}")
            
        except Exception as e:
            print(f"❌ 이미지 촬영 오류: {e}")
    
    def reboot_system(self):
        """시스템 재부팅"""
        print("🔄 시스템 재부팅...")
        import subprocess
        subprocess.run(["sudo", "reboot"])
    
    def shutdown_system(self):
        """시스템 종료"""
        print("🛑 시스템 종료...")
        import subprocess
        subprocess.run(["sudo", "shutdown", "-h", "now"])
    
    def stop(self):
        """클라이언트 종료"""
        GPIO.cleanup()

if __name__ == "__main__":
    client = RaspberryMultiSensor()
    client.start()
