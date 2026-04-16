# 4 Messenger Android App

Complete Android application for 4 Messenger with WebView rendering, background services, and automatic updates.

## Features

✅ **WebView Integration**
- Renders 4 Messenger web application from localhost
- Hardware-accelerated rendering for smooth performance
- JavaScript interface for app-to-web communication

✅ **Push Notification System**
- Periodic background polling (every 30 seconds)
- Multi-server support
- Local notification display
- Message persistence to local storage

✅ **File Management**
- **Upload System**: Background file uploads with continuation after app exit
- **Download System**: Background file downloads with continuation after app exit
- Progress tracking
- Pause/Resume functionality
- Automatic retry mechanism

✅ **Automatic Update System**
- Periodic update checking (every 6 hours)
- ver.json file parsing from frontend
- Required vs Optional update handling
- Required updates cannot be dismissed
- What's new information display

✅ **Background Services**
- WorkManager for reliable background task execution
- Boot receiver for service restart after device reboot
- Persistent background services for uploads/downloads

## Architecture

### Java/Gradle/Kotlin Compatibility

The project uses:
- **Kotlin 1.9.22** - Latest stable version with full Java interoperability
- **Gradle 8.2** - Latest stable build system
- **Java 17** - Target JVM version for compilation
- **Android Gradle Plugin 8.2.0** - Latest stable version
- **Compile SDK 34** - Android 14 support
- **Min SDK 26** - Android 8.0 support

All versions are compatible and tested.

### Project Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/messenger4/android/
│   │   │   ├── MainActivity.kt - Main app entry point
│   │   │   ├── WebAppInterface.kt - JS interface
│   │   │   ├── services/
│   │   │   │   ├── PushNotificationService.kt
│   │   │   │   ├── FileUploadService.kt
│   │   │   │   ├── FileDownloadService.kt
│   │   │   │   └── UpdateCheckService.kt
│   │   │   ├── models/
│   │   │   │   └── Models.kt
│   │   │   ├── utils/
│   │   │   │   ├── NotificationUtil.kt
│   │   │   │   ├── ServerUtil.kt
│   │   │   │   ├── UpdateUtil.kt
│   │   │   │   └── StorageUtil.kt
│   │   │   └── receivers/
│   │   │       └── Receivers.kt
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   ├── values/
│   │   │   └── xml/
│   │   └── AndroidManifest.xml
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── gradlew
└── gradlew.bat
```

## Building the App

### Requirements

- Android Studio 2022.3 or later
- JDK 17 or later
- Android SDK 34
- Gradle 8.2

### Build Steps

1. **Open Project**
   ```bash
   cd android
   ```

2. **Build Application**
   ```bash
   ./gradlew build
   ```

3. **Generate Debug APK**
   ```bash
   ./gradlew assembleDebug
   ```

4. **Generate Release APK**
   ```bash
   ./gradlew assembleRelease
   ```

5. **Install on Device/Emulator**
   ```bash
   ./gradlew installDebug
   ```

### Development

Running the app:
```bash
./gradlew run
```

Clean build:
```bash
./gradlew clean build
```

## Configuration

### App Settings

Edit `android/app/build.gradle.kts`:

```kotlin
defaultConfig {
    applicationId = "com.messenger4.android"
    minSdk = 26           // Minimum Android version
    targetSdk = 34        // Target Android version
    versionCode = 1       // Increment for each release
    versionName = "1.0.0" // Semantic versioning
}
```

### WebView Configuration

The app connects to `http://localhost:8080` by default. Modify in [MainActivity.kt](app/src/main/java/com/messenger4/android/MainActivity.kt):

```kotlin
// Load localhost
loadUrl("http://localhost:8080")
```

### Background Service Settings

Push notification check interval (PushNotificationWorker):
```kotlin
30, TimeUnit.SECONDS  // Check every 30 seconds
```

Update check interval (UpdateCheckWorker):
```kotlin
6, TimeUnit.HOURS     // Check every 6 hours
```

## Permissions

The app requests the following permissions:

- `INTERNET` - Network access for server communication
- `ACCESS_NETWORK_STATE` - Check network availability
- `READ_EXTERNAL_STORAGE` - Read files for upload
- `WRITE_EXTERNAL_STORAGE` - Save downloaded files
- `POST_NOTIFICATIONS` - Show notifications (Android 13+)
- `SCHEDULE_EXACT_ALARM` - Precise scheduling (Android 12+)

## API Endpoints Expected

The app expects the following API endpoints:

### Message Checking
```
GET /api/messages?userId={userId}
Authorization: Bearer {authToken}
```

Returns:
```json
[
  {
    "id": "msg_1",
    "senderId": "user_2",
    "content": "Hello",
    "timestamp": 1234567890,
    "read": false
  }
]
```

### File Upload
```
POST /upload
multipart/form-data:
  - file: binary
  - fileName: string
  - fileSize: number
```

### Version Check
```
GET /ver.json
```

Returns:
```json
{
  "version": "1.0.0",
  "required": false,
  "downloadUrl": "https://...",
  "releaseNotes": "...",
  "whatsNew": ["Feature 1", "Feature 2"],
  "minimumSdkVersion": 26,
  "releaseDate": "2026-04-16"
}
```

## Dependencies

- `androidx.core:core:1.12.0` - Core Android utilities
- `androidx.appcompat:appcompat:1.6.1` - AppCompat library
- `androidx.constraintlayout:constraintlayout:2.1.4` - ConstraintLayout
- `androidx.lifecycle:lifecycle-runtime-ktx:2.7.0` - Lifecycle management
- `androidx.work:work-runtime-ktx:2.8.1` - WorkManager
- `com.squareup.okhttp3:okhttp:4.11.0` - HTTP client
- `com.google.code.gson:gson:2.10.1` - JSON parsing
- `androidx.datastore:datastore-preferences:1.0.0` - Data persistence

## Troubleshooting

### Gradle Build Issues

**Issue**: `gradle: command not found`
```bash
chmod +x gradlew
./gradlew build
```

**Issue**: `JAVA_HOME is not set`
```bash
export JAVA_HOME=/path/to/jdk17
./gradlew build
```

**Issue**: Kotlin/Java version mismatch
- Ensure JDK 17 or later is installed
- Check `build.gradle.kts` compileOptions match

### Compilation Errors

**Issue**: `Cannot find symbol ServiceUtil`
- All utility classes must be in `com.messenger4.android.utils` package
- Check import statements match package names

**Issue**: ProGuard shrinking errors
- Rules are defined in `proguard-rules.pro`
- All app classes are kept from obfuscation

### Runtime Issues

**Issue**: WebView not loading
- Ensure backend server is running on `localhost:8080`
- Check `android:usesCleartextTraffic="true"` in manifest

**Issue**: Notifications not showing
- Request notification permission (Android 13+)
- Check notification channel is created

## Running Tests

```bash
./gradlew test              # Unit tests
./gradlew connectedAndroidTest  # Instrumented tests
```

## Packaging for Distribution

### Generate Signed Release APK

1. Create keystore (if not exists):
```bash
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias 4messenger
```

2. Sign APK:
```bash
./gradlew assembleRelease
```

3. Verify signature:
```bash
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk
```

## Contributing

When contributing to the Android app:

1. Follow Kotlin style guide
2. Ensure Java/Gradle/Kotlin compatibility
3. Test on min SDK 26+ devices
4. Update ver.json for new releases
5. Document API changes

## License

Same license as 4 Messenger project

## Support

For issues or questions:
1. Check troubleshooting section
2. Review compatible versions
3. Open issue on GitHub
