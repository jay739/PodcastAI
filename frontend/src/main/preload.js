const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('podcastAPI', {
  files:{
  select: () => ipcRenderer.invoke('files:select'),
  upload: (filePath) => ipcRenderer.invoke('files:upload', filePath),
  analyze: (fileID) => ipcRenderer.invoke('files:analyze', fileID),
  },
  podcast:{
  generate: (config) => ipcRenderer.invoke('podcast:generate', config),
  download: (job_id) => ipcRenderer.invoke('podcast:download', job_id),
  },
  on:{
    progress: (callback) => {
    ipcRenderer.on('podcast:progress', (_, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('podcast:progress');
  }
},
  
  // System info
  // versions: process.versions
});
