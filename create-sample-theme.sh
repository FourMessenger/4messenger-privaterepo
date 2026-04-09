#!/bin/bash
# Create a sample .4mth theme file for testing
# Usage: bash create-sample-theme.sh

mkdir -p sample-theme
cd sample-theme

# Create manifest.json
cat > manifest.json << 'EOF'
{
  "name": "Sample Neon Theme",
  "version": "1.0.0",
  "author": "4 Messenger",
  "description": "A vibrant neon-inspired theme perfect for customization",
  "placeholders": {
    "neon-styles": {
      "path": "styles.css",
      "type": "css"
    }
  }
}
EOF

# Create styles.css
cat > styles.css << 'EOF'
:root {
  /* Neon color palette */
  --neon-cyan: #00ffff;
  --neon-magenta: #ff00ff;
  --neon-lime: #00ff00;
  --neon-dark-bg: #0a0a0a;
  --neon-light-text: #ffffff;
  
  /* Override app variables */
  --accent-color: var(--neon-cyan);
  --chat-bg: var(--neon-dark-bg);
}

/* Main background */
body, html {
  background: var(--neon-dark-bg);
  color: var(--neon-light-text);
}

/* Message styling */
.message-container {
  background: rgba(0, 255, 255, 0.05);
  border-left: 3px solid var(--neon-cyan);
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.message-container:hover {
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  border-left-color: var(--neon-magenta);
  transform: translateX(2px);
}

/* Text styling */
.message-text {
  color: var(--neon-light-text);
  text-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
}

/* Accent elements */
.accent-bg {
  background: linear-gradient(135deg, var(--neon-cyan), var(--neon-magenta)) !important;
}

.accent-text {
  color: var(--neon-cyan) !important;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

/* Button styling */
button {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2));
  border: 1px solid var(--neon-cyan);
  color: var(--neon-light-text);
  transition: all 0.3s ease;
}

button:hover {
  border-color: var(--neon-magenta);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* Input styling */
input, textarea {
  background: rgba(0, 255, 255, 0.05) !important;
  border: 1px solid var(--neon-cyan) !important;
  color: var(--neon-light-text) !important;
  transition: all 0.3s ease;
}

input:focus, textarea:focus {
  border-color: var(--neon-magenta) !important;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2) !important;
  background: rgba(0, 255, 255, 0.1) !important;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--neon-dark-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--neon-cyan);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--neon-magenta);
}

/* Selection color */
::selection {
  background: var(--neon-cyan);
  color: var(--neon-dark-bg);
}

/* Animations */
@keyframes glow {
  0%, 100% {
    text-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
  }
  50% {
    text-shadow: 0 0 20px rgba(0, 255, 255, 0.6);
  }
}

.message-time {
  animation: glow 2s infinite;
  color: var(--neon-cyan);
}

EOF

echo "✓ Sample theme files created!"
echo ""
echo "Now create the .4mth file by running:"
echo "  cd sample-theme"
echo "  zip -r ../sample-neon-theme.4mth manifest.json styles.css"
echo ""
echo "Or on Windows:"
echo "  - Select manifest.json and styles.css"
echo "  - Right-click → Send to → Compressed folder"
echo "  - Rename the .zip file to .4mth"
echo ""
echo "Then import in 4 Messenger Settings → Themes → Import Theme"
