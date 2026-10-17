import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { compressImage } from '@/lib/image-compress'

interface PhotoPickerProps {
  photos: { file: File; preview: string }[]
  onChange: (photos: { file: File; preview: string }[]) => void
  max?: number
}

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

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {photos.map((photo, i) => (
          <div key={i} className="relative w-20 h-20">
            <img
              src={photo.preview}
              alt={`รูป ${i + 1}`}
              className="w-full h-full object-cover rounded-md border"
            />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center"
            >
              x
            </button>
          </div>
        ))}

        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={compressing}
            className="w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center text-muted-foreground text-2xl hover:bg-muted/50 transition-colors"
          >
            {compressing ? '...' : '+'}
          </button>
        )}
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

      {photos.length === 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={compressing}
          className="w-full"
        >
          {compressing ? 'กำลังบีบอัดรูป...' : 'ถ่ายรูป / เลือกรูป (สูงสุด 3 รูป)'}
        </Button>
      )}
    </div>
  )
}
