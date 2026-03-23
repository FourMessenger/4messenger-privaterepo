# E2EE Server Implementation Guide

## Overview

This guide describes the server-side changes needed to support offline-aware E2EE in 4 Messenger. The client now initializes E2EE keys even when not all participants are online.

---

## Key Concepts

### Before (Old)
```
Client/SendMessage:
  - Only send encryptedKeys if ALL users have public keys
  
Server/ReceiveKeys:
  - Store received encryptedKeys
  - User must be online when key is sent or they miss it
```

### After (New)
```
Client/SendMessage:
  - Initialize E2EE regardless of who's online
  - Send encryptedKey for each online participant
  - Offline participants will receive their key when they come online
  
Server/ReceiveKeys:
  - Accept partial encryptedKeys (not all users covered)
  - Queue wrapped keys for offline users
  - Distribute queued keys when user comes online
  - Handle multiple key updates for same chat
```

---

## Server API Endpoints

### 1. PUT /api/chats/{chatId}/keys

**Purpose**: Store E2EE wrapped keys for chat participants

**Request:**
```json
{
  "encryptedKeys": {
    "userId1": "wrapped_key_base64_for_user1",
    "userId2": "wrapped_key_base64_for_user2"
  }
}
```

**Current Behavior:**
- Stores all provided encryptedKeys
- Returns success when stored

**Required New Behavior:**
- Accept partial encryptedKeys (only some users)
- Merge with existing keys (don't overwrite)
- Track which users still need this key
- Return list of users who still need the key

**Updated Response:**
```json
{
  "status": "ok",
  "keysSent": 2,
  "pendingUsers": ["userId3", "userId4"],
  "message": "Keys stored for 2 users, 2 users awaiting public keys"
}
```

**Implementation Notes:**
- Schema: Store tuple of (chatId, userId, encryptedKey, sentAt)
- Prevent duplicates: Use unique constraint on (chatId, userId)
- Update: Allow re-sending key for same user (key rotation support)
- Retention: Keep keys until explicitly deleted or chat is deleted

### 2. GET /api/users/{userId}/pending-keys

**Purpose**: Retrieve pending E2EE keys for offline users when they come online

**Request:**
```
GET /api/users/{userId}/pending-keys
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "ok",
  "pendingKeys": [
    {
      "chatId": "chat_123",
      "encryptedKey": "wrapped_key_base64_for_this_user",
      "chatName": "Alice & Bob",
      "chatType": "direct",
      "senderUserId": "alice_id",
      "createdAt": "2024-03-23T10:30:00Z"
    },
    {
      "chatId": "group_456",
      "encryptedKey": "wrapped_key_base64_for_this_user",
      "chatName": "Dev Team",
      "chatType": "group",
      "createdAt": "2024-03-23T10:25:00Z"
    }
  ]
}
```

**Implementation Steps:**
1. Query all pending keys for this userId
2. Return with chat metadata (name, type, sender)
3. After returning, mark keys as "delivered" (soft delete or status flag)
4. Include pagination if many pending keys

### 3. POST /api/chats/group

**Purpose**: Create group chat with E2EE support (already exists, may need updates)

**Current Implementation:**
- User sends encryptedKeys for all participants

**New Implementation:**
- Accept partial encryptedKeys
- Create chat with only some users having wrapped keys
- Queue keys for remaining users
- Send notification to offline users when they come online

**Request:**
```json
{
  "name": "Dev Team",
  "participants": ["user1", "user2", "user3"],
  "description": "Our development team",
  "isChannel": false,
  "encryptedKeys": {
    "user1": "wrapped_key",
    "user2": "wrapped_key"
    // user3 is offline, key will be sent later
  }
}
```

**Response:**
```json
{
  "chatId": "group_123",
  "keysSent": 2,
  "pendingUsers": ["user3"]
}
```

### 4. POST /api/chats/direct

**Purpose**: Create direct chat (already exists, may need updates)

**Changes:**
- Same pattern as group chat: accept partial encryptedKeys
- If user2 is offline, store their wrapped key for later delivery

---

## Database Schema

### Current (Likely)
```sql
-- Chats table
CREATE TABLE chats (
  id VARCHAR(50) PRIMARY KEY,
  type ENUM('direct', 'group', 'channel'),
  created_at TIMESTAMP,
  ...
);

-- Chat participants
CREATE TABLE chat_participants (
  chat_id VARCHAR(50),
  user_id VARCHAR(50),
  joined_at TIMESTAMP,
  PRIMARY KEY (chat_id, user_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Required Addition
```sql
-- Store E2EE wrapped keys for participants
CREATE TABLE chat_encryption_keys (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  chat_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  encrypted_key LONGTEXT NOT NULL,  -- Base64 wrapped key
  created_by_user_id VARCHAR(50),   -- Who created this key wrap
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP NULL,      -- When user received key
  status ENUM('pending', 'delivered', 'acknowledged') DEFAULT 'pending',
  UNIQUE KEY unique_chat_user_key (chat_id, user_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  INDEX idx_user_pending (user_id, status)
);
```

---

## Implementation Steps

### Step 1: Update Chat Creation Endpoints

**File**: `server.js` or equivalent chat controller

```javascript
// PUT /api/chats/{chatId}/keys
app.put('/api/chats/:chatId/keys', authenticate, async (req, res) => {
  const { chatId } = req.params;
  const { encryptedKeys } = req.body;
  const senderId = req.user.id;
  
  // Validate sender has access to chat
  const chat = await getChat(chatId);
  if (!chat.participants.includes(senderId)) {
    return res.status(403).json({ error: 'Not a member of this chat' });
  }
  
  // Verify all keys are for participants
  for (const userId of Object.keys(encryptedKeys)) {
    if (!chat.participants.includes(userId)) {
      return res.status(400).json({ error: `${userId} not in chat` });
    }
  }
  
  // Store each encrypted key
  const storedCount = 0;
  for (const [userId, encryptedKey] of Object.entries(encryptedKeys)) {
    try {
      // Use UPSERT to allow re-sending keys
      await db.query(
        `INSERT INTO chat_encryption_keys 
         (chat_id, user_id, encrypted_key, created_by_user_id) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         encrypted_key = VALUES(encrypted_key),
         created_by_user_id = VALUES(created_by_user_id),
         status = 'pending'`,
        [chatId, userId, encryptedKey, senderId]
      );
      storedCount++;
    } catch (e) {
      console.error('Failed to store key for', userId, e);
    }
  }
  
  // Find pending users (users without keys yet)
  const pendingUsers = chat.participants.filter(uid => 
    !encryptedKeys[uid] && uid !== senderId
  );
  
  res.json({
    status: 'ok',
    keysSent: storedCount,
    pendingUsers: pendingUsers,
    message: `Keys stored for ${storedCount} users, ${pendingUsers.length} pending`
  });
});
```

### Step 2: Add Pending Keys Endpoint

```javascript
// GET /api/users/{userId}/pending-keys
app.get('/api/users/:userId/pending-keys', authenticate, async (req, res) => {
  const { userId } = req.params;
  
  // Verify user is requesting their own keys
  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'Cannot access other user keys' });
  }
  
  try {
    // Get pending keys for this user
    const keys = await db.query(
      `SELECT 
        ck.chat_id,
        ck.encrypted_key,
        ck.created_by_user_id,
        ck.created_at,
        c.name AS chatName,
        c.type AS chatType,
        c.description
      FROM chat_encryption_keys ck
      JOIN chats c ON ck.chat_id = c.id
      WHERE ck.user_id = ? AND ck.status = 'pending'
      ORDER BY ck.created_at DESC
      LIMIT 100`,
      [userId]
    );
    
    // Transform to response format
    const pendingKeys = keys.map(row => ({
      chatId: row.chat_id,
      encryptedKey: row.encrypted_key,
      chatName: row.chatName,
      chatType: row.chatType,
      senderUserId: row.created_by_user_id,
      createdAt: row.created_at.toISOString()
    }));
    
    // Mark as delivered
    if (keys.length > 0) {
      await db.query(
        `UPDATE chat_encryption_keys 
         SET status = 'delivered', delivered_at = NOW()
         WHERE user_id = ? AND status = 'pending'`,
        [userId]
      );
      
      // TODO: Optionally emit event to notify sender that keys were delivered
      emitEvent('keysDelivered', { userId, keyCount: keys.length });
    }
    
    res.json({
      status: 'ok',
      pendingKeys: pendingKeys
    });
  } catch (error) {
    console.error('Failed to fetch pending keys:', error);
    res.status(500).json({ error: 'Failed to fetch keys' });
  }
});
```

### Step 3: Update Login/WebSocket Handler

```javascript
// When user logs in, send pending keys via WebSocket or HTTP
app.post('/api/login', async (req, res) => {
  // ... existing login code ...
  
  const token = generateToken(user);
  
  // Check if user has pending E2EE keys
  const pendingKeys = await db.query(
    `SELECT count(*) as count FROM chat_encryption_keys 
     WHERE user_id = ? AND status = 'pending'`,
    [user.id]
  );
  
  res.json({
    user: user,
    token: token,
    hasPendingKeys: pendingKeys[0].count > 0
  });
});

// When WebSocket connects after login, send pending keys
ws.on('connect', async (socket, session) => {
  const userId = session.user.id;
  
  // Send pending E2EE keys
  const pendingKeys = await db.query(
    `SELECT chat_id, encrypted_key FROM chat_encryption_keys 
     WHERE user_id = ? AND status = 'pending'`,
    [userId]
  );
  
  if (pendingKeys.length > 0) {
    socket.emit('pendingE2EEKeys', {
      keys: pendingKeys
    });
    
    // Mark as delivered
    await db.query(
      `UPDATE chat_encryption_keys 
       SET status = 'delivered', delivered_at = NOW()
       WHERE user_id = ? AND status = 'pending'`,
      [userId]
    );
  }
});
```

### Step 4: Add Key Cleanup (Optional)

```javascript
// Periodically clean up old delivered keys (after 30 days)
const cleanupOldKeys = async () => {
  await db.query(
    `DELETE FROM chat_encryption_keys 
     WHERE status = 'delivered' 
     AND delivered_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
  );
};

// Run daily cleanup
setInterval(cleanupOldKeys, 24 * 60 * 60 * 1000);
```

---

## WebSocket Events

### New Event: `pendingE2EEKeys`

**Sent by server when user connects** (if they have pending keys):

```json
{
  "type": "pendingE2EEKeys",
  "keys": [
    {
      "chatId": "chat_123",
      "encryptedKey": "wrapped_key_base64"
    },
    {
      "chatId": "chat_456",
      "encryptedKey": "wrapped_key_base64"
    }
  ]
}
```

**Client handling** (in store.ts):

```javascript
// In WebSocket onmessage handler
case 'pendingE2EEKeys': {
  const { keys } = msg;
  const { e2eeKeyPair } = get();
  
  if (!e2eeKeyPair) break;
  
  // Unwrap each pending key
  for (const { chatId, encryptedKey } of keys) {
    get().attemptChatKeyUnwrap(chatId, encryptedKey);
  }
  break;
}
```

---

## Backward Compatibility

### Existing Deployments

If your server doesn't have the `chat_encryption_keys` table yet:

1. **Add the table** (run migration)
2. **Update endpoints** to support partial keys
3. **No client code changes** needed (client auto-adapts)
4. **Old chats** continue working (keys already distributed)

### Key Points

- ✅ Server can accept full or partial encryptedKeys
- ✅ Client auto-initializes keys on message send
- ✅ Keys delivered when users come online
- ✅ Offline users eventually catch up
- ✅ No data loss or message blocking

---

## Monitoring & Debugging

### Queries for Debugging

```sql
-- Check pending keys for a chat
SELECT * FROM chat_encryption_keys 
WHERE chat_id = 'chat_123' 
ORDER BY created_at DESC;

-- Check pending keys for a user
SELECT 
  c.name, ck.encrypted_key, ck.created_at 
FROM chat_encryption_keys ck
JOIN chats c ON ck.chat_id = c.id
WHERE ck.user_id = 'user_456' AND ck.status = 'pending';

-- Check delivery status
SELECT 
  status, COUNT(*) as count 
FROM chat_encryption_keys 
GROUP BY status;

-- Find stale pending keys (older than 24 hours)
SELECT * FROM chat_encryption_keys
WHERE status = 'pending' 
AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### Logs to Add

```javascript
// Log key operations
console.log(`[E2EE] Storing key for user ${userId} in chat ${chatId}`);
console.log(`[E2EE] Sent ${keys.length} pending keys to user on login`);
console.log(`[E2EE] Warning: ${user.username} still waiting for key in ${chatId}`);
```

---

## Performance Considerations

- **Index**: Add index on (user_id, status) for quick lookups
- **Batch Fetch**: Limit pendingKeys query to 100 at a time
- **Cleanup**: Run daily cleanup for delivered keys older than 30 days
- **Cache**: Cache pending key count per user to avoid repeated queries

---

## Testing Checklist

- [ ] Keys stored when user offline
- [ ] Partial encryptedKeys accepted
- [ ] Pending keys returned on login
- [ ] Key status transitions (pending → delivered)
- [ ] No data loss for offline users
- [ ] Multiple key updates for same chat work
- [ ] Old keys cleaned up properly
- [ ] Performance acceptable with many pending keys
- [ ] Error handling for bad keys
- [ ] Backward compat with old chats

