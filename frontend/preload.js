// // In preload.js
// const { contextBridge, ipcRenderer } = require('electron');

// // Expose protected methods that allow the renderer process to use
// // the ipcRenderer without exposing the entire object
// contextBridge.exposeInMainWorld(
//     "api", {
//         uploadPdf: (filePath) => {
//             return ipcRenderer.invoke('upload-pdf', filePath);
//         },
//         analyzePdf: (fileId) => {
//             return ipcRenderer.invoke('analyze-pdf', fileId);
//         },
//         generatePodcast: (config) => {
//             return ipcRenderer.invoke('generate-podcast', config);
//         },
//         jobStatus: (jobId) => {
//             return ipcRenderer.invoke('job-status', jobId);
//         },
//         downloadPodcast: (jobId) => {
//             return ipcRenderer.invoke('download-podcast', jobId);
//         }
//     }
// );

// // In main.js
// const { app, BrowserWindow, ipcMain, dialog } = require('electron');
// const path = require('path');
// const fs = require('fs');
// const axios = require('axios');
// const FormData = require('form-data');

// // Flask backend URL
// const API_URL = 'http://localhost:5000';

// // Handle API calls from renderer process
// ipcMain.handle('upload-pdf', async (event, filePath) => {
//     try {
//         const fileStream = fs.createReadStream(filePath);
//         const form = new FormData();
//         form.append('file', fileStream);
        
//         const response = await axios.post(`${API_URL}/upload`, form, {
//             headers: {
//                 ...form.getHeaders()
//             }
//         });
        
//         return response.data;
//     } catch (error) {
//         console.error('Upload error:', error);
//         throw new Error(error.response?.data?.message || 'Upload failed');
//     }
// });

// ipcMain.handle('analyze-pdf', async (event, fileId) => {
//     try {
//         const response = await axios.get(`${API_URL}/analyze/${fileId}`);
//         return response.data;
//     } catch (error) {
//         console.error('Analysis error:', error);
//         throw new Error(error.response?.data?.message || 'Analysis failed');
//     }
// });

// ipcMain.handle('generate-podcast', async (event, config) => {
//     try {
//         const response = await axios.post(`${API_URL}/generate`, config);
//         return response.data;
//     } catch (error) {
//         console.error('Generation error:', error);
//         throw new Error(error.response?.data?.message || 'Generation failed');
//     }
// });

// ipcMain.handle('job-status', async (event, jobId) => {
//     try {
//         const response = await axios.get(`${API_URL}/status/${jobId}`);
//         return response.data;
//     } catch (error) {
//         console.error('Status check error:', error);
//         throw new Error(error.response?.data?.message || 'Status check failed');
//     }
// });

// ipcMain.handle('download-podcast', async (event, jobId) => {
//     try {
//         // Get the podcast URL from the server
//         const response = await axios.get(`${API_URL}/download/${jobId}`);
//         const audioUrl = response.data.url;
        
//         // Ask user where to save the file
//         const { filePath } = await dialog.showSaveDialog({
//             buttonLabel: 'Save Podcast',
//             defaultPath: path.join(app.getPath('downloads'), `podcast-${jobId}.mp3`),
//             filters: [
//                 { name: 'Audio Files', extensions: ['mp3'] }
//             ]
//         });
        
//         if (filePath) {
//             // Download the file
//             const writer = fs.createWriteStream(filePath);
//             const audioResponse = await axios({
//                 url: audioUrl,
//                 method: 'GET',
//                 responseType: 'stream'
//             });
            
//             audioResponse.data.pipe(writer);
            
//             return new Promise((resolve, reject) => {
//                 writer.on('finish', () => resolve(filePath));
//                 writer.on('error', reject);
//             });
//         }
//         return null;
//     } catch (error) {
//         console.error('Download error:', error);
//         throw new Error(error.response?.data?.message || 'Download failed');
//     }
// });


const { contextBridge, ipcRenderer, dialog } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  uploadPdf: (filePath) => ipcRenderer.invoke('upload-pdf', filePath),
  selectPdfFile: async () => {
    // This will need a corresponding handler in main.js
    return ipcRenderer.invoke('select-pdf-file');
  },
  
  // PDF analysis and visualization
  analyzePdf: (fileId) => ipcRenderer.invoke('analyze-pdf', fileId),
  visualizePdf: (filePath) => ipcRenderer.invoke('visualize-pdf', filePath),
  
  // Podcast generation and management
  generatePodcast: (config) => ipcRenderer.invoke('generate-podcast', config),
  checkJobStatus: (jobId) => ipcRenderer.invoke('job-status', jobId),
  downloadPodcast: (jobId) => ipcRenderer.invoke('download-podcast', jobId),
  
  // Event listeners for async communication
  onPdfVisualized: (callback) => {
    ipcRenderer.on('pdf-visualized', (_, data) => callback(data));
    return () => ipcRenderer.removeListener('pdf-visualized', callback);
  },
  
  onPdfUploaded: (callback) => {
    ipcRenderer.on('pdf-uploaded', (_, data) => callback(data));
    return () => ipcRenderer.removeListener('pdf-uploaded', callback);
  },
  
  onPodcastProgress: (callback) => {
    ipcRenderer.on('podcast-progress', (_, data) => callback(data));
    return () => ipcRenderer.removeListener('podcast-progress', callback);
  }
});
