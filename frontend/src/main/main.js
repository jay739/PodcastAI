const { app, BrowserWindow } = require('electron')
const { setupFileHandlers } = require('./ipc/fileHandlers')
const { setupPodcastHandlers } = require('./ipc/podcastHandlers')
const log = require('electron-log')
log.info('App started')
const createMainWindow = require('./mainWindow')

// Initialize IPC Handlers
function initialize() {
  setupFileHandlers()
  setupPodcastHandlers()
}

app.whenReady().then(() => {
  initialize()
  const mainWindow = createMainWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})