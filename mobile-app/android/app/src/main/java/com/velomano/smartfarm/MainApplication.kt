package com.velomano.smartfarm

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.shell.MainReactPackage
import com.velomano.smartfarm.TuyaSDKPackage
import java.util.Arrays
import androidx.emoji2.text.EmojiCompat
import androidx.emoji2.bundled.BundledEmojiCompatConfig

class MainApplication : Application(), ReactApplication {

  private val mReactNativeHost = object : ReactNativeHost(this) {
    override fun getUseDeveloperSupport(): Boolean = true

    override fun getPackages(): List<ReactPackage> =
        Arrays.asList(
          MainReactPackage(),
          TuyaSDKPackage()
        )

    override fun getJSMainModuleName(): String = "index"
  }

  override fun getReactNativeHost(): ReactNativeHost = mReactNativeHost

  override fun onCreate() {
    super.onCreate()
    
    // EmojiCompat 초기화
    EmojiCompat.init(BundledEmojiCompatConfig(this))
    
    // SoLoader 초기화 (JSC 사용)
    com.facebook.soloader.SoLoader.init(this, false)
  }
}