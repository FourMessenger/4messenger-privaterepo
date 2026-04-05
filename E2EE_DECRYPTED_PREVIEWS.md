# Decrypted Message Previews Implementation (Session 10)

## Problem Statement
Encrypted messages were showing their encrypted form in:
1. **Chat list preview** (under chat name) - showed encrypted `e2ee:{...}` data
2. **Notifications** (in-app toast and browser notifications) - showed encrypted data instead of message text

## Solution Implemented

### 1. Added `getMessagePreview` Method to Store (src/store.ts)

**Location**: Around line 2706

```typescript
getMessagePreview: async (message: Message): Promise<string> => {
  // Checks if message is encrypted
  // Uses chat key to decrypt if available
  // Returns "[Encrypted message]" if no key yet
  // Returns text preview (0-100 characters)
  // Handles non-text message types
}
```

**Features**:
- ✅ Decrypts `e2ee:{iv, ciphertext}` format messages
- ✅ Falls back to "[Encrypted message]" if chat key not loaded yet
- ✅ Returns type indicator for non-text messages ("Sent a image", etc.)
- ✅ Safely handles decryption errors

### 2. Updated Chat List Preview (src/components/ChatScreen.tsx)

**Changes**:
1. Added new state: `decryptedPreviews` to cache decrypted preview text
2. Added `useEffect` that:
   - Runs when chat list changes
   - Calls `getMessagePreview` for each chat's last message
   - Stores decrypted previews in state
3. Updated chat list display to use `decryptedPreviews[chatId]` instead of raw content

**Result**: Chat list now shows actual message text instead of encrypted data

### 3. Updated Notifications (src/store.ts)

**In-App Toast Notifications**:
- Changed from static preview calculation to async `getMessagePreview` call
- Wrapped in IIFE to handle async decryption
- Falls back to old preview logic if decryption fails

**Browser Push Notifications**:
- Updated to use `getMessagePreview` for notification body
- Wrapped in IIFE for async decryption
- Shows decrypted message text in notification popup

**Result**: Both in-app and browser notifications now show decrypted message preview

## Files Modified

| File | Changes | Line Range |
|------|---------|-----------|
| src/store.ts | Added `getMessagePreview` method | ~2706-2756 |
| src/store.ts | Updated in-app notification creation | ~1033-1047 |
| src/store.ts | Updated browser notification creation | ~1049-1065 |
| src/components/ChatScreen.tsx | Added decryptedPreviews state | ~178 |
| src/components/ChatScreen.tsx | Added preview decryption useEffect | ~227-245 |
| src/components/ChatScreen.tsx | Updated chat list display | Line ~960 |

## Flow Diagram

```
Message received (encrypted: e2ee:{iv, ciphertext})
        ↓
handleIncomingMessage() decrypts for display in chat
        ↓
        ├─→ Create mappedMsg with decrypted content
        │       ↓
        │   Store in messages/allMessages
        │       ↓
        │   Update chat.lastMessage
        │
        ├─→ Check notifications enabled
        │       ↓
        │   Get message preview via getMessagePreview()
        │   ├─→ If encrypted: decrypt using chat key
        │   ├─→ If no key: return "[Encrypted message]"
        │   └─→ If not encrypted: return content
        │       ↓
        │   Show in in-app notification toast
        │   Show in browser notification popup
        │
        └─→ Chat list preview:
                ↓
            useEffect runs on chat change
                ↓
            For each chat, call getMessagePreview()
                ↓
            Store in decryptedPreviews state
                ↓
            Display in chat list
```

## Testing Scenarios

### Scenario 1: Chat List Preview
1. User A sends encrypted message to User B
2. User B loads chat list (messages may still be loading)
3. **Expected**: Chat shows decrypted preview text
4. **Previously**: Chat showed `e2ee:{...}` encrypted data

### Scenario 2: In-App Notification
1. User A sends encrypted message to User B (User B not viewing chat)
2. **Expected**: Toast notification shows "User A: [decrypted message text]"
3. **Previously**: Toast showed "User A: e2ee:{...}"

### Scenario 3: Browser Notification
1. User A sends encrypted message to User B (User B's tab in background)
2. **Expected**: Browser notification shows "[decrypted message text]"
3. **Previously**: Browser notification showed encrypted `e2ee:{...}`

### Scenario 4: Multiple Encrypted Messages
1. User A sends 5 encrypted messages to User B
2. **Expected**: Chat list shows latest message preview decrypted
3. **Previously**: All showed encrypted

### Scenario 5: Non-Text Encrypted Messages
1. User A sends image to User B
2. **Expected**: Preview shows "Sent a image"
3. **Previously**: Preview showed "Sent a image" (this was working)

## Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| Message not yet decrypted (key loading) | Shows "[Encrypted message]" |
| Chat key not available | Shows "[Encrypted message]" |
| Decryption fails | Falls back to showing encrypted content or error |
| Non-text message | Shows "Sent a {type}" |
| Empty message | Shows "(empty message)" |
| Malformed encrypted JSON | Shows "[Encrypted message]" |

## Build Status

✅ **Build Successful** (736.97 kB, gzip: 178.38 kB)
- No TypeScript errors
- No compilation warnings
- All imports resolved

## Architecture Notes

### Message Preview Decryption Pipeline

```
1. Chat arrives from server with lastMessage
   └─→ content may still be encrypted: "e2ee:{...}"

2. In ChatScreen component:
   └─→ useEffect calls getMessagePreview(lastMessage)
       └─→ Checks if encrypted
       └─→ Retrieves chat key from Zustand state
       └─→ Calls e2ee.decryptMessageWithChatKey()
       └─→ Returns decrypted text or fallback

3. Display in UI:
   └─→ decryptedPreviews[chatId] or original content as fallback

4. Notifications:
   └─→ When message received, call getMessagePreview()
   └─→ Show decrypted text in toast/browser notification
```

### Key Design Decisions

1. **Separate State for Previews**: Cached decrypted previews in ChatScreen state to avoid recalculating on every render

2. **Async Decryption**: Use async/await with IIFE for notifications since `getMessagePreview` is async

3. **Graceful Fallbacks**: Always have a fallback if decryption fails - show encrypted indicator or original content

4. **Chat Key Requirement**: Only decrypt if chat key is available in state, otherwise show "[Encrypted message]"

## Expected Behavior After Fix

- ✅ Chat list shows actual message text in preview
- ✅ In-app notifications show decrypted message preview
- ✅ Browser notifications show decrypted message text  
- ✅ Handles encrypted and non-encrypted messages
- ✅ Shows "[Encrypted message]" if key not loaded yet
- ✅ No UI blocking - all decryption is async

## Session 9 vs Session 10

| Aspect | Session 9 | Session 10 |
|--------|-----------|-----------|
| Focus | E2EE offline user unwrapping | Message preview decryption |
| Issue | Offline user can't decrypt wrapped key | Encrypted messages in preview/notifications |
| Root Cause | Stale RSA public key | Encrypted content displayed as-is |
| Solution | Fetch fresh public keys from server | Decrypt content before display |
| Files Modified | store.ts, simpleE2EE.ts | store.ts, ChatScreen.tsx |
