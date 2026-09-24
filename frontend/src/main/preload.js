const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');

// Log when IPC handlers are available
ipcRenderer.invoke('get-current-user').then(() => {
  console.log('Auth handlers are available');
}).catch(err => {
  console.error('Auth handlers not available:', err);
});

contextBridge.exposeInMainWorld('podcastAPI', {
  files: {
    select: () => ipcRenderer.invoke('files:select'),
    upload: (filePath) => ipcRenderer.invoke('files:upload', filePath),
    analyze: (fileID) => ipcRenderer.invoke('files:analyze', fileID),
  },
  podcast: {
    generate: (config) => ipcRenderer.invoke('podcast:generate', config),
    download: (job_id) => ipcRenderer.invoke('podcast:download', job_id),
  },
  auth: {
    login: (credentials) => ipcRenderer.invoke('login', credentials),
    signup: (userData) => ipcRenderer.invoke('signup', userData),
    logout: () => ipcRenderer.invoke('logout'),
    getCurrentUser: () => ipcRenderer.invoke('get-current-user')
  },
  on: {
    progress: (callback) => {
      ipcRenderer.on('podcast:progress', (_, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('podcast:progress');
    }
  },
  
  // System info
  // versions: process.versions
});

console.log('Preload script completed');
