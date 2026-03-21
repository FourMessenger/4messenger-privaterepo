# Muted Users & Subscriptions - Quick Test Guide

## What Changed

✅ **Server-side:**
- New `/api/muted-users` endpoints (GET, POST, DELETE)
- New `muted_users` database table
- Push notifications check if sender is muted before sending
- Returns logs showing if notifications were skipped due to muting

✅ **Client-side:**
- New "Notifications" tab in User Settings
- Auto-fetch muted users and subscriptions on login
- UI to view and unmute users
- Server notification toggle

## Test Flow (5 minutes)

### 1. Start the Server
```bash
cd /workspaces/4messenger/server
npm start
```

Wait for `[PUSH] VAPID keys configured successfully`

### 2. Open App with Two Users

**Browser 1 - User A:**
- Open http://localhost:5173
- Login (e.g., `admin` / `admin123`)

**Browser 2 - User B:**
- Open http://localhost:5173 in new INCOGNITO window
- Login with different user (create new if needed)

### 3. Check Notification Settings

**Browser 1 (User A):**
- Click avatar → Settings → Notifications tab
- Should see:
  - ✓ "Server Notifications: Enabled"
  - ✓ "Muted Users (0)"
  - ✓ "Active Push Subscriptions"

### 4. Mute User B (Via Console)

In **Browser 1 (User A)** console (F12 → Console):

```javascript
// Get User B's ID
const userB = useStore.getState().users.find(u => u.username === 'username_of_user_b');
console.log('Found user:', userB);

// Mute them
await useStore.getState().muteUser(userB.id);

// Verify muted
console.log('Muted users:', useStore.getState().mutedUsers);
```

### 5. Check Settings Updated

In **Browser 1 (User A):**
- Go back to Settings → Notifications
- Should now show: "Muted Users (1)"
- See User B listed with "Unmute" button

### 6. Test Push (Don't Receive)

**Browser 1 (User A):**
- Note the time
- Check server logs

**Browser 2 (User B):**
- Open a direct chat with User A
- Send a message: "Test message"

**Back to Server Console:**
- Should see:
  ```
  [PUSH] ⊘ Skipped user-a-id (sender user-b-id is muted)
  ```

✅ **SUCCESS**: Push wasn't sent because User B is muted by User A

### 7. Unmute and Test Again

In **Browser 1 (User A)** Settings → Notifications:
- Click "Unmute" button next to User B
- Settings should show "Muted Users (0)" again

**Browser 2 (User B):**
- Send another message

**Server Console:**
- Should now see:
  ```
  [PUSH] ✓ Successfully sent notification to user-a-id
  ```

✅ **SUCCESS**: Push was sent because User B is no longer muted

## Verify Database

Check that muting actually modified the database:

```bash
# While server is running
node -e "
const InitSqlJs = require('sql.js');
const fs = require('fs');
const data = fs.readFileSync('./data/messenger.db');

InitSqlJs().then(SQL => {
  const db = new SQL.Database(new Uint8Array(data));
  const result = db.exec('SELECT * FROM muted_users;');
  if (result.length > 0) {
    console.log('Muted users in database:');
    console.table(result[0].values);
  } else {
    console.log('No muted users yet');
  }
});
" 2>/dev/null
```

## Troubleshooting

**Issue:** "Muted Users (0)" shows but nothing appears when clicking mute
- **Check:** Network tab → should see PUT request to `/api/muted-users/userId`
- **Check:** Server console for `[MUTE]` logs
- **Fix:** Restart both browser and server

**Issue:** Unmute doesn't work
- **Check:** Browser console for errors
- **Check:** Server logs for error details  
- **Fix:** Verify user IDs are correct format

**Issue:** Push still sends after muting
- **Check:** Server received mute request (look for `[MUTE]` log)
- **Check:** Message shows sender is muted (look for `⊘ Skipped` log)
- **Server console:** Search for `[MUTE]` to verify muting worked

## API Testing (Manual)

Get your auth token from browser:
- DevTools → Application → SessionStorage → find `authToken`

Then test endpoints:

```bash
# Get muted users
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/muted-users

# Mute a user (replace USER_ID)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/muted-users/USER_ID

# Unmute a user
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/muted-users/USER_ID

# Get push subscriptions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/push/subscriptions
```

## Log Indicators

**When it's working:**
```
[MUTE] User abc muted def
[Push] Loaded 1 existing subscription(s)
[PUSH] ⊘ Skipped userid (sender is muted)
[PUSH] Summary: 0 sent, 0 failed, 1 muted
```

**When there's an error:**
```
[MUTE] Failed to mute user
[Push] Failed to fetch subscriptions
[PUSH] Error in sendPushNotifications
```

## How Long Should This Take?

- Setup: 1 minute (npm start)
- Two browser login: 1 minute  
- Navigate to settings: 30 seconds
- Mute user: 10 seconds
- Send/receive message: 20 seconds
- **Total: ~3-4 minutes**

Repeat with unmute to verify both flows: **+1 minute**

## Next: UI Integration

Current limitation: Must mute via console. To add mute button:
1. Find where user names appear (e.g., chat header, member list)
2. Add onClick handler:
   ```jsx
   onClick={() => muteUser(userId)}
   ```
3. Show conditional button text:
   ```jsx
   isMuted(userId) ? 'Unmute' : 'Mute'
   ```

See [MUTED_USERS_IMPLEMENTATION.md](MUTED_USERS_IMPLEMENTATION.md) for details.
