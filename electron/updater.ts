import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'

let win: BrowserWindow | null = null

export function initUpdater(mainWindow: BrowserWindow) {
  win = mainWindow

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    win?.webContents.send('updater:available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    win?.webContents.send('updater:downloadProgress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  autoUpdater.on('update-downloaded', () => {
    win?.webContents.send('updater:downloaded')
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err.message)
  })

  // Check for updates on launch (with a small delay to let the window load)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 3000)

  // Check for updates every 30 minutes
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 30 * 60 * 1000)
}

export function downloadUpdate() {
  autoUpdater.downloadUpdate()
}

export function installUpdate() {
  autoUpdater.quitAndInstall(false, true)
}
