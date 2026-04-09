# Icon Registry & Theme Integration Guide

## Quick Reference

The icon registry allows components to display custom themed icons instead of hardcoded Lucide React icons.

## Core Functions

### `registerThemeIcons(iconMap: Record<string, string>)`

Register SVG icons from a theme. Automatically called when themes load.

```typescript
import { registerThemeIcons } from './utils/iconRegistry';

// Called automatically in store.ts, but can be called manually:
registerThemeIcons({
  'send': 'data:image/svg+xml;base64,PHN2Z...',
  'edit': 'data:image/svg+xml;base64,PHN2Z...'
});
```

### `getThemedIconUrl(iconName: IconName): string | undefined`

Get the URL for a themed icon, or undefined if default should be used.

```typescript
import { getThemedIconUrl } from './utils/iconRegistry';

const sendIconUrl = getThemedIconUrl('send');

if (sendIconUrl) {
  return <img src={sendIconUrl} alt="Send" className="w-6 h-6" />;
}

// Fall back to Lucide icon
return <Send className="w-6 h-6" />;
```

### `clearThemeIcons()`

Clear all registered theme icons. Automatically called when theme is unloaded.

```typescript
import { clearThemeIcons } from './utils/iconRegistry';

clearThemeIcons();
```

### `getAllThemedIcons(): Record<string, string>`

Get all currently registered themed icons.

```typescript
import { getAllThemedIcons } from './utils/iconRegistry';

const icons = getAllThemedIcons();
console.log(Object.keys(icons)); // ['send', 'edit', 'delete', ...]
```

## Icon Names

Available icon placeholder names:

```typescript
type IconName = 
  | 'send' | 'edit' | 'delete' | 'reply' | 'react' | 'more'
  | 'call' | 'video' | 'attach' | 'emoji' | 'settings' | 'search' | 'add'
  | 'mute' | 'unmute' | 'block' | 'unblock' | 'remove' | 'invite'
  | 'password-show' | 'password-hide' | 'lock' | 'unlock'
  | 'back' | 'close' | 'menu' | 'sidebar-toggle' | 'expand' | 'collapse'
  | 'online' | 'offline' | 'away' | 'busy'
  | 'notification' | 'notification-read' | 'notification-unread' | 'bell'
  | 'image' | 'camera' | 'microphone' | 'speaker' | 'mute-audio' | 'unmute-audio'
  | 'download' | 'upload' | 'share' | 'copy' | 'paste' | 'cut'
  | 'crown' | 'shield'
  | 'loading' | 'error' | 'success' | 'warning' | 'info' | 'help';
```

## Component Integration Examples

### Example 1: Send Button Icon

**Before (Lucide only):**
```typescript
import { Send } from 'lucide-react';

export function SendButton() {
  return (
    <button className="send-btn">
      <Send className="w-6 h-6" />
      Send
    </button>
  );
}
```

**After (Theme-aware):**
```typescript
import { Send } from 'lucide-react';
import { getThemedIconUrl } from './utils/iconRegistry';

export function SendButton() {
  const sendIconUrl = getThemedIconUrl('send');
  
  return (
    <button className="send-btn">
      {sendIconUrl ? (
        <img src={sendIconUrl} alt="Send" className="w-6 h-6" />
      ) : (
        <Send className="w-6 h-6" />
      )}
      Send
    </button>
  );
}
```

### Example 2: Message Actions (Edit, Delete, Reply)

```typescript
import { Edit2, Trash2, Reply } from 'lucide-react';
import { getThemedIconUrl } from './utils/iconRegistry';

export function MessageActions() {
  const editUrl = getThemedIconUrl('edit');
  const deleteUrl = getThemedIconUrl('delete');
  const replyUrl = getThemedIconUrl('reply');
  
  return (
    <div className="message-actions">
      <button>
        {editUrl ? (
          <img src={editUrl} alt="Edit" className="w-4 h-4" />
        ) : (
          <Edit2 className="w-4 h-4" />
        )}
      </button>
      
      <button>
        {deleteUrl ? (
          <img src={deleteUrl} alt="Delete" className="w-4 h-4" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
      
      <button>
        {replyUrl ? (
          <img src={replyUrl} alt="Reply" className="w-4 h-4" />
        ) : (
          <Reply className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
```

### Example 3: Security Icons (Show/Hide Password)

```typescript
import { Eye, EyeOff } from 'lucide-react';
import { getThemedIconUrl } from './utils/iconRegistry';

export function PasswordToggle({ isVisible, onToggle }: Props) {
  const showUrl = getThemedIconUrl('password-show');
  const hideUrl = getThemedIconUrl('password-hide');
  const iconUrl = isVisible ? hideUrl : showUrl;
  
  return (
    <button onClick={onToggle} className="password-toggle">
      {iconUrl ? (
        <img src={iconUrl} alt={isVisible ? 'Hide' : 'Show'} className="w-5 h-5" />
      ) : (
        isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />
      )}
    </button>
  );
}
```

### Example 4: Multiple Icons (Call Settings)

```typescript
import { Phone, Video, Settings } from 'lucide-react';
import { getThemedIconUrl } from './utils/iconRegistry';

export function CallControls() {
  const icons = {
    call: getThemedIconUrl('call'),
    video: getThemedIconUrl('video'),
    settings: getThemedIconUrl('settings')
  };
  
  const IconComponent = ({ name, lucideIcon }: any) => {
    const url = icons[name];
    return url ? (
      <img src={url} alt={name} className="w-6 h-6" />
    ) : (
      lucideIcon
    );
  };
  
  return (
    <div className="call-controls">
      <button>
        <IconComponent name="call" lucideIcon={<Phone />} />
      </button>
      <button>
        <IconComponent name="video" lucideIcon={<Video />} />
      </button>
      <button>
        <IconComponent name="settings" lucideIcon={<Settings />} />
      </button>
    </div>
  );
}
```

## CSS Variable Integration

For components using CSS background-image instead of img tags:

```css
/* Component uses these variables */
.send-button::before {
  content: '';
  background-image: var(--theme-icon-send);
  background-size: contain;
  background-repeat: no-repeat;
  width: 24px;
  height: 24px;
}

.edit-button::before {
  background-image: var(--theme-icon-edit);
}

.delete-button::before {
  background-image: var(--theme-icon-delete);
}
```

The store automatically registers SVG icons as CSS variables:
```css
--theme-icon-send
--theme-icon-edit
--theme-icon-delete
--theme-icon-reply
--theme-icon-more
/* etc. */
```

## Store Integration

The icon registry is automatically integrated with Zustand store:

1. **When theme loads** → `registerThemeIcons()` called in `loadTheme()` action
2. **When theme applies** → Icons registered in `applyLoadedTheme()` action
3. **When theme unloads** → `clearThemeIcons()` called in `unloadTheme()` action
4. **On app startup** → Icons restored from saved theme in `restoreThemeOnStartup()` action

**No additional integration needed** - just call `getThemedIconUrl()` in components.

## Helper Hook (Optional)

Create a convenience hook for easier usage:

```typescript
// hooks/useThemedIcon.ts
import { getThemedIconUrl } from '../utils/iconRegistry';
import type { ComponentType } from 'react';

export function useThemedIcon(
  iconName: string,
  LucideIcon: ComponentType<any>,
  className?: string
) {
  const themedUrl = getThemedIconUrl(iconName as any);
  
  if (themedUrl) {
    return <img src={themedUrl} alt={iconName} className={className} />;
  }
  
  return <LucideIcon className={className} />;
}
```

**Usage:**
```typescript
import { Send } from 'lucide-react';
import { useThemedIcon } from './hooks/useThemedIcon';

export function SendButton() {
  const SendIcon = useThemedIcon('send', Send, 'w-6 h-6');
  
  return <button>{SendIcon}</button>;
}
```

## Creating Icons for Themes

### Basic SVG Template

```xml
<!-- send.svg -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.6563168,11.6889879 L4.13399899,1.16151496 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4429026 C0.994623095,1.97881203 0.837654327,3.0686292 1.15159189,3.99 L3.03521743,10.4309931 C3.03521743,10.5880905 3.19218622,10.5880905 3.50612381,10.5880905 L16.6915026,11.3735774 C16.6915026,11.3735774 17.1624089,11.3735774 17.1624089,11.8448695 L17.1624089,11.8448695 C17.1624089,12.3161616 16.6915026,12.4744748 16.6915026,12.4744748 Z"/>
</svg>
```

### Icon Design Principles

1. **Use `viewBox="0 0 24 24"`** - Standard for consistent scaling
2. **Use `stroke="currentColor"`** - Inherits text color for theming
3. **Use `stroke-width="2"`** - Standard line weight
4. **Keep <2KB** - Optimize for web
5. **Remove fills** - Use strokes for flexibility
6. **Test at multiple sizes** - 16px, 24px, 32px, 48px

### Icon Export

Use any SVG editor (Inkscape, Figma, etc.):
1. Design icon at 24x24
2. Export as SVG
3. Clean up: minify, remove metadata
4. Add to theme's `icons/` directory
5. Reference in manifest.json

## Theme Creator Checklist

- [ ] Create icon placeholder names in manifest
- [ ] Create corresponding SVG files
- [ ] Create mainscreen.css for layout
- [ ] Create primary.css with colors
- [ ] Create component CSS files (buttons, inputs, etc.)
- [ ] Test icons load in Settings → Themes
- [ ] Test main screen layout responsiveness
- [ ] Package as .4mth file
- [ ] Document custom icon names
- [ ] Test on both desktop and mobile

## Debugging

### Check Registered Icons

```typescript
import { getAllThemedIcons } from './utils/iconRegistry';

const icons = getAllThemedIcons();
console.log('Themed icons:', Object.keys(icons));
```

### Monitor Theme Loading

```typescript
import { useStore } from './store';

export function DebugTheme() {
  const { currentTheme, themeCss } = useStore();
  
  return (
    <div>
      <p>Current theme: {currentTheme}</p>
      <p>CSS loaded: {Object.keys(themeCss).length} files</p>
    </div>
  );
}
```

### Verify Icon URLs

```typescript
import { getThemedIconUrl } from './utils/iconRegistry';

console.log('Send icon:', getThemedIconUrl('send'));
console.log('Edit icon:', getThemedIconUrl('edit'));
```

## Performance Considerations

- Icons are cached in memory (no reload on access)
- SVG data URLs avoid extra HTTP requests
- Total icon registry overhead: ~10KB
- CSS variables prevent re-renders
- Fallback to Lucide is instant

## Migration Path

**For existing components:**
1. Import `getThemedIconUrl` alongside Lucide icon
2. Check for themed URL first
3. Fallback to Lucide component
4. No breaking changes to existing functionality
5. Gradual adoption - update one component at a time

