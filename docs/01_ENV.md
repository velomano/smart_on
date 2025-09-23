# 🔧 환경변수 매트릭스

## 📋 환경별 설정

### 🌐 Web Admin (Next.js) - .env.local에 설정됨
```bash
# apps/web-admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDIxOTgsImV4cCI6MjA3NDExODE5OH0.oo-iIviVJ2oaWZldtmkYo1sWgHbxxIIkFUrBrU8rQqY
NEXT_PUBLIC_APP_URL=https://smart-on.vercel.app
```

### 📱 Mobile App (Expo) - app.json에 설정됨
```json
// mobile-app/app.json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://kkrcwdybrsppbsufrrdg.supabase.co",
      "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tuyaAppKey": "we85jqprtfpm5pkmyr53",
      "tuyaAppSecret": "12277a78753f4aaa8d3c8e3beff43632",
      "tuyaRegion": "eu"
    }
  }
}
```

**접근 방법:**
```typescript
// React Native 코드에서
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const tuyaAppKey = Constants.expoConfig?.extra?.tuyaAppKey;
```

### 🍓 Raspberry Pi
```bash
# .env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
PI_ID=unique_pi_identifier
SENSOR_INTERVAL=30  # seconds
```

## 🔑 Tuya SDK 설정

### Android 패키지명 등록
```
패키지명: com.velomano.smartfarm
SHA-256: [Android Studio에서 생성]
```

### AppKey/Secret 발급
- Tuya IoT Platform에서 프로젝트 생성
- Android 앱 등록 후 키 발급
- SHA-256 지문 등록 필수

## 🗄️ Supabase 설정

### 환경별 URL
- **Development**: `https://[project-id].supabase.co`
- **Production**: `https://[project-id].supabase.co`

### 키 타입별 사용
| 키 타입 | 용도 | 권한 |
|---------|------|------|
| `anon` | 클라이언트 앱 | RLS 정책 적용 |
| `service_role` | 서버/Raspberry Pi | 모든 권한 |
| `service_role` | Edge Functions | 모든 권한 |

## 🔒 보안 고려사항

### 클라이언트 환경변수
- `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*` 접두사 사용
- 브라우저에서 노출되므로 민감 정보 제외

### 서버 환경변수
- `SUPABASE_SERVICE_KEY`는 서버에서만 사용
- Raspberry Pi에서는 `.env` 파일 보안 관리

## 📝 설정 체크리스트

### ✅ Phase 0 (Tuya 제어) - 완료
- [x] Tuya IoT Platform 프로젝트 생성
- [x] Android 패키지명 등록 (com.velomano.smartfarm)
- [x] SHA-256 지문 등록
- [x] AppKey/Secret 발급
- [x] Expo 환경변수 설정 (app.json)
- [x] Tuya SDK 네이티브 모듈 구현

### ✅ Phase 1 (웹 어드민) - 완료
- [x] Supabase 프로젝트 생성
- [x] RLS 정책 설정
- [x] 웹 어드민 환경변수 설정 (.env.local)
- [x] API 엔드포인트 확인
- [x] 실제 데이터베이스 구조 연동

### 🔄 Phase 2 (실제 Tuya SDK 연동) - 진행 중
- [ ] Android Studio 설치 및 설정
- [ ] 실제 Tuya SDK 라이브러리 연동
- [ ] 디바이스 등록 및 제어 테스트

### Phase 2 (MQTT 확장)
- [ ] Mosquitto 브로커 설정
- [ ] MQTT 인증 정보
- [ ] 브로커 URL/포트 설정

## ⚠️ 주의사항

1. **환경변수 이름**: 임의로 만들지 말고 문서에 정의된 것만 사용
2. **키 보안**: `.env` 파일은 Git에 커밋하지 않음
3. **환경별 분리**: 개발/스테이징/프로덕션 환경 구분
4. **정기 갱신**: API 키는 정기적으로 갱신 권장
