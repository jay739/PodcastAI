import { state } from '../store/store.js';
import { handleFileSelection, setupFileDropZone } from '../lib/fileUtils.js';
import { showAnalysisView } from './analysisView.js';

export function initUploadView() {
    const container = document.getElementById('upload-container');
    container.innerHTML = `
        <div class="file-drop-area p-8 border-2 border-dashed rounded-lg text-center" id="drop-area">
            <p class="mb-4 text-gray-600">Drag & drop your PDF here, or</p>
            <input type="file" id="file-input" accept=".pdf" class="hidden">
            <button id="select-file-btn" class="btn-primary">
                Select File
            </button>
            <p class="mt-2 text-sm text-gray-500" id="file-info">
                No file selected
            </p>
        </div>
    `;

    const fileInput = document.getElementById('file-input');
    const selectBtn = document.getElementById('select-file-btn');
    const dropArea = document.getElementById('drop-area');
    const fileInfo = document.getElementById('file-info');

    setupFileDropZone(dropArea, fileInput, async () => {
        try {
            const file = await handleFileSelection(fileInput);
            fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
            showAnalysisView();
        } catch (error) {
            fileInfo.textContent = error.message;
            fileInfo.classList.add('text-red-500');
        }
    });

    selectBtn.addEventListener('click', () => fileInput.click());
}

export function showUploadView() {
    document.getElementById('upload-view').classList.remove('hidden');
    document.getElementById('analysis-view').classList.add('hidden');
    document.getElementById('voice-view').classList.add('hidden');
    document.getElementById('progress-view').classList.add('hidden');
    document.getElementById('results-view').classList.add('hidden');
}