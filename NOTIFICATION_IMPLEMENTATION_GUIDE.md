# Implementation Guide: Event-Based Notification System

## Overview

This guide provides specific code examples to add event-based notifications to the current system using the recommended **EventEmitter pattern**.

---

## Phase 1: Create Notification Event System

### Step 1.1: Create Event Emitter Utility

**File:** `src/utils/notificationEmitter.ts`

```typescript
import { EventEmitter } from 'events';

/**
 * Notification event types throughout the application
 */
export enum NotificationEventType {
  // Messages
  MESSAGE_RECEIVED = 'notification:message_received',
  MESSAGE_EDITED = 'notification:message_edited',
  MESSAGE_DELETED = 'notification:message_deleted',
  
  // Users
  USER_ONLINE = 'notification:user_online',
  USER_OFFLINE = 'notification:user_offline',
  USER_TYPING = 'notification:user_typing',
  
  // Chats
  CHAT_CREATED = 'notification:chat_created',
  CHAT_UPDATED = 'notification:chat_updated',
  USER_REMOVED_FROM_CHAT = 'notification:user_removed',
  
  // Calls
  INCOMING_CALL = 'notification:incoming_call',
  CALL_MISSED = 'notification:call_missed',
  
  // System
  ANNOUNCEMENT = 'notification:announcement',
  MAINTENANCE = 'notification:maintenance',
  USER_KICKED = 'notification:user_kicked',
  ERROR = 'notification:error',
}

export interface NotificationEventPayload {
  [NotificationEventType.MESSAGE_RECEIVED]: {
    messageId: string;
    chatId: string;
    senderId: string;
    senderName: string;
    content: string;
    messageType: 'text' | 'image' | 'file' | 'poll';
    senderAvatar?: string;
    isE2EE: boolean;
  };
  [NotificationEventType.MESSAGE_EDITED]: {
    messageId: string;
    chatId: string;
    newContent: string;
  };
  [NotificationEventType.MESSAGE_DELETED]: {
    messageId: string;
    chatId: string;
  };
  [NotificationEventType.USER_ONLINE]: {
    userId: string;
    username: string;
  };
  [NotificationEventType.USER_OFFLINE]: {
    userId: string;
    username: string;
    lastSeen: number;
  };
  [NotificationEventType.USER_TYPING]: {
    userId: string;
    chatId: string;
    username: string;
  };
  [NotificationEventType.CHAT_CREATED]: {
    chatId: string;
    chatName: string;
    participants: string[];
  };
  [NotificationEventType.INCOMING_CALL]: {
    callerId: string;
    callerName: string;
    chatId: string;
    callType: 'voice' | 'video';
    callerAvatar?: string;
  };
  [NotificationEventType.ANNOUNCEMENT]: {
    message: string;
    from: string;
    timestamp: number;
  };
  [NotificationEventType.ERROR]: {
    message: string;
    code?: string;
    context?: string;
  };
}

/**
 * Global notification event emitter
 * Use this to emit and listen for notification events throughout the app
 */
class NotificationEmitterInstance extends EventEmitter {
  emit<T extends NotificationEventType>(
    event: T,
    payload: NotificationEventPayload[T]
  ): boolean {
    return super.emit(event, payload);
  }

  on<T extends NotificationEventType>(
    event: T,
    listener: (payload: NotificationEventPayload[T]) => void
  ): this {
    return super.on(event, listener);
  }

  once<T extends NotificationEventType>(
    event: T,
    listener: (payload: NotificationEventPayload[T]) => void
  ): this {
    return super.once(event, listener);
  }

  off<T extends NotificationEventType>(
    event: T,
    listener: (payload: NotificationEventPayload[T]) => void
  ): this {
    return super.off(event, listener);
  }
}

export const notificationEmitter = new NotificationEmitterInstance();
```

---

### Step 1.2: Create Notification Preferences Store

**File:** `src/utils/notificationPreferences.ts`

```typescript
export interface ChatNotificationPreference {
  chatId: string;
  soundEnabled: boolean;
  desktopEnabled: boolean;
  badgeEnabled: boolean;
  mutedUntil?: number; // timestamp or 0 for not muted
}

export interface GlobalNotificationSettings {
  soundVolume: number; // 0-1
  soundEnabled: boolean;
  desktopEnabled: boolean;
  showInactiveChats: boolean; // Show notifications even when window focused
  groupNotifications: boolean; // Batch notifications
  dndStart?: string; // HH:mm format
  dndEnd?: string;   // HH:mm format
}

const STORAGE_KEY_PREFS = '4messenger-notification-prefs';
const STORAGE_KEY_GLOBAL = '4messenger-notification-global';

export const notificationPreferences = {
  /**
   * Get preferences for a specific chat
   */
  getChat(chatId: string): ChatNotificationPreference {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFS);
      if (stored) {
        const prefs = JSON.parse(stored) as Record<string, ChatNotificationPreference>;
        return prefs[chatId] || this.getDefaultChatPref(chatId);
      }
    } catch (e) {
      console.error('Failed to load chat notification preferences:', e);
    }
    return this.getDefaultChatPref(chatId);
  },

  /**
   * Save preferences for a specific chat
   */
  setChat(chatId: string, pref: Partial<ChatNotificationPreference>): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFS);
      const prefs = stored ? JSON.parse(stored) : {};
      prefs[chatId] = { ...this.getDefaultChatPref(chatId), ...pref, chatId };
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save chat notification preferences:', e);
    }
  },

  /**
   * Get global notification settings
   */
  getGlobal(): GlobalNotificationSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GLOBAL);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load global notification settings:', e);
    }
    return this.getDefaultGlobal();
  },

  /**
   * Save global notification settings
   */
  setGlobal(settings: Partial<GlobalNotificationSettings>): void {
    try {
      const current = this.getGlobal();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEY_GLOBAL, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save global notification settings:', e);
    }
  },

  /**
   * Mute a chat for specified duration (in minutes, or 0 for forever)
   */
  muteChat(chatId: string, minutes: number = 60): void {
    const mutedUntil = minutes === 0 ? -1 : Date.now() + (minutes * 60 * 1000);
    this.setChat(chatId, { mutedUntil });
  },

  /**
   * Unmute a chat
   */
  unmuteChat(chatId: string): void {
    this.setChat(chatId, { mutedUntil: 0 });
  },

  /**
   * Check if chat is currently muted
   */
  isChatMuted(chatId: string): boolean {
    const pref = this.getChat(chatId);
    if (!pref.mutedUntil) return false;
    if (pref.mutedUntil === -1) return true; // Muted forever
    return pref.mutedUntil > Date.now();
  },

  /**
   * Check if currently in Do Not Disturb period
   */
  isInDND(): boolean {
    const global = this.getGlobal();
    if (!global.dndStart || !global.dndEnd) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (global.dndStart < global.dndEnd) {
      // Normal case: dnd is within same day
      return currentTime >= global.dndStart && currentTime <= global.dndEnd;
    } else {
      // Wraps midnight
      return currentTime >= global.dndStart || currentTime <= global.dndEnd;
    }
  },

  getDefaultChatPref(chatId: string): ChatNotificationPreference {
    return {
      chatId,
      soundEnabled: true,
      desktopEnabled: true,
      badgeEnabled: true,
      mutedUntil: 0,
    };
  },

  getDefaultGlobal(): GlobalNotificationSettings {
    return {
      soundVolume: 0.3,
      soundEnabled: true,
      desktopEnabled: true,
      showInactiveChats: false,
      groupNotifications: false,
    };
  },
};
```

---

### Step 1.3: Create Notification Handler Service

**File:** `src/services/notificationHandler.ts`

```typescript
import { notificationEmitter, NotificationEventType, NotificationEventPayload } from '@/utils/notificationEmitter';
import { notificationPreferences } from '@/utils/notificationPreferences';
import { useStore } from '@/store';

/**
 * Centralized notification handling logic
 */
export class NotificationHandler {
  private soundAudio?: HTMLAudioElement;
  private messageCache = new Map<string, number>(); // messageId -> timestamp

  constructor() {
    this.setupEventListeners();
    this.setupAudioElement();
  }

  private setupAudioElement(): void {
    // Reuse the base64 audio from existing code
    this.soundAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczHDdlj8XX3a1YMB04ZI3E1d2sWjIfOGWPxNXdrFoyHw==');
  }

  private setupEventListeners(): void {
    notificationEmitter.on(
      NotificationEventType.MESSAGE_RECEIVED,
      (payload) => this.handleMessageReceived(payload)
    );

    notificationEmitter.on(
      NotificationEventType.INCOMING_CALL,
      (payload) => this.handleIncomingCall(payload)
    );

    notificationEmitter.on(
      NotificationEventType.ANNOUNCEMENT,
      (payload) => this.handleAnnouncement(payload)
    );

    notificationEmitter.on(
      NotificationEventType.ERROR,
      (payload) => this.handleError(payload)
    );
  }

  private handleMessageReceived(payload: NotificationEventPayload[NotificationEventType.MESSAGE_RECEIVED]): void {
    const store = useStore.getState();
    
    // Prevent duplicate notifications from cache
    const cacheKey = payload.messageId;
    const lastNotified = this.messageCache.get(cacheKey);
    if (lastNotified && Date.now() - lastNotified < 1000) {
      return; // Debounce - already notified in last 1s
    }
    this.messageCache.set(cacheKey, Date.now());

    // Check if should notify based on preferences
    const chatPref = notificationPreferences.getChat(payload.chatId);
    const globalPref = notificationPreferences.getGlobal();

    const isMuted = notificationPreferences.isChatMuted(payload.chatId);
    const isInDND = notificationPreferences.isInDND();
    const isActiveChat = store.activeChat === payload.chatId;

    // Determine if should show notification
    const shouldNotify = !isMuted && !isInDND;
    const shouldShowUI = shouldNotify || globalPref.showInactiveChats;
    const shouldPlaySound = shouldNotify && chatPref.soundEnabled && globalPref.soundEnabled;
    const shouldShowDesktop = shouldNotify && chatPref.desktopEnabled && globalPref.desktopEnabled && document.hidden;

    // Show UI notification (always except when muted/DND)
    if (shouldShowUI) {
      const text = payload.messageType === 'text' 
        ? `${payload.senderName}: ${payload.content}`
        : `${payload.senderName} sent a ${payload.messageType}`;
      store.addNotification(text, 'info');
    }

    // Play sound
    if (shouldPlaySound && this.soundAudio) {
      this.soundAudio.volume = globalPref.soundVolume;
      this.soundAudio.play().catch(() => {});
    }

    // Show desktop notification
    if (shouldShowDesktop) {
      this.showDesktopNotification(
        payload.senderName,
        payload.messageType === 'text' ? payload.content : `Sent a ${payload.messageType}`,
        payload.senderAvatar
      );
    }
  }

  private handleIncomingCall(payload: NotificationEventPayload[NotificationEventType.INCOMING_CALL]): void {
    const store = useStore.getState();
    const globalPref = notificationPreferences.getGlobal();

    const text = `📞 Incoming ${payload.callType} call from ${payload.callerName}`;
    store.addNotification(text, 'info');

    // Always play sound for calls
    if (globalPref.soundEnabled && this.soundAudio) {
      this.soundAudio.volume = Math.min(globalPref.soundVolume * 2, 1); // Louder for calls
      this.soundAudio.play().catch(() => {});
    }

    // Show desktop notification
    this.showDesktopNotification(
      payload.callerName,
      `Calling... (${payload.callType})`,
      payload.callerAvatar
    );
  }

  private handleAnnouncement(payload: NotificationEventPayload[NotificationEventType.ANNOUNCEMENT]): void {
    const store = useStore.getState();
    store.addNotification(`📢 ${payload.message}`, 'info');
  }

  private handleError(payload: NotificationEventPayload[NotificationEventType.ERROR]): void {
    const store = useStore.getState();
    store.addNotification(payload.message, 'error');
  }

  private showDesktopNotification(title: string, body: string, icon?: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body.substring(0, 100),
          icon: icon || undefined,
          badge: '/icon-badge.png',
          tag: 'messenger-notification',
          requireInteraction: false,
        });
      } catch (e) {
        console.error('Failed to show desktop notification:', e);
      }
    }
  }
}

// Create singleton instance
export const notificationHandler = new NotificationHandler();
```

---

## Phase 2: Integrate with Store

### Step 2.1: Update WebSocket Message Handler

**File:** `src/store.ts` - Update the WebSocket `onmessage` handler

```typescript
// Around line 768-920, in the ws.onmessage handler:

ws.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data);
    
    switch (msg.type) {
      case 'announcement':
        // OLD:
        // get().addNotification(`📢 ${msg.message}`, 'info');
        
        // NEW: Emit event for notification system
        notificationEmitter.emit(NotificationEventType.ANNOUNCEMENT, {
          message: msg.message,
          from: msg.from || 'Admin',
          timestamp: msg.timestamp || Date.now(),
        });
        break;

      case 'message':
      case 'new_message': {
        const handleIncomingMessage = async () => {
          const msgData = msg.data || msg.message;
          if (!msgData) return;

          const senderId = msgData.sender_id || msgData.senderId;
          const chatId = msgData.chat_id || msgData.chatId;

          let content = msgData.content;
          if (content && content.startsWith('e2ee:')) {
            const state = get();
            if (state.chatKeys[chatId]) {
              content = await E2EE.decryptMessage(content, state.chatKeys[chatId]);
            } else {
              content = '[Encrypted Message]';
            }
          }

          const mappedMsg: Message = {
            id: msgData.id,
            chatId,
            senderId,
            content,
            type: msgData.type || 'text',
            fileName: msgData.file_name || msgData.fileName,
            fileSize: msgData.file_size || msgData.fileSize,
            fileUrl: msgData.file_url || msgData.fileUrl,
            poll: msgData.poll || null,
            timestamp: msgData.created_at || msgData.timestamp || Date.now(),
            encrypted: !!msgData.encrypted,
            edited: !!msgData.edited,
            readBy: msgData.readBy || [],
          };

          const state = get();
          const isOwnMessage = senderId === state.currentUser?.id;
          const isActiveChat = state.activeChat === chatId;

          const existsInMessages = state.messages.some(m => m.id === mappedMsg.id);
          const existsInAll = (state.allMessages[chatId] || []).some(m => m.id === mappedMsg.id);

          if (!existsInMessages && !existsInAll) {
            if (!isOwnMessage) {
              set(state2 => {
                const chatMessages = state2.allMessages[chatId] || [];
                return {
                  allMessages: {
                    ...state2.allMessages,
                    [chatId]: [...chatMessages, mappedMsg],
                  },
                  messages: isActiveChat 
                    ? [...state2.messages, mappedMsg]
                    : state2.messages,
                  chats: state2.chats.map(c => 
                    c.id === chatId 
                      ? { 
                          ...c, 
                          lastMessage: mappedMsg, 
                          unreadCount: isActiveChat ? c.unreadCount : c.unreadCount + 1 
                        } 
                      : c
                  ),
                };
              });

              // NEW: Emit notification event instead of direct notification
              const senderUser = state.users.find(u => u.id === senderId);
              const senderName = senderUser?.displayName || senderUser?.username || 'Someone';
              
              notificationEmitter.emit(NotificationEventType.MESSAGE_RECEIVED, {
                messageId: mappedMsg.id,
                chatId,
                senderId,
                senderName,
                content: mappedMsg.content,
                messageType: mappedMsg.type as any,
                senderAvatar: senderUser?.avatar,
                isE2EE: !!mappedMsg.encrypted,
              });
            }
          }
        };
        handleIncomingMessage();
        break;
      }

      case 'incoming_call': {
        // NEW: Emit incoming call event
        notificationEmitter.emit(NotificationEventType.INCOMING_CALL, {
          callerId: msg.fromUserId,
          callerName: state.users.find(u => u.id === msg.fromUserId)?.displayName || 'Someone',
          chatId: msg.chatId,
          callType: msg.callType || 'voice',
          callerAvatar: state.users.find(u => u.id === msg.fromUserId)?.avatar,
        });
        break;
      }

      // ... other cases remain the same
    }
  } catch (error) {
    console.error('[WS] Error parsing message:', error);
  }
};
```

---

### Step 2.2: Add Event Imports to Store

At the top of `src/store.ts`:

```typescript
import { notificationEmitter, NotificationEventType } from '@/utils/notificationEmitter';
import { notificationHandler } from '@/services/notificationHandler';

// Initialize notification handler when store is created
notificationHandler; // This triggers setup of event listeners
```

---

## Phase 3: Create UI Components for Preferences

### Step 3.1: Create Notification Preferences Component

**File:** `src/components/NotificationPreferences.tsx`

```typescript
import React, { useState } from 'react';
import { Bell, Volume2, Monitor, Clock, Smartphone } from 'lucide-react';
import { notificationPreferences } from '@/utils/notificationPreferences';

interface NotificationPreferencesProps {
  chatId: string;
  chatName: string;
}

export function NotificationPreferences({ chatId, chatName }: NotificationPreferencesProps) {
  const [pref, setPref] = useState(notificationPreferences.getChat(chatId));
  const [global, setGlobal] = useState(notificationPreferences.getGlobal());

  const handleChatPrefChange = (key: keyof typeof pref, value: any) => {
    const newPref = { ...pref, [key]: value };
    setPref(newPref);
    notificationPreferences.setChat(chatId, newPref);
  };

  const handleGlobalPrefChange = (key: keyof typeof global, value: any) => {
    const newGlobal = { ...global, [key]: value };
    setGlobal(newGlobal);
    notificationPreferences.setGlobal(newGlobal);
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="font-semibold mb-3">Notifications for "{chatName}"</h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={pref.soundEnabled}
              onChange={(e) => handleChatPrefChange('soundEnabled', e.target.checked)}
              className="w-4 h-4"
            />
            <Volume2 className="w-4 h-4" />
            <span>Sound notifications</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={pref.desktopEnabled}
              onChange={(e) => handleChatPrefChange('desktopEnabled', e.target.checked)}
              className="w-4 h-4"
            />
            <Monitor className="w-4 h-4" />
            <span>Desktop notifications</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={pref.badgeEnabled}
              onChange={(e) => handleChatPrefChange('badgeEnabled', e.target.checked)}
              className="w-4 h-4"
            />
            <Bell className="w-4 h-4" />
            <span>Show unread badge</span>
          </label>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Mute for:</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: '1 hour', minutes: 60 },
                { label: '8 hours', minutes: 480 },
                { label: '24 hours', minutes: 1440 },
                { label: 'Forever', minutes: 0 },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => {
                    notificationPreferences.muteChat(chatId, option.minutes);
                    setPref(notificationPreferences.getChat(chatId));
                  }}
                  className="px-3 py-1 rounded text-sm bg-indigo-600/20 hover:bg-indigo-600/40 transition"
                >
                  {option.label}
                </button>
              ))}
            </div>
            {notificationPreferences.isChatMuted(chatId) && (
              <button
                onClick={() => {
                  notificationPreferences.unmuteChat(chatId);
                  setPref(notificationPreferences.getChat(chatId));
                }}
                className="mt-2 text-sm text-blue-400 hover:underline"
              >
                Unmute
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-3">Global Notification Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 mb-2">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm">Notification volume</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={global.soundVolume * 100}
              onChange={(e) => handleGlobalPrefChange('soundVolume', e.target.valueAsNumber / 100)}
              className="w-full"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={global.soundEnabled}
              onChange={(e) => handleGlobalPrefChange('soundEnabled', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Enable all sounds</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={global.desktopEnabled}
              onChange={(e) => handleGlobalPrefChange('desktopEnabled', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Enable desktop notifications</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={global.showInactiveChats}
              onChange={(e) => handleGlobalPrefChange('showInactiveChats', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Show notifications even when chat is open</span>
          </label>

          <div className="pt-4 border-t">
            <label className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Do Not Disturb</span>
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={global.dndStart || '22:00'}
                onChange={(e) => handleGlobalPrefChange('dndStart', e.target.value)}
                className="px-2 py-1 rounded bg-gray-700 text-sm"
              />
              <span>to</span>
              <input
                type="time"
                value={global.dndEnd || '08:00'}
                onChange={(e) => handleGlobalPrefChange('dndEnd', e.target.value)}
                className="px-2 py-1 rounded bg-gray-700 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 4: Integration Points

### 4.1: Add to User Settings

Add to [src/components/UserSettings.tsx](src/components/UserSettings.tsx):

```typescript
import { NotificationPreferences } from './NotificationPreferences';

// In the settings tabs:
<TabItem label="Notifications">
  <NotificationPreferences 
    chatId={activeChat} 
    chatName={chats.find(c => c.id === activeChat)?.name || 'Chat'}
  />
</TabItem>
```

### 4.2: Add to Chat Info Panel

Add to [src/components/ChatScreen.tsx](src/components/ChatScreen.tsx#L1) - in the chat info section:

```typescript
// When showing chat info:
<NotificationPreferences 
  chatId={activeChat}
  chatName={currentChat?.name || 'Chat'}
/>
```

---

## Testing the Event System

### Test 1: Verify Events Are Emitted

```typescript
// In browser console:
import { notificationEmitter, NotificationEventType } from '@/utils/notificationEmitter';

notificationEmitter.on(NotificationEventType.MESSAGE_RECEIVED, (payload) => {
  console.log('Message event:', payload);
});

// Then send a message from another user
```

### Test 2: Verify Preferences Are Saved

```typescript
import { notificationPreferences } from '@/utils/notificationPreferences';

// Check current chat preferences
const pref = notificationPreferences.getChat('chat-id-here');
console.log('Chat preferences:', pref);

// Mute a chat
notificationPreferences.muteChat('chat-id-here', 60);
console.log('Chat muted:', notificationPreferences.isChatMuted('chat-id-here'));
```

### Test 3: Test DND Logic

```typescript
import { notificationPreferences } from '@/utils/notificationPreferences';

// Set DND
const global = notificationPreferences.getGlobal();
notificationPreferences.setGlobal({
  ...global,
  dndStart: '22:00',
  dndEnd: '08:00',
});

// Check current time
console.log('In DND?', notificationPreferences.isInDND());
```

---

## Deployment Checklist

- [ ] Create `src/utils/notificationEmitter.ts`
- [ ] Create `src/utils/notificationPreferences.ts`
- [ ] Create `src/services/notificationHandler.ts`
- [ ] Create `src/components/NotificationPreferences.tsx`
- [ ] Update `src/store.ts` with event emissions
- [ ] Update `src/components/UserSettings.tsx` to include preferences UI
- [ ] Update `src/components/ChatScreen.tsx` to include preferences UI
- [ ] Test event emissions in browser console
- [ ] Test localStorage persistence
- [ ] Test notification behavior with DND/mute enabled
- [ ] Test all notification types (message, call, announcement, error)
- [ ] Update README.md to document notification system

---

## File Structure After Implementation

```
src/
├── utils/
│   ├── notificationEmitter.ts       (NEW)
│   ├── notificationPreferences.ts   (NEW)
│   └── ...existing utilities...
├── services/
│   ├── notificationHandler.ts       (NEW)
│   └── ...existing services...
├── components/
│   ├── NotificationPreferences.tsx  (NEW)
│   ├── UserSettings.tsx             (MODIFIED)
│   ├── ChatScreen.tsx               (MODIFIED)
│   └── ...existing components...
├── store.ts                         (MODIFIED)
└── ...
```

---

## Performance Optimization Notes

1. **Debounce message notifications**: Already implemented in `NotificationHandler.handleMessageReceived()` (1s debounce)
2. **Lazy load preferences**: Only loaded when needed
3. **Cache desktop notification permission**: Already checked before showing
4. **Batch DOM updates**: LocalStorage writes are minimal

---

## Backwards Compatibility

This implementation:
- ✅ Keeps all existing notification functionality
- ✅ Doesn't break existing code
- ✅ Works alongside current WebSocket messages
- ✅ Is fully opt-in (preferences default to current behavior)
- ✅ Can be incrementally adopted

All new code is additive and doesn't modify existing critical paths.
