# Theme Component Customization Quick Reference

## What You Can Now Customize in 4 Messenger Themes

### ✅ Complete Component Theme Shows:
The new **complete-component-theme.4mth** file demonstrates how to customize EVERY component in your messenger, not just backgrounds.

---

## Component Categories & Placeholders

### 1. **PRIMARY STYLES** (`primary-styles`)
**File:** `styles/primary.css`

What you can customize:
- ✓ Primary colors & gradients
- ✓ Background colors (light/dark modes)
- ✓ Text colors (primary, secondary, muted)
- ✓ Accent colors (success, error, warning, info)
- ✓ Spacing system (margins, padding)
- ✓ Border radius & border styles
- ✓ Shadows (from subtle to prominent)
- ✓ Transitions & animations speeds
- ✓ Font families (sans-serif, monospace)
- ✓ Scrollbar appearance

**Example:** Set `--color-primary: #FF5733` to change your entire brand color!

---

### 2. **BUTTON STYLES** (`button-styles`)
**File:** `styles/buttons.css`

What you can customize:
- ✓ Button colors (primary, secondary, danger, success)
- ✓ Button sizes (small, medium, large, icon-only)
- ✓ Hover effects & animations
- ✓ Focus states & outlines
- ✓ Active/pressed states
- ✓ Disabled appearance
- ✓ Loading spinner animation
- ✓ Rounded corners vs. sharp corners
- ✓ Box shadows & elevation
- ✓ Button groups (joined buttons)
- ✓ Ghost/text buttons (no background)

**Selectors you can style:**
- `button`, `.btn`, `.button`
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`, `.btn-ghost`
- `.btn-sm`, `.btn-lg`, `.btn-block`, `.btn-icon`

---

### 3. **INPUT STYLES** (`input-styles`)
**File:** `styles/inputs.css`

What you can customize:
- ✓ Text input appearance
- ✓ Textarea height & wrapping
- ✓ Select dropdown styling
- ✓ Checkbox & radio button colors
- ✓ Range sliders (color, thumb size)
- ✓ Focus & hover effects
- ✓ Validation states (error, success)
- ✓ Placeholder text color
- ✓ Disabled state appearance
- ✓ Form group layouts
- ✓ Label styling & positioning
- ✓ Input icons & prefixes
- ✓ Input sizes (small to large)
- ✓ Form grid layouts (1, 2, or 3 columns)

**Selectors you can style:**
- `input`, `textarea`, `select`
- `.form-control`, `.form-group`
- `input[type="checkbox"]`, `input[type="radio"]`
- `input[type="range"]`

---

### 4. **TEXT STYLES** (`text-styles`)
**File:** `styles/text.css`

What you can customize:
- ✓ Heading sizes & weights (h1-h6)
- ✓ Paragraph styling
- ✓ Text alignment (left, center, right)
- ✓ Text colors (primary, secondary, error, success, etc.)
- ✓ Bold, italic, underline, strikethrough
- ✓ Text transform (uppercase, lowercase, capitalize)
- ✓ Text overflow (truncate, ellipsis, multi-line)
- ✓ Inline code styling
- ✓ Code block (pre) background & fonts
- ✓ Lists (ordered, unordered, inline)
- ✓ Blockquotes & citations
- ✓ Abbreviations & definitions
- ✓ Superscript & subscript
- ✓ Text size utilities (.text-xs through .text-3xl)
- ✓ Line height adjustments
- ✓ Letter spacing (tracking)

**Selectors you can style:**
- `h1` through `h6`
- `<p>`, `<code>`, `<pre>`, `<blockquote>`
- `.text-primary`, `.text-secondary`, `.text-muted`
- `.text-bold`, `.text-italic`, `.text-truncate`

---

### 5. **CARD STYLES** (`card-styles`)
**File:** `styles/cards.css`

What you can customize:
- ✓ Card backgrounds & borders
- ✓ Card shadows & elevation
- ✓ Card headers (with background color)
- ✓ Card footers (action buttons)
- ✓ Card variants (primary, success, danger, warning)
- ✓ Grid layouts (auto-fit or fixed columns)
- ✓ Panels & containers
- ✓ Alert boxes (info, success, warning, error)
- ✓ Alert colors & icons
- ✓ Badge styling & colors
- ✓ Dividers & separators
- ✓ Well/inset containers
- ✓ Hover effects & transitions

**Selectors you can style:**
- `.card`, `.card-header`, `.card-body`, `.card-footer`
- `.card-primary`, `.card-success`, `.card-danger`
- `.cards-grid`, `.cards-grid.cols-2`, `.cards-grid.cols-3`
- `.alert`, `.alert-info`, `.alert-success`, `.alert-error`
- `.badge`, `.badge-primary`, `.badge-success`

---

### 6. **NOTIFICATION STYLES** (`notification-styles`)
**File:** `styles/notifications.css`

What you can customize:
- ✓ Toast notification appearance
- ✓ Toast positions (top-right, bottom-left, etc.)
- ✓ Toast variants (success, error, warning, info)
- ✓ Toast animations (slide-in, slide-out)
- ✓ Modal dialog background
- ✓ Modal dialog size & padding
- ✓ Modal header & footer styling
- ✓ Modal animations (fade, pop-in)
- ✓ Close button appearance
- ✓ Tooltip positioning & styling
- ✓ Notification progress bars
- ✓ Close button hover effects

**Selectors you can style:**
- `.notification`, `.toast`
- `.notification-success`, `.notification-error`, `.notification-warning`
- `.modal`, `.modal-header`, `.modal-footer`
- `.tooltip`, `.tooltip.top`, `.tooltip.right`, `.tooltip.bottom`, `.tooltip.left`

---

### 7. **AVATAR STYLES** (`avatar-styles`)
**File:** `styles/avatars.css`

What you can customize:
- ✓ Avatar sizes (xs, sm, md, lg, xl, 2xl)
- ✓ Avatar colors & gradients
- ✓ Avatar borders & outlines
- ✓ Avatar shape (circular, rounded, square)
- ✓ Online status indicators (dot colors)
- ✓ Badge styling (unread count, notifications)
- ✓ Avatar groups (overlapping avatars)
- ✓ User profile cards
- ✓ User list items
- ✓ Presence indicators (online, away, busy, idle)
- ✓ User menus & dropdowns
- ✓ Status hover effects

**Selectors you can style:**
- `.avatar`, `.avatar-sm`, `.avatar-lg`, `.avatar-xl`
- `.avatar-primary`, `.avatar-success`, `.avatar-error`
- `.avatar.with-status`, `.avatar.with-badge`
- `.avatar-group`, `.avatar-group-overflow`
- `.user-card`, `.user-list-item`
- `.presence-indicator`, `.presence-dot`

---

### 8. **MESSAGE STYLES** (`message-styles`)
**File:** `styles/messages.css`

What you can customize:
- ✓ Message bubble appearance
- ✓ Outgoing messages (color, alignment)
- ✓ Incoming messages (color, alignment)
- ✓ System messages (center, muted)
- ✓ Message avatars
- ✓ Message text & styling
- ✓ Message timestamps
- ✓ Delivery status icons
- ✓ Message images & media
- ✓ File attachments display
- ✓ Reactions emoji & count
- ✓ Action buttons (emoji, reply, edit, delete)
- ✓ Typing indicator animation
- ✓ Chat input area
- ✓ Message group spacing
- ✓ Pinned message indicator
- ✓ Deleted message appearance
- ✓ Context menus

**Selectors you can style:**
- `.message`, `.message.outgoing`, `.message.incoming`
- `.message-content`, `.message-text`, `.message-meta`
- `.message-image`, `.message-file`
- `.message-reactions`, `.message-reaction`
- `.message-actions`, `.typing-indicator`
- `.chat-input`, `.chat-input-wrapper`

---

### 9. **IMAGE ASSETS**

#### Background Image (`background-image`)
- Use as app background
- Fixed positioning behind content
- Can add texture, pattern, or gradient image

#### Logo Icon (`logo-icon`)
- Used in app header/navbar
- Can be PNG, JPG, or SVG
- Resized automatically by theme system

---

## CSS Variable System

All 8 CSS files use a unified CSS variable system defined in `primary.css`:

```css
/* Color Variables */
--color-primary, --color-primary-light, --color-primary-dark
--color-success, --color-error, --color-warning, --color-info
--bg-primary, --bg-secondary, --bg-tertiary
--text-primary, --text-secondary, --text-tertiary

/* Spacing Variables */
--spacing-xs (0.25rem), --spacing-sm (0.5rem), --spacing-md (1rem)
--spacing-lg (1.5rem), --spacing-xl (2rem)

/* Style Variables */
--border-radius (8px), --border-width (1px), --border-color
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
--transition-fast (150ms), --transition-normal (250ms), --transition-slow (350ms)

/* Font Variables */
--font-family (system fonts), --font-mono (monospace)
```

**Why this matters:** Change one variable in `primary.css` and it affects ALL components!

---

## How Themes Are Applied

1. **Manifest defines placeholders** → Maps a name to a file and type (CSS or image)
2. **Each CSS file is injected** → Into document.head as a `<style>` tag
3. **CSS variables cascade down** → From primary.css to all component files
4. **Images are converted to data URLs** → And accessible as CSS variables
5. **All styles override defaults** → Providing complete customization

---

## Real Example: Creating a "Dark Gaming" Theme

```json
{
  "name": "Dark Gaming",
  "version": "1.0.0",
  "placeholders": {
    "primary-styles": { "path": "styles/primary.css", "type": "css" },
    "button-styles": { "path": "styles/buttons.css", "type": "css" },
    "message-styles": { "path": "styles/messages.css", "type": "css" },
    "background-image": { "path": "images/grid-bg.png", "type": "image" },
    "logo-icon": { "path": "images/gaming-logo.png", "type": "image" }
  }
}
```

In your `styles/primary.css`:
```css
:root {
  --color-primary: #00FF00;      /* Neon green */
  --bg-primary: #0A0E27;         /* Very dark blue */
  --text-primary: #E0E0E0;       /* Light gray */
  --shadow-lg: 0 0 20px rgba(0, 255, 0, 0.5); /* Green glow */
}
```

Result: All buttons, cards, messages, inputs automatically have the gaming aesthetic!

---

## Component Customization Checklist

- [ ] Primary Styles - Set your brand colors
- [ ] Button Styles - Buttons match your theme
- [ ] Input Styles - Forms feel consistent
- [ ] Text Styles - Typography is on-brand
- [ ] Card Styles - Containers look polished
- [ ] Notification Styles - Toasts are styled
- [ ] Avatar Styles - User profiles match theme
- [ ] Message Styles - Chat bubbles look great
- [ ] Images - Background and logo added
- [ ] Test - Check all components in Settings

---

## Download & Test

All example themes are in: `/workspaces/4messenger/theme-packages/`

**Start with:** `complete-component-theme.4mth` to see all customizations in action!

