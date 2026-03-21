# Push Notifications Quick Start

## What Was Added

### Server-Side Changes (`server/`)

1. **Database Table**: `push_subscriptions`
   - Stores user push notification subscriptions
   - Stores endpoint URLs, encryption keys, and tracking info
   - Automatically created on server startup

2. **API Endpoints** (all require authentication):
   - `POST /api/push/subscribe` - Register a push subscription
   - `POST /api/push/unsubscribe` - Remove a subscription
   - `GET /api/push/subscriptions` - List user's subscriptions

3. **Automatic Push Sending**:
   - When a message is sent, push notifications are automatically sent to offline members
   - Invalid/expired subscriptions are cleaned up in the background
   - Uses `web-push` npm package (pre-installed)

### Client-Side Changes

1. **Service Worker Updates** (`public/sw.js`)
   - Handles incoming push notifications (even when tab is closed)
   - Shows system notifications with sender info
   - Routes notification clicks to the relevant chat

2. **Push Subscription Setup** (`src/App.tsx`)
   - Automatically requests notification permission on login
   - Subscribes to push notifications via browser API
   - Sends subscription to server for storage
   - Listens for notification click events

## Getting Started

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Start Server
```bash
npm start
```

The server will automatically:
- Create the push_subscriptions table
- Set up push notification endpoints
- Enable notification sending when messages arrive

### Step 3: Build & Run Client
```bash
npm run dev
```

Open the app in your browser and log in.

### Step 4: Enable Notifications
- Browser will ask for notification permission
- Click "Allow" to enable push notifications
- App will automatically subscribe and sync with server

## Testing Push Notifications

### Test 1: Basic Notification

1. Open app and log in (allow notifications)
2. Open another browser window and log in to same account
3. In window 1: Send a message
4. In window 2: Click away from the app
5. Go back to window 1 and send another message
6. In window 2: You should see a system notification

### Test 2: Click Navigation

1. Enable notifications as above
2. Close window 2 completely (not just tab)
3. Send a message from window 1  
4. In system notification center, click the 4 Messenger notification
5. Window 2 should open and navigate to the chat

### Test 3: Multiple Servers

1. Set up two servers running on different ports (e.g., 5000 and 5001)
2. Log into both servers in the same browser
3. Send messages between servers
4. Both servers will send push notifications independently
5. Each notification shows which server it's from

## API Usage

### Subscribe to Push
```javascript
const subscription = await serviceWorkerReg.pushManager.subscribe({
  userVisibleOnly: true
});

await fetch('/api/push/subscribe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    subscription: subscription.toJSON()
  })
});
```

### Check Subscriptions
```javascript
const response = await fetch('/api/push/subscriptions', {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});
const subscriptions = await response.json();
```

### Unsubscribe
```javascript
await fetch('/api/push/unsubscribe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    endpoint: 'push-endpoint-url'
  })
});
```

## Troubleshooting

### "Notification permission denied"
- Check browser notification settings
- Clear site data and try again
- Some browsers require HTTPS

### No notifications appearing
1. **Check Service Worker**: DevTools → Application → Service Workers
2. **Check Push Permission**: DevTools → Console → `Notification.permission`
3. **Check Subscriptions**: `GET /api/push/subscriptions`
4. **Check Server Logs**: Look for `[PUSH]` messages

### "Push notifications not available"
- Server needs `web-push` package
- Check server startup logs for errors
- Verify `npm install` was run

### Notifications only work on localhost without HTTPS
- Use HTTPS in production
- Or run on localhost/127.0.0.1 for development
- Some browsers require HTTPS for push notifications

## Architecture

```
┌─────────────┐         ┌──────────────┐
│   Browser   │         │   Server     │
├─────────────┤         ├──────────────┤
│  App.tsx    │         │ Express API  │
│  (subscribe)│────────→│ POST/api/push│
└─────────────┘         │              │
       ↓                │ Database     │
  Service Worker        │ Table:       │
  (sw.js)               │ push_subscr. │
       ↓                └──────────────┘
  Push Event                  ↑
       ↓                      │
  Show Notification           │
       ↓              Message sent + 
  User clicks         Push notification
       → Opens App           ↓
                      web-push lib
                      sends to browser
```

## Security Notes

- Push subscriptions are tied to user accounts
- Each user can only access their own subscriptions
- Subscriptions are not shared between servers
- Encryption keys are stored securely on server
- Notification content is encrypted in transit

## Browser Compatibility

| Browser | Version | Desktop | Mobile |
|---------|---------|---------|--------|
| Chrome  | 50+     | ✅      | ✅     |
| Firefox | 44+     | ✅      | ✅     |
| Edge    | 17+     | ✅      | ✅     |
| Safari  | 16+     | ✅      | ✅*    |
| Opera   | 37+     | ✅      | ✅     |

*Safari on iOS requires 16.1+

## Performance Impact

- Minimal database overhead (indexed queries)
- Push sending is non-blocking (async)
- Automatic cleanup of invalid subscriptions
- No impact on message sending performance

## What Happens When...

### User logs out
- Subscription remains in database
- Push notifications still sent (if notification permission is enabled)
- User can see notifications in notification center

### Browser notification permission changes
- App detects change and updates state
- No new subscription attempts if denied
- Can be re-enabled in browser settings

### Server restarts
- Subscriptions persist in database
- Push notifications resume normally
- No user action needed

### Multiple devices
- Each device has separate subscription
- Each receives independent push notifications
- Subscriptions managed per-device

## Advanced Configuration

To generate VAPID keys for production (optional):

```bash
cd server
npx web-push generate-vapid-keys
```

Then add to config.json:
```json
{
  "push": {
    "vapidPublicKey": "...",
    "vapidPrivateKey": "..."
  }
}
```

## Next Steps

1. **Test in your environment**
2. **Deploy to staging**
3. **Monitor server logs for errors**
4. **Gather user feedback**
5. **Consider VAPID key setup for production**
6. **Plan notification preferences/settings**

## Support

For issues or questions:
1. Check browser console for errors
2. Check server logs for `[PUSH]` messages
3. Review Notification API docs: https://developer.mozilla.org/en-US/docs/Web/API/Notification
4. Check Service Worker status in DevTools

## Files Changed

- `server/server.js` - Added push endpoints, database table, push sending
- `server/package.json` - Added web-push dependency
- `public/sw.js` - Added push event handler
- `src/App.tsx` - Added push subscription setup
- `PUSH_NOTIFICATIONS_SETUP.md` - Comprehensive guide
- `PUSH_NOTIFICATIONS_QUICKSTART.md` - Quick reference (this file)
