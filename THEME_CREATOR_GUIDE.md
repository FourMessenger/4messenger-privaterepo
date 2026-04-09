# 4 Messenger Theme Creator Guide

## Overview
Themes in 4 Messenger are distributed as `.4mth` files, which are essentially ZIP archives containing theme assets and configuration.

## File Structure

A `.4mth` theme file should have the following structure:

```
my-theme.4mth
├── manifest.json       (Required)
├── styles.css          (Optional)
├── background.png      (Optional)
├── logo.png           (Optional)
└── other-assets/      (Optional - any structure you want)
```

## manifest.json Format

The `manifest.json` file is required and defines your theme's metadata and assets:

```json
{
  "name": "My Awesome Theme",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A beautiful theme for 4 Messenger",
  "placeholders": {
    "background": {
      "path": "background.png",
      "type": "image"
    },
    "logo": {
      "path": "logo.png",
      "type": "image"
    },
    "custom-styles": {
      "path": "styles.css",
      "type": "css"
    }
  }
}
```

### Manifest Fields

- **name** (string, required): The display name of your theme
- **version** (string, required): Theme version (e.g., "1.0.0")
- **author** (string, optional): Author name
- **description** (string, optional): Theme description
- **placeholders** (object, required): Map of placeholder names to asset configurations

### Placeholder Configuration

Each placeholder in the `placeholders` object has:

- **path** (string): Relative path to the file within the theme archive
- **type** (string): Either "image" (for PNG, JPG, GIF, WebP) or "css" (for CSS stylesheets)

## Asset Types

### Images

Supported formats:
- PNG (recommended for transparency)
- JPEG
- GIF
- WebP

Usage in placeholders:
```json
{
  "background": {
    "path": "assets/background.png",
    "type": "image"
  }
}
```

Images are automatically converted to data URLs and can be applied to the DOM.

### CSS Files

CSS files allow complete styling customization. They are injected into the document head.

Example `styles.css`:
```css
:root {
  --theme-primary: #6366f1;
  --theme-secondary: #8b5cf6;
  --theme-accent: #ec4899;
}

/* Customize specific elements */
.message-container {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border-radius: 12px;
}

/* Override app styles */
.chat-bg-default {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}
```

Placeholder name in config:
```json
{
  "custom-styles": {
    "path": "styles.css",
    "type": "css"
  }
}
```

## Creating a Theme

### Step 1: Create the folder structure

```
my-cool-theme/
├── manifest.json
├── styles.css
└── assets/
    ├── background.png
    └── logo.png
```

### Step 2: Create manifest.json

```json
{
  "name": "Cool Dark Theme",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A sleek dark theme with cool colors",
  "placeholders": {
    "background": {
      "path": "assets/background.png",
      "type": "image"
    },
    "logo": {
      "path": "assets/logo.png",
      "type": "image"
    },
    "theme-styles": {
      "path": "styles.css",
      "type": "css"
    }
  }
}
```

### Step 3: Create styles.css

```css
:root {
  --theme-bg-primary: #0f172a;
  --theme-bg-secondary: #1e293b;
  --theme-accent: #06b6d4;
  --theme-text: #f1f5f9;
}

body {
  background-color: var(--theme-bg-primary);
  color: var(--theme-text);
}

/* Customize message styles */
.message-text {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Add custom animations or transitions */
.message-fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Step 4: Add your assets

- Place your background.png in `assets/background.png`
- Place your logo.png in `assets/logo.png`
- Keep image sizes reasonable (< 500KB each for best performance)

### Step 5: Create the .4mth file

1. Select all files in your theme directory
2. Right-click and select "Send to > Compressed folder" (Windows) or drag to Archive Utility (Mac)
3. Rename the resulting `my-cool-theme.zip` to `my-cool-theme.4mth`

Alternatively, use the command line:
```bash
zip -r my-cool-theme.4mth manifest.json styles.css assets/
```

### Step 6: Test your theme

1. Open 4 Messenger Settings
2. Go to the "Themes" tab
3. Click "Import Theme" and select your `.4mth` file
4. Your theme should be applied immediately!

## Advanced: CSS Variables

The app uses these CSS variables that you can customize:

```css
:root {
  /* Colors */
  --accent-color: #6366f1;
  --chat-bg: #1f2937;
  
  /* Typography */
  --font-size-base: 16px;
  
  /* Spacing */
  --message-spacing: 8px;
  
  /* Styling */
  --border-radius: 12px;
  --transition-duration: 200ms;
}
```

Override these in your theme's CSS to customize the app appearance globally.

## Tips & Best Practices

1. **Test thoroughly** - Test your theme on different browsers and screen sizes
2. **Keep file sizes small** - Users download your theme file, so optimize images
3. **Use semantic names** - Name your placeholders descriptively (e.g., "main-background", "sidebar-accent")
4. **Provide contrast** - Ensure text is readable with your color scheme
5. **Support dark and light modes** - Consider providing multiple themes or using CSS media queries
6. **Document your theme** - Include a README file in your archive if it's complex

## Distribution

Once you've created your theme `.4mth` file, you can share it by:

1. Uploading to a file hosting service (GitHub releases, etc.)
2. Sharing directly with friends
3. Publishing on the 4 Messenger community theme repository (when available)

## Troubleshooting

### Theme not loading?
- Check that manifest.json is valid JSON
- Ensure all file paths in manifest.json are relative and correct
- Verify the .4mth file is actually a ZIP archive

### Styles not applying?
- Check for CSS syntax errors
- Use browser DevTools to inspect elements
- Ensure CSS is targeting the correct selectors

### Images not showing?
- Confirm image files are included in the ZIP
- Check file paths in manifest.json match actual files
- Verify image format is supported (PNG, JPG, GIF, WebP)

## Need Help?

If you have questions or issues with theme creation:
1. Check the 4 Messenger documentation
2. Join the community forums
3. Open an issue on GitHub
