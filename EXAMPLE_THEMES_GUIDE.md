# Example CSS Themes Guide

This directory includes three complete example themes to help you understand how to create custom themes for 4 Messenger. Each theme demonstrates different design approaches and CSS techniques.

## 🎨 Available Example Themes

### 1. Deep Ocean Theme ✨
**Files:**
- `example-theme-manifest.json`
- `example-theme-styles.css`

**Style:** Dark, modern, cyberpunk-inspired  
**Color Scheme:** Cool blues, teals, magentas  
**Best For:** Users who like dark mode with neon accents

**Key Features:**
- Deep dark backgrounds with ocean blues
- Glowing cyan accents with magenta highlights
- Smooth animations and transitions
- Box shadows for depth
- Scrollbar styling

**CSS Variables:**
```css
--ocean-dark: #0a1628
--ocean-light: #1a2f4a
--ocean-accent: #06b6d4 (cyan)
--ocean-secondary: #0ea5e9 (light blue)
```

---

### 2. Minimalist Light Theme 💡
**Files:**
- `example-minimalist-manifest.json`
- `example-minimalist-styles.css`

**Style:** Clean, minimal, modern  
**Color Scheme:** Light backgrounds with blue accents  
**Best For:** Users who prefer light, professional appearance

**Key Features:**
- Clean white backgrounds
- Subtle borders and shadows
- Blue accent color with good contrast
- Mobile-friendly responsive design
- Accessibility focused (focus states, keyboard navigation)
- Dark mode CSS media query included

**CSS Variables:**
```css
--primary: #f5f7fa (light gray background)
--secondary: #ffffff (white)
--accent-light: #3b82f6 (blue)
--text-primary: #1f2937 (dark gray text)
```

---

### 3. Cozy Warm Theme 🌰
**Files:**
- `example-cozy-manifest.json`
- `example-cozy-styles.css`

**Style:** Warm, inviting, comfortable  
**Color Scheme:** Earthy tones, warm browns, amber accents  
**Best For:** Users who like warm, welcoming atmosphere

**Key Features:**
- Warm cream backgrounds
- Earthy brown and tan tones
- Soft shadows and gradients
- Serif fonts for a cozy feel
- Italic timestamps
- Print-friendly styling
- Built-in dark mode variant

**CSS Variables:**
```css
--warm-bg: #faf5f0 (warm cream)
--warm-card: #fefbf7 (warm white)
--warm-accent: #d97706 (warm orange)
--warm-text: #5a4032 (warm brown)
```

---

## 📋 How to Use These Examples

### Option 1: Use Directly
```bash
# Copy the theme files
cp example-theme-manifest.json my-theme/manifest.json
cp example-theme-styles.css my-theme/styles.css

# ZIP them
zip -r my-theme.4mth manifest.json styles.css

# Import in 4 Messenger Settings → Themes
```

### Option 2: Customize an Example
1. Copy one of the example manifests and styles
2. Modify the CSS to your liking
3. Change font colors, sizes, spacing
4. Test in 4 Messenger
5. ZIP and share!

### Option 3: Learn from Examples
Read through the CSS files to understand:
- CSS variable organization
- How to style messages
- Button and input styling
- Animations and transitions
- Responsive design
- Accessibility practices

---

## 🎯 Key CSS Patterns in Examples

### 1. Color System
All examples use CSS variables for easy customization:

```css
:root {
  --primary: /* main background */
  --secondary: /* card/container background */
  --accent: /* highlight color */
  --text: /* main text color */
  --border: /* border color */
}
```

### 2. Message Container Styling
```css
.message-container {
  background: var(--secondary);
  border-left: 4px solid var(--accent);
  border-radius: 8px;
  padding: 12px 16px;
  transition: all 0.2s ease;
}

.message-container:hover {
  /* Enhanced style on hover */
}
```

### 3. Button Styling
```css
button {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  transition: all 0.2s ease;
}

button:hover {
  /* Slightly different styling */
  transform: translateY(-1px);
  box-shadow: /* enhanced shadow */;
}
```

### 4. Input Field Focus States
```css
input, textarea {
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

input:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(/* accent color */, 0.1);
}
```

### 5. Animations
Each example includes custom animations:

**Deep Ocean:**
```css
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
```

**Minimalist:**
Uses subtle, fast animations for modern feel

**Cozy:**
Uses smooth, bouncy animations for warmth (`cubic-bezier(0.34, 1.56, 0.64, 1)`)

### 6. Scrollbar Styling
```css
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent-darker);
}
```

### 7. Responsive Design
All examples include mobile-friendly CSS:

```css
@media (max-width: 768px) {
  .message-container {
    padding: 10px 12px;
    margin: 6px 0;
  }
  
  input, textarea {
    font-size: 16px; /* Prevents iOS zoom */
  }
}
```

### 8. Dark Mode Support
Most examples include dark mode variants:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --primary: #1f2937;
    --text: #f3f4f6;
    /* other variables */
  }
}
```

---

## 💡 Customization Ideas

### Change Colors
Find the CSS variables at the top and modify:
```css
:root {
  --accent-color: #your-color-here;
}
```

### Change Fonts
Replace the font-family values:
```css
body, html {
  font-family: 'Your Font', sans-serif;
}
```

### Increase/Decrease Spacing
Modify padding and margin values:
```css
.message-container {
  padding: 20px; /* increase from 12px */
  margin: 12px 0; /* increase from 8px */
}
```

### Modify Animations
Change animation duration and timing:
```css
@keyframes slideIn {
  /* ... */
}

.message-container {
  animation: slideIn 0.5s ease; /* was 0.3s */
}
```

### Add New Elements
Add styles for custom elements not shown:
```css
.my-custom-element {
  background: var(--secondary);
  padding: 12px;
  border-radius: 8px;
}
```

---

## 📚 Common Selectors to Target

### Messages
```css
.message-container { /* Main message box */ }
.message-text { /* Message content */ }
.message-time { /* Timestamp */ }
```

### UI Elements
```css
button { /* Buttons */ }
input, textarea { /* Input fields */ }
.sidebar { /* Left sidebar */ }
.active-chat { /* Selected chat highlight */ }
```

### Visual Accents
```css
.accent-bg { /* Background accent */ }
.accent-text { /* Text accent */ }
.accent-border { /* Border accent */ }
```

### Status Indicators
```css
.status-online { /* Online indicator */ }
.status-away { /* Away indicator */ }
.status-offline { /* Offline indicator */ }
```

---

## 🧪 Testing Your Theme

1. **Copy or create** your theme files
2. **ZIP everything together** (manifest.json + CSS)
3. **Rename to .4mth** extension
4. **Import in Settings → Themes**
5. **Check appearance** across:
   - Different screen sizes
   - Light and dark backgrounds
   - Hot and cold colors

---

## 📂 Theme File Structure

Each theme directory should look like:
```
my-theme/
├── manifest.json
├── styles.css
└── images/ (optional)
    ├── background.png
    └── logo.png
```

---

## 🚀 Next Steps

1. **Pick an example** theme you like
2. **Copy the manifest and CSS files**
3. **Modify the colors and styles**
4. **Test in 4 Messenger**
5. **Share with the community!**

---

## 📖 Related Files

- [THEME_CREATOR_GUIDE.md](../THEME_CREATOR_GUIDE.md) - Complete guide
- [THEME_VISUAL_GUIDE.md](../THEME_VISUAL_GUIDE.md) - Examples and templates
- [THEMES_README.md](../THEMES_README.md) - Documentation index

---

## 💬 Tips for Creating Themes

1. **Color Harmony** - Use a color palette generator
2. **Contrast** - Ensure text is readable
3. **Consistency** - Use CSS variables for all colors
4. **Performance** - Minimize animations for slow devices
5. **Accessibility** - Test with keyboard navigation
6. **Testing** - Try on different browsers/devices
7. **Documentation** - Add comments to your CSS
8. **Sharing** - Include a README with your theme

---

**Happy theming!** 🎨

Choose an example, customize it, and create something beautiful for 4 Messenger!
