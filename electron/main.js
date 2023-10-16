import path from 'node:path'
import { BrowserWindow, app, shell } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'

import logoPath from '@resources/build/logo.png?path'
import icoLogoPath from '@resources/build/logo.ico?path'
import icnsLogoPath from '@resources/build/logo.icns?path'

import events from './events/index.js'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │

process.env.DIST = path.join(__dirname, '../dist')

let mainWindow
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  let icon = logoPath

  if (process.platform === 'win32') {
    icon = icoLogoPath
  }
  else if (process.platform === 'darwin') {
    icon = icnsLogoPath
  }

  mainWindow = new BrowserWindow({
    show: false,
    icon,
    minWidth: 1000,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      // nodeIntegration: true,
      // contextIsolation: false,
      preload: path.join(__dirname, './preload.js'),
      sandbox: false,
    },
    backgroundColor: 'white',
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Test active push message to Renderer-process.
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send(
      'main-process-message',
      new Date().toLocaleString(),
    )
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  }
  else {
    // win.loadFile('dist/index.html')
    mainWindow.loadFile(path.join(process.env.DIST, 'index.html'))
  }

  events(mainWindow)
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainWindow = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.viarotel.escrcpy')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
})