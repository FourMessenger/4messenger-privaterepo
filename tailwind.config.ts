import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        // Message animations
        'message-slide-right': 'messageSlideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'message-slide-left': 'messageSlideInLeft 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'message-bounce': 'messageBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'message-glide': 'messageGlide 0.4s ease-out',
        
        // Button animations
        'pulse-glow': 'buttonPulse 2s infinite',
        'hover-glow': 'buttonHoverGlow 0.6s ease-in-out',
        
        // Loading animations
        'shimmer': 'shimmer 2s infinite',
        'shimmer-pulse': 'shimmerPulse 1.5s ease-in-out infinite',
        
        // Modal animations
        'popup-zoom': 'popupZoom 0.3s ease-out',
        'popup-fade': 'popupFade 0.3s ease-out',
        'slide-down-modal': 'slideDownModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up-modal': 'slideUpModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        
        // Notification animations
        'notification-bounce': 'notificationBounce 0.6s ease-in-out infinite',
        'notification-pulse': 'notificationPulse 2s ease-in-out infinite',
        'badge-ping': 'badgePing 2s infinite',
        
        // Typing animations
        'typing-dot': 'typingDot 1.4s infinite',
        'typing-bubble': 'typingBubble 1.4s infinite',
        
        // Status animations
        'online-pulse': 'onlinePulse 2s infinite',
        'online-blink': 'onlineBlink 1s infinite',
        
        // Input animations
        'input-focus': 'inputFocus 0.3s forwards',
        'input-blur': 'inputBlur 0.3s forwards',
        
        // Success animations
        'checkmark': 'checkmark 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'success-pulse': 'successPulse 0.6s ease-out',
        
        // File upload animations
        'file-drop': 'fileDropZone 1.5s ease-in-out infinite',
        'upload-progress': 'uploadProgress 1.5s ease-in-out forwards',
        
        // Search animations
        'search-highlight': 'searchHighlight 0.8s ease-out',
        
        // Hover animations
        'hover-scale': 'hoverScale 0.3s ease-out forwards',
        'hover-grow': 'hoverGrow 0.3s ease-out forwards',
        
        // Rotation animations
        'spin-slow': 'spinSlow 2s linear infinite',
        'flip': 'flip 0.6s ease-in-out',
        
        // Bounce animations
        'bounce-3d': 'bounce3D 1s ease-in-out infinite',
        'elastic-bounce': 'elasticBounce 0.6s ease-in-out infinite',
        
        // Stagger animations
        'stagger-fade': 'staggerFadeIn 0.5s ease-out',
        
        // Float animation
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        // Message animations
        messageSlideInRight: {
          'from': {
            opacity: '0',
            transform: 'translateX(30px) scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0) scale(1)',
          },
        },
        messageSlideInLeft: {
          'from': {
            opacity: '0',
            transform: 'translateX(-30px) scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0) scale(1)',
          },
        },
        messageBounceIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.3)',
          },
          '50%': {
            opacity: '1',
          },
          '70%': {
            transform: 'scale(1.05)',
          },
          '100%': {
            transform: 'scale(1)',
          },
        },
        messageGlide: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        
        // Button animations
        buttonPulse: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.7)',
          },
          '50%': {
            boxShadow: '0 0 0 10px rgba(99, 102, 241, 0)',
          },
        },
        buttonHoverGlow: {
          'from': {
            boxShadow: '0 0 5px rgba(99, 102, 241, 0.5)',
          },
          'to': {
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.8), 0 0 30px rgba(99, 102, 241, 0.4)',
          },
        },
        
        // Loading animations
        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
        shimmerPulse: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.7',
          },
        },
        
        // Modal animations
        popupZoom: {
          'from': {
            opacity: '0',
            transform: 'scale(0.9)',
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        popupFade: {
          'from': {
            opacity: '0',
            backdropFilter: 'blur(0px)',
          },
          'to': {
            opacity: '1',
            backdropFilter: 'blur(4px)',
          },
        },
        slideDownModal: {
          'from': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideUpModal: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        
        // Notification animations
        notificationBounce: {
          '0%, 100%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.15)',
          },
        },
        notificationPulse: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.6',
          },
        },
        badgePing: {
          '0%': {
            boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)',
          },
          '70%': {
            boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)',
          },
          '100%': {
            boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)',
          },
        },
        
        // Typing animations
        typingDot: {
          '0%, 60%, 100%': {
            transform: 'translateY(0)',
            opacity: '0.5',
          },
          '30%': {
            transform: 'translateY(-10px)',
            opacity: '1',
          },
        },
        typingBubble: {
          '0%, 100%': {
            opacity: '0.4',
            transform: 'scale(0.8)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        
        // Status animations
        onlinePulse: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)',
          },
          '50%': {
            boxShadow: '0 0 0 4px rgba(34, 197, 94, 0)',
          },
        },
        onlineBlink: {
          '0%, 19%, 21%, 100%': {
            opacity: '1',
          },
          '20%': {
            opacity: '0.3',
          },
        },
        
        // Input animations
        inputFocus: {
          'from': {
            borderColor: 'rgba(99, 102, 241, 0.5)',
            boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.1)',
          },
          'to': {
            borderColor: 'rgba(99, 102, 241, 1)',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
          },
        },
        inputBlur: {
          'from': {
            borderColor: 'rgba(99, 102, 241, 1)',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
          },
          'to': {
            borderColor: 'rgba(99, 102, 241, 0.3)',
            boxShadow: '0 0 0 0px transparent',
          },
        },
        
        // Success animations
        checkmark: {
          '0%': {
            transform: 'scale(0) rotate(-45deg)',
            opacity: '0',
          },
          '50%': {
            transform: 'scale(1.2) rotate(0deg)',
          },
          '100%': {
            transform: 'scale(1) rotate(0deg)',
            opacity: '1',
          },
        },
        successPulse: {
          '0%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.1)',
          },
          '100%': {
            transform: 'scale(1)',
          },
        },
        
        // File upload animations
        fileDropZone: {
          '0%, 100%': {
            borderColor: 'rgba(99, 102, 241, 0.3)',
            backgroundColor: 'rgba(99, 102, 241, 0.02)',
          },
          '50%': {
            borderColor: 'rgba(99, 102, 241, 0.8)',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
          },
        },
        uploadProgress: {
          '0%': {
            width: '0',
          },
        },
        
        // Search animations
        searchHighlight: {
          '0%': {
            backgroundColor: 'rgba(253, 224, 71, 0.3)',
          },
          '100%': {
            backgroundColor: 'transparent',
          },
        },
        
        // Hover animations
        hoverScale: {
          'from': {
            transform: 'scale(1)',
          },
          'to': {
            transform: 'scale(1.05)',
          },
        },
        hoverGrow: {
          'from': {
            transform: 'scale(1)',
          },
          'to': {
            transform: 'scale(1.1)',
          },
        },
        
        // Rotation animations
        spinSlow: {
          'from': {
            transform: 'rotate(0deg)',
          },
          'to': {
            transform: 'rotate(360deg)',
          },
        },
        flip: {
          'from': {
            transform: 'rotateY(0deg)',
          },
          'to': {
            transform: 'rotateY(360deg)',
          },
        },
        
        // Bounce animations
        bounce3D: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '25%': {
            transform: 'translateY(-10px)',
          },
          '50%': {
            transform: 'translateY(-20px)',
          },
          '75%': {
            transform: 'translateY(-10px)',
          },
        },
        elasticBounce: {
          '0%, 100%': {
            transform: 'scale(1)',
          },
          '25%': {
            transform: 'scale(0.95)',
          },
          '50%': {
            transform: 'scale(1.1)',
          },
          '75%': {
            transform: 'scale(0.98)',
          },
        },
        
        // Stagger animations
        staggerFadeIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        
        // Float animation
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-5px)',
          },
        },
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
