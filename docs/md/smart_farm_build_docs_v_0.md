# 📦 SmartFarm Build Docs v0.1 — Cursor 실행 패키지

> 목적: Cursor에서 바로 참고·복사·실행 가능한 문서 패키지. 혼선(테이블명/환경변수 누락/권한 등) 최소화를 위해 **파일별로 역할을 고정**합니다. 아래 순서대로 진행하세요.

## 파일 트리
```
docs/
  00_README.md
  01_ENV.md
  02_DB_SCHEMA.sql
  03_RLS_POLICIES.sql
  04_MQTT_BROKER.md
  05_DEVICE_TOPICS.md
  06_API_CONTRACT.md
  07_TUYA_SDK.md
  08_MOBILE_APP_SCAFFOLD.md
  09_WEB_ADMIN_SCAFFOLD.md
  10_CURSOR_WORKFLOW.md
  11_NAMING_CONVENTIONS.md
  12_ACCEPTANCE_CHECKS.md
```

---

## docs/00_README.md — 수행 순서(체크리스트)

### ✅ 완료된 작업 (2025.09.23)
1. **환경변수 준비** → `01_ENV.md` 따라 `.env`, Supabase keys 정리 ✅
2. **DB 스키마 적용** → `02_DB_SCHEMA.sql` 실행 → `03_RLS_POLICIES.sql` 적용 ✅
3. **Tuya SDK 통합** → `07_TUYA_SDK.md`대로 Android/iOS 초기화 및 샘플 제어(on/off) 성공 ✅
4. **앱/웹 스캐폴드** → `08_MOBILE_APP_SCAFFOLD.md`, `09_WEB_ADMIN_SCAFFOLD.md` 반영 ✅
5. **웹 앱 완성** → 모든 핵심 기능 구현 및 테스트 완료 ✅

### 🔄 진행 중인 작업
6. **Android 빌드 문제 해결** → Node.js 경로 설정, Java Runtime 설정 필요
7. **실제 테스트** → Tuya 계정으로 로그인 및 디바이스 제어 테스트

### 📋 남은 작업
8. **라즈베리파이 설정** → `04_RASPBERRY_PI_SETUP.md` 순서대로 로컬 MQTT + REST API 설정
9. **토픽 규약 고정** → `05_DEVICE_TOPICS.md`를 Pi/아두이노 코드에 반영
10. **API 계약/테스트** → `06_API_CONTRACT.md` 명세대로 라우트 구현→`12_ACCEPTANCE_CHECKS.md` 패스
11. **Cursor 워크플로우** → `10_CURSOR_WORKFLOW.md`로 반복 작업 고정

---

## docs/01_ENV.md — 환경변수 매트릭스
> 모든 서비스에 **동일 키 이름** 사용. 로컬(`.env`), CI, Cloudflare Pages/Workers(Secret) 동기화.

### 공통
```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # 서버/워커에서만

# Tuya
TUYA_APP_KEY=
TUYA_APP_SECRET=
TUYA_REGION=eu | us | cn | in  # 실제 콘솔 설정값

# MQTT
MQTT_URL=mqtts://your-broker:8883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CA_CERT_PATH=/etc/mosquitto/certs/ca.crt

# App
API_BASE_URL=https://api.example.com
REALTIME_URL=wss://rt.example.com
SENTRY_DSN=
TZ=Asia/Seoul
```

### Cloudflare Pages/Workers
- **Variables & Secrets**에 위 키 전부 등록. 프리뷰/프로덕션 **둘 다**. (joogo 프로젝트 메모 상기)
- 이름: `OPENAI_API_KEY` 등 필요 시 추가(프리뷰/프로덕션 동일).

### iOS/Android 특이값
- iOS: Bundle ID, App Groups(위젯 사용 시)
- Android: packageName, **SHA-256** 등록 필수

---

## docs/02_DB_SCHEMA.sql — 핵심 테이블
```sql
-- Tenancy
create extension if not exists pgcrypto;
create table if not exists tenants(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);
create table if not exists users(
  id uuid primary key,
  email text unique,
  name text,
  created_at timestamptz default now()
);
create table if not exists memberships(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check(role in('owner','operator','viewer')),
  unique(tenant_id, user_id)
);

-- Domain
create table if not exists farms(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  location text,
  created_at timestamptz default now()
);
create table if not exists beds(
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  name text not null,
  crop text,
  target_temp numeric,
  target_humidity numeric,
  target_ec numeric,
  target_ph numeric,
  created_at timestamptz default now()
);
create table if not exists devices(
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  bed_id uuid references beds(id) on delete set null,
  type text not null check (type in ('switch','pump','fan','light','motor','sensor_gateway')),
  vendor text,
  tuya_device_id text,
  status jsonb,
  meta jsonb,
  created_at timestamptz default now()
);
create table if not exists sensors(
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id) on delete cascade,
  type text not null,
  unit text,
  meta jsonb,
  created_at timestamptz default now()
);
create table if not exists sensor_readings(
  id bigserial primary key,
  sensor_id uuid not null references sensors(id) on delete cascade,
  ts timestamptz not null,
  value numeric not null,
  quality int default 1
);
create index if not exists idx_readings_sensor_ts on sensor_readings(sensor_id, ts desc);

create table if not exists commands(
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id) on delete cascade,
  issued_by uuid references users(id),
  ts timestamptz default now(),
  command text not null,
  payload jsonb,
  status text not null default 'pending',
  correlation_id text unique
);

create table if not exists rules(
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  name text not null,
  trigger jsonb not null,
  condition jsonb,
  action jsonb not null,
  enabled boolean default true,
  version int default 1,
  updated_at timestamptz default now()
);

create table if not exists alerts(
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  bed_id uuid references beds(id) on delete set null,
  severity text check(severity in('info','warning','critical')),
  title text,
  detail text,
  ts timestamptz default now(),
  ack_by uuid references users(id)
);

create table if not exists audits(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  entity text, entity_id uuid,
  action text, diff jsonb,
  ts timestamptz default now()
);
```

---

## docs/03_RLS_POLICIES.sql — RLS 요지
```sql
-- 모든 테이블에 RLS 켜기 (예시: farms)
alter table farms enable row level security;
create policy p_select_farms on farms
  for select using (
    exists(
      select 1 from memberships m
      where m.tenant_id = farms.tenant_id
        and m.user_id = auth.uid()
    )
  );
-- insert/update/delete도 같은 패턴으로 작성
```
> 실제 적용 시, `tenant_id`가 직접 없는 테이블(sensor_readings 등)은 상위 관계를 join하는 보안 view 또는 안전한 RPC로 노출.

---

## docs/04_RASPBERRY_PI_SETUP.md — 라즈베리파이 설정 (로컬 MQTT + REST API)
### 1. 로컬 MQTT 브로커 설치 (아두이노 통신용)
```
sudo apt update && sudo apt install -y mosquitto mosquitto-clients
sudo systemctl enable mosquitto
```
### 2. FastAPI 서버 설치
```
pip install fastapi uvicorn paho-mqtt requests
```
### 3. 기본 설정 파일
```
# /etc/mosquitto/conf.d/local.conf
listener 1883
allow_anonymous true
```
### 4. REST API 서버 (Supabase 연동)
```python
# main.py
from fastapi import FastAPI
import paho.mqtt.client as mqtt
import requests

app = FastAPI()

# MQTT 클라이언트 (아두이노와 통신)
mqtt_client = mqtt.Client()
mqtt_client.connect("localhost", 1883)

# 센서 데이터 수집 및 Supabase 업로드
@app.post("/upload_sensor_data")
async def upload_sensor_data(data: dict):
    # Supabase Edge Function 호출
    response = requests.post("https://your-project.supabase.co/functions/v1/ingest", 
                           json=data)
    return response.json()

# 제어 명령 수신 및 MQTT 전송
@app.post("/control_device")
async def control_device(command: dict):
    # MQTT로 아두이노에 제어 명령 전송
    mqtt_client.publish(f"bed{command['bed_id']}/control/{command['device']}", 
                       command['action'])
    return {"status": "success"}
```

---

## docs/05_DEVICE_TOPICS.md — 토픽 규약 (로컬 MQTT)
- 센서 퍼블리시: `bed{bed_id}/sensor/{type}` → `{ ts, value, unit, q }`
- 제어 커맨드: `bed{bed_id}/control/{device}` → `{ action, args }`
- 디바이스 상태: `bed{bed_id}/status/{device}` → `{ ts, state }`
- QoS: 1 고정, retain은 상태 토픽만
- 예시: `bed1/sensor/temp`, `bed1/control/light`, `bed2/sensor/humidity`

---

## docs/06_API_CONTRACT.md — API 계약(초안)
```
GET  /api/beds?farm_id=...            -> [{ id,name,crop, latest:{temp,hum,ec,ph,lux} }]
GET  /api/beds/:id?from&to&interval   -> 시계열 데이터(다운샘플 포함)
POST /api/commands                    -> { device_id, command, args } => { command_id }
GET  /api/alerts?since=...            -> [{ ... }]
POST /api/rules                       -> 생성/수정
```
응답 공통: `{ data, error, traceId }`

---

## docs/07_TUYA_SDK.md — iOS/Android 통합 체크리스트
### 공통
- Tuya 콘솔 **Get SDK**로 패키지 빌드/다운로드(필요 BizBundle 포함)
- **Get Key**에서 AppKey/AppSecret 확인, iOS Bundle ID/Android packageName 일치

### iOS (CocoaPods)
- `ios_core_sdk.tar.gz`에서 `ThingSmartCryption.podspec`와 `Build` 폴더를 Podfile 옆 위치에 둠
- Podfile 예시, 초기화/디버그 모드/BusinessExtensionKit 사용 예시는 문서 권장안 준수
- 초기화: `ThingSmartSDK.sharedInstance()?.start(withAppKey: secretKey:)`
- 참고: iOS 빠른 통합 가이드, 데모 기능(EZ/AP, Device Control 등)  
  (문서: Fast Integration for iOS v2024-08-26)  

### Android (Gradle)
- 루트 `repositories`에 Tuya Maven 저장소 추가, `implementation 'com.thingclips.smart:thingsmart:6.7.x'`
- `security-algorithm.aar`를 `app/libs`에 추가하고 `implementation fileTree(dir:'libs', include:['*.aar'])`
- `AndroidManifest.xml`에 AppKey/Secret meta-data, **SHA-256 등록**(콘솔)
- 초기화: `ThingHomeSdk.init(this)` (또는 `init(app, key, secret)`), 디버그: `ThingHomeSdk.setDebugMode(true)`
- 오류 대처: `SING_VALIDATE_FALED`, `ILLEGAL_CLIENT_ID`는 대부분 키/패키지명/SHA256 불일치
- 참고: Android 빠른 통합 가이드 v2025-09-17

> 상세 코드/스크린샷은 Tuya 공식 PDF에 따릅니다. (iOS/Android Fast Integration 문서 기준)

---

## docs/08_MOBILE_APP_SCAFFOLD.md — RN/Expo(bare)
- `npx create-expo-app` → `npx expo prebuild` (네이티브 모듈 사용)
- 패키지: react-navigation, react-query(or RTKQ), zustand, react-native-permissions
- 네비게이션: AuthStack → MainTabs(Home, Beds, Scenes, Alerts, Settings)
- Tuya 브릿지: Android/iOS 네이티브 초기화 후 RN 모듈로 DP on/off 호출 래퍼 작성
- 실시간: Supabase Realtime 또는 폴링(배터리 고려)

---

## docs/09_WEB_ADMIN_SCAFFOLD.md — Next.js 14
- UI: Tailwind + shadcn/ui + Recharts
- 페이지: `/dashboard`(KPI 카드, 최근 알람, 최근 명령), `/beds`, `/devices`, `/rules`
- API 클라이언트: Supabase-js + 전용 RPC/뷰 사용

---

## docs/10_CURSOR_WORKFLOW.md — Cursor 작업 규칙
1) **시작 전**: `01_ENV.md`, `11_NAMING_CONVENTIONS.md` 읽고 요약 프롬프트로 **컨텍스트 주입**
2) **브랜치 전략**: `feat/{module}-{ticket}` → PR → squash merge
3) **파일 생성 규칙**: 지정 경로 외 생성 금지. 새 테이블/컬럼은 **md 먼저 수정 후** SQL 작성
4) **수락 기준**: 커밋마다 `12_ACCEPTANCE_CHECKS.md` 해당 섹션 체크
5) **금지**: 임의 테이블명/ENV명 변경, 콘솔 키 미반영 배포
6) **자동 리뷰 프롬프트**:
```
"이 변경이 docs/06_API_CONTRACT.md, docs/02_DB_SCHEMA.sql, docs/11_NAMING_CONVENTIONS.md와 충돌하는지 검토하고, 누락된 ENV가 있으면 실패로 표시하라."
```

---

## docs/11_NAMING_CONVENTIONS.md — 네이밍 규칙
- 테이블: snake_case 단수형(`sensor_readings`는 예외적으로 관용 복수)
- 컬럼: `created_at`, `updated_at`, FK는 `_id`
- 타입 상수: 소문자 문자열(`switch`, `pump` 등)
- 토픽: 소문자, `/` 구분, `{}` 자리표시자

---

## docs/12_ACCEPTANCE_CHECKS.md — 수용 기준
- **DB**: 스키마/인덱스 생성 성공, RLS 기본 정책 적용, 최소 1개 farm/bed/device/sensor/reading 더미 데이터 삽입 성공
- **MQTT**: TLS+Auth로 연결, 센서 퍼블리시/웹 어드민 표시까지 확인, 제어 명령 퍼블리시→파이/아두이노 수신 로그 확인
- **Tuya**: Android on/off 제어 성공(2초 내 반영), iOS 빌드 성공 및 SDK 초기화 로그 확인
- **앱/웹**: 베드 상세 24h 차트 표시, 알람 생성/해제, 명령 재시도/실패 핸들링 로그 확인

