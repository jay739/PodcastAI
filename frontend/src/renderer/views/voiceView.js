import { state } from '../store/store.js';
import { showAnalysisView, showProgressView } from './progressView.js';

export function initVoiceView() {
    const container = document.getElementById('voice-container');
    
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Customize Character Voices</h2>
            <div id="voice-cards-container" class="mb-6"></div>
            <div class="flex items-center mb-6">
                <input type="checkbox" id="background-music" class="mr-2">
                <label for="background-music">Add background music</label>
            </div>
            <div class="flex space-x-4">
                <button id="back-to-analysis" class="btn-secondary">Back</button>
                <button id="generate-podcast" class="btn-primary">Generate Podcast</button>
            </div>
        </div>
    `;

    document.getElementById('back-to-analysis').addEventListener('click', showAnalysisView);
    document.getElementById('generate-podcast').addEventListener('click', () => {
        saveVoiceSettings();
        showProgressView();
    });
}

export function showVoiceView() {
    updateVoiceCards();
    document.getElementById('analysis-view').classList.add('hidden');
    document.getElementById('voice-view').classList.remove('hidden');
}

function updateVoiceCards() {
    if (!state.analysisResults) return;
    
    const container = document.getElementById('voice-cards-container');
    const speakers = state.analysisResults.speakers || [{ name: 'Host' }, { name: 'Expert' }];
    
    container.innerHTML = speakers.map(speaker => {
        const speakerId = speaker.name.replace(/\s+/g, '-').toLowerCase();
        return `
            <div class="voice-card mb-4 p-4 border rounded-lg">
                <h3 class="font-medium mb-3">${speaker.name}</h3>
                <div class="mb-3">
                    <label class="block mb-1">Voice Type</label>
                    <select id="voice-type-${speakerId}" class="w-full p-2 border rounded">
                        <option value="neutral">Neutral</option>
                        <option value="deep">Deep</option>
                        <option value="high">High</option>
                        <option value="child">Child</option>
                        <option value="elder">Elderly</option>
                    </select>
                </div>
                <div>
                    <label class="block mb-1">Emotion Level</label>
                    <select id="emotion-${speakerId}" class="w-full p-2 border rounded">
                        <option value="low">Subtle</option>
                        <option value="medium" selected>Moderate</option>
                        <option value="high">Dramatic</option>
                    </select>
                </div>
            </div>
        `;
    }).join('');
}

function saveVoiceSettings() {
    if (!state.analysisResults) return;
    
    const speakers = state.analysisResults.speakers || [{ name: 'Host' }, { name: 'Expert' }];
    state.voiceSettings = {};
    
    speakers.forEach(speaker => {
        const speakerId = speaker.name.replace(/\s+/g, '-').toLowerCase();
        state.voiceSettings[speaker.name] = {
            voiceType: document.getElementById(`voice-type-${speakerId}`).value,
            emotion: document.getElementById(`emotion-${speakerId}`).value
        };
    });
}