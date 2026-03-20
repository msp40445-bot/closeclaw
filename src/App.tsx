import { useState, useEffect } from 'react'
import ChatView from './components/ChatView'
import UpdateBanner from './components/UpdateBanner'
import ModelSetup from './components/ModelSetup'

type AppState = 'setup' | 'chat'

function App() {
  const [appState, setAppState] = useState<AppState>('setup')
  const [updateInfo, setUpdateInfo] = useState<{ version: string; releaseNotes?: string } | null>(null)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)

  useEffect(() => {
    window.closeclaw.llm.getStatus().then((result) => {
      if (result.status === 'ready') {
        setAppState('chat')
      }
    })

    const cleanupAvailable = window.closeclaw.updater.onUpdateAvailable((info) => {
      setUpdateInfo(info)
    })

    const cleanupDownloaded = window.closeclaw.updater.onUpdateDownloaded(() => {
      setUpdateDownloaded(true)
    })

    return () => {
      cleanupAvailable()
      cleanupDownloaded()
    }
  }, [])

  const handleModelReady = () => {
    setAppState('chat')
  }

  const handleUpdate = () => {
    if (updateDownloaded) {
      window.closeclaw.updater.install()
    } else {
      window.closeclaw.updater.download()
    }
  }

  return (
    <div className="app">
      {updateInfo && (
        <UpdateBanner
          version={updateInfo.version}
          downloaded={updateDownloaded}
          onUpdate={handleUpdate}
          onDismiss={() => setUpdateInfo(null)}
        />
      )}
      {appState === 'setup' ? (
        <ModelSetup onReady={handleModelReady} />
      ) : (
        <ChatView />
      )}
    </div>
  )
}

export default App
