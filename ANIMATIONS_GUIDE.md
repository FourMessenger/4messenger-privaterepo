# 🎨 Messenger Animations Guide

Your messenger now has **40+ gorgeous animations** built-in! All animations enhance the UI without changing any structure or layout.

## 📦 Animation Categories

### Message Animations
Messages now smoothly slide in when they appear:
- **`animate-message-slide-left`** - Messages slide in from left (received)
- **`animate-message-slide-right`** - Messages slide in from right (sent)
- **`animate-message-bounce`** - Messages bounce in with scale effect
- **`animate-message-glide`** - Smooth gliding entrance

### Button & Interaction Animations
All buttons automatically:
- **Lift up** on hover (translateY -2px)
- **Get shadow** on hover
- **Press down** on click
- Have smooth **0.2s transitions** on all properties

### Loading & Shimmer Effects
- **`animate-shimmer`** - Smooth loading shimmer effect
- **`animate-shimmer-pulse`** - Pulsing loading state

### Modal & Popup Animations
- **`animate-popup-zoom`** - Pop-in with scale effect
- **`animate-popup-fade`** - Fade with blur backdrop
- **`animate-slide-down-modal`** - Slide down entrance
- **`animate-slide-up-modal`** - Slide up entrance

### Notification Animations
- **`animate-notification-bounce`** - Bouncing notification badge
- **`animate-notification-pulse`** - Pulsing notification
- **`animate-badge-ping`** - Radar ping effect on badges

### Typing Indicators
- **`animate-typing-dot`** - Bouncing dots for typing indicator
- **`animate-typing-bubble`** - Pulsing typing bubble

### Status Animations
- **`animate-online-pulse`** - Pulsing green online indicator
- **`animate-online-blink`** - Blinking online status

### Input Focus Effects
- **`animate-input-focus`** - Glow effect on focus
- **`animate-input-blur`** - Smooth unfocus
- Inputs automatically get a nice **border glow** on focus

### Success & Confirmation
- **`animate-checkmark`** - Bouncy checkmark animation
- **`animate-success-pulse`** - Success confirmation pulse

### File Upload
- **`animate-file-drop`** - Hover effect for drop zone
- **`animate-upload-progress`** - Progress bar animation

### Hover Effects
- **`animate-hover-scale`** - Scale to 1.05x
- **`animate-hover-grow`** - Scale to 1.1x

### Motion Effects
- **`animate-spin-slow`** - Slow 360° rotation (2s)
- **`animate-flip`** - Y-axis flip effect
- **`animate-bounce-3d`** - 3D bouncing motion
- **`animate-elastic-bounce`** - Elastic scale bounce
- **`animate-float`** - Floating up and down

### List Animations
- **`animate-stagger-fade`** - Staggered fade-in for lists

## 🚀 How Animations Work

### Automatic Animations
These apply automatically without code changes:
- ✅ **Message containers** - Fade in/slide on appearance
- ✅ **Buttons** - Hover lift + shadow on any `<button>` or `[role="button"]`
- ✅ **Inputs** - Focus glow effect on any `<input>` or `<textarea>`
- ✅ **Chat items** - Smooth hover slide effect
- ✅ **Icons** - Can have `.icon-spin`, `.icon-bounce`, `.icon-pulse` classes

### Manual Usage (Optional Enhancements)

If you want to use animations in JSX components, add animation classes:

```tsx
// Example: Add bounce animation to a component
<div className="animate-message-bounce">
  Important notification
</div>

// Example: Combine multiple animations
<div className="animate-popup-zoom">
  <div className="animate-float">
    Modal content
  </div>
</div>

// Example: Loading spinner with shimmer
<div className="animate-shimmer">
  <div className="h-4 w-32 rounded-full bg-gray-700" />
</div>
```

## 🎯 CSS Classes Available

All animations use **CSS classes** (no changes needed to existing code):
- `.animate-[animation-name]` - Tailwind utilities
- `.icon-spin`, `.icon-pulse`, `.icon-bounce`, `.icon-float` - Icon effects
- `.page-transition`, `.page-enter`, `.page-exit` - Page transitions
- `.notification-enter`, `.notification-exit` - Notification effects
- `.glow-active` - Active glow state
- `.skeleton` - Loading skeleton animation

## ⚡ Animation Timing

Most animations use these easing functions:
- **cubic-bezier(0.34, 1.56, 0.64, 1)** - Bouncy, playful effect
- **ease-out** - Smooth deceleration
- **ease-in-out** - Natural motion

Durations:
- 200ms - Quick interactions (buttons, inputs)
- 300-400ms - Message entries, modals
- 500-600ms - Success animations, notifications
- Infinite - Loading spinners, online status

## 🎭 Light/Dark Mode

All animations work perfectly in both light and dark modes!

## 💡 Pro Tips

1. **Feel the app** - Hover over buttons, click messages, focus on inputs to see animations
2. **No UI changes** - All animations are visual enhancements only
3. **Smooth scrolling** - Messages smoothly appear as you scroll
4. **Responsive** - Animations work on desktop and mobile
5. **Performance** - Uses GPU-accelerated properties (transform, opacity)

## 📝 Files Updated

- `src/index.css` - Added 40+ keyframe animations
- `tailwind.config.ts` - Created with animation utilities

Enjoy your beautifully animated messenger! 🎉
