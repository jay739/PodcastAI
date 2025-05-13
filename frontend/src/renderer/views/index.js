import { initUploadView, showUploadView } from './uploadView.js';
import { initAnalysisView, showAnalysisView } from './analysisView.js';
import { initVoiceView } from "./voice/initVoiceView.js";
import { showVoiceView } from "./voice/index.js";
import { initProgressView, showProgressView } from './progressView.js';
import { initResultsView, showResultsView } from './resultsView.js';
import { showLoginView } from './loginView.js';

import { setupEventListeners } from './eventManager.js'; 
import { state } from "../store/store.js";

export async function initAllViews() {
  console.log('Initializing views...');
  try {
    initUploadView();
    initAnalysisView();
    initVoiceView();
    initProgressView();
    initResultsView();

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await window.electron.ipcRenderer.invoke('auth:verify-token', { token });
        if (response.success) {
          state.setUser(response.user);
          showUploadView();
        } else {
          showLoginView();
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        showLoginView();
      }
    } else {
      showLoginView();
    }

    setupEventListeners(); 
  } catch (error) {
    console.log('Error initializing views:', error);
    console.error(error);
  }
}

export {
  showUploadView,
  showAnalysisView,
  showVoiceView,
  showProgressView,
  showResultsView,
  showLoginView
};

// document.addEventListener("DOMContentLoaded", () => {
//   initAllViews(); 

//   if (localStorage.getItem("useMock") === "true") {
//     state.setFile({
//       name: "sample.pdf",
//       size: 123456,
//       path: "/mock/sample.pdf",
//       id: "mock123"
//     });
//     showVoiceView();
//   } else {
//     showUploadView();
//   }
// });

