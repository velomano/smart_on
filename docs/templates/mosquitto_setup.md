# 🐛 Eclipse Mosquitto 설정 가이드

## 📋 개요

Eclipse Mosquitto는 가장 널리 사용되는 오픈소스 MQTT 브로커입니다. 스마트팜 플랫폼 연동에 최적화된 설정 방법을 제공합니다.

## 🚀 설치

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
```

### CentOS/RHEL
```bash
sudo yum install mosquitto mosquitto-clients
```

### Docker
```bash
docker run -it -p 1883:1883 -p 8883:8883 eclipse-mosquitto
```

## ⚙️ 기본 설정

### 1. 메인 설정 파일
```bash
# /etc/mosquitto/mosquitto.conf
# ================================================
# 스마트팜 플랫폼 연동용 Mosquitto 설정
# ================================================

# 기본 포트 설정
port 1883
port 8883

# 연결 설정
max_connections 1000
max_inflight_messages 100
max_queued_messages 1000

# 메시지 크기 제한
message_size_limit 268435456  # 256MB

# 영속성 설정
persistence true
persistence_location /var/lib/mosquitto/

# 로그 설정
log_dest file /var/log/mosquitto/mosquitto.log
log_dest stdout
log_type error
log_type warning
log_type notice
log_type information
log_type debug

# 보안 설정
allow_anonymous false
password_file /etc/mosquitto/passwd
acl_file /etc/mosquitto/acl.conf

# TLS/SSL 설정
cafile /etc/mosquitto/ca.crt
certfile /etc/mosquitto/broker.crt
keyfile /etc/mosquitto/broker.key
require_certificate false
use_identity_as_username false

# 브릿지 설정 (스마트팜 브리지 연결용)
connection smartfarm-bridge
address smartfarm-bridge.example.com 1883
topic farms/+/+/+ both 0
remote_username bridge_user
remote_password bridge_password
remote_clientid smartfarm-bridge
keepalive_interval 60
start_type automatic
notifications false
cleansession true

# Last Will and Testament
will_topic farms/bridge/status
will_payload offline
will_qos 1
will_retain true

# QoS 설정
max_inflight_bytes 0
max_queued_bytes 0

# 메모리 관리
memory_limit 0

# 웹소켓 지원
listener 8080
protocol websockets
```

### 2. 사용자 인증 설정
```bash
# /etc/mosquitto/passwd 파일 생성
sudo mosquitto_passwd -c /etc/mosquitto/passwd smartfarm_user
sudo mosquitto_passwd /etc/mosquitto/passwd bridge_user
sudo mosquitto_passwd /etc/mosquitto/passwd device_user

# 권한 설정
sudo chmod 600 /etc/mosquitto/passwd
sudo chown mosquitto:mosquitto /etc/mosquitto/passwd
```

### 3. ACL (Access Control List) 설정
```bash
# /etc/mosquitto/acl.conf
# ================================================
# 스마트팜 플랫폼 ACL 설정
# ================================================

# 스마트팜 브리지 사용자 (모든 권한)
user bridge_user
topic read farms/+/+/+
topic write farms/+/+/+
topic read farms/bridge/+

# 디바이스 사용자 (제한된 권한)
user device_user
topic write farms/+/+/telemetry
topic write farms/+/+/state
topic write farms/+/+/registry
topic write farms/+/+/command/ack
topic read farms/+/+/command

# 일반 사용자 (읽기 전용)
user smartfarm_user
topic read farms/+/+/telemetry
topic read farms/+/+/state
topic read farms/+/+/registry
```

## 🔐 TLS/SSL 설정

### 1. 인증서 생성
```bash
# CA 인증서 생성
openssl genrsa -out ca.key 2048
openssl req -new -x509 -days 365 -key ca.key -out ca.crt

# 브로커 인증서 생성
openssl genrsa -out broker.key 2048
openssl req -new -key broker.key -out broker.csr
openssl x509 -req -in broker.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out broker.crt -days 365

# 클라이언트 인증서 생성 (선택사항)
openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 365
```

### 2. 인증서 배치
```bash
sudo cp ca.crt /etc/mosquitto/
sudo cp broker.crt /etc/mosquitto/
sudo cp broker.key /etc/mosquitto/
sudo chmod 600 /etc/mosquitto/broker.key
sudo chown mosquitto:mosquitto /etc/mosquitto/*
```

## 🐳 Docker Compose 설정

### docker-compose.yml
```yaml
version: '3.8'

services:
  mosquitto:
    image: eclipse-mosquitto:2.0
    container_name: smartfarm-mosquitto
    ports:
      - "1883:1883"
      - "8883:8883"
      - "8080:8080"
    volumes:
      - ./config/mosquitto.conf:/mosquitto/config/mosquitto.conf
      - ./config/passwd:/mosquitto/config/passwd
      - ./config/acl.conf:/mosquitto/config/acl.conf
      - ./certs:/mosquitto/certs
      - mosquitto_data:/mosquitto/data
      - mosquitto_logs:/mosquitto/log
    environment:
      - MOSQUITTO_USERNAME=mosquitto
    restart: unless-stopped
    networks:
      - smartfarm-network

  mosquitto-auth:
    image: iotechx/mosquitto-auth-plugin:latest
    container_name: mosquitto-auth
    environment:
      - AUTH_HTTP_HOST=http://auth-server:8080
    networks:
      - smartfarm-network

volumes:
  mosquitto_data:
  mosquitto_logs:

networks:
  smartfarm-network:
    driver: bridge
```

## 🔧 고급 설정

### 1. 클러스터링 (여러 브로커)
```bash
# /etc/mosquitto/mosquitto-cluster.conf
# 브로커 1
connection broker-2
address broker-2.example.com 1883
topic farms/+/+/+ both 0
remote_username cluster_user
remote_password cluster_password
remote_clientid broker-1-to-broker-2
keepalive_interval 60
start_type automatic
notifications false
cleansession false

# 브로커 2
connection broker-1
address broker-1.example.com 1883
topic farms/+/+/+ both 0
remote_username cluster_user
remote_password cluster_password
remote_clientid broker-2-to-broker-1
keepalive_interval 60
start_type automatic
notifications false
cleansession false
```

### 2. 메시지 영속성 및 복구
```bash
# /etc/mosquitto/mosquitto.conf 추가 설정
persistence true
persistence_location /var/lib/mosquitto/
persistence_file mosquitto.db
persistence_autosave_interval 1800
autosave_interval 300
```

### 3. 모니터링 및 메트릭
```bash
# 모니터링 토픽 활성화
sys_interval 10
```

## 🚀 서비스 시작 및 관리

### 1. 서비스 시작
```bash
# 시스템 서비스로 시작
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# 상태 확인
sudo systemctl status mosquitto

# 로그 확인
sudo journalctl -u mosquitto -f
```

### 2. 연결 테스트
```bash
# 로컬 테스트
mosquitto_pub -h localhost -t "test/topic" -m "Hello World"
mosquitto_sub -h localhost -t "test/topic"

# 원격 테스트
mosquitto_pub -h your-broker.com -p 8883 --cafile ca.crt -u username -P password -t "farms/farm_001/devices/device_001/telemetry" -m '{"test": "data"}'
```

### 3. 성능 튜닝
```bash
# /etc/mosquitto/mosquitto.conf 성능 설정
max_connections 10000
max_inflight_messages 1000
max_queued_messages 10000
message_size_limit 134217728  # 128MB
```

## 🔍 문제 해결

### 1. 연결 문제
```bash
# 포트 확인
sudo netstat -tlnp | grep mosquitto

# 방화벽 설정
sudo ufw allow 1883
sudo ufw allow 8883
sudo ufw allow 8080
```

### 2. 인증 문제
```bash
# 사용자 확인
sudo mosquitto_passwd -c /etc/mosquitto/passwd test_user
mosquitto_pub -h localhost -u test_user -P password -t "test" -m "test"
```

### 3. 로그 분석
```bash
# 실시간 로그 모니터링
sudo tail -f /var/log/mosquitto/mosquitto.log

# 에러 로그만 확인
sudo grep -i error /var/log/mosquitto/mosquitto.log
```

## 📊 모니터링 설정

### 1. Prometheus 메트릭 (선택사항)
```bash
# mosquitto-prometheus-plugin 설치
git clone https://github.com/SINTEF-9012/mosquitto-prometheus-plugin.git
cd mosquitto-prometheus-plugin
make
sudo cp prometheus.so /usr/lib/mosquitto/
```

### 2. 설정 파일에 추가
```bash
# /etc/mosquitto/mosquitto.conf
plugin /usr/lib/mosquitto/prometheus.so
prometheus_port 9000
```

## 🔄 백업 및 복구

### 1. 설정 백업
```bash
sudo tar -czf mosquitto-backup-$(date +%Y%m%d).tar.gz /etc/mosquitto/ /var/lib/mosquitto/
```

### 2. 데이터베이스 백업
```bash
sudo cp /var/lib/mosquitto/mosquitto.db /backup/mosquitto-$(date +%Y%m%d).db
```

## ✅ 설정 검증

### 1. 설정 파일 검증
```bash
mosquitto -c /etc/mosquitto/mosquitto.conf -v
```

### 2. 연결 테스트
```bash
# 기본 연결 테스트
mosquitto_pub -h localhost -t "test" -m "test message"
mosquitto_sub -h localhost -t "test"

# TLS 연결 테스트
mosquitto_pub -h localhost -p 8883 --cafile ca.crt -t "test" -m "test message"
```

이제 Mosquitto 브로커가 스마트팜 플랫폼과 완벽하게 연동될 준비가 되었습니다!
