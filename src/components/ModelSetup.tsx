import { useState, useEffect, useCallback } from 'react'
import './ModelSetup.css'

interface ModelSetupProps {
  onReady: () => void
}

function ModelSetup({ onReady }: ModelSetupProps) {
  const [status, setStatus] = useState<string>('checking')
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const loadModel = useCallback(async () => {
    setStatus('loading')
    try {
      await window.closeclaw.llm.loadModel()
      onReady()
    } catch (err: any) {
      setError(err.message || 'Failed to load model')
      setStatus('error')
    }
  }, [onReady])

  const checkStatus = useCallback(async () => {
    const result = await window.closeclaw.llm.getStatus()
    setStatus(result.status)

    if (result.status === 'downloaded') {
      await loadModel()
    } else if (result.status === 'ready') {
      onReady()
    } else if (result.status === 'error') {
      setError(result.error)
    }
  }, [loadModel, onReady])

  useEffect(() => {
    checkStatus()

    const cleanup = window.closeclaw.llm.onDownloadProgress((p: number) => {
      setProgress(p)
    })

    return cleanup
  }, [checkStatus])

  const handleDownload = async () => {
    setStatus('downloading')
    setError(null)
    setProgress(0)
    try {
      await window.closeclaw.llm.downloadModel()
      await loadModel()
    } catch (err: any) {
      setError(err.message || 'Download failed')
      setStatus('error')
    }
  }

  return (
    <div className="model-setup">
      <div className="setup-card">
        <div className="setup-icon">C</div>
        <h1>Closeclaw</h1>
        <p className="subtitle">AI Assistant for your Mac</p>

        {status === 'checking' && (
          <p className="status-text">Checking model status...</p>
        )}

        {status === 'not-downloaded' && (
          <div className="setup-action">
            <p>Download the AI model to get started.</p>
            <p className="model-info">
              Phi-3 Mini (Q4) &mdash; ~2.3 GB
              <br />
              Optimized for Apple M1 with Metal acceleration
            </p>
            <button onClick={handleDownload} className="download-btn">
              Download Model
            </button>
          </div>
        )}

        {status === 'downloading' && (
          <div className="setup-action">
            <p className="status-text">Downloading model...</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="progress-text">{progress}%</p>
          </div>
        )}

        {status === 'loading' && (
          <div className="setup-action">
            <p className="status-text">Loading model into memory...</p>
            <div className="spinner" />
          </div>
        )}

        {status === 'error' && (
          <div className="setup-action">
            <p className="error-text">Error: {error}</p>
            <button onClick={handleDownload} className="download-btn retry">
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelSetup
