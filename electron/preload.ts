import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('closeclaw', {
  llm: {
    getStatus: (): Promise<{ status: string; error: string | null }> =>
      ipcRenderer.invoke('llm:getStatus'),

    downloadModel: (): Promise<void> =>
      ipcRenderer.invoke('llm:downloadModel'),

    loadModel: (): Promise<void> =>
      ipcRenderer.invoke('llm:loadModel'),

    prompt: (message: string): Promise<string> =>
      ipcRenderer.invoke('llm:prompt', message),

    resetChat: (): Promise<void> =>
      ipcRenderer.invoke('llm:resetChat'),

    onToken: (callback: (token: string) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, token: string) => callback(token)
      ipcRenderer.on('llm:token', handler)
      return () => {
        ipcRenderer.removeListener('llm:token', handler)
      }
    },

    onDownloadProgress: (callback: (progress: number) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: number) => callback(progress)
      ipcRenderer.on('llm:downloadProgress', handler)
      return () => {
        ipcRenderer.removeListener('llm:downloadProgress', handler)
      }
    },
  },

  updater: {
    check: (): Promise<void> =>
      ipcRenderer.invoke('updater:check'),

    download: (): Promise<void> =>
      ipcRenderer.invoke('updater:download'),

    install: (): Promise<void> =>
      ipcRenderer.invoke('updater:install'),

    onUpdateAvailable: (callback: (info: { version: string; releaseNotes?: string }) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, info: { version: string; releaseNotes?: string }) => callback(info)
      ipcRenderer.on('updater:available', handler)
      return () => {
        ipcRenderer.removeListener('updater:available', handler)
      }
    },

    onDownloadProgress: (callback: (progress: { percent: number }) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: { percent: number }) => callback(progress)
      ipcRenderer.on('updater:downloadProgress', handler)
      return () => {
        ipcRenderer.removeListener('updater:downloadProgress', handler)
      }
    },

    onUpdateDownloaded: (callback: () => void): (() => void) => {
      const handler = () => callback()
      ipcRenderer.on('updater:downloaded', handler)
      return () => {
        ipcRenderer.removeListener('updater:downloaded', handler)
      }
    },
  },
})
