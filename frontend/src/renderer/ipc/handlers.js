import { ipcMain } from 'electron';
import { podcastAPI } from '../api/apiToggle.js';

// Authentication handlers
ipcMain.handle('login', async (event, { username, password }) => {
  try {
    const response = await podcastAPI.auth.login({ username, password });
    return { success: true, data: response };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('register', async (event, { username, password, email }) => {
  try {
    const response = await podcastAPI.auth.register({ username, password, email });
    return { success: true, data: response };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
});

// File upload handlers
ipcMain.handle('upload-file', async (event, filePath) => {
  try {
    const response = await podcastAPI.files.upload(filePath);
    return { success: true, data: response };
  } catch (error) {
    console.error('File upload error:', error);
    return { success: false, error: error.message };
  }
});

// Analysis handlers
ipcMain.handle('analyze-file', async (event, fileId) => {
  try {
    const response = await podcastAPI.analysis.analyze(fileId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Analysis error:', error);
    return { success: false, error: error.message };
  }
});

// Podcast generation handlers
ipcMain.handle('generate-podcast', async (event, { fileId, speakers, host, ttsModel }) => {
  try {
    const response = await podcastAPI.podcast.generate({
      fileID: fileId,
      speakers,
      host,
      tts_model: ttsModel
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Podcast generation error:', error);
    return { success: false, error: error.message };
  }
});

// Voice preview handlers
ipcMain.handle('preview-voice', async (event, { text, gender, tone, speaker, ttsModel }) => {
  try {
    const response = await podcastAPI.podcast.previewVoice({
      text,
      gender,
      tone,
      speaker,
      tts_model: ttsModel
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Voice preview error:', error);
    return { success: false, error: error.message };
  }
}); 