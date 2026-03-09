const { app, BrowserWindow, session } = require('electron');
const path = require('path');

// Determine if we are running in development or production
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '4 Messenger',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Required for some WebRTC and external media features in local file:// mode
    },
    autoHideMenuBar: true,
  });

  // Modify Content Security Policy to allow WebRTC and external media
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws: wss: stun: turn:"]
      }
    });
  });

  if (isDev) {
    // In development, load the Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle external links to open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Ignore GPU blacklist for better hardware acceleration
app.commandLine.appendSwitch('ignore-gpu-blocklist');
// Required for some audio/video features
app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');
