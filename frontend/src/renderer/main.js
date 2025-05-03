import { initAllViews, showUploadView } from './views/index.js';
import { state } from './store/store.js';
import {
  showWelcomeScreen,
  hideWelcomeShowApp,
  setupHeaderControls
} from './views/common/layout.js';

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
