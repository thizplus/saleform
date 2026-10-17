import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

interface PhotoLightboxProps {
  photos: { id: string; thumbUrl: string; fullUrl: string }[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

export function PhotoLightbox({ photos, initialIndex = 0, open, onClose }: PhotoLightboxProps) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={initialIndex}
      slides={photos.map((p) => ({ src: p.fullUrl }))}
    />
  )
}
