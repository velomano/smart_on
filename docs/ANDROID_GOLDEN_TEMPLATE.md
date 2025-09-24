# 🏆 Android 빌드 황금 템플릿 (Expo SDK 54)

## 📋 개요
Expo SDK 54 (React Native 0.75) 환경에서 안정적으로 작동하는 Android 빌드 설정 템플릿입니다.

---

## 🔧 1. 환경 고정 (모든 PC 공통)

### **필수 환경**
- **JDK**: Temurin 17
- **Gradle Wrapper**: 8.13
- **Expo SDK**: 54 (RN 0.75)
- **Android SDK**: API 35 설치 (Platform + Build-Tools 35.x)
- **NDK**: 26.1.10909125

### **Windows 환경변수 설정**
```powershell
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot"
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
setx ANDROID_SDK_ROOT "$env:LOCALAPPDATA\Android\Sdk"
```

---

## 📁 2. 프로젝트 "황금 템플릿" 파일

### **android/gradle/wrapper/gradle-wrapper.properties**
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.13-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

### **android/build.gradle (루트)**
```gradle
plugins {
  id("com.android.application") version "8.7.3" apply false
  id("org.jetbrains.kotlin.android") version "1.9.24" apply false
  id("com.facebook.react") apply false
}

tasks.register("clean", Delete) { delete rootProject.buildDir }
```

**⚠️ 주의**: `buildscript { classpath("...:gradle:") }` 같은 예전 줄은 반드시 제거

### **android/settings.gradle**
```gradle
pluginManagement {
  repositories { 
    gradlePluginPortal()
    mavenCentral() 
    google() 
  }
  includeBuild("../node_modules/@react-native/gradle-plugin")
  includeBuild("../node_modules/expo-modules-core/expo-module-gradle-plugin")
  includeBuild("../node_modules/expo-dev-launcher/expo-dev-launcher-gradle-plugin")
}

dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
  repositories {
    mavenCentral()
    google()
    maven { url("$rootDir/../node_modules/react-native/android") }
  }
}

rootProject.name = "Smart Farm"
include(":app")
```

### **android/app/build.gradle**
```gradle
apply plugin: "com.android.application"
apply plugin: "com.facebook.react"
apply plugin: "org.jetbrains.kotlin.android"

android {
  namespace "com.smartfarm.app"               // ← 패키지명
  compileSdkVersion 35

  defaultConfig {
    applicationId "com.smartfarm.app"         // ← 패키지명
    minSdkVersion 24
    targetSdkVersion 35
    versionCode 1
    versionName "1.0"
  }

  ndkVersion "26.1.10909125"
  buildFeatures { buildConfig true }
}

dependencies {
  implementation("com.facebook.react:react-android")
  implementation("com.facebook.react:hermes-android")
}
```

### **metro.config.js (모노레포/pnpm용)**
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// pnpm/모노레포에서 심볼릭 링크 해석
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_conditionNames = ['require','react-native','browser','import'];

// HMRClient 스텁 설정
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@expo/metro/metro-runtime/modules/HMRClient': require.resolve(
    'metro-runtime/src/modules/empty-module.js'
  ),
};

module.exports = config;
```

---

## 🚀 3. "한 방" 재설치/빌드 순서 (PowerShell)

```powershell
# 프로젝트 루트(모바일앱)
cd C:\SCW\smarton\mobile-app

# 찌꺼기 삭제
npx rimraf node_modules .expo .next .cache .turbo
Remove-Item -Force package-lock.json,yarn.lock,pnpm-lock.yaml -ErrorAction SilentlyContinue
npm cache verify

# Expo 의존 정렬 + 누락 패키지
npx expo install --fix
npm i -D @expo/metro @expo/metro-runtime @types/react@~19.1.10
npm i styleq
npx expo install react-native-web

# 안드 설정 확인 후(위 템플릿 반영) 빌드
cd android
.\gradlew --stop
.\gradlew clean
.\gradlew assembleDebug
```

---

## ⚠️ 4. 자주 터지는 원인 체크리스트

### **"com.facebook.react:react-native-gradle-plugin:."**
- **원인**: `settings.gradle`의 `includeBuild("../node_modules/@react-native/gradle-plugin")` 경로 틀림
- **해결**: 경로가 `../node_modules/`인지 확인

### **"Minimum supported Gradle … 8.13"**
- **원인**: wrapper 안 올림
- **해결**: `gradle-wrapper.properties`에서 `gradle-8.13-bin.zip` 확인

### **"compileSdk 누락"**
- **원인**: `android { compileSdkVersion 35 }` 빠짐
- **해결**: `app/build.gradle`의 `android` 블록에 `compileSdkVersion 35` 추가

### **"reactAndroidLibs unknown"**
- **원인**: `app/build.gradle`이 RN 0.75 양식이 아님
- **해결**: dependencies를 위 템플릿으로 교체

### **Metro 모듈 경로 이슈 (윈도+pnpm)**
- **원인**: 심볼릭 링크 해석 실패
- **해결**: `metro.config.js`의 `unstable_enableSymlinks: true` 설정

---

## 💡 5. 팁

### **버전 통일**
- 세 PC 모두 위 템플릿으로 **"동일 버전"** 고정
- 버전만 맞으면 진짜 조용해짐

### **개발 환경 통일**
- **Node**: Volta나 fnm으로 통일
- **패키지매니저**: npm 하나로 통일 권장

### **Android Studio 설정**
- **SDK Manager**에서 SDK 35/NDK 26.1 설치 확인

---

## 🎯 6. 성공 지표

빌드 성공 시 다음 메시지가 나타납니다:
```
BUILD SUCCESSFUL in Xs
X actionable tasks: X executed
```

APK 파일 위치:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📝 7. 문제 해결 로그

### **빌드 실패 시 확인사항**
1. **환경변수**: `JAVA_HOME`, `ANDROID_HOME` 설정 확인
2. **JDK 버전**: `java -version`으로 17 확인
3. **Gradle 버전**: `.\gradlew --version`으로 8.13 확인
4. **패키지 설치**: `npm ls @react-native/gradle-plugin` 확인

### **자주 발생하는 에러**
- `Could not find com.android.tools.build:gradle:.` → 빈 버전 classpath 제거
- `reactAndroidLibs unknown` → dependencies 블록 교체
- `Minimum supported Gradle version` → wrapper 8.13으로 업그레이드

---

**작성일**: 2025-09-24  
**적용 환경**: Windows 10/11, Expo SDK 54, React Native 0.75, Gradle 8.13, JDK 17  
**테스트 완료**: ✅ Android 빌드 성공
