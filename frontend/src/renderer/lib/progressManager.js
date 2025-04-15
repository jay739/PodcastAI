// src/renderer/lib/progressManager.js
import { proxiedState as state } from '../store/store.js';

export function initializeProgress() {
    state.progress = {
        current: 0,
        max: 100,
        message: '',
        isComplete: false
    };
}

export function updateProgress(percentage, message = '') {
    percentage = Math.max(0, Math.min(100, percentage));
    state.progress.current = percentage;
    state.progress.message = message;
    state.progress.isComplete = percentage >= 100;
    
    // Dispatch event for any progress listeners
    const event = new CustomEvent('progressUpdate', {
        detail: {
            percentage,
            message,
            isComplete: percentage >= 100
        }
    });
    document.dispatchEvent(event);
}

export function resetProgress() {
    initializeProgress();
}