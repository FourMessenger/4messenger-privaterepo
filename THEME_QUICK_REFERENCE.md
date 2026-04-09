# Theme System - Quick Reference & Index

## 📚 Documentation Index

### For Users 👥
Want to use or create themes? Start here:

1. **[THEME_SYSTEM_OVERVIEW.md](THEME_SYSTEM_OVERVIEW.md)**
   - What the theme system can do
   - How it works fundamentally
   - Available icon names
   - Component customization options
   - **Start here for understanding**

2. **[PREMIUM_THEME_GUIDE.md](PREMIUM_THEME_GUIDE.md)**
   - Premium Modern Theme features
   - Main screen customization examples
   - Icon customization guide
   - How to create your own themes
   - Troubleshooting

### For Developers 👨‍💻
Integrating themes into components? Use these:

1. **[ICON_REGISTRY_GUIDE.md](ICON_REGISTRY_GUIDE.md)**
   - Icon registry API reference
   - Component integration examples
   - How to add theme-aware icons to components
   - Helper hooks and patterns
   - Performance notes

2. **[THEME_IMPLEMENTATION_GUIDE.md](THEME_IMPLEMENTATION_GUIDE.md)**
   - Code changes made to the system
   - File modifications (store.ts, themeManager.ts)
   - New iconRegistry.ts details
   - Theme manifest format
   - Testing checklist

---

## 🎨 Premium Modern Theme

### Status: ✅ Complete & Ready to Use

**File:** `theme-packages/premium-modern-theme.4mth` (21 KB)

**Includes:**
- ✅ 9 CSS files (57 KB total)
- ✅ 15 custom SVG icons
- ✅ Main screen customization (10 KB CSS)
- ✅ Component styling (buttons, inputs, cards, etc.)
- ✅ Responsive design
- ✅ Dark mode support

**To Use:**
1. Settings → Themes → Import
2. Select: `theme-packages/premium-modern-theme.4mth`
3. Done!

---

## 🛠️ Core System Files

### New Files
```
src/utils/iconRegistry.ts (120 lines)
  - registerThemeIcons()
  - getThemedIconUrl()
  - clearThemeIcons()
  - getAllThemedIcons()
  - 40+ icon name constants
```

### Modified Files
```
src/utils/themeManager.ts
  ✓ Added SVG type support
  ✓ Added mainscreen CSS type
  ✓ Enhanced loadThemeFile()
  ✓ Enhanced applyTheme()

src/store.ts
  ✓ Added icon registry imports
  ✓ Updated loadTheme() to register icons
  ✓ Updated applyLoadedTheme() to register icons
  ✓ Updated unloadTheme() to clear icons
  ✓ Updated restoreThemeOnStartup() to restore icons
```

---

## 📖 API Quick Reference

### Icon Registry

```typescript
// Import
import { 
  registerThemeIcons,
  getThemedIconUrl,
  clearThemeIcons,
  getAllThemedIcons,
  type IconName
} from './utils/iconRegistry';

// Register icons (automatic in store)
registerThemeIcons({
  'send': 'data:image/svg+xml;base64,...',
  'edit': 'data:image/svg+xml;base64,...'
});

// Get icon URL for a component
const sendIconUrl = getThemedIconUrl('send');
// Returns: 'data:image/svg+xml;base64,...' or undefined

// Clear all icons
clearThemeIcons();

// Debug: see all registered icons
const allIcons = getAllThemedIcons();
```

### Available Icon Names (40+)

```
send, edit, delete, reply, react, more,
call, video, attach, emoji, settings, search, add, mute,
password-show, password-hide, lock, unlock,
back, close, menu, sidebar-toggle, expand, collapse,
online, offline, away, busy,
notification, notification-read, notification-unread, bell,
image, camera, microphone, speaker, mute-audio, unmute-audio,
download, upload, share, copy, paste, cut,
crown, shield,
loading, error, success, warning, info, help
```

---

## 🎯 Common Tasks

### Task: Add themed icon to component

```typescript
// 1. Import the function
import { getThemedIconUrl } from './utils/iconRegistry';
import { Send } from 'lucide-react';

// 2. Get the icon URL
const iconUrl = getThemedIconUrl('send');

// 3. Render with fallback
{iconUrl ? (
  <img src={iconUrl} alt="Send" className="w-6 h-6" />
) : (
  <Send className="w-6 h-6" />
)}
```

### Task: Customize main screen layout

1. Edit `premium-mainscreen-styles.css`
2. Modify CSS variables (--mainscreen-*)
3. Package as new theme in .4mth
4. Import and test

### Task: Create custom icon for theme

```xml
<!-- my-icon.svg -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M12 5v14M5 12h14"/>  <!-- Plus icon →
</svg>
```

Add to manifest:
```json
{
  "my-icon": {
    "path": "icons/my-icon.svg",
    "type": "svg"
  }
}
```

### Task: Create a complete theme

1. Copy premium theme as template
2. Modify colors in `primary.css`
3. Adjust layout in `mainscreen.css`
4. Create custom SVG icons
5. Update manifest with placeholders
6. Package: `zip -r my-theme.4mth .`
7. Import in Settings → Themes

---

## 🚀 Features Summary

### Three Levels of Customization

**Level 1: Component CSS** ✅
- 8 CSS categories
- Colors, typography, spacing, states
- Buttons, inputs, cards, messages, etc.

**Level 2: Layout/Main Screen** ✅
- Header styling and layout
- Sidebar sizing and appearance
- Chat area spacing and styling
- Input field customization
- Responsive mobile design

**Level 3: Custom Icons** ✅
- 40+ customizable icon names
- SVG format (scalable)
- Dynamic runtime replacement
- CSS variable integration
- Fallback to default icons

---

## 📊 System Architecture

```
Theme Package (.4mth)
    ↓
Manifest (19 placeholders)
    ↓
Theme Manager (load & process files)
    ├─ CSS → Inject into <style>
    ├─ SVG → Convert to data URL + Register
    └─ Images → Apply to DOM
    ↓
Store (Zustand)
    ├─ Load theme
    ├─ Apply CSS/images/icons
    └─ Register theme icons
    ↓
Icon Registry (Memory)
    └─ Store: icon name → SVG URL
    ↓
Components
    ├─ Call getThemedIconUrl('send')
    ├─ Display themed icon if available
    └─ Fallback to Lucide if not
```

---

## 📝 Manifest Format

```json
{
  "name": "Theme Name",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Theme description",
  "placeholders": {
    "placeholder-name": {
      "path": "relative/path/to/file",
      "type": "css|image|svg|mainscreen"
    }
  }
}
```

**Types:**
- `css` - CSS file (inject into document)
- `image` - Image file (PNG, JPG)
- `svg` - SVG icon file (convert to data URL)
- `mainscreen` - CSS file for main chat UI layout

---

## 🧪 Testing

### Verify Theme Loads
```bash
cd theme-packages
unzip -l premium-modern-theme.4mth
# Should show: 30 files
# CSS files (9), Icons (15), Images (2), manifest.json
```

### Verify Icons Register
```typescript
import { getAllThemedIcons } from './utils/iconRegistry';
console.log(getAllThemedIcons());
// Should show: { send: 'data:image/svg+xml...', edit: ..., ... }
```

### Verify CSS Variables
```javascript
// In browser console
const root = document.documentElement;
console.log(getComputedStyle(root).getPropertyValue('--theme-icon-send'));
console.log(getComputedStyle(root).getPropertyValue('--mainscreen-sidebar-width'));
```

---

## 🐛 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Icons show broken image | Invalid data URL | Check SVG syntax, verify base64 encoding |
| Main screen not styled | CSS selectors don't match | Check DOM classes in components match CSS |
| Icons don't update | getThemedIconUrl() called before load | Ensure component re-renders after store updates |
| Theme not loading | Invalid manifest format | Validate JSON syntax, check all paths exist |
| CSS not applying | Specificity conflicts | Use `:root` scope, avoid inline styles |

---

## 📦 Available Themes

### Included Packages

1. **premium-modern-theme.4mth** ⭐
   - Size: 21 KB
   - Features: ALL (icons, mainscreen, components)
   - Status: Complete & tested

2. **deep-ocean.4mth**
   - Size: 1.7 KB
   - Features: Colors, components
   - Theme: Dark cyberpunk

3. **minimalist-light.4mth**
   - Size: 3.0 KB
   - Features: Colors, components
   - Theme: Light professional

4. **cozy-warm.4mth**
   - Size: 3.0 KB
   - Features: Colors, components
   - Theme: Warm inviting

---

## 🔗 File Locations

### Code Files
- Icon Registry: `src/utils/iconRegistry.ts`
- Theme Manager: `src/utils/themeManager.ts`
- Store: `src/store.ts`

### Theme Packages
- Location: `theme-packages/`
- Premium Theme: `theme-packages/premium-modern-theme.4mth`

### Documentation
- Overview: `THEME_SYSTEM_OVERVIEW.md`
- User Guide: `PREMIUM_THEME_GUIDE.md`
- Dev Guide: `ICON_REGISTRY_GUIDE.md`
- Implementation: `THEME_IMPLEMENTATION_GUIDE.md`
- This File: `THEME_QUICK_REFERENCE.md`

---

## 💡 Key Concepts

### Icon Registry
- In-memory store of icon name → SVG URL mappings
- Populated when theme loads
- Accessed by components via `getThemedIconUrl()`
- Cleared when theme unloads
- Enables dynamic icon replacement

### Theme Manifest
- JSON file defining all theme placeholders
- Maps placeholder names to file paths
- Specifies file types (css, svg, image, mainscreen)
- Single source of truth for theme contents

### CSS Variables
- Used for theming colors, sizes, spacing
- Cascade to all components
- Can be overridden at any level
- Standard CSS (no custom logic)

### SVG Data URLs
- SVG files converted to base64 strings
- Prefixed with "data:image/svg+xml;base64,"
- Can be used as img src or CSS background-image
- Self-contained (no external requests)

---

## ✅ Checklist: Creating a Theme

- [ ] Create `manifest.json`
- [ ] Create `styles/` directory
- [ ] Add CSS files (primary.css at minimum)
- [ ] Create `icons/` directory (optional)
- [ ] Add SVG icon files (optional)
- [ ] Create `images/` directory (optional)
- [ ] Add image files (optional)
- [ ] Test manifest.json is valid JSON
- [ ] Verify all file paths exist
- [ ] Create .4mth ZIP package
- [ ] Test theme imports successfully
- [ ] Verify components are styled
- [ ] Check icons display correctly

---

## 🎓 Learning Path

1. **Understand the System** → Read `THEME_SYSTEM_OVERVIEW.md`
2. **Learn Premium Theme** → Read `PREMIUM_THEME_GUIDE.md`
3. **Integrate Icons** → Read `ICON_REGISTRY_GUIDE.md`
4. **Deep Dive** → Read `THEME_IMPLEMENTATION_GUIDE.md`
5. **Try It Out** → Create a custom theme
6. **Reference** → Use this quick reference

---

## 🤝 Contributing

### Report Issues with Themes
- Check console for errors
- Verify manifest.json is valid
- Check all file paths exist
- Share theme file for debugging

### Create Custom Themes
- Base on premium-modern-theme
- Share via pull request
- Include documentation
- Provide preview/description

### Suggest Improvements
- More customizable icons?
- More CSS selectors?
- Better defaults?
- Submit an issue

---

## 📞 Quick Help

**How do I use themes?**
→ Settings → Themes → Import `*.4mth` file

**How do I create themes?**
→ Start with `PREMIUM_THEME_GUIDE.md`

**How do I add icons to components?**
→ Follow examples in `ICON_REGISTRY_GUIDE.md`

**How does this work technically?**
→ Read `THEME_IMPLEMENTATION_GUIDE.md`

**Where's the code?**
→ `src/utils/iconRegistry.ts` and `src/store.ts`

**Where are the themes?**
→ `theme-packages/` directory

**What can I customize?**
→ See `THEME_SYSTEM_OVERVIEW.md` for full list

---

## 🎉 You're All Set!

The theme system is complete and ready to use. Start with the Premium Modern Theme, then create your own custom themes!

**Next Steps:**
1. Load `premium-modern-theme.4mth` in Settings
2. Explore the customization options
3. Create your own theme by modifying colors/icons
4. Share with the community!

Happy theming! 🚀

