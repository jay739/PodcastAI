import { state } from '../store/store.js';
import { showUploadView } from './uploadView.js';

export function initResultsView() {
    const container = document.getElementById('results-view');
    
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Your Podcast</h2>
            <div class="mb-6">
                <audio id="audio-player" controls class="w-full"></audio>
            </div>
            <div class="flex space-x-4">
                <button id="download-btn" class="btn-primary">Download Podcast</button>
                <button id="start-over-btn" class="btn-secondary">Start Over</button>
            </div>
        </div>
    `;

    document.getElementById('start-over-btn').addEventListener('click', () => {
        resetState();
        showUploadView();
    });

    document.getElementById('download-btn').addEventListener('click', () => {
        if (state.generationJob?.filePath) {
            window.podcastAPI.download(state.generationJob.jobId);
        }
    });
}

export function showResultsView() {
    const audioPlayer = document.getElementById('audio-player');
    if (state.generationJob?.filePath) {
        audioPlayer.src = state.generationJob.filePath;
    }
    
    document.getElementById('progress-view').classList.add('hidden');
    document.getElementById('results-view').classList.remove('hidden');
}