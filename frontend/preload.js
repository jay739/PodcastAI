const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('podcastAPI', {
  // File operations
  files: {
    select: () => ipcRenderer.invoke('files:select'),
    upload: (filePath) => ipcRenderer.invoke('files:upload', filePath),
    analyze: (fileId) => ipcRenderer.invoke('files:analyze', fileId)
  },
  
  // Podcast generation
  podcast: {
    generate: (config) => ipcRenderer.invoke('podcast:generate', config),
    download: (jobId) => ipcRenderer.invoke('podcast:download', jobId)
  },
  
  // Job monitoring
  jobs: {
    getStatus: (jobId) => ipcRenderer.invoke('jobs:status', jobId)
  },
  
  // Event listeners
  on: {
    progress: (callback) => {
      ipcRenderer.on('podcast:progress', (_, progress) => callback(progress))
      return () => ipcRenderer.removeAllListeners('podcast:progress')
    }
  }
})