const { app } = require('electron')
const { setupFileHandlers } = require('./src/main/ipc/fileHandlers')
const { setupPodcastHandlers } = require('./src/main/ipc/podcastHandlers')
const createMainWindow = require('./src/main/mainWindow')
const axios = require('axios')
const FormData = require('form-data')


const API_URL = 'http://localhost:5001'

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
  setupFileHandlers()
  setupPodcastHandlers()
  
  const mainWindow = createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
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