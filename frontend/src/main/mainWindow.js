const { BrowserWindow } = require('electron')
const path = require('path')

module.exports = function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../../preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
    })
  win.loadFile(path.normalize(path.join(__dirname, '../../../index.html')))
  return win
}