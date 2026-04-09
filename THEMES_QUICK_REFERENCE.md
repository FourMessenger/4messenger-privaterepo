# 4 Messenger Themes - Quick Reference

## What are Themes?

Themes are `.4mth` files (which are ZIP archives) that allow you to customize the appearance of 4 Messenger with custom CSS styles and images.

## How to Use a Theme

1. **Open Settings** - Click the settings icon in 4 Messenger
2. **Go to Themes Tab** - Find and click the "Themes" tab
3. **Import Theme** - Click the import button and select your `.4mth` file
4. **Enjoy** - Your theme will be applied immediately!

## How to Create a Theme

### Quick Start

1. Create a folder for your theme containing:
   - `manifest.json` (see example below)
   - Your CSS files
   - Your image files

2. **manifest.json** example:
   ```json
   {
     "name": "My Theme",
     "version": "1.0.0",
     "author": "Your Name",
     "description": "My custom theme",
     "placeholders": {
       "main-styles": {
         "path": "styles.css",
         "type": "css"
       }
     }
   }
   ```

3. Create your `styles.css` with custom CSS for 4 Messenger

4. **ZIP it up**:
   - Select all files in your theme folder
   - Create a ZIP archive
   - Rename `.zip` extension to `.4mth`

5. **Test it**:
   - Import your `.4mth` file using the Themes tab
   - Check if it looks how you want

## Key CSS Variables to Override

```css
:root {
  --accent-color: #6366f1;        /* Main accent color */
  --font-size-base: 16px;         /* Base font size */
  --message-spacing: 8px;         /* Space between messages */
  --border-radius: 12px;          /* Corner roundness */
  --transition-duration: 200ms;   /* Animation speed */
  --chat-bg: #1f2937;            /* Chat background */
}
```

## Tips

- **Keep it small**: Optimize images to reduce file size
- **Test it**: Check your theme on different screen sizes
- **Be creative**: Use gradients, animations, and custom fonts
- **Share it**: Once happy, share your theme with the community!

## Files in This Directory

- **THEME_CREATOR_GUIDE.md** - Detailed guide for creating themes
- **example-theme-manifest.json** - Sample manifest file
- **example-theme-styles.css** - Sample CSS file
- **THEMES_QUICK_REFERENCE.md** - This file

## Examples

See `example-theme-manifest.json` and `example-theme-styles.css` for a working example of the Deep Ocean theme.

## Troubleshooting

**Theme not loading?**
- Verify manifest.json is valid JSON
- Check all file paths in manifest.json match actual files
- Ensure .4mth is actually a ZIP file

**Styles not applying?**
- Check CSS syntax
- Use browser DevTools to debug
- Make sure selectors target correct elements

**Images not showing?**
- Verify image files are in the ZIP
- Check file paths match manifest.json
- Ensure format is PNG, JPG, GIF, or WebP

## Need Help?

Refer to the full **THEME_CREATOR_GUIDE.md** for complete documentation and advanced features.
