import { updateProgress } from '../lib/progressManager.js';

export const state = {
    currentFile: null,
    analysisResults: null,
    voiceSettings: {},
    speakers: [],
    transcriptText: "",
    generationJob: null,
    progress: {
        current: 0,
        max: 100,
        message: '',
        isComplete: false
    },
    user: null,
    listeners: new Set(),

    setFile(fileObj) {
        this.currentFile = {
            name: fileObj.name,
            size: fileObj.size,
            path: fileObj.path,
            id: fileObj.id || null
        };
    },

    setAnalysisResults(results) {
        this.analysisResults = {
            page_count: results.page_count || 0,
            word_count: results.word_count || 0,
            char_count: results.char_count || 0,
            speakers: results.speakers || [],
            full_text: results.full_text || '',
            chunks: results.chunks || [],
            top_keywords: results.top_keywords || [],
            keyword_counts: results.keyword_counts || [],
            sentiment: results.sentiment || {},
            readability: results.readability || {},
            entities: results.entities || [],
            diversity: results.diversity,
            topics: results.topics || {}
        };
    },

    updateVoiceSettings(settings) {
        this.voiceSettings = { ...settings };
    },

    setSpeakers(speakers) {
        this.speakers = [...speakers];
    },

    setTranscript(text) {
        this.transcriptText = text || "";
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
    },

    reset() {
        this.currentFile = null;
        this.analysisResults = null;
        this.voiceSettings = {};
        this.speakers = [];
        this.transcriptText = "";
        this.generationJob = null;
        this.progress = {
            current: 0,
            max: 100,
            message: '',
            isComplete: false
        };
        updateProgress(0, '');
    },

    setUser(user) {
        this.user = user;
        if (user && user.token) {
            localStorage.setItem('token', user.token);
        }
        this.notifyListeners();
    },

    getUser() {
        return this.user;
    },

    isAuthenticated() {
        return !!this.user;
    },

    logout() {
        this.user = null;
        localStorage.removeItem('token');
        this.notifyListeners();
    },

    notifyListeners() {
        this.listeners.forEach(listener => listener());
    }
};

// ✅ Always use proxy for logging
export const proxiedState = new Proxy(state, {
    set(target, property, value) {
        console.log(`State change: ${property} =`, value);
        return Reflect.set(target, property, value);
    }
});
