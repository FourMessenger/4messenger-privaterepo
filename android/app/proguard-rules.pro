# Retrofit
-keep class retrofit2.** { *; }
-keep class okhttp3.** { *; }
-keep class com.google.gson.** { *; }
-keep class javax.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**

# JSON
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Kotlin
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }

# Local classes
-keep class com.messenger4.android.** { *; }
-keep class com.messenger4.android.models.** { *; }
-keep class com.messenger4.android.services.** { *; }
-keep class com.messenger4.android.utils.** { *; }
