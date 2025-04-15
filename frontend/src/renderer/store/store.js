import { updateProgress } from '../lib/progressManager.js';

export const state = {
    // Current file being processed
    currentFile: null,
    
    // Analysis results from PDF processing
    analysisResults: null,
    
    // Voice customization settings
    voiceSettings: {},
    
    // Current podcast generation job
    generationJob: null,
    
    // Application progress
    progress: {
        current: 0,
        max: 100,
        message: '',
        isComplete: false
    },
    
    // Reset all state to initial values
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
    
    // Set current file
    setFile(file) {
        this.currentFile = {
            name: file.name,
            size: file.size,
            path: file.path,
            id: file.id || null
        };
    },
    
    // Set analysis results
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
    
    // Update voice settings
    updateVoiceSettings(settings) {
        this.voiceSettings = { ...settings };
    },
    
    // Set generation job
    setGenerationJob(job) {
        this.generationJob = {
            id: job.id,
            status: job.status || 'pending',
            filePath: job.filePath || null,
            createdAt: job.createdAt || new Date().toISOString()
        };
    },
    
    // Update progress
    updateProgress(percentage, message = '') {
        this.progress.current = percentage;
        this.progress.message = message;
        this.progress.isComplete = percentage >= 100;
        updateProgress(percentage, message);
    }
};

// // For debugging, log state changes
// if (process.env.NODE_ENV === 'development') {
//     const handler = {
//         set(target, property, value) {
//             console.log(`State change: ${property} =`, value);
//             return Reflect.set(target, property, value);
//         }
//     };
    
//     export const proxiedState = new Proxy(state, handler);
//     } 
// else {
//     export const proxiedState = state;
//     }