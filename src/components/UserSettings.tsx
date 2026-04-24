import { useState, useRef, useEffect } from 'react';
import { useStore, AppearanceSettings } from '../store';
import { type Language } from '../i18n/translations';
import {
  X, User, Palette, Lock, Camera, Save, Eye, EyeOff,
  Sun, Moon, Monitor, Check, Loader2, Type, MessageSquare,
  Layout, Bell, Volume2, VolumeX, RotateCcw, Clock,
  CircleDot, Square, Maximize2, Minimize2, Globe, Bot, Code, Trash2,
  Moon as MoonIcon, AlertCircle, Smartphone, Mail, QrCode, Copy, Shield,
  Layers, Download, Trash, MessageCircle
} from 'lucide-react';
import { SuggestionModal } from './SuggestionModal';

interface UserSettingsProps {
  onClose: () => void;
}

const DEFAULT_BOT_CODE = `def on_message(message, chat_id, sender_id):
    if message == "/start":
        send_message(chat_id, "Hello! I am a bot.")
    elif message == "/help":
        send_message(chat_id, "Available commands: /start, /help")
    else:
        send_message(chat_id, "You said: " + message)`;

export function UserSettings({ onClose }: UserSettingsProps) {
  const { 
    currentUser, serverUrl, authToken, addNotification,
    appearance, setAppearance, resetAppearance,
    language, setLanguage, t: translate,
    bots, fetchBots, createBot, updateBot, deleteBot,
    notificationPreferences, setDND, toggleServerMute,
    mutedUsers, fetchMutedUsers, muteUser, unmuteUser, isMuted,
    blockedUsers, fetchBlockedUsers, blockUser, unblockUser, isBlocked,
    setupAuthenticatorTwoFa, verifyAuthenticatorSetup, setupEmailTwoFa, verifyEmailTwoFaCode,
    disableTwoFa, getTwoFaStatus, twoFaStatus, setupTrustedDevice, getTrustedDevices, removeTrustedDevice,
    customTheme, loadTheme, unloadTheme, themeLoading, themeError
  } = useStore();
  const [tab, setTab] = useState<'profile' | 'appearance' | 'security' | '2fa' | 'language' | 'notifications' | 'bots' | 'themes'>('profile');
  const [loading, setLoading] = useState(false);
  const [unmutingUserId, setUnmutingUserId] = useState<string | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  
  // Profile state
  const [displayName, setDisplayName] = useState(currentUser?.displayName || currentUser?.username || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local appearance state for preview
  const [localAppearance, setLocalAppearance] = useState<AppearanceSettings>(appearance);
  
  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // DND state
  const [dndEnabled, setDndEnabled] = useState(notificationPreferences.dndEnabled);
  const [dndStartHour, setDndStartHour] = useState(Math.floor(notificationPreferences.dndStart / 60));
  const [dndEndHour, setDndEndHour] = useState(Math.floor(notificationPreferences.dndEnd / 60));

  // 2FA state - separate password fields for each action
  const [authenticatorSetupPassword, setAuthenticatorSetupPassword] = useState('');
  const [authenticatorSetupPasswordVisible, setAuthenticatorSetupPasswordVisible] = useState(false);
  const [authenticatorVerifyPassword, setAuthenticatorVerifyPassword] = useState('');
  const [authenticatorVerifyPasswordVisible, setAuthenticatorVerifyPasswordVisible] = useState(false);
  const [emailSetupPassword, setEmailSetupPassword] = useState('');
  const [emailSetupPasswordVisible, setEmailSetupPasswordVisible] = useState(false);
  const [emailVerifyPassword, setEmailVerifyPassword] = useState('');
  const [emailVerifyPasswordVisible, setEmailVerifyPasswordVisible] = useState(false);
  const [disableTotpPassword, setDisableTotpPassword] = useState('');
  const [disableTotpPasswordVisible, setDisableTotpPasswordVisible] = useState(false);
  const [disableEmailPassword, setDisableEmailPassword] = useState('');
  const [disableEmailPasswordVisible, setDisableEmailPasswordVisible] = useState(false);
  
  const [authenticatorSetupStep, setAuthenticatorSetupStep] = useState<'choose' | 'display' | 'verify'>('choose');
  const [authenticatorSecret, setAuthenticatorSecret] = useState<string | null>(null);
  const [authenticatorQR, setAuthenticatorQR] = useState<string | null>(null);
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const [emailStep, setEmailStep] = useState<'choose' | 'verify'>('choose');
  const [emailCode, setEmailCode] = useState('');
  const [trustedDevices, setTrustedDevices] = useState<any[]>([]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  useEffect(() => {
    if (tab === 'notifications') {
      fetchMutedUsers();
      fetchBlockedUsers();
    }
  }, [tab, fetchMutedUsers, fetchBlockedUsers]);

  useEffect(() => {
    if (tab === '2fa') {
      getTwoFaStatus();
      loadTrustedDevices();
    }
  }, [tab]);

  const loadTrustedDevices = async () => {
    const devices = await getTrustedDevices();
    setTrustedDevices(devices);
  };

  // Bot state
  const [editingBotId, setEditingBotId] = useState<string | null>(null);
  const [botName, setBotName] = useState('');
  const [botCode, setBotCode] = useState(DEFAULT_BOT_CODE);

  // Apply appearance changes in real-time for preview
  useEffect(() => {
    applyAppearance(localAppearance);
  }, [localAppearance]);

  const applyAppearance = (settings: AppearanceSettings) => {
    const root = document.documentElement;
    
    // Apply theme
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    // Apply CSS variables
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--font-size-base', settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '18px' : '16px');
    root.style.setProperty('--message-spacing', settings.density === 'compact' ? '4px' : settings.density === 'spacious' ? '16px' : '8px');
    root.style.setProperty('--border-radius', 
      settings.roundedCorners === 'none' ? '0px' : 
      settings.roundedCorners === 'small' ? '4px' : 
      settings.roundedCorners === 'large' ? '24px' : '12px'
    );
    
    // Apply animations
    if (!settings.animationsEnabled) {
      root.style.setProperty('--transition-duration', '0ms');
    } else {
      root.style.setProperty('--transition-duration', '200ms');
    }
  };

  if (!currentUser) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      addNotification('Please select an image file', 'error');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      addNotification('Image must be less than 5MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/me/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          avatar: avatarPreview,
        }),
      });
      
      if (response.ok) {
        addNotification('Profile updated successfully', 'success');
        useStore.setState(state => ({
          currentUser: state.currentUser ? {
            ...state.currentUser,
            displayName: displayName.trim() || undefined,
            avatar: avatarPreview || undefined,
          } : null,
        }));
      } else {
        const data = await response.json();
        addNotification(data.error || 'Failed to update profile', 'error');
      }
    } catch {
      addNotification('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppearance = () => {
    setAppearance(localAppearance);
    addNotification('Appearance settings saved', 'success');
  };

  const handleResetAppearance = () => {
    resetAppearance();
    setLocalAppearance(useStore.getState().appearance);
    addNotification('Appearance reset to defaults', 'info');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      addNotification('Please fill all password fields', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      addNotification('New passwords do not match', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      addNotification('New password must be at least 6 characters', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      if (response.ok) {
        addNotification('Password changed successfully', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        addNotification(data.error || 'Failed to change password', 'error');
      }
    } catch {
      addNotification('Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2FA Handlers
  const handleSetupAuthenticator = async () => {
    if (!authenticatorSetupPassword) {
      addNotification('Please enter your password', 'error');
      return;
    }

    setLoading(true);
    const result = await setupAuthenticatorTwoFa();
    setLoading(false);

    if (result) {
      setAuthenticatorSecret(result.secret);
      setAuthenticatorQR(result.qrCode);
      setAuthenticatorSetupStep('display');
      // Keep password - don't clear it yet, it's needed for verification
    }
  };

  const handleVerifyAuthenticator = async () => {
    if (!authenticatorCode || !authenticatorSecret) {
      addNotification('Please enter the code', 'error');
      return;
    }

    if (!authenticatorVerifyPassword) {
      addNotification('Please enter your password', 'error');
      return;
    }

    setLoading(true);
    const success = await verifyAuthenticatorSetup(authenticatorSecret, authenticatorCode, authenticatorVerifyPassword);
    setLoading(false);

    if (success) {
      setAuthenticatorSetupStep('choose');
      setAuthenticatorSecret(null);
      setAuthenticatorQR(null);
      setAuthenticatorCode('');
      setAuthenticatorSetupPassword('');
      setAuthenticatorVerifyPassword('');
    }
  };

  const handleSetupEmail2FA = async () => {
    if (!emailSetupPassword) {
      addNotification('Please enter your password', 'error');
      return;
    }

    setLoading(true);
    const success = await setupEmailTwoFa(emailSetupPassword);
    setLoading(false);

    if (success) {
      setEmailStep('verify');
      setEmailSetupPassword('');
    }
  };

  const handleVerifyEmail2FA = async () => {
    if (!emailCode) {
      addNotification('Please enter the code', 'error');
      return;
    }

    if (!emailVerifyPassword) {
      addNotification('Please enter your password', 'error');
      return;
    }

    setLoading(true);
    const success = await verifyEmailTwoFaCode(emailCode, emailVerifyPassword);
    setLoading(false);

    if (success) {
      setEmailStep('choose');
      setEmailCode('');
      setEmailSetupPassword('');
      setEmailVerifyPassword('');
    }
  };

  const handleDisable2FA = async (method: 'totp' | 'email') => {
    const password = method === 'totp' ? disableTotpPassword : disableEmailPassword;
    
    if (!password) {
      addNotification('Please enter your password', 'error');
      return;
    }

    setLoading(true);
    const success = await disableTwoFa(method, password);
    setLoading(false);

    if (success) {
      setDisableTotpPassword('');
      setDisableEmailPassword('');
    }
  };

  const handleSetupTrustedDevice =async () => {
    const deviceName = prompt('Device name (e.g., "My Laptop"):');
    if (!deviceName) return;

    setLoading(true);
    const token = await setupTrustedDevice(deviceName);
    setLoading(false);

    if (token) {
      await loadTrustedDevices();
    }
  };

  const handleRemoveTrustedDevice = async (deviceId: string) => {
    setLoading(true);
    const success = await removeTrustedDevice(deviceId);
    setLoading(false);

    if (success) {
      await loadTrustedDevices();
    }
  };

  const updateLocal = (key: keyof AppearanceSettings, value: AppearanceSettings[keyof AppearanceSettings]) => {
    setLocalAppearance(prev => ({ ...prev, [key]: value }));
  };

  const accentColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Blue', value: '#3b82f6' },
  ];

  const chatBackgrounds = [
    { name: 'Default', value: 'default', preview: 'bg-gray-800' },
    { name: 'Gradient 1', value: 'gradient1', preview: 'bg-gradient-to-br from-indigo-900 to-purple-900' },
    { name: 'Gradient 2', value: 'gradient2', preview: 'bg-gradient-to-br from-gray-900 to-indigo-900' },
    { name: 'Gradient 3', value: 'gradient3', preview: 'bg-gradient-to-br from-slate-900 to-slate-800' },
    { name: 'Solid', value: 'solid', preview: 'bg-gray-900' },
  ];

  const handleCreateOrUpdateBot = async () => {
    if (editingBotId) {
      await updateBot(editingBotId, botName, botCode);
      setEditingBotId(null);
      setBotCode(DEFAULT_BOT_CODE);
    } else {
      if (!botName) return;
      await createBot(botName, botName, botCode);
      setBotName('');
      setBotCode(DEFAULT_BOT_CODE);
    }
  };

  const handleCancelEdit = () => {
    setEditingBotId(null);
    setBotCode(DEFAULT_BOT_CODE);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl flex flex-col my-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSuggestionModal(true)}
              className="text-gray-400 hover:text-white p-1 transition"
              title="Send us your suggestions and feedback"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 shrink-0 overflow-x-auto">
          {[
            { id: 'profile' as const, icon: User, label: translate('profile') },
            { id: 'appearance' as const, icon: Palette, label: translate('appearance') },
            { id: 'themes' as const, icon: Layers, label: 'Themes' },
            { id: 'security' as const, icon: Lock, label: translate('security') },
            { id: '2fa' as const, icon: Shield, label: '2FA' },
            { id: 'language' as const, icon: Globe, label: translate('language') },
            { id: 'notifications' as const, icon: Bell, label: 'Notifications' },
            { id: 'bots' as const, icon: Bot, label: 'Bots' },
          ].map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
                tab === tabItem.id ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <tabItem.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tabItem.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {currentUser.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full text-white hover:bg-indigo-600 transition"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Click to change avatar</p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="How others see you"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This name will be shown to other users instead of your username
                </p>
              </div>

              {/* Username (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={currentUser.username}
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-gray-400 outline-none cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-gray-400 outline-none cursor-not-allowed"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                Save Profile
              </button>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <Sun className="h-4 w-4" />
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light' as const, icon: Sun, label: 'Light' },
                    { id: 'dark' as const, icon: Moon, label: 'Dark' },
                    { id: 'system' as const, icon: Monitor, label: 'System' },
                  ].map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => updateLocal('theme', theme.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition ${
                        localAppearance.theme === theme.id
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <theme.icon className={`h-5 w-5 ${localAppearance.theme === theme.id ? 'text-indigo-400' : 'text-gray-400'}`} />
                      <span className={`text-sm ${localAppearance.theme === theme.id ? 'text-white' : 'text-gray-400'}`}>
                        {theme.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <Palette className="h-4 w-4" />
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {accentColors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => updateLocal('accentColor', color.value)}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        localAppearance.accentColor === color.value
                          ? 'border-white scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {localAppearance.accentColor === color.value && (
                        <Check className="h-4 w-4 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <Type className="h-4 w-4" />
                  Font Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small' as const, label: 'Small', icon: Minimize2 },
                    { id: 'medium' as const, label: 'Medium', icon: Type },
                    { id: 'large' as const, label: 'Large', icon: Maximize2 },
                  ].map(size => (
                    <button
                      key={size.id}
                      onClick={() => updateLocal('fontSize', size.id)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${
                        localAppearance.fontSize === size.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-400'
                      }`}
                    >
                      <size.icon className="h-4 w-4" />
                      <span className="text-sm">{size.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Style */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <MessageSquare className="h-4 w-4" />
                  Message Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'modern' as const, label: 'Modern' },
                    { id: 'classic' as const, label: 'Classic' },
                    { id: 'minimal' as const, label: 'Minimal' },
                    { id: 'bubbles' as const, label: 'Bubbles' },
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => updateLocal('messageStyle', style.id)}
                      className={`p-3 rounded-xl border transition ${
                        localAppearance.messageStyle === style.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-400'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Density */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <Layout className="h-4 w-4" />
                  Message Density
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact' as const, label: 'Compact' },
                    { id: 'comfortable' as const, label: 'Comfortable' },
                    { id: 'spacious' as const, label: 'Spacious' },
                  ].map(density => (
                    <button
                      key={density.id}
                      onClick={() => updateLocal('density', density.id)}
                      className={`p-3 rounded-xl border transition ${
                        localAppearance.density === density.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-400'
                      }`}
                    >
                      {density.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounded Corners */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <Square className="h-4 w-4" />
                  Rounded Corners
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'none' as const, label: 'None' },
                    { id: 'small' as const, label: 'Small' },
                    { id: 'medium' as const, label: 'Medium' },
                    { id: 'large' as const, label: 'Large' },
                  ].map(corners => (
                    <button
                      key={corners.id}
                      onClick={() => updateLocal('roundedCorners', corners.id)}
                      className={`p-3 rounded-xl border transition ${
                        localAppearance.roundedCorners === corners.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-400'
                      }`}
                    >
                      {corners.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Background */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <Layout className="h-4 w-4" />
                  Chat Background
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {chatBackgrounds.map(bg => (
                    <button
                      key={bg.value}
                      onClick={() => updateLocal('chatBackground', bg.value as AppearanceSettings['chatBackground'])}
                      className={`aspect-square rounded-xl border-2 transition ${bg.preview} ${
                        localAppearance.chatBackground === bg.value
                          ? 'border-indigo-500 scale-105'
                          : 'border-transparent hover:border-white/20'
                      }`}
                      title={bg.name}
                    >
                      {localAppearance.chatBackground === bg.value && (
                        <Check className="h-4 w-4 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <CircleDot className="h-4 w-4" />
                  Display Options
                </h3>
                
                {[
                  { key: 'showAvatars' as const, label: 'Show Avatars', icon: User },
                  { key: 'showTimestamps' as const, label: 'Show Timestamps', icon: Clock },
                  { key: 'use24HourTime' as const, label: 'Use 24-Hour Time', icon: Clock },
                  { key: 'showOnlineStatus' as const, label: 'Show Online Status', icon: CircleDot },
                  { key: 'animationsEnabled' as const, label: 'Enable Animations', icon: Layout },
                  { key: 'enterToSend' as const, label: 'Enter to Send', icon: MessageSquare },
                ].map(toggle => (
                  <div key={toggle.key} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <toggle.icon className="h-4 w-4 text-gray-400" />
                      <span className="text-white text-sm">{toggle.label}</span>
                    </div>
                    <button
                      onClick={() => updateLocal(toggle.key, !localAppearance[toggle.key])}
                      className={`w-11 h-6 rounded-full transition ${
                        localAppearance[toggle.key] ? 'bg-indigo-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition ${
                        localAppearance[toggle.key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Sound & Notifications */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Sounds & Notifications
                </h3>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    {localAppearance.soundsEnabled ? (
                      <Volume2 className="h-4 w-4 text-gray-400" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-white text-sm">Sound Effects</span>
                  </div>
                  <button
                    onClick={() => updateLocal('soundsEnabled', !localAppearance.soundsEnabled)}
                    className={`w-11 h-6 rounded-full transition ${
                      localAppearance.soundsEnabled ? 'bg-indigo-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition ${
                      localAppearance.soundsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-gray-400" />
                    <span className="text-white text-sm">Desktop Notifications</span>
                  </div>
                  <button
                    onClick={() => updateLocal('notificationsEnabled', !localAppearance.notificationsEnabled)}
                    className={`w-11 h-6 rounded-full transition ${
                      localAppearance.notificationsEnabled ? 'bg-indigo-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition ${
                      localAppearance.notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Mute Server */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-white text-sm">Mute All Notifications</span>
                  </div>
                  <button
                    onClick={() => toggleServerMute()}
                    className={`w-11 h-6 rounded-full transition ${
                      notificationPreferences.serverMuted ? 'bg-indigo-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition ${
                      notificationPreferences.serverMuted ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Do Not Disturb */}
                <div className="space-y-3 p-3 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MoonIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-white text-sm">Do Not Disturb</span>
                    </div>
                    <button
                      onClick={() => {
                        setDndEnabled(!dndEnabled);
                        setDND(!dndEnabled, dndStartHour, dndEndHour);
                      }}
                      className={`w-11 h-6 rounded-full transition ${
                        dndEnabled ? 'bg-indigo-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition ${
                        dndEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {dndEnabled && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Start (Hour)</label>
                        <select
                          value={dndStartHour}
                          onChange={(e) => {
                            const hour = parseInt(e.target.value);
                            setDndStartHour(hour);
                            setDND(true, hour, dndEndHour);
                          }}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-white text-sm outline-none focus:border-indigo-500"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">End (Hour)</label>
                        <select
                          value={dndEndHour}
                          onChange={(e) => {
                            const hour = parseInt(e.target.value);
                            setDndEndHour(hour);
                            setDND(true, dndStartHour, hour);
                          }}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-white text-sm outline-none focus:border-indigo-500"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleResetAppearance}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  onClick={handleSaveAppearance}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-semibold text-white transition active:scale-[0.98]"
                >
                  <Save className="h-5 w-5" />
                  Save Appearance
                </button>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                
                {/* Current Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Password requirements */}
                <div className="mb-6 text-xs text-gray-500">
                  <p>Password must be at least 6 characters long</p>
                </div>

                {/* Change Password Button */}
                <button
                  onClick={handleChangePassword}
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                  {translate('changePassword')}
                </button>
              </div>
            </div>
          )}

          {tab === '2fa' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-400 mb-6">Add an extra layer of security to your account</p>

                {/* Authenticator App */}
                <div className="mb-8 p-4 border border-gray-700 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="text-indigo-400" size={20} />
                      <div>
                        <h4 className="font-semibold text-white">Authenticator App</h4>
                        <p className="text-sm text-gray-400">Google Authenticator, Authy, Microsoft Authenticator, etc.</p>
                      </div>
                    </div>
                    {twoFaStatus?.totpEnabled && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold">Enabled</span>
                    )}
                  </div>

                  {!twoFaStatus?.totpEnabled ? (
                    <div>
                      {authenticatorSetupStep === 'choose' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                            <div className="relative">
                              <input
                                type={authenticatorSetupPasswordVisible ? 'text' : 'password'}
                                value={authenticatorSetupPassword}
                                onChange={e => setAuthenticatorSetupPassword(e.target.value)}
                                placeholder="Enter password to confirm"
                                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setAuthenticatorSetupPasswordVisible(!authenticatorSetupPasswordVisible)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                              >
                                {authenticatorSetupPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={handleSetupAuthenticator}
                            disabled={loading || !authenticatorSetupPassword}
                            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
                          >
                            {loading ? <Loader2 className="animate-spin h-4 w-4 inline" /> : 'Setup Authenticator'}
                          </button>
                        </div>
                      )}

                      {authenticatorSetupStep === 'display' && authenticatorQR && (
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-800 rounded-lg flex flex-col items-center">
                            <img src={authenticatorQR} alt="QR Code" className="w-40 h-40" />
                            <p className="text-xs text-gray-400 mt-2">Scan with your authenticator app</p>
                          </div>
                          
                          <div className="p-4 bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-400 mb-2">Or enter manually:</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-gray-900 p-2 rounded text-xs text-gray-300 break-all">{authenticatorSecret}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(authenticatorSecret || '');
                                  addNotification('Copied!', 'success');
                                }}
                                className="p-2 hover:bg-gray-700 rounded transition"
                              >
                                <Copy size={16} className="text-gray-400" />
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => setAuthenticatorSetupStep('verify')}
                            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold text-sm transition"
                          >
                            I've scanned the code
                          </button>
                        </div>
                      )}

                      {authenticatorSetupStep === 'verify' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">6-digit code from authenticator app</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={authenticatorCode}
                              onChange={e => setAuthenticatorCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="000000"
                              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white text-center tracking-widest text-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                            <div className="relative">
                              <input
                                type={authenticatorVerifyPasswordVisible ? 'text' : 'password'}
                                value={authenticatorVerifyPassword}
                                onChange={e => setAuthenticatorVerifyPassword(e.target.value)}
                                placeholder="Enter password to confirm"
                                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setAuthenticatorVerifyPasswordVisible(!authenticatorVerifyPasswordVisible)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                              >
                                {authenticatorVerifyPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={handleVerifyAuthenticator}
                            disabled={loading || authenticatorCode.length !== 6 || !authenticatorVerifyPassword}
                            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
                          >
                            {loading ? <Loader2 className="animate-spin h-4 w-4 inline" /> : 'Verify & Enable'}
                          </button>
                          <button
                            onClick={() => {
                              setAuthenticatorSetupStep('choose');
                              setAuthenticatorCode('');
                              setAuthenticatorSecret(null);
                              setAuthenticatorQR(null);
                              setAuthenticatorSetupPassword('');
                              setAuthenticatorSetupPasswordVisible(false);
                              setAuthenticatorVerifyPassword('');
                              setAuthenticatorVerifyPasswordVisible(false);
                            }}
                            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold text-sm transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <div className="relative">
                          <input
                            type={disableTotpPasswordVisible ? 'text' : 'password'}
                            value={disableTotpPassword}
                            onChange={e => setDisableTotpPassword(e.target.value)}
                            placeholder="Enter password to confirm"
                            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setDisableTotpPasswordVisible(!disableTotpPasswordVisible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {disableTotpPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDisable2FA('totp')}
                        disabled={loading || !disableTotpPassword}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="animate-spin h-4 w-4 inline" /> : 'Disable Authenticator'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Email 2FA */}
                <div className="mb-8 p-4 border border-gray-700 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Mail className="text-blue-400" size={20} />
                      <div>
                        <h4 className="font-semibold text-white">Email Verification</h4>
                        <p className="text-sm text-gray-400">Receive a code via email</p>
                      </div>
                    </div>
                    {twoFaStatus?.emailTwoFaEnabled && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold">Enabled</span>
                    )}
                  </div>

                  {!twoFaStatus?.emailTwoFaEnabled ? (
                    <div>
                      {emailStep === 'choose' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                            <div className="relative">
                              <input
                                type={emailSetupPasswordVisible ? 'text' : 'password'}
                                value={emailSetupPassword}
                                onChange={e => setEmailSetupPassword(e.target.value)}
                                placeholder="Enter password to confirm"
                                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setEmailSetupPasswordVisible(!emailSetupPasswordVisible)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                              >
                                {emailSetupPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={handleSetupEmail2FA}
                            disabled={loading || !emailSetupPassword}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
                          >
                            {loading ? <Loader2 className="animate-spin h-4 w-4 inline" /> : 'Setup Email 2FA'}
                          </button>
                        </div>
                      )}

                      {emailStep === 'verify' && (
                        <div className="space-y-4">
                          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm text-blue-300">
                            Verification code sent to your email
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Verification code</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={emailCode}
                              onChange={e => setEmailCode(e.target.value)}
                              placeholder="000000"
                              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white text-center tracking-widest"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                            <div className="relative">
                              <input
                                type={emailVerifyPasswordVisible ? 'text' : 'password'}
                                value={emailVerifyPassword}
                                onChange={e => setEmailVerifyPassword(e.target.value)}
                                placeholder="Enter password to confirm"
                                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setEmailVerifyPasswordVisible(!emailVerifyPasswordVisible)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                              >
                                {emailVerifyPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={handleVerifyEmail2FA}
                            disabled={loading || emailCode.length === 0 || !emailVerifyPassword}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
                          >
                            {loading ? <Loader2 className="animate-spin h-4 w-4 inline" /> : 'Verify & Enable'}
                          </button>
                          <button
                            onClick={() => {
                              setEmailStep('choose');
                              setEmailCode('');
                              setEmailSetupPassword('');
                              setEmailSetupPasswordVisible(false);
                              setEmailVerifyPassword('');
                              setEmailVerifyPasswordVisible(false);
                            }}
                            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold text-sm transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <div className="relative">
                          <input
                            type={disableEmailPasswordVisible ? 'text' : 'password'}
                            value={disableEmailPassword}
                            onChange={e => setDisableEmailPassword(e.target.value)}
                            placeholder="Enter password to confirm"
                            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setDisableEmailPasswordVisible(!disableEmailPasswordVisible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {disableEmailPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDisable2FA('email')}
                        disabled={loading || !disableEmailPassword}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="animate-spin h-4 w-4 inline" /> : 'Disable Email 2FA'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Trusted Devices */}
                {(twoFaStatus?.totpEnabled || twoFaStatus?.emailTwoFaEnabled) && (
                  <div className="p-4 border border-gray-700 rounded-xl">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Smartphone className="text-green-400" size={20} />
                        <div>
                          <h4 className="font-semibold text-white">Trusted Devices</h4>
                          <p className="text-sm text-gray-400">Skip 2FA verification on this device</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {trustedDevices.length > 0 ? (
                        trustedDevices.map(device => (
                          <div key={device.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <div className="text-sm">
                              <p className="font-medium text-white">{device.device_name}</p>
                              <p className="text-xs text-gray-400">Added {new Date(device.created_at).toLocaleDateString()}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveTrustedDevice(device.id)}
                              className="text-red-400 hover:text-red-300 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">No trusted devices yet</p>
                      )}
                    </div>

                    <button
                      onClick={handleSetupTrustedDevice}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin h-4 w-4 inline" /> : '+ Add This Device'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'language' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{translate('language')}</h3>
                <p className="text-sm text-gray-400 mb-6">
                  {language === 'en' ? 'Select your preferred language' : 'Выберите предпочитаемый язык'}
                </p>
                
                <div className="space-y-3">
                  {([
                    { id: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇺🇸' },
                    { id: 'ru' as Language, name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
                  ]).map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setLanguage(lang.id);
                        addNotification(
                          lang.id === 'en' ? 'Language changed to English' : 'Язык изменён на Русский',
                          'success'
                        );
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition ${
                        language === lang.id
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-3xl">{lang.flag}</span>
                      <div className="flex-1 text-left">
                        <div className={`font-medium ${language === lang.id ? 'text-white' : 'text-gray-300'}`}>
                          {lang.nativeName}
                        </div>
                        <div className="text-sm text-gray-500">{lang.name}</div>
                      </div>
                      {language === lang.id && (
                        <Check className="h-5 w-5 text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  {language === 'en' ? '📌 Note' : '📌 Примечание'}
                </h4>
                <p className="text-xs text-gray-500">
                  {language === 'en' 
                    ? 'Some parts of the interface may still be in English if translations are not yet available.'
                    : 'Некоторые части интерфейса могут отображаться на английском языке, если переводы ещё недоступны.'}
                </p>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                <Bell className="w-5 h-5 text-indigo-500" />
                <span>Notification Settings</span>
              </h3>

              {/* Server Notifications Toggle */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Server Notifications</h4>
                    <p className="text-sm text-gray-400 mt-1">Disable all server push notifications</p>
                  </div>
                  <button
                    onClick={() => toggleServerMute()}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      notificationPreferences.serverMuted
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {notificationPreferences.serverMuted ? 'Muted' : 'Enabled'}
                  </button>
                </div>
              </div>

              {/* Muted Users Section */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-red-500" />
                  Muted Users ({mutedUsers.length})
                </h4>
                
                {mutedUsers.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    You have no muted users. You'll receive notifications from everyone.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {mutedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">{user.display_name || user.username}</p>
                            <p className="text-xs text-gray-400">@{user.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setUnmutingUserId(user.id);
                            unmuteUser(user.id).finally(() => setUnmutingUserId(null));
                          }}
                          disabled={unmutingUserId === user.id}
                          className="px-3 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/30 transition disabled:opacity-50"
                        >
                          {unmutingUserId === user.id ? 'Unmuting...' : 'Unmute'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Blocked Users Section */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-yellow-400" />
                  Blocked Users ({blockedUsers.length})
                </h4>
                {blockedUsers.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    You have no blocked users. Everyone can send you messages and notifications.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {useStore.getState().blockedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm">
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">{user.display_name || user.username}</p>
                            <p className="text-xs text-gray-400">@{user.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setUnmutingUserId(user.id);
                            unblockUser(user.id).finally(() => setUnmutingUserId(null));
                          }}
                          disabled={unmutingUserId === user.id}
                          className="px-3 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition disabled:opacity-50"
                        >
                          {unmutingUserId === user.id ? 'Unblocking...' : 'Unblock'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Push Subscriptions Info */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Active Push Subscriptions
                </h4>
                <p className="text-sm text-gray-400 mb-3">
                  Devices registered to receive push notifications
                </p>
                {!currentUser || (mutedUsers.length === 0 && (!notificationPreferences.subscriptions || notificationPreferences.subscriptions.length === 0)) ? (
                  <p className="text-sm text-gray-400">
                    Subscribe in this browser to receive notifications when this app is closed.
                  </p>
                ) : (
                  <div className="text-sm text-green-400">
                    ✓ Notifications are enabled on this device
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'bots' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                <Bot className="w-5 h-5 text-indigo-500" />
                <span>My Bots</span>
              </h3>
              
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                <h4 className="font-medium text-white">
                  {editingBotId ? 'Edit Bot Code' : 'Create New Bot'}
                </h4>
                
                {!editingBotId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Bot Name</label>
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="e.g. WeatherBot"
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 flex justify-between">
                    <span>Python Code</span>
                    <span className="text-xs text-gray-500">Modules allowed: requests, math, random, json, re, time, datetime</span>
                  </label>
                  <textarea
                    value={botCode}
                    onChange={(e) => setBotCode(e.target.value)}
                    className="w-full h-48 bg-gray-900 text-green-400 font-mono text-sm border border-gray-700 rounded-lg px-4 py-3"
                    spellCheck={false}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateOrUpdateBot}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {editingBotId ? 'Save Code' : 'Create Bot'}
                  </button>
                  {editingBotId && (
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <h4 className="font-medium text-white">Your Bots</h4>
                {bots.length === 0 ? (
                  <p className="text-gray-400 text-sm">You haven't created any bots yet.</p>
                ) : (
                  bots.map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400 font-bold">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{b.name}</div>
                          <div className="text-xs text-gray-400">Bot ID: {b.id.substring(0,8)}...</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingBotId(b.id);
                            setBotName(b.name);
                            setBotCode(b.code || '');
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-400 bg-gray-700/50 rounded-lg transition-colors"
                          title="Edit Code"
                        >
                          <Code className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBot(b.id)}
                          className="p-2 text-gray-400 hover:text-red-400 bg-gray-700/50 rounded-lg transition-colors"
                          title="Delete Bot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'themes' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>Theme Manager</span>
              </h3>

              {/* Current Theme Info */}
              {customTheme && (
                <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">{customTheme.name}</h4>
                      {customTheme.description && (
                        <p className="text-sm text-gray-400 mt-1">{customTheme.description}</p>
                      )}
                      {customTheme.author && (
                        <p className="text-xs text-gray-500 mt-2">by {customTheme.author}</p>
                      )}
                      {customTheme.version && (
                        <p className="text-xs text-gray-500">v{customTheme.version}</p>
                      )}
                    </div>
                    <button
                      onClick={() => unloadTheme()}
                      className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg transition-colors"
                      title="Remove Theme"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Import Theme */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-medium text-white mb-3">Import Theme</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Select a .4mth theme file (which is a ZIP file containing a manifest.json and theme files)
                </p>
                
                {themeError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{themeError}</span>
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".4mth,.zip"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await loadTheme(file);
                        e.target.value = ''; // Reset input
                      }
                    }}
                    disabled={themeLoading}
                    className="flex-1"
                  />
                  {themeLoading && (
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  )}
                </div>
              </div>

              {/* Theme Info */}
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                <h4 className="font-medium text-white mb-3">Theme File Format</h4>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>A .4mth theme file is a ZIP archive containing:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li><code className="bg-gray-900 px-2 py-1 rounded text-gray-300">manifest.json</code> - Required theme metadata</li>
                    <li>CSS files - For styling (optional)</li>
                    <li>Image files - For backgrounds, logos, etc. (optional)</li>
                  </ul>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="font-medium text-white mb-2">manifest.json example:</p>
                    <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto text-gray-300">{JSON.stringify({
                      name: "My Theme",
                      version: "1.0.0",
                      author: "Your Name",
                      description: "A beautiful custom theme",
                      placeholders: {
                        "background": { path: "bg.png", type: "image" },
                        "custom-styles": { path: "styles.css", type: "css" }
                      }
                    }, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Modal */}
        <SuggestionModal 
          isOpen={showSuggestionModal} 
          onClose={() => setShowSuggestionModal(false)}
          location="user-settings"
          username={currentUser?.username}
        />
      </div>
    </div>
  );
}

