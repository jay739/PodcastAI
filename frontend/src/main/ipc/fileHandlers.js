const { ipcMain, dialog } = require('electron')
const { handleFileUpload } = require('./fileHandlers')

module.exports = function setupFileHandlers() {
    ipcMain.handle('files:select', async () => {
        const { filePaths } = await dialog.showOpenDialog({/* ... */})
        return filePaths[0] || null
    })
  
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

}