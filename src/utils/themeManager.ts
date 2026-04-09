/**
 * Theme Manager for 4 Messenger
 * Handles loading .4mth theme files (zip format) and applying themes
 */

export interface ThemeManifest {
  name: string;
  version: string;
  author?: string;
  description?: string;
  placeholders: {
    [key: string]: {
      path: string;
      type: 'image' | 'css' | 'svg' | 'mainscreen';
    };
  };
}

export interface LoadedTheme {
  name: string;
  version: string;
  author?: string;
  description?: string;
  cssContent?: string;
  assets: {
    [key: string]: string; // base64 encoded assets
  };
}

/**
 * Load a .4mth file (zip) and parse its theme
 */
export async function loadThemeFile(file: File): Promise<LoadedTheme> {
  // Import JSZip dynamically
  const { default: JSZip } = await import('jszip');
  
  const zip = new JSZip();
  const zipData = await zip.loadAsync(file);
  
  // Load and parse manifest.json
  const manifestFile = zipData.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Theme must contain manifest.json');
  }
  
  const manifestText = await manifestFile.async('text');
  const manifest: ThemeManifest = JSON.parse(manifestText);
  
  const theme: LoadedTheme = {
    name: manifest.name,
    version: manifest.version,
    author: manifest.author,
    description: manifest.description,
    assets: {},
  };
  
  // Load all placeholder files
  for (const [placeholder, config] of Object.entries(manifest.placeholders)) {
    const assetFile = zipData.file(config.path);
    if (!assetFile) {
      console.warn(`Asset not found in theme: ${config.path}`);
      continue;
    }
    
    try {
      if (config.type === 'css' || config.type === 'mainscreen') {
        // Load CSS content as text
        theme.assets[placeholder] = await assetFile.async('text');
      } else if (config.type === 'svg') {
        // Load SVG as text and convert to data URL
        const svgText = await assetFile.async('text');
        const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgText)}`;
        theme.assets[placeholder] = svgDataUrl;
      } else if (config.type === 'image') {
        // Load image as base64 with proper MIME type
        const assetData = await assetFile.async('arraybuffer');
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(assetData)));
        const ext = config.path.split('.').pop()?.toLowerCase();
        const mimeType = getMimeType(ext);
        theme.assets[placeholder] = `data:${mimeType};base64,${base64Data}`;
      }
    } catch (error) {
      console.error(`Failed to load asset ${placeholder}:`, error);
    }
  }
  
  return theme;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(ext?: string): string {
  const mimeTypes: { [key: string]: string } = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
  };
  return mimeTypes[ext?.toLowerCase() || ''] || 'image/png';
}

/**
 * Apply a loaded theme to the application
 */
export function applyTheme(theme: LoadedTheme): void {
  const root = document.documentElement;
  
  // Apply CSS custom properties and styles
  for (const [placeholder, asset] of Object.entries(theme.assets)) {
    if (typeof asset === 'string') {
      if (asset.startsWith('data:image/svg')) {
        // It's an SVG icon - apply as CSS variable for icon replacement
        const iconName = placeholder.replace(/-icon|-svg/, '').replace(/s$/, ''); // normalize name
        root.style.setProperty(`--theme-icon-${iconName}`, `url('${asset}')`);
      } else if (asset.startsWith('data:image/')) {
        // It's an image - apply as background or other style
        applyImageAsset(placeholder, asset, root);
      } else {
        // It's CSS content (including mainscreen CSS)
        applyCssAsset(placeholder, asset);
      }
    }
  }
}

/**
 * Apply an image asset to the DOM
 */
function applyImageAsset(placeholder: string, dataUrl: string, root: HTMLElement): void {
  // Extract the actual placeholder name (without extension)
  const placeholderName = placeholder.split('.')[0];
  
  // Set as CSS variable for use in stylesheets
  root.style.setProperty(`--theme-image-${placeholderName}`, `url('${dataUrl}')`);
  
  // Also try to apply specific placeholders
  switch (placeholderName.toLowerCase()) {
    case 'background':
    case 'bg':
      root.style.backgroundImage = `url('${dataUrl}')`;
      break;
    case 'logo':
      const logoElements = document.querySelectorAll('[data-theme-placeholder="logo"]');
      logoElements.forEach(el => {
        if (el instanceof HTMLImageElement) {
          el.src = dataUrl;
        } else {
          (el as HTMLElement).style.backgroundImage = `url('${dataUrl}')`;
        }
      });
      break;
    case 'favicon':
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = dataUrl;
      }
      break;
  }
}

/**
 * Apply CSS asset to the DOM
 */
function applyCssAsset(placeholder: string, cssContent: string): void {
  // Remove existing theme style if present
  const existingStyle = document.getElementById(`theme-style-${placeholder}`);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create new style element
  const style = document.createElement('style');
  style.id = `theme-style-${placeholder}`;
  style.textContent = cssContent;
  document.head.appendChild(style);
}

/**
 * Remove all applied theme styles and images
 */
export function clearTheme(): void {
  // Remove all theme style elements
  document.querySelectorAll('style[id^="theme-style-"]').forEach(el => el.remove());
  
  // Remove theme CSS variables
  const root = document.documentElement;
  const styles = root.style;
  for (let i = styles.length - 1; i >= 0; i--) {
    const prop = styles[i];
    if (prop.startsWith('--theme-')) {
      styles.removeProperty(prop);
    }
  }
}

/**
 * Save theme to localStorage
 */
export function saveTheme(theme: LoadedTheme): void {
  try {
    localStorage.setItem('4messenger-custom-theme', JSON.stringify({
      name: theme.name,
      version: theme.version,
      author: theme.author,
      description: theme.description,
      assets: theme.assets,
    }));
  } catch (error) {
    console.error('Failed to save theme:', error);
  }
}

/**
 * Load theme from localStorage
 */
export function loadSavedTheme(): LoadedTheme | null {
  try {
    const saved = localStorage.getItem('4messenger-custom-theme');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load saved theme:', error);
  }
  return null;
}

/**
 * Clear saved theme from localStorage
 */
export function removeSavedTheme(): void {
  try {
    localStorage.removeItem('4messenger-custom-theme');
  } catch (error) {
    console.error('Failed to remove saved theme:', error);
  }
}

/**
 * Create a theme file (for theme creators)
 * Returns a Blob that can be downloaded as .4mth file
 */
export async function createThemeFile(
  manifest: ThemeManifest,
  files: { [path: string]: File | string }
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  
  const zip = new JSZip();
  
  // Add manifest
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  
  // Add files
  for (const [path, content] of Object.entries(files)) {
    if (content instanceof File) {
      const arrayBuffer = await content.arrayBuffer();
      zip.file(path, arrayBuffer);
    } else {
      zip.file(path, content);
    }
  }
  
  return zip.generateAsync({ type: 'blob' });
}
