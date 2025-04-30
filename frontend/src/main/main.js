if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: require(`../../node_modules/electron`)
  });
}

const { app, BrowserWindow } = require('electron');
const { setupFileHandlers } = require('./ipc/fileHandlers');
const { setupPodcastHandlers } = require('./ipc/podcastHandlers');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
log.info('App starting...');

function initialize() {
  setupFileHandlers();
  setupPodcastHandlers();
}

function createWindow() {
  const createMainWindow = require('./mainWindow');
  return createMainWindow();
}

app.whenReady().then(() => {
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
