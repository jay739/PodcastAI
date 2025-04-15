import { state } from '../store/store.js';
import { showUploadView, showVoiceView } from './voiceView.js';

export function initAnalysisView() {
    const container = document.getElementById('analysis-view');
    
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Document Analysis</h2>
            <div class="grid grid-cols-3 gap-4 mb-6" id="analysis-metrics">
                <!-- Metrics will be populated here -->
            </div>
            <div id="speakers-container"></div>
            <div class="flex space-x-4 mt-6">
                <button id="back-to-upload" class="btn-secondary">
                    Back to Upload
                </button>
                <button id="customize-voices" class="btn-primary">
                    Customize Voices
                </button>
            </div>
        </div>
    `;

    document.getElementById('back-to-upload').addEventListener('click', showUploadView);
    document.getElementById('customize-voices').addEventListener('click', showVoiceView);
}

export function showAnalysisView() {
    updateAnalysisDisplay();
    document.getElementById('upload-view').classList.add('hidden');
    document.getElementById('analysis-view').classList.remove('hidden');
}

function updateAnalysisDisplay() {
    if (!state.analysisResults) return;
    
    const metricsContainer = document.getElementById('analysis-metrics');
    const speakersContainer = document.getElementById('speakers-container');
    
    // Update metrics
    metricsContainer.innerHTML = `
        <div class="metric-card">
            <h3>Pages</h3>
            <p>${state.analysisResults.page_count || 0}</p>
        </div>
        <div class="metric-card">
            <h3>Words</h3>
            <p>${state.analysisResults.word_count || 0}</p>
        </div>
        <div class="metric-card">
            <h3>Speakers</h3>
            <p>${state.analysisResults.speakers?.length || 0}</p>
        </div>
    `;
    
    // Update speakers list
    if (state.analysisResults.speakers?.length > 0) {
        speakersContainer.innerHTML = `
            <h3 class="font-medium mb-2">Detected Speakers:</h3>
            <div class="space-y-2">
                ${state.analysisResults.speakers.map(speaker => `
                    <div class="speaker-item">
                        <span class="font-medium">${speaker.name}</span>
                        <span class="text-gray-500 text-sm">(${speaker.frequency} mentions)</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        speakersContainer.innerHTML = `
            <div class="alert alert-info">
                No speakers detected - will use default Host/Expert format
            </div>
        `;
    }
}