# Messenger Notification & Message Handling System Analysis

## Executive Summary

The 4 Messenger application uses a **hybrid approach** combining:
- **Real-time WebSocket** for instant message delivery
- **Periodic polling** for chat metadata (every 15 seconds)
- **Event-based notifications** via store actions
- **Browser Desktop API notifications** (when document is hidden)
- **Audio notifications** (optional)

---

## 1. Notification Trigger Mechanism

### Where Notifications Originate
**File:** [src/components/Notifications.tsx](src/components/Notifications.tsx)

The `Notifications` component is a simple UI layer that:
- Reads from `useStore().notifications` array
- Displays notifications with type-specific styling (success/error/info)
- Auto-removes them via manual `removeNotification()` or after 4 seconds

### Notification Creation
**File:** [src/store.ts](src/store.ts#L2094-L2115) - `addNotification` function

```typescript
addNotification: (text, type) => {
  const id = generateId();
  set(state => ({
    notifications: [...state.notifications, { id, text, type }],
  }));
  setTimeout(() => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  }, 4000);  // Auto-dismiss after 4 seconds
}
```

### Notification Triggers Throughout Codebase
Notifications are triggered manually across the app via `addNotification()` calls:
- **Connection events**: "Connected to [server]", "Connection failed"
- **Authentication**: "Welcome back, [username]!", login failure messages
- **Message events**: "Failed to send message", successful sends (implicit)
- **Server announcements**: Broadcast announcements from admins
- **Chat events**: Creating groups, leaving servers, call notifications
- **System events**: "You have been kicked from the server", maintenance mode notices

---

## 2. Current Message Fetching & Delivery System

### 2A. Real-Time Message Delivery (WebSocket)

**File:** [src/store.ts](src/store.ts#L748-L950) - Login function WebSocket setup

#### WebSocket Connection
```typescript
const wsUrl = serverUrl.replace(/^http/, 'ws').replace(/\/$/, '');
const ws = new WebSocket(`${wsUrl}/ws?token=${data.token}`);
```

#### Message Reception Handler
**Lines 768-920** - Handles incoming WebSocket messages

When `type: 'message'` or `type: 'new_message'` is received:

1. **Decryption** (if E2EE enabled):
   - Check if message content starts with `e2ee:`
   - Decrypt using chatKey if available
   - Otherwise show `[Encrypted Message]`

2. **State Update**:
   - Add to `allMessages[chatId]`
   - Add to `messages` if the chat is active
   - Increment `unreadCount` if not active

3. **Notification Triggers** (Lines 850-875):
   ```typescript
   // Sound notification (if sounds enabled)
   if (!isActiveChat && state.appearance.soundsEnabled) {
     const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczHDdlj8XX3a1YMB04ZI3E1d2sWjIfOGWPxNXdrFoyHw==');
     audio.volume = 0.3;
     audio.play().catch(() => {});
   }
   
   // Desktop notification (if enabled and document hidden)
   if (!isActiveChat && state.appearance.notificationsEnabled && document.hidden) {
     if (Notification.permission === 'granted') {
       new Notification(`${senderName}`, {
         body: mappedMsg.type === 'text' ? mappedMsg.content : `Sent a ${mappedMsg.type}`,
         icon: senderUser?.avatar || undefined,
       });
     }
   }
   ```

### 2B. Message Fetching (Pull Model)

**File:** [src/store.ts](src/store.ts#L1294-L1345) - `fetchMessages` function

#### On-Demand Fetch
```typescript
fetchMessages: async (chatId) => {
  const response = await fetch(`${serverUrl}/api/chats/${chatId}/messages`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
  });
  // Decrypt all messages sequentially
  // Store in allMessages[chatId]
}
```

#### Triggered By:
1. **User opens a chat** (Lines 1350-1356):
   ```typescript
   setActiveChat: (chatId) => {
     // Load cached messages immediately
     const cached = get().allMessages[chatId] || [];
     set({ activeChat: chatId, messages: cached });
     // Fetch latest from server in background
     get().fetchMessages(chatId);
     get().markAsRead(chatId);
   }
   ```

2. **Periodic chat list refresh** (Lines 932-937):
   ```typescript
   const chatRefreshInterval = setInterval(() => {
     if (get().authToken && get().websocket) {
       get().fetchChats();  // Refreshes chat metadata only (not messages)
     }
   }, 15000);  // Every 15 seconds
   ```

### 2C. Message Sending & Broadcasting

**File:** [src/store.ts](src/store.ts#L1364-L1485) - `sendMessage` function

1. **Optimistic UI Update**: Message added to store immediately
2. **Encryption** (if E2EE enabled): Content prefixed with `e2ee:`
3. **HTTP POST** to `/api/chats/{id}/messages`
4. **Server Broadcasting**: Message relayed to all chat members via WebSocket

---

## 3. Server-Side Message Delivery

### Server.js Architecture

**File:** [server/server.js](server/server.js)

#### WebSocket Server Setup (Lines 3508-3525)
```javascript
const wss = new WebSocket.Server({ server, path: '/ws' });
const wsClients = new Map(); // userId -> Set<ws>

function sendToUser(userId, data) {
  const sockets = wsClients.get(userId);
  if (sockets) {
    const msg = JSON.stringify(data);
    sockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
  }
}

function broadcastToAll(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}
```

#### Message Send Endpoint
**Lines 1920-1960** - POST `/api/chats/{id}/messages`

```javascript
// Server stores the message
dbRun('INSERT INTO messages (id, chat_id, sender_id, content, type, ...)', [...]);

// Broadcasts to all chat members (except sender who has it optimistically)
const members = dbAll('SELECT user_id FROM chat_members WHERE chat_id = ?', [chatId]);
members.forEach(m => {
  if (m.user_id !== req.user.id) {
    sendToUser(m.user_id, { type: 'message', data: message });
  }
});

res.status(201).json(message);
```

#### Get Messages Endpoint
**Lines 1874-1932** - GET `/api/chats/{id}/messages`

- Retrieves last 50 messages (configurable via `limit` query param)
- Returns encrypted as-is (E2EE decryption on client)
- Used for chat history and initial load

### WebSocket Message Types
```
'message' / 'new_message'    - New message arrived
'message_edited'             - Message was edited
'message_deleted'            - Message was deleted
'user_online' / 'user_offline' - User status changes
'typing'                     - User is typing
'announcement'               - Admin broadcast
'chat_updated'               - Chat metadata changed
'maintenance'                - Server maintenance notice
'kicked'                     - User was kicked
```

---

## 4. Authentication & Session Management

### Session Persistence
**File:** [src/store.ts](src/store.ts#L200-L230)

```typescript
const saveSession = (serverUrl, authToken, user) => {
  const session: SavedSession = { serverUrl, authToken, user, timestamp: Date.now() };
  localStorage.setItem('4messenger-session', JSON.stringify(session));
};

// Session expires after 7 days
```

### Auto-Login Flow
When login successful:
1. Save session to localStorage
2. Save WS token to cookie (separate per server)
3. Fetch initial data (users, chats, bots)
4. Load E2EE keys from IndexedDB
5. Setup WebSocket connection
6. Request browser notification permission

### On Next Page Load
If session exists and not expired:
- Auto-connect with saved token
- Auto-authenticate WebSocket
- Load chat list immediately
- Skip login/auth screens

---

## 5. Real-Time vs Polling Characteristics

### Real-Time (WebSocket)
| Aspect | Details |
|--------|---------|
| **Latency** | < 100ms typically |
| **Trigger** | Server pushes on message send |
| **Delivery** | To all connected sockets of a user |
| **Frequency** | Event-driven (instant) |
| **Overhead** | Single persistent connection |

### Polling (HTTP)
| Aspect | Details |
|--------|---------|
| **Interval** | 15 seconds (chat metadata only) |
| **Target** | Chat list refresh (`fetchChats`) |
| **Trigger** | setInterval in login handler |
| **Message History** | Fetched on-demand when opening chat |
| **Frequency** | Every 15 seconds |

**Important**: The 10-second reference mentioned doesn't exist in message polling. There IS:
- 10-second timeout on initial server connection (Line 473)
- 15-second chat refresh interval (Line 932)

---

## 6. Event Emitters & Subscription Patterns

### Zustand Store (Central)
**File:** [src/store.ts](src/store.ts#L230-L2250)

The Zustand store serves as the event bus:
```typescript
export const useStore = create<AppState>((set, get) => ({
  // State
  notifications: [],
  websocket: null,
  messages: [],
  allMessages: Record<string, Message[]>,
  
  // Actions that trigger state changes
  addNotification: (text, type) => {...},
  sendMessage: (chatId, content, ...) => {...},
  setActiveChat: (chatId) => {...},
  fetchMessages: (chatId) => {...},
  // ... 80+ other actions
}));
```

### WebSocket Subscription Pattern
**File:** [src/store.ts](src/store.ts#L750)

```typescript
const ws = new WebSocket(`${wsUrl}/ws?token=${data.token}`);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  switch (msg.type) {
    case 'message':
      // Handle incoming message
      set(state => ({ messages: [...state.messages, mappedMsg] }));
      break;
    case 'user_online':
      set(state => ({ users: state.users.map(...) }));
      break;
    // ... more cases
  }
};
```

### Component Subscription
**File:** [src/components/Notifications.tsx](src/components/Notifications.tsx)

```typescript
const { notifications, removeNotification } = useStore();
// Re-renders whenever notifications change
```

### No Custom Event Emitters
- No EventEmitter classes found
- Uses Zustand's reactive state management
- Components automatically re-render on state changes
- WebSocket is the only persistent subscription

---

## 7. Current Architecture Limitations

### Gaps in Event-Based Notifications
1. **No message-specific filters**: All unread messages trigger notifications
2. **No notification delivery** when sender and receiver are in same active chat
3. **No notification preferences** per chat/user
4. **No notification persistence**: Only stored in memory for 4 seconds
5. **No read receipts notifications**: Only stored in database, not surfaced to UI
6. **No typing indicators in notifications**: Typing events are not shown as notifications
7. **No missed message summary**: No badge count or summary on reconnect
8. **No notification scheduling**: Can't defer or batch notifications

---

## 8. Recommended Approach for Enhanced Event-Based Notifications

### Option A: Enhanced Zustand Middleware (Minimal Refactor)
```typescript
// Add notification middleware to store
const notificationMiddleware = (config) => (set, get, api) => {
  // Create wrapper around set to auto-trigger side effects
  return config(
    (state, ...args) => {
      const oldState = api.getState();
      const changes = diffState(oldState, state);
      
      if (changes.newMessages) {
        triggerMessageNotification(changes.newMessages);
      }
      set(state, ...args);
    },
    get,
    api
  );
};

// Usage: create(..., notificationMiddleware);
```

**Pros:**
- Minimal refactor
- Centralized notifications
- Leverages existing Zustand patterns

**Cons:**
- Zustand isn't designed for this pattern
- Loses some TypeScript benefits

### Option B: Separate EventEmitter Layer (Recommended)
```typescript
// src/utils/notificationEmitter.ts
import { EventEmitter } from 'events';

export const notificationEmitter = new EventEmitter();

export enum NotificationEvent {
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_EDITED = 'message:edited',
  MESSAGE_DELETED = 'message:deleted',
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  TYPING_STARTED = 'typing:started',
  CHAT_CREATED = 'chat:created',
  CALL_INCOMING = 'call:incoming',
  ANNOUNCEMENT = 'announcement:received',
}

// In store message handler:
import { notificationEmitter, NotificationEvent } from '@/utils/notificationEmitter';

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'message') {
    notificationEmitter.emit(NotificationEvent.MESSAGE_RECEIVED, msg.data);
  }
};

// In notification logic:
notificationEmitter.on(NotificationEvent.MESSAGE_RECEIVED, (message) => {
  if (shouldShowNotification(message)) {
    playSound();
    showOSNotification(message);
    addToNotificationCenter(message);
  }
});
```

**Pros:**
- Clear separation of concerns
- Easy to test
- Standard Node.js pattern
- Extensible for multiple subscribers
- Easy to add/remove handlers

**Cons:**
- Adds new dependency/layer
- More boilerplate

### Option C: React Context + useCallback (Most React-Native)
```typescript
// src/contexts/NotificationContext.tsx
import { createContext, useCallback, useRef } from 'react';

type NotificationHandler = (data: any) => void;

export const NotificationContext = createContext<{
  on: (event: string, handler: NotificationHandler) => void;
  off: (event: string, handler: NotificationHandler) => void;
  emit: (event: string, data: any) => void;
}>(null!);

export function NotificationProvider({ children }) {
  const handlersRef = useRef<Record<string, NotificationHandler[]>>({});

  const on = useCallback((event: string, handler: NotificationHandler) => {
    if (!handlersRef.current[event]) handlersRef.current[event] = [];
    handlersRef.current[event].push(handler);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    handlersRef.current[event]?.forEach(handler => handler(data));
  }, []);

  return (
    <NotificationContext.Provider value={{ on, off, emit }}>
      {children}
    </NotificationContext.Provider>
  );
}
```

**Pros:**
- Built on React patterns
- No external dependencies
- Integrates with existing React code
- Good for UI-specific events

**Cons:**
- Requires provider setup
- Less robust than Event Emitter

---

## 9. Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Notification preferences per chat | High | Medium | ★★★ |
| Read receipt notifications | High | Low | ★★★ |
| Missed message badges | High | Low | ★★★ |
| Notification persistence/history | Medium | High | ★★ |
| Typing indicators UI | Medium | Medium | ★★ |
| Smart notification throttling | Medium | Medium | ★★ |
| Notification scheduling (DND mode) | Low | Medium | ★ |
| Custom notification sounds | Low | Low | ★ |

---

## 10. Key Files Summary

| File | Purpose | Key Lines |
|------|---------|-----------|
| [src/store.ts](src/store.ts) | Central state & API calls | 750, 768, 932, 1294, 1364, 2094 |
| [src/components/Notifications.tsx](src/components/Notifications.tsx) | Notification UI rendering | 1-45 |
| [server/server.js](server/server.js) | WebSocket & message broadcasting | 3508-3640 |
| [src/App.tsx](src/App.tsx) | Main app component | - |
| [src/components/ChatScreen.tsx](src/components/ChatScreen.tsx) | Chat UI with message handling | 1-150 |

---

## 11. Conclusion

The current system is **efficient and functional**:
- ✅ Real-time delivery via WebSocket for instant messages
- ✅ Fallback polling every 15 seconds for metadata
- ✅ Browser notifications when document is hidden
- ✅ Audio notifications with volume control
- ✅ E2EE support throughout

**For enhanced event-based notifications**, I recommend:
1. **Short term**: Keep current approach, add a simple EventEmitter layer for internal event routing
2. **Medium term**: Implement notification preferences and read receipt notifications
3. **Long term**: Consider a full notification service with persistence, scheduling, and analytics
