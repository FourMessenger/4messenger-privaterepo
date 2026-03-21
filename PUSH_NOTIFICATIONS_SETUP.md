# Push Notifications Setup Guide

## Overview

This guide explains how to set up and use push notifications in 4 Messenger. Push notifications allow you to receive messages even when your browser tab is closed.

## Features

✅ **Push notifications when tab is closed** - Receive notifications even when not actively using the app
✅ **Multi-server support** - Works across all server instances you're connected to  
✅ **Token-based authentication** - Uses your existing authentication tokens
✅ **Offline support** - Service Worker keeps you connected
✅ **Click to open chat** - Click notifications to jump to the relevant chat

## Architecture

### Client-Side Components

1. **Service Worker** (`public/sw.js`)
   - Handles incoming push notifications
   - Shows system notifications even when tab is closed
   - Manages notification clicks to open the app

2. **Push Subscription** (`src/App.tsx`)
   - Requests user notification permission
   - Subscribes to push notifications via PushManager
   - Sends subscription to server for storage

3. **Note Handler** (Service Worker)
   - Listens for `NOTIFICATION_CLICKED` messages
   - Navigates to the relevant chat when clicked

### Server-Side Components

1. **Database Table** - `push_subscriptions`
   - Stores user push subscription endpoints
   - Stores auth keys and P256DH keys for encryption
   - Tracks created_at and last_used timestamps

2. **API Endpoints**
   - `POST /api/push/subscribe` - Register a push subscription
   - `POST /api/push/unsubscribe` - Remove a push subscription  
   - `GET /api/push/subscriptions` - List user's subscriptions

3. **Push Sending**
   - Automatically sends push notifications when messages arrive
   - Uses Web Push API (`web-push` npm package)
   - Handles invalid/expired subscriptions gracefully

## Setup Instructions

### Prerequisites

- Modern browser with Push API support (Chrome, Firefox, Edge, Safari 16+)
- HTTPS connection (required for push notifications, except localhost)
- Service Worker support in browser

### Installation

1. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

   This installs the `web-push` package needed to send push notifications.

2. **Browser permission**
   - When you first log in, the app will request notification permission
   - Click "Allow" to enable push notifications
   - You can change this in browser settings anytime

3. **Automatic setup**
   - Once permission is granted, the app automatically:
     - Subscribes to push notifications
     - Sends subscription to server
     - Saves subscription locally for reference

## How It Works

### Message Flow - User Offline

```
User A sends message
    ↓
Server receives message
    ↓
Server broadcasts via WebSocket to online members
    ↓
Server also sends push notifications to offline members
    ↓
Service Worker receives push notification
    ↓
Shows system notification (even if tab is closed)
    ↓
User clicks notification
    ↓
Service Worker opens/focuses app
    ↓
App navigates to the relevant chat
```

### Push Notification Flow

```
1. User enables notifications via browser permission dialog
2. App requests push subscription from browser
3. Subscription contains:
   - endpoint: URL where server sends push messages
   - keys: Encryption keys for secure delivery
4. Subscription sent to server via POST /api/push/subscribe
5. Server stores subscription in database
6. When message is sent:
   - Server sends message via WebSocket to online users
   - Server sends push notification to offline subscribers
7. Service Worker receives push in browser
8. Browser shows system notification
9. User can click notification to open app
```

## Configuration

### Server Configuration

No special configuration needed! The server automatically:
- Creates the `push_subscriptions` table on first run
- Sends push notifications to users with stored subscriptions
- Cleans up invalid/expired subscriptions

### Browser Configuration

Push notifications can be managed in browser settings:
- **Chrome/Edge**: Settings → Privacy and security → Site settings → Notifications
- **Firefox**: Preferences → Privacy & Security → Permissions → Notifications  
- **Safari**: Notifications → Websites → 4 Messenger

## Troubleshooting

### Notifications not appearing

1. **Check browser permission**
   - Open browser settings and verify notifications are allowed for your server
   - You may need to reload the page

2. **Check Service Worker**
   - Open DevTools → Application → Service Workers
   - Verify Service Worker is active and running

3. **Check subscription**
   - Open DevTools → Application → Service Workers → Push
   - Verify you have an active subscription

4. **Check server logs**
   - Look for `[PUSH]` messages in server output
   - Verify subscriptions are being stored

### "Push notifications not available"

- Server doesn't have `web-push` package installed
- Run `npm install web-push` in server directory
- Restart server

### "Notification permission denied"

- You previously denied notifications
- Check browser settings and re-enable notifications for your server
- Reload the page and try again

## Testing

### Manual Test

1. Open the app and log in
2. Grant notification permission when prompted
3. Open two windows - one with app open, one with it closed
4. Send a message from one window
5. In the closed window's browser:
   - Check notifications (may appear in notification center)
   - System notification should appear (if enabled)

### Check Subscriptions (Server Admin)

TODO: Add API endpoint to list/manage subscriptions (admin only)

## Privacy & Security

- Push subscriptions are stored **only on your server**
- Subscriptions are tied to user accounts
- Each user can only see/delete their own subscriptions
- Push messages can be deleted via browser settings
- Subscriptions automatically clean up if they become invalid

## Browser Compatibility

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome  | ✅      | ✅     | Full support |
| Firefox | ✅      | ✅     | Full support |
| Edge    | ✅      | ✅     | Full support |
| Safari  | ✅ (16+)| ✅ (16)| Requires iOS 16.1+ |
| Opera   | ✅      | ✅     | Full support |

## Advanced Usage

### Multiple Servers

Each server can send push notifications independently:
- VAPID keys are optional (browser handles defaults)
- Subscriptions are stored per-server
- Notifications show which server they came from

### API Reference

#### Subscribe to push
```bash
curl -X POST https://your-server/api/push/subscribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "...",
      "keys": {
        "auth": "...",
        "p256dh": "..."
      }
    }
  }'
```

#### Unsubscribe from push
```bash
curl -X POST https://your-server/api/push/unsubscribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "..."}'
```

#### List subscriptions
```bash
curl https://your-server/api/push/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Performance Considerations

- Push subscriptions are stored in database with minimal overhead
- Sending push notifications happens asynchronously (doesn't block message API)
- Expired/invalid subscriptions are automatically cleaned up
- Service Worker handles delivery efficiently

## Future Enhancements

Possible improvements:
- [ ] VAPID key configuration for production
- [ ] Admin panel to view/manage subscriptions
- [ ] Notification preferences per chat
- [ ] Sound/vibration options for notifications
- [ ] Notification history/archive
- [ ] Custom notification icons per chat
- [ ] Do Not Disturb schedules

## References

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push npm package](https://www.npmjs.com/package/web-push)
