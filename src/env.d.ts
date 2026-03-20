/// <reference types="vite/client" />

interface CloseclawAPI {
  llm: {
    getStatus: () => Promise<{ status: string; error: string | null }>
    downloadModel: () => Promise<void>
    loadModel: () => Promise<void>
    prompt: (message: string) => Promise<string>
    resetChat: () => Promise<void>
    onToken: (callback: (token: string) => void) => () => void
    onDownloadProgress: (callback: (progress: number) => void) => () => void
  }
  updater: {
    check: () => Promise<void>
    download: () => Promise<void>
    install: () => Promise<void>
    onUpdateAvailable: (callback: (info: { version: string; releaseNotes?: string }) => void) => () => void
    onDownloadProgress: (callback: (progress: { percent: number }) => void) => () => void
    onUpdateDownloaded: (callback: () => void) => () => void
  }
}

declare global {
  interface Window {
    closeclaw: CloseclawAPI
  }
}
