# Complete Component Theme - Full Placeholder Reference

## Overview
The **Complete Component Theme** is a comprehensive example that demonstrates ALL customizable components in 4 Messenger. This theme includes CSS placeholders for buttons, inputs, text, cards, notifications, avatars, messages, and more.

## Theme Structure

```
manifest.json              # Theme configuration
styles/
  ├── primary.css         # Root colors, typography, base styles
  ├── buttons.css         # All button variants and states
  ├── inputs.css          # Form inputs, checkboxes, ranges
  ├── text.css            # Typography, headings, text utilities
  ├── cards.css           # Panels, containers, alerts, badges
  ├── notifications.css   # Toasts, modals, tooltips
  ├── avatars.css         # User avatars, profiles, presence
  └── messages.css        # Chat bubbles, messages, typing
images/
  ├── background.png      # App background image
  └── logo.png           # App logo
```

## Manifest Placeholders

### Primary Styles (`primary-styles`)
**File:** `styles/primary.css`  
**Type:** CSS

Defines the foundational theme:
- CSS custom properties (variables) for colors, spacing, transitions
- Base HTML/body styles
- Link styling
- Scrollbar appearance
- Background image support
- Dark mode media queries

**Key CSS Variables Defined:**
```css
--color-primary: #6366f1
--color-primary-light: #818cf8
--color-primary-dark: #4f46e5
--bg-primary: #ffffff
--bg-secondary: #f9fafb
--text-primary: #111827
--text-secondary: #6b7280
--color-success: #10b981
--color-error: #ef4444
--color-warning: #f59e0b
--color-info: #3b82f6
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
--spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-xl
--transition-fast, --transition-normal, --transition-slow
```

### Button Styles (`button-styles`)
**File:** `styles/buttons.css`  
**Type:** CSS

Comprehensive button system including:

**Selectors:**
- `button`, `.button`, `.btn`, `[role="button"]`
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`, `.btn-ghost`
- `.btn-sm`, `.btn-lg`, `.btn-block`, `.btn-icon`
- `.button-group` for button groupings
- `.loading` state with spinner animation

**Variants:**
- **Primary:** `button.btn-primary` - Main action buttons
- **Secondary:** `button.btn-secondary` - Alternative actions
- **Danger:** `button.btn-danger` - Destructive actions
- **Success:** `button.btn-success` - Positive actions
- **Ghost:** `button.btn-ghost` - Subtle buttons

**States:**
- `:hover` - Elevated with shadow and transform
- `:focus-visible` - Blue outline
- `:active` - Pressed state
- `:disabled` - Reduced opacity, not-allowed cursor
- `.loading` - Spinner animation

### Input Styles (`input-styles`)
**File:** `styles/inputs.css`  
**Type:** CSS

Complete form control system:

**Selectors:**
- `input`, `textarea`, `select`, `.input`, `.form-control`
- `input[type="checkbox"]`, `input[type="radio"]`
- `input[type="range"]` - Slider with custom thumb
- `.form-group` - Grouped input with label
- `.form-row` - Multi-column input layouts

**States:**
- `:focus` - Blue border with subtle glow
- `.error` - Red border for validation errors
- `.success` - Green border for validated inputs
- `:disabled` - Muted appearance

**Features:**
- Placeholder text styling
- Icon support (`.input-wrapper`)
- Checkboxes and radios with custom colors
- Range sliders with custom styling
- Form groups with labels and helper text
- Error and success messages
- Grid layouts (cols-2, cols-3)

### Text Styles (`text-styles`)
**File:** `styles/text.css`  
**Type:** CSS

Typography and text utilities:

**Headings:**
- `h1` through `h6` with hierarchical sizing
- `.h1`, `.h2`, `.h3`, etc. classes
- 600-700 font weight
- Proper line height (1.2)

**Text Colors:**
- `.text-primary`, `.text-secondary`, `.text-tertiary`
- `.text-success`, `.text-error`, `.text-warning`, `.text-info`
- `.text-muted` - Disabled text appearance

**Text Formatting:**
- `.text-bold`, `<strong>`, `<b>`
- `.text-italic`, `<em>`, `<i>`
- `.text-underline`, `<u>`
- `.text-line-through`, `<s>`, `<del>`
- `.text-uppercase` - All caps with letter spacing
- `.text-lowercase`, `.text-capitalize`

**Overflow & Wrapping:**
- `.text-wrap` - Break long text
- `.text-nowrap` - Prevent wrapping
- `.text-truncate` - Single line ellipsis
- `.text-truncate-lines-2/3` - Multi-line ellipsis

**Other Elements:**
- `<code>` - Inline code with background
- `<pre>` - Code blocks with dark background
- Lists: `<ul>`, `<ol>`, `.list-unstyled`, `.list-inline`
- `<blockquote>` - Left border, italic
- `<mark>` - Highlighted text
- Text size utilities: `.text-xs` through `.text-3xl`
- Line height utilities: `.leading-none` through `.leading-loose`
- Letter spacing utilities: `.tracking-tight` through `.tracking-widest`

### Card Styles (`card-styles`)
**File:** `styles/cards.css`  
**Type:** CSS

Container and card components:

**Base Cards:**
- `.card` - Main card container with shadow
- `.card.card-flat` - No shadow
- `.card.card-elevated` - Extra shadow

**Card Parts:**
- `.card-header` - Top section with border
- `.card-body` / `<main>` - Main content area
- `.card-footer` - Bottom section with buttons

**Card Variants:**
- `.card-primary`, `.card-success`, `.card-danger`, `.card-warning`, `.card-info`
- Tinted backgrounds with matching borders

**Grid Layouts:**
- `.cards-grid` - Auto-fill responsive grid
- `.cards-grid.cols-2/3/4` - Fixed column grids
- Auto-responds to screen size

**Other Containers:**
- `.panel`, `.container` - Simple content areas
- `.box` - Secondary background container
- `.alert` - Info/Success/Warning/Error alerts
- `.badge` - Small labeled indicators
- `<hr>`, `.divider` - Line separators
- `.well` - Inset container

### Notification Styles (`notification-styles`)
**File:** `styles/notifications.css`  
**Type:** CSS

Toast, modal, and dialog components:

**Toast/Notification:**
- `.notification-container` - Fixed position container
- `.notification`, `.toast` - Individual toast element
- `.notification-icon` - Icon area
- `.notification-content` - Title and message
- `.notification-close` - Close button
- Slide-in/out animations

**Notification Variants:**
- `.notification-success` - Green style
- `.notification-error` / `.notification-danger` - Red style
- `.notification-warning` - Orange style
- `.notification-info` - Blue style
- `.notification-primary` - Purple style

**Modal Dialog:**
- `.modal-overlay` / `.modal-backdrop` - Dimmed background
- `.modal`, `.modal-dialog` - Modal container
- `.modal-header` - Title area
- `.modal-body` - Content area
- `.modal-footer` - Action buttons
- Fade and scale animations

**Tooltips:**
- `.tooltip` - Positioned tooltip
- `.tooltip.top/right/bottom/left` - Direction variants
- Arrow indicator
- Fade transition

### Avatar Styles (`avatar-styles`)
**File:** `styles/avatars.css`  
**Type:** CSS

User profiles and avatars:

**Avatars:**
- `.avatar` - Circular user image
- Variants: `.avatar-xs`, `.avatar-sm`, `.avatar-md`, `.avatar-lg`, `.avatar-xl`, `.avatar-2xl`
- Color variants: `.avatar-primary`, `.avatar-success`, `.avatar-error`, `.avatar-warning`, `.avatar-info`
- Border styles: `.avatar.border`, `.avatar.border-primary`
- Shape variants: `.avatar.rounded`, `.avatar.sharp`

**Avatar Indicators:**
- `.avatar.with-status` - Online/offline dot
- Different colors for: online, offline, away, busy, idle
- `.avatar.with-badge` - Number badge (like unread count)

**Avatar Groups:**
- `.avatar-group` - Multiple avatars overlapping
- `.avatar-group-overflow` - "+5 more" style indicator

**User Profiles:**
- `.user-card` / `.profile-card` - Profile card container
- `.user-name` - User display name
- `.user-title` - Role/status
- `.user-status` - Online status indicator

**User Lists:**
- `.user-list-item` - User row in a list
- `.user-list-item-content` - Name and subtitle
- `.user-list-item-action` - Action buttons

**Presence Indicators:**
- `.presence-indicator` - Online status dot with label
- `.presence-dot` - Pulsing colored dot
- States: online, offline, away, busy

**User Menu:**
- `.user-menu` / `.dropdown-menu` - Popup menu
- `.user-menu-item` / `.dropdown-item` - Menu options
- `.danger` variant for destructive actions

### Message Styles (`message-styles`)
**File:** `styles/messages.css`  
**Type:** CSS

Chat and messaging components:

**Messages:**
- `.message` / `.chat-message` - Single message bubble
- `.message.incoming` - Left-aligned, gray background
- `.message.outgoing` / `.message.sent` - Right-aligned, blue background
- `.message.system` - Centered, no background
- Message animations on load

**Message Parts:**
- `.message-avatar` - User avatar
- `.message-content` - Bubble with text
- `.message-text` - Message body
- `.message-meta` - Time and status icons
- `.message-time` - Timestamp
- `.message-status` - Delivery checkmarks

**Message Media:**
- `.message-image` / `.message-media` - Embedded images/videos
- Hover zoom effect
- Max height/width constraints

**Message Files:**
- `.message-file` - File attachment display
- `.message-file-icon` - Document icon
- `.message-file-name` - Filename
- `.message-file-size` - File size display

**Message Reactions:**
- `.message-reactions` - Reaction container
- `.message-reaction` - Individual reaction bubble
- `.message-reaction.user-reacted` - Highlighted user reaction
- `.message-reaction-count` - Number of people

**Message Actions:**
- `.message-actions` - Action buttons (appears on hover)
- Buttons for react, reply, edit, delete, etc.

**Message States:**
- `.message.pinned` - Pinned message indicator
- `.message.deleted` - Deleted message appearance
- `.message-edited` - "edited" label

**Chat Input:**
- `.chat-input-wrapper` - Input area container
- `.chat-input` / `.message-input` - Text input field
- `.chat-input-actions` - Widget buttons (emoji, attach, etc.)
- `.chat-action-btn` - Action button

**Typing Indicator:**
- `.typing-indicator` - Shown while someone types
- `.typing-dot` - Animated dot animation
- Three dots with staggered bounce

**Message Group:**
- `.message-group` - Group of messages from same user
- Same author messages closer together
- Different author spacing

## CSS Variables Available

All components use CSS custom properties that are defined in `primary.css`. You can override them for quick theming:

```css
/* Colors */
--color-primary, --color-primary-light, --color-primary-dark
--color-success, --color-error, --color-warning, --color-info
--bg-primary, --bg-secondary, --bg-tertiary
--text-primary, --text-secondary, --text-tertiary, --text-light

/* Styling */
--border-color, --border-radius, --border-width, --border-style
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl

/* Spacing */
--spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-xl

/* Motion */
--transition-fast (150ms), --transition-normal (250ms), --transition-slow (350ms)

/* Typography */
--font-family, --font-mono
```

## Image Placeholders

### Background Image (`background-image`)
**Type:** image (PNG/JPG/WebP)  
**Usage:** Set as `--theme-image-background` CSS variable

The background image is applied to:
- HTML element as fixed background
- `.app-background` elements
- Dark overlay pattern or solid color shown behind content

### Logo Icon (`logo-icon`)
**Type:** image (PNG/JPG/SVG)  
**Usage:** Set as `--theme-image-logo` CSS variable

The logo appears in:
- `.app-logo` elements
- `[data-theme-placeholder="logo"]` elements
- App header/navbar
- Login screen

## Customization Examples

### How to Customize Buttons
Edit `styles/buttons.css`:
```css
button.btn-primary {
  background-color: #your-color;
  border-color: #your-color;
  border-radius: 12px; /* More rounded */
  padding: 12px 24px; /* Larger padding */
}
```

### How to Customize Messages
Edit `styles/messages.css`:
```css
.message.outgoing .message-content {
  background-color: #your-color;
  border-radius: 20px 4px 20px 20px; /* Custom bubble shape */
}
```

### How to Customize Cards
Edit `styles/cards.css`:
```css
.card {
  border-radius: 16px; /* More rounded */
  box-shadow: 0 8px 24px rgba(0,0,0,0.15); /* Stronger shadow */
}
```

## Best Practices

1. **Start with primary.css** - Define your base colors and spacing first
2. **Maintain CSS variables** - Use `var(--color-primary)` instead of hard-coding colors
3. **Test all states** - Check hover, focus, active, and disabled states
4. **Mobile responsive** - Ensure components work on small screens
5. **Dark mode** - Use `@media (prefers-color-scheme: dark)` for dark mode support
6. **Accessibility** - Focus states, outlines, proper contrast ratios

## File Sizes

- **primary.css:** ~3.3 KB - Core theming
- **buttons.css:** ~4.4 KB - 15+ button variants and states
- **inputs.css:** ~5.2 KB - Forms, checkboxes, ranges, validation
- **text.css:** ~4.7 KB - Typography, headings, text utilities
- **cards.css:** ~5.8 KB - Containers, panels, alerts, badges
- **notifications.css:** ~8.2 KB - Toasts, modals, tooltips
- **avatars.css:** ~6.8 KB - User profiles, presence, menus
- **messages.css:** ~8.7 KB - Chat bubbles, reactions, typing

**Total:** ~48 KB (already minified patterns)

## Testing the Theme

1. Go to **Settings → Themes** in 4 Messenger
2. Click **Import Theme**
3. Select the `.4mth` file
4. The theme will apply immediately
5. All buttons, inputs, messages, and components should reflect the new styles

## Tips for Theme Creators

- Use this as a template for your own themes
- Copy `styles/primary.css` and modify the CSS variables at the top
- Then customize specific component files as needed
- Include preview screenshots in your theme documentation
- Test on both desktop and mobile devices

