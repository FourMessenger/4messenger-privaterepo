# Push Notifications Testing Guide

## Summary of Fixes

Your push API had **4 critical issues** that have been fixed:

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| **No VAPID public key endpoint** | Client couldn't get the key from server | Added GET `/api/push/vapid-key` endpoint |
| **Client not sending VAPID key** | Browser subscription didn't include `applicationServerKey` | Updated client to fetch and pass key in Base64 format |
| **Missing VAPID configuration** | Server had no keys at all | Generated and configured keys in config.json |
| **No debugging logs** | Impossible to troubleshoot failures | Added detailed logging to push notification sender |

## Complete Testing Steps

### Step 1: Start Server with Clean VAPID Keys

```bash
cd /workspaces/4messenger/server
npm install  # ensure web-push is installed
npm start
```

**Expected output:**
```
[PUSH] VAPID keys configured successfully
```

### Step 2: Verify VAPID Keys Are Available

In a new terminal, test the endpoint:
```bash
curl http://localhost:3000/api/push/vapid-key
```

**Expected response:**
```json
{"vapidPublicKey":"BPDe_ccQX1rEx7SDi02PY3kXyYPdQeH_yqQ-osSl2NNDDN9iAPUa9RdE2_hseEGxVW8lZWp9dO9fnp1IuAOn3LQ"}
```

### Step 3: Open the App and Allow Notifications

1. Open http://localhost:5173 in browser
2. Login with a test account
3. Browser should prompt for notification permission
4. Click "Allow"

**Check browser console (F12):**
```
[Push] Retrieved VAPID public key from server
[Push] Successfully subscribed to push notifications
```

### Step 4: Verify Subscription Stored

In browser DevTools, go to:
- **Application tab** → **Storage** → **LocalStorage** → select your website URL
- Look for key `4messenger-push-subscription`
- Value should contain an `endpoint` starting with `https://`

### Step 5: Test Notification Sending

#### Method A: Test with Another Account
1. Open a second browser tab (or incognito window)
2. Login with a different account
3. In the first tab, send a message
4. In the second tab, close it or go to a different website
5. In the first tab, send another message

**Check server logs:**
```
[PUSH] Attempting to send notifications to 1 user(s): user-uuid-here
[PUSH] User user-uuid-here has 1 active subscription(s)
[PUSH] ✓ Successfully sent notification to user-uuid-here
[PUSH] Summary: 1 sent, 0 failed
```

#### Method B: Direct API Test
```bash
# 1. Get your auth token from browser DevTools
# Application → Storage → SessionStorage → look for authToken value

# 2. Test the subscription endpoint
curl -X GET http://localhost:3000/api/push/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should return array of subscriptions with endpoints
```

### Step 6: Verify Desktop Notification

When a notification is sent and you're offline:
- ✅ Desktop notification should appear
- ✅ Should show "4 Messenger" as title
- ✅ Should show message preview
- ✅ Clicking it should open the chat

## Debugging Checklist

### ❌ No subscriptions appear in GET /api/push/subscriptions

**Possible causes:**
1. Notification permission not granted
   - Fix: Browser icon → Site settings → Notifications → Allow
2. Service worker not registered
   - Check: DevTools → Application → Service Workers
3. Client code error fetching VAPID key
   - Check: Console for [Push] errors

**Debug:**
```javascript
// In browser console
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log(sub);
  });
});
```

### ❌ Server shows "User has 0 active subscription(s)"

**Causes:**
1. Subscriptions table is empty
2. Subscriptions were deleted (410/404 errors)
3. User ID mismatch

**Debug:**
```bash
# Check database directly
node -e "
const InitSqlJs = require('sql.js');
const fs = require('fs');
const data = fs.readFileSync('./data/messenger.db');
const SQL = InitSqlJs.Database;

InitSqlJs().then(SQL => {
  const db = new SQL.Database(new Uint8Array(data));
  const result = db.exec('SELECT user_id, endpoint, created_at FROM push_subscriptions');
  console.log(JSON.stringify(result, null, 2));
});
"
```

### ❌ Server logs "Failed to send" with ENOTFOUND error

**Cause:** Push service endpoint is invalid or browser certificate issue

**Fix:**
1. Check endpoint URL starts with `https://`
2. Ensure subscription has `keys.auth` and `keys.p256dh`
3. Verify VAPID keys are valid

### ❌ Client gets 503 "Push notifications not available"

**Causes:**
1. `web-push` module not installed
2. VAPID keys not configured in config.json

**Fixes:**
```bash
# Install web-push
npm install web-push

# Regenerate VAPID keys
node generate-vapid-keys.js
```

### ❌ "applicationServerKey is not valid" error

**Cause:** VAPID public key format is wrong (likely wrong encoding)

**Fix:** The client should handle Base64 URL-safe encoding:
```javascript
// This is handled correctly in updated App.tsx
const applicationServerKey = vapidPublicKey ? 
  new Uint8Array(atob(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0))) :
  undefined;
```

## Monitoring Commands

### Watch server logs for push events
```bash
cd server && npm start 2>&1 | grep -i push
```

### Check subscription count by user
```bash
node -e "
const InitSqlJs = require('sql.js');
const fs = require('fs');
const data = fs.readFileSync('./data/messenger.db');

InitSqlJs().then(SQL => {
  const db = new SQL.Database(new Uint8Array(data));
  const result = db.exec('SELECT user_id, COUNT(*) as count FROM push_subscriptions GROUP BY user_id');
  console.table(result[0].values);
});
"
```

### Monitor VAPID configuration
```bash
grep -A 5 '"push"' server/config.json
```

## Performance Testing

Test with multiple subscriptions:

```javascript
// In browser console, create multiple fake subscriptions
async function testMultipleSubs() {
  const reg = await navigator.serviceWorker.ready;
  const subs = await reg.pushManager.getSubscription();
  
  // Current subscriptions for this user:
  console.log('Subscriptions:', subs);
}
```

## Common Success Indicators

✅ You'll know it's working when:
1. Server logs show `[PUSH] VAPID keys configured successfully` on startup
2. Browser console shows `[Push] Successfully subscribed...`
3. Server console shows `[PUSH] ✓ Successfully sent notification...`
4. Desktop notification appears even when browser tab is closed
5. Clicking notification opens the correct chat

## API Endpoints Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/push/vapid-key` | GET | No | Get VAPID public key |
| `/api/push/subscribe` | POST | Yes | Register push subscription |
| `/api/push/unsubscribe` | POST | Yes | Unregister push subscription |
| `/api/push/subscriptions` | GET | Yes | List user's subscriptions |

## Regenerating VAPID Keys

If you need fresh keys (all subscriptions will become invalid):

```bash
cd server
node generate-vapid-keys.js
npm start
```

All users will need to re-subscribe in browser after regeneration.
