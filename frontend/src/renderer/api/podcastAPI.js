export const podcastAPI = {
    files: {
        select: () => window.ipcRenderer.invoke('files:select'),
        upload: (filePath) => window.ipcRenderer.invoke('files:upload', filePath),
        analyze: (fileId) => window.ipcRenderer.invoke('files:analyze', fileId)
    },
    podcast: {
        generate: (config) => window.ipcRenderer.invoke('podcast:generate', config),
        download: (jobId) => window.ipcRenderer.invoke('podcast:download', jobId)
    },
    on: {
        progress: (callback) => window.ipcRenderer.on('progress-update', callback)
    }
}