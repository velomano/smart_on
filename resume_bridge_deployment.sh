#!/bin/bash

# 🌉 Universal Bridge 프로덕션 배포 재개 스크립트
# 실행 전 저장공간 정리가 완료되어야 함

echo "🚀 Universal Bridge 프로덕션 배포 재개 시작..."

# 1. 현재 상태 확인
echo "📋 현재 상태 확인:"
echo "브랜치: $(git branch --show-current)"
echo "Vercel 연결: $(ls -la .vercel 2>/dev/null && echo "✅ 연결됨" || echo "❌ 연결 안됨")"

# 2. 디스크 공간 확인
echo "💾 디스크 공간 확인:"
df -h | head -2

# 3. 저장공간 정리 (추가)
echo "🧹 추가 저장공간 정리..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf .next
rm -rf apps/*/.next
rm -rf apps/*/dist
rm -rf dist

# pnpm 캐시 정리
echo "🗑️ pnpm 캐시 정리..."
pnpm store prune

# 4. 현재 작업 커밋
echo "💾 현재 작업 커밋..."
git add .
git commit -m "feat: Universal Bridge healthcheck endpoints ready for deployment"

# 5. 브랜치 푸시
echo "📤 브랜치 푸시..."
git push origin feat/bridge-prod-deploy

# 6. Vercel 프로덕션 배포
echo "🚀 Vercel 프로덕션 배포..."
vercel --prod

# 7. 배포 완료 확인
echo "✅ 배포 완료! 다음 단계:"
echo "1. 배포 URL에서 /bridge 엔드포인트 테스트"
echo "2. 커스텀 도메인 연결"
echo "3. Web Admin 연동 테스트"

echo "🎉 Universal Bridge 프로덕션 배포 준비 완료!"
