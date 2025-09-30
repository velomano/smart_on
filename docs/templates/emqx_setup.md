# ⚡ EMQX 설정 가이드

## 📋 개요

EMQX는 고성능 엔터프라이즈급 MQTT 브로커입니다. 대규모 IoT 시스템에 최적화되어 있으며, 스마트팜 플랫폼과의 연동에 필요한 모든 기능을 제공합니다.

## 🚀 설치

### Docker (추천)
```bash
docker run -d --name emqx \
  -p 1883:1883 \
  -p 8083:8083 \
  -p 8084:8084 \
  -p 8883:8883 \
  -p 18083:18083 \
  emqx/emqx:latest
```

### 바이너리 설치
```bash
# Ubuntu/Debian
wget https://www.emqx.io/downloads/broker/latest/emqx-ubuntu20.04-amd64.deb
sudo dpkg -i emqx-ubuntu20.04-amd64.deb

# CentOS/RHEL
wget https://www.emqx.io/downloads/broker/latest/emqx-centos7-amd64.rpm
sudo rpm -ivh emqx-centos7-amd64.rpm
```

## ⚙️ 기본 설정

### 1. 메인 설정 파일
```bash
# /etc/emqx/etc/emqx.conf
# ================================================
# 스마트팜 플랫폼 연동용 EMQX 설정
# ================================================

# 기본 포트 설정
listeners.tcp.default = 1883
listeners.ssl.default = 8883
listeners.ws.default = 8083
listeners.wss.default = 8084

# 연결 제한
max_connections = 1000000
max_inflight = 32
max_awaiting_rel = 100

# 메시지 크기 제한
max_packet_size = 1MB
max_message_size = 1MB

# 세션 관리
session.expiry_interval = 2h
session.max_subscriptions = 0
session.upgrade_qos = off
session.retry_interval = 30s
session.max_inflight = 32

# 메시지 영속성
persistent_session_store = on
persistent_session_store = mnesia

# 로그 설정
log.level = warning
log.dir = /var/log/emqx
log.file = emqx.log
log.rotation.size = 100MB
log.rotation.count = 5

# 보안 설정
allow_anonymous = false
acl_nomatch = deny

# 인증 설정
auth.1.cmd = /usr/bin/node /etc/emqx/auth/auth.js
auth.1.aclcmd = /usr/bin/node /etc/emqx/auth/acl.js

# TLS/SSL 설정
listeners.ssl.default.keyfile = /etc/emqx/certs/server-key.pem
listeners.ssl.default.certfile = /etc/emqx/certs/server-cert.pem
listeners.ssl.default.cacertfile = /etc/emqx/certs/ca-cert.pem
listeners.ssl.default.verify = verify_peer
listeners.ssl.default.fail_if_no_peer_cert = false

# 브릿지 설정 (스마트팜 브리지 연결)
bridges.mqtt.smartfarm_bridge.enable = true
bridges.mqtt.smartfarm_bridge.server = smartfarm-bridge.example.com:1883
bridges.mqtt.smartfarm_bridge.client_id = emqx-to-smartfarm
bridges.mqtt.smartfarm_bridge.username = bridge_user
bridges.mqtt.smartfarm_bridge.password = bridge_password
bridges.mqtt.smartfarm_bridge.keepalive = 60s
bridges.mqtt.smartfarm_bridge.clean_start = true
bridges.mqtt.smartfarm_bridge.retry_interval = 30s
bridges.mqtt.smartfarm_bridge.max_inflight = 32
bridges.mqtt.smartfarm_bridge.queue.max_len = 10000
bridges.mqtt.smartfarm_bridge.queue.priorities = all
bridges.mqtt.smartfarm_bridge.forwards = [
  "farms/+/+/telemetry",
  "farms/+/+/state",
  "farms/+/+/registry",
  "farms/+/+/command/ack"
]
bridges.mqtt.smartfarm_bridge.subscription.1.topic = "farms/+/+/command"
bridges.mqtt.smartfarm_bridge.subscription.1.qos = 1

# 모니터링
stats.enable = true
sysmon.long_gc = disabled
sysmon.long_schedule = 240ms
sysmon.large_heap = 8MB
```

### 2. 인증 플러그인 설정
```javascript
// /etc/emqx/auth/auth.js
// 스마트팜 플랫폼 인증 스크립트

function auth_on_register(clientid, username, password, peername, bindings) {
    // 사용자 인증 로직
    if (username === "bridge_user" && password === "bridge_password") {
        return "allow";
    }
    
    if (username === "device_user" && password === "device_password") {
        return "allow";
    }
    
    if (username === "smartfarm_user" && password === "smartfarm_password") {
        return "allow";
    }
    
    return "deny";
}

function auth_on_subscribe(clientid, username, topic, qos) {
    // 구독 권한 확인
    if (username === "bridge_user") {
        return "allow";
    }
    
    if (username === "device_user") {
        // 디바이스는 명령 토픽만 구독 가능
        if (topic.match(/^farms\/.+\/devices\/.+\/command$/)) {
            return "allow";
        }
        return "deny";
    }
    
    if (username === "smartfarm_user") {
        // 읽기 전용 사용자는 데이터 토픽만 구독 가능
        if (topic.match(/^farms\/.+\/devices\/.+\/(telemetry|state|registry)$/)) {
            return "allow";
        }
        return "deny";
    }
    
    return "deny";
}

function auth_on_publish(clientid, username, topic, qos, payload) {
    // 발행 권한 확인
    if (username === "bridge_user") {
        return "allow";
    }
    
    if (username === "device_user") {
        // 디바이스는 센서 데이터와 상태만 발행 가능
        if (topic.match(/^farms\/.+\/devices\/.+\/(telemetry|state|registry|command\/ack)$/)) {
            return "allow";
        }
        return "deny";
    }
    
    if (username === "smartfarm_user") {
        // 읽기 전용 사용자는 발행 불가
        return "deny";
    }
    
    return "deny";
}
```

### 3. ACL 설정
```javascript
// /etc/emqx/auth/acl.js
// 스마트팜 플랫폼 ACL 설정

function acl_check(clientid, username, topic, pubsub) {
    if (username === "bridge_user") {
        // 브리지 사용자는 모든 토픽 접근 가능
        return "allow";
    }
    
    if (username === "device_user") {
        if (pubsub === "publish") {
            // 디바이스 발행 권한
            if (topic.match(/^farms\/.+\/devices\/.+\/(telemetry|state|registry|command\/ack)$/)) {
                return "allow";
            }
        } else if (pubsub === "subscribe") {
            // 디바이스 구독 권한
            if (topic.match(/^farms\/.+\/devices\/.+\/command$/)) {
                return "allow";
            }
        }
        return "deny";
    }
    
    if (username === "smartfarm_user") {
        if (pubsub === "subscribe") {
            // 읽기 전용 사용자 구독 권한
            if (topic.match(/^farms\/.+\/devices\/.+\/(telemetry|state|registry)$/)) {
                return "allow";
            }
        }
        // 발행 권한 없음
        return "deny";
    }
    
    return "deny";
}
```

## 🔐 TLS/SSL 설정

### 1. 인증서 생성
```bash
# CA 인증서 생성
openssl genrsa -out ca-key.pem 2048
openssl req -new -x509 -days 365 -key ca-key.pem -out ca-cert.pem

# 서버 인증서 생성
openssl genrsa -out server-key.pem 2048
openssl req -new -key server-key.pem -out server.csr
openssl x509 -req -in server.csr -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out server-cert.pem -days 365
```

### 2. 인증서 배치
```bash
sudo mkdir -p /etc/emqx/certs
sudo cp ca-cert.pem /etc/emqx/certs/ca-cert.pem
sudo cp server-cert.pem /etc/emqx/certs/server-cert.pem
sudo cp server-key.pem /etc/emqx/certs/server-key.pem
sudo chmod 600 /etc/emqx/certs/server-key.pem
sudo chown emqx:emqx /etc/emqx/certs/*
```

## 🐳 Docker Compose 설정

### docker-compose.yml
```yaml
version: '3.8'

services:
  emqx:
    image: emqx/emqx:latest
    container_name: smartfarm-emqx
    ports:
      - "1883:1883"   # MQTT
      - "8083:8083"   # WebSocket
      - "8084:8084"   # WebSocket SSL
      - "8883:8883"   # MQTT SSL
      - "18083:18083" # Dashboard
    volumes:
      - ./config/emqx.conf:/opt/emqx/etc/emqx.conf
      - ./auth:/opt/emqx/auth
      - ./certs:/opt/emqx/certs
      - emqx_data:/opt/emqx/data
      - emqx_log:/opt/emqx/log
    environment:
      - EMQX_NAME=emqx
      - EMQX_HOST=127.0.0.1
      - EMQX_CLUSTER__DISCOVERY_STRATEGY=static
      - EMQX_CLUSTER__STATIC__SEEDS=emqx@127.0.0.1
    restart: unless-stopped
    networks:
      - smartfarm-network

  emqx-auth:
    image: node:18-alpine
    container_name: emqx-auth
    working_dir: /app
    volumes:
      - ./auth:/app
    command: node auth.js
    networks:
      - smartfarm-network

volumes:
  emqx_data:
  emqx_log:

networks:
  smartfarm-network:
    driver: bridge
```

## 🔧 고급 설정

### 1. 클러스터링 설정
```bash
# /etc/emqx/etc/emqx.conf
cluster.discovery = static
cluster.static.seeds = emqx@emqx-1.example.com,emqx@emqx-2.example.com,emqx@emqx-3.example.com

# 노드 설정
node.name = emqx@emqx-1.example.com
node.cookie = emqxsecretcookie
```

### 2. 데이터베이스 연동
```bash
# PostgreSQL 연동
auth.pgsql.enable = true
auth.pgsql.server = localhost:5432
auth.pgsql.username = emqx
auth.pgsql.password = emqx_password
auth.pgsql.database = emqx
auth.pgsql.ssl = false
auth.pgsql.pool_size = 8
auth.pgsql.ssl_opts.keyfile = /etc/emqx/certs/client-key.pem
auth.pgsql.ssl_opts.certfile = /etc/emqx/certs/client-cert.pem
auth.pgsql.ssl_opts.cacertfile = /etc/emqx/certs/ca-cert.pem

# MySQL 연동
auth.mysql.enable = true
auth.mysql.server = localhost:3306
auth.mysql.username = emqx
auth.mysql.password = emqx_password
auth.mysql.database = emqx
auth.mysql.ssl = false
auth.mysql.pool_size = 8
```

### 3. 메시지 전달 규칙
```bash
# /etc/emqx/rules/smartfarm_rule.sql
-- 스마트팜 데이터 처리 규칙
SELECT
    clientid,
    topic,
    payload,
    qos,
    timestamp
FROM "farms/+/+/telemetry"
WHERE
    payload.temperature > 30 OR
    payload.humidity < 40 OR
    payload.ec > 2.5 OR
    payload.ph < 5.5 OR
    payload.ph > 8.5
```

## 🚀 서비스 시작 및 관리

### 1. 서비스 시작
```bash
# 시스템 서비스로 시작
sudo systemctl start emqx
sudo systemctl enable emqx

# 상태 확인
sudo systemctl status emqx

# 로그 확인
sudo journalctl -u emqx -f
```

### 2. 웹 대시보드 접속
```bash
# 브라우저에서 접속
http://localhost:18083
# 기본 계정: admin / public
```

### 3. 연결 테스트
```bash
# MQTT 클라이언트로 테스트
mosquitto_pub -h localhost -u device_user -P device_password -t "farms/farm_001/devices/device_001/telemetry" -m '{"temperature": 25.5, "humidity": 60}'
mosquitto_sub -h localhost -u smartfarm_user -P smartfarm_password -t "farms/+/+/telemetry"
```

## 📊 모니터링 및 메트릭

### 1. Prometheus 연동
```bash
# /etc/emqx/plugins/emqx_prometheus.conf
prometheus.push.gateway.server = http://prometheus:9091
prometheus.push.interval = 15s
prometheus.push.job_name = emqx
prometheus.push.headers = X-Custom-Header: custom-value
```

### 2. 메트릭 수집
```bash
# HTTP API로 메트릭 조회
curl -u admin:public http://localhost:18083/api/v4/metrics
curl -u admin:public http://localhost:18083/api/v4/nodes
curl -u admin:public http://localhost:18083/api/v4/clients
```

## 🔍 문제 해결

### 1. 연결 문제
```bash
# 포트 확인
sudo netstat -tlnp | grep emqx

# 방화벽 설정
sudo ufw allow 1883
sudo ufw allow 8083
sudo ufw allow 8883
sudo ufw allow 18083
```

### 2. 인증 문제
```bash
# 사용자 생성 및 테스트
mosquitto_pub -h localhost -u device_user -P device_password -t "test" -m "test message"
```

### 3. 로그 분석
```bash
# 실시간 로그 모니터링
sudo tail -f /var/log/emqx/emqx.log

# 에러 로그만 확인
sudo grep -i error /var/log/emqx/emqx.log
```

## 🔄 백업 및 복구

### 1. 설정 백업
```bash
sudo tar -czf emqx-backup-$(date +%Y%m%d).tar.gz /etc/emqx/ /var/lib/emqx/
```

### 2. 데이터베이스 백업
```bash
sudo cp /var/lib/emqx/mnesia /backup/emqx-mnesia-$(date +%Y%m%d)
```

## ✅ 설정 검증

### 1. 설정 파일 검증
```bash
emqx console
```

### 2. 연결 테스트
```bash
# 기본 연결 테스트
mosquitto_pub -h localhost -t "test" -m "test message"
mosquitto_sub -h localhost -t "test"

# TLS 연결 테스트
mosquitto_pub -h localhost -p 8883 --cafile ca-cert.pem -t "test" -m "test message"
```

### 3. 성능 테스트
```bash
# 부하 테스트 도구 사용
mqtt-bench --broker tcp://localhost:1883 --clients 1000 --count 1000 --topic "farms/farm_001/devices/+/telemetry"
```

이제 EMQX 브로커가 스마트팜 플랫폼과 완벽하게 연동될 준비가 되었습니다!
