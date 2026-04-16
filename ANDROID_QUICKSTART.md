# 4 Messenger - Android App Quick Start Guide

## Overview

The Android app for 4 Messenger provides a native mobile experience with WebView rendering, background services, and automatic updates.

## Quick Setup

### 1. Prerequisites
- Android Studio 2022.3+
- JDK 17+
- Android SDK 34
- Minimum target device: Android 8.0 (API 26)

### 2. Build the App

```bash
# Navigate to android directory
cd android

# Build debug APK
./gradlew assembleDebug

# Or build release
./gradlew assembleRelease
```

### 3. Install on Device/Emulator

```bash
# Install debug version
./gradlew installDebug

# Or use adb directly
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 4. Run Frontend

```bash
# From project root
npm install
npm run dev

# Frontend will be available at http://localhost:5173
# Configure to accessible at http://localhost:8080 or update MainActivity.kt
```

### 5. Launch App

- Open app on device
- WebView will load the web application
- Background services will start automatically

## Features

### 🌐 WebView Integration
- Renders full 4 Messenger web application
- Hardware-accelerated rendering
- JavaScript interface for app communication

### 🔔 Push Notifications
- Periodic background polling (every 30 seconds)
- Multi-server support
- Local notification badges
- Message persistence

### 📤 File Upload
- Background uploads (continues if app exits)
- Progress tracking
- Pause/Resume capability
- Automatic retry

### 📥 File Download
- Background downloads (continues if app exits)
- Notification progress display
- Resume from interruption
- Batch download support

### 🔄 Automatic Updates
- Periodic version checking (every 6 hours)
- Required vs Optional updates
- Required updates cannot be dismissed
- What's New information display

## File Structure

```
4messenger/
├── android/                           # Android app
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/messenger4/   # Kotlin/Java source
│   │   │   └── res/                   # Resources
│   │   └── build.gradle.kts           # App build config
│   ├── build.gradle.kts               # Root build config
│   ├── settings.gradle.kts            # Gradle settings
│   ├── gradle.properties              # Gradle properties
│   ├── gradlew / gradlew.bat          # Gradle wrapper
│   └── README.md                      # Detailed documentation
├── public/ver.json                    # Version info (update this!)
└── ANDROID_INTEGRATION.md             # Integration guide
```

## Configuration

### Update Check Interval
Edit in [MainActivity.kt](android/app/src/main/java/com/messenger4/android/MainActivity.kt#L94):
```kotlin
PeriodicWorkRequestBuilder<UpdateCheckWorker>(
    6, TimeUnit.HOURS  // Change this value
)
```

### Push Notification Interval  
Edit in [MainActivity.kt](android/app/src/main/java/com/messenger4/android/MainActivity.kt#L80):
```kotlin
PeriodicWorkRequestBuilder<PushNotificationWorker>(
    30, TimeUnit.SECONDS  // Change this value
)
```

### WebView URL
Edit in [MainActivity.kt](android/app/src/main/java/com/messenger4/android/MainActivity.kt#L55):
```kotlin
loadUrl("http://localhost:8080")  // Change URL here
```

## Building for Production

### 1. Update Version
Edit [app/build.gradle.kts](android/app/build.gradle.kts):
```kotlin
versionCode = 2      // Increment
versionName = "1.0.1" // New version
```

### 2. Update ver.json
Edit [public/ver.json](public/ver.json):
```json
{
  "version": "1.0.1",
  "downloadUrl": "https://your-domain.com/app.apk",
  "required": false,
  "whatsNew": ["New feature 1", "New feature 2"]
}
```

### 3. Generate Release APK
```bash
cd android
./gradlew assembleRelease
# Signed APK: app/build/outputs/apk/release/app-release.apk
```

### 4. Sign APK
```bash
# Create keystore (one-time)
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias 4messenger

# APK is auto-signed with debug key for debug builds
# For release, use your production keystore
```

## Testing

### Unit Tests
```bash
./gradlew test
```

### Instrumented Tests (on device)
```bash
./gradlew connectedAndroidTest
```

### Manual Testing Checklist
- [ ] WebView loads successfully
- [ ] Back button navigation works
- [ ] Push notifications display
- [ ] File upload works in background
- [ ] File download works in background
- [ ] Update notification appears
- [ ] Required update is non-dismissible
- [ ] Optional update can be dismissed

## Troubleshooting

### Build Issues

**Gradle not working:**
```bash
chmod +x gradlew
./gradlew clean build
```

**JAVA_HOME not set:**
```bash
export JAVA_HOME=/path/to/jdk17
./gradlew build
```

**Kotlin version mismatch:**
- Verify JDK 17+ installed
- Check Kotlin plugin version in Studio

### Runtime Issues

**WebView blank:**
- Ensure backend is running
- Check localhost:8080 is accessible
- Try different port number

**Notifications not showing:**
- Grant notification permission
- Check Android 13+ runtime perms
- Verify notification channels created

**Files not uploading:**
- Check file storage permissions
- Verify network connectivity
- Check backend file upload endpoint

## API Requirements

The app expects these backend endpoints:

```
GET /api/messages?userId={userId}
GET /ver.json
POST /upload
```

See [ANDROID_INTEGRATION.md](ANDROID_INTEGRATION.md) for details.

## Documentation

- [Android App README](android/README.md) - Comprehensive guide
- [Integration Guide](ANDROID_INTEGRATION.md) - Backend integration
- [Build Status](ANDROID_BUILD_STATUS.md) - Build verification
- [Compatibility Report](KOTLIN_JAVA_GRADLE_COMPATIBILITY.md) - Version compatibility

## Important Notes

- ✅ All Java/Gradle/Kotlin versions are compatible
- ✅ No deprecated APIs used
- ✅ Supports Android 8.0+ (API 26)
- ✅ Background services continue after app exit
- ✅ Works offline with local caching
- ⚠️ Requires cleartext traffic for localhost (use HTTPS in production)

## Contributing

When modifying the Android app:

1. Follow [Kotlin style guide](https://kotlinlang.org/docs/coding-conventions.html)
2. Update version in build.gradle.kts
3. Update ver.json for new releases
4. Test on min SDK 26 device
5. Document API changes

## Release Checklist

Before publishing a release:

- [ ] All tests passing
- [ ] UI tested on multiple devices
- [ ] Notifications working
- [ ] File operations tested
- [ ] Update system verified
- [ ] ver.json updated with info
- [ ] APK signed with production key
- [ ] Uploaded to release URL
- [ ] Version info accessible

## Support

For issues:
1. Check troubleshooting section
2. Review compatibility report
3. Check backend logs
4. Open GitHub issue

## License

Same as 4 Messenger project

