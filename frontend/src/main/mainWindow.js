const { BrowserWindow } = require('electron')
const path = require('path')
const log = require('electron-log')

module.exports = function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: true // Ensure DevTools are available
    }
  })

  // Load the index.html file
  const indexFilePath = process.env.NODE_ENV === 'development'
  ? path.join(__dirname, '../../index.html')  // Dev path
  : path.join(__dirname, '../index.html')    // Production path

console.log('Loading index file from:', indexFilePath)  // Verify path
win.loadFile(indexFilePath).catch(err => {
  console.error('Failed to load index.html:', err)
  process.exit(1)
})
  win.webContents.openDevTools();

  // Open DevTools automatically in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools({ mode: 'bottom' })
  }

  // Capture renderer process logs
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['', 'INFO', 'WARN', 'ERROR', 'DEBUG']
    log.log(`[Renderer ${levels[level]}] ${message} (${sourceId}:${line})`)
  })

  // Handle renderer process crashes
  win.webContents.on('render-process-gone', (event, details) => {
    log.error('Renderer process crashed:', details)
  })

  // Handle failed loads
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error(`Failed to load: ${errorDescription} (${errorCode})`)
  })

  return win
}