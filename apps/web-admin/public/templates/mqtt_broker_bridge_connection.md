# 🌉 MQTT 브로커-브리지 연결 가이드

## 📋 개요

농장 계정 사용자가 자신의 MQTT 브로커를 스마트팜 플랫폼의 MQTT 브리지와 쉽게 연결하는 가이드입니다.

## 🏗️ 연결 아키텍처

```
농장 MQTT 브로커 ←→ 스마트팜 MQTT 브리지 ←→ 스마트팜 플랫폼
     ↓                      ↓                    ↓
디바이스/센서         데이터 변환/라우팅      웹 대시보드
```

## 🔧 연결 방법

### 방법 1: 직접 연결 (권장)

#### 1단계: MQTT 브리지 정보 확인

웹 어드민에서 다음 정보를 확인하세요:
- **브리지 호스트**: `mqtt-bridge.your-domain.com`
- **브리지 포트**: `1883` (또는 `8883` for TLS)
- **브리지 인증**: 사용자명/비밀번호 또는 인증서

#### 2단계: 브로커 설정

**Eclipse Mosquitto 설정 예시:**

```bash
# /etc/mosquitto/conf.d/bridge.conf
connection smartfarm-bridge
address mqtt-bridge.your-domain.com:1883
topic farms/your_farm_id/+/+/+ both 2
clientid farm_bridge_client
username your_bridge_username
password your_bridge_password
bridge_protocol_version mqttv311
try_private false
start_type automatic
```

**EMQX 설정 예시:**

```bash
# /etc/emqx/plugins/emqx_bridge_mqtt.conf
bridge.mqtt.smartfarm.address = mqtt-bridge.your-domain.com:1883
bridge.mqtt.smartfarm.username = your_bridge_username
bridge.mqtt.smartfarm.password = your_bridge_password
bridge.mqtt.smartfarm.proto_ver = mqttv4
bridge.mqtt.smartfarm.forward = farms/your_farm_id/+/+/+
bridge.mqtt.smartfarm.subscription.1.topic = farms/your_farm_id/+/+/+
```

#### 3단계: 연결 테스트

```bash
# 연결 테스트
mosquitto_pub -h localhost -t "farms/your_farm_id/devices/test/telemetry" \
  -m '{"test": "connection", "timestamp": "'$(date -Iseconds)'"}'

# 구독 테스트
mosquitto_sub -h localhost -t "farms/your_farm_id/devices/+/command" -v
```

### 방법 2: 클라우드 브로커 사용

#### AWS IoT Core 연결

```json
{
  "Rules": [
    {
      "RuleName": "SmartFarmForward",
      "SQL": "SELECT * FROM 'farms/+/devices/+/telemetry'",
      "Actions": [
        {
          "HTTP": {
            "Url": "https://mqtt-bridge.your-domain.com/api/forward"
          }
        }
      ]
    }
  ]
}
```

#### Azure IoT Hub 연결

```json
{
  "Routes": [
    {
      "Name": "SmartFarmRoute",
      "Source": "DeviceMessages",
      "Condition": "farm_id = 'your_farm_id'",
      "EndpointNames": ["SmartFarmEndpoint"]
    }
  ],
  "Endpoints": [
    {
      "Name": "SmartFarmEndpoint",
      "Type": "EventHub",
      "ConnectionString": "your-connection-string"
    }
  ]
}
```

## 📡 토픽 구조 및 라우팅

### 표준 토픽 패턴

```
farms/{farm_id}/devices/{device_id}/{message_type}
```

### 메시지 타입별 라우팅

| 메시지 타입 | 방향 | 설명 |
|-------------|------|------|
| `registry` | 농장 → 브리지 | 디바이스 등록 정보 |
| `telemetry` | 농장 → 브리지 | 센서 데이터 |
| `state` | 농장 → 브리지 | 디바이스 상태 |
| `command` | 브리지 → 농장 | 제어 명령 |
| `command/ack` | 농장 → 브리지 | 명령 확인 응답 |

### 라우팅 규칙 설정

#### Mosquitto Bridge 설정

```bash
# 모든 텔레메트리 데이터 전달
topic farms/your_farm_id/+/+/telemetry out 2

# 명령 데이터 수신
topic farms/your_farm_id/+/+/command in 2

# 상태 데이터 전달
topic farms/your_farm_id/+/+/state out 2
```

#### EMQX Bridge 설정

```bash
# 전송 규칙
bridge.mqtt.smartfarm.forwards.1 = farms/your_farm_id/+/+/telemetry
bridge.mqtt.smartfarm.forwards.2 = farms/your_farm_id/+/+/state
bridge.mqtt.smartfarm.forwards.3 = farms/your_farm_id/+/+/registry

# 구독 규칙
bridge.mqtt.smartfarm.subscription.1.topic = farms/your_farm_id/+/+/command
bridge.mqtt.smartfarm.subscription.2.topic = farms/your_farm_id/+/+/config
```

## 🔒 보안 설정

### TLS/SSL 연결

#### 인증서 설정

```bash
# 인증서 다운로드
wget https://mqtt-bridge.your-domain.com/certs/ca.crt
wget https://mqtt-bridge.your-domain.com/certs/client.crt
wget https://mqtt-bridge.your-domain.com/certs/client.key

# Mosquitto TLS 설정
connection smartfarm-bridge-tls
address mqtt-bridge.your-domain.com:8883
cafile /etc/mosquitto/certs/ca.crt
certfile /etc/mosquitto/certs/client.crt
keyfile /etc/mosquitto/certs/client.key
```

#### 사용자 인증

```bash
# 사용자 계정 생성
mosquitto_passwd -c /etc/mosquitto/passwd your_bridge_username

# ACL 설정
# /etc/mosquitto/acl.conf
user your_bridge_username
topic read farms/your_farm_id/+/+/telemetry
topic read farms/your_farm_id/+/+/state
topic write farms/your_farm_id/+/+/command
```

### 방화벽 설정

```bash
# 필요한 포트만 개방
sudo ufw allow 1883/tcp   # MQTT
sudo ufw allow 8883/tcp   # MQTT over TLS
sudo ufw allow 8083/tcp   # WebSocket (선택사항)
```

## 📊 모니터링 및 디버깅

### 연결 상태 확인

```bash
# Mosquitto 브리지 상태
mosquitto -c /etc/mosquitto/mosquitto.conf -v

# EMQX 브리지 상태
emqx_ctl bridges list

# 연결 로그 확인
tail -f /var/log/mosquitto/mosquitto.log
```

### 메시지 흐름 추적

```bash
# 메시지 발행 테스트
mosquitto_pub -h localhost -t "farms/test/devices/sensor_001/telemetry" \
  -m '{"temperature": 25.5, "humidity": 60}'

# 메시지 수신 확인
mosquitto_sub -h localhost -t "farms/test/devices/+/command" -v
```

### 성능 모니터링

```bash
# 연결 수 확인
netstat -an | grep :1883 | wc -l

# 메시지 처리량 확인
mosquitto_sub -h localhost -t "#" -v | pv -l > /dev/null
```

## 🔧 문제해결

### 일반적인 문제들

#### 1. 브리지 연결 실패

**증상**: 브로커가 브리지에 연결되지 않음

**해결방법**:
```bash
# 네트워크 연결 확인
ping mqtt-bridge.your-domain.com

# 포트 연결 확인
telnet mqtt-bridge.your-domain.com 1883

# 인증 정보 확인
mosquitto_pub -h mqtt-bridge.your-domain.com -u your_username -P your_password \
  -t "test" -m "test message"
```

#### 2. 메시지 전달 안됨

**증상**: 디바이스에서 발행한 메시지가 브리지로 전달되지 않음

**해결방법**:
```bash
# 토픽 패턴 확인
mosquitto_sub -h localhost -t "farms/your_farm_id/+/+/+" -v

# 브리지 설정 확인
cat /etc/mosquitto/conf.d/bridge.conf
```

#### 3. 명령 수신 안됨

**증상**: 브리지에서 보낸 명령을 디바이스가 받지 못함

**해결방법**:
```bash
# 명령 토픽 구독 확인
mosquitto_sub -h localhost -t "farms/your_farm_id/devices/+/command" -v

# 브리지 구독 설정 확인
grep -r "command" /etc/mosquitto/conf.d/
```

### 성능 최적화

#### 1. 연결 풀링

```bash
# EMQX 연결 풀 설정
bridge.mqtt.smartfarm.pool_size = 8
bridge.mqtt.smartfarm.max_inflight = 32
```

#### 2. 메시지 압축

```bash
# Mosquitto 압축 설정
connection smartfarm-bridge
compression true
```

#### 3. QoS 설정

```bash
# 중요 메시지는 QoS 2 사용
topic farms/your_farm_id/+/+/telemetry out 2
topic farms/your_farm_id/+/+/command in 2
```

## 📈 확장성 고려사항

### 다중 농장 지원

```bash
# 여러 농장 토픽 처리
topic farms/farm_001/+/+/+ both 2
topic farms/farm_002/+/+/+ both 2
topic farms/farm_003/+/+/+ both 2
```

### 클러스터링

```bash
# EMQX 클러스터 설정
cluster.name = smartfarm_cluster
cluster.discovery = etcd
cluster.etcd.server = http://etcd1:2379,http://etcd2:2379
```

### 로드 밸런싱

```bash
# HAProxy 설정 예시
backend mqtt_bridges
    balance roundrobin
    server bridge1 mqtt-bridge1.your-domain.com:1883 check
    server bridge2 mqtt-bridge2.your-domain.com:1883 check
    server bridge3 mqtt-bridge3.your-domain.com:1883 check
```

## 📞 지원 및 도움말

### 유용한 명령어

```bash
# 브로커 상태 확인
mosquitto -c /etc/mosquitto/mosquitto.conf -v

# 연결된 클라이언트 확인
mosquitto_sub -h localhost -t "$SYS/broker/clients/connected" -v

# 토픽 통계 확인
mosquitto_sub -h localhost -t "$SYS/broker/topics" -v
```

### 로그 위치

```bash
# Mosquitto 로그
/var/log/mosquitto/mosquitto.log

# EMQX 로그
/var/log/emqx/emqx.log

# 시스템 로그
journalctl -u mosquitto -f
```

---

**💡 팁:**
- 처음에는 테스트 환경에서 연결을 확인한 후 운영 환경에 적용하세요
- 정기적으로 연결 상태와 메시지 흐름을 모니터링하세요
- 백업 및 복구 계획을 수립하세요
- 보안 업데이트를 정기적으로 적용하세요
