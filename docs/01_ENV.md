# 🔧 환경변수 매트릭스

## 📋 환경별 설정

### 🌐 Web Admin (Next.js)
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://smart-on.vercel.app
```

### 📱 Mobile App (Expo)
```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_TUYA_APP_KEY=your_tuya_app_key
EXPO_PUBLIC_TUYA_APP_SECRET=your_tuya_app_secret
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

### Phase 0 (Tuya 제어)
- [ ] Tuya IoT Platform 프로젝트 생성
- [ ] Android 패키지명 등록
- [ ] SHA-256 지문 등록
- [ ] AppKey/Secret 발급
- [ ] Expo 환경변수 설정

### Phase 1 (센서 수집)
- [ ] Supabase 프로젝트 생성
- [ ] RLS 정책 설정
- [ ] Raspberry Pi 환경변수 설정
- [ ] API 엔드포인트 확인

### Phase 2 (MQTT 확장)
- [ ] Mosquitto 브로커 설정
- [ ] MQTT 인증 정보
- [ ] 브로커 URL/포트 설정

## ⚠️ 주의사항

1. **환경변수 이름**: 임의로 만들지 말고 문서에 정의된 것만 사용
2. **키 보안**: `.env` 파일은 Git에 커밋하지 않음
3. **환경별 분리**: 개발/스테이징/프로덕션 환경 구분
4. **정기 갱신**: API 키는 정기적으로 갱신 권장
