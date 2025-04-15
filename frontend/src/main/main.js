const { app } = require('electron')
const { setupFileHandlers } = require('./ipc/fileHandlers')
const { setupPodcastHandlers } = require('./ipc/podcastHandlers')
const log = require('electron-log')

// Configure logging
log.transports.file.level = 'debug'
log.transports.console.level = 'debug'

log.info('App starting...')

// Initialize IPC Handlers
function initialize() {
  setupFileHandlers()
  setupPodcastHandlers()
}

app.whenReady().then(() => {
  log.info('App is ready')
  initialize()
  
  const createMainWindow = require('./mainWindow')
  const mainWindow = createMainWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      log.info('Creating new window')
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  log.info('All windows closed')
  if (process.platform !== 'darwin') app.quit()
})

// Error handling
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// ipcMain.on('console-log', (event, { method, args }) => {
//   const formattedArgs = args.map(arg => 
//     typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
//   )
//   log[method](...formattedArgs)
// })