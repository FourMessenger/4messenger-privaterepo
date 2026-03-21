import { useEffect, useState } from 'react';
import { useStore } from './store';
import { ConnectScreen } from './components/ConnectScreen';
import { AuthScreen } from './components/AuthScreen';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { ChatScreen } from './components/ChatScreen';
import { AdminPanel } from './components/AdminPanel';
import { CallOverlay } from './components/CallOverlay';
import { Notifications } from './components/Notifications';

export function App() {
  const screen = useStore(s => s.screen);
  const callState = useStore(s => s.callState);
  const appearance = useStore(s => s.appearance);
  const restoreSession = useStore(s => s.restoreSession);
  const setActiveChat = useStore(s => s.setActiveChat);
  const authToken = useStore(s => s.authToken);
  const serverUrl = useStore(s => s.serverUrl);
  const [isRestoring, setIsRestoring] = useState(true);

  // Try to restore session on mount
  useEffect(() => {
    const tryRestore = async () => {
      await restoreSession();
      setIsRestoring(false);
    };
    tryRestore();
  }, [restoreSession]);

  // Apply appearance settings on mount and when they change
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    if (appearance.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (appearance.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
    
    // Apply CSS variables
    root.style.setProperty('--accent-color', appearance.accentColor);
    root.style.setProperty('--font-size-base', 
      appearance.fontSize === 'small' ? '14px' : 
      appearance.fontSize === 'large' ? '18px' : '16px'
    );
    root.style.setProperty('--message-spacing', 
      appearance.density === 'compact' ? '4px' : 
      appearance.density === 'spacious' ? '16px' : '8px'
    );
    root.style.setProperty('--border-radius', 
      appearance.roundedCorners === 'none' ? '0px' : 
      appearance.roundedCorners === 'small' ? '4px' : 
      appearance.roundedCorners === 'large' ? '24px' : '12px'
    );
    
    // Apply animations
    if (!appearance.animationsEnabled) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (appearance.theme === 'system') {
        if (e.matches) {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.remove('dark');
          root.classList.add('light');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [appearance]);

  // Set up push notifications when user is authenticated
  useEffect(() => {
    if (!authToken || !serverUrl) {
      return;
    }

    // Fetch existing subscriptions and muted users on login
    const fetchNotificationSettings = async () => {
      await Promise.all([
        useStore.getState().fetchPushSubscriptions(),
        useStore.getState().fetchMutedUsers(),
      ]);
    };

    fetchNotificationSettings();

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[Push] Service Worker or PushManager not available');
      return;
    }

    const setupPushNotifications = async () => {
      try {
        // Request notification permission if not already granted
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('[Push] Notification permission denied');
            return;
          }
        }

        if (Notification.permission !== 'granted') {
          console.log('[Push] Notifications not permitted');
          return;
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('[Push] Already subscribed to push notifications');
          return;
        }

        // Fetch VAPID public key from server
        const apiUrl = serverUrl.replace(/\/$/, '');
        let vapidPublicKey = '';
        try {
          const vapidResponse = await fetch(`${apiUrl}/api/push/vapid-key`);
          if (vapidResponse.ok) {
            const vapidData = await vapidResponse.json();
            vapidPublicKey = vapidData.vapidPublicKey;
            console.log('[Push] Retrieved VAPID public key from server');
          } else {
            console.warn('[Push] Failed to retrieve VAPID public key');
          }
        } catch (err) {
          console.warn('[Push] Could not fetch VAPID key:', err);
        }

        // Convert VAPID public key string to Uint8Array
        const applicationServerKey = vapidPublicKey ? 
          new Uint8Array(atob(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0))) :
          undefined;

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey,
        });

        // Send subscription to server
        const response = await fetch(`${apiUrl}/api/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });

        if (response.ok) {
          console.log('[Push] Successfully subscribed to push notifications');
          // Store subscription locally for reference
          localStorage.setItem('4messenger-push-subscription', JSON.stringify(subscription.toJSON()));
        } else {
          console.log('[Push] Failed to register subscription with server');
        }
      } catch (error) {
        console.error('[Push] Failed to set up push notifications:', error);
      }
    };

    setupPushNotifications();
  }, [authToken, serverUrl]);

  // Listen for notification clicks from service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, chatId } = event.data;
      if (type === 'NOTIFICATION_CLICKED' && chatId) {
        console.log('[Push] Navigating to chat:', chatId);
        setActiveChat(chatId);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [setActiveChat]);


  if (isRestoring) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl font-bold text-white">4</span>
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-gray-900 text-white">
      {screen === 'connect' && <ConnectScreen />}
      {screen === 'auth' && <AuthScreen />}
      {screen === 'login' && <LoginScreen />}
      {screen === 'register' && <RegisterScreen />}
      {screen === 'chat' && <ChatScreen />}
      {screen === 'admin' && <AdminPanel />}
      {callState.active && <CallOverlay />}
      <Notifications />
    </div>
  );
}
