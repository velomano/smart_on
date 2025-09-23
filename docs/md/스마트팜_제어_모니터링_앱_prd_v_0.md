# 1. 목표
스마트 스위치(투야), 라즈베리 파이, 아두이노(센서 허브)로 구성된 스마트팜의 조명·팬·모터 등을 안정적으로 원격 제어하고, 여러 베드의 센서 데이터를 수집·분석·경보·자동화를 제공하는 모바일 앱과 웹 어드민을 구축한다. 다사용자(조직) 환경에서 하나의 스마트 스위치를 공동 사용 가능하도록 권한/공유 모델을 설계한다.

# 2. 핵심 요구사항
- 다베드(‘베드’) 모니터링 대시보드: 온습도, 조도, CO₂, EC, pH, 수온 등 실시간/히스토리 시각화
- 제어: 조명/팬/모터/펌프 수동 제어, 스케줄, 조건 기반 자동화(규칙/장면)
- 다사용자 접근: 조직(팜) 단위의 역할 기반 접근제어(RBAC), 기기 공유 및 감사 로그
- 투야 스마트 스위치 연동: Tuya App SDK 기반 페어링/제어, 다사용자 사용을 위한 공유 전략
- 센서 인입: 아두이노→라즈베리 파이 게이트웨이→MQTT→수집 API→DB 적재
- 경보: 임계치/이상 패턴 감지, 푸시 알림/이메일/웹 알림
- 오프라인/복구: 게이트웨이 로컬 버퍼링→연결 회복 시 재전송, 명령 큐 재시도
- 감사/감사성: 모든 제어/규칙 변경/임계치 수정을 이벤트로 기록

# 3. 사용자 및 시나리오
- 관리자(Owner): 팜 생성, 사용자 초대, 기기 등록/공유, 규칙 템플릿 관리
- 오퍼레이터(Operator): 대시보드 모니터링, 수동 제어, 스케줄 실행/일시정지, 경보 처리
- 뷰어(Viewer): 읽기 전용 모니터링
주요 시나리오: 베드별 상태 확인→이상 감지 알림→원격 제어 또는 자동화 규칙 발동→이력 검토/리포트 출력

# 4. 아키텍처 개요
클라이언트: React Native(Expo prebuild/bare) 앱, Next.js 웹 어드민
백엔드: Supabase(PostgreSQL+Auth+Storage+Edge Functions), MQTT Broker(모스키토), Ingest Worker(수집·정규화)
디바이스: Tuya 스위치(클라우드 제어), 아두이노 센서, 라즈베리 파이 게이트웨이(MQTT 퍼블리셔)

데이터 플로우
1) 센서→아두이노→라즈베리 파이: 주기采集→MQTT 퍼블리시(topic: farm/{farm_id}/bed/{bed_id}/sensor/{type})
2) MQTT→Ingest Worker: 구독→검증/단위변환→Supabase REST/RPC로 적재
3) 앱/웹: Supabase Realtime/REST 쿼리→차트·카드 표시
4) 제어: 앱/웹→Tuya SDK(클라우드)로 스위치 제어, 비Tuya 액추에이터는 MQTT 커맨드 라우팅

# 5. 스택 제안
- 모바일: React Native + Expo prebuild(bare) + Tuya App SDK(iOS/Android 브릿지)
- 웹 어드민: Next.js 14 + TypeScript + Tailwind + shadcn/ui + Recharts
- 백엔드: Supabase(Postgres, Row Level Security, Edge Functions), Redis(옵션, 큐/캐시)
- IoT: Mosquitto MQTT, 라즈베리 파이 Python 퍼블리셔, 아두이노 센서 펌웨어

# 6. 투야 다사용자 전략
옵션 A. 투야 “Home/Family” 공유 API 사용
- 조직 소유 Tuya 계정 1개에 기기를 귀속, 사용자 초대/공유를 Tuya 측에서 수행
- 장점: 제어 안정성, 공식 공유 모델
- 단점: 계정 관리 복잡성, 일부 공유 한계
옵션 B. 내부 RBAC + 서버 사이드 프록시 제어
- 서버가 조직 대표 Tuya 계정으로 제어 API 호출, 앱 사용자는 내부 권한으로 승인
- 장점: 사내 RBAC 유연성, 세밀한 감사 가능
- 단점: 서버 토큰 보안, 호출 쏠림 방지 설계 필요
권장: A+B 혼합. 즉시 가동은 A, 장기적으로 B를 병행해 세밀한 권한과 감사 지원

# 7. 데이터 모델(초안, Supabase)
- tenants(id, name)
- users(id, email, name)
- memberships(id, tenant_id, user_id, role[owner|operator|viewer])
- farms(id, tenant_id, name, location)
- beds(id, farm_id, name, crop, target_temp, target_humidity, target_ec, target_ph)
- devices(id, farm_id, bed_id, type[switch|pump|fan|light|motor|sensor_gateway], vendor[tuya|custom], tuya_device_id, status, meta JSONB)
- sensors(id, device_id, type[temp|hum|co2|ec|ph|lux|water_temp], unit, meta JSONB)
- sensor_readings(id, sensor_id, ts, value, quality)
- commands(id, device_id, issued_by, ts, command, payload JSONB, status[pending|sent|acked|failed], correlation_id)
- rules(id, farm_id, name, trigger JSONB, condition JSONB, action JSONB, enabled)
- alerts(id, farm_id, bed_id, severity, title, detail, ts, ack_by)
- audits(id, user_id, entity, entity_id, action, diff JSONB, ts)
인덱스: sensor_readings(sensor_id, ts DESC), commands(device_id, ts DESC), alerts(farm_id, ts DESC)
RLS 핵심: 모든 테이블 tenant_id 경유 필터, role별 CRUD 제한

# 8. MQTT 토픽/메시지 규약
- 센서 퍼블리시: farm/{farm_id}/bed/{bed_id}/sensor/{type}
  payload: { ts, value, unit, q }
- 제어 커맨드: farm/{farm_id}/device/{device_id}/cmd
  payload: { command: "on|off|set_pwm|set_speed", args: {...}, correlation_id }
- 디바이스 상태 리포트: farm/{farm_id}/device/{device_id}/state
  payload: { ts, state: {...} }

# 9. 자동화 규칙(예)
- if bed.temp > target_temp + 1.0 for 5m → turn_on(fan)
- if bed.ec < target_ec_min → schedule(pump, duration=30s)
- 일출/일몰 스케줄 기반 조명 on/off
- 양액 순환 타임테이블
규칙 엔진 처리 순서: 트리거 수신→조건 평가→중복 억제(idempotency: correlation_id)→명령 큐잉→성공/실패 이벤트→알림

# 10. 모바일 앱 UX 흐름
온보딩: 로그인→테넌트 선택/초대 수락→기기 권한(BLE/Wi-Fi/푸시)
홈: 전체 팜 KPI 카드(경보, 현재 가동중 장비 수, 평균 온습도)
베드 리스트: 각 베드 카드(색 상태, 임계치 경보 점 등)
베드 상세: 실시간 차트, 오늘의 자동화 로그, 액추에이터 패널(스위치/팬/펌프)
장면/스케줄: 장면 실행, 예약 캘린더
알림센터: 경보, 규칙 실행 이벤트
설정: 기기 공유, 임계치, 규칙 템플릿, 펌웨어/앱 버전

# 11. 웹 어드민 UX
대시보드: 팜/베드 KPI, 알림 타임라인, 최근 커맨드 성공률
데이터 탐색: 센서 히스토리, 필터/다운로드(CSV)
규칙/스케줄 관리: 생성/버전/활성화, A/B 비교(옵션)
기기 관리: Tuya 연동 상태, 펌프/팬/라이트, 베드 매핑
사용자/권한: 초대, 역할 변경, 감사 로그
리포트: 일/주/월 요약, 알람/가동 시간/전력 추정(옵션)

# 12. 보안/안정성
- 앱→서버 통신: JWT, 최소 권한, 레이트 리밋, 서명된 커맨드
- Tuya 제어: 서버 보관 자격증명은 KMS/Secret Manager, 단기 토큰 갱신
- MQTT: TLS, 사용자/비밀번호, 주제 기반 ACL
- Idempotency: commands.correlation_id 고유성, 재시도 백오프
- 로컬 버퍼: 라즈베리 파이 단절 시 파일 큐에 임시 저장

# 13. 개발 단계(마일스톤)
M1 기초 인프라: Supabase 스키마/RLS, MQTT 브로커, 라즈베리 파이 퍼블리셔 PoC
M2 Tuya 연동: SDK 통합, 기기 등록/공유, on/off 제어 성공
M3 데이터 수집: 센서→MQTT→DB 파이프라인, 웹 차트
M4 제어 UI: 베드 상세 제어 패널, 명령 큐/상태 표시
M5 자동화: 임계치 규칙, 스케줄러, 알림
M6 운영/보안: 감사 로그, 백업/모니터링, 성능 튜닝

# 14. 수용 기준(샘플)
- 베드 상세에서 온습도·EC·pH 실시간/24h 차트 렌더링
- 스위치 on/off 명령 2초 이내 반영, 실패 시 재시도/알림
- 다사용자에서 동일 기기에 대한 동시 제어 충돌 방지(락 또는 마지막 승리 정책)
- 경보 임계치 변경 이력 기록 및 복구

# 15. 기술 구현 메모
- Expo bare 전환 후 Tuya 네이티브 모듈 연결(iOS/Android 분리 빌드)
- Supabase Edge Function으로 MQTT→HTTP 적재 엔드포인트 구성 또는 Ingest Worker에서 직접 PostgREST 호출
- 차트: Recharts(웹), Victory/React Native Skia(모바일) 옵션
- 시간대: Asia/Seoul 고정, 서버 UTC 저장

# 16. 다음 실행 액션
- Supabase DB 마이그레이션 초안 생성
- RN 앱 뼈대 생성(로그인, 테넌트 선택, 홈/베드 화면)
- Tuya SDK 초기화 코드 삽입 및 샘플 기기 on/off 테스트
- MQTT 브로커 설치 및 파이 퍼블리셔 스크립트 준비
- 웹 어드민 보일러플레이트 생성(대시보드+차트 1종)



# 17. 비기능 요구사항(NFR)
- 안정성: 제어 명령 성공률 ≥ 99.5%, 평균 왕복 지연 2초 이내(클라우드 경로 기준)
- 확장성: 베드 최대 50개, 센서 타입 10종, 1초/베드 주기 입력 시 1일 ≥ 4.32M 포인트 저장 가능(배치 업서트)
- 보안: 테넌트 격리 RLS 100%, 기기 제어 서버사이드 서명 필수, 비밀키 KMS 저장
- 가용성: 백엔드 SLO 99.9%, MQTT 브로커 이중화(옵션)
- 관측성: 앱·워크커·엣지 함수에 구조화 로그, 트레이스 ID, 알람 룰

# 18. 환경/비밀키 매트릭스
- Supabase: URL, ANON KEY, SERVICE KEY(서버만)
- Tuya: APP_KEY, APP_SECRET, REGION
- MQTT: BROKER_URL, USER, PASSWORD, TLS_CERT
- 앱: SENTRY_DSN(옵션), API_BASE_URL, REALTIME_URL
- Cloudflare Pages/Workers 배포 시 프로덕션/프리뷰 모두 SECRET 설정 상기

# 19. RBAC 및 기기 공유 상세
- memberships.role: owner, operator, viewer
- server-side 정책: commands insert 권한은 operator 이상, rules 수정은 owner만
- Tuya 공유: 조직 대표 Tuya 계정에 기기 귀속→Tuya Family API로 사용자 초대, 내부 DB에도 공유 기록을 동기화
- 서버 프록시 제어: 앱은 device_id만 전송, 서버가 Tuya device_id 매핑 후 제어 수행

# 20. 데이터 모델 보강
- devices.meta 예시: {"channel":"relay1","max_current":10,"location":"rack-3"}
- rules.trigger 예시: {"type":"threshold","metric":"temp","operator":">","value":28,"duration":"5m"}
- rules.action 예시: {"type":"switch","device_id":"...","command":"on","args":{}}
- alerts.severity: info, warning, critical

# 21. SQL 스키마 스케치
```sql
-- 핵심 테이블 일부
create table tenants(id uuid primary key default gen_random_uuid(), name text not null);
create table farms(id uuid primary key default gen_random_uuid(), tenant_id uuid references tenants(id), name text, location text);
create table beds(id uuid primary key default gen_random_uuid(), farm_id uuid references farms(id), name text, crop text,
  target_temp numeric, target_humidity numeric, target_ec numeric, target_ph numeric);
create table devices(id uuid primary key default gen_random_uuid(), farm_id uuid references farms(id), bed_id uuid references beds(id),
  type text check (type in ('switch','pump','fan','light','motor','sensor_gateway')),
  vendor text, tuya_device_id text, status jsonb, meta jsonb, created_at timestamptz default now());
create table sensors(id uuid primary key default gen_random_uuid(), device_id uuid references devices(id), type text, unit text, meta jsonb);
create table sensor_readings(
  id bigint generated by default as identity primary key,
  sensor_id uuid references sensors(id), ts timestamptz not null, value numeric, quality int default 1
);
create index on sensor_readings(sensor_id, ts desc);
create table commands(
  id uuid primary key default gen_random_uuid(), device_id uuid references devices(id), issued_by uuid,
  ts timestamptz default now(), command text, payload jsonb, status text, correlation_id text unique
);
```

# 22. Supabase RLS 요지
- 모든 테이블은 tenant_id를 상위 관계를 통해 유도 가능하도록 뷰 또는 함수에서 강제
- 정책 예: current_setting('request.jwt.claims.tenant_id') = row_tenant_id(row)
- 안전한 insert: 서버 Edge Function만 SERVICE KEY로 실행, 클라이언트는 제한적 read

# 23. API 계약(초안)
- GET /api/beds?farm_id=... → [{id,name,crop,latest:{temp,hum,ec,ph,lux}}]
- GET /api/beds/{id} → 시계열 데이터 범위 from,to,interval 지원
- POST /api/commands → {device_id, command, args} 응답 {command_id}
- GET /api/alerts?since=...
- POST /api/rules → 규칙 생성/수정, 버전 필드 포함

# 24. MQTT 브로커 구성
- Mosquitto 기본 + TLS(레츠엔크립트), 사용자/비밀번호 파일, 토픽 ACL
- 예 ACL: user tenantA → topic read farm/tenantA/#, write farm/tenantA/+/cmd
- QoS: 센서=1, 제어 명령=1, 상태=1, Retain=최근 상태 유지 토픽만

# 25. 라즈베리 파이 퍼블리셔 스켈레톤
```python
# publish.py
import time, json, paho.mqtt.client as mqtt
import random
client = mqtt.Client()
client.username_pw_set("USER","PASS")
client.connect("broker.local", 8883)
while True:
  payload = {"ts": int(time.time()*1000), "value": 23.5+random.random(), "unit":"C"}
  client.publish("farm/{farm}/bed/{bed}/sensor/temp", json.dumps(payload), qos=1)
  time.sleep(5)
```

# 26. 모바일 앱 구조 제안
- stacks: AuthStack, MainTabs(Home, Beds, Scenes, Alerts, Settings)
- 상태: RTK Query 또는 React Query + Zustand(로컬)
- 실시간: Supabase Realtime 구독 or 폴링(모바일 배터리 고려)
- 접근성: 큰 버튼, 오프라인 배지, 오류 토스트

# 27. 네이티브 초기화 스니펫
- Android Application
```kotlin
class App: Application(){
  override fun onCreate(){
    super.onCreate()
    TuyaHomeSdk.init(this)
    TuyaHomeSdk.setDebugMode(true)
    TuyaHomeSdk.initWithAppKey(this, BuildConfig.TUYA_APP_KEY, BuildConfig.TUYA_APP_SECRET)
  }
}
```
- iOS AppDelegate
```swift
import ThingSmartBaseKit
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    ThingSmartSDK.sharedInstance().start(withAppKey: TUYA_APP_KEY, secretKey: TUYA_APP_SECRET)
    return true
  }
}
```

# 28. 자동화 엔진 설계
- 입력: 센서 이벤트 스트림, 스케줄 타이머
- 평가: 룰 그래프(순차/AND/OR), 히스테리시스, 디바운스(예: 5분 지속 시 실행)
- 실행: commands insert→워커 소비→Tuya 제어 or MQTT 퍼블리시
- 중복 방지: correlation_id = hash(rule_id, window, device_id)

# 29. 테스트/운영 체크리스트
- 단위: 규칙 평가, 커맨드 큐, Tuya API 클라이언트 모킹
- 통합: 라즈베리 파이→MQTT→DB 파이프라인, 고부하(초당 N개)
- e2e: 베드 화면에서 on/off→상태 반영까지 2초 내
- 관측: 대시보드에 집계 카드, 실패율/지연 차트
- 백업: DB 스냅샷, 규칙/설정 내보내기

# 30. 7일 실행 플랜
D1 Supabase 스키마/RLS 초안 적용, Mosquitto 설치
D2 라즈베리 파이 퍼블리셔 PoC, 웹 어드민 보일러플레이트
D3 Tuya SDK 안드 통합, 샘플 스위치 on/off 성공
D4 iOS 통합, TestFlight 빌드
D5 센서 히스토리 차트, 알람 생성
D6 규칙 엔진 M1, 명령 큐/재시도
D7 종합 리그레션, 문서화/운영 대시보드

