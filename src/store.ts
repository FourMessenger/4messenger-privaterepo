import { create } from 'zustand';
import type { User, Message, Chat, ServerConfig, CallState, AppScreen, UserRole, ChatNotificationPreference, NotificationPreferences, ErrorPageState } from './types';
import { type Language, getTranslation } from './translations';
import { e2ee } from './simpleE2EE';
import type { LoadedTheme } from './utils/themeManager';
import { loadSavedTheme, saveTheme, removeSavedTheme, loadThemeFile, applyTheme, clearTheme } from './utils/themeManager';
import { registerThemeIcons, clearThemeIcons } from './utils/iconRegistry';

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// Server shortcut interface
export interface ServerShortcut {
  id: string;
  name: string;
  url: string;
  createdAt: number;
}

// Official server shortcuts - loaded from official.txt and official2.txt
let officialServerUrls: { global: string; russia: string } = { global: '', russia: '' };
let officialServersLoaded = false;

// Load official server URLs from files (will be called after store is created)
const loadOfficialServerUrls = async (): Promise<{ global: string; russia: string }> => {
  if (officialServersLoaded) return officialServerUrls;
  
  try {
    // Load global official server
    try {
      const globalResponse = await fetch('/official.txt');
      if (globalResponse.ok) {
        const url = (await globalResponse.text()).trim();
        if (url && url.startsWith('http')) {
          officialServerUrls.global = url;
        }
      }
    } catch (e) {
      console.error('Failed to load global official server URL:', e);
    }
    
    // Load Russia official server
    try {
      const russiaResponse = await fetch('/official2.txt');
      if (russiaResponse.ok) {
        const url = (await russiaResponse.text()).trim();
        if (url && url.startsWith('http')) {
          officialServerUrls.russia = url;
        }
      }
    } catch (e) {
      console.error('Failed to load Russia official server URL:', e);
    }
  } catch (e) {
    console.error('Failed to load official server URLs:', e);
  }
  
  officialServersLoaded = true;
  return officialServerUrls;
};

// Load shortcuts from localStorage (without official - that's loaded async)
const loadShortcuts = (): ServerShortcut[] => {
  const shortcuts: ServerShortcut[] = [];
  
  try {
    const saved = localStorage.getItem('4messenger-shortcuts');
    if (saved) {
      const parsed = JSON.parse(saved) as ServerShortcut[];
      // Add user shortcuts but avoid duplicating the official ones
      for (const s of parsed) {
        if (s.id !== 'official-4messenger' && s.id !== 'official-4messenger-russia') {
          shortcuts.push(s);
        }
      }
    }
  } catch (e) {
    console.error('Failed to load shortcuts:', e);
  }
  return shortcuts;
};

// Note: initOfficialShortcut is now a store action

// Save shortcuts to localStorage
const saveShortcuts = (shortcuts: ServerShortcut[]) => {
  try {
    localStorage.setItem('4messenger-shortcuts', JSON.stringify(shortcuts));
  } catch (e) {
    console.error('Failed to save shortcuts:', e);
  }
};

// Appearance settings interface
export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  messageStyle: 'modern' | 'classic' | 'minimal' | 'bubbles';
  accentColor: string;
  chatBackground: 'default' | 'gradient1' | 'gradient2' | 'gradient3' | 'pattern1' | 'pattern2' | 'solid';
  chatBackgroundColor: string;
  density: 'compact' | 'comfortable' | 'spacious';
  showAvatars: boolean;
  showTimestamps: boolean;
  use24HourTime: boolean;
  animationsEnabled: boolean;
  roundedCorners: 'none' | 'small' | 'medium' | 'large';
  sidebarPosition: 'left' | 'right';
  enterToSend: boolean;
  showOnlineStatus: boolean;
  soundsEnabled: boolean;
  notificationsEnabled: boolean;
}

const defaultAppearance: AppearanceSettings = {
  theme: 'dark',
  fontSize: 'medium',
  messageStyle: 'modern',
  accentColor: '#6366f1',
  chatBackground: 'default',
  chatBackgroundColor: '#1f2937',
  density: 'comfortable',
  showAvatars: true,
  showTimestamps: true,
  use24HourTime: false,
  animationsEnabled: true,
  roundedCorners: 'medium',
  sidebarPosition: 'left',
  enterToSend: true,
  showOnlineStatus: true,
  soundsEnabled: true,
  notificationsEnabled: true,
};

// Language settings
const loadLanguage = (): Language => {
  try {
    const saved = localStorage.getItem('4messenger-language');
    if (saved === 'en' || saved === 'ru') return saved;
  } catch (e) {
    console.error('Failed to load language:', e);
  }
  // Try to detect from browser
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ru')) return 'ru';
  return 'en';
};

const saveLanguage = (lang: Language) => {
  try {
    localStorage.setItem('4messenger-language', lang);
  } catch (e) {
    console.error('Failed to save language:', e);
  }
};

// Load appearance from localStorage
const loadAppearance = (): AppearanceSettings => {
  try {
    const saved = localStorage.getItem('4messenger-appearance');
    if (saved) {
      return { ...defaultAppearance, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load appearance settings:', e);
  }
  return defaultAppearance;
};

// Save appearance to localStorage
const saveAppearance = (settings: AppearanceSettings) => {
  try {
    localStorage.setItem('4messenger-appearance', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save appearance settings:', e);
  }
};

// Privacy policy acceptance tracking - global one-time acceptance
const hasAcceptedPrivacyPolicy = (): boolean => {
  try {
    return localStorage.getItem('4messenger-privacy-accepted') === 'true';
  } catch (e) {
    console.error('Failed to check privacy policy acceptance:', e);
    return false;
  }
};

const savePrivacyPolicyAcceptance = () => {
  try {
    localStorage.setItem('4messenger-privacy-accepted', 'true');
  } catch (e) {
    console.error('Failed to save privacy policy acceptance:', e);
  }
};

// Notification preferences storage
const defaultNotificationPreferences: NotificationPreferences = {
  chatPreferences: {},
  dndEnabled: false,
  dndStart: 22 * 60,  // 10 PM
  dndEnd: 8 * 60,     // 8 AM
  serverMuted: false,
};

const loadNotificationPreferences = (): NotificationPreferences => {
  try {
    const saved = localStorage.getItem('4messenger-notification-prefs');
    if (saved) {
      return { ...defaultNotificationPreferences, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load notification preferences:', e);
  }
  return defaultNotificationPreferences;
};

const saveNotificationPreferences = (prefs: NotificationPreferences) => {
  try {
    localStorage.setItem('4messenger-notification-prefs', JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save notification preferences:', e);
  }
};

// Session persistence
interface SavedSession {
  serverUrl: string;
  authToken: string;
  user: User;
  timestamp: number;
}

const saveSession = (serverUrl: string, authToken: string, user: User) => {
  try {
    const session: SavedSession = { serverUrl, authToken, user, timestamp: Date.now() };
    localStorage.setItem('4messenger-session', JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
};

const loadSession = (): SavedSession | null => {
  try {
    const saved = localStorage.getItem('4messenger-session');
    if (saved) {
      const session = JSON.parse(saved) as SavedSession;
      // Session expires after 7 days
      if (Date.now() - session.timestamp < 7 * 24 * 60 * 60 * 1000) {
        return session;
      }
      localStorage.removeItem('4messenger-session');
    }
  } catch (e) {
    console.error('Failed to load session:', e);
  }
  return null;
};

const clearSession = () => {
  try {
    localStorage.removeItem('4messenger-session');
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
};

// Cookie utilities for WS token (auto-login)
const saveWsTokenToCookie = (serverUrl: string, token: string, user: User) => {
  try {
    const wsTokenData = { token, user, timestamp: Date.now() };
    // Use server URL as key in localStorage (simulating cookie behavior)
    const serverKey = `4messenger-ws-token-${btoa(serverUrl)}`;
    localStorage.setItem(serverKey, JSON.stringify(wsTokenData));
  } catch (e) {
    console.error('Failed to save WS token:', e);
  }
};

const loadWsTokenFromCookie = (serverUrl: string): { token: string; user: User } | null => {
  try {
    const serverKey = `4messenger-ws-token-${btoa(serverUrl)}`;
    const saved = localStorage.getItem(serverKey);
    if (saved) {
      const data = JSON.parse(saved) as { token: string; user: User; timestamp: number };
      // Token expires after 30 days
      if (Date.now() - data.timestamp < 30 * 24 * 60 * 60 * 1000) {
        return { token: data.token, user: data.user };
      }
      localStorage.removeItem(serverKey);
    }
  } catch (e) {
    console.error('Failed to load WS token:', e);
  }
  return null;
};

const clearWsTokenFromCookie = (serverUrl: string) => {
  try {
    const serverKey = `4messenger-ws-token-${btoa(serverUrl)}`;
    localStorage.removeItem(serverKey);
  } catch (e) {
    console.error('Failed to clear WS token:', e);
  }
};

export interface Bot {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  createdAt: number;
}

interface AppState {
  // Connection
  serverUrl: string;
  connected: boolean;
  connecting: boolean;
  connectionError: string | null;
  screen: AppScreen;
  authToken: string | null;
  websocket: WebSocket | null;

  // Auth
  currentUser: User | null;
  serverConfig: ServerConfig;
  captchaId: string;
  captchaAnswer: string;
  captchaQuestion: string;
  captchaToken: string | null;

  // Data
  users: User[];
  chats: Chat[];
  messages: Message[];
  allMessages: Record<string, Message[]>;
  activeChat: string | null;
  bots: Bot[];
  mutedUsers: User[];
  pushSubscriptions: Array<{ id: string; endpoint: string; createdAt: number }>;
  
  // E2EE
  e2eeKeyPair: { publicKey: any, privateKey: any } | null;
  chatKeys: Record<string, CryptoKey>;
  chatKeyRetryAttempts: Record<string, number>;
  attemptChatKeyUnwrap: (chatId: string, encryptedKey: string) => void;

  // Call
  callState: CallState;
  beginCall: (chatId: string | null, type: 'voice' | 'video', participants: string[]) => void;

  // UI
  showSidebar: boolean;
  showUserProfile: boolean;
  showChatInfo: boolean;
  showNewChat: boolean;
  showNewGroup: boolean;
  searchQuery: string;
  typingUsers: Record<string, string[]>;
  notifications: Array<{ id: string; text: string; type: 'success' | 'error' | 'info' }>;
  appearance: AppearanceSettings;
  notificationPreferences: NotificationPreferences;
  customTheme: LoadedTheme | null;
  themeLoading: boolean;
  themeError: string | null;

  // Actions
  setServerUrl: (url: string) => void;
  connectToServer: () => Promise<void>;
  setConnectionError: (error: string | null) => void;
  setScreen: (screen: AppScreen) => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  leaveServer: () => void;
  verifyServerPassword: (password: string) => Promise<boolean>;
  verifyCaptcha: (answer: string) => Promise<boolean>;
  generateCaptcha: () => Promise<void>;
  setActiveChat: (chatId: string | null) => void;
  sendMessage: (chatId: string, content: string, type?: Message['type'], fileName?: string, fileSize?: number, fileUrl?: string) => void;
  sendPollMessage: (chatId: string, poll: any) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  createDirectChat: (userId: string) => Promise<string>;
  createGroup: (name: string, participants: string[], description?: string, isChannel?: boolean) => void;
  makeChannelAdmin: (chatId: string, userId: string) => Promise<void>;
  removeChannelAdmin: (chatId: string, userId: string) => Promise<void>;
  updateChatSettings: (chatId: string, settings: { name?: string; avatar?: string; description?: string }) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  leaveGroup: (chatId: string) => void;
  addToGroup: (chatId: string, userId: string) => void;
  removeFromGroup: (chatId: string, userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  updateServerConfig: (config: Partial<ServerConfig>) => void;
  startCall: (chatId: string, type: 'voice' | 'video') => void;
  endCall: () => void;
  toggleSidebar: () => void;
  setShowUserProfile: (show: boolean) => void;
  setShowChatInfo: (show: boolean) => void;
  setShowNewChat: (show: boolean) => void;
  setShowNewGroup: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  addNotification: (text: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  markAsRead: (chatId: string) => void;
  encryptMessage: (text: string) => string;
  decryptMessage: (text: string) => string;
  fetchUsers: () => Promise<void>;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  
  // Bots
  fetchBots: () => Promise<void>;
  createBot: (name: string, displayName: string, code: string) => Promise<void>;
  updateBot: (id: string, displayName: string, code: string) => Promise<void>;
  deleteBot: (id: string) => Promise<void>;
  toggleBot: (id: string, chatId?: string) => Promise<boolean>;
  
  // Appearance
  setAppearance: (settings: Partial<AppearanceSettings>) => void;
  resetAppearance: () => void;
  
  // Themes
  loadTheme: (file: File) => Promise<void>;
  applyLoadedTheme: (theme: LoadedTheme) => void;
  unloadTheme: () => void;
  restoreThemeOnStartup: () => void;
  
  // Notification Preferences
  muteChat: (chatId: string, minutesToMute: number) => void;  // 0 = forever, >0 = minutes
  unmuteChat: (chatId: string) => void;
  isChatMuted: (chatId: string) => boolean;
  toggleChatNotificationSound: (chatId: string) => void;
  toggleChatDesktopNotification: (chatId: string) => void;
  toggleServerMute: () => void;
  isInDND: () => boolean;
  setDND: (enabled: boolean, startHour: number, endHour: number) => void;
  
  // Muted Users Management
  fetchMutedUsers: () => Promise<void>;
  muteUser: (userId: string) => Promise<void>;
  unmuteUser: (userId: string) => Promise<void>;
  isMuted: (userId: string) => boolean;

  // Blocked Users Management
  blockedUsers: User[];
  fetchBlockedUsers: () => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isBlocked: (userId: string) => boolean;
  
  // Push Notifications
  fetchPushSubscriptions: () => Promise<void>;
  
  // Server Shortcuts
  serverShortcuts: ServerShortcut[];
  addServerShortcut: (name: string, url: string) => void;
  removeServerShortcut: (id: string) => void;
  initOfficialShortcut: () => Promise<void>;
  
  // Session
  restoreSession: () => Promise<boolean>;
  
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translate: (key: string) => string;
  
  // Privacy Policy - global one-time acceptance
  privacyPolicyAccepted: boolean;
  showPrivacyPolicy: boolean;
  checkPrivacyPolicy: () => boolean;
  acceptPrivacyPolicy: () => void;
  setShowPrivacyPolicy: (show: boolean) => void;

  // Error Page
  errorState: ErrorPageState | null;
  setError: (code: number, message: string, description?: string) => void;
  clearError: () => void;

  // 2FA
  twoFaSessionToken: string | null;
  twoFaAvailableMethods: ('totp' | 'email' | 'trusted_device')[];
  twoFaEmailHint: string | null;
  twoFaStatus: { totpEnabled: boolean; emailTwoFaEnabled: boolean; trustedDevicesCount: number } | null;
  setupAuthenticatorTwoFa: () => Promise<{ secret: string; qrCode: string; manualEntry: string } | null>;
  verifyAuthenticatorSetup: (secret: string, code: string, password: string) => Promise<boolean>;
  setupEmailTwoFa: (password: string) => Promise<boolean>;
  verifyEmailTwoFaCode: (code: string, password: string) => Promise<boolean>;
  verify2Fa: (method: 'totp' | 'email' | 'trusted_device', code: string) => Promise<boolean>;
  send2FaEmailCode: () => Promise<boolean>;
  disableTwoFa: (method: 'totp' | 'email', password: string) => Promise<boolean>;
  getTwoFaStatus: () => Promise<void>;
  setupTrustedDevice: (deviceName: string) => Promise<string | null>;
  getTrustedDevices: () => Promise<any[]>;
  removeTrustedDevice: (deviceId: string) => Promise<boolean>;
}

export const useStore = create<AppState>((set, get) => ({
  serverUrl: '',
  connected: false,
  connecting: false,
  connectionError: null,
  screen: 'connect',
  authToken: null,
  websocket: null,
  currentUser: null,
  serverConfig: {
    emailVerification: false,
    serverPassword: '',
    captchaEnabled: false,
    maxFileSize: 10485760,
    allowRegistration: true,
    serverName: '4 Messenger Server',
    encryptionEnabled: true,
  },
  captchaId: '',
  captchaAnswer: '',
  captchaQuestion: '',
  captchaToken: null,
  users: [],
  myBots: [],
  chats: [],
  messages: [],
  allMessages: {},
  activeChat: null,
  bots: [],
  mutedUsers: [],
  blockedUsers: [],
  pushSubscriptions: [],
  e2eeKeyPair: null,
  chatKeys: {},
  chatKeyRetryAttempts: {},
  callState: { active: false, chatId: null, type: 'voice', participants: [], startTime: null },
  beginCall: (chatId, type, participants) => {
    set({
      callState: {
        active: true,
        chatId,
        type,
        participants,
        startTime: Date.now(),
      },
    });
  },
  showSidebar: true,
  showUserProfile: false,
  showChatInfo: false,
  showNewChat: false,
  showNewGroup: false,
  searchQuery: '',
  typingUsers: {},
  notifications: [],
  appearance: loadAppearance(),
  notificationPreferences: loadNotificationPreferences(),
  customTheme: loadSavedTheme(),
  themeLoading: false,
  themeError: null,
  
  // 2FA
  twoFaSessionToken: null,
  twoFaAvailableMethods: [],
  twoFaEmailHint: null,
  twoFaStatus: null,

  setServerUrl: (url) => {
    // Normalize the URL: add protocol if missing, remove trailing slashes
    let normalizedUrl = url.trim();
    
    // Remove trailing slashes
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');
    
    // Add protocol if missing
    if (normalizedUrl && !normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      // Use https by default, but http for localhost and local IPs
      if (normalizedUrl.includes('localhost') || normalizedUrl.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/)) {
        normalizedUrl = 'http://' + normalizedUrl;
      } else {
        normalizedUrl = 'https://' + normalizedUrl;
      }
    }
    
    set({ serverUrl: normalizedUrl });
  },
  setConnectionError: (error) => set({ connectionError: error }),

  connectToServer: async () => {
    const { serverUrl } = get();
    if (!serverUrl.trim()) return;
    
    set({ connecting: true, connectionError: null });
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    // Collect browser data to send to server
    const browserData = {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      languages: navigator.languages?.join(', '),
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      online: navigator.onLine,
      connectionType: (navigator as unknown as { connection?: { effectiveType?: string } }).connection?.effectiveType,
      touchPoints: navigator.maxTouchPoints,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as unknown as { deviceMemory?: number }).deviceMemory,
      vendor: navigator.vendor,
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
    
    try {
      // Send browser data first (before any auth)
      fetch(`${serverUrl.replace(/\/$/, '')}/api/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(browserData),
      }).catch(() => {}); // Ignore errors
      // Try to connect to the server and get server info
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/server-info`, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      // Check content type to make sure we got JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return valid JSON response');
      }
      
      const serverInfo = await response.json();
      
      // Update server config from server
      set({
        connected: true,
        connecting: false,
        serverConfig: {
          emailVerification: serverInfo.emailVerification || false,
          serverPassword: serverInfo.requiresPassword ? 'required' : '',
          captchaEnabled: serverInfo.captchaEnabled || false,
          maxFileSize: serverInfo.maxFileSize || 10485760,
          allowRegistration: serverInfo.registrationEnabled ?? true,
          serverName: serverInfo.name || '4 Messenger Server',
          encryptionEnabled: serverInfo.encryptionEnabled ?? true,
          maxBotMemoryMB: serverInfo.maxBotMemoryMB || 50,
        },
      });
      
      // Check if we have a saved WS token for auto-login
      const savedWsToken = loadWsTokenFromCookie(serverUrl);
      if (savedWsToken) {
        console.log('[Auto-Login] Found saved WS token, attempting auto-login...');
        
        try {
          // Set initial state for auto-login
          set({ 
            currentUser: savedWsToken.user,
            authToken: savedWsToken.token,
            connected: true,
            connecting: false,
          });
          
          console.log('[Auto-Login] Fetching user data...');
          
          // Fetch initial data
          await Promise.all([
            get().fetchUsers(),
            get().fetchChats(),
            get().fetchBots(),
          ]);
          
          console.log('[Auto-Login] Setting up encryption...');
          
          // SimpleE2EE will be initialized on next interaction - no need to pre-load chat keys
          console.log('[Auto-Login] E2EE ready for per-message encryption');
          
          console.log('[Auto-Login] Success, going to chat');
          set({ screen: 'chat' });
          get().addNotification(`Auto-logged in as ${savedWsToken.user.username}`, 'success');
          return;
        } catch (error) {
          console.warn('[Auto-Login] Failed:', error);
          // Clear the invalid token and fall through to normal login
          clearWsTokenFromCookie(serverUrl);
          
          // Reset auth state
          set({ 
            currentUser: null,
            authToken: null,
            connected: false,
            connecting: false,
          });
        }
      }
      
      // No auto-login available, show normal login flow
      if (!serverInfo.requiresPassword && !serverInfo.captchaEnabled) {
        set({ screen: 'login' });
      } else {
        set({ screen: 'auth' });
        if (serverInfo.captchaEnabled) {
          await get().generateCaptcha();
        }
      }
      
      get().addNotification(`Connected to ${serverInfo.name || serverUrl}`, 'success');
      
    } catch (error) {
      // Connection failed
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      set({
        connecting: false,
        connectionError: `Could not connect to server: ${errorMessage}`,
      });
      get().addNotification(`Connection failed: ${errorMessage}`, 'error');
    }
  },

  setScreen: (screen) => set({ screen }),

  login: async (username, password) => {
    const { serverUrl, captchaToken } = get();
    
    // Initialize simple E2EE - generates RSA key pair for this device/user
    let keyPair: { publicKey: string; privateKey: string } | null = null;
    let shouldUploadPublicKey = false;
    try {
      keyPair = await e2ee.ensureKeyPair();
      if (keyPair) {
        shouldUploadPublicKey = true; // Always send public key on login
        console.log('[SimpleE2EE] Key pair ready');
      }
    } catch (e) {
      console.error('[SimpleE2EE] Error initializing:', e);
      // Continue without E2EE if initialization fails
    }

    set({ e2eeKeyPair: keyPair });
    
    try {
      if (shouldUploadPublicKey && keyPair) {
        console.log('[SimpleE2EE] Sending public key with login request');
      }
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password, 
          captchaToken, 
          publicKey: (shouldUploadPublicKey && keyPair) ? keyPair.publicKey : undefined 
        }),
      });
      
      const data = await response.json();
      
      // Handle 2FA required
      if (response.status === 403 && data.twoFaRequired) {
        set({ 
          twoFaSessionToken: data.twoFaSessionToken,
          twoFaAvailableMethods: data.availableMethods || [],
          twoFaEmailHint: data.emailHint,
          screen: '2fa'
        });
        return true; // Success, but 2FA needed
      }
      
      if (!response.ok) {
        get().addNotification(data.error || 'Login failed', 'error');
        return false;
      }
      
      set({ 
        currentUser: data.user, 
        authToken: data.token,
        screen: 'chat' 
      });
      
      // Save session for auto-login on page reload
      saveSession(serverUrl, data.token, data.user);
      
      // Save WS token to cookies for auto-login when rejoining same server
      saveWsTokenToCookie(serverUrl, data.token, data.user);
      
      // Fetch initial data
      await Promise.all([
        get().fetchUsers(),
        get().fetchChats(),
        get().fetchBots(),
      ]);

      // If we have identity keys, cache them for quick access
      // (No need to load chat keys anymore with per-message E2EE)
      if (keyPair) {
        console.log('[SimpleE2EE] E2EE initialized for per-message encryption - Public key length:', keyPair.publicKey.length);
        console.log('[SimpleE2EE] Private key length:', keyPair.privateKey.length);
      } else {
        console.warn('[SimpleE2EE] No key pair available - E2EE disabled');
      }
      
      // Setup WebSocket connection
      const wsUrl = serverUrl.replace(/^http/, 'ws').replace(/\/$/, '');
      const ws = new WebSocket(`${wsUrl}/ws?token=${data.token}`);
      
      ws.onopen = () => {
        console.log('[WS] Connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          switch (msg.type) {
            case 'announcement':
              get().addNotification(`📢 ${msg.message}`, 'info');
              break;
            case 'message':
            case 'new_message': {
              const handleIncomingMessage = async () => {
                const msgData = msg.data || msg.message;
                if (!msgData) return;

                const senderId = msgData.sender_id || msgData.senderId;
                const chatId = msgData.chat_id || msgData.chatId;
                const currentUser = get().currentUser;

                // Drop incoming messages from blocked users immediately
                if (senderId && get().isBlocked(senderId)) {
                  console.log(`[BLOCK] Dropped incoming message ${msgData.id} from blocked sender ${senderId}`);
                  return;
                }

                let content = msgData.content;
                if (content && typeof content === 'string') {
                  // Check if it's the new E2EE format (e2ee: prefix with JSON data)
                  if (content.startsWith('e2ee:')) {
                    try {
                      const jsonStr = content.substring(5); // Remove 'e2ee:' prefix
                      const packet = JSON.parse(jsonStr);
                      
                      if (packet.iv && packet.ciphertext) {
                        // This is the NEW chat-key format
                        let chatKey = get().chatKeys?.[chatId] as CryptoKey | undefined;
                        
                        // If key is still encrypted (string), try to unwrap it on-demand
                        if (!chatKey && typeof get().chatKeys?.[chatId] === 'string' && get().chatKeys?.[chatId].length > 0) {
                          const encryptedKey = get().chatKeys?.[chatId] as unknown as string;
                          try {
                            console.log('[E2EE] WebSocket: Key still encrypted, unwrapping on-demand for chat:', chatId);
                            chatKey = await e2ee.decryptChatKey(encryptedKey);
                            
                            // Save to localStorage and update state
                            try {
                              const exported = await crypto.subtle.exportKey('raw', chatKey);
                              const keyStr = Array.from(new Uint8Array(exported)).map(b => String.fromCharCode(b)).join('');
                              localStorage.setItem(`4messenger-chat-key-${chatId}`, btoa(keyStr));
                            } catch (e) {
                              console.warn('[E2EE] Failed to save unwrapped key to localStorage:', e);
                            }
                            
                            set(state => ({
                              chatKeys: { ...state.chatKeys, [chatId]: chatKey }
                            }));
                            console.log('[E2EE] ✓ WebSocket: Successfully unwrapped key on demand for chat:', chatId);
                          } catch (err) {
                            console.error('[E2EE] WebSocket: Failed to unwrap key on demand:', err);
                          }
                        }
                        
                        if (senderId === currentUser?.id) {
                          // This is a message I sent - retrieve plaintext from cache
                          const cached = localStorage.getItem(`4messenger-sent-message-${msgData.id}`);
                          if (cached) {
                            content = cached;
                            console.log('[E2EE] Retrieved plaintext for own sent message from WebSocket');
                          } else if (chatKey) {
                            // Try to decrypt if we have the key
                            try {
                              content = await e2ee.decryptMessageWithChatKey(packet.ciphertext, packet.iv, chatKey);
                              console.log('[E2EE] Successfully decrypted own message with chat key from WebSocket');
                            } catch (err) {
                              console.error('[E2EE] Failed to decrypt own message from WebSocket:', err);
                              content = '[Unable to decrypt message]';
                            }
                          } else {
                            console.warn('[E2EE] No chat key available, storing encrypted message');
                            content = msgData.content; // Keep encrypted for now
                          }
                        } else {
                          // This is from someone else
                          if (chatKey) {
                            try {
                              content = await e2ee.decryptMessageWithChatKey(packet.ciphertext, packet.iv, chatKey);
                              console.log('[E2EE] Message decrypted successfully with chat key from WebSocket');
                            } catch (err) {
                              console.error('[E2EE] Decryption failed from WebSocket:', err);
                              content = '[Unable to decrypt message]';
                            }
                          } else {
                            console.warn('[E2EE] No chat key available for decryption from WebSocket');
                            content = '[Message encrypted - waiting for key]';
                          }
                        }
                      } else if (packet.encryptedMessage && packet.encryptedEphemeralKey) {
                        // OLD per-message format - try to decrypt with old method
                        if (senderId === currentUser?.id) {
                          // This is a message I sent
                          // Try to find local plaintext version
                          const userMessages = get().messages.filter(
                            m => m.chatId === chatId && m.senderId === currentUser?.id
                          );
                          const localPlaintext = userMessages.find(m => 
                            m.content && !m.content.includes('{"encryptedMessage"')
                          );
                          
                          if (localPlaintext && localPlaintext.content) {
                            content = localPlaintext.content;
                            console.log('[SimpleE2EE] Using local plaintext for own message from WebSocket');
                          } else {
                            // No plaintext found
                            console.log('[SimpleE2EE] No cached plaintext for own message via WebSocket');
                            // Try to retrieve from localStorage one more time
                            try {
                              const cached = localStorage.getItem(`4messenger-sent-message-${msgData.id}`);
                              if (cached) {
                                content = cached;
                                console.log('[SimpleE2EE] Retrieved plaintext from localStorage for own message');
                              } else {
                                content = msgData.content;
                              }
                            } catch (e) {
                              console.warn('[SimpleE2EE] Failed to retrieve from WebSocket:', e);
                              content = msgData.content;
                            }
                          }
                        } else {
                          // This is a message from someone else - decrypt it
                          try {
                            content = await e2ee.decryptMessage(packet);
                            console.log('[SimpleE2EE] Message decrypted successfully');
                          } catch (err) {
                            const errorMsg = err instanceof Error ? err.message : String(err);
                            console.error('[SimpleE2EE] Decryption failed:', errorMsg);
                            console.error('[SimpleE2EE] Decryption details - messageId:', msgData.id, 'senderId:', senderId, 'error:', err);
                            console.error('[SimpleE2EE] Packet structure:', {
                              encryptedMessage: packet.encryptedMessage?.substring(0, 50),
                              encryptedEphemeralKey: packet.encryptedEphemeralKey?.substring(0, 50),
                              messageIv: packet.messageIv?.substring(0, 50),
                            });
                            content = '[Unable to decrypt message]';
                          }
                        }
                      } else {
                        // Unknown format
                        console.warn('[E2EE] Unknown encrypted message format');
                        content = '[Encrypted message - unknown format]';
                      }
                    } catch (parseErr) {
                      // Failed to parse JSON
                      console.error('[E2EE] Failed to parse encrypted message JSON:', parseErr);
                      content = '[Unable to decrypt message]';
                    }
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

                    // Play notification sound if enabled
                    const isMuted = get().isChatMuted(chatId);
                    const isInDND = get().isInDND();
                    const shouldNotify = !isActiveChat && !isMuted && !isInDND && state.appearance.notificationsEnabled;

                    if (shouldNotify && state.appearance.soundsEnabled) {
                      try {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczHDdlj8XX3a1YMB04ZI3E1d2sWjIfOGWPxNXdrFoyHw==');
                        audio.volume = 0.3;
                        audio.play().catch(() => {});
                      } catch {}
                    }

                    // Show in-app notification immediately
                    if (shouldNotify) {
                      (async () => {
                        const senderUser = state.users.find(u => u.id === senderId);
                        const senderName = senderUser?.displayName || senderUser?.username || 'Someone';
                        try {
                          const preview = await get().getMessagePreview(mappedMsg);
                          get().addNotification(`${senderName}: ${preview}`, 'info');
                        } catch {
                          // Fallback if decryption fails
                          const fallbackPreview = mappedMsg.type === 'text' ? mappedMsg.content.substring(0, 100) : `Sent a ${mappedMsg.type}`;
                          get().addNotification(`${senderName}: ${fallbackPreview}`, 'info');
                        }
                      })();
                    }

                    // Show browser notification (works whenever tab is open or hidden)
                    if (shouldNotify) {
                      try {
                        if (Notification.permission === 'granted') {
                          (async () => {
                            const senderUser = state.users.find(u => u.id === senderId);
                            const senderName = senderUser?.displayName || senderUser?.username || 'Someone';
                            try {
                              const preview = await get().getMessagePreview(mappedMsg);
                              new Notification(`${senderName}`, {
                                body: preview,
                                icon: senderUser?.avatar || undefined,
                                tag: chatId,
                                badge: senderUser?.avatar || undefined,
                              });
                            } catch {
                              // Fallback if decryption fails
                              const fallbackBody = mappedMsg.type === 'text' ? mappedMsg.content : `Sent a ${mappedMsg.type}`;
                              new Notification(`${senderName}`, {
                                body: fallbackBody,
                                icon: senderUser?.avatar || undefined,
                                tag: chatId,
                                badge: senderUser?.avatar || undefined,
                              });
                            }
                          })();
                        }
                      } catch {}
                    }
                  }
                }
              };
              handleIncomingMessage();
              break;
            }
            case 'message_edited': {
              const editData = msg.data;
              if (editData) {
                set(state => ({
                  messages: state.messages.map(m => 
                    m.id === editData.id ? { ...m, content: editData.content, edited: true } : m
                  ),
                  allMessages: Object.fromEntries(
                    Object.entries(state.allMessages).map(([cid, msgs]) => [
                      cid,
                      msgs.map(m => m.id === editData.id ? { ...m, content: editData.content, edited: true } : m)
                    ])
                  ),
                }));
              }
              break;
            }
            case 'message_deleted': {
              const deleteData = msg.data;
              if (deleteData) {
                set(state => ({
                  messages: state.messages.filter(m => m.id !== deleteData.id),
                  allMessages: Object.fromEntries(
                    Object.entries(state.allMessages).map(([cid, msgs]) => [
                      cid,
                      msgs.filter(m => m.id !== deleteData.id)
                    ])
                  ),
                }));
              }
              break;
            }
            case 'user_online':
              set(state => ({
                users: state.users.map(u => u.id === msg.userId ? { ...u, online: true } : u),
              }));
              break;
            case 'user_offline':
              set(state => ({
                users: state.users.map(u => u.id === msg.userId ? { ...u, online: false, lastSeen: Date.now() } : u),
              }));
              break;
            case 'chat_updated':
              // Refetch chats when something changes
              get().fetchChats();
              break;
            case 'kicked':
              get().addNotification('You have been kicked from the server', 'error');
              get().logout();
              break;
            case 'maintenance':
              if (msg.enabled) {
                get().addNotification(`🔧 Server is entering maintenance mode: ${msg.message || 'Please try again later'}`, 'error');
                get().logout();
              } else {
                get().addNotification('✅ Server maintenance is complete. You can now reconnect.', 'success');
              }
              break;
          }
        } catch (error) {
          console.error('[WS] Error parsing message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('[WS] Disconnected');
        set({ websocket: null });
      };
      
      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
      
      set({ websocket: ws });
      
      // Periodically refresh chat list to keep it updated
      const chatRefreshInterval = setInterval(() => {
        if (get().authToken && get().websocket) {
          get().fetchChats();
        } else {
          clearInterval(chatRefreshInterval);
        }
      }, 15000);
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      get().addNotification(`Welcome back, ${data.user.username}!`, 'success');
      
      // Wrap keys for any newly available users
      await get().wrapKeysForNewlyAvailableUsers().catch(e => {
        console.error('[E2EE] Error wrapping keys for newly available users:', e);
      });
      
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      get().addNotification(errorMessage, 'error');
      return false;
    }
  },

  register: async (username, email, password) => {
    const { serverUrl, serverConfig, captchaToken } = get();
    
    if (!serverConfig.allowRegistration) {
      get().addNotification('Registration is disabled', 'error');
      return false;
    }
    
    // Generate new device identity keys for new user
    let keyPair: { publicKey: string; privateKey: string } | null = null;
    try {
      keyPair = await e2ee.generateKeyPair();
      console.log('[SimpleE2EE] Generated new key pair for registration');
    } catch (e) {
      console.error('[SimpleE2EE] Failed to generate key pair:', e);
    }
    set({ e2eeKeyPair: keyPair });
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, email, password, captchaToken, publicKey: keyPair?.publicKey }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        get().addNotification(data.error || 'Registration failed', 'error');
        return false;
      }
      
      if (serverConfig.emailVerification) {
        get().addNotification('Registration successful! Please check your email to verify your account.', 'success');
        set({ screen: 'login' });
        return true;
      }
      
      set({ 
        currentUser: data.user, 
        authToken: data.token,
        screen: 'chat' 
      });
      
      // Fetch initial data
      await Promise.all([
        get().fetchUsers(),
        get().fetchChats(),
        get().fetchBots(),
      ]);
      
      get().addNotification(`Welcome to 4 Messenger, ${username}!`, 'success');
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      get().addNotification(errorMessage, 'error');
      return false;
    }
  },

  logout: () => {
    // Close WebSocket connection
    const { websocket, serverUrl } = get();
    if (websocket) {
      websocket.close();
    }
    
    // Clear saved session
    clearSession();
    
    // Clear WS token from cookies when logging out completely
    if (serverUrl) {
      clearWsTokenFromCookie(serverUrl);
    }
    
    // Do NOT clear encryption keys from IndexedDB - they are tied to this device.
    // But clear the in-memory key pair so it must be unlocked on next login.
    
    set({
      currentUser: null,
      authToken: null,
      screen: 'login',  // Go to login screen, not connect screen
      activeChat: null,
      users: [],
      chats: [],
      messages: [],
      allMessages: {},
      connected: false,
      websocket: null,
      e2eeKeyPair: null,  // Clear in-memory key pair after logout
    });
    get().addNotification('Logged out successfully', 'info');
  },

  leaveServer: () => {
    // Close WebSocket connection but keep session
    const { websocket, serverUrl } = get();
    if (websocket) {
      websocket.close();
    }
    
    // Save current auth token to cookies for auto-login
    const { authToken, currentUser } = get();
    if (authToken && currentUser && serverUrl) {
      saveWsTokenToCookie(serverUrl, authToken, currentUser);
    }
    
    set({
      activeChat: null,
      users: [],
      chats: [],
      messages: [],
      allMessages: {},
      connected: false,
      websocket: null,
      screen: 'connect',  // Go to server selection screen
      currentUser: null,
      authToken: null,
      e2eeKeyPair: null,  // Clear in-memory key pair but keys stay in IndexedDB
    });
    get().addNotification('You have left the server. Your login token is saved for quick reconnection.', 'info');
  },

  verifyServerPassword: async (password) => {
    const { serverUrl } = get();
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/verify-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (!response.ok) {
        get().addNotification('Failed to verify password', 'error');
        return false;
      }
      
      const data = await response.json();
      
      // Server returns { valid: true/false }
      if (!data.valid) {
        get().addNotification('Invalid server password', 'error');
        return false;
      }
      
      return true;
      
    } catch (error) {
      get().addNotification('Failed to verify password', 'error');
      return false;
    }
  },

  verifyCaptcha: async (answer) => {
    const { serverUrl, captchaId } = get();
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/captcha/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ id: captchaId, answer: answer.trim() }),
      });
      
      const data = await response.json();
      
      if (data.valid && data.captchaToken) {
        set({ captchaToken: data.captchaToken });
        return true;
      }
      
      get().addNotification('Invalid captcha answer', 'error');
      await get().generateCaptcha();
      return false;
    } catch (error) {
      get().addNotification('Failed to verify captcha', 'error');
      return false;
    }
  },

  generateCaptcha: async () => {
    const { serverUrl } = get();
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/captcha`, {
        headers: { 'Accept': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.enabled && data.id && data.question) {
        set({ 
          captchaId: data.id, 
          captchaQuestion: data.question,
          captchaAnswer: '', // Server knows the answer
        });
      }
    } catch (error) {
      // Fallback to local captcha generation if server fails
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const ops = [
        { q: `${a} + ${b}`, a: String(a + b) },
        { q: `${a + b} - ${b}`, a: String(a) },
        { q: `${a} × ${b <= 10 ? b : Math.floor(b/2)}`, a: String(a * (b <= 10 ? b : Math.floor(b/2))) },
      ];
      const op = ops[Math.floor(Math.random() * ops.length)];
      set({ captchaId: '', captchaQuestion: op.q, captchaAnswer: op.a });
    }
  },

  fetchUsers: async () => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (response.ok) {
        const usersData = await response.json();
        // Map server response format to client format
        const mappedUsers = usersData.map((u: Record<string, unknown>) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role || 'user',
          avatar: u.avatar,
          displayName: u.display_name || u.displayName,
          publicKey: u.public_key || u.publicKey,
          online: !!u.online,
          lastSeen: u.last_seen || u.lastSeen,
          emailVerified: !!u.email_verified || !!u.emailVerified,
          createdAt: u.created_at || u.createdAt,
        }));
        set({ users: mappedUsers });
        
        // After updating users, wrap keys for any newly-available users
        // This ensures offline users get their wrapped keys when they come online
        // MUST await to prevent race condition with fetchChats running in parallel
        await get().wrapKeysForNewlyAvailableUsers();
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  },

  // Re-wrap chat keys for users who just came online with their public key
  wrapKeysForNewlyAvailableUsers: async () => {
    const { currentUser, serverUrl, authToken, chats, users, chatKeys } = get();
    if (!currentUser || !authToken) return;

    try {
      console.log('[E2EE] Wrapping keys for newly available users');
      
      // Get all chats that have E2EE enabled (direct 1-on-1 chats)
      const directChats = chats.filter(
        chat => chat.type === 'direct' || (chat.participants && chat.participants.length === 2)
      );

      for (const chat of directChats) {
        try {
          // Get or create chat key
          const chatKey = await get().ensureChatKey(chat.id);
          if (!chatKey) {
            console.warn('[E2EE] No chat key for:', chat.id);
            continue;
          }

          // Get all participants
          const participants = chat.participants || [];
          const wrappedKeysToSend: Record<string, string> = {};

          // Try to wrap the key for each participant
          for (const userId of participants) {
            // Skip ourselves
            if (userId === currentUser.id) continue;

            // Get the user's public key
            const user = users.find(u => u.id === userId);
            if (!user?.publicKey) {
              console.warn('[E2EE] No public key for user:', userId);
              continue;
            }

            try {
              // Wrap the chat key with the user's public key
              const wrappedKey = await e2ee.encryptChatKeyForUser(chatKey, user.publicKey);
              wrappedKeysToSend[userId] = wrappedKey;
              console.log('[E2EE] Wrapped key for participant:', userId);
            } catch (err) {
              console.error('[E2EE] Failed to wrap key for user:', userId, err);
            }
          }

          // Send wrapped keys to server
          if (Object.keys(wrappedKeysToSend).length > 0) {
            try {
              const response = await fetch(
                `${serverUrl.replace(/\/$/, '')}/api/chats/${chat.id}/keys`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                  },
                  body: JSON.stringify({ encryptedKeys: wrappedKeysToSend }),
                }
              );

              if (response.ok) {
                console.log('[E2EE] Sent wrapped keys to server for chat:', chat.id);
              } else {
                console.error('[E2EE] Failed to send wrapped keys:', response.status);
              }
            } catch (err) {
              console.error('[E2EE] Error sending wrapped keys to server:', err);
            }
          }
        } catch (err) {
          console.error('[E2EE] Error processing chat:', chat.id, err);
        }
      }
    } catch (err) {
      console.error('[E2EE] Error in wrapKeysForNewlyAvailableUsers:', err);
    }
  },

  attemptChatKeyUnwrap: async (chatId, encryptedKey) => {
    // No-op: With per-message E2EE, no need to unwrap chat keys
    // Each message contains its own encrypted ephemeral key
  },

  fetchChats: async () => {
    const { serverUrl, authToken, e2eeKeyPair, chatKeys, attemptChatKeyUnwrap, currentUser, users } = get();
    if (!authToken) return;
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/chats`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (response.ok) {
        const chatsData = await response.json();
        const existingChats = get().chats;
        
        const newChatKeys = { ...chatKeys };
        
        const mappedChats = chatsData.map((c: any) => {
          // Try to unwrap encrypted chat keys if available
          if (c.encryptedKey && c.encryptedKey.trim() != '') {
            console.log('[E2EE] Found wrapped key for chat:', c.id, 'Currently have unwrapped key:', !!chatKeys[c.id] && typeof chatKeys[c.id] === 'object');
            // Always store the wrapped key so we can unwrap it, even if we already have one
            // This ensures we get fresh keys from the server
            newChatKeys[c.id] = c.encryptedKey;
          }
          
          // Preserve local unread count if higher (from WebSocket messages)
          const existingChat = existingChats.find(ec => ec.id === c.id);
          const serverUnread = (c.unreadCount as number) || 0;
          const localUnread = existingChat?.unreadCount || 0;
          
          const lastMsg = c.lastMessage as Record<string, unknown> | null;
          const existingLastMsg = existingChat?.lastMessage;
          
          // Use whichever lastMessage is newer
          let finalLastMessage = undefined;
          if (lastMsg) {
            const serverTimestamp = (lastMsg.created_at || lastMsg.timestamp || 0) as number;
            const localTimestamp = existingLastMsg?.timestamp || 0;
            
            if (localTimestamp > serverTimestamp && existingLastMsg) {
              finalLastMessage = existingLastMsg;
            } else {
              finalLastMessage = {
                ...lastMsg,
                chatId: lastMsg.chat_id || lastMsg.chatId,
                senderId: lastMsg.sender_id || lastMsg.senderId,
                timestamp: lastMsg.created_at || lastMsg.timestamp,
              };
            }
          } else if (existingLastMsg) {
            finalLastMessage = existingLastMsg;
          }
          
          return {
            id: c.id,
            type: c.type,
            name: c.name,
            description: c.description,
            participants: c.participants || [],
            admins: c.admins || [],
            channelAdmins: c.channelAdmins || [],
            isChannel: !!c.isChannel || !!c.is_channel,
            isChannelAdmin: !!c.isChannelAdmin,
            createdAt: c.created_at || c.createdAt || Date.now(),
            lastMessage: finalLastMessage,
            unreadCount: Math.max(serverUnread, localUnread),
          };
        });
        
        // Also include any local chats that aren't on the server yet
        const serverChatIds = new Set(mappedChats.map((c: Chat) => c.id));
        const localOnlyChats = existingChats.filter(c => !serverChatIds.has(c.id));
        
        set({ chats: [...mappedChats, ...localOnlyChats], chatKeys: newChatKeys });
        
        // Now unwrap the encrypted keys asynchronously
        for (const chatId of Object.keys(newChatKeys)) {
          const encryptedKey = newChatKeys[chatId];
          if (typeof encryptedKey === 'string' && encryptedKey.length > 0) {
            try {
              console.log('[E2EE] Unwrapping key for chat:', chatId, 'encrypted key length:', encryptedKey.length);
              const unwrappedKey = await e2ee.decryptChatKey(encryptedKey);
              // Save to localStorage
              const exported = await crypto.subtle.exportKey('raw', unwrappedKey);
                const keyStr = Array.from(new Uint8Array(exported)).map(b => String.fromCharCode(b)).join('');
                localStorage.setItem(`4messenger-chat-key-${chatId}`, btoa(keyStr));
                
                set(state => ({
                  chatKeys: { ...state.chatKeys, [chatId]: unwrappedKey }
                }));
                console.log('[E2EE] ✓ Successfully unwrapped key for chat:', chatId);
                
                // Mark the wrapped key as received on the server
                // Server will delete it only when ALL users have received it
                try {
                  const markResponse = await fetch(
                    `${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/keys`,
                    {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${authToken}`,
                      },
                    }
                  );
                  if (markResponse.ok) {
                    console.log('[E2EE] ✓ Marked wrapped key as received on server for chat:', chatId);
                  } else {
                    console.warn('[E2EE] Failed to mark wrapped key as received on server:', markResponse.status);
                  }
                } catch (delErr) {
                  console.error('[E2EE] Error marking wrapped key as received on server:', delErr);
                }
              } catch (err) {
                console.error('[E2EE] ❌ Failed to unwrap key for chat:', chatId);
                console.error('[E2EE] Encrypted key length:', encryptedKey.length);
                console.error('[E2EE] Error details:', err);
                // Keep the encrypted key in chatKeys so we can retry later
              }
            }
          }
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  },

  fetchMessages: async (chatId) => {
    const { serverUrl, authToken, chatKeys } = get();
    if (!authToken) return;
    
    try {
      const currentUser = get().currentUser;
      let chatKey = chatKeys[chatId] as CryptoKey | undefined;
      
      // If we have an encrypted key (string) but not a decrypted key, try to unwrap it
      if (!chatKey && typeof chatKeys[chatId] === 'string' && chatKeys[chatId].length > 0) {
        const encryptedKey = chatKeys[chatId] as unknown as string;
        try {
          console.log('[E2EE] Key is still encrypted, unwrapping on-demand for chat:', chatId);
          chatKey = await e2ee.decryptChatKey(encryptedKey);
          
          // Save the unwrapped key
          try {
            const exported = await crypto.subtle.exportKey('raw', chatKey);
            const keyStr = Array.from(new Uint8Array(exported)).map(b => String.fromCharCode(b)).join('');
            localStorage.setItem(`4messenger-chat-key-${chatId}`, btoa(keyStr));
          } catch (e) {
            console.warn('[E2EE] Failed to save unwrapped key to localStorage:', e);
          }
          
          set(state => ({
            chatKeys: { ...state.chatKeys, [chatId]: chatKey }
          }));
          console.log('[E2EE] ✓ Successfully unwrapped key on demand for chat:', chatId);
          
          // Mark the wrapped key as received on the server
          // Server will delete it only when ALL users have received it
          try {
            const markResponse = await fetch(
              `${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/keys`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                },
              }
            );
            if (markResponse.ok) {
              console.log('[E2EE] ✓ Marked wrapped key as received on server after on-demand unwrap for chat:', chatId);
            }
          } catch (delErr) {
            console.error('[E2EE] Error marking wrapped key as received on server:', delErr);
          }
        } catch (err) {
          console.error('[E2EE] Failed to unwrap key on demand:', err);
        }
      }
      
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/messages`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (response.ok) {
        const chatMessages = await response.json();
        
        // Decrypt messages sequentially to ensure order and avoid blocking
        const mappedMessages: Message[] = [];
        for (const m of chatMessages) {
          let content = m.content;
          const senderId = m.sender_id || m.senderId;
          
          if (content && typeof content === 'string') {
            // Check if it's the new E2EE format (e2ee: prefix with JSON data)
            if (content.startsWith('e2ee:')) {
              try {
                const jsonStr = content.substring(5); // Remove 'e2ee:' prefix
                const packet = JSON.parse(jsonStr);
                
                if (packet.iv && packet.ciphertext) {
                  // This is encrypted with chat key
                  if (senderId === currentUser?.id) {
                    // This is a message I sent - try to retrieve plaintext from cache
                    const cached = localStorage.getItem(`4messenger-sent-message-${m.id}`);
                    if (cached) {
                      content = cached;
                      console.log('[E2EE] Retrieved plaintext for own sent message from cache');
                    } else {
                      // Try to decrypt if we have the key
                      if (chatKey) {
                        try {
                          content = await e2ee.decryptMessageWithChatKey(packet.ciphertext, packet.iv, chatKey);
                          console.log('[E2EE] Successfully decrypted own message with chat key');
                        } catch (err) {
                          console.error('[E2EE] Failed to decrypt own message:', err);
                          content = '[Unable to decrypt message]';
                        }
                      } else {
                        console.warn('[E2EE] No chat key available for decryption');
                        content = '[Message encrypted - waiting for key]';
                      }
                    }
                  } else {
                    // This is from someone else - decrypt it with chat key
                    if (chatKey) {
                      try {
                        content = await e2ee.decryptMessageWithChatKey(packet.ciphertext, packet.iv, chatKey);
                        console.log('[E2EE] Message decrypted successfully with chat key');
                      } catch (err) {
                        console.error('[E2EE] Decryption failed:', err);
                        content = '[Unable to decrypt message]';
                      }
                    } else {
                      console.warn('[E2EE] No chat key available for decryption');
                      content = '[Message encrypted - waiting for key]';
                    }
                  }
                } else {
                  // Old per-message format, try to decrypt with old method
                  if (packet.encryptedMessage && packet.encryptedEphemeralKey) {
                    try {
                      content = await e2ee.decryptMessage(packet);
                      console.log('[E2EE] Decrypted with old per-message method');
                    } catch (err) {
                      console.error('[E2EE] Failed to decrypt old format:', err);
                      content = '[Unable to decrypt message]';
                    }
                  }
                }
              } catch (err) {
                console.error('[E2EE] Error parsing encrypted message:', err);
                content = '[Unable to decrypt message]';
              }
            }
          }
          
          mappedMessages.push({
            id: m.id,
            chatId: m.chat_id || m.chatId || chatId,
            senderId: senderId,
            content: content,
            type: m.type || 'text',
            fileName: m.file_name || m.fileName,
            fileSize: m.file_size || m.fileSize,
            fileUrl: m.file_url || m.fileUrl,
            poll: m.poll || null,
            encrypted: !!m.encrypted,
            edited: !!m.edited,
            timestamp: m.created_at || m.timestamp || Date.now(),
            readBy: m.readBy || [],
          });
        }
        
        // Merge with existing messages instead of replacing
        // This preserves any messages that arrived via WebSocket during the fetch
        set(state => {
          const existingIds = new Set(mappedMessages.map(m => m.id));
          const recentMessages = state.messages.filter(m => m.chatId === chatId && !existingIds.has(m.id));
          
          // For messages sent by current user, prefer the local plaintext version
          const finalMessages = mappedMessages.map(m => {
            if (m.senderId === currentUser?.id) {
              // This is a message I sent - check if we have a local version with plaintext
              
              // First try to find by exact ID match
              let localVersion = state.messages.find(lm => lm.id === m.id && lm.chatId === chatId);
              
              // If not found by ID, try to find any unencrypted message from current user in this chat
              // that looks like it might be the same message (checking if encrypted content is a potential match)
              if (!localVersion) {
                const userMessagesInChat = state.messages.filter(
                  lm => lm.chatId === chatId && lm.senderId === currentUser?.id
                );
                // Find plaintext messages (not encrypted packets)
                localVersion = userMessagesInChat.find(lm => 
                  lm.content && !lm.content.includes('{"encryptedMessage"')
                );
              }
              
              if (localVersion && localVersion.content && !localVersion.content.includes('{"encryptedMessage"')) {
                // Local version has plaintext content, use it - update ID if needed
                return { ...localVersion, id: m.id, timestamp: m.timestamp };
              }
              // Otherwise show as sent message
              return { ...m, content: m.content };
            }
            return m;
          });
          
          const mergedMessages = [...finalMessages, ...recentMessages].sort((a, b) => a.timestamp - b.timestamp);
          
          return {
            allMessages: {
              ...state.allMessages,
              [chatId]: mergedMessages,
            },
            messages: state.activeChat === chatId ? mergedMessages : state.messages,
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  },

  setActiveChat: (chatId) => {
    if (chatId) {
      // Load cached messages immediately for instant display
      const cached = get().allMessages[chatId] || [];
      set({ activeChat: chatId, showChatInfo: false, messages: cached });
      // Then fetch latest from server in background
      get().fetchMessages(chatId);
      get().markAsRead(chatId);
    } else {
      set({ activeChat: chatId, showChatInfo: false, messages: [] });
    }
  },

  // No longer needed with per-message E2EE
  // Each message contains its own encrypted ephemeral key, so no need to manage chat keys
  ensureChatKey: async (chatId: string): Promise<CryptoKey | null> => {
    const { chatKeys } = get();
    
    // Check if we already have a loaded key in state
    const stateKey = chatKeys[chatId];
    if (stateKey && typeof stateKey === 'object' && 'type' in stateKey) {
      // Already have a CryptoKey loaded
      return stateKey as CryptoKey;
    }

    // Delegate to e2ee to get/create the key
    // This checks memory, loads from localStorage, or generates new
    const key = await e2ee.ensureChatKey(chatId);
    
    // Update state with the key from e2ee
    set(state => ({
      chatKeys: { ...state.chatKeys, [chatId]: key }
    }));
    
    return key;
  },

  sendPollMessage: async (chatId, poll) => {
  const { currentUser, serverUrl, authToken } = get();
  if (!currentUser || !authToken) return;

  // Create local message for immediate display
  const localMessage: Message = {
    id: generateId(),
    chatId,
    senderId: currentUser.id,
    content: JSON.stringify(poll),
    type: 'poll',
    poll: poll,
    encrypted: false,
    timestamp: Date.now(),
    edited: false,
    readBy: [currentUser.id],
  };

  // Optimistically add to store
  set(state => {
    const chatMessages = state.allMessages[chatId] || [];
    return {
      messages: [...state.messages, localMessage],
      allMessages: {
        ...state.allMessages,
        [chatId]: [...chatMessages, localMessage],
      },
      chats: state.chats.map(c =>
        c.id === chatId ? { ...c, lastMessage: localMessage, unreadCount: 0 } : c
      ),
    };
  });

  // Send to server
  try {
    const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        content: JSON.stringify(poll),
        type: 'poll',
        poll: poll,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      get().addNotification(errorData.error || 'Failed to send poll', 'error');
      // Remove optimistic message on error
      set(state => ({
        messages: state.messages.filter(m => m.id !== localMessage.id),
        allMessages: {
          ...state.allMessages,
          [chatId]: (state.allMessages[chatId] || []).filter(m => m.id !== localMessage.id),
        },
      }));
    } else {
      const serverMessage = await response.json();
      // Update local message with server ID
      if (serverMessage.id && serverMessage.id !== localMessage.id) {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === localMessage.id ? { ...m, id: serverMessage.id } : m
          ),
          allMessages: {
            ...state.allMessages,
            [chatId]: (state.allMessages[chatId] || []).map(m =>
              m.id === localMessage.id ? { ...m, id: serverMessage.id } : m
            ),
          },
        }));
      }
      get().addNotification('Poll sent!', 'success');
    }
  } catch (error) {
    console.error('Failed to send poll:', error);
    get().addNotification('Failed to send poll', 'error');
    // Remove optimistic message on error
    set(state => ({
      messages: state.messages.filter(m => m.id !== localMessage.id),
      allMessages: {
        ...state.allMessages,
        [chatId]: (state.allMessages[chatId] || []).filter(m => m.id !== localMessage.id),
      },
    }));
  }
},

  sendMessage: async (chatId, content, type = 'text', fileName, fileSize, fileUrl?: string) => {
    const { currentUser, serverUrl, authToken, users, chats, chatKeys, e2eeKeyPair } = get();
    if (!currentUser || !authToken) return;

    // Create local message for immediate display (unencrypted for UI)
    const localMessage: Message = {
      id: generateId(),
      chatId,
      senderId: currentUser.id,
      content: content, // Keep unencrypted for local display
      type,
      fileName,
      fileSize,
      fileUrl: fileUrl || (type !== 'text' ? content : undefined),
      encrypted: false,
      timestamp: Date.now(),
      edited: false,
      readBy: [currentUser.id],
    };

    // Optimistically add message to both stores
    set(state => {
      const chatMessages = state.allMessages[chatId] || [];
      return {
        messages: [...state.messages, localMessage],
        allMessages: {
          ...state.allMessages,
          [chatId]: [...chatMessages, localMessage],
        },
        chats: state.chats.map(c =>
          c.id === chatId ? { ...c, lastMessage: localMessage, unreadCount: 0 } : c
        ),
      };
    });

    // Store plaintext for own messages so we can retrieve it later
    try {
      localStorage.setItem(`4messenger-sent-message-${localMessage.id}`, content);
    } catch (e) {
      console.warn('Failed to cache sent message plaintext:', e);
    }

    let payloadContent = content;
    
    // Determine if we should E2EE this message (for direct chats with non-bots)
    const chat = chats.find(c => c.id === chatId);
    if (chat && type === 'text' && !currentUser?.isBot) {
      const hasBot = chat.participants.some(uid => {
        const u = users.find(user => user.id === uid);
        return u?.isBot;
      });
      
      // For E2EE: encrypt message for direct chats with chat key
      if (!hasBot && chat.participants.length === 2) {
        try {
          console.log('[E2EE] Encrypting message for chat:', chatId);
          
          // Ensure we have a chat key
          const chatKey = await get().ensureChatKey(chatId);
          if (chatKey) {
            // Encrypt the message with the chat key
            const encrypted = await e2ee.encryptMessageWithChatKey(content, chatKey);
            payloadContent = `e2ee:${JSON.stringify(encrypted)}`;
            console.log('[E2EE] Message encrypted successfully with chat key');
            
            // CRITICAL: Send wrapped keys to server immediately so recipient can decrypt
            try {
              const wrappedKeysToSend: Record<string, string> = {};
              
              console.log('[E2EE] Chat participants:', chat.participants, 'Current user:', currentUser.id);
              
              // Wrap key for each participant except self
              for (const participantId of chat.participants) {
                if (participantId === currentUser.id) continue;
                
                let participant = users.find(u => u.id === participantId);
                
                // If participant not found or no public key, try to fetch from server
                if (!participant?.publicKey) {
                  console.log('[E2EE] Participant:', participantId, 'not fully loaded, fetching from server...');
                  try {
                    const userResponse = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/${participantId}`, {
                      headers: {
                        'Authorization': `Bearer ${authToken}`,
                      },
                    });
                    if (userResponse.ok) {
                      const userData = await userResponse.json();
                      participant = {
                        id: userData.id || participantId,
                        publicKey: userData.public_key || userData.publicKey,
                        ...userData
                      };
                      console.log('[E2EE] ✓ Fetched participant from server, has public key:', !!participant?.publicKey);
                    }
                  } catch (err) {
                    console.error('[E2EE] Failed to fetch participant from server:', err);
                  }
                }
                
                console.log('[E2EE] Participant:', participantId, 'User found:', !!participant, 'Has public key:', !!participant?.publicKey);
                
                if (!participant?.publicKey) {
                  console.warn('[E2EE] No public key for participant:', participantId);
                  continue;
                }
                
                try {
                  console.log('[E2EE] Wrapping chat key for participant:', participantId, 'Key type:', chatKey.type, 'Public key length:', participant.publicKey.length);
                  const wrappedKey = await e2ee.encryptChatKeyForUser(chatKey, participant.publicKey);
                  wrappedKeysToSend[participantId] = wrappedKey;
                  console.log('[E2EE] ✓ Wrapped chat key successfully for participant:', participantId, 'Wrapped key length:', wrappedKey.length);
                } catch (err) {
                  console.error('[E2EE] Failed to wrap key for participant:', participantId, 'Error:', err);
                }
              }
              
              // Send wrapped keys to server
              if (Object.keys(wrappedKeysToSend).length > 0) {
                try {
                  console.log('[E2EE] Sending wrapped keys to server:', Object.keys(wrappedKeysToSend));
                  const keyResponse = await fetch(
                    `${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/keys`,
                    {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                      },
                      body: JSON.stringify({ encryptedKeys: wrappedKeysToSend }),
                    }
                  );
                  
                  if (keyResponse.ok) {
                    console.log('[E2EE] ✓ Sent wrapped keys to server for chat:', chatId);
                  } else {
                    const errData = await keyResponse.text();
                    console.error('[E2EE] Failed to send wrapped keys to server:', keyResponse.status, errData);
                  }
                } catch (err) {
                  console.error('[E2EE] Error sending wrapped keys to server:', err);
                }
              } else {
                console.warn('[E2EE] No wrapped keys to send - no participants with public keys');
              }
            } catch (err) {
              console.error('[E2EE] Error in key wrapping process:', err);
            }
          } else {
            console.warn('[E2EE] No chat key available, sending unencrypted');
          }
        } catch (err) {
          console.error('[E2EE] E2EE encryption failed:', err);
          // Fall back to unencrypted - but still send with e2ee: prefix if we generated a key
        }
      }
    }

    // Send to server
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content: payloadContent, type, fileName, fileSize, fileUrl }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        get().addNotification(errorData.error || 'Failed to send message', 'error');
        set(state => ({
          messages: state.messages.filter(m => m.id !== localMessage.id),
          allMessages: {
            ...state.allMessages,
            [chatId]: (state.allMessages[chatId] || []).filter(m => m.id !== localMessage.id),
          },
        }));
      } else {
        // Server successfully created the message - update local message with server ID
        const serverMessage = await response.json();
        const serverId = serverMessage.id || serverMessage._id;
        
        if (serverId && serverId !== localMessage.id) {
          // Move the cached plaintext from local ID to server ID
          try {
            const plaintext = localStorage.getItem(`4messenger-sent-message-${localMessage.id}`);
            if (plaintext) {
              localStorage.setItem(`4messenger-sent-message-${serverId}`, plaintext);
              localStorage.removeItem(`4messenger-sent-message-${localMessage.id}`);
            }
          } catch (e) {
            console.warn('Failed to migrate sent message cache:', e);
          }
          
          // Replace client-generated ID with server ID to avoid duplicates
          set(state => ({
            messages: state.messages.map(m => 
              m.id === localMessage.id ? { ...m, id: serverId } : m
            ),
            allMessages: {
              ...state.allMessages,
              [chatId]: (state.allMessages[chatId] || []).map(m => 
                m.id === localMessage.id ? { ...m, id: serverId } : m
              ),
            },
          }));
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      get().addNotification('Failed to send message', 'error');
      set(state => ({
        messages: state.messages.filter(m => m.id !== localMessage.id),
        allMessages: {
          ...state.allMessages,
          [chatId]: (state.allMessages[chatId] || []).filter(m => m.id !== localMessage.id),
        },
      }));
    }
  },

  editMessage: async (messageId, newContent) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    set(state => ({
      messages: state.messages.map(m =>
        m.id === messageId ? { ...m, content: newContent, edited: true } : m
      ),
      allMessages: Object.fromEntries(
        Object.entries(state.allMessages).map(([cid, msgs]) => [
          cid,
          msgs.map(m => m.id === messageId ? { ...m, content: newContent, edited: true } : m)
        ])
      ),
    }));

    try {
      await fetch(`${serverUrl.replace(/\/$/, '')}/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content: newContent }),
      });
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  },

  deleteMessage: async (messageId) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    set(state => ({
      messages: state.messages.filter(m => m.id !== messageId),
      allMessages: Object.fromEntries(
        Object.entries(state.allMessages).map(([cid, msgs]) => [
          cid,
          msgs.filter(m => m.id !== messageId)
        ])
      ),
    }));

    try {
      await fetch(`${serverUrl.replace(/\/$/, '')}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
        },
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  },

  createDirectChat: async (userId) => {
    const { currentUser, chats, serverUrl, authToken, users, e2eeKeyPair } = get();
    if (!currentUser || !authToken) return '';

    // Check if chat already exists locally
    const existing = chats.find(c =>
      c.type === 'direct' &&
      c.participants.includes(currentUser.id) &&
      c.participants.includes(userId)
    );
    if (existing) {
      set({ activeChat: existing.id, showNewChat: false });
      return existing.id;
    }

    try {
      // Ensure we have the target user's info (including public key)
      let targetUser = users.find(u => u.id === userId);
      if (!targetUser || !targetUser.publicKey) {
        console.log('[E2EE] Target user not fully loaded, fetching...');
        try {
          const userResponse = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/${userId}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            targetUser = userData;
            // Update users array
            set(state => ({
              users: state.users.some(u => u.id === userId)
                ? state.users.map(u => u.id === userId ? { ...u, publicKey: userData.public_key || userData.publicKey, ...userData } : u)
                : [...state.users, { id: userId, publicKey: userData.public_key || userData.publicKey, ...userData }]
            }));
            console.log('[E2EE] ✓ Fetched target user, has public key:', !!targetUser.publicKey);
          }
        } catch (err) {
          console.error('[E2EE] Failed to fetch target user:', err);
        }
      }
      
      const isBot = targetUser?.isBot;
      
      // With chat-based E2EE, we don't pre-generate chat keys
      // First message will trigger key generation

      // Create chat on server
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/direct`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        get().addNotification(data.error || 'Failed to create chat', 'error');
        return '';
      }
      
      const data = await response.json();
      const chatId = data.chatId;

      const newChat: Chat = {
        id: chatId,
        type: 'direct',
        participants: [currentUser.id, userId],
        createdAt: Date.now(),
        unreadCount: 0,
      };
      
      set(state => ({
        chats: [newChat, ...state.chats],
        activeChat: chatId,
        showNewChat: false,
      }));

      return chatId;
    } catch (error) {
      console.error('Failed to create chat:', error);
      get().addNotification('Failed to create chat', 'error');
      return '';
    }
  },

  createGroup: async (name, participants, description, isChannel = false) => {
    const { currentUser, serverUrl, authToken, users } = get();
    if (!currentUser || !authToken) return;

    try {
      // With per-message E2EE, we don't pre-generate chat keys
      // Each message will use its own ephemeral key

      // Create group/channel on server
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/group`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name, participants, description, isChannel }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        get().addNotification(data.error || 'Failed to create group', 'error');
        return;
      }
      
      const data = await response.json();
      const chatId = data.chatId;

      const systemMsg: Message = {
        id: generateId(),
        chatId,
        senderId: 'system',
        content: isChannel 
          ? `${currentUser.username} created the channel "${name}"`
          : `${currentUser.username} created the group "${name}"`,
        type: 'system',
        encrypted: false,
        timestamp: Date.now(),
        edited: false,
        readBy: [],
      };

      const newChat: Chat = {
        id: chatId,
        type: isChannel ? 'channel' : 'group',
        name,
        participants: [currentUser.id, ...participants],
        admins: [currentUser.id],
        channelAdmins: isChannel ? [currentUser.id] : [],
        isChannel,
        isChannelAdmin: isChannel,
        createdAt: Date.now(),
        description,
        lastMessage: systemMsg,
        unreadCount: 0,
      };
      
      set(state => ({
        chats: [newChat, ...state.chats],
        messages: [...state.messages, systemMsg],
        activeChat: chatId,
        showNewGroup: false,
      }));

      get().addNotification(`${isChannel ? 'Channel' : 'Group'} "${name}" created!`, 'success');
    } catch (error) {
      console.error('Failed to create group:', error);
      get().addNotification('Failed to create group', 'error');
    }
  },

  makeChannelAdmin: async (chatId, userId) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/admins`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        set(state => ({
          chats: state.chats.map(c => 
            c.id === chatId 
              ? { ...c, channelAdmins: [...(c.channelAdmins || []), userId] }
              : c
          ),
        }));
        get().addNotification('User is now a channel admin', 'success');
      } else {
        const data = await response.json();
        get().addNotification(data.error || 'Failed to add admin', 'error');
      }
    } catch (error) {
      get().addNotification('Failed to add admin', 'error');
    }
  },

  removeChannelAdmin: async (chatId, userId) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/admins/${userId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (response.ok) {
        set(state => ({
          chats: state.chats.map(c => 
            c.id === chatId 
              ? { ...c, channelAdmins: (c.channelAdmins || []).filter(a => a !== userId) }
              : c
          ),
        }));
        get().addNotification('Admin removed', 'success');
      } else {
        const data = await response.json();
        get().addNotification(data.error || 'Failed to remove admin', 'error');
      }
    } catch (error) {
      get().addNotification('Failed to remove admin', 'error');
    }
  },

  updateChatSettings: async (chatId, settings) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        set(state => ({
          chats: state.chats.map(c => 
            c.id === chatId 
              ? { 
                  ...c, 
                  name: settings.name !== undefined ? settings.name : c.name,
                  avatar: settings.avatar !== undefined ? settings.avatar : c.avatar,
                  description: settings.description !== undefined ? settings.description : c.description,
                }
              : c
          ),
        }));
        get().addNotification('Settings updated', 'success');
      } else {
        const data = await response.json();
        get().addNotification(data.error || 'Failed to update settings', 'error');
      }
    } catch (error) {
      get().addNotification('Failed to update settings', 'error');
    }
  },

  searchUsers: async (query) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return [];
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users?search=${encodeURIComponent(query)}`, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (response.ok) {
        const usersData = await response.json();
        const mappedUsers: User[] = usersData.map((u: Record<string, unknown>) => ({
          id: u.id as string,
          username: u.username as string,
          email: u.email as string,
          role: (u.role || 'user') as User['role'],
          avatar: u.avatar as string | undefined,
          displayName: (u.display_name || u.displayName) as string | undefined,
          online: !!u.online,
          lastSeen: (u.last_seen || u.lastSeen) as number | undefined,
          emailVerified: !!u.email_verified || !!u.emailVerified,
          createdAt: (u.created_at || u.createdAt) as number,
        }));
        set({ users: mappedUsers });
        return mappedUsers;
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    }
    return [];
  },

  leaveGroup: (chatId) => {
    const { currentUser, serverUrl, authToken } = get();
    if (!currentUser || !authToken) return;
    
    set(state => ({
      chats: state.chats.map(c =>
        c.id === chatId ? { ...c, participants: c.participants.filter(p => p !== currentUser.id) } : c
      ),
      activeChat: state.activeChat === chatId ? null : state.activeChat,
    }));

    fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/leave`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
    }).catch(console.error);

    get().addNotification('Left the group', 'info');
  },

  addToGroup: async (chatId, userId) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    set(state => ({
      chats: state.chats.map(c =>
        c.id === chatId ? { ...c, participants: [...c.participants, userId] } : c
      ),
    }));

    // With per-message E2EE, each message contains its own encrypted ephemeral key
    // No need to wrap and send a shared key to new members

    fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/members`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ userId }),
    }).catch(console.error);
  },

  removeFromGroup: (chatId, userId) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    set(state => ({
      chats: state.chats.map(c =>
        c.id === chatId ? {
          ...c,
          participants: c.participants.filter(p => p !== userId),
          admins: c.admins?.filter(a => a !== userId),
        } : c
      ),
    }));

    fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/members/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` },
    }).catch(console.error);
  },

  updateUserRole: async (userId, role) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role }),
      });
      
      if (response.ok) {
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, role } : u),
        }));
        get().addNotification(`User role updated to ${role}`, 'success');
      } else {
        const data = await response.json();
        get().addNotification(data.error || 'Failed to update role', 'error');
      }
    } catch (error) {
      get().addNotification('Failed to update role', 'error');
    }
  },

  banUser: async (userId) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      if (response.ok) {
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, role: 'banned' as UserRole, online: false } : u),
        }));
        get().addNotification('User banned', 'success');
      } else {
        const data = await response.json();
        get().addNotification(data.error || 'Failed to ban user', 'error');
      }
    } catch (error) {
      get().addNotification('Failed to ban user', 'error');
    }
  },

  unbanUser: async (userId) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/${userId}/unban`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      if (response.ok) {
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, role: 'user' as UserRole } : u),
        }));
        get().addNotification('User unbanned', 'success');
      } else {
        const data = await response.json();
        get().addNotification(data.error || 'Failed to unban user', 'error');
      }
    } catch (error) {
      get().addNotification('Failed to unban user', 'error');
    }
  },

  deleteUser: async (userId) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      if (response.ok) {
        set(state => ({
          users: state.users.filter(u => u.id !== userId),
          chats: state.chats.filter(c => !(c.type === 'direct' && c.participants.includes(userId))),
        }));
        get().addNotification('User deleted', 'success');
      } else {
        const data = await response.json();
        get().addNotification(data.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      get().addNotification('Failed to delete user', 'error');
    }
  },

  updateServerConfig: async (config) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/admin/config`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        set(state => ({
          serverConfig: { ...state.serverConfig, ...config },
        }));
        get().addNotification('Server configuration updated', 'success');
      } else {
        const data = await response.json();
        get().addNotification(data.error || 'Failed to update config', 'error');
      }
    } catch (error) {
      get().addNotification('Failed to update config', 'error');
    }
  },

  startCall: (chatId, type) => {
    const { currentUser, chats, users } = get();
    if (!currentUser) return;
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const participantNames = chat.participants
      .filter(p => p !== currentUser.id)
      .map(p => users.find(u => u.id === p)?.username || 'Unknown');

    get().beginCall(chatId, type, chat.participants);
    get().addNotification(`${type === 'video' ? 'Video' : 'Voice'} call with ${participantNames.join(', ')}`, 'info');
  },

  endCall: () => {
    set({
      callState: { active: false, chatId: null, type: 'voice', participants: [], startTime: null },
    });
    get().addNotification('Call ended', 'info');
  },

  toggleSidebar: () => set(state => ({ showSidebar: !state.showSidebar })),
  setShowUserProfile: (show) => set({ showUserProfile: show }),
  setShowChatInfo: (show) => set({ showChatInfo: show }),
  setShowNewChat: (show) => set({ showNewChat: show }),
  setShowNewGroup: (show) => set({ showNewGroup: show }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addNotification: (text, type) => {
    const id = generateId();
    set(state => ({
      notifications: [...state.notifications, { id, text, type }],
    }));
    setTimeout(() => {
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id),
      }));
    }, 4000);
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  markAsRead: (chatId) => {
    const { currentUser, serverUrl, authToken } = get();
    if (!currentUser || !authToken) return;
    
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c),
      messages: state.messages.map(m =>
        m.chatId === chatId && !m.readBy.includes(currentUser.id)
          ? { ...m, readBy: [...m.readBy, currentUser.id] }
          : m
      ),
    }));

    fetch(`${serverUrl.replace(/\/$/, '')}/api/chats/${chatId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
    }).catch(console.error);
  },

  encryptMessage: (text) => text, // Server handles encryption
  decryptMessage: (text) => text, // Server handles decryption

  /**
   * Get decrypted message preview for display in chat list and notifications
   * Returns decrypted text if possible, otherwise shows encrypted indicator
   */
  getMessagePreview: async (message: Message): Promise<string> => {
    try {
      const { chatKeys } = get();
      const { content, type } = message;
      
      // Non-text messages show type indicator
      if (type !== 'text') {
        return `Sent a ${type}`;
      }

      // Check if content is encrypted
      if (!content || !content.startsWith('e2ee:')) {
        return content || '(empty message)';
      }

      // Try to decrypt if we have the chat key
      // Extract iv and ciphertext from encrypted format
      try {
        const encryptedStr = content.substring(5); // Remove 'e2ee:' prefix
        const encrypted = JSON.parse(encryptedStr);
        
        if (encrypted.iv && encrypted.ciphertext && message.chatId) {
          const chatKey = chatKeys[message.chatId] as CryptoKey | undefined;
          
          if (chatKey && typeof chatKey === 'object' && chatKey.type === 'secret') {
            // We have the chat key, decrypt it
            const decrypted = await e2ee.decryptMessageWithChatKey(
              encrypted.ciphertext,
              encrypted.iv,
              chatKey
            );
            return decrypted.substring(0, 100);
          } else {
            // Chat key not available yet, show encrypted message
            return '[Encrypted message]';
          }
        }
      } catch (e) {
        console.warn('[E2EE] Failed to decrypt preview:', e);
        return '[Encrypted message]';
      }

      return content.substring(0, 100);
    } catch (e) {
      console.error('[E2EE] Error in getMessagePreview:', e);
      return '(message preview unavailable)';
    }
  },

  setAppearance: (settings) => {
    set(state => {
      const newAppearance = { ...state.appearance, ...settings };
      saveAppearance(newAppearance);
      return { appearance: newAppearance };
    });
  },

  resetAppearance: () => {
    saveAppearance(defaultAppearance);
    set({ appearance: defaultAppearance });
  },

  loadTheme: async (file: File) => {
    set({ themeLoading: true, themeError: null });
    try {
      const theme = await loadThemeFile(file);
      applyTheme(theme);
      
      // Extract and register theme icons
      const themeIcons: { [key: string]: string } = {};
      for (const [key, value] of Object.entries(theme.assets)) {
        if (typeof value === 'string' && value.startsWith('data:image/svg')) {
          themeIcons[key] = value;
        }
      }
      if (Object.keys(themeIcons).length > 0) {
        registerThemeIcons(themeIcons);
      }
      
      saveTheme(theme);
      set({ customTheme: theme, themeLoading: false });
      get().addNotification(`Theme "${theme.name}" loaded successfully`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load theme';
      set({ themeLoading: false, themeError: errorMessage });
      get().addNotification(`Failed to load theme: ${errorMessage}`, 'error');
    }
  },

  applyLoadedTheme: (theme: LoadedTheme) => {
    try {
      applyTheme(theme);
      
      // Extract and register theme icons
      const themeIcons: { [key: string]: string } = {};
      for (const [key, value] of Object.entries(theme.assets)) {
        if (typeof value === 'string' && value.startsWith('data:image/svg')) {
          themeIcons[key] = value;
        }
      }
      if (Object.keys(themeIcons).length > 0) {
        registerThemeIcons(themeIcons);
      }
      
      saveTheme(theme);
      set({ customTheme: theme });
      get().addNotification(`Theme "${theme.name}" applied`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply theme';
      set({ themeError: errorMessage });
      get().addNotification(`Failed to apply theme: ${errorMessage}`, 'error');
    }
  },

  unloadTheme: () => {
    clearTheme();
    clearThemeIcons();
    removeSavedTheme();
    set({ customTheme: null, themeError: null });
    get().addNotification('Theme removed', 'info');
  },

  restoreThemeOnStartup: () => {
    const savedTheme = loadSavedTheme();
    if (savedTheme) {
      try {
        applyTheme(savedTheme);
        
        // Extract and register theme icons
        const themeIcons: { [key: string]: string } = {};
        for (const [key, value] of Object.entries(savedTheme.assets)) {
          if (typeof value === 'string' && value.startsWith('data:image/svg')) {
            themeIcons[key] = value;
          }
        }
        if (Object.keys(themeIcons).length > 0) {
          registerThemeIcons(themeIcons);
        }
        
        set({ customTheme: savedTheme });
      } catch (error) {
        console.error('Failed to restore theme on startup:', error);
        removeSavedTheme();
        set({ customTheme: null });
      }
    }
  },

  // Notification preferences
  muteChat: (chatId, minutesToMute) => {
    set(state => {
      const newPrefs = { ...state.notificationPreferences };
      const mutedUntil = minutesToMute === 0 ? -1 : Date.now() + minutesToMute * 60 * 1000;
      newPrefs.chatPreferences = {
        ...newPrefs.chatPreferences,
        [chatId]: {
          ...(newPrefs.chatPreferences[chatId] || {}),
          chatId,
          mutedUntil,
        },
      };
      saveNotificationPreferences(newPrefs);
      return { notificationPreferences: newPrefs };
    });
  },

  unmuteChat: (chatId) => {
    set(state => {
      const newPrefs = { ...state.notificationPreferences };
      if (newPrefs.chatPreferences[chatId]) {
        newPrefs.chatPreferences[chatId].mutedUntil = 0;
      }
      saveNotificationPreferences(newPrefs);
      return { notificationPreferences: newPrefs };
    });
  },

  isChatMuted: (chatId) => {
    const state = get();
    if (state.notificationPreferences.serverMuted) return true;
    const pref = state.notificationPreferences.chatPreferences[chatId];
    if (!pref || pref.mutedUntil === 0) return false;
    if (pref.mutedUntil === -1) return true;
    return pref.mutedUntil > Date.now();
  },

  toggleChatNotificationSound: (chatId) => {
    set(state => {
      const newPrefs = { ...state.notificationPreferences };
      const existing = newPrefs.chatPreferences[chatId] || { chatId, mutedUntil: 0 };
      existing.soundEnabled = existing.soundEnabled === undefined ? false : !existing.soundEnabled;
      newPrefs.chatPreferences[chatId] = existing;
      saveNotificationPreferences(newPrefs);
      return { notificationPreferences: newPrefs };
    });
  },

  toggleChatDesktopNotification: (chatId) => {
    set(state => {
      const newPrefs = { ...state.notificationPreferences };
      const existing = newPrefs.chatPreferences[chatId] || { chatId, mutedUntil: 0 };
      existing.desktopEnabled = existing.desktopEnabled === undefined ? false : !existing.desktopEnabled;
      newPrefs.chatPreferences[chatId] = existing;
      saveNotificationPreferences(newPrefs);
      return { notificationPreferences: newPrefs };
    });
  },

  toggleServerMute: () => {
    set(state => {
      const newPrefs = { ...state.notificationPreferences };
      newPrefs.serverMuted = !newPrefs.serverMuted;
      saveNotificationPreferences(newPrefs);
      return { notificationPreferences: newPrefs };
    });
  },

  isInDND: () => {
    const state = get();
    if (!state.notificationPreferences.dndEnabled) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const { dndStart, dndEnd } = state.notificationPreferences;
    
    // Handle case where DND spans midnight
    if (dndStart < dndEnd) {
      return currentMinutes >= dndStart && currentMinutes < dndEnd;
    } else {
      return currentMinutes >= dndStart || currentMinutes < dndEnd;
    }
  },

  setDND: (enabled, startHour, endHour) => {
    set(state => {
      const newPrefs = { ...state.notificationPreferences };
      newPrefs.dndEnabled = enabled;
      newPrefs.dndStart = startHour * 60;
      newPrefs.dndEnd = endHour * 60;
      saveNotificationPreferences(newPrefs);
      return { notificationPreferences: newPrefs };
    });
  },

  // Muted Users Management
  fetchMutedUsers: async () => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/muted-users`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (response.ok) {
        const users = await response.json();
        set({ mutedUsers: users });
      }
    } catch (error) {
      console.error('[Store] Failed to fetch muted users:', error);
    }
  },

  muteUser: async (userId: string) => {
    const { serverUrl, authToken, mutedUsers } = get();
    if (!authToken) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/muted-users/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (response.ok) {
        // Fetch updated list
        await get().fetchMutedUsers();
        get().addNotification('User muted - you won\'t receive notifications from them', 'success');
      }
    } catch (error) {
      console.error('[Store] Failed to mute user:', error);
      get().addNotification('Failed to mute user', 'error');
    }
  },

  unmuteUser: async (userId: string) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/muted-users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (response.ok) {
        // Fetch updated list
        await get().fetchMutedUsers();
        get().addNotification('User unmuted', 'success');
      }
    } catch (error) {
      console.error('[Store] Failed to unmute user:', error);
      get().addNotification('Failed to unmute user', 'error');
    }
  },

  isMuted: (userId: string) => {
    const { mutedUsers } = get();
    return mutedUsers.some(u => u.id === userId);
  },

  // Blocked Users Management
  fetchBlockedUsers: async () => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/blocked-users`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (response.ok) {
        const users = await response.json();
        set({ blockedUsers: users });
      }
    } catch (error) {
      console.error('[Store] Failed to fetch blocked users:', error);
    }
  },

  blockUser: async (userId: string) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/blocked-users/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (response.ok) {
        await get().fetchBlockedUsers();
        get().addNotification('User blocked', 'success');
      }
    } catch (error) {
      console.error('[Store] Failed to block user:', error);
      get().addNotification('Failed to block user', 'error');
    }
  },

  unblockUser: async (userId: string) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/blocked-users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (response.ok) {
        await get().fetchBlockedUsers();
        get().addNotification('User unblocked', 'success');
      }
    } catch (error) {
      console.error('[Store] Failed to unblock user:', error);
      get().addNotification('Failed to unblock user', 'error');
    }
  },

  isBlocked: (userId: string) => {
    const { blockedUsers } = get();
    return blockedUsers.some(u => u.id === userId);
  },

  // Push Notifications
  fetchPushSubscriptions: async () => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/push/subscriptions`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (response.ok) {
        const subs = await response.json();
        set({ pushSubscriptions: subs });
        console.log('[Push] Loaded', subs.length, 'existing subscription(s)');
      }
    } catch (error) {
      console.error('[Store] Failed to fetch push subscriptions:', error);
    }
  },
  
  // Bots implementation
  fetchBots: async () => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/me/bots`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (response.ok) {
        const rawBots = await response.json();
        const mappedBots = rawBots.map((b: any) => ({
          id: b.id,
          name: b.displayName || b.username,
          username: b.username,
          code: b.botScript || b.script || '',
          isActive: true, // Auto-active in the new system
          createdAt: b.createdAt || Date.now()
        }));
        set({ bots: mappedBots });
      }
    } catch (e) {
      console.error('Failed to fetch bots:', e);
    }
  },
  
  createBot: async (username, displayName, script) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/me/bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ username, displayName, script })
      });
      if (response.ok) {
        get().fetchBots();
        get().addNotification('Bot created successfully', 'success');
      } else {
        const data = await response.json();
        get().addNotification(data.error || 'Failed to create bot', 'error');
      }
    } catch (e) {
      get().addNotification('Failed to create bot', 'error');
    }
  },
  
  updateBot: async (id, displayName, script) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/me/bots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ displayName, script })
      });
      if (response.ok) {
        get().fetchBots();
        get().addNotification('Bot updated successfully', 'success');
      }
    } catch (e) {}
  },
  
  deleteBot: async (id) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/me/bots/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (response.ok) {
        get().fetchBots();
        get().addNotification('Bot deleted', 'success');
      }
    } catch (e) {}
  },
  
  toggleBot: async (id, chatId) => {
    const { serverUrl, authToken } = get();
    if (!authToken) return false;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/bots/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ chatId })
      });
      if (response.ok) {
        const data = await response.json();
        get().fetchBots();
        return data.isActive;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  // Server Shortcuts
  serverShortcuts: loadShortcuts(),

  addServerShortcut: (name, url) => {
    const newShortcut: ServerShortcut = {
      id: generateId(),
      name,
      url,
      createdAt: Date.now(),
    };
    set(state => {
      const updated = [...state.serverShortcuts, newShortcut];
      saveShortcuts(updated.filter(s => s.id !== 'official-4messenger' && s.id !== 'official-4messenger-russia')); // Don't save official shortcuts to localStorage
      return { serverShortcuts: updated };
    });
  },

  removeServerShortcut: (id) => {
    // Prevent removing the official shortcuts
    if (id === 'official-4messenger' || id === 'official-4messenger-russia') {
      return;
    }
    set(state => {
      const updated = state.serverShortcuts.filter(s => s.id !== id);
      saveShortcuts(updated.filter(s => s.id !== 'official-4messenger' && s.id !== 'official-4messenger-russia')); // Don't save official shortcuts to localStorage
      return { serverShortcuts: updated };
    });
  },

  // Language
  language: loadLanguage(),
  
  setLanguage: (lang) => {
    saveLanguage(lang);
    set({ language: lang });
  },
  
  t: (key) => {
    return getTranslation(get().language, key);
  },
  
  translate: (key) => {
    return getTranslation(get().language, key);
  },
  
  // Privacy Policy
  privacyPolicyAccepted: false,
  showPrivacyPolicy: false,
  
  // Error Page
  errorState: null,
  
  // 2FA implementations
  setupAuthenticatorTwoFa: async () => {
    const { serverUrl, authToken } = get();
    if (!serverUrl || !authToken) return null;
    
    try {
      const response = await fetch(`${serverUrl}/api/users/me/2fa/authenticator/setup`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        get().addNotification(errorData.error || 'Failed to setup authenticator', 'error');
        return null;
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      get().addNotification('Error setting up authenticator', 'error');
      return null;
    }
  },

  verifyAuthenticatorSetup: async (secret, code, password) => {
    const { serverUrl, authToken } = get();
    if (!serverUrl || !authToken) return false;
    
    try {
      const response = await fetch(`${serverUrl}/api/users/me/2fa/authenticator/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret, code, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        get().addNotification(data.error || 'Failed to verify code', 'error');
        return false;
      }
      
      get().addNotification('Authenticator 2FA enabled successfully', 'success');
      await get().getTwoFaStatus();
      return true;
    } catch (err) {
      get().addNotification('Error verifying 2FA setup', 'error');
      return false;
    }
  },

  setupEmailTwoFa: async (password) => {
    const { serverUrl, authToken } = get();
    if (!serverUrl || !authToken) return false;
    
    try {
      const response = await fetch(`${serverUrl}/api/users/me/2fa/email/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        get().addNotification(data.error || 'Failed to setup email 2FA', 'error');
        return false;
      }
      
      get().addNotification('Verification code sent to your email', 'success');
      return true;
    } catch (err) {
      get().addNotification('Error setting up email 2FA', 'error');
      return false;
    }
  },

  verifyEmailTwoFaCode: async (code, password) => {
    const { serverUrl, authToken } = get();
    if (!serverUrl || !authToken) return false;
    
    try {
      const response = await fetch(`${serverUrl}/api/users/me/2fa/email/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        get().addNotification(data.error || 'Invalid code', 'error');
        return false;
      }
      
      get().addNotification('Email 2FA enabled successfully', 'success');
      await get().getTwoFaStatus();
      return true;
    } catch (err) {
      get().addNotification('Error verifying email code', 'error');
      return false;
    }
  },

  verify2Fa: async (method, code) => {
    const { serverUrl, twoFaSessionToken } = get();
    if (!serverUrl || !twoFaSessionToken) return false;
    
    try {
      const response = await fetch(`${serverUrl}/api/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFaSessionToken, code, method }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        get().addNotification(data.error || 'Invalid 2FA code', 'error');
        return false;
      }
      
      // Login successful - set auth data
      set({
        currentUser: data.user,
        authToken: data.token,
        twoFaSessionToken: null,
        screen: 'chat',
      });
      
      saveSession(serverUrl, data.token, data.user);
      saveWsTokenToCookie(serverUrl, data.token, data.user);
      
      // Initialize WebSocket and fetch data
      await Promise.all([
        get().fetchUsers(),
        get().fetchChats(),
        get().fetchBots(),
      ]);
      
      return true;
    } catch (err) {
      get().addNotification('Error verifying 2FA', 'error');
      return false;
    }
  },

  send2FaEmailCode: async () => {
    const { serverUrl, twoFaSessionToken } = get();
    if (!serverUrl || !twoFaSessionToken) return false;
    
    try {
      const response = await fetch(`${serverUrl}/api/2fa/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFaSessionToken }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        get().addNotification(data.error || 'Failed to send code', 'error');
        return false;
      }
      
      get().addNotification('Code sent to your email', 'success');
      return true;
    } catch (err) {
      get().addNotification('Error sending 2FA code', 'error');
      return false;
    }
  },

  disableTwoFa: async (method, password) => {
    const { serverUrl, authToken } = get();
    if (!serverUrl || !authToken) return false;
    
    try {
      const response = await fetch(`${serverUrl}/api/users/me/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        get().addNotification(data.error || 'Failed to disable 2FA', 'error');
        return false;
      }
      
      get().addNotification(data.message, 'success');
      await get().getTwoFaStatus();
      return true;
    } catch (err) {
      get().addNotification('Error disabling 2FA', 'error');
      return false;
    }
  },

  getTwoFaStatus: async () => {
    const { serverUrl, authToken } = get();
    if (!serverUrl || !authToken) return;
    
    try {
      const response = await fetch(`${serverUrl}/api/users/me/2fa/status`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      set({ twoFaStatus: data });
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
    }
  },

  setupTrustedDevice: async (deviceName) => {
    const { serverUrl, authToken } = get();
    if (!serverUrl || !authToken) {
      get().addNotification('Not authenticated', 'error');
      return null;
    }
    
    try {
      const response = await fetch(`${serverUrl}/api/users/me/trusted-devices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceName }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        get().addNotification(data.error || 'Failed to setup trusted device', 'error');
        console.error('[setupTrustedDevice] Error:', data.error);
        return null;
      }
      
      get().addNotification('Device registered successfully', 'success');
      return data.deviceToken;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error setting up trusted device';
      get().addNotification(message, 'error');
      console.error('[setupTrustedDevice] Exception:', err);
      return null;
    }
  },

  getTrustedDevices: async () => {
    const { serverUrl, authToken } = get();
    if (!serverUrl || !authToken) {
      console.warn('[getTrustedDevices] Not authenticated');
      return [];
    }
    
    try {
      const response = await fetch(`${serverUrl}/api/users/me/trusted-devices`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      if (!response.ok) {
        console.error('[getTrustedDevices] Response not ok:', response.status);
        return [];
      }
      
      const data = await response.json();
      return data.devices || [];
    } catch (err) {
      console.error('[getTrustedDevices] Error:', err);
      return [];
    }
  },

  removeTrustedDevice: async (deviceId) => {
    const { serverUrl, authToken } = get();
    if (!serverUrl || !authToken) {
      get().addNotification('Not authenticated', 'error');
      return false;
    }
    
    try {
      const response = await fetch(`${serverUrl}/api/users/me/trusted-devices/${deviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        get().addNotification(data.error || 'Failed to remove device', 'error');
        console.error('[removeTrustedDevice] Error:', data.error);
        return false;
      }
      
      get().addNotification('Device removed successfully', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error removing device';
      get().addNotification(message, 'error');
      console.error('[removeTrustedDevice] Exception:', err);
      return false;
    }
  },

  checkPrivacyPolicy: () => {
    return hasAcceptedPrivacyPolicy();
  },
  
  acceptPrivacyPolicy: () => {
    savePrivacyPolicyAcceptance();
    set({ privacyPolicyAccepted: true, showPrivacyPolicy: false });
  },
  
  setShowPrivacyPolicy: (show) => set({ showPrivacyPolicy: show }),
  
  setError: (code, message, description) => {
    set({
      errorState: { code, message, description },
      screen: 'error',
    });
  },
  clearError: () => set({ errorState: null }),

  // Initialize official server shortcuts
  initOfficialShortcut: async () => {
    const urls = await loadOfficialServerUrls();
    const state = get();
    const officialShortcuts: ServerShortcut[] = [];
    
    // Add global official server
    if (urls.global) {
      officialShortcuts.push({
        id: 'official-4messenger',
        name: state.t('server.officialGlobal'),
        url: urls.global,
        createdAt: 0,
      });
    }
    
    // Add Russia official server
    if (urls.russia) {
      officialShortcuts.push({
        id: 'official-4messenger-russia',
        name: state.t('server.officialRussia'),
        url: urls.russia,
        createdAt: 0,
      });
    }
    
    if (officialShortcuts.length > 0) {
      set(state => {
        // Remove any existing official shortcuts and add the new ones
        const filtered = state.serverShortcuts.filter(s => 
          s.id !== 'official-4messenger' && s.id !== 'official-4messenger-russia'
        );
        return {
          serverShortcuts: [...officialShortcuts, ...filtered],
        };
      });
    }
  },

  restoreSession: async () => {
    const session = loadSession();
    if (!session) return false;
    
    const { serverUrl, authToken, user } = session;

    // Load E2EE key pair from localStorage if available
    let keyPair: { publicKey: string; privateKey: string } | null = null;
    try {
      keyPair = await e2ee.ensureKeyPair();
      if (keyPair) {
        console.log('[SimpleE2EE] E2EE key pair restored from session');
      }
    } catch (e) {
      console.error('[SimpleE2EE] Failed to restore E2EE key pair:', e);
    }
    
    // Set loading state
    set({ connecting: true, serverUrl, e2eeKeyPair: keyPair });
    
    try {
      // Verify token is still valid by fetching user info
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/me`, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        clearSession();
        set({ connecting: false });
        return false;
      }
      
      const userData = await response.json();
      
      // Get server info
      const serverInfoResponse = await fetch(`${serverUrl.replace(/\/$/, '')}/api/server-info`, {
        headers: { 'Accept': 'application/json' },
      });
      
      let serverConfig = get().serverConfig;
      if (serverInfoResponse.ok) {
        const serverInfo = await serverInfoResponse.json();
        serverConfig = {
          emailVerification: serverInfo.emailVerification || false,
          serverPassword: serverInfo.requiresPassword ? 'required' : '',
          captchaEnabled: serverInfo.captchaEnabled || false,
          maxFileSize: serverInfo.maxFileSize || 10485760,
          allowRegistration: serverInfo.registrationEnabled ?? true,
          serverName: serverInfo.name || '4 Messenger Server',
          encryptionEnabled: serverInfo.encryptionEnabled ?? true,
          maxBotMemoryMB: serverInfo.maxBotMemoryMB || 50,
        };
      }
      
      // Restore session
      set({
        connected: true,
        connecting: false,
        serverUrl,
        authToken,
        currentUser: {
          ...user,
          ...userData,
          displayName: userData.display_name || userData.displayName || user.displayName,
        },
        serverConfig,
        screen: 'chat',
      });
      
      // Fetch initial data
      await Promise.all([
        get().fetchUsers(),
        get().fetchChats(),
        get().fetchBots(),
      ]);
      
      // Setup WebSocket connection
      const wsUrl = serverUrl.replace(/^http/, 'ws').replace(/\/$/, '');
      const ws = new WebSocket(`${wsUrl}/ws?token=${authToken}`);
      
      ws.onopen = () => {
        console.log('[WS] Connected (session restored)');
      };
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          switch (msg.type) {
            case 'announcement':
              get().addNotification(`📢 ${msg.message}`, 'info');
              break;
            case 'message':
            case 'new_message': {
              const handleIncomingMessage = async () => {
                const msgData = msg.data || msg.message;
                if (!msgData) return;
                
                const senderId = msgData.sender_id || msgData.senderId;
                const chatId = msgData.chat_id || msgData.chatId;

                if (senderId && get().isBlocked(senderId)) {
                  console.log(`[BLOCK] Dropped incoming message ${msgData.id} from blocked sender ${senderId}`);
                  return;
                }

                let content = msgData.content;
                const { chatKeys } = get();
                const currentUser = get().currentUser;
                
                // Handle encrypted messages
                if (content && typeof content === 'string' && content.startsWith('e2ee:')) {
                  try {
                    // Extract and parse the encrypted packet
                    const encryptedStr = content.substring(5); // Remove 'e2ee:' prefix
                    const packet = JSON.parse(encryptedStr);
                    
                    if (packet.iv && packet.ciphertext) {
                      // This is chat-key encrypted format
                      let chatKey = chatKeys[chatId] as CryptoKey | undefined;
                      
                      // If key is still encrypted (string), try to unwrap it on-demand
                      if (!chatKey && typeof chatKeys?.[chatId] === 'string' && chatKeys?.[chatId].length > 0) {
                        const encryptedKey = chatKeys?.[chatId] as unknown as string;
                        try {
                          console.log('[E2EE] SessionRestore: Key still encrypted, unwrapping on-demand for chat:', chatId);
                          chatKey = await e2ee.decryptChatKey(encryptedKey);
                          
                          // Save to localStorage and update state
                          try {
                            const exported = await crypto.subtle.exportKey('raw', chatKey);
                            const keyStr = Array.from(new Uint8Array(exported)).map(b => String.fromCharCode(b)).join('');
                            localStorage.setItem(`4messenger-chat-key-${chatId}`, btoa(keyStr));
                          } catch (e) {
                            console.warn('[E2EE] Failed to save unwrapped key to localStorage:', e);
                          }
                          
                          set(state => ({
                            chatKeys: { ...state.chatKeys, [chatId]: chatKey }
                          }));
                          console.log('[E2EE] ✓ SessionRestore: Successfully unwrapped key on demand for chat:', chatId);
                        } catch (err) {
                          console.error('[E2EE] SessionRestore: Failed to unwrap key on demand:', err);
                        }
                      }
                      
                      if (senderId === currentUser?.id) {
                        // This is a message I sent - retrieve plaintext from cache
                        const cached = localStorage.getItem(`4messenger-sent-message-${msgData.id}`);
                        if (cached) {
                          content = cached;
                          console.log('[E2EE] Retrieved plaintext for own sent message from SessionRestore');
                        } else if (chatKey) {
                          // Try to decrypt if we have the key
                          try {
                            content = await e2ee.decryptMessageWithChatKey(packet.ciphertext, packet.iv, chatKey);
                            console.log('[E2EE] Successfully decrypted own message with chat key from SessionRestore');
                          } catch (err) {
                            console.error('[E2EE] Failed to decrypt own message from SessionRestore:', err);
                            content = '[Unable to decrypt message]';
                          }
                        } else {
                          console.warn('[E2EE] No chat key available, storing encrypted message');
                          content = msgData.content; // Keep encrypted for now
                        }
                      } else {
                        // This is from someone else
                        if (chatKey) {
                          try {
                            content = await e2ee.decryptMessageWithChatKey(packet.ciphertext, packet.iv, chatKey);
                            console.log('[E2EE] Message decrypted successfully with chat key from SessionRestore');
                          } catch (err) {
                            console.error('[E2EE] Decryption failed from SessionRestore:', err);
                            content = '[Unable to decrypt message]';
                          }
                        } else {
                          console.warn('[E2EE] No chat key available for decryption from SessionRestore');
                          content = '[Message encrypted - waiting for key]';
                        }
                      }
                    }
                  } catch (parseErr) {
                    console.error('[E2EE] Failed to parse encrypted message from SessionRestore:', parseErr);
                    content = '[Unable to decrypt message]';
                  }
                }
                
                const mappedMsg: Message = {
                  id: msgData.id,
                  chatId,
                  senderId,
                  content: content,
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
                
                if (!existsInMessages && !existsInAll && !isOwnMessage) {
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

                    // Play notification sound if enabled
                    const isMuted = get().isChatMuted(chatId);
                    const isInDND = get().isInDND();
                    const shouldNotify = !isActiveChat && !isMuted && !isInDND && state.appearance.notificationsEnabled;

                    if (shouldNotify && state.appearance.soundsEnabled) {
                      try {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczHDdlj8XX3a1YMB04ZI3E1d2sWjIfOGWPxNXdrFoyHw==');
                        audio.volume = 0.3;
                        audio.play().catch(() => {});
                      } catch {}
                    }

                    // Show in-app notification immediately
                    if (shouldNotify) {
                      (async () => {
                        const senderUser = state.users.find(u => u.id === senderId);
                        const senderName = senderUser?.displayName || senderUser?.username || 'Someone';
                        try {
                          const preview = await get().getMessagePreview(mappedMsg);
                          get().addNotification(`${senderName}: ${preview}`, 'info');
                        } catch {
                          // Fallback if decryption fails
                          const fallbackPreview = mappedMsg.type === 'text' ? mappedMsg.content.substring(0, 100) : `Sent a ${mappedMsg.type}`;
                          get().addNotification(`${senderName}: ${fallbackPreview}`, 'info');
                        }
                      })();
                    }

                    // Show browser notification (works whenever tab is open or hidden)
                    if (shouldNotify) {
                      try {
                        if (Notification.permission === 'granted') {
                          (async () => {
                            const senderUser = state.users.find(u => u.id === senderId);
                            const senderName = senderUser?.displayName || senderUser?.username || 'Someone';
                            try {
                              const preview = await get().getMessagePreview(mappedMsg);
                              new Notification(`${senderName}`, {
                                body: preview,
                                icon: senderUser?.avatar || undefined,
                                tag: chatId,
                                badge: senderUser?.avatar || undefined,
                              });
                            } catch {
                              // Fallback if decryption fails
                              const fallbackBody = mappedMsg.type === 'text' ? mappedMsg.content : `Sent a ${mappedMsg.type}`;
                              new Notification(`${senderName}`, {
                                body: fallbackBody,
                                icon: senderUser?.avatar || undefined,
                                tag: chatId,
                                badge: senderUser?.avatar || undefined,
                              });
                            }
                          })();
                        }
                      } catch {}
                    }
                }
              };
              handleIncomingMessage();
              break;
            }
            case 'message_edited': {
              const editData = msg.data;
              if (editData) {
                set(state => ({
                  messages: state.messages.map(m => 
                    m.id === editData.id ? { ...m, content: editData.content, edited: true } : m
                  ),
                  allMessages: Object.fromEntries(
                    Object.entries(state.allMessages).map(([cid, msgs]) => [
                      cid,
                      msgs.map(m => m.id === editData.id ? { ...m, content: editData.content, edited: true } : m)
                    ])
                  ),
                }));
              }
              break;
            }
            case 'message_deleted': {
              const deleteData = msg.data;
              if (deleteData) {
                set(state => ({
                  messages: state.messages.filter(m => m.id !== deleteData.id),
                  allMessages: Object.fromEntries(
                    Object.entries(state.allMessages).map(([cid, msgs]) => [
                      cid,
                      msgs.filter(m => m.id !== deleteData.id)
                    ])
                  ),
                }));
              }
              break;
            }
            case 'user_online':
              set(state => ({
                users: state.users.map(u => u.id === msg.userId ? { ...u, online: true } : u),
              }));
              break;
            case 'user_offline':
              set(state => ({
                users: state.users.map(u => u.id === msg.userId ? { ...u, online: false, lastSeen: Date.now() } : u),
              }));
              break;
            case 'chat_updated':
              get().fetchChats();
              break;
            case 'kicked':
              get().addNotification('You have been kicked from the server', 'error');
              get().logout();
              break;
            case 'maintenance':
              if (msg.enabled) {
                get().addNotification(`🔧 Server is entering maintenance mode: ${msg.message || 'Please try again later'}`, 'error');
                get().logout();
              } else {
                get().addNotification('✅ Server maintenance is complete. You can now reconnect.', 'success');
              }
              break;
          }
        } catch (error) {
          console.error('[WS] Error parsing message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('[WS] Disconnected');
        set({ websocket: null });
      };
      
      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
      
      set({ websocket: ws });
      
      // Periodically refresh chat list
      const chatRefreshInterval = setInterval(() => {
        if (get().authToken && get().websocket) {
          get().fetchChats();
        } else {
          clearInterval(chatRefreshInterval);
        }
      }, 15000);
      
      get().addNotification(`Welcome back, ${userData.display_name || userData.username || user.username}!`, 'success');
      return true;
      
    } catch (error) {
      console.error('Failed to restore session:', error);
      clearSession();
      set({ connecting: false });
      return false;
    }
  },
}));
