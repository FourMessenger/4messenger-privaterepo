/**
 * Icon Registry for Theme Support
 * Allows themes to replace default icons with custom SVGs
 */

export interface ThemedIcon {
  name: string;
  svgUrl?: string; // Data URL for theme icon
  fallbackIcon?: React.ReactNode; // Default Lucide icon
}

let themeIcons: { [key: string]: string } = {};

/**
 * Register theme icons from loaded theme
 */
export function registerThemeIcons(iconMap: { [key: string]: string }): void {
  themeIcons = iconMap;
  console.log('[IconRegistry] Registered themed icons:', Object.keys(iconMap));
}

/**
 * Clear theme icons
 */
export function clearThemeIcons(): void {
  themeIcons = {};
}

/**
 * Get themed icon SVG URL if available
 */
export function getThemedIconUrl(iconName: string): string | undefined {
  return themeIcons[iconName];
}

/**
 * Get all registered theme icons
 */
export function getAllThemedIcons(): { [key: string]: string } {
  return { ...themeIcons };
}

/**
 * List of all icon placeholders that themes can customize
 */
export const CUSTOMIZABLE_ICONS = {
  // Message actions
  'send': 'Send message icon',
  'edit': 'Edit message icon',
  'delete': 'Delete message icon',
  'reply': 'Reply to message icon',
  'react': 'React/emoji icon',
  'more': 'More options icon',
  
  // Chat actions
  'call': 'Start call icon',
  'video': 'Start video call icon',
  'attach': 'Attach file icon',
  'emoji': 'Emoji/sticker picker icon',
  'settings': 'Settings icon',
  'search': 'Search icon',
  'add': 'Add/plus icon',
  
  // User actions
  'mute': 'Mute notifications icon',
  'unmute': 'Unmute notifications icon',
  'block': 'Block user icon',
  'unblock': 'Unblock user icon',
  'remove': 'Remove user icon',
  'invite': 'Invite user icon',
  
  // Password/Security
  'password-show': 'Show password icon',
  'password-hide': 'Hide password icon',
  'lock': 'Lock icon',
  'unlock': 'Unlock icon',
  
  // Navigation
  'back': 'Back/go back icon',
  'close': 'Close icon',
  'menu': 'Menu icon',
  'sidebar-toggle': 'Sidebar toggle icon',
  'expand': 'Expand icon',
  'collapse': 'Collapse icon',
  
  // Status
  'online': 'Online status icon',
  'offline': 'Offline status icon',
  'away': 'Away status icon',
  'busy': 'Busy/do not disturb icon',
  
  // Notifications
  'notification': 'Notification icon',
  'notification-read': 'Read notification icon',
  'notification-unread': 'Unread notification icon',
  'bell': 'Bell/notifications icon',
  
  // Media
  'image': 'Image icon',
  'camera': 'Camera icon',
  'microphone': 'Microphone icon',
  'speaker': 'Speaker icon',
  'mute-audio': 'Mute audio icon',
  'unmute-audio': 'Unmute audio icon',
  
  // File operations
  'download': 'Download icon',
  'upload': 'Upload icon',
  'share': 'Share icon',
  'copy': 'Copy icon',
  'paste': 'Paste icon',
  'cut': 'Cut icon',
  
  // Admin
  'crown': 'Admin/crown icon',
  'shield': 'Verified/shield icon',
  
  // General
  'loading': 'Loading/spinner icon',
  'error': 'Error icon',
  'success': 'Success/checkmark icon',
  'warning': 'Warning icon',
  'info': 'Info icon',
  'help': 'Help/question icon',
} as const;

export type IconName = keyof typeof CUSTOMIZABLE_ICONS;
