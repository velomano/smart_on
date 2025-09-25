# 🎨 UI/UX 디자인 시스템

## 📋 개요
스마트팜 프로젝트의 일관된 UI/UX 디자인 시스템 문서입니다.

## 🚀 최신 업데이트 (2025.01.15)
- ✅ 사용자 권한 시스템 UI 완료 (시스템 관리자, 농장장, 팀원)
- ✅ 농장 관리 페이지 UI 완료 (다중 농장, 베드 관리)
- ✅ 팀원 관리 페이지 UI 완료
- ✅ Mock 인증 시스템 UI 완료
- ✅ 반응형 디자인 최적화 완료

## 🎯 디자인 철학
- **Modern & Clean**: 현대적이고 깔끔한 디자인
- **Glassmorphism**: 반투명 배경과 블러 효과
- **Gradient**: 그라데이션을 활용한 다채로운 색상
- **Interactive**: 호버 효과와 애니메이션
- **Responsive**: 모든 디바이스에서 최적화

## 🎨 컬러 팔레트

### Primary Colors
- **Blue**: `#3B82F6` (Primary buttons, links)
- **Green**: `#10B981` (Success, active states)
- **Purple**: `#8B5CF6` (Accent, special elements)
- **Orange**: `#F97316` (Warning, temperature)
- **Red**: `#EF4444` (Error, danger)

### Gradient Combinations
```css
/* Header Logo */
background: linear-gradient(to bottom right, #10B981, #3B82F6)

/* Primary Button */
background: linear-gradient(to right, #3B82F6, #1D4ED8)

/* Success Button */
background: linear-gradient(to right, #10B981, #059669)

/* Warning Button */
background: linear-gradient(to right, #F97316, #EA580C)

/* Danger Button */
background: linear-gradient(to right, #EF4444, #DC2626)
```

## 🏗️ 레이아웃 구조

### Background
```css
background: linear-gradient(to bottom right, #F8FAFC, #E0F2FE, #E0E7FF)
```

### Card Design
```css
/* Glassmorphism Cards */
background: rgba(255, 255, 255, 0.7)
backdrop-filter: blur(10px)
border: 1px solid rgba(255, 255, 255, 0.2)
border-radius: 1rem
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

### Hover Effects
```css
/* Card Hover */
transform: translateY(-4px)
box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.3)
transition: all 0.3s ease

/* Button Hover */
transform: translateY(-2px)
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

## 📱 컴포넌트 디자인

### 1. Header
- **Sticky Navigation**: `position: sticky`
- **Glassmorphism**: 반투명 배경 + 블러
- **Logo**: 그라데이션 아이콘 + 텍스트
- **Status Indicator**: 실시간 상태 표시

### 2. Stats Cards
- **Icon Container**: 64px × 64px 그라데이션 원형
- **Typography**: 
  - Title: `font-black text-3xl`
  - Subtitle: `font-semibold uppercase tracking-wide`
- **Additional Info**: 목표, 활성률, 총 인원 등

### 3. Farm Cards
- **Nested Layout**: 농장 → 디바이스 → 센서
- **Status Badges**: 온라인/오프라인 상태 표시
- **Action Buttons**: 설정, 추가 버튼

### 4. Activity Cards
- **Real-time Indicator**: 펄스 애니메이션
- **Data Visualization**: 큰 숫자로 값 표시
- **Timestamp**: 상대적 시간 표시

## 🎭 애니메이션

### Loading States
```css
/* Pulse Animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Spin Animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Hover Animations
```css
/* Scale on Hover */
transform: scale(1.05)
transition: transform 0.2s ease

/* Lift on Hover */
transform: translateY(-4px)
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

## 📐 스페이싱 시스템

### Padding/Margin Scale
- `p-2` (8px) - Small elements
- `p-4` (16px) - Standard elements
- `p-6` (24px) - Large elements
- `p-8` (32px) - Extra large elements

### Border Radius
- `rounded-xl` (12px) - Cards
- `rounded-2xl` (16px) - Large cards
- `rounded-full` - Buttons, badges

## 🔤 타이포그래피

### Font Weights
- `font-medium` (500) - Subtitles
- `font-semibold` (600) - Labels
- `font-bold` (700) - Headings
- `font-black` (900) - Large numbers

### Font Sizes
- `text-xs` (12px) - Small labels
- `text-sm` (14px) - Body text
- `text-base` (16px) - Standard text
- `text-lg` (18px) - Large text
- `text-xl` (20px) - Section titles
- `text-2xl` (24px) - Card titles
- `text-3xl` (32px) - Large numbers

## 🎯 상태 표시

### Online/Offline Status
```css
/* Online */
background: #DCFCE7
color: #166534
border: 1px solid #BBF7D0

/* Offline */
background: #FEE2E2
color: #991B1B
border: 1px solid #FECACA
```

### Loading States
```css
/* Pulse Dot */
width: 8px
height: 8px
background: #10B981
border-radius: 50%
animation: pulse 2s infinite
```

## 📱 반응형 디자인

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Grid Layouts
```css
/* Mobile First */
grid-cols-1

/* Tablet */
md:grid-cols-2

/* Desktop */
lg:grid-cols-3
xl:grid-cols-4
```

## 🎨 아이콘 시스템

### Emoji Icons
- 🏠 농장/홈
- 🌱 식물/베드
- 👥 팀/사용자
- 🌡️ 온도
- 📊 데이터/활동
- 📡 디바이스
- 💡 조명/전원
- 🔌 연결

### Icon Containers
```css
/* Standard Icon Container */
width: 48px
height: 48px
border-radius: 12px
background: linear-gradient(135deg, color1, color2)
display: flex
align-items: center
justify-content: center
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
```

## 🚀 구현 가이드라인

### 1. 일관성 유지
- 모든 카드는 동일한 `border-radius` 사용
- 그라데이션은 미리 정의된 조합만 사용
- 호버 효과는 통일된 애니메이션 사용

### 2. 접근성 고려
- 충분한 색상 대비 확보
- 키보드 네비게이션 지원
- 스크린 리더 호환성

### 3. 성능 최적화
- CSS 애니메이션 사용 (JavaScript 대신)
- 적절한 `will-change` 속성 사용
- 불필요한 리렌더링 방지

## 📝 사용 예시

### React Component Structure
```jsx
<div className="bg-white/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
  <div className="p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-3xl">🏠</span>
        </div>
        <div className="ml-4">
          <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            총 농장 수
          </dt>
          <dd className="text-3xl font-black text-gray-900">{totalFarms}</dd>
        </div>
      </div>
    </div>
  </div>
</div>
```

## 🔄 업데이트 이력

### v1.0.0 (2024-09-23)
- 초기 디자인 시스템 구축
- Glassmorphism 테마 적용
- 그라데이션 컬러 팔레트 정의
- 반응형 레이아웃 구현
- 호버 애니메이션 추가

---

**이 디자인 시스템을 모든 프로젝트에서 일관되게 사용하여 통일된 사용자 경험을 제공합니다.**
