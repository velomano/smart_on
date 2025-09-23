# 🔌 Tuya SDK 통합 가이드

## 📋 개요

Tuya IoT Platform을 통한 스마트스위치 제어를 위한 Android SDK 통합 가이드입니다.

## 🎯 현재 구현 상태 (2025.09.23)

### ✅ 구현 완료
- **네이티브 모듈**: `TuyaSDKModule.java` 구현 완료
- **패키지 등록**: `TuyaSDKPackage.java` 및 `MainApplication.java` 설정 완료
- **React Native 서비스**: `TuyaService.ts` 구현 완료
- **환경변수 설정**: `app.json`에 Tuya API 키 설정 완료
- **UI/UX**: 스마트 스위치 등록 및 제어 화면 완료

### 🔄 구현 예정
- **실제 Tuya SDK 라이브러리**: Android Studio 설치 후 실제 SDK 연동
- **디바이스 등록**: 실제 Tuya 디바이스 페어링 및 제어
- **상태 동기화**: Supabase와 Tuya 디바이스 상태 동기화

## 🔧 사전 준비

### 1. Tuya IoT Platform 설정

#### 프로젝트 생성
1. [Tuya IoT Platform](https://iot.tuya.com/) 로그인
2. "Cloud Development" → "Create Cloud Project" 클릭
3. 프로젝트 정보 입력:
   - **Project Name**: Smart Farm Control
   - **Industry**: Smart Agriculture
   - **Development Method**: Custom Development

#### Android 앱 등록
1. 프로젝트 내 "Devices" → "Link Tuya App Account" 클릭
2. "Add App Account" 선택
3. 앱 정보 입력:
   - **App Package Name**: `com.velomano.smartfarm`
   - **App Type**: Android
   - **App Category**: Smart Home

#### SHA-256 지문 생성
```bash
# Android Studio에서 키스토어 생성
keytool -genkey -v -keystore smartfarm-key.keystore -alias smartfarm -keyalg RSA -keysize 2048 -validity 10000

# SHA-256 지문 추출
keytool -list -v -keystore smartfarm-key.keystore -alias smartfarm
```

#### API 키 발급
1. 프로젝트 "Overview" → "API" 섹션에서 키 확인
2. **AppKey**: `we85jqprtfpm5pkmyr53` (실제 발급된 키)
3. **AppSecret**: `12277a78753f4aaa8d3c8e3beff43632` (실제 발급된 키)
4. **Region**: `eu` (유럽 리전)
5. SHA-256 지문을 "Security" → "App Certificate"에 등록

## 📱 Expo Bare 환경 설정

### 1. Expo Prebuild 실행
```bash
cd smart-farm-app/mobile-app
npx expo prebuild --platform android
```

### 2. Tuya SDK 설치
```bash
# Android 네이티브 의존성 추가
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-get-location
```

### 3. Android 설정 파일 수정

#### `android/app/build.gradle`
```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.velomano.smartfarm"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
    }
}

dependencies {
    implementation 'com.tuya.smart:tuyasmart:3.32.5'
    implementation 'com.tuya.smart:tuyasmart-base:3.32.5'
    implementation 'com.tuya.smart:tuyasmart-ipcsdk:3.32.5'
}
```

#### `android/app/src/main/AndroidManifest.xml`
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- 권한 추가 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    
    <application
        android:name=".MainApplication"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/Theme.App.SplashScreen"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## 🔌 React Native Tuya SDK 래퍼

### 1. Tuya SDK 래퍼 생성

#### `lib/tuya/TuyaSDK.ts`
```typescript
import { NativeModules, Platform } from 'react-native';

interface TuyaDevice {
  id: string;
  name: string;
  deviceType: string;
  status: 'online' | 'offline';
  capabilities: string[];
}

interface TuyaSDKInterface {
  initSDK(appKey: string, appSecret: string): Promise<boolean>;
  loginWithUsername(username: string, password: string): Promise<boolean>;
  getDeviceList(): Promise<TuyaDevice[]>;
  controlDevice(deviceId: string, command: any): Promise<boolean>;
  startDeviceDiscovery(): Promise<void>;
  stopDeviceDiscovery(): Promise<void>;
}

const TuyaSDK = Platform.OS === 'android' 
  ? NativeModules.TuyaSDK as TuyaSDKInterface
  : null;

export default TuyaSDK;
```

### 2. 네이티브 모듈 구현

#### `android/app/src/main/java/com/velomano/smartfarm/TuyaSDKModule.java`
```java
package com.velomano.smartfarm;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import com.tuya.smart.sdk.TuyaSdk;
import com.tuya.smart.home.sdk.TuyaHomeSdk;
import com.tuya.smart.home.sdk.bean.HomeBean;
import com.tuya.smart.home.sdk.bean.DeviceBean;

public class TuyaSDKModule extends ReactContextBaseJavaModule {
    
    public TuyaSDKModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    public String getName() {
        return "TuyaSDK";
    }
    
    @ReactMethod
    public void initSDK(String appKey, String appSecret, Promise promise) {
        try {
            TuyaSdk.init(getReactApplicationContext(), appKey, appSecret);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void loginWithUsername(String username, String password, Promise promise) {
        // Tuya 로그인 로직 구현
        promise.resolve(true);
    }
    
    @ReactMethod
    public void getDeviceList(Promise promise) {
        try {
            // Tuya 디바이스 목록 가져오기
            WritableArray devices = Arguments.createArray();
            // 실제 구현에서는 TuyaHomeSdk.getHomeManager().getHomeList() 사용
            promise.resolve(devices);
        } catch (Exception e) {
            promise.reject("DEVICE_LIST_ERROR", e.getMessage());
        }
    }
}
```

### 3. 패키지 등록

#### `android/app/src/main/java/com/velomano/smartfarm/TuyaSDKPackage.java`
```java
package com.velomano.smartfarm;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class TuyaSDKPackage implements ReactPackage {
    
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
    
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new TuyaSDKModule(reactContext));
        return modules;
    }
}
```

#### `android/app/src/main/java/com/velomano/smartfarm/MainApplication.java`
```java
@Override
protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new TuyaSDKPackage());
    return packages;
}
```

## 🎮 사용 예시

### 1. SDK 초기화
```typescript
import TuyaSDK from '../lib/tuya/TuyaSDK';

const initializeTuya = async () => {
  const appKey = process.env.EXPO_PUBLIC_TUYA_APP_KEY!;
  const appSecret = process.env.EXPO_PUBLIC_TUYA_APP_SECRET!;
  
  try {
    const success = await TuyaSDK?.initSDK(appKey, appSecret);
    if (success) {
      console.log('Tuya SDK initialized successfully');
    }
  } catch (error) {
    console.error('Tuya SDK initialization failed:', error);
  }
};
```

### 2. 디바이스 제어
```typescript
const controlDevice = async (deviceId: string, action: string) => {
  try {
    const command = {
      action: action, // 'on', 'off', 'set_brightness'
      value: action === 'set_brightness' ? 80 : undefined
    };
    
    const success = await TuyaSDK?.controlDevice(deviceId, command);
    if (success) {
      console.log('Device control command sent');
    }
  } catch (error) {
    console.error('Device control failed:', error);
  }
};
```

## 🔧 환경변수 설정

### `mobile-app/app.json` (현재 설정됨)
```json
{
  "expo": {
    "extra": {
      "tuyaAppKey": "we85jqprtfpm5pkmyr53",
      "tuyaAppSecret": "12277a78753f4aaa8d3c8e3beff43632",
      "tuyaRegion": "eu"
    }
  }
}
```

### React Native에서 접근
```typescript
import Constants from 'expo-constants';

const tuyaAppKey = Constants.expoConfig?.extra?.tuyaAppKey;
const tuyaAppSecret = Constants.expoConfig?.extra?.tuyaAppSecret;
const tuyaRegion = Constants.expoConfig?.extra?.tuyaRegion;
```

## 📝 테스트 체크리스트

### ✅ Phase 0 완료 기준 (완료)
- [x] Tuya SDK 네이티브 모듈 구현
- [x] React Native 서비스 구현
- [x] 환경변수 설정 (app.json)
- [x] UI/UX 디자인 완료
- [x] Mock 데이터 연동

### 🔄 Phase 1 진행 중 (Android Studio 설치 후)
- [ ] Android Studio 설치 및 설정
- [ ] 실제 Tuya SDK 라이브러리 연동
- [ ] Android 앱 빌드 성공
- [ ] 디바이스 검색 기능 작동
- [ ] 기기 페어링 프로세스 완료
- [ ] 스위치 ON/OFF 제어 성공
- [ ] 기기 상태 실시간 업데이트

## ⚠️ 주의사항

1. **SHA-256 지문**: 앱 서명 변경시 Tuya 플랫폼에서 지문 재등록 필요
2. **권한 설정**: 위치 권한이 필요하므로 사용자에게 권한 요청
3. **네트워크**: Tuya 클라우드 서비스 접근을 위한 인터넷 연결 필요
4. **보안**: AppSecret은 클라이언트에 노출되므로 프로덕션에서는 서버 사이드 제어 권장

## 🔗 참고 자료

- [Tuya IoT Platform](https://iot.tuya.com/)
- [Tuya Smart SDK 문서](https://developer.tuya.com/en/docs/iot/sdk-for-android)
- [Expo Bare Workflow](https://docs.expo.dev/bare/overview/)
