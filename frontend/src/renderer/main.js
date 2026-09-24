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

  // Wait for podcastAPI to be available
  const waitForAPI = () => {
    return new Promise((resolve) => {
      const checkAPI = () => {
        if (window.podcastAPI) {
          resolve();
        } else {
          setTimeout(checkAPI, 100);
        }
      };
      checkAPI();
    });
  };

  try {
    console.log('Starting app initialization...');
    await waitForAPI(); // Wait for API to be available
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