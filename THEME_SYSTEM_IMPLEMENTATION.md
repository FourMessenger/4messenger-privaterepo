# 4 Messenger Theme System - Implementation Summary

## Overview

A complete theme system has been implemented for 4 Messenger that allows users to customize the messenger's appearance using `.4mth` theme files (ZIP archives).

## Features

### User Features

1. **Import Themes**
   - Import `.4mth` files through the Settings > Themes tab
   - Themes are automatically applied and persist across sessions
   - Automatic theme restoration on app startup

2. **Manage Themes**
   - View currently installed theme information
   - Remove/unload themes at any time
   - Real-time error feedback during import

3. **Theme Support**
   - CSS file support for complete styling customization
   - Image asset support (PNG, JPG, GIF, WebP)
   - Base64 encoding for image assets
   - Dynamic CSS injection

### Developer Features

1. **Theme Creation**
   - Simple manifest.json-based configuration
   - Support for multiple placeholders
   - Easy CSS and image integration
   - No build process required

2. **Documentation**
   - Comprehensive theme creator guide
   - Quick reference for users
   - Example manifest and CSS files
   - Best practices and tips

## Implementation Details

### Files Added/Modified

1. **Core System**
   - `src/utils/themeManager.ts` - Theme loading, parsing, and application logic
   - `src/store.ts` - Theme state management and actions

2. **UI Components**
   - `src/components/UserSettings.tsx` - Theme import/management interface
   - New "Themes" tab in settings

3. **App Integration**
   - `src/App.tsx` - Theme restoration on startup

4. **Dependencies**
   - `jszip` (v3.10.1) - For ZIP file handling

5. **Documentation**
   - `THEME_CREATOR_GUIDE.md` - Complete guide for theme creators
   - `THEMES_QUICK_REFERENCE.md` - Quick start guide
   - `example-theme-manifest.json` - Sample manifest
   - `example-theme-styles.css` - Sample CSS

### Store State & Actions

#### State Properties
```typescript
customTheme: LoadedTheme | null          // Currently loaded theme
themeLoading: boolean                     // Loading state
themeError: string | null                 // Error message if any
```

#### Actions
```typescript
loadTheme(file: File): Promise<void>      // Load .4mth file
applyLoadedTheme(theme: LoadedTheme): void // Apply theme manually
unloadTheme(): void                        // Remove current theme
restoreThemeOnStartup(): void             // Restore saved theme on startup
```

### Theme File Format (.4mth)

A `.4mth` file is a ZIP archive with the following structure:

```
theme-name.4mth
├── manifest.json (required)
├── styles.css (optional)
├── background.png (optional)
└── other-assets/ (optional)
```

#### manifest.json
```json
{
  "name": "Theme Name",
  "version": "1.0.0",
  "author": "Author Name",
  "description": "Theme description",
  "placeholders": {
    "placeholder-name": {
      "path": "relative/path/to/file",
      "type": "css" | "image"
    }
  }
}
```

### LStor age

Themes are persisted using browser localStorage:
- **Key**: `4messenger-custom-theme`
- **Data**: Full theme object including base64-encoded assets
- **Persistence**: Survives page reloads and app restarts

### CSS Integration

CSS files from themes are:
- Injected into `document.head`
- Assigned unique IDs for tracking
- Can override all app styles
- Support CSS variables, animations, etc.

### Image Integration

Images are:
- Converted to base64 data URLs
- Applied as CSS variables
- Can be used in stylesheets
- Support common formats: PNG, JPG, GIF, WebP

## Usage Guide

### For Users

1. Open Settings (⚙️)
2. Navigate to "Themes" tab
3. Click "Import Theme"
4. Select a `.4mth` file
5. Theme applies immediately!

### For Theme Creators

1. Create a folder with your theme files
2. Add `manifest.json` with placeholders
3. Add CSS and/or image files
4. ZIP all files together
5. Rename `.zip` to `.4mth`
6. Share or test in the app!

## Example Theme

An example "Deep Ocean Theme" is included:
- `example-theme-manifest.json` - Theme configuration
- `example-theme-styles.css` - CSS customization

To create this theme:
1. Create a folder with both files
2. ZIP them together
3. Rename to `deep-ocean-theme.4mth`
4. Import in Settings

## API Reference

### themeManager.ts Functions

```typescript
// Load and parse a .4mth file
loadThemeFile(file: File): Promise<LoadedTheme>

// Apply a theme to the DOM
applyTheme(theme: LoadedTheme): void

// Clear all theme styles and images
clearTheme(): void

// Save theme to localStorage
saveTheme(theme: LoadedTheme): void

// Load theme from localStorage
loadSavedTheme(): LoadedTheme | null

// Remove saved theme from localStorage
removeSavedTheme(): void

// Create a .4mth file (for developers)
createThemeFile(manifest, files): Promise<Blob>
```

### Store Hooks (in React components)

```typescript
// In a React component using useStore
const { 
  customTheme,          // Current theme (LoadedTheme | null)
  themeLoading,         // Boolean
  themeError,           // String | null
  loadTheme,            // (file: File) => Promise<void>
  applyLoadedTheme,     // (theme: LoadedTheme) => void
  unloadTheme,          // () => void
  restoreThemeOnStartup // () => void
} = useStore();
```

## Browser Compatibility

- Chrome/Edge: Full support (including scrollbar styling)
- Firefox: Full support
- Safari: Full support (excluding webkit scrollbar styling)
- Mobile browsers: Full support

## Performance Considerations

1. **File Size**: Optimize images to < 500KB total
2. **CSS Loading**: CSS is injected once at startup
3. **Memory**: Theme assets stored in localStorage (per browser limits)
4. **Parsing**: ZIP parsing handled by JSZip library

## Error Handling

The system provides user-friendly error messages for:
- Invalid manifest.json
- Missing files referenced in manifest
- Invalid ZIP structures
- File format issues
- Large file sizes

Errors are displayed in the Themes tab UI and system notifications.

## Future Enhancements

Possible improvements for future versions:

1. **Theme Repository**
   - Central marketplace for themes
   - Theme ratings and reviews
   - Easy one-click installation

2. **Theme Editor**
   - Visual theme customizer
   - Live preview
   - Export custom themes

3. **Advanced Features**
   - Multiple theme profiles
   - Per-chat theme customization
   - Schedule theme changes
   - Dark/light automatic switching

4. **Community**
   - Theme sharing platform
   - Community-created themes
   - Theme versioning and updates

## Troubleshooting

### Theme not loading?
- Check manifest.json is valid JSON
- Verify file paths are correct
- Ensure .4mth is a proper ZIP file

### Styles not applying?
- Check CSS syntax
- Verify selectors target correct elements
- Use browser DevTools to debug

### Images not showing?
- Confirm files are in the ZIP
- Check file paths match manifest
- Verify supported image format

## Credits

Theme system implementation includes:
- JSZip library for ZIP file handling
- Zustand for state management
- Lucide React icons
- Tailwind CSS for UI

## License

The theme system is part of 4 Messenger and follows the same license terms.
