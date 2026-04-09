# Button Customization Guide

## Overview

The 4 Messenger theme system now supports **extensive button customization** with multiple variants, sizes, styles, and states. This guide documents all available button types and how to customize them in your theme.

## Table of Contents

1. [Size Variants](#size-variants)
2. [Solid Button Styles](#solid-button-styles)
3. [Outlined Button Variants](#outlined-button-variants)
4. [Ghost/Text Buttons](#ghosttext-buttons)
5. [Elevated Buttons](#elevated-buttons)
6. [Icon Buttons](#icon-buttons)
7. [Special Button Types](#special-button-types)
8. [Loading States](#loading-states)
9. [Combining Modifiers](#combining-modifiers)
10. [CSS Customization](#css-customization)
11. [Examples](#examples)

---

## Size Variants

The button system supports **5 size options**:

### Extra Small (XS)
- **Class**: `.btn-xs`, `.button.xs`, `.btn-xs`
- **Font Size**: 11px
- **Padding**: Minimal horizontal and vertical padding
- **Use Case**: Compact UI, dense layouts, inline actions

```html
<button class="btn-primary btn-xs">XS Button</button>
```

### Small (SM)
- **Class**: `.btn-sm`, `.button.sm`
- **Font Size**: 12px
- **Padding**: Extra small to small
- **Use Case**: Sidebar actions, secondary controls

```html
<button class="btn-primary btn-sm">Small Button</button>
```

### Medium (MD) - Default
- **Class**: `.btn-md`, `.button.md` (default if not specified)
- **Font Size**: 14px
- **Padding**: Standard spacing
- **Use Case**: Primary UI buttons, standard interactions

```html
<button class="btn-primary">Default Button</button>
```

### Large (LG)
- **Class**: `.btn-lg`, `.button.lg`
- **Font Size**: 16px
- **Padding**: Large horizontal and vertical spacing
- **Use Case**: Call-to-action buttons, main actions

```html
<button class="btn-primary btn-lg">Large Button</button>
```

### Extra Large (XL)
- **Class**: `.btn-xl`, `.button.xl`
- **Font Size**: 18px
- **Padding**: Maximum spacing
- **Use Case**: Hero buttons, full-width action buttons

```html
<button class="btn-primary btn-xl">Extra Large Button</button>
```

---

## Solid Button Styles

### Primary Button
- **Classes**: `.btn-primary`, `.btn-primary-solid`, `.button.primary`
- **Background**: `--color-primary`
- **Text Color**: White
- **Hover Effect**: Darkened background with shadow elevation
- **Best For**: Main actions, primary interactions

```html
<button class="btn-primary">Primary Button</button>
<button class="btn-primary btn-lg">Primary Large</button>
```

### Secondary Button
- **Classes**: `.btn-secondary`, `.btn-secondary-solid`, `.button.secondary`
- **Background**: `--bg-tertiary`
- **Text Color**: `--text-primary`
- **Hover Effect**: Adjusted background with shadow
- **Best For**: Secondary actions, alternative options

```html
<button class="btn-secondary">Secondary Button</button>
```

### Tertiary Button (Muted)
- **Classes**: `.btn-tertiary`, `.button.tertiary`
- **Background**: `--bg-secondary`
- **Text Color**: `--text-secondary`
- **Hover Effect**: Subtle background change
- **Best For**: Less prominent actions, navigation hints

```html
<button class="btn-tertiary">Tertiary Button</button>
```

### Danger Button
- **Classes**: `.btn-danger`, `.btn-danger-solid`, `.button.danger`
- **Background**: `--color-error` (typically red)
- **Text Color**: White
- **Hover Effect**: Darker red with shadow
- **Best For**: Destructive actions, confirmations, deletions

```html
<button class="btn-danger">Delete Item</button>
```

### Success Button
- **Classes**: `.btn-success`, `.btn-success-solid`, `.button.success`
- **Background**: `--color-success` (typically green)
- **Text Color**: White
- **Hover Effect**: Darker green with shadow
- **Best For**: Confirmations, positive actions, completions

```html
<button class="btn-success">Confirm</button>
```

### Warning Button
- **Classes**: `.btn-warning`, `.btn-warning-solid`, `.button.warning`
- **Background**: `--color-warning` (typically amber/orange)
- **Text Color**: White
- **Hover Effect**: Darker orange with shadow
- **Best For**: Cautions, alerts, important notices

```html
<button class="btn-warning">Warning Action</button>
```

### Info Button
- **Classes**: `.btn-info`, `.btn-info-solid`, `.button.info`
- **Background**: `--color-info` (typically cyan/blue)
- **Text Color**: White
- **Hover Effect**: Darker cyan with shadow
- **Best For**: Information actions, help, details

```html
<button class="btn-info">Learn More</button>
```

---

## Outlined Button Variants

Outlined buttons have transparent backgrounds with colored borders (2px). Perfect for secondary or alternative actions.

### Primary Outlined
- **Classes**: `.btn-primary-outline`, `.btn-outline-primary`
- **Border Color**: `--color-primary`
- **Text Color**: `--color-primary`
- **Hover**: Fills with primary color, text becomes white

```html
<button class="btn-primary-outline">Outlined Primary</button>
```

### Secondary Outlined
- **Classes**: `.btn-secondary-outline`, `.btn-outline-secondary`
- **Border Color**: `--border-color`
- **Text Color**: `--text-primary`

```html
<button class="btn-secondary-outline">Outlined Secondary</button>
```

### Danger Outlined
- **Classes**: `.btn-danger-outline`, `.btn-outline-danger`
- **Border Color**: `--color-error`
- **Text Color**: `--color-error`
- **Hover**: Fills with error color, text becomes white

```html
<button class="btn-danger-outline">Delete (Outlined)</button>
```

### Success Outlined
- **Classes**: `.btn-success-outline`, `.btn-outline-success`
- **Border Color**: `--color-success`
- **Text Color**: `--color-success`

```html
<button class="btn-success-outline">Confirm (Outlined)</button>
```

### Warning Outlined
- **Classes**: `.btn-warning-outline`, `.btn-outline-warning`

### Info Outlined
- **Classes**: `.btn-info-outline`, `.btn-outline-info`

---

## Ghost/Text Buttons

Minimal buttons with transparent backgrounds and only text color visible. Show background on hover.

### Primary Ghost
- **Classes**: `.btn-ghost`, `.btn-text`, `.button.ghost`
- **Background**: Transparent
- **Text Color**: `--color-primary`
- **Hover**: Shows background, text becomes white

```html
<button class="btn-ghost">Ghost Button</button>
```

### Secondary Ghost
- **Classes**: `.btn-ghost-secondary`
- **Text Color**: `--text-secondary`
- **Hover**: Subtle background change

### Danger Ghost
- **Classes**: `.btn-ghost-danger`
- **Text Color**: `--color-error`
- **Hover**: Red background with white text

---

## Elevated Buttons

Elevated buttons have prominent shadows and lift up on hover. Great for important actions.

### Elevated Primary
- **Classes**: `.btn-elevated`, `.btn-elevated-primary`
- **Shadow**: Large shadow with elevation
- **Hover**: Extra large shadow, lifts 4px upward

```html
<button class="btn-elevated">Elevated Primary</button>
```

### Elevated Secondary
- **Classes**: `.btn-elevated-secondary`
- **Background**: `--bg-tertiary`
- **Hover**: Extra large shadow, lifts upward

### Elevated Danger
- **Classes**: `.btn-elevated-danger`
- **Background**: `--color-error`

---

## Icon Buttons

Specialized buttons optimized for displaying single icons.

### Icon Button (Circular)
- **Classes**: `.btn-icon`, `.btn-icon-primary`, `.button.icon`
- **Shape**: Circular (border-radius: 50%)
- **Sizes**:
  - XS: 24px diameter
  - SM: 32px diameter
  - MD: 40px diameter (default)
  - LG: 48px diameter
  - XL: 56px diameter

```html
<button class="btn-icon">
  <svg>...</svg>
</button>

<button class="btn-icon btn-lg">
  <LargeIcon />
</button>
```

### Icon Button (Rounded Square)
- **Classes**: `.btn-icon-square`
- **Shape**: Rounded square
- **Maintains icon sizing rules**

```html
<button class="btn-icon-square">
  <SettingsIcon />
</button>
```

### Icon Button Ghost
- **Classes**: `.btn-icon-ghost`
- **Style**: Transparent with colored text
- **Hover**: Shows background

```html
<button class="btn-icon-ghost">
  <MenuIcon />
</button>
```

### Icon Button Ghost Tertiary
- **Classes**: `.btn-icon-ghost-tertiary`
- **Style**: Minimal, secondary text color
- **Hover**: Subtle background change

---

## Special Button Types

### Full Width Button
- **Classes**: `.btn-block`, `.btn-full`
- **Width**: 100% of container
- **Use**: Forms, modals, stacked layouts

```html
<button class="btn-primary btn-block">Full Width Button</button>
```

### Floating Action Button (FAB)
- **Classes**: `.btn-fab`
- **Position**: Fixed to bottom-right corner
- **Sizes**: 
  - Default (56px): `.btn-fab`
  - Small (48px): `.btn-fab-sm`
  - Large (64px): `.btn-fab-lg`
- **Behavior**: 
  - Shows shadow
  - Lifts on hover
  - Scales on active

```html
<button class="btn-fab">
  <PlusIcon />
</button>
```

### Button Group
- **Class**: `.button-group`
- **Purpose**: Connected buttons with shared border styles
- **Behavior**: Removes gaps, connects borders

```html
<div class="button-group">
  <button class="btn-secondary">Left</button>
  <button class="btn-secondary">Middle</button>
  <button class="btn-secondary">Right</button>
</div>
```

---

## Loading States

Buttons display a loading spinner while processing. Each color variant has its own spinner styling.

### Primary Loading
```html
<button class="btn-primary loading">Processing...</button>
```

### Secondary Loading
```html
<button class="btn-secondary loading">Processing...</button>
```

### Danger Loading
```html
<button class="btn-danger loading">Deleting...</button>
```

### Success Loading
```html
<button class="btn-success loading">Confirming...</button>
```

**Features**:
- Text is hidden during load
- Animated spinner replaces text
- Disabled state activated automatically
- Spinner color matches button style

---

## Combining Modifiers

You can combine multiple button classes for complex styling:

```html
<!-- Large Primary Button with Full Width -->
<button class="btn-primary btn-lg btn-block">Large Full Width</button>

<!-- Small Danger Outlined -->
<button class="btn-danger-outline btn-sm">Small Danger</button>

<!-- Extra Large Success with Shadow -->
<button class="btn-success btn-xl btn-elevated">Extra Large Success</button>

<!-- Icon Button Medium with Ghost Style -->
<button class="btn-icon btn-md btn-ghost">Icon Ghost</button>
```

---

## CSS Customization

### CSS Variables Used

All button styles depend on CSS variables. Customize buttons by modifying these in your theme:

```css
/* Colors */
--color-primary           /* Primary action color */
--color-primary-dark      /* Primary hover state */
--color-primary-light     /* Primary focus state */
--color-error             /* Danger/Error color */
--color-success           /* Success color */
--color-warning           /* Warning color */
--color-info              /* Info color */

/* Backgrounds */
--bg-secondary            /* Secondary background */
--bg-tertiary             /* Tertiary background */

/* Text */
--text-primary            /* Primary text color */
--text-secondary          /* Secondary text color */

/* Layout */
--border-radius           /* Button corner radius */
--border-width            /* Border thickness */
--border-style            /* Border line style */
--border-color            /* Border color */

/* Spacing */
--spacing-xs              /* Extra small spacing */
--spacing-sm              /* Small spacing */
--spacing-md              /* Medium spacing */
--spacing-lg              /* Large spacing */

/* Typography */
--font-family             /* Button font */

/* Shadows */
--shadow-sm               /* Small shadow */
--shadow-md               /* Medium shadow */
--shadow-lg               /* Large shadow */
--shadow-xl               /* Extra large shadow */
--shadow-2xl              /* Extra extra large shadow */

/* Transitions */
--transition-fast         /* Fast animation speed */
```

### Creating Custom Button Variants

Add custom button styles to your theme's `buttons.css`:

```css
/* Custom: Gradient Primary Button */
button.btn-primary-gradient {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  border-color: transparent;
}

button.btn-primary-gradient:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  box-shadow: var(--shadow-lg);
}

/* Custom: Pill Button */
button.btn-pill {
  border-radius: 50px;
}

/* Custom: Uppercase Button */
button.btn-uppercase {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}
```

---

## Examples

### Login Form Buttons
```html
<form>
  <input type="email" placeholder="Email" />
  <input type="password" placeholder="Password" />
  
  <button type="submit" class="btn-primary btn-lg btn-block">Sign In</button>
  <button type="button" class="btn-tertiary btn-block">Forgot Password?</button>
</form>
```

### Action Bar
```html
<div class="button-group">
  <button class="btn-secondary">← Back</button>
  <button class="btn-primary">Save</button>
</div>
```

### Confirmation Dialog
```html
<dialog>
  <h3>Delete Item?</h3>
  <p>This action cannot be undone.</p>
  
  <div class="button-group">
    <button class="btn-secondary">Cancel</button>
    <button class="btn-danger">Delete</button>
  </div>
</dialog>
```

### Icon Button Toolbar
```html
<div class="flex gap-2">
  <button class="btn-icon-ghost" title="Edit">
    <Edit2Icon />
  </button>
  <button class="btn-icon-ghost" title="Share">
    <ShareIcon />
  </button>
  <button class="btn-icon-ghost-danger" title="Delete">
    <TrashIcon />
  </button>
</div>
```

### Loading Button Usage (React)
```jsx
function SendButton() {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Make API call
      await submitForm();
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button 
      class={`btn-primary ${loading ? 'loading' : ''}`}
      onClick={handleSubmit}
      disabled={loading}
    >
      Send Message
    </button>
  );
}
```

### Complete Button Showcase
```html
<div class="p-8 space-y-4">
  <!-- Primary Buttons -->
  <div>
    <h3>Primary Buttons</h3>
    <button class="btn-primary btn-xs">XS</button>
    <button class="btn-primary btn-sm">SM</button>
    <button class="btn-primary">MD</button>
    <button class="btn-primary btn-lg">LG</button>
    <button class="btn-primary btn-xl">XL</button>
  </div>
  
  <!-- Outlined Buttons -->
  <div>
    <h3>Outlined Buttons</h3>
    <button class="btn-primary-outline">Primary</button>
    <button class="btn-danger-outline">Danger</button>
    <button class="btn-success-outline">Success</button>
  </div>
  
  <!-- Ghost Buttons -->
  <div>
    <h3>Ghost Buttons</h3>
    <button class="btn-ghost">Primary Ghost</button>
    <button class="btn-ghost-secondary">Secondary Ghost</button>
    <button class="btn-ghost-danger">Danger Ghost</button>
  </div>
  
  <!-- Icon Buttons -->
  <div>
    <h3>Icon Buttons</h3>
    <button class="btn-icon btn-sm">S</button>
    <button class="btn-icon">M</button>
    <button class="btn-icon btn-lg">L</button>
    <button class="btn-icon-ghost">G</button>
  </div>
  
  <!-- Elevated Buttons -->
  <div>
    <h3>Elevated Buttons</h3>
    <button class="btn-elevated">Elevated Primary</button>
    <button class="btn-elevated-secondary">Elevated Secondary</button>
    <button class="btn-elevated-danger">Elevated Danger</button>
  </div>
  
  <!-- Button Groups -->
  <div>
    <h3>Button Groups</h3>
    <div class="button-group">
      <button class="btn-secondary">Group 1</button>
      <button class="btn-secondary">Group 2</button>
      <button class="btn-secondary">Group 3</button>
    </div>
  </div>
</div>
```

---

## Theme Integration

### In Your Theme Manifest

The expanded buttons CSS is automatically included in the `premium-modern-theme.4mth` package under `styles/buttons.css`.

To create a custom theme with buttons customization:

1. Create a `manifest.json`:
```json
{
  "name": "My Custom Theme",
  "version": "1.0.0",
  "author": "You",
  "description": "Custom theme with button overrides",
  "styles": {
    "buttons": {
      "path": "styles/buttons.css",
      "type": "css"
    }
  }
}
```

2. Create `styles/buttons.css` with your customizations

3. Package as `.4mth` (ZIP) and import via Theme Selector

---

## Best Practices

1. **Consistency**: Use the same button style for similar actions across your app
2. **Hierarchy**: Use size and elevation to show button importance
3. **Color Meaning**: 
   - Danger/Red = Destructive actions
   - Success/Green = Positive actions  
   - Warning/Orange = Caution needed
   - Primary/Blue = Main actions
4. **Loading States**: Always provide feedback for async operations with `.loading` class
5. **Icon Pairing**: Use icon + text for clarity, or icon-only for well-known actions
6. **Accessibility**: Ensure buttons have sufficient color contrast
7. **Mobile**: Consider button size on mobile (minimum 44x44px touch target)

---

## Changes from Previous Version

Version 2.0 (Current) includes:

✨ **New Button Variants**:
- 5 size options (XS, SM, MD, LG, XL)
- Outlined buttons for all color types
- Ghost/text-only buttons  
- Elevated buttons with shadows
- Secondary and tertiary solid buttons
- Icon button shapes (circular, square, ghost)
- Warning and Info buttons
- Floating action button (FAB) styles
- Full width and responsive modifiers

🎨 **Enhanced Customization**:
- More CSS variables for fine-tuning
- Loading state variations by color
- Advanced hover and focus states  
- Responsive button sizing
- Button group connected styles

📦 **Better Organization**:
- Clean CSS structure with sections
- Consistent class naming convention
- Multiple class aliases for flexibility
- Well-documented keyframe animations

---

## Support & Questions

For questions about button customization or to report issues, refer to the main theme documentation or contact support.

Happy theming! 🎨
