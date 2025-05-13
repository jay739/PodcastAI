const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const axios = require('axios')
const log = require('electron-log')

const API_URL = 'http://localhost:5001'
const MAX_FILE_SIZE = 50 * 1024 * 1024 

module.exports = { setupFileHandlers }

function setupFileHandlers() {
    ipcMain.handle('files:select', handleFileSelect)
    ipcMain.handle('files:upload', handleFileUpload)
    ipcMain.handle('files:analyze', handleFileAnalysis)
}

async function handleFileSelect() {
    try {
        const { filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'PDF Files', extensions: ['pdf'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        })

        if (!filePaths || filePaths.length === 0) {
            log.info('File selection cancelled by user')
            return null
        }

        const selectedPath = filePaths[0]
        log.info(`Selected file: ${selectedPath}`)
        return selectedPath

    } catch (error) {
        log.error('File selection error:', error)
        throw new Error('Failed to select file')
    }
}

async function handleFileUpload(_, filePath) {
    try {
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('Invalid file path provided')
        }

        if (path.isAbsolute(filePath)) {
            const normalizedPath = path.normalize(filePath)
            if (normalizedPath !== filePath) {
                throw new Error('Potential path traversal attempt detected')
            }
        }

        const stats = fs.statSync(filePath)
        if (!stats.isFile()) {
            throw new Error('Path does not point to a valid file')
        }

        if (stats.size > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`)
        }

        const form = new FormData()
        form.append('file', fs.createReadStream(filePath), {
            filename: path.basename(filePath),
            knownLength: stats.size
        })

        log.info(`Uploading file: ${filePath} (${stats.size} bytes)`)
        const response = await axios.post(`${API_URL}/api/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Content-Length': form.getLengthSync()
            },
            maxContentLength: MAX_FILE_SIZE,
            maxBodyLength: MAX_FILE_SIZE,
            timeout: 30000
        })

        log.info('Upload successful:', response.data)
        return response.data

    } catch (error) {
        const errorMessage = getErrorMessage(error)
        log.error('File upload failed:', errorMessage)
        throw new Error(errorMessage)
    }
}

async function handleFileAnalysis(_, fileID) {
    try {
        if (!fileID || typeof fileID !== 'string') {
            throw new Error('Invalid file ID provided')
        }

        log.info(`Starting analysis for file ID: ${fileID}`)
        const response = await axios.get(`${API_URL}/api/analyze/${fileID}`, {
            timeout: 60000
        })

        if (!response.data || !response.data.success) {
            throw new Error('Analysis failed or returned invalid response')
        }

        // ✅ Normalize structure so frontend doesn't have to dig into .data
        return {
            ...response.data
        }

    } catch (error) {
        const errorMessage = getErrorMessage(error)
        log.error('Analysis failed:', errorMessage)
        throw new Error(errorMessage)
    }
}

function getErrorMessage(error) {
    if (error.response) {
        return error.response.data?.error || 
               error.response.data?.message || 
               `Server responded with ${error.response.status}`
    } else if (error.request) {
        return 'No response received from server'
    } else {
        return error.message || 'Unknown error occurred'
    }
}
