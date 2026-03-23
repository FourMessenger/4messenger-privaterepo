# E2EE Testing Guide - 4 Messenger

## Test Environment Setup

### Prerequisites
- Two or more test accounts
- Access to server logs or network inspection tools
- Ability to simulate offline/online states

---

## Test Scenarios

### Test 1: Direct Chat with Offline Recipient

**Setup:**
- Have Account A logged in
- Account B not logged in (offline)

**Steps:**
1. Account A opens "Create Direct Chat" and selects Account B
2. System creates chat
3. Account A sends message: "Hello from A"
4. Account A logs out

**Expected Results:**
- ✅ Chat created successfully  
- ✅ Message sent (encrypted in payload)
- ✅ Message shows in Account A's chat history
- ✅ Account A can log back in and see the encrypted message

**Verification:**
- Check browser console: Should see `[E2EE] Loaded chat keys` 
- Network tab: POST payload should contain `e2ee:` prefix (encrypted)
- Local storage: Chat key should be saved in IndexedDB

**What to Look For:**
```javascript
// In browser console
- "[E2EE] Loaded chat keys for 1 chats"
- No errors in E2EE initialization

// In Network tab - Outgoing message
{
  content: "e2ee:BASE64_ENCRYPTED_DATA...",
  type: "text"
}
```

---

### Test 2: Direct Chat - Recipient Comes Online

**Setup:**
- Complete Test 1 scenario
- Account A's message sent while Account B offline

**Steps:**
1. Account B logs in
2. Account B opens chat with Account A
3. Account B views the message from A

**Expected Results:**
- ✅ Account B receives wrapped E2EE key
- ✅ Message from A decrypts automatically
- ✅ No "[Encrypted Message]" or "[Decryption failed]" shown
- ✅ Both users can now communicate encrypted

**Verification:**
- Check browser console: Should see successful key unwrapping
- Message content should be readable plaintext
- Send reply from B and verify it's also E2EE

**What to Look For:**
```javascript
// In browser console when B logs in
- "E2EE key paired for chat ..." (success notification)
- No decryption errors
- Message decrypted: "Hello from A"

// In Network tab
- GET /api/chats response includes encryptedKey for the chat
- Subsequent messages have e2ee: prefix
```

---

### Test 3: Group Chat with Mixed Online/Offline Users

**Setup:**
- Account A (online) creates group
- Adds Account B (online) and Account C (offline)

**Steps:**
1. Account A initializes group with 3 members
2. Account A sends message: "Hello everyone"
3. Account B receives and replies: "Hi back"
4. Account C comes online
5. Account C checks chat history

**Expected Results:**
- ✅ Group created with E2EE enabled
- ✅ Account A's message encrypted
- ✅ Account B can decrypt A's message
- ✅ Account B's reply also encrypted
- ✅ Account C comes online and can decrypt all messages
- ✅ No "pending" or "waiting" status shown

**Verification:**
- All messages have `e2ee:` prefix in server logs
- Console shows key distribution to 2 users initially, then 3rd user later
- Response times are fast (no waiting for offline users)

---

### Test 4: Message Sent Before Key Exchange (Race Condition)

**Setup:**
- Account A and B in direct chat
- A's public key not yet available on server

**Steps:**
1. Server delay or network issue prevents B's public key sync
2. Account A tries to send message
3. Wait for key sync to complete
4. Account B comes online

**Expected Results:**
- ✅ Message is sent with A's unwrapped key
- ✅ Once B's key arrives, B receives wrapped version
- ✅ B can decrypt the message when coming online
- ✅ No message loss or corruption

---

### Test 5: Switching Between Encrypted and Non-Bot Chats

**Setup:**
- Account A in direct chat with Account B (human)
- Account A in chat with bot account

**Steps:**
1. Send message to human chat
2. Send message to bot chat
3. Check each message

**Expected Results:**
- ✅ Human chat messages are E2EE encrypted
- ✅ Bot chat messages are plain (NOT encrypted)
- ✅ No performance degradation
- ✅ Encryption state visible in dev tools

**Verification:**
```javascript
// Human chat message - should have e2ee: prefix
{
  content: "e2ee:lV8M3WbhZM7...",
  type: "text",
  encrypted: true
}

// Bot chat message - no e2ee: prefix
{
  content: "Hello bot user",
  type: "text",
  encrypted: false
}
```

---

### Test 6: Adding Member to Existing Group

**Setup:**
- Group chat with A and B already encrypted
- Account C comes online and will be added

**Steps:**
1. Account A invites Account C to group
2. Account C appears in member list
3. Account C comes online
4. Account C views chat history

**Expected Results:**
- ✅ C receives wrapped E2EE key
- ✅ C can decrypt all group messages
- ✅ C can send encrypted messages
- ✅ A and B still see C's messages decrypted correctly

---

### Test 7: Chat List Fetch with Mixed Keys

**Setup:**
- Multiple chats with different encryption states
- Some have keys already, some don't
- Some users offline, some online

**Steps:**
1. Login to Account A
2. Monitor network tab during initial chat fetch
3. Check console logs
4. Verify chat list loads

**Expected Results:**
- ✅ All chats load within 2-3 seconds
- ✅ No delays waiting for offline users
- ✅ `fetchChats()` initializes missing keys
- ✅ Users can see chat list and start messaging immediately

**What to Look For:**
```javascript
// In console during login
[E2EE] Loaded chat keys for 5 chats
  - 3 chats have keys
  - 2 chats being initialized
  - 1 await chat will have key in background
```

---

## Performance Tests

### Test 8: Message Send Latency

**Measure:**
- Time from "Send" button to message appearing in chat
- With and without E2EE

**Expected Results:**
- ✅ <500ms with E2EE (encryption is fast with AES-GCM)
- ✅ No noticeable delay to user

**How to Measure:**
```javascript
// In browser console
const start = performance.now();
// [User clicks Send]
// [Message appears]
const end = performance.now();
console.log(`Send latency: ${end - start}ms`);
```

---

### Test 9: Key Generation Performance

**Measure:**
- Time to generate and wrap chat key for N users
- Time to unwrap key on receiving end

**Expected Results:**
- ✅ <100ms to generate chat key
- ✅ <50ms per key wrap (should be fast, RSA-OAEP)
- ✅ <50ms to unwrap received key

---

## Error Scenarios

### Test 10: Corrupted Wrapped Key

**Setup:**
- Chat with wrapped key stored
- Simulate key corruption (browser storage edit)

**Steps:**
1. Manually corrupt stored wrapped key
2. Account B logs in
3. Try to access chat

**Expected Results:**
- ✅ Friendly error message in console
- ✅ Shows "[Encrypted Message]" for unreadable ones
- ✅ Doesn't crash the app
- ✅ Can still send new messages (with fresh key)

---

### Test 11: Missing Public Key

**Setup:**
- Group chat where one user's public key fails to sync
- User tries to send first message

**Steps:**
1. Create group before User C's key arrives
2. Account A sends message
3. Account C's key eventually arrives
4. Account C comes online

**Expected Results:**
- ✅ Message still encrypted (with A's own key)
- ✅ C gets wrapped key when coming online
- ✅ C can decrypt message
- ✅ No data loss

---

## Network Interruption Tests

### Test 12: Key Upload Failure

**Setup:**
- Network tool to simulate upload failure
- Account A creating direct chat with B

**Steps:**
1. Simulate network error during key upload
2. Message send starts
3. Network recovers

**Expected Results:**
- ✅ Error notification shown
- ✅ Message not sent (not orphaned)
- ✅ Retry works correctly
- ✅ No duplicate key uploads

---

## Verification Checklist

For any test, verify these key indicators:

- [ ] **Console**: No E2EE errors or warnings
- [ ] **Network**: Encrypted messages have `e2ee:` prefix
- [ ] **Performance**: Messages send <500ms
- [ ] **Readability**: Encrypted messages display correctly after decrypt
- [ ] **Offline**: Works without all users online
- [ ] **Backward Compat**: Old unencrypted chats still work
- [ ] **Key Storage**: Keys saved in IndexedDB (not localStorage)
- [ ] **Recovery**: App recovers from errors gracefully

---

## Debugging Commands

Use these in browser console to inspect E2EE state:

```javascript
// Get current store state
await window.__store.getState

// Check all chat keys
console.log(await window.__store.getState?.().chatKeys)

// Check key storage
const db = await indexedDB.databases();
console.log(db)

// Force re-fetch chats with key init
window.__store.getState?.().fetchChats()

// Check encryption state of a message
const msg = window.__store.getState?.().messages[0];
console.log(`Encrypted: ${msg?.encrypted}, Starts with e2ee: ${msg?.content.startsWith('e2ee:')}`)
```

---

## Regression Testing

Run these tests before each release to ensure nothing breaks:

1. ✅ Direct chat encryption works
2. ✅ Group chat encryption works  
3. ✅ Messages decrypt correctly
4. ✅ Offline users eventually get keys
5. ✅ Non-bot chats encrypted, bot chats not
6. ✅ Old encrypted messages still decrypt
7. ✅ Key wrapping succeeds for all participants
8. ✅ No console errors during normal flow
9. ✅ Performance benchmarks met
10. ✅ Recovery from errors works

---

## Known Limitations & Future Improvements

### Current Limitations:
- If a user's public key never arrives, they won't get the wrapped key (need fallback mechanism)
- Message history before key arrival is unencrypted until key is received
- No key rotation mechanism yet
- No forward secrecy (all messages with same key)

### Future Improvements:
- [ ] Implement key rotation for long-lived chats
- [ ] Add Double Ratchet for perfect forward secrecy
- [ ] Automatic retry for public key sync failures
- [ ] UI indicator showing E2EE status per chat
- [ ] Option to re-encrypt old messages with new key
- [ ] Key backup/recovery mechanism

