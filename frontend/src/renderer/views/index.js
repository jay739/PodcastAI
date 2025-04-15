// src/renderer/views/index.js
import { initUploadView, showUploadView } from './uploadView.js';
import { initAnalysisView, showAnalysisView } from './analysisView.js';
import { initVoiceView, showVoiceView } from './voiceView.js';
import { initProgressView, showProgressView } from './progressView.js';
import { initResultsView, showResultView } from './resultsView.js';

export async function initAllViews() {
    initUploadView();
    initAnalysisView();
    initVoiceView();
    initProgressView();
    initResultsView();
}

export {
    showUploadView,
    showAnalysisView,
    showVoiceView,
    showProgressView,
    showResultView
};