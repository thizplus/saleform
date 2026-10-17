import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { compressImage } from '@/lib/image-compress'

interface PhotoPickerProps {
  photos: { file: File; preview: string }[]
  onChange: (photos: { file: File; preview: string }[]) => void
  max?: number
}

/** 3 ช่องสี่เหลี่ยมแตะ = เปิดกล้อง */
export function PhotoPicker({ photos, onChange, max = 3 }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [compressing, setCompressing] = useState(false)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setCompressing(true)
    try {
      const remaining = max - photos.length
      const toProcess = files.slice(0, remaining)

      const newPhotos = await Promise.all(
        toProcess.map(async (file) => {
          const compressed = await compressImage(file)
          return {
            file: compressed,
            preview: URL.createObjectURL(compressed),
          }
        })
      )

      onChange([...photos, ...newPhotos])
    } finally {
      setCompressing(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photos[index].preview)
    onChange(photos.filter((_, i) => i !== index))
  }

  const slots = Array.from({ length: max }, (_, i) => photos[i] || null)

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((photo, i) => (
          <div key={i} className="relative aspect-square">
            {photo ? (
              <>
                <img
                  src={photo.preview}
                  alt={`รูป ${i + 1}`}
                  className="size-full object-cover rounded-xl border"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 size-6 bg-foreground text-background rounded-full flex items-center justify-center"
                  aria-label={`ลบรูป ${i + 1}`}
                >
                  <X className="size-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={compressing}
                className="size-full rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <Camera className="size-6" />
                {compressing && i === photos.length ? (
                  <span className="text-xs">บีบอัด...</span>
                ) : null}
              </button>
            )}
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  )
}
