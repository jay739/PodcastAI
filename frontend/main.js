const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs');

const API_URL = 'http://localhost:5001'
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'index.html'))
  // mainWindow.webContents.openDevTools() // Dev tools for debugging
}

// File Operations
ipcMain.handle('files:upload', async (_, filePath) => {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    
    const response = await axios.post(`${API_URL}/api/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Upload error details:', error);
    throw new Error(error.response?.data?.error || 'File upload failed');
  }
});

ipcMain.handle('files:select', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  })
  return filePaths[0] || null
})

ipcMain.handle('files:analyze', async (_, fileId) => {
  try {
    const response = await axios.get(`${API_URL}/api/analyze/${fileId}`)
    return response.data
  } catch (error) {
    console.error('Analysis error:', error)
    throw new Error(error.response?.data?.error || 'Analysis failed')
  }
})

// Podcast Generation
ipcMain.handle('podcast:generate', async (_, config) => {
  try {
    const response = await axios.post(`${API_URL}/api/generate`, config)
    return response.data
  } catch (error) {
    console.error('Generation error:', error)
    throw new Error(error.response?.data?.error || 'Generation failed')
  }
})

ipcMain.handle('jobs:status', async (_, jobId) => {
  try {
    const response = await axios.get(`${API_URL}/api/status/${jobId}`)
    return response.data
  } catch (error) {
    console.error('Status error:', error)
    throw new Error(error.response?.data?.error || 'Status check failed')
  }
})

ipcMain.handle('check-server', async () => {
  try {
    await axios.get(`${API_URL}/api/status/ping`);
    return true;
  } catch {
    return false;
  }
});

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

ipcMain.handle('podcast:download', async (_, jobId) => {
  try {
      const response = await axios.get(`${API_URL}/api/download/${jobId}`);
      return {
          url: response.data.url,
          fileId: jobId  
      };
  } catch (error) {
      console.error('Download error:', error);
      throw new Error(error.response?.data?.error || 'Download failed');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})