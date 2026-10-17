import { useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface GPSButtonProps {
  lat: number | null
  lng: number | null
  onLocation: (lat: number, lng: number, accuracy?: number) => void
}

export function GPSButton({ lat, onLocation }: GPSButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function getLocation() {
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ไม่รองรับ GPS')
      return
    }

    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy)
        setLoading(false)
      },
      (err) => {
        setLoading(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('กรุณาอนุญาตการเข้าถึงตำแหน่ง — ไปที่ตั้งค่า > แอป LINE > ตำแหน่ง')
            break
          case err.POSITION_UNAVAILABLE:
            setError('ไม่สามารถหาตำแหน่งได้ — ลองเปิด GPS แล้วกดอีกครั้ง')
            break
          case err.TIMEOUT:
            setError('หมดเวลา — ลองอีกครั้งในที่โล่ง')
            break
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const hasLocation = lat !== null

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={getLocation}
        disabled={loading}
        className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
          hasLocation
            ? 'bg-success-soft text-success-ink border border-success/30'
            : 'border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/50'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            กำลังค้นหาตำแหน่ง...
          </>
        ) : hasLocation ? (
          <>
            <MapPin className="size-4" />
            ได้ตำแหน่งแล้ว — แตะเพื่อปักใหม่
          </>
        ) : (
          <>
            <MapPin className="size-4" />
            ปักตำแหน่งหน้างาน
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-danger-ink bg-danger-soft rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  )
}
