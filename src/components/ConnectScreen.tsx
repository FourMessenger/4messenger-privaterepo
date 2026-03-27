import { useState, useEffect } from 'react';
import { useStore, ServerShortcut } from '../store';
import { Globe, ArrowRight, Shield, MessageSquare, AlertCircle, Loader2, Server, Plus, X, Star, Languages, FileText, CheckCircle, Moon, Sun } from 'lucide-react';
import PrivacyPolicy from './PrivacyPolicy';

export function ConnectScreen() {
  const [url, setUrl] = useState('');
  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [shortcutName, setShortcutName] = useState('');
  const [shortcutUrl, setShortcutUrl] = useState('');
  
  const { 
    setServerUrl, 
    connectToServer, 
    connecting, 
    connectionError, 
    setConnectionError,
    serverShortcuts,
    addServerShortcut,
    removeServerShortcut,
    initOfficialShortcut,
    language,
    setLanguage,
    translate,
    checkPrivacyPolicy,
    acceptPrivacyPolicy,
    serverConfig,
    appearance,
    setAppearance,
  } = useStore();

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pendingServerUrl, setPendingServerUrl] = useState<string | null>(null);
  const [showFullPolicy, setShowFullPolicy] = useState(false);

  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ] as const;

  const themes = [
    { code: 'light', name: 'Light', icon: Sun },
    { code: 'dark', name: 'Dark', icon: Moon },
    { code: 'system', name: 'System', icon: '🖥️' },
  ] as const;

  // Load official server shortcut on mount
  useEffect(() => {
    initOfficialShortcut();
  }, [initOfficialShortcut]);

  // Check if privacy policy was already accepted globally (only once on first visit)
  useEffect(() => {
    if (!checkPrivacyPolicy()) {
      setShowPrivacyModal(true);
    }
  }, [checkPrivacyPolicy]);

  const proceedWithConnection = async (serverUrl: string) => {
    setConnectionError(null);
    setServerUrl(serverUrl);
    await connectToServer();
  };

  const handleConnect = async () => {
    if (url.trim() && !connecting) {
      const serverUrl = url.trim();
      await proceedWithConnection(serverUrl);
    }
  };

  const handleShortcutClick = async (shortcut: ServerShortcut) => {
    if (!connecting) {
      setUrl(shortcut.url);
      await proceedWithConnection(shortcut.url);
    }
  };

  const handleAcceptPrivacyPolicy = async () => {
    // Save acceptance to localStorage - this ensures it only appears once globally
    acceptPrivacyPolicy();
    setShowPrivacyModal(false);
    setShowFullPolicy(false);
    // If there was a pending connection, proceed with it
    if (pendingServerUrl) {
      const serverToConnect = pendingServerUrl;
      setPendingServerUrl(null);
      await proceedWithConnection(serverToConnect);
    }
  };

  const handleDeclinePrivacyPolicy = () => {
    setShowPrivacyModal(false);
    setPendingServerUrl(null);
    setConnectionError(translate('connect.privacyDeclined'));
  };

  const handleAddShortcut = () => {
    if (shortcutName.trim() && shortcutUrl.trim()) {
      addServerShortcut(shortcutName.trim(), shortcutUrl.trim());
      setShortcutName('');
      setShortcutUrl('');
      setShowAddShortcut(false);
    }
  };

  const handleRemoveShortcut = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeServerShortcut(id);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setAppearance({ theme });
    setShowThemeMenu(false);
  };

  const isDarkTheme = appearance.theme === 'dark' || 
    (appearance.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={`flex min-h-screen items-center justify-center ${isDarkTheme ? 'bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} p-4`}>
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${isDarkTheme ? 'bg-indigo-500/5' : 'bg-indigo-600/8'}`}
            style={{
              width: Math.random() * 300 + 50,
              height: Math.random() * 300 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 5}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <span className="text-4xl font-black text-white">4</span>
          </div>
          <h1 className={`mb-2 text-4xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            4 Messenger
          </h1>
          <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>{translate('connect.tagline')}</p>
        </div>

        {/* Selectors - Language and Theme */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                isDarkTheme
                  ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  : 'border-gray-300 bg-white/60 text-gray-700 hover:bg-white/80'
              }`}
              title="Toggle theme"
            >
              {appearance.theme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : appearance.theme === 'light' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <span>🖥️</span>
              )}
            </button>
            
            {showThemeMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowThemeMenu(false)}
                />
                <div className={`absolute right-0 mt-2 z-50 w-40 rounded-xl border shadow-xl overflow-hidden ${
                  isDarkTheme
                    ? 'border-white/10 bg-gray-900'
                    : 'border-gray-300 bg-white'
                }`}>
                  {themes.map((theme) => (
                    <button
                      key={theme.code}
                      onClick={() => handleThemeChange(theme.code as 'light' | 'dark' | 'system')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                        appearance.theme === theme.code
                          ? isDarkTheme
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-indigo-100 text-indigo-700'
                          : isDarkTheme
                            ? 'text-gray-300 hover:bg-white/5'
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {typeof theme.icon === 'string' ? (
                        <span className="text-lg">{theme.icon}</span>
                      ) : (
                        <theme.icon className="h-4 w-4" />
                      )}
                      <span>{theme.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                isDarkTheme
                  ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  : 'border-gray-300 bg-white/60 text-gray-700 hover:bg-white/80'
              }`}
            >
              <Languages className="h-4 w-4" />
              {languages.find(l => l.code === language)?.flag}
            </button>
            
            {showLanguageMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLanguageMenu(false)}
                />
                <div className={`absolute right-0 mt-2 z-50 w-40 rounded-xl border shadow-xl overflow-hidden ${
                  isDarkTheme
                    ? 'border-white/10 bg-gray-900'
                    : 'border-gray-300 bg-white'
                }`}>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                        language === lang.code 
                          ? isDarkTheme
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-indigo-100 text-indigo-700'
                          : isDarkTheme
                            ? 'text-gray-300 hover:bg-white/5'
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Server Shortcuts */}
        {serverShortcuts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm font-medium flex items-center gap-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                <Star className="h-4 w-4 text-yellow-500" />
                {translate('connect.savedServers')}
              </h2>
              <button
                onClick={() => setShowAddShortcut(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {translate('connect.add')}
              </button>
            </div>
            <div className="space-y-2">
              {serverShortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  onClick={() => !connecting && handleShortcutClick(shortcut)}
                  className={`group w-full flex items-center gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                    connecting ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isDarkTheme
                      ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30'
                      : 'border-gray-300 bg-white/70 hover:bg-white hover:border-indigo-400/50'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white">
                    {shortcut.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{shortcut.name}</p>
                    <p className={`text-xs truncate ${isDarkTheme ? 'text-gray-500' : 'text-gray-600'}`}>{shortcut.url}</p>
                  </div>
                  {shortcut.id !== 'official-4messenger' && shortcut.id !== 'official-4messenger-russia' && (
                    <button
                      onClick={(e) => handleRemoveShortcut(e, shortcut.id)}
                      className={`p-1.5 rounded-lg transition ${
                        isDarkTheme
                          ? 'text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                          : 'text-gray-600 hover:bg-red-100 hover:text-red-600'
                      }`}
                      title="Remove shortcut"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`rounded-2xl border p-6 shadow-2xl backdrop-blur-xl ${
          isDarkTheme
            ? 'border-white/10 bg-white/5'
            : 'border-white/60 bg-white/60'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <label className={`block text-sm font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              {translate('connect.serverUrl')}
            </label>
            {serverShortcuts.length === 0 && (
              <button
                onClick={() => setShowAddShortcut(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {translate('connect.saveServer')}
              </button>
            )}
          </div>
          <div className="relative mb-4">
            <Globe className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={url}
              onChange={e => { setUrl(e.target.value); setConnectionError(null); }}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              placeholder="https://your-server.com"
              disabled={connecting}
              className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none transition disabled:opacity-50 ${
                isDarkTheme
                  ? 'border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200'
              }`}
            />
          </div>

          {/* Connection Error */}
          {connectionError && (
            <div className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
              isDarkTheme
                ? 'border-red-500/20 bg-red-500/10 text-red-400'
                : 'border-red-300 bg-red-50 text-red-700'
            }`}>
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{translate('connect.connectionFailed')}</p>
                <p className={`text-xs mt-0.5 ${isDarkTheme ? 'text-red-400/80' : 'text-red-600'}`}>{connectionError}</p>
                <p className={`text-xs mt-1 ${isDarkTheme ? 'text-gray-500' : 'text-gray-600'}`}>{translate('connect.checkServer')}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={connecting || !url.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {translate('connect.connecting')}
              </>
            ) : (
              <>
                {translate('connect.connect')} <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>

        <div className={`mt-8 grid grid-cols-3 gap-4`}>
          <div className={`rounded-xl border p-4 text-center backdrop-blur ${
            isDarkTheme
              ? 'border-white/5 bg-white/5'
              : 'border-white/40 bg-white/40'
          }`}>
            <Shield className={`mx-auto mb-2 h-6 w-6 ${isDarkTheme ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <span className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>{translate('connect.encrypted')}</span>
          </div>
          <div className={`rounded-xl border p-4 text-center backdrop-blur ${
            isDarkTheme
              ? 'border-white/5 bg-white/5'
              : 'border-white/40 bg-white/40'
          }`}>
            <MessageSquare className={`mx-auto mb-2 h-6 w-6 ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>{translate('connect.groups')}</span>
          </div>
          <div className={`rounded-xl border p-4 text-center backdrop-blur ${
            isDarkTheme
              ? 'border-white/5 bg-white/5'
              : 'border-white/40 bg-white/40'
          }`}>
            <Server className={`mx-auto mb-2 h-6 w-6 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>{translate('connect.selfHosted')}</span>
          </div>
        </div>

        <p className={`mt-6 text-center text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-600'}`}>
          {translate('connect.startChatting')}
        </p>
      </div>

      {/* Add Shortcut Modal */}
      {showAddShortcut && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 ${isDarkTheme ? 'bg-black/60' : 'bg-black/40'}`}>
          <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${isDarkTheme ? 'border-white/10 bg-gray-900' : 'border-white/60 bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                <Star className="h-5 w-5 text-yellow-500" />
                {translate('connect.saveServer')}
              </h3>
              <button
                onClick={() => setShowAddShortcut(false)}
                className={`p-1 rounded-lg ${isDarkTheme ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  {translate('connect.serverName')}
                </label>
                <input
                  type="text"
                  value={shortcutName}
                  onChange={e => setShortcutName(e.target.value)}
                  placeholder="My Server"
                  className={`w-full rounded-xl border py-2.5 px-4 outline-none transition ${
                    isDarkTheme
                      ? 'border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                      : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  {translate('connect.serverUrl')}
                </label>
                <input
                  type="text"
                  value={shortcutUrl}
                  onChange={e => setShortcutUrl(e.target.value)}
                  placeholder="https://myserver.com:3000"
                  className={`w-full rounded-xl border py-2.5 px-4 outline-none transition ${
                    isDarkTheme
                      ? 'border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                      : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200'
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddShortcut(false)}
                  className={`flex-1 rounded-xl border py-2.5 font-medium transition ${
                    isDarkTheme
                      ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                      : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {translate('common.cancel')}
                </button>
                <button
                  onClick={handleAddShortcut}
                  disabled={!shortcutName.trim() || !shortcutUrl.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 disabled:opacity-50"
                >
                  {translate('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Acceptance Modal */}
      {showPrivacyModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-2 sm:p-4 ${isDarkTheme ? 'bg-black/70' : 'bg-black/50'}`}>
          <div className={`w-full max-w-lg rounded-xl sm:rounded-2xl border shadow-2xl overflow-hidden max-h-[95vh] flex flex-col ${isDarkTheme ? 'border-white/10 bg-gray-900' : 'border-white/60 bg-white'}`}>
            {/* Header */}
            <div className={`p-4 sm:p-6 border-b shrink-0 ${isDarkTheme ? 'border-white/10 bg-gradient-to-r from-indigo-900/50 to-purple-900/50' : 'border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${isDarkTheme ? 'bg-indigo-600' : 'bg-indigo-200'}`}>
                  <FileText className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkTheme ? 'text-white' : 'text-indigo-800'}`} />
                </div>
                <div className="min-w-0">
                  <h2 className={`text-lg sm:text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {translate('privacy.title')}
                  </h2>
                  <p className={`text-xs sm:text-sm truncate ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    {serverConfig.serverName || pendingServerUrl}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              <p className={`text-sm sm:text-base mb-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                {translate('privacy.description')}
              </p>
              
              <div className={`space-y-2 sm:space-y-3 mb-4 sm:mb-6`}>
                <div className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-indigo-50 border-indigo-200'}`}>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-xs sm:text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{translate('privacy.dataCollection')}</p>
                    <p className={`text-xs hidden sm:block ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{translate('privacy.dataCollectionDesc')}</p>
                  </div>
                </div>
                <div className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-indigo-50 border-indigo-200'}`}>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-xs sm:text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{translate('privacy.browserData')}</p>
                    <p className={`text-xs hidden sm:block ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{translate('privacy.browserDataDesc')}</p>
                  </div>
                </div>
                <div className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-indigo-50 border-indigo-200'}`}>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-xs sm:text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{translate('privacy.encryption')}</p>
                    <p className={`text-xs hidden sm:block ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{translate('privacy.encryptionDesc')}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowFullPolicy(true)}
                className="w-full text-center text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 mb-4 sm:mb-6 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {translate('privacy.readFull')}
              </button>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={handleDeclinePrivacyPolicy}
                  className={`flex-1 rounded-lg sm:rounded-xl border py-2.5 sm:py-3 text-sm sm:text-base font-medium transition ${
                    isDarkTheme
                      ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                      : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {translate('privacy.decline')}
                </button>
                <button
                  onClick={handleAcceptPrivacyPolicy}
                  className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40"
                >
                  {translate('privacy.accept')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Privacy Policy Modal */}
      {showFullPolicy && (
        <PrivacyPolicy 
          onClose={() => setShowFullPolicy(false)}
          serverName={serverConfig.serverName || pendingServerUrl || '4 Messenger Server'}
          language={language}
        />
      )}
    </div>
  );
}
