const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('podcastAPI', {
  // File operations
  selectFiles: () => ipcRenderer.invoke('files:select'),
  uploadFile: (filePath) => ipcRenderer.invoke('files:upload', filePath),
  analyzeFile: (fileId) => ipcRenderer.invoke('files:analyze', fileId),
  
  // Podcast operations
  generatePodcast: (config) => ipcRenderer.invoke('podcast:generate', config),
  downloadPodcast: (jobId) => ipcRenderer.invoke('podcast:download', jobId),
  
  // Progress updates
  onProgress: (callback) => {
    ipcRenderer.on('podcast:progress', (_, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('podcast:progress');
  },
  
  // System info
  // versions: process.versions
});
document.addEventListener('DOMContentLoaded', () => {
  window.podcastAPI.initializeApp();
});
