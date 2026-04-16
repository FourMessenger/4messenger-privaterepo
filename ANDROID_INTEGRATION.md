# Android App Integration Guide

This guide explains how to integrate the Android app with the 4 Messenger web application.

## Frontend Configuration

### 1. Update Build Process

The frontend now builds to support the Android app. The web app is served on `localhost:8080` which the Android app connects to via WebView.

### 2. Version File (ver.json)

Located in `public/ver.json`, this file provides update information to the Android app:

```json
{
  "version": "1.0.0",
  "required": false,
  "downloadUrl": "https://github.com/FourMessenger/4messenger-android/releases/download/v1.0.0/4messenger.apk",
  "releaseNotes": "Initial release...",
  "whatsNew": ["Feature 1", "Feature 2"],
  "minimumSdkVersion": 26,
  "releaseDate": "2026-04-16"
}
```

**Update this file for each version release:**
- Increment version number
- Add download URL
- List new features in whatsNew
- Update release date

### 3. API Endpoints

Ensure your backend provides these endpoints for the Android app:

#### Check Messages
```
GET /api/messages?userId={userId}
Headers: Authorization: Bearer {authToken}
Response: [{id, senderId, content, timestamp, read}]
```

#### File Upload
```
POST /upload
Headers: Content-Type: multipart/form-data
Body: {file, fileName, fileSize}
```

#### Mobile Detection

Useful for the web app to adjust UI for mobile:

```typescript
// In your web app
const androidApp = window.AndroidApp;
if (androidApp) {
  const deviceInfo = JSON.parse(androidApp.getDeviceInfo());
  console.log('Running on Android:', deviceInfo.platform);
}
```

## Backend Configuration

### 1. Message Polling API

The Android app polls `/api/messages` every 30 seconds to check for new messages.

Implement efficient polling:
- Cache previous message IDs
- Return only new messages
- Include read status
- Timestamp-based queries

Example implementation:
```javascript
app.get('/api/messages', authenticateToken, (req, res) => {
  const userId = req.query.userId;
  const lastCheck = req.query.lastCheck || 0;
  
  // Get messages newer than lastCheck
  const messages = getNewMessages(userId, lastCheck);
  res.json(messages);
});
```

### 2. File Upload Manager

Android app sends files via multipart upload:

```javascript
app.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  const file = req.file;
  const fileName = req.body.fileName;
  
  // Save file
  const filePath = path.join('uploads', userId, fileName);
  // Move file from temp location
  
  res.json({ success: true, fileName, path: filePath });
});
```

### 3. Server Configuration for Background Services

The Android app maintains persistent connections:

- Use connection pooling
- Implement keep-alive
- Handle timeout gracefully
- Support resumable uploads/downloads

## Development

### 1. Run Frontend
```bash
npm run dev
# Frontend runs on http://localhost:5173
# Or configure to run on http://localhost:8080
```

### 2. Build Android App

From the `android/` directory:

```bash
# Build debug APK
./gradlew assembleDebug

# Install on emulator/device
./gradlew installDebug
```

### 3. Test WebView Integration

1. Start the frontend development server
2. Build and run Android app
3. Check WebView loads the web app
4. Test JavaScript interface:

```javascript
// In browser console
AndroidApp.showToast("Hello from Web!");
console.log(AndroidApp.getAppVersion());
```

## Important Notes

### Java/Gradle/Kotlin Compatibility Checklist

✅ **Versions Used:**
- Kotlin 1.9.22 (compatible with Java 8+)
- Gradle 8.2 (latest stable)
- Gradle Android Plugin 8.2.0
- Compile SDK 34 (Android 14)
- Target SDK 34
- Min SDK 26 (Android 8.0)
- Java 17 target

✅ **Compatibility Verified:**
- All Kotlin/Java APIs are compatible
- No deprecated APIs used
- All dependencies support target SDK 34
- Gradle build system fully compatible

### Required Changes for Production

1. **Update ApplicationID** (AndroidManifest.xml)
   ```xml
   android:name="com.messenger4.android"
   ```

2. **Update Version** (app/build.gradle.kts)
   ```kotlin
   versionCode = 2  // Increment for each release
   versionName = "1.0.1"
   ```

3. **Update ver.json** (public/ver.json)
   ```json
   {
     "version": "1.0.1",
     "downloadUrl": "NEW_APK_URL"
   }
   ```

4. **Sign APK for Release**
   Use production keystore and signing configuration

## Troubleshooting Integration

### WebView Not Loading
- Check backend is running
- Verify `usesCleartextTraffic="true"` in manifest
- Check localhost connectivity

### Notifications Not Showing
- Verify notification permissions granted
- Check Android 13+ runtime permissions
- Ensure NotificationChannel is created

### File Operations Failing
- Verify file permissions granted
- Check storage directory exists
- Ensure network connectivity

### Update Check Not Working
- Verify ver.json is accessible
- Check version format (semantic versioning)
- Ensure JSON is valid

## Release Checklist

Before releasing a new version:

- [ ] Update `ver.json` with new version
- [ ] Increment `versionCode` in app/build.gradle.kts
- [ ] Update `versionName`
- [ ] Generate signed APK: `./gradlew assembleRelease`
- [ ] Test on min SDK 26 device
- [ ] Test push notifications
- [ ] Test file upload/download
- [ ] Test update notification
- [ ] Upload APK to release URL
- [ ] Verify ver.json accessible
- [ ] Test update detection in app

## Performance Optimization

### For Android App

1. **Background Tasks**
   - Push notification polling: 30 seconds
   - Update checking: 6 hours
   - Adjust intervals based on battery usage

2. **Network Optimization**
   - Use connection pooling (OkHttp)
   - Implement request caching
   - Support range requests for downloads

3. **Storage**
   - Clean old cached files regularly
   - Use efficient JSON serialization
   - Implement proper pagination

## Security Considerations

1. **HTTPS in Production**
   - Change localhost to production domain
   - Use valid SSL certificates
   - Implement certificate pinning

2. **Authentication**
   - Use secure token storage
   - Implement token refresh
   - Validate all API responses

3. **File Operations**
   - Scan uploaded files for malware
   - Validate file types
   - Implement rate limiting

