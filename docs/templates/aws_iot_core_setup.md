# ☁️ AWS IoT Core 설정 가이드

## 📋 개요

AWS IoT Core는 완전 관리형 클라우드 MQTT 브로커 서비스입니다. 확장성, 보안, 모니터링이 내장되어 있어 스마트팜 플랫폼 연동에 최적화되어 있습니다.

## 🚀 AWS IoT Core 생성

### 1. AWS IoT Core 콘솔 접속
```bash
# AWS CLI 설정 (선택사항)
aws configure
```

### 2. 디바이스 등록
```bash
# AWS CLI로 디바이스 생성
aws iot create-thing \
    --thing-name "smartfarm-device-001" \
    --thing-type-name "SmartFarmDevice" \
    --attribute-payload attributes='{"farm_id":"farm_001","device_type":"sensor_gateway"}'
```

## 🔐 인증서 및 정책 설정

### 1. 인증서 생성
```bash
# 인증서 생성
aws iot create-keys-and-certificate \
    --set-as-active \
    --certificate-pem-outfile device-certificate.pem \
    --public-key-outfile device-public.pem \
    --private-key-outfile device-private.pem

# 인증서 ARN 저장
CERT_ARN=$(aws iot list-certificates --query 'certificates[0].certificateArn' --output text)
```

### 2. 정책 생성
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:Connect"
      ],
      "Resource": "arn:aws:iot:region:account:client/smartfarm-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Publish"
      ],
      "Resource": [
        "arn:aws:iot:region:account:topic/farms/+/devices/+/telemetry",
        "arn:aws:iot:region:account:topic/farms/+/devices/+/state",
        "arn:aws:iot:region:account:topic/farms/+/devices/+/registry",
        "arn:aws:iot:region:account:topic/farms/+/devices/+/command/ack"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Subscribe"
      ],
      "Resource": [
        "arn:aws:iot:region:account:topicfilter/farms/+/devices/+/command"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Receive"
      ],
      "Resource": [
        "arn:aws:iot:region:account:topic/farms/+/devices/+/command"
      ]
    }
  ]
}
```

### 3. 정책 적용
```bash
# 정책 생성
aws iot create-policy \
    --policy-name "SmartFarmDevicePolicy" \
    --policy-document file://device-policy.json

# 정책을 인증서에 연결
aws iot attach-policy \
    --policy-name "SmartFarmDevicePolicy" \
    --target $CERT_ARN
```

## ⚙️ AWS IoT Core 설정

### 1. 엔드포인트 확인
```bash
# IoT Core 엔드포인트 조회
aws iot describe-endpoint --endpoint-type iot:Data-ATS
```

### 2. 스마트팜 브리지용 정책
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:Connect"
      ],
      "Resource": "arn:aws:iot:region:account:client/smartfarm-bridge"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Publish"
      ],
      "Resource": [
        "arn:aws:iot:region:account:topic/farms/+/devices/+/command"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Subscribe"
      ],
      "Resource": [
        "arn:aws:iot:region:account:topicfilter/farms/+/devices/+/telemetry",
        "arn:aws:iot:region:account:topicfilter/farms/+/devices/+/state",
        "arn:aws:iot:region:account:topicfilter/farms/+/devices/+/registry",
        "arn:aws:iot:region:account:topicfilter/farms/+/devices/+/command/ack"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Receive"
      ],
      "Resource": [
        "arn:aws:iot:region:account:topic/farms/+/devices/+/telemetry",
        "arn:aws:iot:region:account:topic/farms/+/devices/+/state",
        "arn:aws:iot:region:account:topic/farms/+/devices/+/registry",
        "arn:aws:iot:region:account:topic/farms/+/devices/+/command/ack"
      ]
    }
  ]
}
```

## 🔧 디바이스 연동 코드

### 1. Python 예제
```python
#!/usr/bin/env python3
"""
AWS IoT Core 연동 예제
"""

import json
import ssl
import time
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient

class SmartFarmDevice:
    def __init__(self, config):
        self.config = config
        self.client = None
        self.setup_mqtt()
    
    def setup_mqtt(self):
        # AWS IoT Core 클라이언트 설정
        self.client = AWSIoTMQTTClient(self.config['device_id'])
        self.client.configureEndpoint(self.config['endpoint'], 8883)
        self.client.configureCredentials(
            self.config['ca_cert'],
            self.config['private_key'],
            self.config['certificate']
        )
        
        # 연결 설정
        self.client.configureAutoReconnectBackoffTime(1, 32, 20)
        self.client.configureOfflinePublishQueueing(-1)
        self.client.configureDrainingFrequency(2)
        self.client.configureConnectDisconnectTimeout(10)
        self.client.configureMQTTOperationTimeout(5)
        
        # 콜백 함수 설정
        self.client.onMessage = self.on_message
        self.client.onConnect = self.on_connect
        self.client.onDisconnect = self.on_disconnect
    
    def on_connect(self, client, userdata, flags, rc):
        print(f"✅ AWS IoT Core 연결 성공: {self.config['device_id']}")
        
        # 명령 토픽 구독
        command_topic = f"farms/{self.config['farm_id']}/devices/{self.config['device_id']}/command"
        self.client.subscribe(command_topic, 1, self.on_message)
        print(f"📡 명령 토픽 구독: {command_topic}")
        
        # 디바이스 등록
        self.send_registry()
    
    def on_disconnect(self, client, userdata, rc):
        print(f"🔌 AWS IoT Core 연결 해제: {rc}")
    
    def on_message(self, client, userdata, message):
        try:
            payload = json.loads(message.payload.decode('utf-8'))
            print(f"📨 메시지 수신 [{message.topic}]: {payload}")
            
            command = payload.get('command')
            command_id = payload.get('command_id')
            command_payload = payload.get('payload', {})
            
            # 명령 처리
            if command == 'pump_on':
                self.handle_pump_on(command_id, command_payload)
            elif command == 'pump_off':
                self.handle_pump_off(command_id, command_payload)
            else:
                print(f"⚠️ 알 수 없는 명령: {command}")
                self.send_command_ack(command_id, 'error', f'Unknown command: {command}')
                
        except json.JSONDecodeError as e:
            print(f"❌ JSON 파싱 오류: {e}")
    
    def connect(self):
        """AWS IoT Core 연결"""
        try:
            print(f"🔗 AWS IoT Core 연결 중: {self.config['endpoint']}")
            self.client.connect()
        except Exception as e:
            print(f"❌ AWS IoT Core 연결 오류: {e}")
    
    def send_registry(self):
        """디바이스 등록 정보 전송"""
        registry_data = {
            "device_id": self.config['device_id'],
            "device_type": "sensor_gateway",
            "firmware_version": "1.0.0",
            "hardware_version": "v2.1",
            "capabilities": {
                "sensors": ["temperature", "humidity", "ec", "ph"],
                "actuators": ["pump", "valve"],
                "communication": ["wifi", "mqtt"]
            },
            "location": {
                "farm_id": self.config['farm_id'],
                "bed_id": "bed_a1",
                "tier": 1
            },
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        
        topic = f"farms/{self.config['farm_id']}/devices/{self.config['device_id']}/registry"
        self.client.publish(topic, json.dumps(registry_data), 1)
        print("📋 디바이스 등록 전송")
    
    def send_telemetry(self):
        """센서 데이터 전송"""
        telemetry_data = {
            "device_id": self.config['device_id'],
            "batch_seq": int(time.time()),
            "window_ms": 30000,
            "readings": [
                {
                    "key": "temperature",
                    "tier": 1,
                    "unit": "celsius",
                    "value": 23.5,
                    "ts": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                    "quality": "good"
                },
                {
                    "key": "humidity",
                    "tier": 1,
                    "unit": "percent",
                    "value": 65.2,
                    "ts": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                    "quality": "good"
                }
            ],
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        
        topic = f"farms/{self.config['farm_id']}/devices/{self.config['device_id']}/telemetry"
        self.client.publish(topic, json.dumps(telemetry_data), 1)
        print("📡 센서 데이터 전송")
    
    def send_command_ack(self, command_id, status, detail):
        """명령 확인 응답 전송"""
        ack_data = {
            "command_id": command_id,
            "status": status,
            "detail": detail,
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        
        topic = f"farms/{self.config['farm_id']}/devices/{self.config['device_id']}/command/ack"
        self.client.publish(topic, json.dumps(ack_data), 1)
        print(f"✅ 명령 ACK 전송: {status}")
    
    def handle_pump_on(self, command_id, payload):
        """펌프 켜기 처리"""
        duration = payload.get('duration', 300)
        flow_rate = payload.get('flow_rate', 2.5)
        
        detail = f"Pump turned on for {duration} seconds, flow rate: {flow_rate} L/min"
        print(f"💧 펌프 켜짐 - {duration}초, 유량: {flow_rate}L/min")
        self.send_command_ack(command_id, "success", detail)
    
    def handle_pump_off(self, command_id, payload):
        """펌프 끄기 처리"""
        print("💧 펌프 꺼짐")
        self.send_command_ack(command_id, "success", "Pump turned off")

# 사용 예제
if __name__ == "__main__":
    config = {
        'device_id': 'device_001',
        'farm_id': 'farm_001',
        'endpoint': 'your-endpoint.iot.region.amazonaws.com',
        'ca_cert': 'certs/AmazonRootCA1.pem',
        'private_key': 'certs/device-private.pem',
        'certificate': 'certs/device-certificate.pem'
    }
    
    device = SmartFarmDevice(config)
    device.connect()
    
    try:
        while True:
            device.send_telemetry()
            time.sleep(30)
    except KeyboardInterrupt:
        print("\n🛑 디바이스 종료 중...")
        device.client.disconnect()
```

### 2. Node.js 예제
```javascript
const awsIot = require('aws-iot-device-sdk');

class SmartFarmDevice {
    constructor(config) {
        this.config = config;
        this.device = null;
        this.setupDevice();
    }
    
    setupDevice() {
        this.device = awsIot.device({
            keyPath: this.config.private_key,
            certPath: this.config.certificate,
            caPath: this.config.ca_cert,
            clientId: this.config.device_id,
            host: this.config.endpoint
        });
        
        this.device.on('connect', () => {
            console.log('✅ AWS IoT Core 연결 성공');
            
            // 명령 토픽 구독
            const commandTopic = `farms/${this.config.farm_id}/devices/${this.config.device_id}/command`;
            this.device.subscribe(commandTopic);
            console.log(`📡 명령 토픽 구독: ${commandTopic}`);
            
            // 디바이스 등록
            this.sendRegistry();
        });
        
        this.device.on('message', (topic, payload) => {
            try {
                const data = JSON.parse(payload.toString());
                console.log(`📨 메시지 수신 [${topic}]:`, data);
                this.handleCommand(data);
            } catch (error) {
                console.error('❌ 메시지 처리 오류:', error);
            }
        });
        
        this.device.on('error', (error) => {
            console.error('❌ AWS IoT Core 오류:', error);
        });
    }
    
    sendRegistry() {
        const registryData = {
            device_id: this.config.device_id,
            device_type: 'sensor_gateway',
            firmware_version: '1.0.0',
            capabilities: {
                sensors: ['temperature', 'humidity', 'ec', 'ph'],
                actuators: ['pump', 'valve']
            },
            timestamp: new Date().toISOString()
        };
        
        const topic = `farms/${this.config.farm_id}/devices/${this.config.device_id}/registry`;
        this.device.publish(topic, JSON.stringify(registryData));
        console.log('📋 디바이스 등록 전송');
    }
    
    sendTelemetry() {
        const telemetryData = {
            device_id: this.config.device_id,
            readings: [
                {
                    key: 'temperature',
                    value: 23.5,
                    unit: 'celsius',
                    ts: new Date().toISOString()
                }
            ],
            timestamp: new Date().toISOString()
        };
        
        const topic = `farms/${this.config.farm_id}/devices/${this.config.device_id}/telemetry`;
        this.device.publish(topic, JSON.stringify(telemetryData));
        console.log('📡 센서 데이터 전송');
    }
    
    handleCommand(data) {
        const { command, command_id, payload } = data;
        
        switch (command) {
            case 'pump_on':
                this.handlePumpOn(command_id, payload);
                break;
            case 'pump_off':
                this.handlePumpOff(command_id, payload);
                break;
            default:
                console.log(`⚠️ 알 수 없는 명령: ${command}`);
                this.sendCommandAck(command_id, 'error', `Unknown command: ${command}`);
        }
    }
    
    handlePumpOn(commandId, payload) {
        console.log('💧 펌프 켜짐');
        this.sendCommandAck(commandId, 'success', 'Pump turned on');
    }
    
    handlePumpOff(commandId, payload) {
        console.log('💧 펌프 꺼짐');
        this.sendCommandAck(commandId, 'success', 'Pump turned off');
    }
    
    sendCommandAck(commandId, status, detail) {
        const ackData = {
            command_id: commandId,
            status,
            detail,
            timestamp: new Date().toISOString()
        };
        
        const topic = `farms/${this.config.farm_id}/devices/${this.config.device_id}/command/ack`;
        this.device.publish(topic, JSON.stringify(ackData));
        console.log(`✅ 명령 ACK 전송: ${status}`);
    }
}

// 사용 예제
const config = {
    device_id: 'device_001',
    farm_id: 'farm_001',
    endpoint: 'your-endpoint.iot.region.amazonaws.com',
    private_key: 'certs/device-private.pem',
    certificate: 'certs/device-certificate.pem',
    ca_cert: 'certs/AmazonRootCA1.pem'
};

const device = new SmartFarmDevice(config);

// 30초마다 센서 데이터 전송
setInterval(() => {
    device.sendTelemetry();
}, 30000);
```

## 📊 모니터링 및 알림

### 1. CloudWatch 메트릭
```bash
# 메트릭 조회
aws cloudwatch get-metric-statistics \
    --namespace AWS/IoT \
    --metric-name NumberOfMessagesPublished \
    --dimensions Name=Topic,Value=farms/+/devices/+/telemetry \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-01T23:59:59Z \
    --period 3600 \
    --statistics Sum
```

### 2. IoT 규칙 설정
```sql
-- SQL 규칙: 온도 알림
SELECT 
    topic() as topic,
    timestamp() as timestamp,
    temperature,
    humidity
FROM 'farms/+/devices/+/telemetry'
WHERE temperature > 30 OR humidity < 40
```

### 3. SNS 알림 설정
```bash
# SNS 토픽 생성
aws sns create-topic --name smartfarm-alerts

# IoT 규칙 액션 설정
aws iot create-topic-rule \
    --rule-name temperature-alert \
    --topic-rule-payload file://temperature-rule.json
```

## 🔍 문제 해결

### 1. 연결 문제
```bash
# 인증서 유효성 확인
openssl x509 -in device-certificate.pem -text -noout

# 엔드포인트 연결 테스트
openssl s_client -connect your-endpoint.iot.region.amazonaws.com:8883 -cert device-certificate.pem -key device-private.pem
```

### 2. 정책 문제
```bash
# 정책 확인
aws iot list-policies-for-target --target $CERT_ARN

# 정책 테스트
aws iot test-authorization \
    --principal $CERT_ARN \
    --action iot:Publish \
    --resource "arn:aws:iot:region:account:topic/farms/farm_001/devices/device_001/telemetry"
```

### 3. 로그 확인
```bash
# CloudWatch 로그 확인
aws logs describe-log-groups --log-group-name-prefix /aws/iot
aws logs get-log-events --log-group-name /aws/iot/rule/temperature-alert --log-stream-name stream-name
```

## 💰 비용 최적화

### 1. 메시지 최적화
- 배치 전송 사용
- 불필요한 메시지 제거
- QoS 0 사용 (가능한 경우)

### 2. 연결 최적화
- 영구 연결 사용
- 연결 풀링
- Keep-alive 최적화

### 3. 스토리지 최적화
- 메시지 보관 기간 설정
- 불필요한 데이터 삭제

이제 AWS IoT Core가 스마트팜 플랫폼과 완벽하게 연동될 준비가 되었습니다!
