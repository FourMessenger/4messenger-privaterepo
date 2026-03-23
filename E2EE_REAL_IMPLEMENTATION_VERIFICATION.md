# Real E2EE Implementation - Verification Guide

## What Changed

The E2EE implementation has been completely refactored to ensure **real, working end-to-end encryption**:

### Old Issues Fixed:
1. ❌ Keys weren't actually being used to encrypt messages
2. ❌ Race conditions with async state updates
3. ❌ Duplicate initialization logic in multiple places
4. ❌ No guarantee key was available before encryption

### New Implementation:
1. ✅ Centralized `ensureChatKey()` helper guarantees key availability
2. ✅ Simple, proven encryption flow
3. ✅ Proper async/await handling
4. ✅ Real AES-GCM encryption on every non-bot message

---

## How Real E2EE Works Now

### Flow Diagram

```
User Opens Messenger
        ↓
User sends message to chat
        ↓
ensureChatKey(chatId) called
        ↓
    ┌─ Does chatKeys[chatId] exist?
    ├─ Yes → Use existing key
    └─ No → Load from IndexedDB
            ├─ Found? → Use it
            └─ Not found? → Generate new key
                            ├─ Wrap for participants with public keys
                            ├─ Save to IndexedDB
                            ├─ Save to state
                            └─ Send to server
        ↓
Encrypt message with AES-GCM
        payload = "e2ee:" + base64(iv + encrypted)
        ↓
Send payload to server
        ↓
Server stores encrypted ciphertext (cannot decrypt)
        ↓
Recipient receives message
        ↓
    ├─ Check if content starts with "e2ee:"
    ├─ Yes → Decrypt with chatKeys[chatId]
    └─ No → Display plain text (shows "[Encrypted Message]" if no key)
```

---

## Verification Steps

### 1. Verify Encryption at Send Time

**In Browser Console:**

```javascript
// Open DevTools → Network tab
// Send a message in chat

// Look for POST to /api/chats/{chatId}/messages
// Check the request body - should show:
{
  "content": "e2ee:lV8M3WbhZM7Iq1jF+JKMgQ==...",
  "type": "text"
}

// NOT just plain text like:
{
  "content": "Hello world",
  "type": "text"
}
```

**Console Output Should Show:**
```
[E2EE] Initialized key for chat chat_abc123
```

### 2. Verify Keys Are Being Created and Stored

**In Browser Console:**

```javascript
// Check current chat keys
const state = await window.__store.getState?.();
console.log("Chat keys:", state.chatKeys);
// Should show: chatKeys: { chat_123: CryptoKey, chat_456: CryptoKey, ... }

// Check IndexedDB storage
const dbs = await indexedDB.databases();
console.log("Databases:", dbs);
// Should show: 4messenger-e2ee-db

// Verify key is stored
const db = indexedDB.open('4messenger-e2ee-db');
db.onsuccess = () => {
  const tx = db.result.transaction(['keys'], 'readonly');
  const store = tx.objectStore('keys');
  const allKeys = store.getAll();
  allKeys.onsuccess = () => console.log("Stored keys:", allKeys.result);
};
```

### 3. Monitor Encryption Operations

**In Browser Console:**

```javascript
// Add logging to track all E2EE operations
const originalLog = console.log;
const e2eeLogs = [];

console.log = (...args) => {
  const msg = args[0];
  if (typeof msg === 'string' && msg.includes('[E2EE]')) {
    e2eeLogs.push({time: new Date().toLocaleTimeString(), msg});
    originalLog.style.color = 'blue';
    originalLog(...args);
    originalLog.style.color = '';
  } else if (msg?.includes('error') || msg?.includes('Encryption')) {
    originalLog(...args);
  }
};

// Now send messages and watch the logs
```

### 4. End-to-End Test Scenarios

#### Scenario A: Direct Chat Encryption

**Steps:**
1. User A: Open direct chat with User B
2. User A: Send message "Hello B"
3. Developer: Check Network tab
4. Result: Request body should show `e2ee:...`

**Expected Behavior:**
- Network tab shows: `"content": "e2ee:lV8M3WbhZM7..."`
- Console shows: `"[E2EE] Initialized key for chat..."`
- User B receives message without "[Encrypted Message]" text

#### Scenario B: Save and Restore Keys

**Steps:**
1. Send message in chat (creates key)
2. Hard refresh page (Ctrl+F5)
3. Open same chat
4. Console: Type `const state = await window.__store.getState?.(); console.log(state.chatKeys)`

**Expected Behavior:**
- Chat key exists after page refresh (loaded from IndexedDB)
- No "[Encrypted Message]" shown if recipient has key
- No waiting for key generation

#### Scenario C: Multiple Chats

**Steps:**
1. Send message in Chat A
2. Send message in Chat B  
3. Send message in direct DM
4. Console: Check that each chat has different key

**Expected Behavior:**
```javascript
state.chatKeys = {
  "chat_main": CryptoKey {...},
  "chat_dev": CryptoKey {...},
  "direct_user123": CryptoKey {...}
}
// Each key is unique
```

#### Scenario D: Offline User

**Steps:**
1. User C has no public key yet (offline or hasn't synced)
2. User A sends message to User C
3. Check server sync

**Expected Behavior:**
- Message is still encrypted
- When User C comes online and gets wrapped key, they can decrypt
- No "Decryption failed" error

---

## Debugging Checklist

If messages aren't encrypted, check:

- [ ] **Key pair exists?**
  ```javascript
  const state = await window.__store.getState?.();
  console.log(state.e2eeKeyPair);
  // Should have publicKey and privateKey, NOT null
  ```

- [ ] **Chat has E2EE enabled?**
  ```javascript
  const chat = state.chats.find(c => c.id === 'chat_id');
  const hasBot = chat.participants.some(uid => 
    state.users.find(u => u.id === uid)?.isBot
  );
  console.log("Has bot:", hasBot);
  // Should be false for encrypted chats
  ```

- [ ] **Key is being generated?**
  ```javascript
  // Send a message and check console
  // Should see: "[E2EE] Initialized key for chat ..."
  ```

- [ ] **Encryption is actually happening?**
  ```javascript
  // Network → find POST message request → check body
  // Should contain: "e2ee:BASE64_DATA"
  // NOT just: "Hello world"
  ```

- [ ] **Message starts with e2ee: marker?**
  ```javascript
  const msg = state.messages[0];
  console.log("Message encrypted?", msg.content.startsWith('e2ee:'));
  // Should be true
  ```

---

## Console Commands for Testing

```javascript
// 1. Simulate sending encrypted message
const state = await window.__store.getState?.();
const chatId = state.activeChat;
const key = state.chatKeys[chatId];
if (key) {
  const msg = "Test message";
  const encrypted = await E2EE.encryptMessage(msg, key);
  console.log("Encrypted:", encrypted);
  console.log("Starts with e2ee:?", encrypted.startsWith('e2ee:'));
}

// 2. Simulate decrypting a message
const ciphertext = encrypted;
const decrypted = await E2EE.decryptMessage(ciphertext, key);
console.log("Decrypted:", decrypted);
console.log("Matches original?", decrypted === msg);

// 3. Check all chat keys
const allKeys = state.chatKeys;
console.log(`Keys for ${Object.keys(allKeys).length} chats:`, allKeys);

// 4. Monitor key creation
const originalEnsure = window.__store.getState?.().ensureChatKey;
window.__store.getState = () => ({
  ...originalState,
  ensureChatKey: async (chatId) => {
    console.log(`[TRACE] ensureChatKey called for ${chatId}`);
    const result = await originalEnsure(chatId);
    console.log(`[TRACE] ensureChatKey returned:`, result ? "KEY" : "null");
    return result;
  }
});

// 5. Force re-fetch and re-initialize all keys
const state = await window.__store.getState?.();
state.chatKeys = {}; // Clear keys
await state.fetchChats(); // Re-fetch and re-initialize
console.log("Keys re-initialized:", state.chatKeys);
```

---

## What Real E2EE Looks Like

### Server Perspective (Can't Decrypt)
```
GET /api/chats/123/messages
Response:
{
  id: "msg_456",
  content: "e2ee:lV8M3WbhZM7Iq1jF+JKMgQ==EXwbLvQJL2xw...",
  senderId: "alice",
  type: "text"
}
// Server has NO idea what says: "Hello Bob!"
// The "e2ee:" prefix tells server: "This is encrypted, don't touch"
```

### Client Perspective (Can Decrypt)
```
Receive message with content: "e2ee:lV8M3WbhZM7..."
↓
Check: Do I have chatKeys[chatId]?
↓
Yes → Decrypt: "Hello Bob!"
↓
Display: "Hello Bob!"
```

---

## Performance Metrics

These should be fast (<100ms total):

```javascript
// Measure key creation
const t1 = performance.now();
const key = await E2EE.generateChatKey();
const t2 = performance.now();
console.log(`Key generation: ${t2-t1}ms`);
// Expected: <20ms

// Measure encryption
const t1 = performance.now();
const encrypted = await E2EE.encryptMessage("test", key);
const t2 = performance.now();
console.log(`Encryption: ${t2-t1}ms`);
// Expected: <5ms

// Measure decryption
const t1 = performance.now();
const decrypted = await E2EE.decryptMessage(encrypted, key);
const t2 = performance.now();
console.log(`Decryption: ${t2-t1}ms`);
// Expected: <5ms

// Measure key wrapping
const t1 = performance.now();
const wrapped = await E2EE.wrapKey(key, publicKeyBase64);
const t2 = performance.now();
console.log(`Key wrapping: ${t2-t1}ms`);
// Expected: <50ms
```

---

## What'll Happen if Something's Wrong

### Symptom: Messages show as plain text
- **Cause**: E2EE key pair not initialized
- **Fix**: Ensure password-protected key store was unlocked during login
- **Check**: `state.e2eeKeyPair` should not be null

### Symptom: "[Encrypted Message]" shown
- **Cause**: Recipient doesn't have the chat key yet
- **Fix**: Wait for server to distribute wrapped key, or ensure public key was synced
- **Check**: `state.chatKeys[chatId]` should exist on recipient's end

### Symptom: "Decryption failed"
- **Cause**: Wrong key, corrupted message, or key mismatch
- **Fix**: Manually re-initialize keys with `state.ensureChatKey(chatId)`
- **Check**: Verify key was loaded from correct IndexedDB store

### Symptom: Message takes >1 second to send
- **Cause**: Key generation happening on send
- **Fix**: Normal for first message, should be <100ms after that
- **Check**: Subsequent messages should be faster

---

## Summary

Real E2EE implementation ensures:

✅ Every message encrypted before sending to server
✅ Server cannot decrypt or read content
✅ Keys automatically created and stored
✅ Offline users get wrapped keys when coming online
✅ Simple, robust flow with proper error handling
✅ Works with bot and non-bot chats (bot-only chats stay plain)

