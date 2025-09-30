#!/usr/bin/env python3
"""
🚀 Python MQTT 디바이스 템플릿
스마트팜 플랫폼 연동용
"""

import json
import time
import random
import threading
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import paho.mqtt.client as mqtt
import ssl

class SmartFarmDevice:
    def __init__(self, config: Dict[str, Any]):
        """
        디바이스 초기화
        
        Args:
            config: 설정 딕셔너리
                - farm_id: 농장 ID
                - device_id: 디바이스 ID
                - broker_url: MQTT 브로커 URL
                - broker_port: MQTT 브로커 포트
                - username: MQTT 사용자명
                - password: MQTT 비밀번호
                - device_type: 디바이스 타입
                - firmware_version: 펌웨어 버전
        """
        self.config = config
        self.client = None
        self.connected = False
        self.batch_seq = 0
        self.pump_state = False
        
        # 센서 시뮬레이션 데이터
        self.sensor_data = {
            'temperature': 23.5,
            'humidity': 65.2,
            'ec': 1.8,
            'ph': 6.2,
            'water_level': 85.0
        }
        
        self.setup_mqtt()
    
    def setup_mqtt(self):
        """MQTT 클라이언트 설정"""
        client_id = f"device-{self.config['device_id']}-{int(time.time())}"
        
        self.client = mqtt.Client(client_id=client_id, clean_session=False)
        self.client.username_pw_set(
            self.config['username'], 
            self.config['password']
        )
        
        # TLS 설정 (포트 8883인 경우)
        if self.config['broker_port'] == 8883:
            self.client.tls_set(cert_reqs=ssl.CERT_NONE)  # 개발용
        
        # 콜백 함수 설정
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
    
    def on_connect(self, client, userdata, flags, rc):
        """MQTT 연결 콜백"""
        if rc == 0:
            print(f"✅ MQTT 연결 성공: {self.config['device_id']}")
            self.connected = True
            
            # 명령 토픽 구독
            command_topic = self.get_command_topic()
            client.subscribe(command_topic, qos=1)
            print(f"📡 명령 토픽 구독: {command_topic}")
            
            # 디바이스 등록
            self.send_registry()
            
        else:
            print(f"❌ MQTT 연결 실패: {rc}")
    
    def on_message(self, client, userdata, msg):
        """MQTT 메시지 수신 콜백"""
        try:
            payload = json.loads(msg.payload.decode('utf-8'))
            print(f"📨 메시지 수신 [{msg.topic}]: {payload}")
            
            command = payload.get('command')
            command_id = payload.get('command_id')
            command_payload = payload.get('payload', {})
            
            # 명령 처리
            if command == 'pump_on':
                self.handle_pump_on(command_id, command_payload)
            elif command == 'pump_off':
                self.handle_pump_off(command_id, command_payload)
            elif command == 'valve_open':
                self.handle_valve_open(command_id, command_payload)
            elif command == 'valve_close':
                self.handle_valve_close(command_id, command_payload)
            elif command == 'led_on':
                self.handle_led_on(command_id, command_payload)
            elif command == 'led_off':
                self.handle_led_off(command_id, command_payload)
            elif command == 'update_config':
                self.handle_config_update(command_id, command_payload)
            else:
                print(f"⚠️ 알 수 없는 명령: {command}")
                self.send_command_ack(command_id, 'error', f'Unknown command: {command}')
                
        except json.JSONDecodeError as e:
            print(f"❌ JSON 파싱 오류: {e}")
        except Exception as e:
            print(f"❌ 메시지 처리 오류: {e}")
    
    def on_disconnect(self, client, userdata, rc):
        """MQTT 연결 해제 콜백"""
        print(f"🔌 MQTT 연결 해제: {rc}")
        self.connected = False
    
    def connect(self):
        """MQTT 브로커 연결"""
        try:
            print(f"🔗 MQTT 브로커 연결 중: {self.config['broker_url']}:{self.config['broker_port']}")
            self.client.connect(
                self.config['broker_url'], 
                self.config['broker_port'], 
                60
            )
            self.client.loop_start()
        except Exception as e:
            print(f"❌ MQTT 연결 오류: {e}")
    
    def disconnect(self):
        """MQTT 브로커 연결 해제"""
        if self.connected:
            self.client.loop_stop()
            self.client.disconnect()
            print("🔌 MQTT 연결 해제됨")
    
    def get_registry_topic(self):
        """등록 토픽 반환"""
        return f"farms/{self.config['farm_id']}/devices/{self.config['device_id']}/registry"
    
    def get_state_topic(self):
        """상태 토픽 반환"""
        return f"farms/{self.config['farm_id']}/devices/{self.config['device_id']}/state"
    
    def get_telemetry_topic(self):
        """텔레메트리 토픽 반환"""
        return f"farms/{self.config['farm_id']}/devices/{self.config['device_id']}/telemetry"
    
    def get_command_topic(self):
        """명령 토픽 반환"""
        return f"farms/{self.config['farm_id']}/devices/{self.config['device_id']}/command"
    
    def get_ack_topic(self):
        """ACK 토픽 반환"""
        return f"farms/{self.config['farm_id']}/devices/{self.config['device_id']}/command/ack"
    
    def get_current_timestamp(self):
        """현재 시간 반환 (ISO 8601 형식)"""
        return datetime.now(timezone.utc).isoformat()
    
    def send_registry(self):
        """디바이스 등록 정보 전송"""
        registry_data = {
            "device_id": self.config['device_id'],
            "device_type": self.config['device_type'],
            "firmware_version": self.config['firmware_version'],
            "hardware_version": "v2.1",
            "capabilities": {
                "sensors": ["temperature", "humidity", "ec", "ph", "water_level"],
                "actuators": ["pump", "valve", "led"],
                "communication": ["wifi", "mqtt"]
            },
            "location": {
                "farm_id": self.config['farm_id'],
                "bed_id": "bed_a1",
                "tier": 1
            },
            "timestamp": self.get_current_timestamp()
        }
        
        self.publish_message(self.get_registry_topic(), registry_data)
        print("📋 디바이스 등록 전송")
    
    def send_state(self):
        """디바이스 상태 전송"""
        state_data = {
            "device_id": self.config['device_id'],
            "status": {
                "online": True,
                "battery_level": random.randint(80, 100),
                "signal_strength": random.randint(-70, -30),
                "uptime": int(time.time()),
                "last_restart": self.get_current_timestamp()
            },
            "sensors": {
                "temperature": {"connected": True, "calibrated": True},
                "humidity": {"connected": True, "calibrated": True},
                "ec": {"connected": True, "calibrated": False},
                "ph": {"connected": True, "calibrated": False},
                "water_level": {"connected": True, "calibrated": True}
            },
            "actuators": {
                "pump_1": {
                    "status": "on" if self.pump_state else "off",
                    "last_command": self.get_current_timestamp()
                },
                "valve_1": {
                    "status": "open",
                    "position": random.randint(0, 100)
                },
                "led_1": {
                    "status": "off",
                    "brightness": 0
                }
            },
            "timestamp": self.get_current_timestamp()
        }
        
        self.publish_message(self.get_state_topic(), state_data)
        print("📊 디바이스 상태 전송")
    
    def send_telemetry(self):
        """센서 데이터 전송"""
        # 센서 데이터 시뮬레이션 (실제로는 하드웨어에서 읽기)
        self.simulate_sensor_data()
        
        telemetry_data = {
            "device_id": self.config['device_id'],
            "batch_seq": self.batch_seq,
            "window_ms": 30000,
            "readings": [
                {
                    "key": "temperature",
                    "tier": 1,
                    "unit": "celsius",
                    "value": self.sensor_data['temperature'],
                    "ts": self.get_current_timestamp(),
                    "quality": "good"
                },
                {
                    "key": "humidity",
                    "tier": 1,
                    "unit": "percent",
                    "value": self.sensor_data['humidity'],
                    "ts": self.get_current_timestamp(),
                    "quality": "good"
                },
                {
                    "key": "ec",
                    "tier": 1,
                    "unit": "ms_cm",
                    "value": self.sensor_data['ec'],
                    "ts": self.get_current_timestamp(),
                    "quality": "good"
                },
                {
                    "key": "ph",
                    "tier": 1,
                    "unit": "ph",
                    "value": self.sensor_data['ph'],
                    "ts": self.get_current_timestamp(),
                    "quality": "good"
                },
                {
                    "key": "water_level",
                    "tier": 1,
                    "unit": "percent",
                    "value": self.sensor_data['water_level'],
                    "ts": self.get_current_timestamp(),
                    "quality": "good"
                }
            ],
            "timestamp": self.get_current_timestamp()
        }
        
        self.batch_seq += 1
        self.publish_message(self.get_telemetry_topic(), telemetry_data)
        print(f"📡 센서 데이터 전송: {len(telemetry_data['readings'])}개 읽기값")
    
    def send_command_ack(self, command_id: str, status: str, detail: str):
        """명령 확인 응답 전송"""
        ack_data = {
            "command_id": command_id,
            "status": status,
            "detail": detail,
            "state": {
                "pump_1": {
                    "status": "on" if self.pump_state else "off",
                    "flow_rate": 2.5 if self.pump_state else 0.0
                },
                "valve_1": {
                    "status": "open",
                    "position": 75
                }
            },
            "timestamp": self.get_current_timestamp()
        }
        
        self.publish_message(self.get_ack_topic(), ack_data)
        print(f"✅ 명령 ACK 전송: {status} - {detail}")
    
    def publish_message(self, topic: str, data: Dict[str, Any]):
        """메시지 발행"""
        if self.connected:
            message = json.dumps(data, ensure_ascii=False)
            result = self.client.publish(topic, message, qos=1)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"📤 메시지 발행 성공: {topic}")
            else:
                print(f"❌ 메시지 발행 실패: {topic}, rc={result.rc}")
        else:
            print(f"⚠️ MQTT 연결되지 않음, 메시지 발행 실패: {topic}")
    
    def simulate_sensor_data(self):
        """센서 데이터 시뮬레이션"""
        # 실제로는 하드웨어 센서에서 읽기
        self.sensor_data['temperature'] += random.uniform(-0.5, 0.5)
        self.sensor_data['humidity'] += random.uniform(-2.0, 2.0)
        self.sensor_data['ec'] += random.uniform(-0.1, 0.1)
        self.sensor_data['ph'] += random.uniform(-0.1, 0.1)
        self.sensor_data['water_level'] += random.uniform(-1.0, 1.0)
        
        # 범위 제한
        self.sensor_data['temperature'] = max(15.0, min(35.0, self.sensor_data['temperature']))
        self.sensor_data['humidity'] = max(30.0, min(90.0, self.sensor_data['humidity']))
        self.sensor_data['ec'] = max(0.5, min(3.0, self.sensor_data['ec']))
        self.sensor_data['ph'] = max(5.0, min(8.0, self.sensor_data['ph']))
        self.sensor_data['water_level'] = max(0.0, min(100.0, self.sensor_data['water_level']))
    
    # 명령 처리 함수들
    def handle_pump_on(self, command_id: str, payload: Dict[str, Any]):
        """펌프 켜기 처리"""
        duration = payload.get('duration', 300)
        flow_rate = payload.get('flow_rate', 2.5)
        
        self.pump_state = True
        detail = f"Pump turned on for {duration} seconds, flow rate: {flow_rate} L/min"
        
        print(f"💧 펌프 켜짐 - {duration}초, 유량: {flow_rate}L/min")
        self.send_command_ack(command_id, "success", detail)
    
    def handle_pump_off(self, command_id: str, payload: Dict[str, Any]):
        """펌프 끄기 처리"""
        self.pump_state = False
        print("💧 펌프 꺼짐")
        self.send_command_ack(command_id, "success", "Pump turned off")
    
    def handle_valve_open(self, command_id: str, payload: Dict[str, Any]):
        """밸브 열기 처리"""
        position = payload.get('position', 100)
        print(f"🚰 밸브 열림 - 위치: {position}%")
        self.send_command_ack(command_id, "success", f"Valve opened to {position}%")
    
    def handle_valve_close(self, command_id: str, payload: Dict[str, Any]):
        """밸브 닫기 처리"""
        print("🚰 밸브 닫힘")
        self.send_command_ack(command_id, "success", "Valve closed")
    
    def handle_led_on(self, command_id: str, payload: Dict[str, Any]):
        """LED 켜기 처리"""
        brightness = payload.get('brightness', 100)
        color = payload.get('color', 'white')
        print(f"💡 LED 켜짐 - 밝기: {brightness}%, 색상: {color}")
        self.send_command_ack(command_id, "success", f"LED turned on, brightness: {brightness}%, color: {color}")
    
    def handle_led_off(self, command_id: str, payload: Dict[str, Any]):
        """LED 끄기 처리"""
        print("💡 LED 꺼짐")
        self.send_command_ack(command_id, "success", "LED turned off")
    
    def handle_config_update(self, command_id: str, payload: Dict[str, Any]):
        """설정 업데이트 처리"""
        sampling_interval = payload.get('sampling_interval', 30)
        print(f"⚙️ 설정 업데이트 - 샘플링 간격: {sampling_interval}초")
        self.send_command_ack(command_id, "success", f"Configuration updated, sampling interval: {sampling_interval}s")
    
    def start_periodic_tasks(self):
        """주기적 작업 시작"""
        def telemetry_task():
            while True:
                if self.connected:
                    self.send_telemetry()
                time.sleep(30)  # 30초마다
        
        def state_task():
            while True:
                if self.connected:
                    self.send_state()
                time.sleep(300)  # 5분마다
        
        # 백그라운드 스레드 시작
        telemetry_thread = threading.Thread(target=telemetry_task, daemon=True)
        state_thread = threading.Thread(target=state_task, daemon=True)
        
        telemetry_thread.start()
        state_thread.start()
        
        print("🔄 주기적 작업 시작됨")


def main():
    """메인 함수"""
    # 설정
    config = {
        'farm_id': 'farm_001',
        'device_id': 'device_001',
        'broker_url': 'your-broker.com',
        'broker_port': 8883,
        'username': 'your-username',
        'password': 'your-password',
        'device_type': 'sensor_gateway',
        'firmware_version': '1.0.0'
    }
    
    # 디바이스 생성 및 시작
    device = SmartFarmDevice(config)
    
    try:
        # MQTT 연결
        device.connect()
        
        # 주기적 작업 시작
        device.start_periodic_tasks()
        
        print("🚀 스마트팜 디바이스 시작됨")
        print("Ctrl+C로 종료")
        
        # 메인 루프
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 디바이스 종료 중...")
        device.disconnect()
        print("✅ 정상 종료됨")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        device.disconnect()


if __name__ == "__main__":
    main()
