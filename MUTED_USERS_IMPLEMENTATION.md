# Notification & Muted Users Management - Implementation Guide

## Overview

Users can now manage push notifications and mute other users from sending them notifications. This includes:
- Automatically fetching existing push subscriptions on login
- Viewing and managing muted users
- Toggling server-wide notification muting
- API endpoints for complete notification management

## Architecture

### Database
Added `muted_users` table:
```sql
CREATE TABLE muted_users (
  user_id TEXT NOT NULL,
  muted_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, muted_user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (muted_user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Server API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/muted-users` | GET | Yes | Get list of muted users |
| `/api/muted-users/:userId` | POST | Yes | Mute a user |
| `/api/muted-users/:userId` | DELETE | Yes | Unmute a user |
| `/api/push/subscriptions` | GET | Yes | Get push subscriptions |

### Client Features

#### Store Actions (Zustand)
- `fetchMutedUsers()` - Load muted users list
- `muteUser(userId)` - Mute a specific user
- `unmuteUser(userId)` - Unmute a specific user
- `isMuted(userId)` - Check if user is muted
- `fetchPushSubscriptions()` - Load active subscriptions

#### App Initialization
On login, automatically:
1. Fetches existing push subscriptions
2. Fetches list of muted users
3. Sets up push notification subscriptions if not existing

#### UI Component
New "Notifications" tab in User Settings:
- Server notification toggle
- Muted users list with unmute buttons
- Active subscriptions information

## How It Works

### Muting Users

**Client Flow:**
1. User opens Settings → Notifications tab
2. Muted users are fetched from server
3. User finds a user outside the muted list to mute (e.g., from chat)
4. Click "Mute" on that user (not yet implemented in chat - see below)
5. `POST /api/muted-users/:userId` is called
6. User is added to muted list locally and server-side

**Server Flow:**
1. Receive POST request with user ID to mute
2. Check user exists and isn't already muted
3. Insert into `muted_users` table
4. Log action

### Push Notifications After Muting

When a message is sent:
1. Server calls `sendPushNotifications(recipientIds, notification, senderUserId)`
2. For each recipient, check if sender is muted
3. If muted: skip push notification (but message still appears in chat)
4. If not muted: send push notification as normal

**Important:** Muting only affects push notifications, not messages. Messages from muted users still appear in chats normally.

### Auto-Subscription on Login

When user logs in:
```
useEffect → authToken changes → 
  fetchPushSubscriptions() → 
  fetchMutedUsers() →
  setupPushNotifications() (if not already subscribed)
```

## Testing the Feature

### Step 1: Start Server
```bash
cd server
npm start
```

### Step 2: Test with Two Users

**User A:**
1. Open Settings → Notifications tab
2. Should see "Muted Users (0)"
3. Send a message to User B

**User B:**
1. Open Settings → Notifications tab
2. Should see User A in their active subscriptions (if permission granted)
3. (Feature TBD: Add "Mute" button to chat interface)

### Step 3: Test Muting (Manual for Now)

Since the UI doesn't yet have a mute button in chat, test via browser console:

```javascript
// Get the store
const store = useStore.getState();

// Show muted users
console.log(store.mutedUsers);

// Mute User A (get their ID from store.users)
const userIdToMute = store.users.find(u => u.username === 'userA')?.id;
await store.muteUser(userIdToMute);

// Check muted list updated
console.log(store.mutedUsers);
```

### Step 4: Test Push Execution

Check server logs when User A sends a message to User B:

```
[PUSH] Attempting to send notifications to 1 user(s): user-b-id
[PUSH] User user-b-id has 1 active subscription(s)
[PUSH] ⊘ Skipped user-b-id (sender user-a-id is muted)
[PUSH] Summary: 0 sent, 0 failed, 1 muted
```

## Database Queries

Check muted users in database:

```bash
# From server directory
node -e "
const InitSqlJs = require('sql.js');
const fs = require('fs');
const data = fs.readFileSync('./data/messenger.db');

InitSqlJs().then(SQL => {
  const db = new SQL.Database(new Uint8Array(data));
  const result = db.exec('SELECT u1.username as muter, u2.username as muted_user FROM muted_users m JOIN users u1 ON m.user_id = u1.id JOIN users u2 ON m.muted_user_id = u2.id');
  console.table(result[0].values);
});
"
```

## Next Steps: UI Integration

To fully implement muting in the UI, add a "Mute" button contextually:

### Option 1: Chat Header
Add mute button to chat info header (when viewing a direct chat)

### Option 2: User Context Menu
Right-click on user name → "Mute" option

### Option 3: Chat Member List
In group chats, add mute button next to each member

### Implementation Code Template:
```tsx
<button 
  onClick={() => {
    const userId = activeChatData.participantId;
    store.muteUser(userId);
  }}
  className="... text-red-400 ..."
>
  {store.isMuted(userId) ? 'Unmute' : 'Mute'}
</button>
```

## Push Notification Check

Verify muting  doesn't break push:

1. User A mutes User C
2. User B sends message to User C → should receive push
3. User A sends message to User C → should NOT receive push (is muted)
4. User C sends message to both → both should receive push

## Error Handling

**Scenarios handled:**
- ✅ Trying to mute non-existent user → 404
- ✅ Trying to mute yourself → 400
- ✅ Trying to mute already muted user → 400
- ✅ Trying to unmute non-muted user → 404
- ✅ Network errors → logged and shown to user
- ✅ Missing VAPID keys → push notifications disabled gracefully

## Logs to Monitor

Server logs to watch:
```
[MUTE] User X muted Y
[MUTE] Fetch muted users failed
[PUSH] ⊘ Skipped userId (sender is muted)
[DB] Run error ...
```

Client console logs:
```
[Push] Loaded N existing subscription(s)
[Store] Failed to fetch muted users
Muted users updated in state
```

## Database Cleanup

If needed to reset muted users:

```sql
DELETE FROM muted_users;
VACUUM;
```

## Known Limitations

1. **No UI mute button yet** - Use console for testing
2. **Muting only affects push** - Messages still appear in chats
3. **No mute expiration** - Need to manually unmute
4. **No mute notifications** - Users don't know they're muted

## Future Enhancements

- [ ] Contextual mute buttons in chat UI
- [ ] Temporary mute options (1 hour, 8 hours, 1 day, forever)
- [ ] Mute notifications to the sender
- [ ] Quick unmute from push settings
- [ ] Mute patterns/regex for similar usernames
- [ ] Group muting (mute all in a group)
- [ ] Mute by message content (keywords)
