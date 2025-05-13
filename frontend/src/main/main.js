if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: require(`../../node_modules/electron`)
  });
}

const { app, BrowserWindow, ipcMain } = require('electron');
const { setupFileHandlers } = require('./ipc/fileHandlers');
const { setupPodcastHandlers } = require('./ipc/podcastHandlers');
const log = require('electron-log');
const { initAuth } = require('./auth');
const { initDatabase } = require('./database');
const path = require('path');
const { setupAuthHandlers } = require('./ipc/authHandlers');

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
  const createMainWindow = require('./mainWindow');
  return createMainWindow();
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

// Add authentication handlers
let currentUser = null;
const users = new Map();

ipcMain.handle('login', async (_, credentials) => {
  try {
    const user = users.get(credentials.username);
    if (user && user.password === credentials.password) {
      currentUser = user;
      return { success: true, user: { username: user.username, email: user.email } };
    }
    return { success: false, message: 'Invalid username or password' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An error occurred during login' };
  }
});

ipcMain.handle('signup', async (_, userData) => {
  try {
    if (users.has(userData.username)) {
      return { success: false, message: 'Username already exists' };
    }
    
    const newUser = {
      username: userData.username,
      email: userData.email,
      password: userData.password
    };
    
    users.set(userData.username, newUser);
    currentUser = newUser;
    
    return { 
      success: true, 
      user: { 
        username: newUser.username, 
        email: newUser.email 
      } 
    };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, message: 'An error occurred during signup' };
  }
});

ipcMain.handle('logout', async () => {
  try {
    currentUser = null;
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: 'An error occurred during logout' };
  }
});

ipcMain.handle('get-current-user', async () => {
  return currentUser ? { username: currentUser.username, email: currentUser.email } : null;
});
