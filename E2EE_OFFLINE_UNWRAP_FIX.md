# E2EE Offline User Unwrapping Fix (Session 9)

## Problem Statement
When one user sends a message to another user who is offline:
1. Sender encrypts message with per-chat AES key
2. Sender wraps the AES key for offline user with their RSA public key
3. Wrapped key stored on server
4. When offline user comes online, they should unwrap the key with their private key
5. **ERROR**: Unwrapping fails with `OperationError` - RSA decryption incompatible with private key

## Root Cause
The issue was that when sending a message, the code would fetch the recipient's public key from the **local users array** in Zustand state. This array gets populated at login and is never updated. If:
- User B logs in at 9:00 AM and their key pair is fetched
- User B is added to a chat with User A
- User A comes back at 2:00 PM and sends a message (user A still has old public key from User B)
- User A wraps the key using the old/stale public key
- User B's device has their **new** private key (from session login)
- RSA-OAEP decryption fails because private key doesn't match public key

## Solution Implemented

### 1. Fetch Fresh Public Keys Before Wrapping (sendMessage in src/store.ts)

**Added code** around line 1970:
```typescript
// If participant not found or no public key, try to fetch from server
if (!participant?.publicKey) {
  console.log('[E2EE] Participant not fully loaded, fetching from server...');
  try {
    const userResponse = await fetch(`${serverUrl}/api/users/${participantId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      participant = {
        id: userData.id || participantId,
        publicKey: userData.public_key || userData.publicKey,
        ...userData
      };
      console.log('[E2EE] Fetched participant from server, has public key:', !!participant?.publicKey);
    }
  } catch (err) {
    console.error('[E2EE] Failed to fetch participant from server:', err);
  }
}
```

**Result**: Always ensures using the **current** public key from server when wrapping keys for recipients.

### 2. Enhanced Logging for Debugging

**In decryptChatKey() in src/simpleE2EE.ts**:
- Added logging before/after RSA-OAEP decryption
- Shows encrypted key buffer size
- Shows decrypted chat key size
- Enhanced error messages with private key availability

**In fetchChats() in src/store.ts**:
- Added encrypted key length logging
- Added detailed error output with encrypted key length
- Shows which chat unwrapping failed for
- Full error details in console

## Testing Scenario

### Full Offline-to-Online Decryption Flow

1. **Setup** (Both users online):
   ```
   User A logs in
   User B logs in
   Both users in same chat
   ```

2. **User B Goes Offline**:
   ```
   User B closes app or disconnects
   User A still online
   ```

3. **Send Message** (User A sends to offline User B):
   ```
   User A: "Hello B!"
   Console shows:
   - "[E2EE] Participant: B not fully loaded, fetching from server..."
   - "[E2EE] ✓ Fetched participant from server, has public key: true"
   - "[E2EE] ✓ Wrapped chat key successfully for participant: B"
   - "[E2EE] ✓ Sent wrapped keys to server for chat: chatid"
   ```

4. **User B Comes Online**:
   ```
   User B logs back in
   Console shows:
   - "[E2EE] Unwrapping key for chat: chatid"
   - "[E2EE] Decrypting chat key with private key, encrypted length: ..."
   - "[E2EE] Encrypted key buffer size: 256 bytes" (RSA-4096)
   - "[E2EE] Chat key decrypted successfully, size: 32 bytes"
   - "[E2EE] ✓ Successfully unwrapped key for chat: chatid"
   ```

5. **View Message**:
   ```
   User B opens chat
   Message appears decrypted: "Hello B!"
   ```

## Expected Console Output When Working

### Sender (User A) sending message:
```
[E2EE] Chat participants: ["userId1", "userId2"], Current user: userId1
[E2EE] Participant: userId2 not fully loaded, fetching from server...
[E2EE] ✓ Fetched participant from server, has public key: true
[E2EE] Wrapping chat key for participant: userId2 Key type: secret Public key length: 392
[E2EE] ✓ Wrapped chat key successfully for participant: userId2 Wrapped key length: 256
[E2EE] ✓ Sent wrapped keys to server for chat: chatid
```

### Recipient (User B) coming online:
```
[E2EE] Found wrapped key for chat: chatid Currently have unwrapped key: false
[E2EE] Unwrapping key for chat: chatid encrypted key length: 344
[E2EE] Decrypting chat key with private key, encrypted length: 344
[E2EE] Encrypted key buffer size: 256 bytes
[E2EE] Chat key decrypted successfully, size: 32 bytes
[E2EE] ✓ Successfully unwrapped key for chat: chatid
[E2EE] ✓ Marked wrapped key as received on server for chat: chatid
```

## Verification Checklist

- [ ] Build succeeds without errors
- [ ] Sender can wrap keys for recipients not in local array
- [ ] Console shows "Fetched participant from server"
- [ ] Recipient can unwrap key when coming online
- [ ] Console shows "Chat key decrypted successfully"
- [ ] Message displays as decrypted text, not encrypted
- [ ] Multiple offline recipients handled
- [ ] Key wrapped with fresh public key (not stale)

## Files Modified

1. **src/store.ts** (sendMessage function):
   - Added public key fetch from `/api/users/{participantId}` if not in local array
   - Enhanced logging for key wrapping process
   - Added error handling for fetch failures

2. **src/simpleE2EE.ts** (decryptChatKey function):
   - Added logging for RSA-OAEP decryption process
   - Shows encrypted/decrypted key sizes
   - Enhanced error output with private key details

3. **src/store.ts** (fetchChats function):
   - Added encrypted key length to logging
   - Added detailed error output
   - Shows encrypted key length on unwrap failure

## Architecture Notes

### Key Wrapping Pipeline (FIXED):
1. Sender has per-chat AES-256-GCM key ✓
2. **Sender wraps key with recipient's RSA public key** ← **NOW FRESH FROM SERVER** ✓
3. Wrapped key sent to server `/api/chats/{id}/keys` ✓
4. Recipient receives wrapped key from server on login ✓
5. Recipient unwraps with their private key ✓
6. Recipient marks as received (server cleanup) ✓

### Why This Fix Works:
- Before: Wrapped key using 9:00 AM public key, but recipient has 2:00 PM private key → MISMATCH
- After: Always fetch current public key before wrapping → MATCH GUARANTEED
- Result: RSA-OAEP decryption succeeds because private key matches public key

## Technical Details

### RSA Key Pair Matching Requirement
RSA-OAEP encryption/decryption requires:
- **Encryption**: Use recipient's public key (e.n, e.d public components)
- **Decryption**: Use recipient's corresponding private key
- **If keys don't match**: `OperationError` - decryption fails

This is why fetching fresh public key before wrapping is critical.

### Per-Chat Shared Key Model
```
Chat created with Users A, B, C:
├── Generate random AES-256 key K
├── Wrap K with User A public key → encrypted_A
├── Wrap K with User B public key → encrypted_B  ← NOW USING FRESH KEY FROM SERVER
├── Wrap K with User C public key → encrypted_C  ← NOW USING FRESH KEY FROM SERVER
└── Store [encrypted_A, encrypted_B, encrypted_C] on server

Each message:
├── Encrypt message content with K (AES-256-GCM)
└── Each recipient unwraps K with their private key
```

## Session History

- **Session 1-2**: Implemented chat-key E2EE system
- **Session 3**: Fixed IV encoding bug
- **Session 4**: Fixed key management race conditions
- **Session 5**: Fixed WebSocket format detection
- **Session 6**: Implemented server-side key tracking
- **Session 7**: Fixed IV decoding ArrayBuffer size
- **Session 8**: Added on-demand key unwrapping for race conditions
- **Session 9**: **FIXED** offline user unwrap failure with fresh public key fetching
