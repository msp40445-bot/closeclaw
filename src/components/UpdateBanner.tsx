import './UpdateBanner.css'

interface UpdateBannerProps {
  version: string
  downloaded: boolean
  onUpdate: () => void
  onDismiss: () => void
}

function UpdateBanner({ version, downloaded, onUpdate, onDismiss }: UpdateBannerProps) {
  return (
    <div className="update-banner">
      <span className="update-text">
        {downloaded
          ? `Update v${version} is ready to install`
          : `Update available: v${version}`}
      </span>
      <div className="update-actions">
        <button onClick={onUpdate} className="update-btn">
          {downloaded ? 'Restart & Update' : 'Download Update'}
        </button>
        <button onClick={onDismiss} className="dismiss-btn">
          Later
        </button>
      </div>
    </div>
  )
}

export default UpdateBanner
