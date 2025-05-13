import { initAllViews, showUploadView } from './views/index.js';
import { state } from './store/store.js';
import {
  showWelcomeScreen,
  hideWelcomeShowApp,
  setupHeaderControls
} from './views/common/layout.js';

document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());

document.addEventListener('DOMContentLoaded', async () => {
  const loadingOverlay = document.getElementById('loading-overlay');
  const errorEl = document.getElementById('error-message');

  if (!loadingOverlay) {
    console.error('Missing loading overlay');
    return;
  }

  try {
    console.log('Starting app initialization...');
    await initAllViews();
    state.reset();

    loadingOverlay.hidden = true;

    setupHeaderControls();   // 🌙 Theme + Login
    showWelcomeScreen();     // 👋 Show welcome initially

    // 🚀 Start button logic
    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.addEventListener('click', () => {
        hideWelcomeShowApp();
        showUploadView();
      });
    }

    console.log('App initialized successfully');
  } catch (err) {
    console.error('App failed to initialize:', err);
    errorEl.innerHTML = `
      <p>${err.message}</p>
      <button onclick="window.location.reload()">Reload App</button>
    `;
    errorEl.hidden = false;
  }
});

// Authentication handlers
ipcMain.handle('login', async (event, { username, password }) => {
  try {
    // TODO: Implement actual authentication logic
    // For now, return a mock successful login
    return {
      success: true,
      user: {
        username,
        email: `${username}@example.com`
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Login failed'
    };
  }
});

ipcMain.handle('signup', async (event, { username, email, password }) => {
  try {
    // TODO: Implement actual signup logic
    // For now, return a mock successful signup
    return {
      success: true,
      user: {
        username,
        email
      }
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      message: 'Signup failed'
    };
  }
});

ipcMain.handle('logout', async () => {
  try {
    // TODO: Implement actual logout logic
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
});

ipcMain.handle('get-current-user', async () => {
  try {
    // TODO: Implement actual user session check
    // For now, return null (not logged in)
    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}); 