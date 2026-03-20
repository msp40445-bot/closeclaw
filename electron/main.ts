import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import { initUpdater, downloadUpdate, installUpdate } from './updater'
import { LLMEngine } from './llm-engine'

let mainWindow: BrowserWindow | null = null
let llmEngine: LLMEngine | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    backgroundColor: '#1a1a2e',
    show: false,
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function setupIPC() {
  llmEngine = new LLMEngine()

  ipcMain.handle('llm:getStatus', () => {
    return llmEngine!.getStatus()
  })

  ipcMain.handle('llm:downloadModel', async () => {
    await llmEngine!.downloadModel((progress: number) => {
      mainWindow?.webContents.send('llm:downloadProgress', progress)
    })
  })

  ipcMain.handle('llm:loadModel', async () => {
    await llmEngine!.loadModel()
  })

  ipcMain.handle('llm:prompt', async (_event, message: string) => {
    return llmEngine!.prompt(message, (token: string) => {
      mainWindow?.webContents.send('llm:token', token)
    })
  })

  ipcMain.handle('llm:resetChat', async () => {
    await llmEngine!.resetChat()
  })

  ipcMain.handle('updater:check', () => {
    autoUpdater.checkForUpdates().catch(() => {})
  })

  ipcMain.handle('updater:download', () => {
    downloadUpdate()
  })

  ipcMain.handle('updater:install', () => {
    installUpdate()
  })
}

app.whenReady().then(() => {
  createWindow()
  setupIPC()

  if (mainWindow) {
    initUpdater(mainWindow)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
