# Quick Reference: Current Notification Flow

## Message Arrival Flow

```
User A sends message
        ↓
POST /api/chats/{chatId}/messages
        ↓
Server receives, stores in DB
        ↓
Server broadcasts via WebSocket to all chat members
        ↓
┌─────────────────────────────────────────────────┐
│ Client WebSocket onmessage handler              │
│ (store.ts lines 768-920)                        │
└─────────────────────────────────────────────────┘
        ↓
   ┌────────────────────┬────────────────────┐
   ↓                    ↓                    ↓
(E2EE?)          Update State        Trigger Notifications
(decrypt)        (messages,          (sound/desktop)
                allMessages,         (if conditions met)
                chats)
   ↓                    ↓
 Content        Renders to UI
Available

Conditions for Desktop Notification:
  ✓ message NOT from active chat
  ✓ appearance.notificationsEnabled = true
  ✓ document.hidden = true
  ✓ Notification.permission = 'granted'
  ✓ sender is not current user

Conditions for Sound Notification:
  ✓ message NOT from active chat
  ✓ appearance.soundsEnabled = true
  ✓ receiver is not the sender
```

---

## Chat List Refresh Flow (Every 15 seconds)

```
setInterval(() => {
  if (authToken && websocket) {
    fetchChats()  →  GET /api/chats
  }
}, 15000)
        ↓
Updates chat metadata:
  - unreadCount
  - lastMessage
  - participant list
  - avatar/name changes
        ↓
Does NOT fetch individual message content
(Messages arrive via WebSocket or on-demand)
```

---

## Manual Chat Open Flow

```
User clicks on chat
        ↓
setActiveChat(chatId)
        ↓
   ┌──────────────────┬──────────────────────┐
   ↓                  ↓
Load Cached       Fetch Latest
Messages          (in background)
(instant)         fetchMessages(chatId)
   ↓                  ↓
Render to UI     Get /api/chats/{id}/messages
   ↓                  ↓
           Decrypt messages
           Update allMessages
           (if showing, also update view)
```

---

## Notification Component Hierarchy

```
App.tsx
  ├── ChatScreen.tsx (main chat view)
  │   └── messages display
  ├── Notifications.tsx (bottom-right corner)
│   ├── Reads from: useStore().notifications
│   ├── Renders: 3-5 notification cards
│   └── Auto-dismisses after 4 seconds
└── Other components...

useStore() dispatch:
  addNotification(text, type) →  added to state
                                  auto-removed after 4s
```

---

## Current Polling Intervals

| Interval | Purpose | Location | Effect |
|----------|---------|----------|--------|
| **15 sec** | Chat list refresh | store.ts:932-937 | Updates chat metadata, last message, unread count |
| **10 sec** | Server connection timeout | store.ts:473 | Initial connection has 10s timeout |
| **4 sec** | Notification dismiss | store.ts:2102 | Auto-remove notification from UI |
| **on-demand** | Fetch message history | store.ts:1350 | When user opens a chat |
| **real-time** | WebSocket messages | store.ts:768 | When message/event arrives |

---

## WebSocket Message Type Map

```
Client receives      Handler Location    Store Updates
────────────────────────────────────────────────────────
'message'     →    store.ts:773         messages, allMessages, chats
'message_edited' → store.ts:823        messages, allMessages
'message_deleted' →store.ts:835        messages, allMessages
'user_online'  →   store.ts:870        users (online: true)
'user_offline' →   store.ts:877        users (online: false, lastSeen)
'announcement' →   store.ts:756        → addNotification()
'typing'       →   (Not exposed in UI)  
'chat_updated' →   store.ts:899        → fetchChats()
'kicked'       →   store.ts:901        → logout()
'maintenance'  →   store.ts:905        → logout()
```

---

## E2EE Message Flow

```
SENDING:
User types message
  ↓
content = "Hello"
  ↓
Is E2EE enabled? (has chatKey?)
  ↓
YES: payloadContent = "e2ee:" + encrypt(content, chatKey)
NO:  payloadContent = "Hello"
  ↓
POST /api/chats/{id}/messages { content: payloadContent }
  ↓
Server stores as-is (encrypted or plain)
  ↓
Server broadcasts to all members
  ↓

RECEIVING:
WebSocket message arrives
  ↓
content = "e2ee:..." (encrypted)
  ↓
Starts with 'e2ee:'?
  ↓
YES: Decrypt using chatKeys[chatId]
NO:  Use as-is
  ↓
Store in allMessages
  ↓
Render to UI
```

---

## Notification Preference Flags

From `appearance` settings in store:

```typescript
{
  soundsEnabled: boolean        // Play audio on message
  notificationsEnabled: boolean // Show desktop notification
  showOnlineStatus: boolean     // Let others see you online
  animationsEnabled: boolean    // Notification animation
  showTimestamps: boolean       // Show time on messages
}
```

Currently, these are **global** - no per-chat customization.

---

## Events That Trigger addNotification()

```
Connection Events:
  ✓ "Connected to [server]" (success)
  ✓ "Connection failed: [error]" (error)

Authentication:
  ✓ "Welcome back, [username]!" (success)
  ✓ "[Error message]" (error)

Server Announcements:
  ✓ "📢 [admin message]" (info) - via WebSocket

Chat Operations:
  ✓ "[username] called you" (info)
  ✓ "Call ended" (info)
  ✓ "You have been kicked" (error)
  ✓ "You have left the server" (info)

Message Operations:
  ✓ "Failed to send message" (error)
  ✓ "Message deleted" (auto - not triggered currently)

Configuration:
  ✓ "Server configuration updated" (success)
  ✓ "Failed to update config" (error)

Maintenance:
  ✓ "🔧 Server is entering maintenance..." (error)
  ✓ "✅ Server maintenance complete" (success)
```

---

## Store State Relevant to Notifications

```typescript
interface AppState {
  // Current state
  notifications: Array<{
    id: string;
    text: string;
    type: 'success' | 'error' | 'info';
  }>;
  
  // Message data
  messages: Message[];                          // Current chat messages
  allMessages: Record<string, Message[]>;       // All chat messages
  activeChat: string | null;                    // Currently open chat
  
  // User data
  currentUser: User | null;
  users: User[];                                // All users
  
  // Chat data
  chats: Chat[];                                // User's chats
  
  // Settings that affect notifications
  appearance: {
    soundsEnabled: boolean;
    notificationsEnabled: boolean;
    // ... other settings
  };
  
  // Connection
  websocket: WebSocket | null;
  connected: boolean;
  
  // Methods to trigger notifications
  addNotification: (text, type) => void;
  removeNotification: (id) => void;
}
```

---

## How to Find Notification Code

### To add a notification:
```bash
git grep "addNotification" src/
# Shows all places where notifications are triggered
```

### To change notification dismissal time:
```
File: src/store.ts
Line: 2102
Change: setTimeout(() => {...}, 4000)
        // ↑ This is 4 seconds
```

### To change chat refresh interval:
```
File: src/store.ts
Line: 937
Change: }, 15000)  // 15 seconds
```

### To change sound file:
```
File: src/store.ts
Line: 845
Audio source is base64-encoded WAV
Change the data:audio/wav;base64,... string
```

### To add/remove notification types:
```
File: src/store.ts
Change ws.onmessage cases (lines 756-920)
```

---

## How to Implement Per-Chat Notifications

### Step 1: Extend appearance settings
```typescript
interface AppearanceSettings {
  // ... existing ...
  chatNotificationPrefs: Record<string, {
    soundEnabled: boolean;
    desktopEnabled: boolean;
    mutedUntil?: number; // timestamp
  }>;
}
```

### Step 2: Update notification check
```typescript
// Old (lines 850-860):
if (!isActiveChat && state.appearance.soundsEnabled) {
  playSound();
}

// New:
const chatPref = state.appearance.chatNotificationPrefs?.[chatId];
const soundEnabled = chatPref?.soundEnabled ?? state.appearance.soundsEnabled;
if (!isActiveChat && soundEnabled) {
  playSound();
}
```

### Step 3: Add UI to UserSettings or ChatInfo component
```typescript
// Add toggles for each chat:
- Mute for 1 hour / 8 hours / 24 hours / Forever
- Sound notifications (toggle)
- Desktop notifications (toggle)
```

---

## Testing Notifications

### Test Desktop Notification (requires user gesture):
```javascript
// In browser console:
useStore().addNotification("Test notification", "info");

// For desktop notification:
new Notification("Test", { body: "This is a test" });
```

### Test WebSocket Message:
```javascript
// Connect to dev server WebSocket:
const ws = new WebSocket("ws://localhost:3000/ws?token=<your_token>");
ws.send(JSON.stringify({
  type: 'message',
  data: {
    id: '123',
    chatId: 'abc',
    senderId: 'user2',
    content: 'Test message',
    type: 'text',
    timestamp: Date.now()
  }
}));
```

### Test Polling Interval:
```javascript
// Monitor store updates every 5 seconds for 1 minute:
const intervals = [];
for (let i = 0; i < 12; i++) {
  intervals.push(setTimeout(() => {
    console.log("Chats:", useStore().chats.length);
  }, i * 5000));
}
```

---

## Performance Notes

- **WebSocket**: ~1 persistent connection
- **Message Polling**: 1 HTTP request every 15 seconds (negligible)
- **Chat Polling**: 1 HTTP request every 15 seconds (negligible)  
- **Message History**: On-demand, 50 messages max per request
- **Storage**: All messages in memory (app-wide limit depends on device RAM)
- **Notifications**: Auto-dismissed after 4 seconds

For large message histories (1000+ messages), consider pagination or virtualization.
