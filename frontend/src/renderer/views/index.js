import { initUploadView, showUploadView } from './uploadView.js';
import { initAnalysisView, showAnalysisView } from './analysisView.js';
import { initVoiceView } from "./voice/initVoiceView.js";
import { showVoiceView } from "./voice/index.js";
import { initProgressView, showProgressView } from './progressView.js';
import { initResultsView, showResultsView } from './resultsView.js';

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
  showResultsView
};

document.addEventListener("DOMContentLoaded", () => {
  initAllViews(); 

  if (localStorage.getItem("useMock") === "true") {
    state.setFile({
      name: "sample.pdf",
      size: 123456,
      path: "/mock/sample.pdf",
      id: "mock123"
    });
    showVoiceView();
  } else {
    showUploadView();
  }
});

