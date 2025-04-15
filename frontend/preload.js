const { contextBridge, ipcRenderer } = require('electron')

// Validate channel names to prevent potential security issues
const validChannels = {
  files: ['select', 'upload', 'analyze'],
  podcast: ['generate', 'download'],
  jobs: ['status'],
  events: ['progress']
}

contextBridge.exposeInMainWorld('podcastAPI', {
  // File operations
  files: {
    select: () => ipcRenderer.invoke('files:select'),
    upload: (filePath) => {
      if (typeof filePath !== 'string') {
        throw new Error('Invalid file path provided')
      }
      return ipcRenderer.invoke('files:upload', filePath)
    },
    analyze: (fileId) => {
      if (typeof fileId !== 'string') {
        throw new Error('Invalid file ID provided')
      }
      return ipcRenderer.invoke('files:analyze', fileId)
    }
  },
  
  // Podcast operations
  podcast: {
    generate: (config) => {
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid configuration provided')
      }
      return ipcRenderer.invoke('podcast:generate', config)
    },
    download: (jobId) => {
      if (typeof jobId !== 'string') {
        throw new Error('Invalid job ID provided')
      }
      return ipcRenderer.invoke('podcast:download', jobId)
    }
  },
  
  // Job monitoring
  jobs: {
    getStatus: (jobId) => {
      if (typeof jobId !== 'string') {
        throw new Error('Invalid job ID provided')
      }
      return ipcRenderer.invoke('jobs:status', jobId)
    }
  },
  
  // Event system
  on: {
    progress: (callback) => {
      // Validate callback is a function
      if (typeof callback !== 'function') {
        throw new Error('Progress callback must be a function')
      }
      
      // Cleanup function to remove listener
      const listener = (_, progress) => callback(progress)
      ipcRenderer.on('podcast:progress', listener)
      
      return () => {
        ipcRenderer.removeListener('podcast:progress', listener)
      }
    }
  }
})

// Security: Prevent renderer from using ipcRenderer directly
contextBridge.exposeInMainWorld('electron', {
  versions: process.versions,
  platform: process.platform
})