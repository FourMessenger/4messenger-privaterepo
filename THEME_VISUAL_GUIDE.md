# Theme System - Visual Guide & Checklist

## Quick Start Checklist

### For Users Who Want to Use Themes

- [ ] Update 4 Messenger to the latest version
- [ ] Open Settings (⚙️ icon)
- [ ] Click "Themes" tab
- [ ] Click "Import Theme"
- [ ] Select a `.4mth` file
- [ ] See your theme applied immediately!
- [ ] To remove theme, click the ❌ button on the theme card

### For Theme Creators

#### Planning Phase
- [ ] Decide on color scheme and style
- [ ] Plan CSS customizations
- [ ] Prepare any background images (optimize to < 300KB each)
- [ ] Prepare logo/icon images if needed

#### Creation Phase
- [ ] Create a folder: `my-awesome-theme/`
- [ ] Create `manifest.json` with:
  - [ ] `name` - Theme name
  - [ ] `version` - Version number (e.g., "1.0.0")
  - [ ] `author` - Your name
  - [ ] `description` - What your theme does
  - [ ] `placeholders` - List of CSS/image files
- [ ] Create `styles.css` with custom CSS
- [ ] Copy image files to folder if needed
- [ ] Organize files logically

#### Testing Phase
- [ ] ZIP all files together
- [ ] Rename to `.4mth` extension
- [ ] Import into 4 Messenger
- [ ] Test on different screen sizes
- [ ] Check colors contrast for readability
- [ ] Verify images load correctly
- [ ] Test on different browsers if possible

#### Distribution Phase
- [ ] Upload to file hosting (GitHub, Google Drive, etc.)
- [ ] Share link with others
- [ ] Collect feedback
- [ ] Iterate and improve!

## File Structure Example

```
my-awesome-theme.4mth
│
├── manifest.json ..................... Configuration file (REQUIRED)
│
├── styles.css ......................... Main stylesheet
│
├── assets/ ............................ Image folder
│   ├── background.png ................ Theme background
│   ├── logo.png ...................... App logo
│   └── pattern.svg ................... Background pattern
│
└── README.txt ......................... Optional: Creator notes
```

## manifest.json Template

Copy and modify this template:

```json
{
  "name": "Your Theme Name",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Brief description of what makes this theme special",
  "placeholders": {
    "main-styles": {
      "path": "styles.css",
      "type": "css"
    },
    "background-image": {
      "path": "assets/background.png",
      "type": "image"
    },
    "logo-image": {
      "path": "assets/logo.png",
      "type": "image"
    }
  }
}
```

## CSS Customization Guide

### Override Color Variables

```css
:root {
  --accent-color: #your-color;      /* Main accent */
  --chat-bg: #your-color;           /* Chat background */
}
```

### Style Message Containers

```css
.message-container {
  background: linear-gradient(135deg, #color1 0%, #color2 100%);
  border-left: 3px solid #accent;
  border-radius: 8px;
  padding: 12px;
}
```

### Add Animations

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.message-container {
  animation: slideIn 0.3s ease;
}
```

### Custom Typography

```css
body {
  font-family: 'Your Font', sans-serif;
  letter-spacing: 0.5px;
}

.message-text {
  font-weight: 500;
  line-height: 1.6;
}
```

## Testing Checklist

After importing your theme, verify:

- [ ] Colors look correct
- [ ] Text is readable (good contrast)
- [ ] Images load properly
- [ ] No visual glitches
- [ ] Works on mobile screen
- [ ] Works on desktop screen
- [ ] Messages display correctly
- [ ] Settings panel looks good
- [ ] Buttons are clickable and styled
- [ ] Animations are smooth (if included)

## Common Issues & Solutions

### ❌ Theme Not Loading

**Problem**: "Failed to load theme" error message

**Solutions**:
1. Check `manifest.json` is valid JSON (use jsonlint.com)
2. Verify all file paths in `manifest.json` match actual files
3. Ensure `.4mth` file is actually a ZIP (try opening with 7-Zip or unzip)
4. Check file extensions match exactly (case-sensitive on some systems)

### ❌ Styles Not Applying

**Problem**: CSS styles don't show up

**Solutions**:
1. Check CSS syntax (use CSS validator)
2. Verify selectors target correct elements
3. Try adding `!important` to overrides: `color: red !important;`
4. Open DevTools (F12) to inspect elements
5. Check for CSS conflicts with other styles

### ❌ Images Not Showing

**Problem**: Images appear as broken links

**Solutions**:
1. Verify image files are in the `.4mth` ZIP
2. Check file paths in `manifest.json` are correct
3. Try supported formats: PNG, JPG, GIF, WebP
4. Reduce image file size (< 300KB recommended)
5. Remove spaces from filenames

### ❌ Manifest Not Found

**Problem**: "manifest.json not found" error

**Solutions**:
1. Ensure `manifest.json` is in the root of the ZIP
2. Verify filename is exactly `manifest.json` (case-sensitive)
3. Don't put it in a subfolder
4. Recreate the ZIP with correct structure

## CSS Selectors Reference

Common selectors you can target:

```css
/* Main elements */
body, html { }
.chat-bg-default { }
.message-container { }
.message-text { }
.user-avatar { }

/* UI Components */
button { }
input, textarea { }
.sidebar { }
.active-chat { }

/* Theme-specific */
.accent-bg { }
.accent-text { }
.accent-border { }
```

## Image Size Recommendations

| Element | Recommended Size | Max Size |
|---------|-----------------|----------|
| Background | 1920x1080 | 300KB |
| Logo | 256x256 | 50KB |
| Pattern | 512x512 | 100KB |
| Icon | 128x128 | 20KB |

**Total theme size**: Keep under 500KB for best performance

## Distribution Tips

### Creating a Good Theme Package

1. **Include Documentation**
   - Add a `README.txt` or `ABOUT.md`
   - Explain what your theme customizes
   - Mention color scheme/inspiration

2. **Version Your Theme**
   - Use semantic versioning (1.0.0, 1.0.1, 1.1.0, 2.0.0)
   - Update when you improve it

3. **Optimize Files**
   - Compress images with TinyPNG or similar
   - Remove unused CSS
   - Minify if you're unsure

4. **Test Before Sharing**
   - Import and test yourself
   - Ask friends to try it
   - Get feedback and iterate

### Sharing Your Theme

1. **GitHub**
   - Create a repository
   - Include source files
   - Add releases with `.4mth` downloads

2. **Google Drive**
   - Upload `.4mth` file
   - Share link with others
   - Easy for casual sharing

3. **Community**
   - Share in 4 Messenger forums
   - Post in Discord/Telegram groups
   - Get feedback from community

4. **Personal Website**
   - Host theme files
   - Create theme showcase
   - Build a portfolio

## Example Themes

The project includes sample theme files:

- `example-theme-manifest.json` - Basic manifest structure
- `example-theme-styles.css` - CSS example with Deep Ocean theme
- Combine these to create a working theme!

## Need More Help?

1. **For Users**: Read `THEMES_QUICK_REFERENCE.md`
2. **For Creators**: Read `THEME_CREATOR_GUIDE.md`
3. **Implementation Details**: See `THEME_SYSTEM_IMPLEMENTATION.md`
4. **Community**: Join 4 Messenger forums for discussions

## Credits

Thank you for using and creating themes for 4 Messenger! Your creativity makes the platform better for everyone. 🎨
