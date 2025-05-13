export const state = {
  currentFile: null,
  analysisResults: null,
  voiceSettings: {},
  generationJob: null,
  speakers: [],
  progress: {
    current: 0,
    max: 100,
    message: '',
    isComplete: false
  }
};

export function resetState() {
  state.currentFile = null;
  state.analysisResults = null;
  state.voiceSettings = {};
  state.generationJob = null;
  state.speakers = []; 
  resetProgress();
}
