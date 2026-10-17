import { useRef, useState } from 'react'
import { Camera, Plus, X, Loader2 } from 'lucide-react'
import { compressImage } from '@/lib/image-compress'

interface PhotoPickerProps {
  photos: { file: File; preview: string }[]
  onChange: (photos: { file: File; preview: string }[]) => void
  max?: number
}

/** เลือกรูป 0-6: ไม่มีรูป = ปุ่มใหญ่, มีรูปแล้ว = grid + ปุ่มเพิ่ม */
export function PhotoPicker({ photos, onChange, max = 6 }: PhotoPickerProps) {
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

  const canAdd = photos.length < max

  return (
    <div>
      {photos.length === 0 ? (
        /* ยังไม่มีรูป — ปุ่มใหญ่อันเดียว */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={compressing}
          className="w-full h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          {compressing ? (
            <><Loader2 className="size-5 animate-spin" /> กำลังบีบอัด...</>
          ) : (
            <><Camera className="size-5" /> ถ่ายรูปหรือเลือกจากอัลบั้ม</>
          )}
        </button>
      ) : (
        /* มีรูปแล้ว — grid thumbnail + ปุ่มเพิ่ม */
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <div key={i} className="relative shrink-0 size-20">
              <img
                src={photo.preview}
                alt={`รูป ${i + 1}`}
                className="size-full object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -top-1.5 -right-1.5 size-5 bg-foreground text-background rounded-full flex items-center justify-center"
                aria-label={`ลบรูป ${i + 1}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {canAdd && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={compressing}
              className="shrink-0 size-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              {compressing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <><Plus className="size-5" /><span className="text-[10px]">{photos.length}/{max}</span></>
              )}
            </button>
          )}
        </div>
      )}

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
