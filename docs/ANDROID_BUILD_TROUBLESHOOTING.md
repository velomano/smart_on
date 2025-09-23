# 🛠️ Android 빌드 문제 해결 가이드

## 📋 문제 상황 (2025.09.23)

### 🚨 발생한 오류들
1. **Kotlin 버전 호환성 오류**
   - `Class 'kotlin.collections.CollectionsJVMKt' was compiled with an incompatible version of Kotlin. The binary version of its metadata is 1.9.0, expected version is 1.7.1.`

2. **Gradle 버전 호환성 문제**
   - Gradle 8.5에서 React Native Gradle Plugin과 Kotlin 버전 충돌

3. **Expo CLI 버전 문제**
   - `unknown command 'export:embed'` 오류
   - 구버전 글로벌 expo-cli와 최신 @expo/cli 충돌

4. **React 버전 충돌**
   - `react@19.1.0` vs `react-dom@19.1.1` 버전 불일치
   - `@expo/webpack-config`가 React 18.2 계열을 요구

5. **native_modules.gradle 경로 문제**
   - `@react-native-community/cli-platform-android/native_modules.gradle` 파일을 찾을 수 없음
   - 최신 Expo에서는 Expo autolinking을 사용해야 함

## 🔧 해결 과정

### Step 1: Gradle 버전 다운그레이드
```bash
# mobile-app/android/gradle/wrapper/gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-7.6.3-all.zip
```

**이유**: Gradle 8.5는 Kotlin 1.9.0을 사용하지만 React Native Gradle Plugin은 Kotlin 1.7.1을 기대함

### Step 2: Expo CLI 문제 해결
```bash
# 전역 구 CLI 제거
npm uninstall -g expo-cli

# 로컬 최신 CLI 설치
npm i -D @expo/cli

# 패키지 충돌 해결을 위해 설치 없이 직접 실행
npx --yes --package=@expo/cli@latest expo export:embed --platform android
```

**이유**: 글로벌 expo-cli가 구버전이라 `export:embed` 명령어를 인식하지 못함

### Step 3: React 버전 충돌 해결
```bash
# React 18.2로 다운그레이드 (Expo 호환성)
npm i -E react@18.2.0 react-dom@18.2.0
npm i -D -E @types/react@18.2.79
npx expo install react-native-web@~0.21.7
```

**이유**: Expo는 React 18.2 계열을 권장하며, React 19는 아직 미지원

### Step 4: 엔트리 파일 설정
```json
// package.json
{
  "main": "index.js"
}
```

```json
// app.json
{
  "expo": {
    "entryPoint": "./index.js"
  }
}
```

```javascript
// index.js (프로젝트 루트)
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

**이유**: `export:embed` 명령어가 엔트리 파일을 찾지 못해서 실패

### Step 5: Expo autolinking으로 전환 (핵심 해결책)

#### android/settings.gradle 수정
```gradle
rootProject.name = "Smart Farm"
include(":app")

// ✅ Expo autolinking 사용 (이 한 줄이면 됨)
apply from: file("../node_modules/@expo/config-plugins/scripts/autolinking.gradle")
applyNativeModulesSettingsGradle(settings)
```

#### android/app/build.gradle 수정
```gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

// ✅ Expo autolinking + 모듈 사용
apply from: file("../../node_modules/@expo/config-plugins/scripts/autolinking.gradle")
useExpoModules()
```

#### 필요한 패키지 설치
```bash
npm i -D @expo/config-plugins
```

**이유**: 최신 Expo/RN에서는 `@react-native-community/cli-platform-android/native_modules.gradle` 경로가 변경되었고, Expo autolinking을 사용해야 안정적

### Step 6: 올바른 빌드 순서
```bash
# 1. 프로젝트 루트에서 JS 번들 생성
npx --yes --package=@expo/cli@latest expo export:embed --platform android \
  --bundle-output "android/app/src/main/assets/index.android.bundle" \
  --assets-dest "android/app/src/main/res" \
  --entry-file "index.js"

# 2. 올바른 android 폴더에서 빌드 (smart_on/android, mobile-app/android 아님)
cd android
.\gradlew clean
.\gradlew assembleRelease
```

## ✅ 최종 성공 결과

### JS 번들 생성 성공
```
Starting Metro Bundler
Android Bundled 512ms index.js (683 modules)
Writing bundle output to: android/app/src/main/assets/index.android.bundle
Copying 5 asset files
Done writing bundle output
```

### 핵심 해결 포인트
1. **Gradle 7.6.3** 사용으로 Kotlin 호환성 해결
2. **Expo autolinking** 전환으로 native_modules.gradle 문제 해결
3. **React 18.2** 사용으로 버전 충돌 해결
4. **올바른 android 폴더** (`smart_on/android`) 사용
5. **엔트리 파일 설정** 완료

## 📝 주의사항

### ⚠️ 하지 말아야 할 것들
- `npm audit fix --force`: Expo 생태계 버전을 깨뜨릴 수 있음
- 잘못된 android 폴더 사용: `mobile-app/android` 대신 `smart_on/android` 사용
- React 19 사용: Expo는 React 18.2를 권장

### ✅ 확인 체크리스트
- [ ] 작업 폴더는 `smart_on/android` (예전 `mobile-app/android` 금지)
- [ ] `settings.gradle`에 Expo autolinking 한 줄만 있는지 확인
- [ ] `app/build.gradle`에 `useExpoModules()`가 있는지 확인
- [ ] 루트에 `index.js` 존재 + `package.json` `"main": "index.js"`
- [ ] React 18.2 계열 사용

## 🎯 결론

이 문제 해결 과정을 통해 **Expo autolinking**이 최신 Expo/React Native 프로젝트에서 안정적인 빌드를 위한 핵심임을 확인했습니다. 기존의 `@react-native-community/cli-platform-android` 방식은 더 이상 권장되지 않으며, Expo의 autolinking 시스템을 사용해야 합니다.

---

**문서 작성일**: 2025.09.23  
**문제 해결 완료**: Android 빌드 성공  
**다음 단계**: Tuya SDK 연동 테스트


