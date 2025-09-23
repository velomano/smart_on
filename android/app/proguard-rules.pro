# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.yoga.** { *; }
-keep class com.facebook.flipper.** { *; }

# Tuya SDK - Keep all classes and methods
-keep class com.thingclips.** { *; }
-keep class com.alibaba.fastjson.** { *; }
-keep class com.thingclips.smart.** { *; }
-keep class com.thingclips.security.** { *; }
-keep class com.thingclips.sdk.** { *; }

# Keep all Tuya SDK classes to prevent R8 from removing them
-keep class com.thingclips.smart.android.** { *; }
-keep class com.thingclips.smart.android.network.** { *; }
-keep class com.thingclips.smart.android.common.** { *; }
-keep class com.thingclips.smart.components.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}