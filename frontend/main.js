const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Flask API URL
const API_URL = 'http://localhost:5000';

// Create the main application window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Correct path to preload.js
      preload: path.join(__dirname, 'preload.js'),
      // Improved security settings
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the HTML file from the Frontend directory
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // Optionally open DevTools during development
  // mainWindow.webContents.openDevTools();
}

// Handle PDF file uploads with promise-based IPC
ipcMain.handle('upload-pdf', async (event, filePath) => {
  try {
    console.log(`Processing PDF: ${filePath}`);
    
    // Create a form data object for the file
    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    form.append('file', fileStream);
    
    // Send to Flask backend
    const response = await axios.post(`${API_URL}/upload`, form, {
      headers: {
        ...form.getHeaders()
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.response?.data?.message || 'Upload failed');
  }
});

// Handle document analysis
ipcMain.handle('analyze-pdf', async (event, fileId) => {
  try {
    const response = await axios.get(`${API_URL}/analyze/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(error.response?.data?.message || 'Analysis failed');
  }
});

// Handle podcast generation
ipcMain.handle('generate-podcast', async (event, config) => {
  try {
    console.log('Generating podcast with config:', config);
    const response = await axios.post(`${API_URL}/generate`, config);
    return response.data;
  } catch (error) {
    console.error('Generation error:', error);
    throw new Error(error.response?.data?.message || 'Generation failed');
  }
});

// Check job status
ipcMain.handle('job-status', async (event, jobId) => {
  try {
    const response = await axios.get(`${API_URL}/status/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Status check error:', error);
    throw new Error(error.response?.data?.message || 'Status check failed');
  }
});

// Handle podcast download
ipcMain.handle('download-podcast', async (event, jobId) => {
  try {
    // Get the podcast URL from the server
    const response = await axios.get(`${API_URL}/download/${jobId}`);
    const audioUrl = response.data.url;
    
    // Ask user where to save the file
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: 'Save Podcast',
      defaultPath: path.join(app.getPath('downloads'), `podcast-${jobId}.mp3`),
      filters: [
        { name: 'Audio Files', extensions: ['mp3'] }
      ]
    });
    
    if (filePath) {
      // Download the file
      const writer = fs.createWriteStream(filePath);
      const audioResponse = await axios({
        url: audioUrl,
        method: 'GET',
        responseType: 'stream'
      });
      
      audioResponse.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
      });
    }
    return null;
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(error.response?.data?.message || 'Download failed');
  }
});

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// const { app, BrowserWindow, ipcMain, dialog } = require('electron');
// const path = require('path');
// const fs = require('fs');
// const axios = require('axios');
// const FormData = require('form-data');
// const pdf = require('pdf-parse');

// // Flask API URL
// const API_URL = 'http://localhost:5000';

// // Create the main application window
// function createWindow() {
//   const mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       // Correct path to preload.js
//       preload: path.join(__dirname, 'preload.js'),
//       // Improved security settings
//       nodeIntegration: false,
//       contextIsolation: true
//     }
//   });

//   // Load the HTML file from the Frontend directory
//   mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
//   // Optionally open DevTools during development
//   // mainWindow.webContents.openDevTools();
// }

// // Handle PDF file uploads with promise-based IPC
// ipcMain.handle('upload-pdf', async (event, filePath) => {
//   try {
//     console.log(`Processing PDF: ${filePath}`);
    
//     // Create a form data object for the file
//     const form = new FormData();
//     const fileStream = fs.createReadStream(filePath);
//     form.append('file', fileStream);
    
//     // Send to Flask backend
//     const response = await axios.post(`${API_URL}/upload`, form, {
//       headers: {
//         ...form.getHeaders()
//       }
//     });
    
//     // Extract basic PDF info for visualization
//     const pdfInfo = await extractPdfInfo(filePath);
    
//     return {
//       ...response.data,
//       pdfInfo
//     };
//   } catch (error) {
//     console.error('Upload error:', error);
//     throw new Error(error.response?.data?.message || 'Upload failed');
//   }
// });

// // Extract PDF information for visualization
// async function extractPdfInfo(filePath) {
//   try {
//     const dataBuffer = fs.readFileSync(filePath);
//     const data = await pdf(dataBuffer);
    
//     // Basic PDF metadata and statistics
//     const wordCount = data.text.split(/\s+/).length;
//     const pageCount = data.numpages;
//     const charCount = data.text.length;
    
//     // Simple content analysis
//     const paragraphs = data.text.split(/\n\s*\n/).length;
//     const sentences = data.text.split(/[.!?]+\s/).length;
    
//     // Word frequency analysis (top 20 words)
//     const words = data.text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
//     const wordFrequency = {};
//     words.forEach(word => {
//       wordFrequency[word] = (wordFrequency[word] || 0) + 1;
//     });
    
//     const topWords = Object.entries(wordFrequency)
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, 20)
//       .map(([word, count]) => ({ word, count }));
    
//     return {
//       pageCount,
//       wordCount,
//       charCount,
//       paragraphs,
//       sentences,
//       topWords,
//       preview: data.text.substring(0, 500) + '...' // Text preview
//     };
//   } catch (error) {
//     console.error('PDF info extraction error:', error);
//     return {
//       error: 'Could not extract PDF information'
//     };
//   }
// }

// // Handle PDF visualization request
// ipcMain.handle('visualize-pdf', async (event, filePath) => {
//   try {
//     const pdfInfo = await extractPdfInfo(filePath);
//     return pdfInfo;
//   } catch (error) {
//     console.error('Visualization error:', error);
//     throw new Error('PDF visualization failed');
//   }
// });

// // Handle document analysis
// ipcMain.handle('analyze-pdf', async (event, fileId) => {
//   try {
//     const response = await axios.get(`${API_URL}/analyze/${fileId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Analysis error:', error);
//     throw new Error(error.response?.data?.message || 'Analysis failed');
//   }
// });

// // Handle podcast generation
// ipcMain.handle('generate-podcast', async (event, config) => {
//   try {
//     console.log('Generating podcast with config:', config);
//     const response = await axios.post(`${API_URL}/generate`, config);
//     return response.data;
//   } catch (error) {
//     console.error('Generation error:', error);
//     throw new Error(error.response?.data?.message || 'Generation failed');
//   }
// });

// // Check job status
// ipcMain.handle('job-status', async (event, jobId) => {
//   try {
//     const response = await axios.get(`${API_URL}/status/${jobId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Status check error:', error);
//     throw new Error(error.response?.data?.message || 'Status check failed');
//   }
// });

// // Handle podcast download
// ipcMain.handle('download-podcast', async (event, jobId) => {
//   try {
//     // Get the podcast URL from the server
//     const response = await axios.get(`${API_URL}/download/${jobId}`);
//     const audioUrl = response.data.url;
    
//     // Ask user where to save the file
//     const { filePath } = await dialog.showSaveDialog({
//       buttonLabel: 'Save Podcast',
//       defaultPath: path.join(app.getPath('downloads'), `podcast-${jobId}.mp3`),
//       filters: [
//         { name: 'Audio Files', extensions: ['mp3'] }
//       ]
//     });
    
//     if (filePath) {
//       // Download the file
//       const writer = fs.createWriteStream(filePath);
//       const audioResponse = await axios({
//         url: audioUrl,
//         method: 'GET',
//         responseType: 'stream'
//       });
      
//       audioResponse.data.pipe(writer);
      
//       return new Promise((resolve, reject) => {
//         writer.on('finish', () => resolve(filePath));
//         writer.on('error', reject);
//       });
//     }
//     return null;
//   } catch (error) {
//     console.error('Download error:', error);
//     throw new Error(error.response?.data?.message || 'Download failed');
//   }
// });

// app.whenReady().then(() => {
//   createWindow();
  
//   app.on('activate', function () {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
//   });
// });

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit();
// });
