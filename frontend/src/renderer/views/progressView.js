import { state } from '../store/store.js';
import { showResultView } from './resultsView.js';
import { updateProgress } from '../lib/progressManager.js';

export function initProgressView() {
    const container = document.getElementById('progress-container');
    
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Generating Podcast</h2>
            <p class="mb-3 text-gray-700" id="status-message">Processing...</p>
            <div class="progress-bar mb-6">
                <div class="progress-bar-fill" id="progress-bar" style="width: 0%"></div>
            </div>
            <p class="text-sm text-gray-600" id="progress-details">Starting generation...</p>
        </div>
    `;
}

export function showProgressView() {
    // Start progress simulation (replace with actual progress events)
    simulateProgress();
    
    document.getElementById('voice-view').classList.add('hidden');
    document.getElementById('progress-view').classList.remove('hidden');
}

function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => showResultView(), 500);
        }
        
        updateProgress(progress, `${Math.round(progress)}% complete`);
        document.getElementById('progress-bar').style.width = `${progress}%`;
        document.getElementById('progress-details').textContent = 
            `${Math.round(progress)}% complete`;
    }, 800);
}