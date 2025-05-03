import { state } from '../store/store.js';
import { 
    showUploadView, 
    showAnalysisView,
    initVoiceView,
    showProgressView,
    showResultsView
} from './index.js';

export function setupEventListeners() {
    // IPC Progress Updates
    window.podcastAPI.on.progress((progress) => {
        if (document.getElementById('progress-view').classList.contains('hidden')) return;
        
        document.getElementById('progress-bar').style.width = `${progress}%`;
        document.getElementById('progress-details').textContent = 
            `${Math.round(progress)}% complete`;
    });
    
    // Global error handling
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        alert(`Error: ${event.message}`);
        showUploadView();
    });
}