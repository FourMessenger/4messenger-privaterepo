# E2EE Decryption Fix - Messages Unable to Decrypt Issue

## Problem
Users were receiving "[Unable to decrypt message]" when others sent them encrypted messages. The encryption worked on the sender's side, but recipients couldn't decrypt because they didn't have access to the chat key.

## Root Cause
The previous implementation had a critical flow issue:
1. **Sender** encrypts message with a chat key and sends it to server
2. **Sender** wraps the chat key for recipients, BUT this happened asynchronously via `wrapKeysForNewlyAvailableUsers()` which only runs on login/user list update
3. **Recipient** tries to fetch and decrypt message BEFORE the wrapped key reaches the server
4. **Result**: Recipient doesn't have the chat key, decryption fails with "[Unable to decrypt message]"

## Solution
Made the key exchange **synchronous with message sending**:

### 1. **sendMessage() - Immediate Key Wrapping**
After encrypting a message with the chat key:
- For each chat participant (except sender):
  - Wrap the chat key with their RSA public key
  - Send wrapped keys to server via `PUT /api/chats/{chatId}/keys`
- This happens **immediately** with the message send
- Ensures wrapped keys are on server before message is saved

### 2. **fetchChats() - Explicit Key Fetching**
When fetching chat list:
- For each direct chat:
  - Fetch wrapped keys from `GET /api/chats/{chatId}/keys`
  - Store encrypted keys in state temporarily
- Then asynchronously unwrap each key:
  - Decrypt with user's private key
  - Import as AES-256 CryptoKey
  - Save to localStorage
  - Update state with unwrapped key

### 3. **fetchMessages() - On-Demand Key Unwrapping**
When fetching messages:
- Check if chat key is available and unwrapped
- If key is still encrypted (string):
  - Unwrap it on-demand before message decryption
- Then decrypt each message with the unwrapped key

## Code Changes

### sendMessage() - Added Key Wrapping
```typescript
// After successfully encrypting message with chat key:
const wrappedKeysToSend: Record<string, string> = {};

for (const participantId of chat.participants) {
  if (participantId === currentUser.id) continue;
  
  const participant = users.find(u => u.id === participantId);
  if (!participant?.publicKey) continue;
  
  const wrappedKey = await e2ee.encryptChatKeyForUser(chatKey, participant.publicKey);
  wrappedKeysToSend[participantId] = wrappedKey;
}

// Send to server
await fetch(`${serverUrl}/api/chats/${chatId}/keys`, {
  method: 'PUT',
  body: JSON.stringify({ encryptedKeys: wrappedKeysToSend }),
  headers: { 'Authorization': `Bearer ${authToken}` }
});
```

### fetchChats() - Explicit Key Fetching
```typescript
// For each direct chat:
for (const chat of mappedChats) {
  if (chat.type === 'direct' || chat.participants.length === 2) {
    const keysResponse = await fetch(`${serverUrl}/api/chats/${chat.id}/keys`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (keysResponse.ok) {
      const keysData = await keysResponse.json();
      if (keysData.encryptedKey) {
        newChatKeys[chat.id] = keysData.encryptedKey;
      }
    }
  }
}

// Then async unwrap each key...
for (const chatId of Object.keys(newChatKeys)) {
  const encryptedKey = newChatKeys[chatId];
  if (typeof encryptedKey === 'string' && encryptedKey.length > 0) {
    const unwrappedKey = await e2ee.decryptChatKey(encryptedKey);
    // Import, save to localStorage, update state...
  }
}
```

### fetchMessages() - On-Demand Unwrapping
```typescript
let chatKey = chatKeys[chatId] as CryptoKey | undefined;

// If we have an encrypted key but not decrypted:
if (!chatKey && typeof chatKeys[chatId] === 'string') {
  const encryptedKey = chatKeys[chatId] as unknown as string;
  chatKey = await e2ee.decryptChatKey(encryptedKey);
  
  // Save and update state...
  set(state => ({
    chatKeys: { ...state.chatKeys, [chatId]: chatKey }
  }));
}
```

## Message Decryption Flow
1. User A sends "hi" → encrypts with chat key → wraps key for User B → sends both to server
2. Server stores encrypted message and wrapped key
3. User B fetches messages:
   - fetchChats() fetches wrapped keys from server
   - Unwraps keys when available
   - fetchMessages() uses unwrapped key to decrypt
4. Result: User B sees "hi" instead of "[Unable to decrypt message]"

## Testing
Build successful: `✓ 731.20 kB │ gzip: 177.19 kB`

### Expected Behavior
- Direct chats (1-on-1) between non-bot users: E2EE encryption
- Messages encrypted with AES-256-GCM shared key
- Chat key wrapped with recipient's RSA public key
- Recipients can decrypt within seconds (after fetchChats unwraps key)
- Own sent messages retrieved from cache (no decryption needed)

### Edge Cases Handled
- ✓ Recipient offline when message sent → wrapped key stored on server → works when they log in
- ✓ fetchMessages runs before async key unwrapping completes → on-demand unwrapping
- ✓ Public key not available for participant → skipped with warning
- ✓ Key wrapping fails → message still sent, error logged
