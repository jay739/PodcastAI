import { initUploadView, showUploadView } from './uploadView.js';
import { initAnalysisView, showAnalysisView } from './analysisView.js';
import { initVoiceView } from "./voice/initVoiceView.js";
import { initProgressView, showProgressView } from './progressView.js';
import { initResultsView, showResultsView } from './resultsView.js';

import { setupEventListeners } from './eventManager.js'; 

export async function initAllViews() {
  console.log('Initializing views...');
  try {
    initUploadView();
    initAnalysisView();
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
  initVoiceView,
  showProgressView,
  showResultsView
};
