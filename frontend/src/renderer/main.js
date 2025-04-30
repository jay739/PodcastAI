import { initAllViews, showUploadView } from './views/index.js';
import { state } from './store/store.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loadingOverlay = document.getElementById('loading-overlay');
  const appContainer = document.getElementById('app-container');
  const uploadView = document.getElementById('upload-view');

  if (!loadingOverlay || !appContainer || !uploadView) {
    console.error('Missing required DOM elements');
    return;
  }

  try {
    console.log('Starting app initialization');
    await initAllViews();
    state.reset();
    loadingOverlay.hidden = true;
    appContainer.hidden = false;
    console.log('App initialized successfully');
    showUploadView();
  } catch (err) {
    console.error('App failed to initialize:', err);
    const errorEl = document.getElementById('error-message');
    errorEl.innerHTML = `
      <p>${err.message}</p>
      <button onclick="window.location.reload()">Reload App</button>
    `;
    errorEl.hidden = false;
  }
});
