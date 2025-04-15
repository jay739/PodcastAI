import { updateProgress } from '../lib/progressManager.js';

export const state = {
    currentFile: null,
    analysisResults: null,
    voiceSettings: {},
    generationJob: null,
    progress: {
        current: 0,
        max: 100,
        message: '',
        isComplete: false
    },

    reset() {
        this.currentFile = null;
        this.analysisResults = null;
        this.voiceSettings = {};
        this.generationJob = null;
        this.progress = {
            current: 0,
            max: 100,
            message: '',
            isComplete: false
        };
        updateProgress(0, '');
    },

    setFile(file) {
        this.currentFile = {
            name: file.name,
            size: file.size,
            path: file.path,
            id: file.id || null
        };
    },

    setAnalysisResults(results) {
        this.analysisResults = {
            page_count: results.page_count || 0,
            word_count: results.word_count || 0,
            char_count: results.char_count || 0,
            speakers: results.speakers || [],
            full_text: results.full_text || '',
            chunks: results.chunks || []
        };
    },

    updateVoiceSettings(settings) {
        this.voiceSettings = { ...settings };
    },

    setGenerationJob(job) {
        this.generationJob = {
            id: job.id,
            status: job.status || 'pending',
            filePath: job.filePath || null,
            createdAt: job.createdAt || new Date().toISOString()
        };
    },

    updateProgress(percentage, message = '') {
        this.progress.current = percentage;
        this.progress.message = message;
        this.progress.isComplete = percentage >= 100;
        updateProgress(percentage, message);
    }
};

// ✅ Always use proxy for logging
export const proxiedState = new Proxy(state, {
    set(target, property, value) {
        console.log(`State change: ${property} =`, value);
        return Reflect.set(target, property, value);
    }
});
