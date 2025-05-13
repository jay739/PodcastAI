const { ipcMain } = require('electron')
const axios = require('axios')
const log = require('electron-log')
const path = require('path')
const fs = require('fs-extra')

const API_BASE_URL = 'http://localhost:5001/api';
const OUTPUT_FOLDER = path.join(__dirname, '../../../backend/outputs');

// Timeout constants
const GENERATION_TIMEOUT = 300000 // 5 minutes for generation
const DOWNLOAD_TIMEOUT = 60000 // 1 minute for download

module.exports = { setupPodcastHandlers }

function setupPodcastHandlers() {
    // Podcast generation handler
    ipcMain.handle('podcast:generate', handlePodcastGeneration)
    
    // Podcast download handler
    ipcMain.handle('podcast:download', handlePodcastDownload)
    
    // Podcast status handler
    ipcMain.handle('podcast:status', handlePodcastStatus)
    
    // Cleanup handler
    ipcMain.handle('podcast:cleanup', handlePodcastCleanup)

    // Preview voice handler
    ipcMain.handle('podcast:previewVoice', handlePodcastPreviewVoice)
}

async function handlePodcastGeneration(_, config) {
    try {
        validateGenerationConfig(config)
        
        log.info(`Starting podcast generation for file: ${config.fileID}`)
        
        const response = await axios.post(
            `${API_BASE_URL}/generate`,
            config,
            {
                timeout: GENERATION_TIMEOUT,
                headers: { 'Content-Type': 'application/json' }
            }
        )

        log.info(`Generation started successfully. Job ID: ${response.data.jobId}`)
        return response.data

    } catch (error) {
        const errorMessage = getErrorMessage(error, 'Podcast generation failed')
        log.error('Generation error:', errorMessage)
        throw new Error(errorMessage)
    }
}

async function handlePodcastDownload(_, jobId) {
    try {
        validateJobId(jobId)
        
        log.info(`Downloading podcast for job: ${jobId}`)
        
        // First get the download URL
        const statusResponse = await axios.get(
            `${API_BASE_URL}/download/${jobId}`,
            { timeout: DOWNLOAD_TIMEOUT }
        )

        // Then download the actual file
        const downloadResponse = await axios.get(
            statusResponse.data.url,
            {
                responseType: 'stream',
                timeout: DOWNLOAD_TIMEOUT
            }
        )

        // Ensure output directory exists
        await fs.ensureDir(OUTPUT_FOLDER)
        const outputPath = path.join(OUTPUT_FOLDER, `${jobId}.mp3`)
        
        // Save the file
        const writer = fs.createWriteStream(outputPath)
        downloadResponse.data.pipe(writer)
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                log.info(`Podcast saved to: ${outputPath}`)
                resolve({
                    success: true,
                    filePath: outputPath,
                    jobId: jobId
                })
            })
            writer.on('error', reject)
        })

    } catch (error) {
        const errorMessage = getErrorMessage(error, 'Podcast download failed')
        log.error('Download error:', errorMessage)
        throw new Error(errorMessage)
    }
}

async function handlePodcastStatus(_, jobId) {
    try {
        validateJobId(jobId)
        
        const response = await axios.get(
            `${API_BASE_URL}/status/${jobId}`,
            { timeout: DOWNLOAD_TIMEOUT }
        )
        
        return response.data
        
    } catch (error) {
        const errorMessage = getErrorMessage(error, 'Status check failed')
        log.error('Status error:', errorMessage)
        throw new Error(errorMessage)
    }
}

async function handlePodcastCleanup(_, jobId) {
    try {
        validateJobId(jobId)
        
        const filePath = path.join(OUTPUT_FOLDER, `${jobId}.mp3`)
        await fs.remove(filePath)
        
        log.info(`Cleaned up podcast file: ${filePath}`)
        return { success: true }
        
    } catch (error) {
        log.error('Cleanup error:', error)
        return { success: false }
    }
}

async function handlePodcastPreviewVoice(_, config) {
    try {
        const response = await axios.post(`${API_BASE_URL}/preview-voice`, config);
        return response.data;
    } catch (error) {
        console.error('Voice preview failed:', error);
        throw error;
    }
}

// Validation helpers
function validateGenerationConfig(config) {
    if (!config || typeof config !== 'object') {
        throw new Error('Invalid configuration provided')
    }
    if (!config.fileID || typeof config.fileID !== 'string') {
        throw new Error('Missing or invalid fileID')
    }
}

function validateJobId(jobId) {
    if (!jobId || typeof jobId !== 'string') {
        throw new Error('Invalid job ID provided')
    }
}

// Error formatting
function getErrorMessage(error, defaultMessage) {
    if (error.response) {
        return error.response.data?.error || 
               error.response.data?.message || 
               `${defaultMessage}: ${error.response.status}`
    }
    return error.message || defaultMessage
}