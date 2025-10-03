# 🚀 Universal Bridge 배포 가이드

Go-Live 체크리스트 기반 프로덕션 배포 가이드입니다.

## 📋 **배포 전 체크리스트**

### ✅ **필수 환경변수 설정**
```bash
# JWT & Security
JWT_SECRET=your-super-secure-jwt-secret-key-change-in-production
TOKEN_EXPIRES_IN=24h

# MQTT Configuration
MQTT_URL=wss://mqtt.example.com/mqtt  # 또는 mqtt://host:1883
MQTT_USERNAME=bridge
MQTT_PASSWORD=your-mqtt-password

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Bridge Configuration
BRIDGE_TENANT_ID=00000000-0000-0000-0000-000000000001
LEGACY_MQTT_SUPPORT=true
LOG_LEVEL=info
CORS_ORIGIN=https://your-admin.app
```

### ✅ **헬스체크 엔드포인트**
- `/healthz` - 기본 헬스체크 (200 OK)
- `/ready` - 레디니스 체크 (서비스 상태 포함)

## 🐳 **Docker 배포 (권장)**

### 1. 환경변수 설정
```bash
cp env.production.template .env.production
# .env.production 파일을 편집하여 실제 값으로 변경
```

### 2. Docker 이미지 빌드
```bash
docker build -t universal-bridge:latest .
```

### 3. 서비스 시작
```bash
docker-compose -f docker-compose.production.yml up -d
```

### 4. 헬스체크 확인
```bash
curl http://localhost:8080/healthz
curl http://localhost:8080/ready
```

## ☁️ **Railway 배포**

### 1. Railway CLI 설치
```bash
npm install -g @railway/cli
```

### 2. 프로젝트 연결
```bash
railway login
railway link
```

### 3. 환경변수 설정
```bash
railway variables set JWT_SECRET="your-jwt-secret"
railway variables set MQTT_URL="mqtt://your-mqtt-broker:1883"
railway variables set SUPABASE_URL="https://your-project.supabase.co"
railway variables set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 4. 배포
```bash
railway up
```

## 🪰 **Fly.io 배포**

### 1. Fly CLI 설치
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. 로그인
```bash
fly auth login
```

### 3. 앱 생성
```bash
fly apps create universal-bridge
```

### 4. 환경변수 설정
```bash
fly secrets set JWT_SECRET="your-jwt-secret"
fly secrets set MQTT_URL="mqtt://your-mqtt-broker:1883"
fly secrets set SUPABASE_URL="https://your-project.supabase.co"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 5. 배포
```bash
fly deploy
```

## ▲ **Vercel 배포**

### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 2. 프로젝트 연결
```bash
vercel login
vercel link
```

### 3. 환경변수 설정 (Vercel Dashboard)
- `JWT_SECRET`
- `MQTT_URL` (wss:// 형태로 설정)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. 배포
```bash
vercel --prod
```

## 🔧 **배포 타입별 MQTT 설정**

### Railway/Fly.io/VM (TCP MQTT)
```bash
MQTT_URL=mqtt://mqtt-broker:1883
```

### Vercel (WebSocket MQTT)
```bash
MQTT_URL=wss://mqtt-broker:8083/mqtt
```

## 📊 **모니터링 및 로그**

### 헬스체크
```bash
# 기본 헬스체크
curl https://your-bridge-domain.com/healthz

# 레디니스 체크
curl https://your-bridge-domain.com/ready
```

### 로그 확인
```bash
# Docker
docker-compose logs -f universal-bridge

# Railway
railway logs

# Fly.io
fly logs

# Vercel
vercel logs
```

## 🚨 **문제 해결**

### 일반적인 문제들

1. **헬스체크 실패**
   - 환경변수 설정 확인
   - 포트 설정 확인
   - 데이터베이스 연결 상태 확인

2. **MQTT 연결 실패**
   - MQTT_URL 형식 확인 (TCP vs WebSocket)
   - 인증 정보 확인
   - 방화벽 설정 확인

3. **JWT 토큰 오류**
   - JWT_SECRET 설정 확인
   - 토큰 만료 시간 확인

### 롤백 절차
```bash
# Docker
docker-compose down
docker-compose -f docker-compose.backup.yml up -d

# Railway
railway rollback

# Fly.io
fly releases
fly releases rollback <version>

# Vercel
vercel rollback
```

## 📈 **성능 최적화**

### 프로덕션 권장 설정
```bash
LOG_LEVEL=info  # debug/trace는 개발용
RATE_LIMIT_DEVICE=60
RATE_LIMIT_TENANT=1000
FORCE_HTTPS=true
SECURITY_HEADERS=true
```

### 리소스 모니터링
- CPU 사용률 < 70%
- 메모리 사용률 < 80%
- 응답 시간 < 500ms
- 에러율 < 1%

## 🔐 **보안 체크리스트**

- [ ] JWT_SECRET이 충분히 복잡한지 확인
- [ ] HTTPS 강제 설정
- [ ] CORS 설정이 올바른지 확인
- [ ] 민감한 정보가 환경변수에만 있는지 확인
- [ ] 데이터베이스 접근 권한 최소화
- [ ] 로그에 민감한 정보가 포함되지 않았는지 확인

## 📞 **지원**

문제가 발생하면 다음을 확인해주세요:
1. 헬스체크 엔드포인트 상태
2. 환경변수 설정
3. 로그 파일
4. 네트워크 연결 상태

---

**🎉 성공적인 배포를 위해 위의 체크리스트를 모두 확인해주세요!**
