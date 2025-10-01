#!/usr/bin/env python3
"""
SmartFarm Universal Bridge - Python HTTP Client

복사-붙여넣기만 하면 바로 작동!

필요한 패키지:
    pip install requests

선택적 패키지:
    pip install Adafruit-DHT  # DHT22 센서용
"""

import requests
import time
import json
from datetime import datetime, timezone

# ========== 여기만 수정하세요! ==========

# 서버 설정 (웹 마법사에서 복사)
SERVER_URL = "http://192.168.1.100:3000"
DEVICE_ID = "pi-001"
DEVICE_KEY = "DK_your_device_key"

# 전송 주기 (초)
SEND_INTERVAL = 30

# ========== 이하 수정 불필요 ==========

class SmartFarmClient:
    def __init__(self, server_url, device_id, device_key):
        self.server_url = server_url
        self.device_id = device_id
        self.device_key = device_key
        self.session = requests.Session()
        
    def send_telemetry(self, readings):
        """센서 데이터 전송"""
        try:
            url = f"{self.server_url}/api/bridge/telemetry"
            headers = {
                "Content-Type": "application/json",
                "x-device-id": self.device_id,
                "x-device-key": self.device_key,
            }
            
            payload = {
                "device_id": self.device_id,
                "readings": readings,
                "schema_version": "telemetry.v1",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            
            response = self.session.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            print(f"✅ 전송 성공: {result.get('message', 'OK')}")
            return True
            
        except requests.exceptions.RequestException as e:
            print(f"❌ 전송 실패: {e}")
            return False
    
    def read_sensors(self):
        """센서 값 읽기 (예시)"""
        readings = []
        
        # DHT22 센서 (옵션)
        try:
            import Adafruit_DHT
            sensor = Adafruit_DHT.DHT22
            pin = 4
            
            humidity, temperature = Adafruit_DHT.read_retry(sensor, pin)
            
            if temperature is not None:
                readings.append({
                    "key": "temperature",
                    "value": round(temperature, 1),
                    "unit": "celsius",
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
                print(f"   🌡️  온도: {temperature:.1f} °C")
            
            if humidity is not None:
                readings.append({
                    "key": "humidity",
                    "value": round(humidity, 1),
                    "unit": "percent",
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
                print(f"   💧 습도: {humidity:.1f} %")
                
        except ImportError:
            # DHT22 라이브러리 없으면 더미 데이터
            print("   ℹ️  DHT22 라이브러리 없음, 더미 데이터 사용")
            readings.append({
                "key": "temperature",
                "value": 25.0,
                "unit": "celsius",
                "ts": datetime.now(timezone.utc).isoformat(),
            })
            readings.append({
                "key": "humidity",
                "value": 65.0,
                "unit": "percent",
                "ts": datetime.now(timezone.utc).isoformat(),
            })
        
        return readings
    
    def run(self):
        """메인 루프"""
        print("🌉 SmartFarm Universal Bridge - Python Client")
        print("=" * 50)
        print(f"서버: {self.server_url}")
        print(f"디바이스 ID: {self.device_id}")
        print("=" * 50)
        print()
        
        while True:
            try:
                print(f"📊 [{datetime.now().strftime('%H:%M:%S')}] 센서 데이터 수집 중...")
                
                # 센서 읽기
                readings = self.read_sensors()
                
                if readings:
                    # 서버 전송
                    self.send_telemetry(readings)
                else:
                    print("⚠️  읽을 센서 데이터가 없습니다.")
                
                print(f"💤 {SEND_INTERVAL}초 대기 중...\n")
                time.sleep(SEND_INTERVAL)
                
            except KeyboardInterrupt:
                print("\n\n👋 프로그램 종료")
                break
            except Exception as e:
                print(f"❌ 오류 발생: {e}")
                time.sleep(5)  # 5초 후 재시도

if __name__ == "__main__":
    client = SmartFarmClient(SERVER_URL, DEVICE_ID, DEVICE_KEY)
    client.run()

