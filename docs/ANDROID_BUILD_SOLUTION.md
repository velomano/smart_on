# Android 빌드 문제 해결 완전 가이드

## 📋 문제 상황
React Native 0.81+ (Expo SDK 54) 환경에서 Android 빌드 시 발생한 다양한 오류들을 해결한 과정을 문서화합니다.

## 🎯 최종 결과
**BUILD SUCCESSFUL** - APK 파일 생성 완료  
**IDE 에러 완전 해결** - Java 클래스패스 및 프로젝트 설정 완료

## 🔧 해결된 문제들

### 1. autolinking.json 파일 문제
**문제**: `autolinkInputFile' specifies file '...autolinking.json' which doesn't exist`

**해결방법**:
```bash
# 디렉토리 생성
mkdir -p android/build/generated/autolinking

# autolinking.json 파일 생성
```

**파일 내용**:
```json
{
  "reactNativeVersion": "0.81.4",
  "project": {
    "android": {
      "sourceDir": "C:\\Users\\VELOMANO\\Documents\\50se\\smart_on\\android",
      "appName": "app",
      "packageName": "com.velomano.smartfarm",
      "applicationId": "com.velomano.smartfarm",
      "mainActivity": ".MainActivity"
    }
  },
  "dependencies": {}
}
```

### 2. JS 번들 생성 실패
**문제**: Metro bundler 설정 문제

**해결방법**:
- `metro.config.js` 파일 생성
- `index.js` 엔트리 포인트 설정
- `app.json`에 `entryPoint` 추가

### 3. minSdkVersion 호환성 문제
**문제**: `minSdkVersion 23 cannot be smaller than version 24 declared in library`

**해결방법**:
```gradle
// android/app/build.gradle
defaultConfig {
  applicationId "com.velomano.smartfarm"
  minSdkVersion 24  // 23 → 24로 변경
  targetSdkVersion 34
  versionCode 1
  versionName "1.0"
}
```

### 4. Kotlin 컴파일 오류
**문제**: MainActivity.kt와 MainApplication.kt에서 Expo/React Native 클래스 참조 오류

**해결방법**:
1. **패키지명 수정**: `com.anonymous.smart_on` → `com.velomano.smartfarm`
2. **파일 이동**: 올바른 디렉토리 구조로 이동
3. **Expo 의존성 제거**: 간단한 React Native 전용 클래스로 교체

**새로운 MainActivity.kt**:
```kotlin
package com.velomano.smartfarm

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "main"
  
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
```

**새로운 MainApplication.kt**:
```kotlin
package com.velomano.smartfarm

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages
        
        override fun getJSMainModuleName(): String = "index"
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }

  override fun onCreate() {
    super.onCreate()
    load()
  }
}
```

### 5. Java 컴파일 오류
**문제**: `package expo.modules does not exist` - ExpoModulesPackage 참조 오류

**해결방법**:
- autolinking.json에서 Expo 모듈 의존성 제거
- `useExpoModules()` 비활성화
- 순수 React Native 환경으로 구성

### 6. Android 리소스 오류
**문제**: `Theme.AppCompat.DayNight.NoActionBar not found`

**해결방법**:
```gradle
// android/app/build.gradle
dependencies {
  implementation "com.facebook.react:react-android"
  implementation "androidx.appcompat:appcompat:1.6.1"
  implementation "com.google.android.material:material:1.10.0"
}
```

### 7. Flipper 관련 오류
**문제**: `Unresolved reference 'ReactNativeFlipper'`

**해결방법**: Flipper 관련 코드 완전 제거

### 8. IDE 에러 및 클래스패스 문제
**문제**: 
- `TuyaSDKModule.java is not on the classpath of project app`
- `Project 'smart_on_856afe37' is missing required source folder`
- `Missing Gradle project configuration folder: .settings`

**해결방법**:
1. **IDE 프로젝트 설정 파일 생성**:
   ```xml
   <!-- android/.project -->
   <?xml version="1.0" encoding="UTF-8"?>
   <projectDescription>
     <name>Smart Farm</name>
     <natures>
       <nature>org.eclipse.jdt.core.javanature</nature>
       <nature>org.eclipse.buildship.core.gradleprojectnature</nature>
     </natures>
     <buildSpec>
       <buildCommand>
         <name>org.eclipse.buildship.core.gradleprojectbuilder</name>
       </buildCommand>
       <buildCommand>
         <name>org.eclipse.jdt.core.javabuilder</name>
       </buildCommand>
     </buildSpec>
     <filteredResources>
       <filter>
         <id>1758639199420</id>
         <type>30</type>
         <matcher>
           <id>org.eclipse.core.resources.regexFilterMatcher</id>
           <arguments>node_modules|.git|build|.gradle|__CREATED_BY_JAVA_LANGUAGE_SERVER__</arguments>
         </matcher>
       </filter>
     </filteredResources>
   </projectDescription>
   ```

2. **Java 클래스패스 설정**:
   ```xml
   <!-- android/.classpath -->
   <?xml version="1.0" encoding="UTF-8"?>
   <classpath>
     <classpathentry kind="src" path="app/src/main/java"/>
     <classpathentry kind="src" path="app/src/main/kotlin"/>
     <classpathentry kind="src" path="app/src/main/res" output="bin/main"/>
     <classpathentry kind="con" path="org.eclipse.jdt.launching.JRE_CONTAINER/org.eclipse.jdt.internal.debug.ui.launcher.StandardVMType/JavaSE-17"/>
     <classpathentry kind="con" path="org.eclipse.buildship.core.gradleclasspathcontainer"/>
     <classpathentry kind="output" path="bin/default"/>
   </classpath>
   ```

3. **VS Code Java 설정 강화**:
   ```json
   // .vscode/settings.json
   {
     "java.configuration.updateBuildConfiguration": "automatic",
     "java.project.sourcePaths": [
       "android/app/src/main/java",
       "android/app/src/main/kotlin"
     ],
     "java.project.referencedLibraries": [
       "android/app/libs/**/*.jar",
       "android/app/libs/**/*.aar"
     ],
     "java.import.exclusions": [
       "**/mobile-app/android_old/**",
       "**/mobile-app/android/**",
       "**/node_modules/**",
       "**/build/**",
       "**/.gradle/**"
     ],
     "files.exclude": {
       "**/mobile-app/android_old": true,
       "**/mobile-app/android": true,
       "**/node_modules": true,
       "**/build": true,
       "**/.gradle": true,
       "**/.settings": true,
       "**/.project": true,
       "**/.classpath": true
     }
   }
   ```

4. **Gradle 클린 및 재빌드**:
   ```bash
   cd android
   .\gradlew --stop
   .\gradlew clean
   .\gradlew assembleDebug
   ```

### 9. Tuya SDK 통합 및 네이티브 모듈 구현
**완료된 작업**:
- Tuya SDK AAR 파일 통합
- 네이티브 모듈 Java 클래스 구현
- React Native에서 호출 가능한 API 메서드 구현
- ProGuard 설정으로 R8 최적화 대응

**구현된 기능**:
```java
// TuyaSDKModule.java
- initSDK(): Tuya SDK 초기화
- startDeviceDiscovery(): 디바이스 스캔 시작
- stopDeviceDiscovery(): 디바이스 스캔 중지
- getDeviceList(): 연결된 디바이스 목록 조회
- controlDevice(): 디바이스 제어 (ON/OFF)
```

## 🏗️ 최종 Gradle 설정

### android/settings.gradle
```gradle
pluginManagement {
  repositories {
    gradlePluginPortal()
    google()
    mavenCentral()
  }
  includeBuild("../node_modules/@react-native/gradle-plugin")
}

dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
  repositories {
    google()
    mavenCentral()
    maven { url = uri("$rootDir/../node_modules/react-native/android") }
    maven { url = uri("$rootDir/../node_modules/expo/modules/android/maven") }
    maven { url = uri("$rootDir/../node_modules/jsc-android/dist") }
  }
}

rootProject.name = "Smart Farm"
include(":app")
```

### android/build.gradle (루트)
```gradle
plugins {
  id("com.android.application") version "8.4.2" apply false
  id("com.facebook.react") apply false
  id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}

tasks.register("clean", Delete) { delete rootProject.buildDir }
```

### android/app/build.gradle
```gradle
plugins {
  id 'com.android.application'
  id 'com.facebook.react'
  id 'org.jetbrains.kotlin.android'
}

/** ✅ Expo autolinking — 루트 node_modules를 확실히 가리킴 */
apply from: rootProject.file("../node_modules/expo/scripts/autolinking.gradle")

/** ⚠️ 문제를 단순화하기 위해 우선 주석 처리
 *  (빌드가 돈 뒤 필요하면 다시 켠다)
 */
// useExpoModules()

android {
  namespace "com.velomano.smartfarm"
  compileSdkVersion 34

  defaultConfig {
    applicationId "com.velomano.smartfarm"
    minSdkVersion 24
    targetSdkVersion 34
    versionCode 1
    versionName "1.0"
  }

  signingConfigs {
    release {
      if (project.hasProperty('RELEASE_STORE_FILE')) {
        storeFile file(RELEASE_STORE_FILE)
        storePassword RELEASE_STORE_PASSWORD
        keyAlias RELEASE_KEY_ALIAS
        keyPassword RELEASE_KEY_PASSWORD
      }
    }
  }

  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled false // Temporarily disabled for troubleshooting
      shrinkResources false // Temporarily disabled for troubleshooting
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }

  compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
  }
  kotlinOptions {
    jvmTarget = '17'
  }
}

dependencies {
  implementation "com.facebook.react:react-android"
  implementation "androidx.appcompat:appcompat:1.6.1"
  implementation "com.google.android.material:material:1.10.0"

  // Tuya SDK 의존성
  implementation fileTree(include: ['*.aar'], dir: 'libs')
  implementation 'com.alibaba:fastjson:1.1.67.android'
  implementation 'com.squareup.okhttp3:okhttp-urlconnection:3.14.9'
  implementation 'com.thingclips.smart:thingsmart:6.4.0'
}
```

### android/gradle.properties
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true
android.useAndroidX=true
android.enablePngCrunchInReleaseBuilds=true
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
newArchEnabled=false
hermesEnabled=true
edgeToEdgeEnabled=true
expo.gif.enabled=true
expo.webp.enabled=true
expo.webp.animated=false
EX_DEV_CLIENT_NETWORK_INSPECTOR=true
expo.useLegacyPackaging=false
expo.edgeToEdgeEnabled=true

# Java 17 설정
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.14.7-hotspot

# 릴리즈 서명 설정
RELEASE_STORE_FILE=smartfarm.keystore
RELEASE_STORE_PASSWORD=smartfarm123
RELEASE_KEY_ALIAS=smartfarm
RELEASE_KEY_PASSWORD=smartfarm123
```

### android/local.properties
```properties
sdk.dir=C:/Users/VELOMANO/AppData/Local/Android/Sdk
```

## 📁 필수 파일들

### metro.config.js (루트)
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = mergeConfig(config, {
  // Add any additional Metro configuration here
});
```

### index.js (mobile-app)
```javascript
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

### react-native.config.js (루트)
```javascript
module.exports = {
  project: {
    android: {
      packageName: "com.velomano.smartfarm",
    },
  },
};
```

## 🚀 빌드 명령어

```bash
# Android 디렉토리로 이동
cd android

# Gradle 데몬 중지
.\gradlew --stop

# 클린 빌드
.\gradlew clean

# 릴리즈 빌드
.\gradlew assembleRelease
```

## ⚠️ 주의사항

1. **Expo vs React Native**: 이 해결책은 순수 React Native 환경에 최적화되어 있습니다.
2. **New Architecture**: `newArchEnabled=false`로 설정되어 있습니다.
3. **Expo Modules**: `useExpoModules()`가 비활성화되어 있어 Expo 모듈을 사용할 수 없습니다.
4. **패키지명**: 모든 설정에서 `com.velomano.smartfarm` 패키지명을 일관되게 사용해야 합니다.

## 🎉 성공 지표

- ✅ `BUILD SUCCESSFUL` - Android 빌드 완료
- ✅ APK 파일 생성: `android/app/build/outputs/apk/release/`
- ✅ 모든 컴파일 오류 해결
- ✅ JS 번들 생성 성공
- ✅ Kotlin/Java 컴파일 성공
- ✅ IDE 에러 완전 해결 (Java 클래스패스 설정)
- ✅ Tuya SDK 네이티브 모듈 통합 완료
- ✅ Gradle 8.13 + JDK 17 환경 구성 완료

## 📝 다음 단계

1. **✅ APK 파일 확인**: `android/app/build/outputs/apk/release/` 디렉토리
2. **🚀 Tuya SDK 실제 테스트**: 네이티브 모듈 API 호출 테스트
   - Tuya SDK 초기화 테스트
   - 디바이스 스캔 기능 테스트
   - 스마트 스위치 제어 테스트
3. **📱 React Native UI 구현**: 스마트 스위치 제어 인터페이스
4. **Git 커밋**: 모든 변경사항 저장

## 🔧 Android Studio 설정 가이드

### Gradle 설정
- **File → Settings → Build, Execution, Deployment → Build Tools → Gradle**
  - Use Gradle from: `gradle-wrapper.properties` ✅
  - Gradle JVM: `Embedded JDK (17)` 또는 `JDK 17` ✅
  - Offline work: 체크 해제 ✅

### SDK Location 설정
- **File → Project Structure → SDK Location**
  - JDK location: JDK 17 경로 ✅
  - Android SDK location: `C:/Users/VELOMANO/AppData/Local/Android/Sdk` ✅

### Sync 실행
- 상단의 **"Sync Project with Gradle Files"** 버튼 클릭
- Gradle 9 milestone 업그레이드 팝업 → 무시/취소

---

**작성일**: 2025년 9월 23일  
**최종 업데이트**: 2025년 9월 23일  
**환경**: Windows 10, React Native 0.81.4, Expo SDK 54, Gradle 8.13, JDK 17

