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
import { TwoFAVerification } from './components/TwoFAVerification';
import { PolicyPage } from './components/PolicyPage';

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
    console.log('[App] Auth effect triggered - authToken:', !!authToken, 'serverUrl:', !!serverUrl);
    
    if (!authToken || !serverUrl) {
      console.log('[App] Skipping push setup - missing authToken or serverUrl');
      return;
    }

    console.log('[Push] ✓ Starting push setup (authToken + serverUrl present)');
    console.log('[Push] authToken length:', authToken.length);
    console.log('[Push] serverUrl:', serverUrl);

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

    console.log('[Push] Service Worker and PushManager available, requesting permission...');
    console.log('[Push] Current permission state:', Notification.permission);

    const setupPushNotifications = async () => {
      try {
        // Always try to request permission, even if we think it might be denied
        // This ensures we get a fresh prompt if user hasn't answered
        if (Notification.permission === 'default') {
          console.log('[Push] Requesting notification permission (permission was default)');
          const permission = await Notification.requestPermission();
          console.log('[Push] Permission result:', permission);
          if (permission !== 'granted') {
            console.log('[Push] Notification permission denied by user');
            // Clear any old subscription data if permission denied
            localStorage.removeItem('4messenger-push-subscription');
            return;
          }
        }

        if (Notification.permission !== 'granted') {
          console.log('[Push] Notifications permission not granted (current state:', Notification.permission, ')');
          console.log('[Push] Note: Once denied, you must reset permissions in browser settings or use incognito');
          return;
        }

        console.log('[Push] Permission granted, proceeding with subscription...');

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;
        console.log('[Push] Service worker registered');

        // Check if already subscribed
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('[Push] Already subscribed to push notifications');
          return;
        }
        console.log('[Push] No existing subscription, creating new one...');

        // Fetch VAPID public key from server
        const apiUrl = serverUrl.replace(/\/$/, '');
        console.log('[Push] API URL:', apiUrl);
        
        let vapidPublicKey = '';
        try {
          console.log('[Push] Fetching VAPID key from', `${apiUrl}/api/push/vapid-key`);
          const vapidResponse = await fetch(`${apiUrl}/api/push/vapid-key`);
          console.log('[Push] VAPID response status:', vapidResponse.status);
          
          if (vapidResponse.ok) {
            const vapidData = await vapidResponse.json();
            vapidPublicKey = vapidData.vapidPublicKey;
            console.log('[Push] Retrieved VAPID public key (length:', vapidPublicKey.length, ')');
          } else {
            console.warn('[Push] Failed to retrieve VAPID public key - status:', vapidResponse.status);
            const errorText = await vapidResponse.text();
            console.warn('[Push] Error response:', errorText);
          }
        } catch (err) {
          console.warn('[Push] Could not fetch VAPID key:', err);
        }

        if (!vapidPublicKey) {
          console.error('[Push] Cannot subscribe - no VAPID public key! Server may not have push configured.');
          return;
        }

        // Convert VAPID public key string to Uint8Array
        console.log('[Push] Converting VAPID key to Uint8Array...');
        let applicationServerKey;
        try {
          applicationServerKey = new Uint8Array(
            atob(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/'))
              .split('')
              .map(c => c.charCodeAt(0))
          );
          console.log('[Push] VAPID key converted successfully');
        } catch (err) {
          console.error('[Push] Failed to convert VAPID key:', err);
          return;
        }

        // Subscribe to push notifications
        console.log('[Push] Calling pushManager.subscribe()...');
        let subscription;
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey,
          });
          console.log('[Push] Successfully created subscription, endpoint:', subscription.endpoint.substring(0, 50) + '...');
        } catch (err) {
          console.error('[Push] pushManager.subscribe() failed:', err);
          console.error('[Push] Error name:', err.name);
          console.error('[Push] Error message:', err.message);
          return;
        }

        // Send subscription to server
        console.log('[Push] Sending subscription to server...');
        const subscriptionJson = subscription.toJSON();
        console.log('[Push] Subscription payload:', {
          endpoint: subscriptionJson.endpoint?.substring(0, 50) + '...',
          keys: subscriptionJson.keys ? Object.keys(subscriptionJson.keys) : 'missing',
        });

        try {
          const response = await fetch(`${apiUrl}/api/push/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ subscription: subscriptionJson }),
          });

          console.log('[Push] Server response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('[Push] ✓ Successfully subscribed to push notifications');
            console.log('[Push] Server response:', data);
            
            // Store subscription locally for reference
            localStorage.setItem('4messenger-push-subscription', JSON.stringify(subscriptionJson));
            
            // Refresh the store's push subscriptions
            console.log('[Push] Refreshing push subscriptions in store...');
            await useStore.getState().fetchPushSubscriptions();
            console.log('[Push] Store updated with new subscription');
          } else {
            const errorText = await response.text();
            console.error('[Push] ✗ Failed to register subscription with server');
            console.error('[Push] Server error status:', response.status);
            console.error('[Push] Server error response:', errorText);
          }
        } catch (sendError) {
          console.error('[Push] ✗ Failed to send subscription to server:', sendError);
        }
      } catch (error) {
        console.error('[Push] ✗ ERROR in setupPushNotifications:');
        console.error('[Push] Error name:', error.name);
        console.error('[Push] Error message:', error.message);
        console.error('[Push] Full error:', error);
        if (error instanceof Error && error.stack) {
          console.error('[Push] Stack trace:', error.stack);
        }
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
      {screen === '2fa' && <TwoFAVerification />}
      {screen === 'register' && <RegisterScreen />}
      {screen === 'chat' && <ChatScreen />}
      {screen === 'admin' && <AdminPanel />}
      {screen === 'policy' && <PolicyPage />}
      {callState.active && <CallOverlay />}
      <Notifications />
    </div>
  );
}
