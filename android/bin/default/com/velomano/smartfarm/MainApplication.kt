package com.velomano.smartfarm

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.shell.MainReactPackage
import com.velomano.smartfarm.TuyaSDKPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            listOf(
              // React Native 핵심 패키지들
              MainReactPackage(),
              // Tuya SDK 패키지 추가
              TuyaSDKPackage()
            )

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = true

        override val isNewArchEnabled: Boolean = false
      }

  override fun onCreate() {
    super.onCreate()
    
    // SoLoader 초기화를 먼저 실행
    com.facebook.soloader.SoLoader.init(this, false)
  }
}