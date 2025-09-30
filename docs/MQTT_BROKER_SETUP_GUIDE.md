# 🚀 MQTT 브로커 설정 가이드

## 📋 개요

이 가이드는 스마트팜 플랫폼과 연동하기 위한 **MQTT 브로커 설정 방법**을 제공합니다. 디바이스에서 데이터를 수집하고 우리 MQTT 브리지와 통신할 수 있도록 브로커를 구성하는 완전한 가이드입니다.

## 🏗️ 아키텍처 개요

```
디바이스/센서 → MQTT 브로커 → 스마트팜 MQTT 브리지 → Supabase → 웹 대시보드
```

### 역할 분담:
- **MQTT 브로커**: 디바이스와 스마트팜 브리지 간의 중계 역할
- **디바이스**: 센서 데이터 발행, 명령 수신
- **스마트팜 브리지**: 브로커에서 데이터 구독, 명령 발행

## 🔧 지원하는 MQTT 브로커

### 1. **Eclipse Mosquitto** (추천)
- 가장 널리 사용되는 오픈소스 브로커
- 경량화되고 안정적
- TLS/SSL 지원

### 2. **EMQX**
- 고성능 엔터프라이즈급 브로커
- 클러스터링 지원
- 웹 대시보드 제공

### 3. **HiveMQ**
- 상용 브로커
- 고급 기능 제공
- 엔터프라이즈 지원

### 4. **AWS IoT Core**
- 클라우드 서비스
- 관리형 서비스
- 확장성 우수

## 📡 토픽 구조 요구사항

스마트팜 플랫폼은 다음 토픽 구조를 사용합니다:

```
farms/{farm_id}/devices/{device_id}/{message_type}
```

### 지원하는 메시지 타입:
- `registry` - 디바이스 등록 정보
- `state` - 디바이스 상태
- `telemetry` - 센서 데이터
- `command` - 제어 명령
- `command/ack` - 명령 확인 응답

## 🔐 인증 및 보안

### 1. **사용자 인증**
```bash
# Mosquitto 사용자 생성
mosquitto_passwd -c /etc/mosquitto/passwd smartfarm_user
```

### 2. **ACL (Access Control List)**
```bash
# /etc/mosquitto/acl.conf
user smartfarm_user
topic read farms/+/+/telemetry
topic read farms/+/+/state
topic read farms/+/+/registry
topic read farms/+/+/command/ack
topic write farms/+/+/command
```

### 3. **TLS/SSL 설정**
```bash
# 인증서 생성 (Let's Encrypt 또는 자체 인증서)
openssl req -x509 -newkey rsa:2048 -keyout broker.key -out broker.crt -days 365 -nodes
```

## 🚀 브로커별 설정 가이드

다음 섹션에서 각 브로커의 상세 설정 방법을 제공합니다.
