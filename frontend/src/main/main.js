if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: require(`../../node_modules/electron`)
  });
}

const { app, BrowserWindow } = require('electron');
const { setupFileHandlers } = require('./ipc/fileHandlers');
const { setupPodcastHandlers } = require('./ipc/podcastHandlers');
const { setupAuthHandlers } = require('./ipc/authHandlers');
const log = require('electron-log');
const { initAuth } = require('./auth');
const { initDatabase } = require('./database');
const path = require('path');

// Configure logging
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
log.info('App starting...');

function initialize() {
  setupFileHandlers();
  setupPodcastHandlers();
  setupAuthHandlers();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, '../index.html'));
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  await initDatabase();
  initAuth();
  log.info('App is ready');
  initialize();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      log.info('Recreating window on macOS');
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (process.platform !== 'darwin') app.quit();
});

// Global error handling
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
