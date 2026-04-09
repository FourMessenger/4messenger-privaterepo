# Premium Modern Theme - Complete Icon & Main Screen Customization

## Overview

The **Premium Modern Theme** demonstrates a comprehensive approach to theming 4 Messenger including:
- ✅ **Custom SVG Icons** - Replace all default icons with themed ones
- ✅ **Main Screen Styling** - Customize the entire chat interface layout
- ✅ **Component Customization** - All buttons, inputs, cards, messages styled
- ✅ **Icon & UI Integration** - Icon registry system for dynamic icon replacement

## What's New in This Version

### 1. Icon Customization System

Themes can now include custom SVG icons that automatically replace default Lucide React icons throughout the app.

**Supported Icon Placeholders:**

```
Message Actions:
  send            - Send message button
  edit            - Edit message icon
  delete          - Delete message icon
  reply           - Reply to message icon
  react           - React/emoji reaction icon
  more            - More options menu icon

Chat Controls:
  call            - Voice call icon
  video           - Video call icon
  attach          - Attach file icon
  emoji           - Emoji/sticker picker icon
  settings        - Settings/options icon
  search          - Search icon
  add             - Add/plus/create new icon
  mute            - Mute notifications icon

Security:
  password-show   - Show password eye icon
  password-hide   - Hide password crossed-eye icon

Navigation:
  back            - Go back icon
  close           - Close/X icon
  menu            - Menu/hamburger icon

Status Indicators:
  online          - Online status dot icon
  offline         - Offline status icon
  away            - Away status icon
  busy            - Do not disturb icon

Notifications:
  notification    - Generic notification icon
  bell            - Bell icon for notifications
  
Media:
  image           - Image/photo icon
  camera          - Camera icon
  microphone      - Microphone icon

Admin:
  crown           - Admin/moderator icon
  shield          - Verified/shield icon

And more!
```

### 2. Main Screen Styling

Themes can now customize the entire chat interface:

**Header Styles** (`mainscreen-styles`):
- Header height and padding
- Header background color
- Action button styling
- Title and subtitle appearance

**Sidebar Styles**:
- Sidebar width and background
- Chat item appearance
- Active chat indicator
- Unread badge styling
- Avatar styling in list

**Chat Area**:
- Messages container styling
- Message spacing
- Loading and empty states

**Input Area**:
- Input field appearance
- Send button styling
- Action buttons (emoji, attach, etc.)
- Input field border and focus states

**Example CSS Variables:**

```css
:root {
  /* Sidebar */
  --mainscreen-sidebar-width: 280px;
  --mainscreen-sidebar-bg: #f9fafb;
  --mainscreen-sidebar-item-hover-bg: rgba(99, 102, 241, 0.08);
  
  /* Header */
  --mainscreen-header-height: 60px;
  --mainscreen-header-bg: #ffffff;
  --mainscreen-header-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  /* Input */
  --mainscreen-input-field-bg: #ffffff;
  --mainscreen-input-field-radius: 12px;
}
```

### 3. Icon Registry Integration

The theme system now includes an **Icon Registry** that:
- Extracts SVG icons from theme packages
- Automatically registers themed icons
- Makes icons available to components
- Restores default icons when theme is removed

**Usage in Components:**

```typescript
import { getThemedIconUrl } from './utils/iconRegistry';

// Check if theme has a custom icon
const sendIconUrl = getThemedIconUrl('send');

if (sendIconUrl) {
  // Use themed icon as <img> or background-image
  return <img src={sendIconUrl} alt="Send" />;
} else {
  // Fall back to default Lucide icon
  return <Send />;
}
```

## Premium Modern Theme Contents

### Directory Structure

```
manifest.json
styles/
  ├── mainscreen.css      - Main chat UI styling (NEW!)
  ├── primary.css         - Root colors and typography
  ├── buttons.css         - All button styles
  ├── inputs.css          - Form inputs and controls
  ├── text.css            - Typography utilities
  ├── cards.css           - Cards and containers
  ├── notifications.css   - Toasts and modals
  ├── avatars.css         - User avatars and profiles
  └── messages.css        - Chat messages and reactions
icons/
  ├── send.svg            - Send message icon
  ├── edit.svg            - Edit message icon
  ├── delete.svg          - Delete message icon
  ├── reply.svg           - Reply to message icon
  ├── more.svg            - More options icon
  ├── call.svg            - Voice call icon
  ├── video.svg           - Video call icon
  ├── attach.svg          - Attach file icon
  ├── emoji.svg           - Emoji picker icon
  ├── settings.svg        - Settings icon
  ├── search.svg          - Search icon
  ├── add.svg             - Add/create new icon
  ├── mute.svg            - Mute notifications icon
  ├── password-show.svg   - Show password icon
  └── password-hide.svg   - Hide password icon
images/
  ├── background.png      - App background image
  └── logo.png           - App logo
```

### File Sizes

- **Total package**: 21 KB
- **CSS files**: 57 KB (9 files)
- **SVG icons**: 4.8 KB (15 icons)
- **Images**: ~141 bytes (2 files)
- **Manifest**: 2.4 KB

## How Themes Can Customize Icons

### Creating Custom Icons

1. **Create SVG files** with your custom designs:
```xml
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M12 5v14M5 12h14"/><!-- Plus icon -->
</svg>
```

2. **Add to manifest.json** with `type: "svg"`:
```json
{
  "send-icon": { "path": "icons/send.svg", "type": "svg" },
  "edit-icon": { "path": "icons/edit.svg", "type": "svg" }
}
```

3. **Icons automatically become available** via the Icon Registry

### Using CSS Variables for Icons

Icons are exposed as CSS variables:
```css
.send-button::before {
  content: '';
  display: block;
  width: 24px;
  height: 24px;
  background-image: var(--theme-icon-send);
  background-size: contain;
}
```

## Main Screen Customization Examples

### Example 1: Change Header Styling
```css
.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px 20px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.chat-header-title h2 {
  color: white;
  font-size: 18px;
  font-weight: 700;
}
```

### Example 2: Change Sidebar Width
```css
:root {
  --mainscreen-sidebar-width: 320px; /* Wider */
}

.sidebar-item {
  height: 48px; /* Shorter items */
  padding: 4px 8px;
}
```

### Example 3: Dark Theme Main Screen
```css
:root {
  --mainscreen-sidebar-bg: #1f2937;
  --mainscreen-chat-bg: #111827;
  --mainscreen-header-bg: #1f2937;
  --mainscreen-input-field-bg: #374151;
}

.chat-header, .sidebar {
  border-color: #374151;
}

.sidebar-item {
  color: #e5e7eb;
}
```

### Example 4: Modern Rounded Design
```css
:root {
  --mainscreen-input-field-radius: 24px;
  --mainscreen-sidebar-item-radius: 12px;
  --mainscreen-input-button-radius: 12px;
}

.sidebar {
  border-radius: 16px;
  margin: 8px;
}
```

## Applying the Premium Modern Theme

### Steps:

1. **Open 4 Messenger**
2. **Go to Settings → Themes**
3. **Click "Import Theme"**
4. **Select**: `theme-packages/premium-modern-theme.4mth`
5. **Enjoy!** All components and icons are styled

### What Changes:

- ✅ Header styling and appearance
- ✅ Sidebar width and colors
- ✅ Chat message bubbles
- ✅ Input field and send button
- ✅ All buttons throughout app
- ✅ Form inputs and validation states
- ✅ Text styling and typography
- ✅ Cards, alerts, badges
- ✅ Modals and notifications
- ✅ User avatars and profiles
- ✅ **15 Custom Icons** display instead of defaults
- ✅ **Main chat UI adapts** to theme colors

## Creating Your Own Icon & Main Screen Theme

### Minimal Structure

```json
{
  "name": "My Custom Theme",
  "version": "1.0.0",
  "placeholders": {
    "mainscreen-styles": {
      "path": "styles/mainscreen.css",
      "type": "mainscreen"
    },
    "primary-styles": {
      "path": "styles/primary.css",
      "type": "css"
    },
    "send-icon": {
      "path": "icons/send.svg",
      "type": "svg"
    }
  }
}
```

### Start Simple

1. **Copy this theme as a template**
2. **Modify colors in `primary.css`**
3. **Adjust layout in `mainscreen.css`**
4. **Replace icons as desired**
5. **Test in Settings → Themes**

## Customizable Main Screen Elements

| Element | CSS Class | Variable |
|---------|-----------|----------|
| Header | `.chat-header` | `--mainscreen-header-*` |
| Header Actions | `.chat-header-action` | `--mainscreen-header-gap` |
| Sidebar | `.sidebar` | `--mainscreen-sidebar-*` |
| Sidebar Items | `.sidebar-item` | `--mainscreen-sidebar-item-*` |
| Sidebar Avatar | `.sidebar-item-avatar` | None |
| Chat Area | `.chat-messages` | `--mainscreen-chat-padding` |
| Input Field | `.chat-input-field` | `--mainscreen-input-field-*` |
| Send Button | `.chat-send-button` | `--color-primary` |
| Input Actions | `.chat-input-action` | `--mainscreen-input-button-*` |

## Advanced Features

### Icon Naming

Icons in the manifest are automatically registered with normalized names:
- `send-icon` → registered as `send`
- `edit-icon` → registered as `edit`
- `password-show-icon` → registered as `password-show`

### Dark Mode Support

The main screen CSS includes dark mode media queries:
```css
@media (prefers-color-scheme: dark) {
  :root {
    --mainscreen-sidebar-bg: #1f2937;
    --mainscreen-chat-bg: #111827;
  }
}
```

### Responsive Design

Main screen is mobile-responsive:
- Sidebar becomes horizontal bar on mobile
- Chat takes full width on small screens
- Touch-friendly button sizes

### CSS Variables Cascade

All component CSS files inherit main color variables:
```css
/* Set once in primary.css */
:root { --color-primary: #6366f1; }

/* Used everywhere */
.button { background-color: var(--color-primary); }
.message-bubble { color: var(--color-primary); }
.sidebar-item.active { background-color: var(--color-primary); }
```

## Testing Your Theme

**Create a test .4mth file:**

```bash
mkdir my-theme/styles my-theme/icons
cp your-styles/*.css my-theme/styles/
cp your-icons/*.svg my-theme/icons/
cp manifest.json my-theme/
cd ..
zip -r my-theme.4mth my-theme/
```

**In 4 Messenger:**
1. Settings → Themes → Import
2. Select `my-theme.4mth`
3. Verify all components update
4. Check main screen UI changes

## Troubleshooting

### Icons not showing?
- Check icon file names match manifest paths
- Verify SVG syntax is valid
- View console for load errors

### Main screen not styled?
- Verify `mainscreen-styles` placeholder in manifest
- Check CSS selectors match actual DOM classes
- Use browser DevTools to inspect styling

### Colors not applying?
- Check CSS variable names match
- Verify base64 image URLs are valid
- Check for CSS specificity conflicts

## Performance Notes

- SVG icons are base64-encoded (lightweight)
- CSS is minified in production builds
- Icons load with theme (no extra requests)
- Main screen styles apply instantly
- Total overhead: ~21 KB for full theme

## File Format Reference

### SVG Files
- Must be valid SVG XML
- Use `currentColor` for dynamic coloring
- Viewbox should be `0 0 24 24` (standard)
- Keep file size small (<1KB each)

### CSS Files
- Can use CSS variables defined in primary.css
- Supports dark mode media queries
- Responsive design with media queries
- Can use @keyframes animations

### Manifest
- Valid JSON format
- All paths must exist in ZIP
- Type must be 'svg', 'css', 'mainscreen', or 'image'
- Optional: author, description, version

