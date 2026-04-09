@echo off
REM Create a sample .4mth theme file for testing (Windows)
REM Usage: create-sample-theme.bat

if exist "sample-theme" (
    echo Removing existing sample-theme directory...
    rmdir /s /q "sample-theme"
)

mkdir sample-theme
cd sample-theme

REM Create manifest.json
(
    echo.{
    echo.  "name": "Sample Neon Theme",
    echo.  "version": "1.0.0",
    echo.  "author": "4 Messenger",
    echo.  "description": "A vibrant neon-inspired theme perfect for customization",
    echo.  "placeholders": {
    echo.    "neon-styles": {
    echo.      "path": "styles.css",
    echo.      "type": "css"
    echo.    }
    echo.  }
    echo.}
) > manifest.json

REM Create styles.css
(
    echo.:root {
    echo.  /* Neon color palette */
    echo.  --neon-cyan: #00ffff;
    echo.  --neon-magenta: #ff00ff;
    echo.  --neon-lime: #00ff00;
    echo.  --neon-dark-bg: #0a0a0a;
    echo.  --neon-light-text: #ffffff;
    echo.  
    echo.  /* Override app variables */
    echo.  --accent-color: var(--neon-cyan);
    echo.  --chat-bg: var(--neon-dark-bg);
    echo.}
    echo.
    echo./* Main background */
    echo.body, html {
    echo.  background: var(--neon-dark-bg);
    echo.  color: var(--neon-light-text);
    echo.}
    echo.
    echo./* Message styling */
    echo..message-container {
    echo.  background: rgba(0, 255, 255, 0.05);
    echo.  border-left: 3px solid var(--neon-cyan);
    echo.  border-radius: 8px;
    echo.  padding: 12px;
    echo.  margin: 8px 0;
    echo.  box-shadow: 0 0 10px rgba(0, 255, 255, 0.1);
    echo.  transition: all 0.3s ease;
    echo.}
    echo.
    echo..message-container:hover {
    echo.  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
    echo.  border-left-color: var(--neon-magenta);
    echo.  transform: translateX(2px);
    echo.}
    echo.
    echo./* Text styling */
    echo..message-text {
    echo.  color: var(--neon-light-text);
    echo.  text-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
    echo.}
    echo.
    echo./* Accent elements */
    echo..accent-bg {
    echo.  background: linear-gradient(135deg, var(--neon-cyan), var(--neon-magenta)) !important;
    echo.}
    echo.
    echo..accent-text {
    echo.  color: var(--neon-cyan) !important;
    echo.  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    echo.}
    echo.
    echo./* Button styling */
    echo.button {
    echo.  background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2));
    echo.  border: 1px solid var(--neon-cyan);
    echo.  color: var(--neon-light-text);
    echo.  transition: all 0.3s ease;
    echo.}
    echo.
    echo.button:hover {
    echo.  border-color: var(--neon-magenta);
    echo.  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
    echo.  transform: translateY(-2px);
    echo.}
) > styles.css

cd ..

echo.
echo ✓ Sample theme files created in sample-theme folder!
echo.
echo Next steps:
echo.
echo 1. Open sample-theme folder
echo 2. Select manifest.json and styles.css
echo 3. Right-click and choose "Send to" menu
echo 4. Select "Compressed (zipped) folder"
echo 5. Rename the resulting .zip file to sample-neon-theme.4mth
echo.
echo Then import in 4 Messenger:
echo   Settings (gear icon) → Themes → Import Theme → Select .4mth file
echo.
pause
